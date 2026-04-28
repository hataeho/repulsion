#!/usr/bin/env python3
# ============================================================================
# scale_service.py  V2.2 (마스터본)
# 최종 수정일: 2026-03-29
# ============================================================================
#
# [시스템 개요]
#   라즈베리파이 기반 출하 저울(FS-4300) 중계 서버.
#   저울 → 라즈베리(입력) → 3구간 오프셋 보정 → 외부 전광판(출력) + 웹 UI + JSON TCP
#
# [하드웨어 설정 (현장 검증 완료 2026-03-29)]
#   ┌──────────────────────────────────────────────────────────────┐
#   │ 장비            │ 모델              │ 연결                   │
#   ├──────────────────────────────────────────────────────────────┤
#   │ 저울 계기판     │ FS-4300           │ RS-232C → 라즈베리     │
#   │ 외부 전광판     │ FINE UER 1.9      │ 라즈베리 → RS-232C     │
#   │ 라즈베리파이    │ Raspberry Pi      │ 192.168.0.250          │
#   └──────────────────────────────────────────────────────────────┘
#
# [RS-232C 포트 매핑 (하드코딩)]
#   ┌──────────┬──────────────┬────────────┬───────────┬──────────┐
#   │ 물리포트 │ 리눅스 장치  │ 용도       │ Baud Rate │ 프로토콜 │
#   ├──────────┼──────────────┼────────────┼───────────┼──────────┤
#   │ Port 4   │ /dev/ttyUSB0 │ 입력(저울) │ 9600      │ ASCII    │
#   │          │ /dev/tty232_0│ (대체)     │ 9600      │ ASCII    │
#   │ Port 5   │ /dev/tty232_1│ 출력(전광) │ 9600      │ CAS 호환 │
#   └──────────┴──────────────┴────────────┴───────────┴──────────┘
#
# [전광판 통신 프로토콜 (CAS 호환 22바이트)]
#   포맷: "ST,GS,{부호}{무게6자리} kg\r\n"
#   예시: "ST,GS,+  2115 kg\r\n"
#   - 9600 Baud, 8N1, No Flow Control
#   - 0.5초 간격 스트림 전송
#
# [네트워크 서비스]
#   - HTTP  80   : 3구간 공차 설정 웹 UI (브라우저 접속용)
#   - TCP 13450  : JSON 프로토콜 (키오스크/DISPATCH 서버 연동)
#
# [주의사항]
#   - observer.out (사료빈 프로그램)은 2026-03-29 영구 삭제됨. 절대 복구 금지.
#   - 입력 포트는 리부팅 시 ttyUSB0 또는 tty232_0으로 바뀔 수 있어 순회 탐색함.
#   - 출력 포트는 반드시 /dev/tty232_1 단일 포트로 고정 (전광판 물리 연결 확인됨).
# ============================================================================

import serial
import json
import socket
import threading
import time
import re
import os
from http.server import BaseHTTPRequestHandler, HTTPServer

# =========================
# 하드코딩 상수 (절대 변경 금지)
# =========================
INPUT_PORTS = ['/dev/ttyUSB0', '/dev/tty232_0']  # 저울(FS-4300) 입력 포트 후보
OUTPUT_PORT = '/dev/tty232_1'                     # 전광판(FINE UER 1.9) 출력 포트
BAUD_RATE   = 9600                                # 입출력 공통 통신 속도
DISPLAY_FMT = "ST,GS,{sign}{weight:>6} kg\r\n"   # CAS 호환 전광판 프로토콜

CONFIG_FILE = '/home/pi/scale_config.json'

config = {
    "offset_low": 0,
    "offset_mid": 0,
    "offset_high": 0,
    "min_val": 7000,
    "max_val": 9000
}

def load_config():
    global config
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                saved = json.load(f)
                config.update(saved)
        except Exception as e:
            print("Config load error:", e)

def save_config():
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f)
    except Exception as e:
        print("Config save error:", e)

load_config()

raw_weight = 0.0
current_weight = 0.0
current_zone = "미장착"

# ==========================================
# Web Server (Port 80) V2.2
# ==========================================
HTML_TEMPLATE = '''<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>라즈베리 저울 3구간 설정</title>
    <style>
        :root { --primary: #0077b6; --bg: #f8f9fa; --text: #2b2d42; --surface: #ffffff; --border: #e9ecef; }
        * { box-sizing: border-box; font-family: 'Segoe UI', system-ui, sans-serif; }
        body { background: var(--bg); color: var(--text); padding: 15px; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; margin: 0; }
        .card { background: var(--surface); padding: 25px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); width: 100%; max-width: 550px; border: 1px solid var(--border); }
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid var(--bg); padding-bottom: 15px; }
        .header h1 { font-size: 20px; margin: 0; color: #1d3557; font-weight: 700; display: flex; align-items: center; gap: 8px;}
        .realtime-box { background: #f1faee; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px; border: 2px dashed #a8dadc; position: relative;}
        .zone-badge { position: absolute; top: 10px; right: 10px; background: #e63946; color: white; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .realtime-val { font-size: 40px; font-weight: 900; color: #1d3557; font-feature-settings: "tnum"; margin: 10px 0;}
        .label { font-size: 13px; font-weight: 700; margin-bottom: 6px; color: #457b9d; display: block; }
        .zone-grid { display: grid; grid-template-columns: 1fr; gap: 15px; margin-bottom: 25px; }
        .zone-card { background: #fafafa; border: 1px solid var(--border); border-radius: 10px; padding: 15px; border-left: 4px solid #a8dadc;}
        .input-wrapper { display: flex; gap: 8px; }
        input[type="number"] { flex: 1; padding: 10px 12px; border: 1px solid #ced4da; border-radius: 8px; font-size: 16px; background: #fff; font-weight: 600; text-align: center; }
        input[type="number"]:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(0, 119, 182, 0.1); }
        .btn-adj { background: #e9ecef; border: none; font-size: 20px; font-weight: bold; width: 44px; border-radius: 8px; cursor: pointer; color: #495057; transition: 0.1s; }
        .btn-adj:active { transform: scale(0.95); }
        .btn-save { background: var(--primary); color: white; border: none; padding: 16px; width: 100%; border-radius: 10px; font-size: 18px; font-weight: bold; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 10px rgba(0, 119, 182, 0.3); }
        .btn-save:hover { filter: brightness(1.1); transform: translateY(-2px); }
        .toast { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: #1d3557; color: white; padding: 12px 24px; border-radius: 30px; display: none; font-weight: 600; z-index: 100; box-shadow: 0 4px 15px rgba(0,0,0,0.2);}
        .active-zone-anim { border-color: #e63946 !important; background: #fff0f1; border-left: 4px solid #e63946 !important;}
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1>&#x1F353; 라즈베리 - 3구간 공차 설정 (서버 V2.2)</h1>
            <span style="font-size:12px; background:#e6394620; padding:4px 8px; border-radius:30px; color:#e63946; font-weight:bold;">LIVE</span>
        </div>
        <div class="realtime-box">
            <div id="liveZoneBadge" class="zone-badge">구간 판별중...</div>
            <span class="label">최종 출력 (원본 + 적용된 범위 오프셋)</span>
            <div class="realtime-val" id="liveWeight">--- kg</div>
            <div style="font-size:13px; color:#6c757d; font-weight:600;">원본 저울값: <span id="liveRaw">---</span> kg</div>
        </div>
        <form id="configForm">
            <div style="display:flex; gap:10px; margin-bottom:20px; background:#e9ecef; padding:15px; border-radius:10px;">
                <div style="flex:1;">
                    <label style="font-size:12px; font-weight:bold; color:#495057;">경계 1: 하한선(kg)</label>
                    <input type="number" id="min_val" value="{MIN_VAL}" step="1" style="width:100%;">
                </div>
                <div style="flex:1;">
                    <label style="font-size:12px; font-weight:bold; color:#495057;">경계 2: 상한선(kg)</label>
                    <input type="number" id="max_val" value="{MAX_VAL}" step="1" style="width:100%;">
                </div>
            </div>
            <div class="zone-grid">
                <div class="zone-card" id="zCardLow">
                    <label class="label">&#x25b6; 하한선 미만 가감 (- 무한 ~ 하한)</label>
                    <div class="input-wrapper">
                        <button type="button" class="btn-adj" onclick="adj('offset_low', -10)">-</button>
                        <input type="number" id="offset_low" value="{OFFSET_LOW}" step="1">
                        <button type="button" class="btn-adj" onclick="adj('offset_low', 10)">+</button>
                    </div>
                </div>
                <div class="zone-card" id="zCardMid">
                    <label class="label">&#x25b6; 범위 이내 가감 (하한 ~ 상한)</label>
                    <div class="input-wrapper">
                        <button type="button" class="btn-adj" onclick="adj('offset_mid', -10)">-</button>
                        <input type="number" id="offset_mid" value="{OFFSET_MID}" step="1">
                        <button type="button" class="btn-adj" onclick="adj('offset_mid', 10)">+</button>
                    </div>
                </div>
                <div class="zone-card" id="zCardHigh">
                    <label class="label">&#x25b6; 상한선 초과 가감 (상한 ~ + 무한)</label>
                    <div class="input-wrapper">
                        <button type="button" class="btn-adj" onclick="adj('offset_high', -10)">-</button>
                        <input type="number" id="offset_high" value="{OFFSET_HIGH}" step="1">
                        <button type="button" class="btn-adj" onclick="adj('offset_high', 10)">+</button>
                    </div>
                </div>
            </div>
            <button type="submit" class="btn-save">전체 구간 설정 저장</button>
        </form>
    </div>
    <div id="toast" class="toast">저장되었습니다!</div>
    <script>
        function adj(id, val) {
            const el = document.getElementById(id);
            el.value = parseInt(el.value || 0) + val;
        }
        document.getElementById('configForm').onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.querySelector('.btn-save');
            btn.innerText = '저장 중...';
            const data = {
                offset_low: parseInt(document.getElementById('offset_low').value),
                offset_mid: parseInt(document.getElementById('offset_mid').value),
                offset_high: parseInt(document.getElementById('offset_high').value),
                min_val: parseInt(document.getElementById('min_val').value),
                max_val: parseInt(document.getElementById('max_val').value)
            };
            try {
                const res = await fetch('/api/settings', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                });
                if(res.ok) {
                    const t = document.getElementById('toast');
                    t.style.display = 'block';
                    setTimeout(() => t.style.display = 'none', 3000);
                }
            } catch(err) { alert('저장 통신 실패!'); }
            finally { btn.innerText = '전체 구간 설정 저장'; }
        };
        setInterval(async () => {
            try {
                const res = await fetch('/api/status');
                const data = await res.json();
                document.getElementById('liveRaw').innerText = data.raw.toFixed(1);
                document.getElementById('liveWeight').innerText = data.current.toFixed(1) + ' kg';
                const badge = document.getElementById('liveZoneBadge');
                badge.innerText = '현재 적용 중: ' + data.zone;
                document.getElementById('zCardLow').classList.remove('active-zone-anim');
                document.getElementById('zCardMid').classList.remove('active-zone-anim');
                document.getElementById('zCardHigh').classList.remove('active-zone-anim');
                if (data.zone === '하한 미만') {
                    document.getElementById('zCardLow').classList.add('active-zone-anim');
                    badge.style.background = "#e63946";
                } else if (data.zone === '구간 이내 (공차)') {
                    document.getElementById('zCardMid').classList.add('active-zone-anim');
                    badge.style.background = "#2a9d8f";
                } else if (data.zone === '상한 초과 (총중량)') {
                    document.getElementById('zCardHigh').classList.add('active-zone-anim');
                    badge.style.background = "#f4a261";
                }
            } catch(e) {}
        }, 1000);
    </script>
</body>
</html>'''

class ConfigHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            o_low = config.get("offset_low", config.get("offset", 0))
            o_mid = config.get("offset_mid", config.get("offset", 0))
            o_high = config.get("offset_high", config.get("offset", 0))
            m_min = config.get("min_val", 7000)
            m_max = config.get("max_val", 9000)
            html = HTML_TEMPLATE.replace('{OFFSET_LOW}', str(o_low)) \
                                .replace('{OFFSET_MID}', str(o_mid)) \
                                .replace('{OFFSET_HIGH}', str(o_high)) \
                                .replace('{MIN_VAL}', str(m_min)) \
                                .replace('{MAX_VAL}', str(m_max))
            self.wfile.write(html.encode('utf-8'))
        elif self.path == '/api/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            res = json.dumps({"raw": raw_weight, "current": current_weight, "zone": current_zone})
            self.wfile.write(res.encode('utf-8'))
        else:
            self.send_error(404)

    def do_POST(self):
        global config
        if self.path == '/api/settings':
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                body = self.rfile.read(content_length).decode('utf-8')
                try:
                    data = json.loads(body)
                    if 'offset_low' in data: config['offset_low'] = int(data['offset_low'])
                    if 'offset_mid' in data: config['offset_mid'] = int(data['offset_mid'])
                    if 'offset_high' in data: config['offset_high'] = int(data['offset_high'])
                    if 'min_val' in data: config['min_val'] = int(data['min_val'])
                    if 'max_val' in data: config['max_val'] = int(data['max_val'])
                    save_config()
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(b'{"status":"ok"}')
                    return
                except Exception as e:
                    print("POST Parse Error:", e)
            self.send_error(400)
        else:
            self.send_error(404)

    def log_message(self, format, *args):
        pass  # 로그 스팸 방지

def web_server_loop():
    try:
        server = HTTPServer(('0.0.0.0', 80), ConfigHandler)
        print("Web Server listening on port 80...")
        server.serve_forever()
    except Exception as e:
        print("Web Server Error:", e)

# ==========================================
# Scale Logic
# 입력: FS-4300 저울 (RS-232C Port 4, 9600 Baud)
# 출력: FINE UER 1.9 전광판 (RS-232C Port 5, 9600 Baud, CAS 호환)
# ==========================================
def read_serial_loop():
    global raw_weight, current_weight, current_zone

    # [입력 포트] FS-4300 저울 데이터 수신 (리부팅 시 장치명 변동 대비 순회 탐색)
    ser_in = None
    input_port_name = ""
    for p in INPUT_PORTS:  # 상수: ['/dev/ttyUSB0', '/dev/tty232_0']
        try:
            ser_in = serial.Serial(p, BAUD_RATE, timeout=1)  # 상수: 9600 Baud
            input_port_name = p
            print(f"Connected for INPUT: {p} at {BAUD_RATE} Baud")
            break
        except Exception:
            pass

    # [출력 포트] 외부 전광판 단일 포트 (FINE UER 1.9, CAS 호환 프로토콜)
    ser_out = None
    if input_port_name != OUTPUT_PORT:  # 상수: '/dev/tty232_1' (입출력 포트 충돌 방지)
        try:
            ser_out = serial.Serial(OUTPUT_PORT, BAUD_RATE, timeout=1)  # 상수: 9600 Baud
            print(f"Connected for OUTPUT: {OUTPUT_PORT} at {BAUD_RATE} Baud")
        except Exception:
            pass

    if not ser_in:
        print("FATAL: Failed to open INPUT serial port. Tried:", INPUT_PORTS)
        return

    pattern = re.compile(r'[-+]?\d*\.?\d+')  # FS-4300 원시 데이터 파싱용 정규식
    last_sent_time = 0

    while True:
        try:
            line = ser_in.readline()
            if line:
                text = line.decode('ascii', errors='ignore').strip().replace(' ', '')
                matches = pattern.findall(text)
                if matches:
                    try:
                        val = float(matches[-1])
                        if abs(val) < 100000:
                            raw_weight = val
                            min_th = float(config.get("min_val", 7000))
                            max_th = float(config.get("max_val", 9000))
                            if raw_weight < min_th:
                                o_val = float(config.get("offset_low", 0))
                                current_zone = "하한 미만"
                            elif raw_weight <= max_th:
                                o_val = float(config.get("offset_mid", 0))
                                current_zone = "구간 이내 (공차)"
                            else:
                                o_val = float(config.get("offset_high", 0))
                                current_zone = "상한 초과 (총중량)"
                            current_weight = raw_weight + o_val
                    except ValueError:
                        pass

            # [전광판 스트림 발사] 0.5초 간격으로 CAS 호환 22바이트 패킷 전송
            now = time.time()
            if now - last_sent_time > 0.5:
                if ser_out:
                    try:
                        int_weight = int(current_weight)
                        sign_str = '+' if int_weight >= 0 else '-'
                        abs_weight = abs(int_weight)
                        # DISPLAY_FMT 상수: "ST,GS,{sign}{weight:>6} kg\r\n"
                        # 예: "ST,GS,+  2115 kg\r\n" (FINE UER 1.9 전광판 검증 완료)
                        out_str = DISPLAY_FMT.format(sign=sign_str, weight=abs_weight)
                        ser_out.write(out_str.encode('ascii'))
                    except Exception:
                        pass
                last_sent_time = now
        except Exception:
            time.sleep(1)

# ==========================================
# JSON TCP Server (Port 13450)
# ==========================================
def listen_loop():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind(('0.0.0.0', 13450))
    s.listen(5)
    print("JSON Server listening on 13450...")
    while True:
        try:
            conn, addr = s.accept()
            data = conn.recv(4096)
            if data:
                try:
                    req = json.loads(data.decode('utf-8', errors='ignore'))
                    if req.get("job") == "232":
                        resp = {
                            "direction": "response",
                            "errno": 0,
                            "errtxt": "",
                            "job": "232",
                            "protocol": "ms",
                            "rs232": [{
                                "max": config.get("max_val", 9000),
                                "min": config.get("min_val", 7000),
                                "name": "FS-4300",
                                "portno": 1,
                                "unit": 4,
                                "value": current_weight
                            }]
                        }
                        conn.sendall(json.dumps(resp).encode('utf-8'))
                except json.JSONDecodeError:
                    pass
            conn.close()
        except Exception:
            time.sleep(0.1)

if __name__ == '__main__':
    t1 = threading.Thread(target=read_serial_loop, daemon=True)
    t1.start()
    t2 = threading.Thread(target=listen_loop, daemon=True)
    t2.start()
    web_server_loop()

import time
import json
import threading
import socket
from pymodbus.client import ModbusSerialClient
from http.server import BaseHTTPRequestHandler, HTTPServer

# ==========================================
# 라즈베리 파이 단독 실행용: 12대 사료빈 Modbus RTU 마스터 & Web API 서버
# (기존 scale_service.py 와 충돌하지 않도록 독립 구동)
# ==========================================

# 통신 설정 (현장 상황에 맞게 포트/보드레이트 변경 필요)
RS485_PORT = '/dev/ttyUSB0'  # 예시: USB to RS485 젠더 사용시
BAUDRATE = 9600
HTTP_PORT = 15020  # 기존 80번이나 13450과 겹치지 않는 포트 사용

# 12대 사료빈 Slave ID 번호 (가정: 1~12번 또는 241~252번 등)
# 현장 설정에 맞추어 수정하세요.
SLAVE_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

# 글로벌 메모리 맵 (수집된 12대 분의 데이터 저장)
# 형태: { slave_id: {"weight": 0.0, "connected": False, "last_updated": 0} }
feed_bin_data = {sid: {"weight": 0.0, "connected": False, "last_updated": 0} for sid in SLAVE_IDS}

# --- 1. Modbus RTU 폴링 스레드 ---
def modbus_polling_loop():
    client = ModbusSerialClient(
        port=RS485_PORT,
        baudrate=BAUDRATE,
        parity='N',
        stopbits=1,
        bytesize=8,
        timeout=0.5
    )
    
    print(f"Modbus RTU Master 시작... 포트: {RS485_PORT}")
    
    while True:
        if not client.connect():
            print(f"포트 {RS485_PORT} 열기 실패. 3초 대기...")
            time.sleep(3)
            continue
            
        for slave_id in SLAVE_IDS:
            try:
                # Holding Register 0번 번지에서 2개의 워드를 읽음 (Float32 추정)
                # 실제 장비의 통신 레지스터 맵에 따라 변경 필요
                response = client.read_holding_registers(address=0, count=2, slave=slave_id)
                
                if not response.isError():
                    registers = response.registers
                    # 2개 워드를 Float 타입으로 변환 (인디케이터 제조사마다 바이트 오더 다름 유의)
                    # 여기서는 일단 Raw 16bit 값의 단순 합이나 상위/하위 조합 중 하나라고 간주
                    # 엄밀한 복원은 struct.unpack 등을 사용해야 함.
                    import struct
                    # AB CD (Big Endian) / CD AB / DC BA / BA DC 여부에 따라 변환
                    b_str = struct.pack('>HH', registers[0], registers[1])
                    weight = struct.unpack('>f', b_str)[0]
                    
                    feed_bin_data[slave_id]["weight"] = round(weight, 2)
                    feed_bin_data[slave_id]["connected"] = True
                    feed_bin_data[slave_id]["last_updated"] = time.time()
                else:
                    feed_bin_data[slave_id]["connected"] = False
            except Exception as e:
                feed_bin_data[slave_id]["connected"] = False
                
            time.sleep(0.1) # 각 장비간 통신 숨고르기
        
        # 12대 폴링 1사이클 끝난 후 1초 대기 (네트워크 부하 방지)
        time.sleep(1.0)


# --- 2. 대시보드 연동용 JSON API 서버 (HTTP) ---
class FeedBinAPIHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/feedbins':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            # 대시보드가 원하는 형태로 JSON 패키징
            response_data = []
            for i, sid in enumerate(SLAVE_IDS):
                bin_info = feed_bin_data[sid]
                response_data.append({
                    "id": i + 1,
                    "slave_id": sid,
                    "connected": bin_info["connected"],
                    "weight": bin_info["weight"]
                })
                
            self.wfile.write(json.dumps({"status": "ok", "data": response_data}).encode('utf-8'))
        else:
            self.send_error(404)
            
    # 로깅 끄기 (터미널 도배 방지)
    def log_message(self, format, *args):
        pass

def api_server_loop():
    server = HTTPServer(('0.0.0.0', HTTP_PORT), FeedBinAPIHandler)
    print(f"Feed Bin API Server listening on port {HTTP_PORT}...")
    server.serve_forever()

if __name__ == "__main__":
    t1 = threading.Thread(target=modbus_polling_loop, daemon=True)
    t1.start()
    
    api_server_loop()

import time
import json
import threading
import struct
from pymodbus.client import ModbusTcpClient
from http.server import BaseHTTPRequestHandler, HTTPServer

# ==========================================
# 라즈베리 파이 단독 실행용: 12대 사료빈 Modbus TCP 마스터 & Web API 서버
# (기존 scale_service.py 와 충돌하지 않도록 독립 구동)
# ==========================================

HTTP_PORT = 15020  # 기존 80번이나 13450과 겹치지 않는 포트 사용

# 12대 사료빈 IP 리스트 (192.168.0.241 ~ 252)
SCALE_IPS = [f"192.168.0.{241 + i}" for i in range(12)]
MODBUS_PORT = 502

# 글로벌 메모리 맵 (수집된 12대 분의 데이터 저장)
# 형태: { index: {"ip": "", "weight": 0.0, "connected": False, "last_updated": 0} }
feed_bin_data = {
    i: {"ip": ip, "weight": 0.0, "connected": False, "last_updated": 0}
    for i, ip in enumerate(SCALE_IPS)
}

# --- 1. Modbus TCP 폴링 스레드 ---
def modbus_polling_loop():
    print("Modbus TCP Master 시작...")
    
    while True:
        for idx, target_ip in enumerate(SCALE_IPS):
            client = ModbusTcpClient(target_ip, port=MODBUS_PORT, timeout=0.5)
            try:
                if client.connect():
                    # Holding Register 0번 번지에서 2개의 워드를 읽음 (Float32 또는 Int32 추정)
                    # 현장 장비 특성에 맞추어 추후 보정 가능
                    response = client.read_holding_registers(address=0, count=2, slave=1)
                    
                    if not response.isError():
                        registers = response.registers
                        # Float 변환 추정: 만약 단순 Int라면 value = (registers[0] << 16) | registers[1]
                        b_str = struct.pack('>HH', registers[0], registers[1])
                        try:
                            weight = struct.unpack('>f', b_str)[0]
                        except:
                            weight = (registers[0] << 16) | registers[1]
                        
                        feed_bin_data[idx]["weight"] = round(weight, 2)
                        feed_bin_data[idx]["connected"] = True
                        feed_bin_data[idx]["last_updated"] = time.time()
                    else:
                        feed_bin_data[idx]["connected"] = False
                else:
                    feed_bin_data[idx]["connected"] = False
            except Exception as e:
                feed_bin_data[idx]["connected"] = False
            finally:
                client.close()
                
            time.sleep(0.05) # 각 장비간 통신 숨고르기
        
        # 12대 폴링 1사이클 끝난 후 1초 대기
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
            for idx, target_ip in enumerate(SCALE_IPS):
                bin_info = feed_bin_data[idx]
                response_data.append({
                    "id": idx + 1,
                    "slave_id": target_ip.split('.')[-1], # IP 끝자리를 slave_id처럼 취급
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

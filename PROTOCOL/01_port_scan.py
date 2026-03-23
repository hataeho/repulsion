"""
=============================================================
 Step 1: 포트 스캐너
 192.168.0.150의 열린 TCP 포트를 모두 찾아냅니다.
 Usage: python 01_port_scan.py
=============================================================
"""
import socket
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

TARGET = "192.168.0.150"
PORT_RANGE = (1, 65535)       # 전체 포트 스캔
TIMEOUT = 0.3                 # 초 (너무 길면 느려짐)
MAX_THREADS = 500             # 동시 스캔 스레드 수

def scan_port(host, port):
    """단일 포트 연결 시도"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(TIMEOUT)
            result = s.connect_ex((host, port))
            if result == 0:
                # 서비스 이름 추측
                try:
                    service = socket.getservbyport(port, 'tcp')
                except OSError:
                    service = "unknown"
                return (port, service)
    except Exception:
        pass
    return None

def main():
    print("=" * 60)
    print(f"  TCP 포트 스캐너 - 대상: {TARGET}")
    print(f"  포트 범위: {PORT_RANGE[0]} ~ {PORT_RANGE[1]}")
    print(f"  시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print()

    open_ports = []

    with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
        futures = {
            executor.submit(scan_port, TARGET, port): port
            for port in range(PORT_RANGE[0], PORT_RANGE[1] + 1)
        }

        scanned = 0
        total = PORT_RANGE[1] - PORT_RANGE[0] + 1

        for future in as_completed(futures):
            scanned += 1
            if scanned % 5000 == 0 or scanned == total:
                pct = (scanned / total) * 100
                print(f"\r  진행: {scanned}/{total} ({pct:.1f}%)", end="", flush=True)

            result = future.result()
            if result:
                port, service = result
                open_ports.append((port, service))
                print(f"\n  [발견] 포트 {port:>5} 열림 ({service})")

    open_ports.sort(key=lambda x: x[0])

    print("\n")
    print("=" * 60)
    print(f"  스캔 완료! 열린 포트: {len(open_ports)}개")
    print("=" * 60)

    if open_ports:
        print(f"\n  {'포트':>6}  {'서비스':<20}  설명")
        print(f"  {'─'*6}  {'─'*20}  {'─'*30}")

        KNOWN_PORTS = {
            22: "SSH",
            80: "HTTP 웹서버",
            443: "HTTPS",
            502: "Modbus TCP (표준)",
            503: "Modbus TCP (대체)",
            4001: "시리얼→TCP (일반적)",
            4002: "시리얼→TCP (2번째)",
            5000: "Flask/API 서버",
            8080: "HTTP 대체",
            8088: "HTTP 대체",
            9100: "Raw TCP 프린터",
        }

        for port, service in open_ports:
            desc = KNOWN_PORTS.get(port, "")
            if 4000 <= port <= 4100:
                desc = desc or "시리얼→TCP 변환 가능성 높음 ★"
            elif port == 502:
                desc = "Modbus TCP ★"
            print(f"  {port:>6}  {service:<20}  {desc}")

        # 결과를 파일로 저장
        with open("scan_result.txt", "w", encoding="utf-8") as f:
            f.write(f"스캔 대상: {TARGET}\n")
            f.write(f"스캔 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"열린 포트 수: {len(open_ports)}\n\n")
            for port, service in open_ports:
                desc = KNOWN_PORTS.get(port, "")
                f.write(f"포트 {port:>5} ({service}) - {desc}\n")

        print(f"\n  결과 저장됨: scan_result.txt")
        print(f"\n  ★ 다음 단계: python 02_capture.py 로 데이터 캡처 시작")
    else:
        print("\n  열린 포트가 없습니다. 네트워크 연결을 확인하세요.")
        print(f"  - ping {TARGET} 으로 호스트 확인")

if __name__ == "__main__":
    main()

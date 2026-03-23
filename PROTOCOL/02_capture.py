"""
=============================================================
 Step 2: 멀티포트 데이터 캡처
 열린 모든 포트에 동시 연결하여 수신 데이터를 로깅합니다.
 
 Usage: 
   python 02_capture.py                      # scan_result.txt에서 포트 자동 로드
   python 02_capture.py 502 4001 4002        # 수동으로 포트 지정
   python 02_capture.py --duration 60        # 60초간 캡처
=============================================================
"""
import socket
import sys
import os
import threading
import time
import argparse
from datetime import datetime

TARGET = "192.168.0.150"
RECV_SIZE = 4096
DEFAULT_DURATION = 120  # 기본 2분 캡처

# 로그 디렉토리
LOG_DIR = "captures"
os.makedirs(LOG_DIR, exist_ok=True)

# 콘솔 출력 동기화
print_lock = threading.Lock()
capture_data = {}  # port -> list of (timestamp, raw_bytes)


def hex_dump(data, prefix=""):
    """바이트 데이터를 HEX + ASCII 덤프로 변환"""
    lines = []
    for i in range(0, len(data), 16):
        chunk = data[i:i+16]
        hex_part = " ".join(f"{b:02X}" for b in chunk)
        hex_part = f"{hex_part:<48}"
        ascii_part = "".join(chr(b) if 32 <= b < 127 else "." for b in chunk)
        lines.append(f"{prefix}{i:04X}  {hex_part}  |{ascii_part}|")
    return "\n".join(lines)


def detect_protocol(data):
    """수신 데이터의 프로토콜을 추정"""
    if len(data) < 2:
        return "TOO_SHORT"

    # Modbus TCP 검사: Transaction ID(2) + Protocol ID(2, 항상 0x0000) + Length(2) + Unit(1) + FC(1)
    if len(data) >= 8:
        proto_id = (data[2] << 8) | data[3]
        length = (data[4] << 8) | data[5]
        if proto_id == 0x0000 and length == len(data) - 6:
            fc = data[7]
            return f"MODBUS_TCP (FC={fc})"

    # ASCII 텍스트 기반 (저울 데이터에 흔함)
    printable_count = sum(1 for b in data if 32 <= b < 127 or b in (10, 13))
    if printable_count / len(data) > 0.8:
        text = data.decode('ascii', errors='replace').strip()
        # 저울 특유의 패턴들
        if any(c in text for c in ['kg', 'KG', 'Kg']):
            return f"SCALE_ASCII (kg 단위 포함)"
        if any(c in text for c in ['g', 'G', 'lb', 'LB']):
            return f"SCALE_ASCII (무게 단위 가능)"
        # 숫자 위주의 ASCII
        digit_count = sum(1 for c in text if c.isdigit() or c in '.+-')
        if len(text) > 0 and digit_count / len(text) > 0.5:
            return f"ASCII_NUMERIC"
        return "ASCII_TEXT"

    # STX/ETX 프레이밍
    if data[0] == 0x02:  # STX
        return "STX_FRAMED"
    
    # Raw binary
    return "BINARY_UNKNOWN"


def capture_port(host, port, duration, stop_event):
    """특정 포트에서 데이터 캡처"""
    timestamp_str = datetime.now().strftime('%Y%m%d_%H%M%S')
    log_file = os.path.join(LOG_DIR, f"port_{port}_{timestamp_str}.log")
    raw_file = os.path.join(LOG_DIR, f"port_{port}_{timestamp_str}.bin")
    
    capture_data[port] = []
    packet_count = 0

    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        sock.connect((host, port))
        sock.settimeout(1)  # 수신 대기 타임아웃

        with print_lock:
            print(f"  [port {port}] [OK] Connected! Waiting for data...")

        with open(log_file, 'w', encoding='utf-8') as lf, \
             open(raw_file, 'wb') as rf:

            lf.write(f"캡처 시작: {datetime.now().isoformat()}\n")
            lf.write(f"대상: {host}:{port}\n")
            lf.write("=" * 70 + "\n\n")

            start_time = time.time()

            while not stop_event.is_set():
                if time.time() - start_time > duration:
                    break

                try:
                    data = sock.recv(RECV_SIZE)
                    if not data:
                        with print_lock:
                            print(f"  [port {port}] Connection closed")
                        break

                    now = datetime.now()
                    packet_count += 1
                    elapsed = time.time() - start_time

                    # 프로토콜 감지
                    proto = detect_protocol(data)

                    # 메모리에 저장 (분석용)
                    capture_data[port].append((now, data, proto))

                    # Raw 파일에 기록
                    rf.write(data)
                    rf.flush()

                    # 로그 파일에 기록
                    lf.write(f"--- 패킷 #{packet_count} | {now.strftime('%H:%M:%S.%f')[:-3]} | "
                             f"{elapsed:.1f}s | {len(data)}바이트 | {proto} ---\n")
                    lf.write(hex_dump(data, "  ") + "\n")

                    # ASCII 가독 가능한 경우 텍스트도 기록
                    try:
                        text = data.decode('ascii', errors='replace')
                        lf.write(f"  TEXT: {repr(text)}\n")
                    except:
                        pass
                    lf.write("\n")
                    lf.flush()

                    # 콘솔 출력
                    with print_lock:
                        short_hex = " ".join(f"{b:02X}" for b in data[:20])
                        if len(data) > 20:
                            short_hex += f" ... (+{len(data)-20})"
                        print(f"  [port {port}] #{packet_count:>4} | {len(data):>4}B | "
                              f"{proto:<25} | {short_hex}")

                except socket.timeout:
                    continue
                except Exception as e:
                    with print_lock:
                        print(f"  [port {port}] Recv error: {e}")
                    break

        with print_lock:
            print(f"  [port {port}] Capture done. {packet_count} packets")
            print(f"            log: {log_file}")
            print(f"            raw: {raw_file}")

    except socket.timeout:
        with print_lock:
            print(f"  [port {port}] [X] Connection timeout")
    except ConnectionRefusedError:
        with print_lock:
            print(f"  [port {port}] [X] Connection refused")
    except Exception as e:
        with print_lock:
            print(f"  [port {port}] [X] Error: {e}")
    finally:
        try:
            sock.close()
        except:
            pass


def load_ports_from_scan():
    """scan_result.txt에서 포트 목록 로드"""
    ports = []
    try:
        with open("scan_result.txt", "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("포트"):
                    parts = line.split()
                    if len(parts) >= 2:
                        try:
                            ports.append(int(parts[1]))
                        except ValueError:
                            pass
    except FileNotFoundError:
        pass
    return ports


def main():
    parser = argparse.ArgumentParser(description="TCP 멀티포트 데이터 캡처")
    parser.add_argument("ports", nargs="*", type=int, help="캡처할 포트 번호들")
    parser.add_argument("--duration", "-d", type=int, default=DEFAULT_DURATION,
                        help=f"캡처 시간(초), 기본 {DEFAULT_DURATION}초")
    parser.add_argument("--host", default=TARGET, help=f"대상 호스트, 기본 {TARGET}")
    args = parser.parse_args()

    ports = args.ports if args.ports else load_ports_from_scan()

    if not ports:
        print("  캡처할 포트가 없습니다!")
        print("  사용법:")
        print("    python 02_capture.py 502 4001 4002")
        print("    또는 먼저 python 01_port_scan.py 를 실행하세요.")
        sys.exit(1)

    print("=" * 70)
    print(f"  TCP 데이터 캡처 - 대상: {args.host}")
    print(f"  포트: {', '.join(str(p) for p in ports)}")
    print(f"  캡처 시간: {args.duration}초")
    print(f"  시작: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  종료: Ctrl+C 또는 {args.duration}초 후 자동 종료")
    print("=" * 70)
    print()

    stop_event = threading.Event()
    threads = []

    for port in ports:
        t = threading.Thread(target=capture_port,
                             args=(args.host, port, args.duration, stop_event),
                             daemon=True)
        threads.append(t)
        t.start()
        time.sleep(0.1)  # 연결 순서 보장

    try:
        # 메인 스레드 대기
        start = time.time()
        while time.time() - start < args.duration:
            time.sleep(1)
            remaining = int(args.duration - (time.time() - start))
            if remaining > 0 and remaining % 10 == 0:
                total_packets = sum(len(v) for v in capture_data.values())
                with print_lock:
                    print(f"\n  [T] Remaining: {remaining}s | Total packets: {total_packets}\n")
    except KeyboardInterrupt:
        print("\n\n  Ctrl+C 감지. 캡처 중단...")

    stop_event.set()
    for t in threads:
        t.join(timeout=3)

    # 요약 출력
    print("\n" + "=" * 70)
    print("  캡처 요약")
    print("=" * 70)

    for port in ports:
        packets = capture_data.get(port, [])
        if packets:
            total_bytes = sum(len(p[1]) for p in packets)
            protocols = {}
            for _, _, proto in packets:
                protocols[proto] = protocols.get(proto, 0) + 1

            print(f"\n  [포트 {port}]")
            print(f"    패킷 수: {len(packets)}")
            print(f"    총 바이트: {total_bytes}")
            print(f"    프로토콜:")
            for proto, count in sorted(protocols.items(), key=lambda x: -x[1]):
                print(f"      - {proto}: {count}개")
        else:
            print(f"\n  [포트 {port}] 수신 데이터 없음")

    print(f"\n  캡처 파일 위치: {os.path.abspath(LOG_DIR)}/")
    print(f"\n  [*] Next: python 03_analyze.py")


if __name__ == "__main__":
    main()

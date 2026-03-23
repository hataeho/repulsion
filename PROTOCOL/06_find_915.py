"""
=============================================================
 Step 6: 라즈베리파이에서 "915" 값 찾기
 
 192.168.0.250 (라즈베리파이)의 열린 포트를 스캔하고,
 각 포트에서 수신되는 데이터에서 "915" 값을 찾습니다.
 TCP + UDP 모두 확인합니다.

 Usage:
   python 06_find_915.py                # 전체 자동 스캔
   python 06_find_915.py --ports 502 4001 8080  # 특정 포트만
=============================================================
"""
import socket
import sys
import os
import time
import struct
import threading
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

TARGET = "192.168.0.250"
TIMEOUT = 0.5
MAX_THREADS = 300
LOG_DIR = "captures"
os.makedirs(LOG_DIR, exist_ok=True)

print_lock = threading.Lock()
found_results = []  # (port, protocol, method, data_text, raw_bytes)


# ──────────────────────────────────────────
#  Phase 1: TCP 포트 스캔
# ──────────────────────────────────────────
def scan_tcp_port(host, port):
    """TCP 포트 열림 확인"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(TIMEOUT)
            result = s.connect_ex((host, port))
            if result == 0:
                try:
                    service = socket.getservbyport(port, 'tcp')
                except OSError:
                    service = "unknown"
                return (port, service)
    except Exception:
        pass
    return None


def scan_tcp(host, port_range=(1, 65535)):
    """TCP 전체 포트 스캔"""
    print(f"\n{'='*60}")
    print(f"  [Phase 1] TCP 포트 스캔 - {host}")
    print(f"  범위: {port_range[0]} ~ {port_range[1]}")
    print(f"{'='*60}\n")

    open_ports = []
    with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
        futures = {
            executor.submit(scan_tcp_port, host, port): port
            for port in range(port_range[0], port_range[1] + 1)
        }
        scanned = 0
        total = port_range[1] - port_range[0] + 1

        for future in as_completed(futures):
            scanned += 1
            if scanned % 5000 == 0 or scanned == total:
                pct = (scanned / total) * 100
                print(f"\r  진행: {scanned}/{total} ({pct:.1f}%)", end="", flush=True)
            result = future.result()
            if result:
                port, service = result
                open_ports.append((port, service))
                print(f"\n  [TCP 열림] 포트 {port:>5} ({service})")

    open_ports.sort(key=lambda x: x[0])
    print(f"\n\n  TCP 열린 포트: {len(open_ports)}개")
    return open_ports


# ──────────────────────────────────────────
#  Phase 2: UDP 주요 포트 스캔
# ──────────────────────────────────────────
def scan_udp_port(host, port):
    """UDP 포트 응답 확인 (빈 패킷 또는 프로브 전송)"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.settimeout(1.0)
            # 빈 패킷 전송
            s.sendto(b'\x00', (host, port))
            try:
                data, addr = s.recvfrom(4096)
                if data:
                    return (port, data)
            except socket.timeout:
                pass
            # 한번 더 시도 (CR/LF)
            s.sendto(b'\r\n', (host, port))
            try:
                data, addr = s.recvfrom(4096)
                if data:
                    return (port, data)
            except socket.timeout:
                pass
    except Exception:
        pass
    return None


def scan_udp(host, ports=None):
    """UDP 주요 포트 스캔"""
    if ports is None:
        # 일반적인 IoT/산업용 UDP 포트
        ports = list(range(1, 1025)) + [
            4001, 4002, 4003, 5000, 5001,
            8080, 8088, 9010, 9020,
            10000, 10001, 18001, 18002,
            19000, 25000, 502, 503,
            161,  # SNMP
            1883, # MQTT (보통 TCP지만)
            5353, # mDNS
            67, 68, 69,  # DHCP, TFTP
        ]
        ports = sorted(set(ports))

    print(f"\n{'='*60}")
    print(f"  [Phase 2] UDP 포트 스캔 - {host}")
    print(f"  대상 포트 수: {len(ports)}개")
    print(f"{'='*60}\n")

    udp_responses = []
    with ThreadPoolExecutor(max_workers=50) as executor:
        futures = {
            executor.submit(scan_udp_port, host, port): port
            for port in ports
        }
        for future in as_completed(futures):
            result = future.result()
            if result:
                port, data = result
                hex_str = " ".join(f"{b:02X}" for b in data[:30])
                print(f"  [UDP 응답] 포트 {port:>5}: {hex_str}")
                udp_responses.append(result)

                # 즉시 915 확인
                check_for_915(port, "UDP", "passive_response", data)

    print(f"\n  UDP 응답 포트: {len(udp_responses)}개")
    return udp_responses


# ──────────────────────────────────────────
#  Phase 3: 각 TCP 포트에서 데이터 수신 + 프로브
# ──────────────────────────────────────────
def check_for_915(port, protocol, method, data):
    """데이터에서 915 값 찾기 (다양한 형식)"""
    found = False
    details = []

    # 1. ASCII 텍스트에서 "915" 문자열 검색
    try:
        text = data.decode('ascii', errors='replace')
        if '915' in text:
            found = True
            details.append(f"ASCII 텍스트에서 '915' 발견: {repr(text.strip()[:200])}")
    except:
        pass

    # 2. Modbus 레지스터 값에서 915 검색
    if len(data) >= 9:
        try:
            proto_id = (data[2] << 8) | data[3]
            if proto_id == 0x0000:  # Modbus TCP
                fc = data[7]
                if fc in (3, 4) and len(data) > 8:
                    byte_count = data[8]
                    for j in range(9, 9 + byte_count, 2):
                        if j + 1 < len(data):
                            val = (data[j] << 8) | data[j+1]
                            if val == 915:
                                found = True
                                details.append(f"Modbus 레지스터 값으로 915 발견 (FC={fc})")
        except:
            pass

    # 3. 2바이트 빅엔디안/리틀엔디안으로 915 검색
    target_be = struct.pack('>H', 915)   # 0x03 0x93
    target_le = struct.pack('<H', 915)   # 0x93 0x03
    if target_be in data:
        found = True
        pos = data.index(target_be)
        details.append(f"빅엔디안 2바이트(0x0393)로 915 발견 (offset {pos})")
    if target_le in data:
        found = True
        pos = data.index(target_le)
        details.append(f"리틀엔디안 2바이트(0x9303)로 915 발견 (offset {pos})")

    # 4. 4바이트 정수로 915 검색
    target_32be = struct.pack('>I', 915)
    target_32le = struct.pack('<I', 915)
    if target_32be in data:
        found = True
        details.append(f"빅엔디안 4바이트 정수로 915 발견")
    if target_32le in data:
        found = True
        details.append(f"리틀엔디안 4바이트 정수로 915 발견")

    # 5. float로 915.0 검색
    target_float_be = struct.pack('>f', 915.0)
    target_float_le = struct.pack('<f', 915.0)
    if target_float_be in data:
        found = True
        details.append(f"빅엔디안 float로 915.0 발견")
    if target_float_le in data:
        found = True
        details.append(f"리틀엔디안 float로 915.0 발견")

    if found:
        hex_str = " ".join(f"{b:02X}" for b in data[:60])
        for d in details:
            with print_lock:
                print(f"\n  ★★★ [발견!] 포트 {port} ({protocol}/{method}) ★★★")
                print(f"      {d}")
                print(f"      HEX: {hex_str}")
        found_results.append({
            'port': port,
            'protocol': protocol,
            'method': method,
            'details': details,
            'raw': data,
            'hex': hex_str,
        })

    return found


def probe_tcp_port(host, port, listen_duration=5):
    """TCP 포트에 연결하여 데이터 수신 + 다양한 프로브 전송"""
    # ─── A) 패시브 리슨 (연결만 하고 데이터 기다리기) ───
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(3)
        sock.connect((host, port))
        sock.settimeout(1)

        all_data = b''
        start = time.time()
        while time.time() - start < listen_duration:
            try:
                data = sock.recv(4096)
                if not data:
                    break
                all_data += data
            except socket.timeout:
                continue
        sock.close()

        if all_data:
            with print_lock:
                hex_s = " ".join(f"{b:02X}" for b in all_data[:40])
                print(f"  [TCP {port}] 패시브 수신: {len(all_data)}B | {hex_s}")
            check_for_915(port, "TCP", "passive_listen", all_data)

    except Exception as e:
        pass

    # ─── B) 액티브 프로브 (명령 전송 후 응답 확인) ───
    probes = [
        (b'\r\n', "CR/LF"),
        (b'\r', "CR"),
        (b'P\r\n', "Print(P)"),
        (b'S\r\n', "Status(S)"),
        (b'W\r\n', "Weight(W)"),
        (b'SI\r\n', "SI"),
        (b'?\r\n', "Query(?)"),
        (b'\x05', "ENQ"),
    ]

    for cmd, name in probes:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(3)
            sock.connect((host, port))
            sock.send(cmd)
            time.sleep(0.3)

            resp = b''
            try:
                while True:
                    chunk = sock.recv(4096)
                    if not chunk:
                        break
                    resp += chunk
            except socket.timeout:
                pass
            sock.close()

            if resp:
                check_for_915(port, "TCP", f"probe_{name}", resp)
        except:
            pass

    # ─── C) Modbus TCP 프로브 ───
    for unit_id in [1, 2, 255]:
        for fc in [3, 4]:
            for start_reg in [0, 1, 100, 200, 400]:
                try:
                    pdu = struct.pack('>BHH', fc, start_reg, 10)
                    length = 1 + len(pdu)
                    mbap = struct.pack('>HHHB', 1, 0, length, unit_id)
                    req = mbap + pdu

                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(3)
                    sock.connect((host, port))
                    sock.send(req)
                    time.sleep(0.3)

                    resp = b''
                    try:
                        resp = sock.recv(4096)
                    except socket.timeout:
                        pass
                    sock.close()

                    if resp and len(resp) >= 9:
                        check_for_915(port, "TCP", f"modbus_UID{unit_id}_FC{fc}_R{start_reg}", resp)
                except:
                    pass


def main():
    parser = argparse.ArgumentParser(description="라즈베리파이에서 915 값 찾기")
    parser.add_argument("--ports", nargs="*", type=int, help="특정 TCP 포트만 프로브")
    parser.add_argument("--host", default=TARGET, help=f"대상 호스트 (기본: {TARGET})")
    parser.add_argument("--skip-scan", action="store_true", help="포트 스캔 건너뛰기")
    parser.add_argument("--udp", action="store_true", help="UDP 스캔도 수행")
    args = parser.parse_args()

    host = args.host
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    report_file = os.path.join(LOG_DIR, f"find_915_{timestamp}.txt")

    print("=" * 60)
    print(f"  ★ 915 값 탐색기 - 대상: {host}")
    print(f"  시작: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    tcp_ports = []

    # Phase 1: TCP 스캔
    if args.ports:
        tcp_ports = [(p, "specified") for p in args.ports]
        print(f"\n  지정된 포트: {args.ports}")
    elif not args.skip_scan:
        tcp_ports = scan_tcp(host)

    # Phase 2: UDP 스캔 (옵션)
    if args.udp:
        scan_udp(host)

    # Phase 3: 각 TCP 포트 프로브
    if tcp_ports:
        print(f"\n{'='*60}")
        print(f"  [Phase 3] TCP 포트별 데이터 수신 + 프로브")
        print(f"  대상 포트: {len(tcp_ports)}개")
        print(f"{'='*60}\n")

        for i, (port, service) in enumerate(tcp_ports):
            print(f"\n  --- [{i+1}/{len(tcp_ports)}] 포트 {port} ({service}) ---")
            probe_tcp_port(host, port, listen_duration=3)

    # === 결과 요약 ===
    print(f"\n\n{'='*60}")
    print(f"  ★★★ 최종 결과 ★★★")
    print(f"{'='*60}")

    if found_results:
        print(f"\n  915 값이 발견된 포트:")
        for r in found_results:
            print(f"\n  ▶ 포트 {r['port']} ({r['protocol']})")
            print(f"    전송 방식: {r['protocol']}")
            print(f"    발견 방법: {r['method']}")
            for d in r['details']:
                print(f"    상세: {d}")
            print(f"    HEX: {r['hex']}")
    else:
        print(f"\n  915 값을 찾지 못했습니다.")
        print(f"\n  가능한 원인:")
        print(f"    1. 라즈베리파이에서 현재 915를 전송하고 있지 않음")
        print(f"    2. 915가 다른 형식(예: 91.5, 9.15, 0915)으로 전송됨")
        print(f"    3. UDP로 전송 중일 수 있음 (--udp 옵션 추가)")
        print(f"    4. 데이터가 주기적으로만 전송됨 (더 긴 리슨 필요)")

    # 보고서 저장
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(f"915 값 탐색 보고서\n")
        f.write(f"대상: {host}\n")
        f.write(f"시간: {datetime.now().isoformat()}\n")
        f.write("=" * 60 + "\n\n")

        if found_results:
            f.write(f"발견된 포트: {len(found_results)}개\n\n")
            for r in found_results:
                f.write(f"포트 {r['port']} ({r['protocol']})\n")
                f.write(f"  방법: {r['method']}\n")
                for d in r['details']:
                    f.write(f"  상세: {d}\n")
                f.write(f"  HEX: {r['hex']}\n\n")
        else:
            f.write("915 값을 찾지 못함\n")

    print(f"\n  보고서: {os.path.abspath(report_file)}")
    print(f"  완료: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    main()

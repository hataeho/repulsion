"""
라즈베리파이(192.168.0.250) 발견된 모든 포트에서 915 값 빠르게 탐색
- 패시브 리슨 (연결 후 데이터 대기)
- Modbus TCP 프로브 (FC3, FC4)
- 시리얼 ASCII 프로브
"""
import socket, struct, sys, time

TARGET = "192.168.0.250"
PORTS = [22, 139, 445, 502, 5900, 7070, 7777, 13450, 13451]


def p(msg):
    print(msg, flush=True)


def check_915(data, port, method):
    """다양한 방식으로 915 검색"""
    found = []
    hex_s = " ".join(f"{b:02X}" for b in data[:60])

    # ASCII
    try:
        text = data.decode('ascii', errors='replace')
        if '915' in text:
            found.append(f"ASCII에서 '915' 발견: {repr(text.strip()[:100])}")
    except:
        pass

    # Modbus register
    if len(data) >= 9:
        try:
            pid = (data[2] << 8) | data[3]
            if pid == 0:
                fc = data[7]
                if fc in (3, 4) and len(data) > 8:
                    bc = data[8]
                    for j in range(9, 9 + bc, 2):
                        if j+1 < len(data):
                            val = (data[j] << 8) | data[j+1]
                            if val == 915:
                                found.append(f"Modbus reg=915 (FC{fc})")
        except:
            pass

    # Binary 915
    for fmt, name in [('>H', 'BE16'), ('<H', 'LE16'), ('>I', 'BE32'), ('<I', 'LE32')]:
        try:
            packed = struct.pack(fmt, 915)
            if packed in data:
                found.append(f"{name} 바이너리로 915 발견")
        except:
            pass

    # Float 915.0
    for fmt, name in [('>f', 'BE-float'), ('<f', 'LE-float')]:
        try:
            packed = struct.pack(fmt, 915.0)
            if packed in data:
                found.append(f"{name}로 915.0 발견")
        except:
            pass

    if found:
        p(f"\n  ★★★ 포트 {port} ({method}) 에서 915 발견!!! ★★★")
        for f in found:
            p(f"      → {f}")
        p(f"      HEX: {hex_s}")
    return found


def passive_listen(port, duration=5):
    """연결 후 데이터 대기"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(3)
        s.connect((TARGET, port))
        s.settimeout(1)
        all_data = b''
        start = time.time()
        while time.time() - start < duration:
            try:
                d = s.recv(4096)
                if not d: break
                all_data += d
            except socket.timeout:
                continue
        s.close()
        return all_data
    except Exception as e:
        p(f"    연결 실패: {e}")
        return b''


def modbus_probe(port):
    """Modbus TCP 레지스터 읽기"""
    results = []
    for uid in [1, 2, 255]:
        for fc in [3, 4]:
            for reg in [0, 1, 10, 40, 100, 200, 400, 500, 900, 910, 915, 1000]:
                try:
                    pdu = struct.pack('>BHH', fc, reg, 10)
                    length = 1 + len(pdu)
                    mbap = struct.pack('>HHHB', 1, 0, length, uid)
                    req = mbap + pdu

                    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    s.settimeout(2)
                    s.connect((TARGET, port))
                    s.send(req)
                    time.sleep(0.2)
                    try:
                        resp = s.recv(4096)
                    except socket.timeout:
                        resp = b''
                    s.close()

                    if resp and len(resp) >= 9:
                        pid = (resp[2] << 8) | resp[3]
                        if pid == 0:
                            rfc = resp[7]
                            if rfc == fc and len(resp) > 8:
                                bc = resp[8]
                                regs = []
                                for j in range(9, 9+bc, 2):
                                    if j+1 < len(resp):
                                        regs.append((resp[j] << 8) | resp[j+1])
                                p(f"    Modbus OK  UID={uid} FC={fc} Reg={reg}: {regs}")
                                results.append((uid, fc, reg, regs, resp))
                                check_915(resp, port, f"Modbus UID{uid} FC{fc} Reg{reg}")
                            elif rfc == fc + 0x80:
                                pass  # error response, skip
                except Exception:
                    pass
    return results


def serial_probe(port):
    """시리얼 ASCII 명령 전송"""
    cmds = [
        (b'\r\n', "CRLF"), (b'P\r\n', "P"), (b'S\r\n', "S"),
        (b'W\r\n', "W"), (b'?\r\n', "?"), (b'\x05', "ENQ"),
    ]
    for cmd, name in cmds:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(2)
            s.connect((TARGET, port))
            s.send(cmd)
            time.sleep(0.3)
            try:
                resp = s.recv(4096)
            except socket.timeout:
                resp = b''
            s.close()
            if resp:
                hex_s = " ".join(f"{b:02X}" for b in resp[:30])
                try:
                    txt = resp.decode('ascii', errors='replace').strip()
                    p(f"    cmd={name} → {repr(txt[:80])}  [{hex_s}]")
                except:
                    p(f"    cmd={name} → [{hex_s}]")
                check_915(resp, port, f"serial_{name}")
        except Exception:
            pass


def main():
    ports = [int(x) for x in sys.argv[1:]] if len(sys.argv) > 1 else PORTS

    p("=" * 60)
    p(f"  라즈베리파이 915 값 빠른 탐색")
    p(f"  대상: {TARGET}")
    p(f"  포트: {ports}")
    p("=" * 60)

    all_found = []

    for port in ports:
        p(f"\n{'─'*50}")
        p(f"  포트 {port} 탐색 중...")
        p(f"{'─'*50}")

        # 1. 패시브 리슨
        p(f"  [1] 패시브 리슨 (3초)...")
        data = passive_listen(port, 3)
        if data:
            hex_s = " ".join(f"{b:02X}" for b in data[:40])
            try:
                txt = data.decode('ascii', errors='replace').strip()
                p(f"    수신 {len(data)}B: {repr(txt[:100])}")
            except:
                p(f"    수신 {len(data)}B: {hex_s}")
            f = check_915(data, port, "passive")
            if f: all_found.extend([(port, "TCP", "passive", x) for x in f])
        else:
            p(f"    데이터 없음")

        # 2. Modbus (502 위주지만 다른 포트도 시도)
        if port in [502, 7070, 7777, 13450, 13451]:
            p(f"  [2] Modbus TCP 프로브...")
            mr = modbus_probe(port)
            for uid, fc, reg, regs, resp in mr:
                if 915 in regs:
                    all_found.append((port, "TCP", f"Modbus UID{uid} FC{fc} Reg{reg}", f"reg값에 915"))

        # 3. 시리얼 ASCII 프로브
        if port not in [22, 139, 445, 5900]:
            p(f"  [3] 시리얼 ASCII 프로브...")
            serial_probe(port)

    # 결과
    p(f"\n\n{'='*60}")
    p(f"  ★ 최종 결과 ★")
    p(f"{'='*60}")

    if all_found:
        p(f"\n  915 발견 포트:")
        for port, proto, method, detail in all_found:
            p(f"    ▶ 포트 {port} | {proto} | {method}")
            p(f"      {detail}")
    else:
        p(f"\n  915 값을 찾지 못했습니다.")
        p(f"  제안:")
        p(f"    1. 저울/센서에 물체를 올려 915가 표시되는 상태에서 재실행")
        p(f"    2. UDP 포트 확인: python 07_quick_probe.py --udp")
        p(f"    3. 13450, 13451 등 커스텀 포트에서 데이터 장시간 리슨")


if __name__ == "__main__":
    main()

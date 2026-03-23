"""
=============================================================
 Step 5: Modbus/Protocol Active Probe
 
 All ports accept connections but send 0 data passively.
 This script sends Modbus TCP requests and other protocol
 probes to each port and captures the responses.
 
 Also tries raw serial forwarding ports.
 
 Usage:
   python 05_probe.py                    # Probe all ports from scan
   python 05_probe.py 18001 18002 9010   # Specific ports
=============================================================
"""
import socket
import struct
import sys
import os
import time
from datetime import datetime

TARGET = "192.168.0.150"
TIMEOUT = 3
LOG_DIR = "captures"
os.makedirs(LOG_DIR, exist_ok=True)


def hex_str(data):
    return " ".join(f"{b:02X}" for b in data)


def build_modbus_request(unit_id, function_code, start_reg, count, transaction_id=1):
    """Build Modbus TCP request frame"""
    # MBAP Header: TID(2) + Proto(2, =0) + Length(2) + UnitID(1)
    # PDU: FC(1) + StartReg(2) + Count(2)
    pdu = struct.pack('>BHH', function_code, start_reg, count)
    length = 1 + len(pdu)  # UnitID + PDU
    mbap = struct.pack('>HHHB', transaction_id, 0, length, unit_id)
    return mbap + pdu


def send_recv(host, port, data, timeout=TIMEOUT):
    """Send data and receive response"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        sock.connect((host, port))
        sock.send(data)
        
        # Try to receive response
        time.sleep(0.3)
        responses = []
        try:
            while True:
                resp = sock.recv(4096)
                if not resp:
                    break
                responses.append(resp)
        except socket.timeout:
            pass
        
        sock.close()
        return b''.join(responses)
    except Exception as e:
        return None


def probe_modbus(host, port):
    """Try Modbus TCP requests on a port"""
    results = []
    
    # Try multiple unit IDs (1-5) and function codes
    for unit_id in [1, 2, 3, 255]:
        for fc, name in [(3, "Read Holding Regs"), (4, "Read Input Regs")]:
            for start_reg in [0, 1, 100, 200, 400]:
                req = build_modbus_request(unit_id, fc, start_reg, 10, transaction_id=1)
                resp = send_recv(host, port, req)
                
                if resp and len(resp) >= 9:
                    # Check if valid Modbus response
                    proto_id = (resp[2] << 8) | resp[3]
                    if proto_id == 0x0000:  # Valid Modbus
                        resp_fc = resp[7]
                        if resp_fc == fc:  # Normal response
                            byte_count = resp[8]
                            regs = []
                            for i in range(9, 9 + byte_count, 2):
                                if i + 1 < len(resp):
                                    val = (resp[i] << 8) | resp[i+1]
                                    regs.append(val)
                            results.append({
                                'unit_id': unit_id,
                                'fc': fc,
                                'fc_name': name,
                                'start_reg': start_reg,
                                'registers': regs,
                                'raw': resp,
                            })
                            print(f"    [MODBUS OK] UID={unit_id} FC={fc} Reg={start_reg}: {regs}")
                        elif resp_fc == fc + 0x80:  # Error response
                            error_code = resp[8] if len(resp) > 8 else -1
                            error_names = {
                                1: "ILLEGAL_FUNCTION",
                                2: "ILLEGAL_DATA_ADDRESS", 
                                3: "ILLEGAL_DATA_VALUE",
                                4: "SLAVE_DEVICE_FAILURE",
                            }
                            err_name = error_names.get(error_code, f"ERR_{error_code}")
                            results.append({
                                'unit_id': unit_id,
                                'fc': fc,
                                'fc_name': name,
                                'start_reg': start_reg,
                                'error': err_name,
                                'raw': resp,
                            })
                            # Only print if not "illegal address" (too noisy)
                            if error_code != 2:
                                print(f"    [MODBUS ERR] UID={unit_id} FC={fc} Reg={start_reg}: {err_name}")
                elif resp:
                    # Got non-Modbus response!
                    results.append({
                        'unit_id': unit_id,
                        'fc': fc,
                        'fc_name': name,
                        'start_reg': start_reg,
                        'non_modbus': True,
                        'raw': resp,
                    })
                    print(f"    [NON-MODBUS RESPONSE] {hex_str(resp[:40])}")
                    try:
                        text = resp.decode('ascii', errors='replace')
                        print(f"    [TEXT] {repr(text[:100])}")
                    except:
                        pass
    
    return results


def probe_serial_raw(host, port):
    """Try raw serial communication patterns"""
    results = []
    
    # Common scale commands
    commands = [
        (b'\r\n', "CR/LF"),
        (b'\r', "CR"),
        (b'\n', "LF"),
        (b'P\r\n', "Print command (P)"),
        (b'S\r\n', "Status command (S)"),
        (b'W\r\n', "Weight command (W)"),
        (b'SI\r\n', "SI command"),
        (b'SIR\r\n', "SIR command"),
        (b'IP\r\n', "IP (immediate print)"),
        (b'\x05', "ENQ"),
        (b'\x1BP\r\n', "ESC-P"),
        (b'?\r\n', "Query"),
        (b'READ\r\n', "READ"),
        (b'D\r\n', "Display command (D)"),
        (b'\x02\x30\x30\x52\x57\x03', "STX-framed read"),
        (b'\x02\x30\x30\x52\x44\x03', "STX-framed read data"),
    ]
    
    for cmd, name in commands:
        resp = send_recv(host, port, cmd, timeout=2)
        if resp and len(resp) > 0:
            results.append({
                'command': name,
                'command_bytes': cmd,
                'response': resp,
            })
            print(f"    [RESPONSE to {name}] {hex_str(resp[:40])}")
            try:
                text = resp.decode('ascii', errors='replace').strip()
                if text:
                    print(f"    [TEXT] {repr(text[:100])}")
            except:
                pass
    
    return results


def probe_passive_listen(host, port, duration=5):
    """Just connect and listen for any data pushed by server"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        sock.connect((host, port))
        sock.settimeout(1)
        
        all_data = b''
        start = time.time()
        while time.time() - start < duration:
            try:
                data = sock.recv(4096)
                if not data:
                    break
                all_data += data
            except socket.timeout:
                continue
        
        sock.close()
        return all_data
    except:
        return b''


def load_ports_from_scan():
    ports = []
    try:
        with open("scan_result.txt", "r", encoding="utf-8") as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 2:
                    try:
                        p = int(parts[1])
                        # Skip standard web/media ports
                        if p not in (80, 443, 554, 1935):
                            ports.append(p)
                    except ValueError:
                        pass
    except FileNotFoundError:
        pass
    return ports


def main():
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    report_file = os.path.join(LOG_DIR, f"probe_report_{timestamp}.txt")
    
    ports = [int(p) for p in sys.argv[1:]] if len(sys.argv) > 1 else load_ports_from_scan()
    
    if not ports:
        print("  No ports to probe!")
        sys.exit(1)
    
    print("=" * 70)
    print(f"  Active Protocol Probe - Target: {TARGET}")
    print(f"  Ports: {', '.join(str(p) for p in ports)}")
    print(f"  Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    all_results = {}
    
    for port in ports:
        print(f"\n{'='*50}")
        print(f"  Probing port {port}...")
        print(f"{'='*50}")
        
        port_results = {
            'modbus': [],
            'serial': [],
            'passive': b'',
        }
        
        # 1. Try Modbus first
        print(f"  [1/3] Modbus TCP probe...")
        modbus_results = probe_modbus(TARGET, port)
        port_results['modbus'] = modbus_results
        
        # 2. Try raw serial commands
        print(f"  [2/3] Serial command probe...")
        serial_results = probe_serial_raw(TARGET, port)
        port_results['serial'] = serial_results
        
        # 3. Passive listen
        print(f"  [3/3] Passive listen (5s)...")
        passive = probe_passive_listen(TARGET, port, 5)
        port_results['passive'] = passive
        if passive:
            print(f"    [PASSIVE DATA] {len(passive)} bytes: {hex_str(passive[:40])}")
        else:
            print(f"    [PASSIVE] No data")
        
        all_results[port] = port_results
    
    # === Summary ===
    print(f"\n{'='*70}")
    print(f"  PROBE SUMMARY")
    print(f"{'='*70}")
    
    scale_candidates = []
    modbus_ports = []
    
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(f"Probe Report - {datetime.now().isoformat()}\n")
        f.write(f"Target: {TARGET}\n")
        f.write("=" * 70 + "\n\n")
        
        for port, results in all_results.items():
            modbus_ok = [r for r in results['modbus'] if 'registers' in r]
            modbus_err = [r for r in results['modbus'] if 'error' in r]
            serial_ok = results['serial']
            passive = results['passive']
            
            status_parts = []
            if modbus_ok:
                status_parts.append(f"MODBUS({len(modbus_ok)} regs)")
                modbus_ports.append(port)
            if modbus_err:
                status_parts.append(f"MODBUS-ERR({len(modbus_err)})")
            if serial_ok:
                status_parts.append(f"SERIAL({len(serial_ok)} responses)")
                scale_candidates.append(port)
            if passive:
                status_parts.append(f"PASSIVE({len(passive)}B)")
            
            status = " | ".join(status_parts) if status_parts else "NO RESPONSE"
            print(f"  Port {port:>5}: {status}")
            
            f.write(f"\nPort {port}\n")
            f.write(f"  Status: {status}\n")
            
            for r in modbus_ok:
                f.write(f"  MODBUS UID={r['unit_id']} FC={r['fc']} "
                        f"Reg={r['start_reg']}: {r['registers']}\n")
                # Check if 915 appears
                if 915 in r['registers']:
                    print(f"    *** VALUE 915 FOUND in Modbus register! ***")
                    f.write(f"  *** VALUE 915 FOUND! ***\n")
            
            for r in serial_ok:
                f.write(f"  SERIAL [{r['command']}]: {hex_str(r['response'][:60])}\n")
                try:
                    text = r['response'].decode('ascii', errors='replace').strip()
                    f.write(f"    TEXT: {repr(text)}\n")
                    if '915' in text:
                        print(f"    *** VALUE 915 FOUND in serial response! ***")
                        f.write(f"  *** VALUE 915 FOUND! ***\n")
                except:
                    pass
            
            if passive:
                f.write(f"  PASSIVE: {hex_str(passive[:100])}\n")
    
    if modbus_ports:
        print(f"\n  Modbus active ports: {modbus_ports}")
    if scale_candidates:
        print(f"  Scale candidate ports (serial response): {scale_candidates}")
    
    print(f"\n  Report saved: {os.path.abspath(report_file)}")
    
    # If we found modbus, do a deep scan
    if modbus_ports:
        print(f"\n  [*] Modbus ports found! Run deep register scan:")
        print(f"      python 06_modbus_deep.py {' '.join(str(p) for p in modbus_ports)}")


if __name__ == "__main__":
    main()

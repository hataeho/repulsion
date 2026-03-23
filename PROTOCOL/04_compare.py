"""
=============================================================
 Step 4: 비교 분석 & 알려진 값 검색
 두 캡처를 비교하거나, 특정 값(예: 915)이 데이터에서
 어떤 형태로 인코딩되어 있는지 검색합니다.

 Usage:
   python 04_compare.py --search 915             # 모든 캡처에서 915 검색
   python 04_compare.py <file1.bin> <file2.bin>   # 두 캡처 비교
   python 04_compare.py --search 915 captures/port_4001_*.bin  # 특정 파일에서 검색
=============================================================
"""
import os
import sys
import struct
import glob
import argparse
from collections import Counter


def encode_value(value):
    """
    주어진 값이 바이너리에서 나타날 수 있는 모든 인코딩 형태를 생성
    예: 915 → ASCII "915", Big-endian 0x0393, Little-endian 0x9303,
        BCD 0x09 0x15, 스케일링 15 0x5A (9150/10) 등
    """
    encodings = {}

    # --- ASCII 인코딩 ---
    val_str = str(value)
    encodings[f"ASCII '{val_str}'"] = val_str.encode('ascii')
    # 공백 패딩
    encodings[f"ASCII 우측정렬 '  {val_str}'"] = f"{value:>6}".encode('ascii')
    encodings[f"ASCII 좌측정렬 '{val_str}  '"] = f"{value:<6}".encode('ascii')
    # 영점 패딩
    encodings[f"ASCII 영점패딩 '{value:06d}'"] = f"{value:06d}".encode('ascii')

    # --- 정수 바이너리 인코딩 ---
    int_val = int(value)
    # 16-bit
    if 0 <= int_val <= 65535:
        encodings[f"UINT16 BE (0x{int_val:04X})"] = struct.pack('>H', int_val)
        encodings[f"UINT16 LE (0x{int_val:04X})"] = struct.pack('<H', int_val)
    # 부호있는 16-bit
    if -32768 <= int_val <= 32767:
        encodings[f"INT16 BE"] = struct.pack('>h', int_val)
        encodings[f"INT16 LE"] = struct.pack('<h', int_val)
    # 32-bit
    if 0 <= int_val <= 0xFFFFFFFF:
        encodings[f"UINT32 BE"] = struct.pack('>I', int_val)
        encodings[f"UINT32 LE"] = struct.pack('<I', int_val)

    # --- 스케일링된 값 ---
    for scale_name, scaled in [
        ("x10", int(value * 10)),
        ("x100", int(value * 100)),
        ("/10", int(value / 10)) if value >= 10 else (None, None),
        ("/100", int(value / 100)) if value >= 100 else (None, None),
    ]:
        if scale_name is None:
            continue
        if 0 <= scaled <= 65535:
            encodings[f"UINT16 BE ({scale_name}={scaled})"] = struct.pack('>H', scaled)
            encodings[f"UINT16 LE ({scale_name}={scaled})"] = struct.pack('<H', scaled)

    # --- BCD 인코딩 ---
    try:
        bcd_bytes = []
        digits = val_str
        if len(digits) % 2:
            digits = '0' + digits
        for i in range(0, len(digits), 2):
            bcd_bytes.append(int(digits[i]) << 4 | int(digits[i+1]))
        encodings[f"BCD ({' '.join(f'{b:02X}' for b in bcd_bytes)})"] = bytes(bcd_bytes)
    except:
        pass

    # --- Float 인코딩 ---
    float_val = float(value)
    encodings[f"FLOAT32 BE ({float_val})"] = struct.pack('>f', float_val)
    encodings[f"FLOAT32 LE ({float_val})"] = struct.pack('<f', float_val)

    # 소수점 스케일링 float
    for div_name, div_val in [("값/10", float_val/10), ("값/100", float_val/100)]:
        encodings[f"FLOAT32 BE ({div_name}={div_val})"] = struct.pack('>f', div_val)
        encodings[f"FLOAT32 LE ({div_name}={div_val})"] = struct.pack('<f', div_val)

    return encodings


def search_in_data(raw, value, filename):
    """바이너리 데이터에서 값의 모든 인코딩 형태를 검색"""
    encodings = encode_value(value)
    found = []

    for enc_name, enc_bytes in encodings.items():
        # 모든 출현 위치 검색
        positions = []
        start = 0
        while True:
            pos = raw.find(enc_bytes, start)
            if pos == -1:
                break
            positions.append(pos)
            start = pos + 1

        if positions:
            found.append({
                'encoding': enc_name,
                'bytes': enc_bytes,
                'count': len(positions),
                'positions': positions[:20],  # 최대 20개 위치
            })

    return found


def print_search_results(value, filename, found_list, raw):
    """검색 결과 출력"""
    print(f"\n{'─'*70}")
    print(f"  파일: {filename}")
    print(f"  검색값: {value}")
    print(f"{'─'*70}")

    if not found_list:
        print(f"  ✗ 일치하는 인코딩 없음")
        return

    print(f"  ✓ {len(found_list)}개 인코딩 방식으로 발견!\n")

    for f in sorted(found_list, key=lambda x: -x['count']):
        hex_bytes = " ".join(f"{b:02X}" for b in f['bytes'])
        print(f"  [{f['count']:>3}회] {f['encoding']}")
        print(f"         바이트: {hex_bytes}")
        print(f"         위치:  {f['positions'][:10]}")

        # 첫 번째 출현 주변 컨텍스트 표시
        if f['positions']:
            pos = f['positions'][0]
            ctx_start = max(0, pos - 8)
            ctx_end = min(len(raw), pos + len(f['bytes']) + 8)
            context = raw[ctx_start:ctx_end]

            ctx_hex = []
            for i, b in enumerate(context):
                real_pos = ctx_start + i
                if pos <= real_pos < pos + len(f['bytes']):
                    ctx_hex.append(f"[{b:02X}]")  # 매칭 부분 강조
                else:
                    ctx_hex.append(f" {b:02X} ")
            print(f"         컨텍스트: {''.join(ctx_hex)}")

            # ASCII 컨텍스트
            ctx_ascii = ""
            for b in context:
                ctx_ascii += chr(b) if 32 <= b < 127 else "."
            print(f"         ASCII:    {ctx_ascii}")
        print()


def compare_captures(file1, file2):
    """두 캡처 파일을 비교하여 변화된 부분 추출"""
    with open(file1, 'rb') as f:
        data1 = f.read()
    with open(file2, 'rb') as f:
        data2 = f.read()

    print(f"\n{'='*70}")
    print(f"  캡처 비교")
    print(f"  파일1: {file1} ({len(data1):,} 바이트)")
    print(f"  파일2: {file2} ({len(data2):,} 바이트)")
    print(f"{'='*70}")

    # 바이트별 차이
    min_len = min(len(data1), len(data2))
    diff_positions = []
    for i in range(min_len):
        if data1[i] != data2[i]:
            diff_positions.append(i)

    print(f"\n  공통 길이: {min_len:,} 바이트")
    print(f"  차이 바이트 수: {len(diff_positions)}")

    if len(data1) != len(data2):
        print(f"  길이 차이: {abs(len(data1) - len(data2)):,} 바이트")

    if diff_positions:
        # 연속 구간으로 그룹화
        groups = []
        group_start = diff_positions[0]
        group_end = diff_positions[0]

        for pos in diff_positions[1:]:
            if pos <= group_end + 2:  # 2바이트 이내는 같은 그룹
                group_end = pos
            else:
                groups.append((group_start, group_end))
                group_start = pos
                group_end = pos
        groups.append((group_start, group_end))

        print(f"  차이 구간: {len(groups)}개\n")

        print(f"  {'오프셋':>10}  {'파일1':>20}  {'파일2':>20}  변화")
        print(f"  {'─'*10}  {'─'*20}  {'─'*20}  {'─'*20}")

        for start, end in groups[:30]:  # 최대 30개 구간
            ctx_start = max(0, start - 2)
            ctx_end = min(min_len, end + 3)

            hex1 = " ".join(f"{data1[i]:02X}" for i in range(ctx_start, ctx_end))
            hex2 = " ".join(f"{data2[i]:02X}" for i in range(ctx_start, ctx_end))

            # 값 변화 해석 시도
            change_desc = ""
            diff_len = end - start + 1
            if diff_len == 2 and start + 2 <= min_len:
                v1 = (data1[start] << 8) | data1[start+1]
                v2 = (data2[start] << 8) | data2[start+1]
                change_desc = f"BE: {v1}→{v2}"
                v1l = data1[start] | (data1[start+1] << 8)
                v2l = data2[start] | (data2[start+1] << 8)
                change_desc += f" / LE: {v1l}→{v2l}"

            print(f"  0x{start:08X}  {hex1:<20}  {hex2:<20}  {change_desc}")

    return diff_positions


def main():
    parser = argparse.ArgumentParser(description="캡처 데이터 비교 및 값 검색")
    parser.add_argument("files", nargs="*", help="캡처 파일들")
    parser.add_argument("--search", "-s", type=float, help="검색할 값 (예: 915)")
    args = parser.parse_args()

    files = args.files if args.files else sorted(glob.glob("captures/port_*.bin"))

    if not files:
        print("  파일이 없습니다. captures/ 폴더를 확인하세요.")
        sys.exit(1)

    # 값 검색 모드
    if args.search is not None:
        value = args.search
        print("=" * 70)
        print(f"  알려진 값 검색: {value}")
        print(f"  대상 파일: {len(files)}개")
        print("=" * 70)

        all_found = {}
        for filepath in files:
            with open(filepath, 'rb') as f:
                raw = f.read()
            if raw:
                found = search_in_data(raw, value, filepath)
                if found:
                    all_found[filepath] = found
                    print_search_results(value, filepath, found, raw)

        if not all_found:
            print(f"\n  ✗ 어떤 파일에서도 {value} 값을 찾을 수 없습니다.")
            print(f"    - 캡처 시점에 저울 값이 {value}이 맞았는지 확인하세요")
            print(f"    - 더 긴 시간 동안 캡처해 보세요")

        # 요약
        print(f"\n{'='*70}")
        print(f"  검색 요약: 값 {value}")
        print(f"{'='*70}")
        for filepath, found in all_found.items():
            port = os.path.basename(filepath).split('_')[1]
            total_hits = sum(f['count'] for f in found)
            print(f"  포트 {port}: {total_hits}회 발견 (인코딩 {len(found)}종류)")
            for f in sorted(found, key=lambda x: -x['count'])[:3]:
                print(f"    └─ {f['encoding']}: {f['count']}회")

    # 파일 비교 모드
    elif len(files) >= 2:
        compare_captures(files[0], files[1])
    else:
        print("  비교하려면 2개 이상의 파일이 필요합니다.")
        print("  또는 --search <값> 으로 특정 값을 검색하세요.")
        print(f"\n  예시:")
        print(f"    python 04_compare.py --search 915")
        print(f"    python 04_compare.py captures/file1.bin captures/file2.bin")


if __name__ == "__main__":
    main()

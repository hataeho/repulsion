"""
=============================================================
 Step 3: 캡처 데이터 분석기
 captures/ 폴더의 로그와 binary 파일을 분석하여
 프로토콜 구조, 패턴, 저울 값을 추출합니다.

 Usage:
   python 03_analyze.py                    # captures/ 전체 분석
   python 03_analyze.py captures/port_4001_*.bin   # 특정 파일만
=============================================================
"""
import os
import sys
import struct
import glob
from collections import Counter, defaultdict
from datetime import datetime


def analyze_binary_file(filepath):
    """바이너리 캡처 파일 분석"""
    with open(filepath, 'rb') as f:
        raw = f.read()

    if not raw:
        return None

    filename = os.path.basename(filepath)
    port = filename.split('_')[1] if '_' in filename else "?"

    result = {
        'file': filename,
        'port': port,
        'size': len(raw),
        'frames': [],
        'protocol_guess': 'UNKNOWN',
    }

    # === 1. 기본 통계 ===
    byte_freq = Counter(raw)
    result['byte_distribution'] = byte_freq
    result['unique_bytes'] = len(byte_freq)

    # ASCII 비율
    printable = sum(1 for b in raw if 32 <= b < 127 or b in (10, 13))
    result['ascii_ratio'] = printable / len(raw) if raw else 0

    # === 2. 프레임 분리 시도 ===
    frames = []

    # 방법 A: CR/LF 구분자 (ASCII 저울에서 가장 흔함)
    if result['ascii_ratio'] > 0.7:
        text = raw.decode('ascii', errors='replace')
        lines = [l.strip() for l in text.replace('\r\n', '\n').replace('\r', '\n').split('\n') if l.strip()]
        if lines:
            frames = lines
            result['protocol_guess'] = 'ASCII_LINE'
            result['delimiter'] = 'CR/LF'

    # 방법 B: STX(0x02) / ETX(0x03) 프레이밍
    if not frames:
        stx_positions = [i for i, b in enumerate(raw) if b == 0x02]
        etx_positions = [i for i, b in enumerate(raw) if b == 0x03]
        if stx_positions and etx_positions:
            for stx in stx_positions:
                for etx in etx_positions:
                    if etx > stx and (etx - stx) < 200:
                        frames.append(raw[stx:etx+1])
                        break
            if frames:
                result['protocol_guess'] = 'STX_ETX_FRAMED'

    # 방법 C: Modbus TCP (MBAP 헤더)
    if not frames:
        i = 0
        modbus_frames = []
        while i < len(raw) - 7:
            proto_id = (raw[i+2] << 8) | raw[i+3]
            length = (raw[i+4] << 8) | raw[i+5]
            if proto_id == 0x0000 and 1 <= length <= 256:
                frame_end = i + 6 + length
                if frame_end <= len(raw):
                    modbus_frames.append(raw[i:frame_end])
                    i = frame_end
                    continue
            i += 1
        if modbus_frames:
            frames = modbus_frames
            result['protocol_guess'] = 'MODBUS_TCP'

    result['frames'] = frames
    result['frame_count'] = len(frames)

    # === 3. 프레임 패턴 분석 ===
    if frames:
        lengths = [len(f) if isinstance(f, (bytes, bytearray)) else len(f) for f in frames]
        result['frame_lengths'] = {
            'min': min(lengths),
            'max': max(lengths),
            'avg': sum(lengths) / len(lengths),
            'unique': len(set(lengths)),
        }

        # 프레임 내 숫자 추출 시도
        numbers = []
        for frame in frames:
            if isinstance(frame, str):
                nums = extract_numbers_from_text(frame)
                numbers.extend(nums)
            elif isinstance(frame, (bytes, bytearray)):
                # Modbus 레지스터 값 추출
                if result['protocol_guess'] == 'MODBUS_TCP' and len(frame) > 9:
                    fc = frame[7]
                    if fc in (3, 4):  # Read Holding/Input Registers
                        byte_count = frame[8]
                        for j in range(9, 9 + byte_count, 2):
                            if j + 1 < len(frame):
                                val = (frame[j] << 8) | frame[j+1]
                                numbers.append(val)
                # ASCII 변환 시도
                try:
                    text = frame.decode('ascii', errors='replace')
                    nums = extract_numbers_from_text(text)
                    numbers.extend(nums)
                except:
                    pass

        result['extracted_numbers'] = numbers[:100]  # 최대 100개

    return result


def extract_numbers_from_text(text):
    """텍스트에서 숫자 추출"""
    import re
    # 소수점 포함 숫자, 부호 포함
    pattern = r'[+-]?\d+\.?\d*'
    matches = re.findall(pattern, text)
    numbers = []
    for m in matches:
        try:
            if '.' in m:
                numbers.append(float(m))
            else:
                numbers.append(int(m))
        except:
            pass
    return numbers


def print_analysis(result):
    """분석 결과 출력"""
    print(f"\n{'='*70}")
    print(f"  파일: {result['file']}")
    print(f"  포트: {result['port']}")
    print(f"  크기: {result['size']:,} 바이트")
    print(f"  프로토콜 추정: {result['protocol_guess']}")
    print(f"  ASCII 비율: {result['ascii_ratio']:.1%}")
    print(f"  고유 바이트 수: {result['unique_bytes']}")
    print(f"{'='*70}")

    if result.get('delimiter'):
        print(f"  구분자: {result['delimiter']}")

    print(f"  프레임 수: {result.get('frame_count', 0)}")

    if result.get('frame_lengths'):
        fl = result['frame_lengths']
        print(f"  프레임 길이: 최소={fl['min']}, 최대={fl['max']}, "
              f"평균={fl['avg']:.1f}, 종류={fl['unique']}")

    # 프레임 샘플 출력
    frames = result.get('frames', [])
    if frames:
        print(f"\n  --- 프레임 샘플 (최대 10개) ---")
        for i, frame in enumerate(frames[:10]):
            if isinstance(frame, str):
                print(f"  [{i+1:>3}] {repr(frame)}")
            elif isinstance(frame, (bytes, bytearray)):
                hex_str = " ".join(f"{b:02X}" for b in frame[:30])
                if len(frame) > 30:
                    hex_str += f" ... (+{len(frame)-30}B)"
                print(f"  [{i+1:>3}] {hex_str}")

                # Modbus 디코딩
                if result['protocol_guess'] == 'MODBUS_TCP' and len(frame) > 7:
                    tid = (frame[0] << 8) | frame[1]
                    uid = frame[6]
                    fc = frame[7]
                    print(f"        TID={tid} UID={uid} FC={fc}", end="")
                    if fc in (3, 4) and len(frame) > 8:
                        byte_count = frame[8]
                        regs = []
                        for j in range(9, 9 + byte_count, 2):
                            if j + 1 < len(frame):
                                val = (frame[j] << 8) | frame[j+1]
                                regs.append(val)
                        print(f" 레지스터값={regs}")
                    else:
                        print()

    # 추출된 숫자
    numbers = result.get('extracted_numbers', [])
    if numbers:
        print(f"\n  --- 추출된 숫자값 (총 {len(numbers)}개, 상위 20개) ---")
        for i, n in enumerate(numbers[:20]):
            print(f"  [{i+1:>3}] {n}")

        # 숫자 통계
        float_nums = [float(n) for n in numbers if isinstance(n, (int, float))]
        if float_nums:
            print(f"\n  숫자 통계:")
            print(f"    최소값: {min(float_nums)}")
            print(f"    최대값: {max(float_nums)}")
            print(f"    평균:   {sum(float_nums)/len(float_nums):.2f}")

            # 값 빈도 (저울이면 같은 값이 반복)
            value_freq = Counter(float_nums)
            print(f"\n  가장 빈번한 값 (저울 값 후보):")
            for val, cnt in value_freq.most_common(5):
                print(f"    {val} → {cnt}회 반복")

    # 바이트 분포에서 특이점
    freq = result.get('byte_distribution', {})
    if freq:
        print(f"\n  --- 바이트 빈도 상위 10 ---")
        for byte_val, count in freq.most_common(10):
            pct = count / result['size'] * 100
            char = chr(byte_val) if 32 <= byte_val < 127 else f"0x{byte_val:02X}"
            print(f"    0x{byte_val:02X} ({char:>4}): {count:>6}회 ({pct:.1f}%)")


def generate_report(results):
    """전체 분석 보고서 생성"""
    report_path = "analysis_report.txt"
    
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("=" * 70 + "\n")
        f.write("  TCP 데이터 프로토콜 분석 보고서\n")
        f.write(f"  생성 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=" * 70 + "\n\n")

        # 포트별 프로토콜 요약
        f.write("1. 포트별 프로토콜 요약\n")
        f.write("-" * 40 + "\n")
        for r in results:
            f.write(f"  포트 {r['port']:>5}: {r['protocol_guess']}\n")

        # 저울 데이터 후보
        f.write("\n2. 저울 데이터 후보\n")
        f.write("-" * 40 + "\n")
        scale_candidates = []
        for r in results:
            if r['protocol_guess'] in ('ASCII_LINE', 'STX_ETX_FRAMED', 'ASCII_NUMERIC'):
                scale_candidates.append(r)
            elif r['protocol_guess'] == 'MODBUS_TCP':
                nums = r.get('extracted_numbers', [])
                if nums:
                    # Modbus에서도 저울 값이 올 수 있음
                    scale_candidates.append(r)

        if scale_candidates:
            for r in scale_candidates:
                f.write(f"\n  ★ 포트 {r['port']} ({r['protocol_guess']})\n")
                frames = r.get('frames', [])
                for frame in frames[:5]:
                    if isinstance(frame, str):
                        f.write(f"    데이터: {repr(frame)}\n")
                nums = r.get('extracted_numbers', [])
                if nums:
                    value_freq = Counter([float(n) for n in nums])
                    f.write(f"    가장 빈번한 값: ")
                    f.write(", ".join(f"{v}({c}회)" for v, c in value_freq.most_common(3)))
                    f.write("\n")
        else:
            f.write("  후보 없음 - 캡처 시 저울 위에 중량물을 변경하며 재캡처 권장\n")

        f.write("\n3. 권장 다음 단계\n")
        f.write("-" * 40 + "\n")
        f.write("  ① 저울에 아무것도 올리지 않은 상태로 캡처 (영점 값 확인)\n")
        f.write("  ② 알려진 무게(예: 1kg)를 올린 상태로 캡처\n")
        f.write("  ③ 두 캡처를 비교하여 변하는 값 = 무게 데이터\n")
        f.write("  ④ 비교 스크립트: python 04_compare.py <file1> <file2>\n")

    print(f"\n  보고서 저장됨: {os.path.abspath(report_path)}")


def main():
    print("=" * 70)
    print("  TCP 캡처 데이터 분석기")
    print(f"  시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    # 분석할 파일 찾기
    if len(sys.argv) > 1:
        files = sys.argv[1:]
    else:
        files = sorted(glob.glob("captures/port_*.bin"))

    if not files:
        print("\n  분석할 파일이 없습니다!")
        print("  먼저 python 02_capture.py 를 실행하여 데이터를 캡처하세요.")
        sys.exit(1)

    print(f"\n  분석 대상: {len(files)}개 파일")
    results = []

    for filepath in files:
        result = analyze_binary_file(filepath)
        if result:
            results.append(result)
            print_analysis(result)

    if results:
        generate_report(results)


if __name__ == "__main__":
    main()

"""
원본 스캔 vs 생성 PDF 레이아웃 비교 분석
생성된 PDF를 이미지로 변환하여 비교합니다.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
import json

PAGE_W, PAGE_H = A4  # 595.28pt x 841.89pt = 210mm x 297mm

# A4 기준 비율
A4_W_MM = 210
A4_H_MM = 297

print("=" * 60)
print("  원본 스캔 vs 생성 PDF 레이아웃 비교 분석")
print("=" * 60)
print()

# 원본 스캔 이미지 분석 (픽셀 비율 기반)
# 원본 스캔 이미지 크기로부터 비율 추정
# 스캔 이미지 (698 x 988 pixels 추정 - 일반적인 A4 스캔)
# 실제 A4: 210mm x 297mm

# 원본 스캔의 주요 요소 위치 (이미지에서 관찰)
# 이미지 상에서의 비율(%) → mm로 변환

print("【원본 스캔 관찰 분석】")
print()

# 원본에서 관찰된 요소 위치 (A4 전체 높이 대비 %)
original_features = {
    "장식테두리_상단": {"top_pct": 3.5, "mm": 10.4},
    "제목_중심": {"top_pct": 6.5, "mm": 19.3},
    "정보테이블_시작": {"top_pct": 10.0, "mm": 29.7},
    "정보테이블_끝": {"top_pct": 20.5, "mm": 60.9},
    "접종테이블_시작": {"top_pct": 21.5, "mm": 63.8},
    "접종테이블_끝": {"top_pct": 34.0, "mm": 101.0},
    "확인문구": {"top_pct": 35.5, "mm": 105.4},
    "확인날짜": {"top_pct": 38.0, "mm": 112.9},
    "확인자서명": {"top_pct": 40.0, "mm": 118.8},
    "장식테두리_하단": {"top_pct": 42.0, "mm": 124.7},
    "절식확인서_제목": {"top_pct": 44.5, "mm": 132.2},
    "절식_안내문": {"top_pct": 46.5, "mm": 138.1},
    "절식_테이블시작": {"top_pct": 48.0, "mm": 142.6},
    "절식_테이블끝": {"top_pct": 55.5, "mm": 164.8},
    "법률문구": {"top_pct": 57.0, "mm": 169.3},
    "절식_날짜": {"top_pct": 61.0, "mm": 181.2},
    "사육한자": {"top_pct": 63.5, "mm": 188.6},
    "절식확인문": {"top_pct": 68.5, "mm": 203.4},
    "도축장출하자": {"top_pct": 72.0, "mm": 213.8},
    "도축장귀하": {"top_pct": 74.5, "mm": 221.3},
    "작성방법_시작": {"top_pct": 77.0, "mm": 228.7},
}

# 현재 생성 코드의 좌표
generated_features = {
    "장식테두리_상단": {"mm": 11.0},
    "제목_중심": {"mm": 20.0},
    "정보테이블_시작": {"mm": 30.0},
    "정보테이블_끝": {"mm": 60.0},  # 30 + 4*7.5
    "접종테이블_시작": {"mm": 63.0},  # 정보테이블끝 + 3
    "접종테이블_끝": {"mm": 100.5},  # 63 + 5*7.5
    "확인문구": {"mm": 105.5},  # 계산
    "확인날짜": {"mm": 113.5},
    "확인자서명": {"mm": 119.5},
    "장식테두리_하단": {"mm": 131.0},  # 11 + 120
    "절식확인서_제목": {"mm": 135.0},
    "절식_안내문": {"mm": 143.0},
    "절식_테이블시작": {"mm": 148.0},
    "절식_테이블끝": {"mm": 169.5},
    "법률문구": {"mm": 173.5},
    "절식_날짜": {"mm": 185.5},
    "사육한자": {"mm": 192.5},
    "절식확인문": {"mm": 206.5},
    "도축장출하자": {"mm": 213.5},
    "도축장귀하": {"mm": 220.5},
    "작성방법_시작": {"mm": 227.5},
}

print(f"{'요소':<20} {'원본(mm)':>10} {'생성(mm)':>10} {'차이(mm)':>10} {'조정 필요':>10}")
print("-" * 65)

adjustments = {}
for key in original_features:
    orig = original_features[key]["mm"]
    gen = generated_features.get(key, {}).get("mm", 0)
    diff = gen - orig
    need_adj = "⚠" if abs(diff) > 1.5 else "✓"
    print(f"{key:<20} {orig:>10.1f} {gen:>10.1f} {diff:>+10.1f} {need_adj:>10}")
    if abs(diff) > 1.5:
        adjustments[key] = diff

print()
print("=" * 60)
print("【주요 차이점 요약】")
print("=" * 60)

if adjustments:
    for key, diff in adjustments.items():
        direction = "아래로" if diff > 0 else "위로"
        print(f"  ⚠ {key}: {abs(diff):.1f}mm {direction} 이동 필요")
else:
    print("  ✓ 모든 요소가 1.5mm 이내 오차")

print()
print("【추가 관찰 사항】")
print("  1. 장식 테두리: 원본 = 전통 문양 장식, 생성 = 단순 이중선")
print("  2. 원본의 테두리 높이: ~114.3mm, 생성: 120mm → 약 5.7mm 줄여야 함")
print("  3. 절식확인서 시작 위치: 원본 ~132mm, 생성 ~135mm → 3mm 위로")
print("  4. 절식 테이블: 원본 높이 약 22mm, 생성 약 21.5mm → 거의 일치")
print("  5. 작성방법 시작: 원본 ~229mm, 생성 ~228mm → 거의 일치")

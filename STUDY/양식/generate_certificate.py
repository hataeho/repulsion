"""
뉴캣슬병 예방접종확인서 + 절식확인서 PDF 생성기 (템플릿 오버레이 방식)
===================================================================
원본 빈 양식 PDF 위에 변동 데이터만 텍스트 오버레이
→ 원본 서식(테두리, 음영, 도장 등) 100% 보존

사용법:
    python generate_certificate.py

입력항목:
    - 입추일 (YYYY.MM.DD) → 1차/2차 접종일 자동 산출
    - 접종수수
    - 절식 시작 시간 (시)
    - 절식 수량
    - 도축장명 (기본: 체리부로)
"""

import pikepdf
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import datetime, timedelta
import os
import io

# ============================================================
# 설정
# ============================================================
PAGE_W, PAGE_H = 595, 841  # 템플릿 PDF의 실제 크기 (pt)
TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), "새 문서.pdf")
FONT_DIR = "C:/Windows/Fonts"

# ============================================================
# 고정 데이터
# ============================================================
FARM_NAME = "공암산성"
OWNER_NAME = "윤은희"
ADDRESS = "경남 합천군 용주면 공암길 245-260"
ID_NUMBER = "671103-2332825"
PHONE_HP = "010-8643-8959"
POULTRY_TYPE = "닭 (육계)"

VACCINES = [
    {"name": "BN++",     "maker": "고려B&P",   "method": "분무"},
    {"name": "Check ND", "maker": "(주)코미팜", "method": "음수"},
]

# ============================================================
# 한글 폰트
# ============================================================
def register_fonts():
    pdfmetrics.registerFont(TTFont('Gothic', f'{FONT_DIR}/malgun.ttf'))
    pdfmetrics.registerFont(TTFont('GothicBold', f'{FONT_DIR}/malgunbd.ttf'))


# ============================================================
# 텍스트 좌표 정의
# ============================================================
# 좌표는 (x_mm, y_mm_from_top) → reportlab 좌표로 변환
# 원본 빈 양식 위에 정확한 위치에 텍스트를 배치

def Y(mm_from_top):
    """상단 기준 mm → reportlab y좌표 (하단 기준)"""
    return PAGE_H - mm_from_top * mm


def create_text_overlay(today, ipchu_date, vacc_count, fasting_hour, fasting_qty, slaughterhouse):
    """텍스트만 포함된 투명 PDF를 메모리에 생성."""

    register_fonts()
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(PAGE_W, PAGE_H))

    # ========================================
    # 상단: 뉴캣슬병 예방접종확인서
    # ========================================
    # 좌표는 원본 PDF의 빈칸 위치에 맞게 설정
    # 조정이 필요하면 아래 좌표값(x_mm, y_mm)을 수정하세요

    # --- 기본 정보 테이블 ---
    # 각 (x_mm, y_mm_from_top, text, font, size) 튜플

    info_items = [
        # Row 0: 농장명 / 대표자
        (46, 33.5, FARM_NAME, 'Gothic', 10),
        (140, 33.5, OWNER_NAME, 'Gothic', 10),
        # Row 1: 소재지 / 주민등록번호
        (46, 41, ADDRESS, 'Gothic', 8),
        (140, 41, ID_NUMBER, 'Gothic', 10),
        # Row 2: 가금의 종류 / H.P
        (46, 48.5, POULTRY_TYPE, 'Gothic', 10),
        (140, 48.5, PHONE_HP, 'Gothic', 10),
    ]

    for x_mm, y_mm, text, font, size in info_items:
        c.setFont(font, size)
        c.drawString(x_mm * mm, Y(y_mm), text)

    # Row 3: 출하예정일 / 출하처
    ship_date = today.strftime("%Y. %m. %d.")
    c.setFont('Gothic', 10)
    c.drawString(46 * mm, Y(56), ship_date)
    c.drawString(108 * mm, Y(56), slaughterhouse)

    # --- 접종 내역 ---
    date_1st = ipchu_date.strftime("%Y. %m. %d.")
    date_2nd = (ipchu_date + timedelta(days=12)).strftime("%Y. %m. %d.")
    vacc_str = f"{vacc_count:,}"

    # 접종 테이블 y 좌표 (각 행의 중심)
    vacc_rows = [
        # (y_mm, [접종횟수, 접종일자, 예방약종류, 제조업체명, 접종방법, 접종수수])
        (70, ["1차", date_1st, VACCINES[0]["name"], VACCINES[0]["maker"], VACCINES[0]["method"], vacc_str]),
        (77.5, ["2차", date_2nd, VACCINES[1]["name"], VACCINES[1]["maker"], VACCINES[1]["method"], vacc_str]),
        # 3차, 4차는 비어있음
    ]

    # 접종 테이블 열 x 좌표 (각 열 중앙)
    vacc_col_x_mm = [28, 52, 82, 108, 132, 160]

    for y_mm, row_data in vacc_rows:
        for i, (x_mm, text) in enumerate(zip(vacc_col_x_mm, row_data)):
            c.setFont('Gothic', 9)
            tw = c.stringWidth(text, 'Gothic', 9)
            c.drawString(x_mm * mm - tw / 2, Y(y_mm), text)

    # --- 확인 문구 아래 날짜 ---
    date_str = f"{today.year}년 {today.month}월 {today.day}일"
    c.setFont('Gothic', 11)
    c.drawString(128 * mm, Y(100), date_str)

    # --- 확인자 서명 ---
    c.setFont('Gothic', 11)
    c.drawString(148 * mm, Y(107), OWNER_NAME)

    # ========================================
    # 하단: 절식 확인서
    # ========================================

    # 절식 테이블: 가축종류
    c.setFont('Gothic', 10)
    c.drawCentredString(68 * mm, Y(159), POULTRY_TYPE)

    # 절식 테이블: 총수량
    qty_str = f"{fasting_qty:,}"
    c.drawCentredString(105 * mm, Y(159), qty_str)

    # 절식 테이블: 절식 시작 일시
    fasting_str = f"{today.year}년 {today.month:02d}월 {today.day:02d}일 {fasting_hour}시"
    c.setFont('Gothic', 9)
    c.drawCentredString(153 * mm, Y(159), fasting_str)

    # 절식확인서 날짜
    c.setFont('Gothic', 11)
    date_str2 = f"{today.year}년 {today.month}월 {today.day}일"
    c.drawCentredString(105 * mm, Y(181), date_str2)

    # 가축을 사육한 자: 농장명 + 이름
    c.setFont('Gothic', 11)
    c.drawString(130 * mm, Y(189), f"{FARM_NAME}  {OWNER_NAME}")

    # 절식 확인 날짜 (가축을 사육한 자 확인란) - 비워둠 (수기 작성)

    # 도축장 귀하
    c.setFont('GothicBold', 11)
    sltr_text = f"(주) {slaughterhouse} 도축장  귀하"
    tw = c.stringWidth(sltr_text, 'GothicBold', 11)
    c.drawString((PAGE_W - tw) / 2, Y(222), sltr_text)

    c.save()
    buf.seek(0)
    return buf


# ============================================================
# PDF 합성 (템플릿 + 오버레이)
# ============================================================
def generate_certificate(ipchu_date, vacc_count, fasting_hour, fasting_qty,
                          slaughterhouse="체리부로", output_path=None):
    """
    원본 빈 양식 PDF 위에 데이터를 오버레이하여 PDF 생성.

    Parameters:
        ipchu_date: 입추일 (datetime)
        vacc_count: 접종수수 (int)
        fasting_hour: 절식 시작 시간 (int, 0-23)
        fasting_qty: 절식 수량 (int)
        slaughterhouse: 도축장명 (str)
        output_path: 출력 파일 경로 (None이면 자동 생성)
    """
    today = datetime.now()

    if output_path is None:
        output_path = os.path.join(
            os.path.dirname(__file__),
            f"예방접종확인서_{today.strftime('%Y%m%d')}.pdf"
        )

    # 1. 텍스트 오버레이 PDF 생성 (메모리)
    overlay_buf = create_text_overlay(
        today, ipchu_date, vacc_count, fasting_hour, fasting_qty, slaughterhouse
    )

    # 2. 원본 템플릿 열기
    template = pikepdf.open(TEMPLATE_PATH)
    overlay = pikepdf.open(overlay_buf)

    # 3. 오버레이를 템플릿 위에 합성
    template_page = template.pages[0]
    overlay_page = overlay.pages[0]

    # FormXObject로 변환 후 copy_foreign으로 템플릿 PDF에 복사
    overlay_form = overlay_page.as_form_xobject()
    copied_form = template.copy_foreign(overlay_form)

    # 리소스에 등록
    if '/Resources' not in template_page:
        template_page['/Resources'] = pikepdf.Dictionary()
    if '/XObject' not in template_page['/Resources']:
        template_page['/Resources']['/XObject'] = pikepdf.Dictionary()

    overlay_name = pikepdf.Name('/Overlay0')
    template_page['/Resources']['/XObject'][overlay_name] = copied_form

    # 기존 컨텐츠 뒤에 오버레이 그리기 명령 추가
    overlay_cmd = b"q /Overlay0 Do Q\n"
    new_stream = pikepdf.Stream(template, overlay_cmd)

    existing_contents = template_page['/Contents']
    if isinstance(existing_contents, pikepdf.Array):
        existing_contents.append(new_stream)
    else:
        template_page['/Contents'] = pikepdf.Array([existing_contents, new_stream])

    # 4. 저장
    template.save(output_path)
    template.close()
    overlay.close()

    return output_path


# ============================================================
# CLI 인터페이스
# ============================================================
def main():
    print("=" * 50)
    print("  뉴캣슬병 예방접종확인서 + 절식확인서 생성기")
    print("     (방식: 원본 양식 PDF 템플릿 오버레이)")
    print("=" * 50)
    print()

    if not os.path.exists(TEMPLATE_PATH):
        print(f"[오류] 템플릿 PDF 파일을 찾을 수 없습니다: {TEMPLATE_PATH}")
        return

    # 입추일
    while True:
        raw = input("입추일 (YYYY.MM.DD, 예: 2026.02.07): ").strip()
        try:
            ipchu_date = datetime.strptime(raw.replace("/", ".").replace("-", "."), "%Y.%m.%d")
            break
        except ValueError:
            print("  -> 날짜 형식이 올바르지 않습니다.")

    # 접종수수
    while True:
        raw = input("접종수수 (예: 280000): ").strip().replace(",", "")
        try:
            vacc_count = int(raw)
            break
        except ValueError:
            print("  -> 숫자를 입력해주세요.")

    # 절식 시작 시간
    while True:
        raw = input("절식 시작 시간 (시, 0~23, 예: 15): ").strip()
        try:
            fasting_hour = int(raw)
            if 0 <= fasting_hour <= 23:
                break
            print("  -> 0~23 사이의 숫자를 입력해주세요.")
        except ValueError:
            print("  -> 숫자를 입력해주세요.")

    # 절식 수량
    while True:
        raw = input("절식 수량 (예: 87000): ").strip().replace(",", "")
        try:
            fasting_qty = int(raw)
            break
        except ValueError:
            print("  -> 숫자를 입력해주세요.")

    # 도축장
    slaughterhouse = input("도축장명 (기본: 체리부로, Enter로 기본값): ").strip()
    if not slaughterhouse:
        slaughterhouse = "체리부로"

    print()
    print("생성 중...")
    print(f"  - 템플릿: {TEMPLATE_PATH}")
    print(f"  - 출하예정일: 오늘 ({datetime.now().strftime('%Y.%m.%d')})")
    print(f"  - 1차 접종일: {ipchu_date.strftime('%Y.%m.%d')} (입추일)")
    print(f"  - 2차 접종일: {(ipchu_date + timedelta(days=12)).strftime('%Y.%m.%d')} (입추일+12일)")
    print(f"  - 접종수수: {vacc_count:,}")
    print(f"  - 절식 시작: 오늘 {fasting_hour}시")
    print(f"  - 절식 수량: {fasting_qty:,}")
    print(f"  - 도축장: {slaughterhouse}")
    print()

    path = generate_certificate(ipchu_date, vacc_count, fasting_hour, fasting_qty, slaughterhouse)
    print(f"PDF 생성 완료: {path}")
    print()

    # PDF 열기
    open_it = input("PDF를 바로 열까요? (Y/n): ").strip().lower()
    if open_it != 'n':
        os.startfile(path)


if __name__ == "__main__":
    main()

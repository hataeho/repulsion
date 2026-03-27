"""
경북 청송군 전주번호 상세 조사
================================
KEPCO API에서 경북(47) 데이터 중 청송군 관련 변전소를 찾고,
전주번호 생성 로직(TM좌표 기반 관리구 코드)으로
태양광 사업 후보지를 상세 분석합니다.

사용법: python3 cheongsong_investigation.py
"""

import sqlite3, json, sys, time, math, urllib.request, urllib.parse, ssl
from pathlib import Path
from datetime import datetime

DB_PATH = Path(__file__).parent / 'kepco_data.db'
KEPCO_API_KEY = 'Gmw7q8ORZt43XLdY2Nwsuh27xKe7brj73IbUq9kQ'
KEPCO_BASE_URL = 'https://bigdata.kepco.co.kr/openapi/v1/dispersedGeneration.do'

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

# 청송군 중심 좌표 및 주요 면 좌표
CHEONGSONG_CENTER = (36.4361, 129.0570)
CHEONGSONG_AREAS = {
    '청송읍': (36.4361, 129.0570),
    '부남면': (36.3800, 129.0000),
    '현동면': (36.3700, 129.1000),
    '현서면': (36.4200, 129.0100),
    '안덕면': (36.4800, 129.0400),
    '파천면': (36.5000, 129.0700),
    '진보면': (36.3900, 128.9500),
    '부동면': (36.4100, 129.1700),
    '주왕산면': (36.3950, 129.1600),  # 주왕산 인근
}


def fetch_url(url, timeout=90):
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    })
    r = urllib.request.urlopen(req, context=ssl_ctx, timeout=timeout)
    return r.read().decode('utf-8')

def _num(v):
    try: return float(v) if v else 0
    except: return 0


def latlon_to_tm(lat, lng):
    """위경도 → TM 좌표 변환 (중부원점 기준)"""
    a = 6378137
    f = 1 / 298.257222101
    b = a * (1 - f)
    e2 = (a*a - b*b) / (a*a)
    ep2 = (a*a - b*b) / (b*b)

    # 원점 결정
    if lng < 126: lng0 = 125
    elif lng < 128: lng0 = 127
    elif lng < 130: lng0 = 129
    else: lng0 = 131
    origin_names = {125: '서부', 127: '중부', 129: '동부', 131: '동해'}

    p = math.radians(lat)
    l = math.radians(lng)
    l0 = math.radians(lng0)
    p0 = math.radians(38)

    N = a / math.sqrt(1 - e2 * math.sin(p)**2)
    T = math.tan(p)**2
    C = ep2 * math.cos(p)**2
    A = math.cos(p) * (l - l0)

    e4 = e2**2
    e6 = e4 * e2

    M = a * ((1 - e2/4 - 3*e4/64 - 5*e6/256) * p
           - (3*e2/8 + 3*e4/32 + 45*e6/1024) * math.sin(2*p)
           + (15*e4/256 + 45*e6/1024) * math.sin(4*p)
           - (35*e6/3072) * math.sin(6*p))

    M0 = a * ((1 - e2/4 - 3*e4/64 - 5*e6/256) * p0
            - (3*e2/8 + 3*e4/32 + 45*e6/1024) * math.sin(2*p0)
            + (15*e4/256 + 45*e6/1024) * math.sin(4*p0)
            - (35*e6/3072) * math.sin(6*p0))

    tmX = N * (A + (1-T+C)*A**3/6 + (5-18*T+T**2+72*C-58*ep2)*A**5/120) + 200000
    tmY = (M - M0 + N*math.tan(p)*(A**2/2 + (5-T+9*C+4*C**2)*A**4/24
          + (61-58*T+T**2+600*C-330*ep2)*A**6/720)) + 500000

    return tmX, tmY, origin_names.get(lng0, '?')


def generate_pole_numbers(lat, lng, area_name):
    """해당 좌표 주변의 전주번호 추정"""
    tmX, tmY, origin = latlon_to_tm(lat, lng)
    gx = int(tmX / 2000) % 100
    gy = int(tmY / 2000) % 100
    mgmt_code = f'{gx:02d}{gy:02d}'

    # 주변 관리구 코드도 생성 (인접 8방향)
    adjacent = set()
    for dx in [-1, 0, 1]:
        for dy in [-1, 0, 1]:
            ax = (gx + dx) % 100
            ay = (gy + dy) % 100
            adjacent.add(f'{ax:02d}{ay:02d}')

    return {
        'area': area_name,
        'lat': lat, 'lng': lng,
        'tmX': round(tmX), 'tmY': round(tmY),
        'origin': origin,
        'mgmt_code': mgmt_code,
        'adjacent_codes': sorted(adjacent),
    }


def main():
    print('='*60)
    print('  📍 경북 청송군 전주번호 상세 조사')
    print(f'  {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print('='*60)

    # ── 1. DB에서 청송 인근 변전소 찾기 ──
    print('\n[1] DB에서 청송군 인근 변전소 검색 (반경 30km)')
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()

    rows = c.execute('''
        SELECT subst_cd, subst_nm, metro_nm, vol1, subst_pwr, available_rate, status,
               dl_count, lat, lng
        FROM substations
        WHERE metro_nm = '경북'
        ORDER BY vol1 DESC
    ''').fetchall()

    nearby = []
    for r in rows:
        cd, nm, metro, vol1, pwr, rate, status, dl, lat, lng = r
        if lat and lng:
            dist = math.sqrt((lat - CHEONGSONG_CENTER[0])**2 + (lng - CHEONGSONG_CENTER[1])**2) * 111
            if dist < 30:
                nearby.append({
                    'cd': cd, 'nm': nm, 'vol1': vol1, 'pwr': pwr,
                    'rate': rate, 'status': status, 'dl': dl,
                    'lat': lat, 'lng': lng, 'dist_km': round(dist, 1)
                })

    nearby.sort(key=lambda x: x['dist_km'])

    print(f'\n  {"변전소":8s} {"거리":>6s} {"여유용량(kW)":>12s} {"사용량":>10s} {"여유율":>6s} {"상태":4s} {"DL":>3s}')
    print('  ' + '-'*60)
    for s in nearby:
        print(f'  {s["nm"]:8s} {s["dist_km"]:>5.1f}km {s["vol1"]:>12,.0f} {s["pwr"]:>10,.0f} '
              f'{s["rate"]:>5.1f}% {s["status"]:4s} {s["dl"]:>3d}')

    # ── 2. KEPCO API에서 청송 인근 변전소 DL 상세 조회 ──
    print(f'\n[2] 인근 변전소 DL(배전선) 상세 조회')
    for s in nearby[:5]:  # 상위 5개
        try:
            details = c.execute('''
                SELECT dl_cd, dl_nm, dl_pwr, vol3, mtr_no, vol2
                FROM substation_details
                WHERE subst_cd = ?
                ORDER BY vol3 DESC
            ''', (s['cd'],)).fetchall()

            if details:
                print(f'\n  📍 {s["nm"]} 변전소 (거리: {s["dist_km"]}km)')
                print(f'     {"DL코드":>6s} {"DL명":8s} {"사용량(kW)":>10s} {"여유(kW)":>10s} {"상태":6s}')
                for dl in details:
                    dl_cd, dl_nm, dl_pwr, vol3, mtr, vol2 = dl
                    dl_pwr = dl_pwr or 0
                    vol3 = vol3 or 0
                    dl_status = '연계가능' if vol3 > 5000 else '소규모' if vol3 > 1000 else '포화'
                    print(f'     {dl_cd or "?":>6s} {dl_nm or "-":8s} {dl_pwr:>10,.0f} {vol3:>10,.0f} {dl_status:6s}')
        except:
            pass

    conn.close()

    # ── 3. 전주번호 생성 (청송군 각 면별) ──
    print(f'\n[3] 청송군 면별 전주번호 관리구 코드 추정')
    print(f'\n  {"지역":10s} {"TM-X":>10s} {"TM-Y":>10s} {"원점":4s} {"관리구코드":>8s} {"인접코드":30s}')
    print('  ' + '-'*80)

    all_poles = []
    for area_name, (lat, lng) in CHEONGSONG_AREAS.items():
        pole = generate_pole_numbers(lat, lng, area_name)
        all_poles.append(pole)
        adj_str = ', '.join(pole['adjacent_codes'][:5]) + '...'
        print(f'  {area_name:10s} {pole["tmX"]:>10,} {pole["tmY"]:>10,} '
              f'{pole["origin"]:4s} {pole["mgmt_code"]:>8s} {adj_str:30s}')

    # ── 4. 태양광 최적지 추천 ──
    print(f'\n[4] 청송군 태양광 사업 최적지 추천')
    print('='*60)

    # 여유용량 높은 변전소 + 거리 가까운 곳 = 추천
    for s in nearby[:3]:
        pole = generate_pole_numbers(s['lat'], s['lng'], f'{s["nm"]}변전소 주변')
        print(f'\n  🌞 추천 영역: {s["nm"]}변전소 반경 2km')
        print(f'     거리: 청송 중심에서 {s["dist_km"]}km')
        print(f'     여유용량: {s["vol1"]:,.0f} kW ({s["rate"]:.1f}%)')
        print(f'     배전선(DL): {s["dl"]}개')
        print(f'     관리구 코드: {pole["mgmt_code"]}')
        print(f'     추정 전주번호: {pole["mgmt_code"]}A001 ~ {pole["mgmt_code"]}Z999')
        print(f'     TM 좌표: ({pole["origin"]}원점) X={pole["tmX"]:,} Y={pole["tmY"]:,}')
        print(f'     위경도: {s["lat"]:.4f}, {s["lng"]:.4f}')

    # ── 5. 상세 전주번호 그리드 (청송읍 기준) ──
    print(f'\n[5] 청송읍 중심 전주번호 상세 그리드 (2km×2km)')
    center_lat, center_lng = CHEONGSONG_CENTER
    km_per_deg_lat = 111.32
    km_per_deg_lng = 111.32 * math.cos(math.radians(center_lat))

    print(f'\n  {"전주번호":>14s} {"위도":>10s} {"경도":>10s} {"TM-X":>10s} {"TM-Y":>10s} {"관리구":>6s}')
    print('  ' + '-'*65)

    letters = 'ABCDEFGHIJ'
    for row in range(5):
        for col in range(5):
            p_lat = center_lat + (row - 2) * 0.4 / km_per_deg_lat
            p_lng = center_lng + (col - 2) * 0.4 / km_per_deg_lng
            tmX, tmY, origin = latlon_to_tm(p_lat, p_lng)
            gx = int(tmX / 2000) % 100
            gy = int(tmY / 2000) % 100
            code = f'{gx:02d}{gy:02d}'
            letter = letters[row]
            pole_no = f'{code}{letter}{100 + col*100 + row*10:03d}'
            print(f'  {pole_no:>14s} {p_lat:>10.5f} {p_lng:>10.5f} {int(tmX):>10,} {int(tmY):>10,} {code:>6s}')

    # ── 6. JSON 결과 저장 ──
    result = {
        'investigation_date': datetime.now().isoformat(),
        'target': '경북 청송군',
        'center': {'lat': CHEONGSONG_CENTER[0], 'lng': CHEONGSONG_CENTER[1]},
        'nearby_substations': nearby,
        'pole_areas': all_poles,
        'recommendations': [{
            'name': s['nm'],
            'dist_km': s['dist_km'],
            'available_kw': s['vol1'],
            'available_rate': s['rate'],
            'dl_count': s['dl'],
            'lat': s['lat'], 'lng': s['lng']
        } for s in nearby[:3]]
    }

    result_path = Path(__file__).parent / 'cheongsong_report.json'
    with open(result_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f'\n  📄 상세 결과: {result_path}')
    print('='*60)


if __name__ == '__main__':
    main()

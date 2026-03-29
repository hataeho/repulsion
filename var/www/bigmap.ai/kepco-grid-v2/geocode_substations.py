"""
변전소 좌표 정밀화 (Geocoding)
================================
변전소 이름 + 지역명으로 Nominatim API를 사용하여
실제 좌표를 찾고 DB를 업데이트합니다.

사용법: python3 geocode_substations.py
"""

import sqlite3, json, time, sys, urllib.request, urllib.parse, ssl, random
from pathlib import Path

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

DB_PATH = Path(__file__).parent / 'kepco_data.db'

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

# 지역명 → 검색용 접미사
REGION_SUFFIX = {
    '서울': '서울특별시', '부산': '부산광역시', '대구': '대구광역시',
    '인천': '인천광역시', '광주': '광주광역시', '대전': '대전광역시',
    '울산': '울산광역시', '세종': '세종특별자치시',
    '경기': '경기도', '강원': '강원특별자치도', '충북': '충청북도',
    '충남': '충청남도', '전북': '전북특별자치도', '전남': '전라남도',
    '경북': '경상북도', '경남': '경상남도', '제주': '제주특별자치도'
}

def geocode(name, region):
    """Nominatim으로 변전소 좌표 검색"""
    region_full = REGION_SUFFIX.get(region, region)

    # 검색 전략 (여러 쿼리 시도)
    queries = [
        f'{name}변전소 {region_full}',
        f'{name} 변전소 {region_full}',
        f'{name}변전소 대한민국',
        f'{name} {region_full}',
    ]

    for q in queries:
        try:
            url = (f'https://nominatim.openstreetmap.org/search?'
                   f'q={urllib.parse.quote(q)}'
                   f'&format=json&limit=1&countrycodes=kr&accept-language=ko')

            req = urllib.request.Request(url, headers={
                'User-Agent': 'KEPCO-Grid-Geocoder/1.0 (bigmap.ai)'
            })
            resp = urllib.request.urlopen(req, context=ssl_ctx, timeout=15)
            data = json.loads(resp.read().decode('utf-8'))

            if data:
                lat = float(data[0]['lat'])
                lon = float(data[0]['lon'])
                # 한국 영역 검증 (33~39N, 124~132E)
                if 33.0 <= lat <= 39.0 and 124.0 <= lon <= 132.0:
                    return lat, lon, q

            time.sleep(1.1)  # Nominatim rate limit (1 req/sec)

        except Exception:
            time.sleep(1.5)

    return None, None, None


def main():
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()

    # 모든 변전소 가져오기
    rows = c.execute(
        'SELECT subst_cd, subst_nm, metro_nm, lat, lng, has_location FROM substations ORDER BY vol1 DESC'
    ).fetchall()

    total = len(rows)
    updated = 0
    failed = 0

    print('='*60)
    print(f'  📍 변전소 좌표 정밀화 (Geocoding)')
    print(f'  대상: {total}개 변전소')
    print('='*60)

    for i, (cd, nm, region, old_lat, old_lng, has_loc) in enumerate(rows):
        # 이미 정밀 좌표가 있으면 건너뛰기
        if has_loc == 1:
            continue

        lat, lng, matched_q = geocode(nm, region or '')

        if lat and lng:
            c.execute('UPDATE substations SET lat=?, lng=?, has_location=1 WHERE subst_cd=?',
                      (lat, lng, cd))
            updated += 1
            if updated % 10 == 0:
                conn.commit()
            status = '✅'
        else:
            failed += 1
            status = '❌'

        # 진행 표시 (50개마다)
        if (i + 1) % 50 == 0 or i < 5:
            print(f'  [{i+1:4d}/{total}] {status} {nm:10s} ({region}) '
                  f'→ {f"{lat:.4f},{lng:.4f}" if lat else "찾지 못함"} '
                  f'(성공:{updated} 실패:{failed})', flush=True)

    conn.commit()
    conn.close()

    print(f'\n  📊 결과: 성공 {updated}개 / 실패 {failed}개 / 기존 {total - updated - failed}개')
    print('='*60)


if __name__ == '__main__':
    main()

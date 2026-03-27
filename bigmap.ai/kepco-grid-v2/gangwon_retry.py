"""강원도 데이터 수집 재시도 + 지오코딩"""
import sqlite3, json, sys, time, random, urllib.request, urllib.parse, ssl
from pathlib import Path
from datetime import datetime

DB_PATH = Path(__file__).parent / 'kepco_data.db'
KEPCO_API_KEY = 'Gmw7q8ORZt43XLdY2Nwsuh27xKe7brj73IbUq9kQ'
KEPCO_BASE_URL = 'https://bigdata.kepco.co.kr/openapi/v1/dispersedGeneration.do'

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

CITY_CODES = list(range(11, 50))

def fetch_url(url, timeout=90):
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    })
    r = urllib.request.urlopen(req, context=ssl_ctx, timeout=timeout)
    return r.read().decode('utf-8')

def _num(v):
    try: return float(v) if v else 0
    except: return 0

def geocode(name):
    queries = [f'{name}변전소 강원특별자치도', f'{name}변전소 강원도', f'{name} 강원도']
    for q in queries:
        try:
            url = (f'https://nominatim.openstreetmap.org/search?'
                   f'q={urllib.parse.quote(q)}&format=json&limit=1&countrycodes=kr')
            req = urllib.request.Request(url, headers={'User-Agent': 'KEPCO-Grid/2.0'})
            resp = urllib.request.urlopen(req, context=ssl_ctx, timeout=15)
            data = json.loads(resp.read().decode('utf-8'))
            if data:
                lat, lon = float(data[0]['lat']), float(data[0]['lon'])
                if 33 <= lat <= 39 and 124 <= lon <= 132:
                    return lat, lon
            time.sleep(1.1)
        except:
            time.sleep(1.5)
    return None, None

def main():
    print('='*50)
    print('  강원도 데이터 수집 재시도')
    print(f'  {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print('='*50)

    # 1. 시도 코드 42 (강원) 전체 시도
    total_items = []
    print('\n[1] 시도 단위 (metroCd=42) 시도...')
    try:
        url = f'{KEPCO_BASE_URL}?apiKey={KEPCO_API_KEY}&returnType=json&metroCd=42&numOfRows=10000'
        raw = fetch_url(url)
        data = json.loads(raw)
        if 'data' in data and isinstance(data['data'], list) and len(data['data']) > 0:
            total_items.extend(data['data'])
            print(f'  ✅ 시도 단위 성공: {len(data["data"])}건')
        else:
            print(f'  ❌ 시도 단위 데이터 없음')
    except Exception as e:
        print(f'  ❌ 시도 단위 실패: {str(e)[:60]}')

    # 2. 시군구 단위로 개별 시도
    print('\n[2] 시군구 단위 개별 시도...')
    for city_cd in CITY_CODES:
        time.sleep(random.uniform(1.5, 3.0))
        try:
            url = (f'{KEPCO_BASE_URL}?apiKey={KEPCO_API_KEY}&returnType=json'
                   f'&metroCd=42&cityCd={city_cd}&numOfRows=10000')
            raw = fetch_url(url)
            data = json.loads(raw)
            if 'data' in data and isinstance(data['data'], list) and len(data['data']) > 0:
                items = data['data']
                total_items.extend(items)
                print(f'  cityCd={city_cd}: ✅ {len(items)}건', flush=True)
        except:
            pass

    if not total_items:
        print('\n⚠ 강원도 데이터를 가져올 수 없습니다 (KEPCO API 미지원 상태)')
        print('  강원도는 현재 KEPCO 빅데이터 API에서 제공하지 않는 것으로 보입니다.')
        return

    # 3. DB에 저장
    print(f'\n[3] DB 저장: 총 {len(total_items)}건')
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()
    now = datetime.now().isoformat()

    subst_map = {}
    for item in total_items:
        cd = item.get('substCd', '')
        if not cd:
            continue
        c.execute('''INSERT OR REPLACE INTO substation_details
            (subst_cd, mtr_no, js_mtr_pwr, mtr_pwr, vol2,
             dl_cd, dl_nm, js_dl_pwr, dl_pwr, vol3, metro_cd, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)''',
            (cd, item.get('mtrNo',''),
             _num(item.get('jsMtrPwr')), _num(item.get('mtrPwr')), _num(item.get('vol2')),
             item.get('dlCd',''), item.get('dlNm',''),
             _num(item.get('jsDlPwr')), _num(item.get('dlPwr')), _num(item.get('vol3')),
             '42', now))

        if cd not in subst_map:
            subst_map[cd] = {
                'nm': item.get('substNm', ''), 'pwr': 0, 'vol1': 0,
                'mtr_max': 0, 'dl_count': 0, 'total_dl': 0, 'total_v3': 0
            }
        s = subst_map[cd]
        s['vol1'] = _num(item.get('vol1', s['vol1']))
        s['pwr'] = max(s['pwr'], _num(item.get('substPwr', 0)))
        mtr = item.get('mtrNo', '')
        s['mtr_max'] = max(s['mtr_max'], int(mtr) if mtr.isdigit() else 0)
        s['dl_count'] += 1
        s['total_dl'] += _num(item.get('dlPwr', 0))
        s['total_v3'] += _num(item.get('vol3', 0))

    # 4. 변전소 저장 + 지오코딩
    print(f'\n[4] {len(subst_map)}개 변전소 저장 + 좌표 검색...')
    for subst_cd, s in subst_map.items():
        total = s['vol1'] + s['pwr']
        rate = (s['vol1'] / total * 100) if total > 0 else 0
        if rate >= 50: status = '여유'
        elif rate >= 20: status = '보통'
        elif rate >= 10: status = '주의'
        else: status = '포화'

        lat, lng = geocode(s['nm'])
        has_loc = 1 if lat else 0
        if not lat:
            lat = 37.82 + (random.random() - 0.5) * 0.8
            lng = 128.15 + (random.random() - 0.5) * 0.8

        c.execute('''INSERT OR REPLACE INTO substations
            (subst_cd, subst_nm, metro_cd, metro_nm,
             js_subst_pwr, subst_pwr, vol1, available_rate, status,
             transformer_count, dl_count, total_dl_pwr, total_vol3,
             lat, lng, has_location, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
            (subst_cd, s['nm'], '42', '강원',
             0, s['pwr'], s['vol1'], round(rate, 1), status,
             s['mtr_max'], s['dl_count'], s['total_dl'], s['total_v3'],
             lat, lng, has_loc, now))

        geo_status = '📍' if has_loc else '⚠'
        print(f'  {geo_status} {s["nm"]:8s} vol1={s["vol1"]:,.0f}kW lat={lat:.4f} lng={lng:.4f}', flush=True)

    conn.commit()

    # 5. 최종 확인
    total_now = c.execute('SELECT COUNT(*) FROM substations').fetchone()[0]
    gangwon = c.execute("SELECT COUNT(*) FROM substations WHERE metro_nm='강원'").fetchone()[0]
    conn.close()

    print(f'\n  ✅ 강원도 {gangwon}개 변전소 추가!')
    print(f'  전체 DB: {total_now}개 변전소')
    print('='*50)

if __name__ == '__main__':
    main()

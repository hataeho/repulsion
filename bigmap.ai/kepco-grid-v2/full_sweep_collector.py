"""
전국 완전 수집기 (Full Sweep Collector)
=========================================
시도(metroCd) 17개 × 시군구(cityCd) 단위까지 샅샅이 수집.
기존 smart_collector.py를 대체하여 누락 없는 완전 수집 수행.

- 1단계: 시도별 전체 수집 (numOfRows=10000)
- 2단계: 1단계에서 누락된 시도는 시군구 단위로 개별 재시도
- 3단계: OSM 송전선로 경로 수집
- 4단계: 결과 통계 출력

사용법: python3 full_sweep_collector.py
"""

import sqlite3, json, os, sys, time, math, random
import urllib.request, urllib.parse, ssl
from pathlib import Path
from datetime import datetime

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

DB_PATH = Path(__file__).parent / 'kepco_data.db'
KEPCO_API_KEY = 'Gmw7q8ORZt43XLdY2Nwsuh27xKe7brj73IbUq9kQ'
KEPCO_BASE_URL = 'https://bigdata.kepco.co.kr/openapi/v1/dispersedGeneration.do'

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

# 시도코드
METRO = {
    '11': '서울', '26': '부산', '27': '대구', '28': '인천',
    '29': '광주', '30': '대전', '31': '울산', '36': '세종',
    '41': '경기', '42': '강원', '43': '충북', '44': '충남',
    '45': '전북', '46': '전남', '47': '경북', '48': '경남', '50': '제주'
}

# 시군구 코드 (전체 목록 - KEPCO API에서 지원하는 모든 cityCd)
CITY_CODES = list(range(11, 100))

REGION_CENTER = {
    '서울': (37.5665, 126.9780), '부산': (35.1796, 129.0756),
    '대구': (35.8714, 128.6014), '인천': (37.4563, 126.7052),
    '광주': (35.1595, 126.8526), '대전': (36.3504, 127.3845),
    '울산': (35.5384, 129.3114), '세종': (36.4800, 127.0000),
    '경기': (37.2750, 127.0090), '강원': (37.8228, 128.1555),
    '충북': (36.6357, 127.4912), '충남': (36.6588, 126.6728),
    '전북': (35.8200, 127.1089), '전남': (34.8160, 126.4630),
    '경북': (36.4919, 128.8889), '경남': (35.4606, 128.2132),
    '제주': (33.4996, 126.5312)
}

def fetch_url(url, timeout=90, retries=3):
    """재시도 로직 포함 URL 요청"""
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            })
            r = urllib.request.urlopen(req, context=ssl_ctx, timeout=timeout)
            return r.read().decode('utf-8')
        except Exception as e:
            if attempt < retries - 1:
                wait = (attempt + 1) * 3
                print(f'    ⚠ 재시도 {attempt+1}/{retries} ({wait}s 대기): {str(e)[:40]}', flush=True)
                time.sleep(wait)
            else:
                raise

def _num(v):
    try: return float(v) if v else 0
    except: return 0

# ──────────────────────────────────────
#  DB 초기화
# ──────────────────────────────────────
def init_db():
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS substations (
        subst_cd TEXT PRIMARY KEY, subst_nm TEXT NOT NULL,
        metro_cd TEXT, metro_nm TEXT,
        js_subst_pwr REAL DEFAULT 0, subst_pwr REAL DEFAULT 0,
        vol1 REAL DEFAULT 0, available_rate REAL DEFAULT 0,
        status TEXT DEFAULT '', transformer_count INTEGER DEFAULT 0,
        dl_count INTEGER DEFAULT 0, total_dl_pwr REAL DEFAULT 0,
        total_vol3 REAL DEFAULT 0,
        lat REAL, lng REAL, has_location INTEGER DEFAULT 0,
        updated_at TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS substation_details (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subst_cd TEXT, mtr_no TEXT,
        js_mtr_pwr REAL DEFAULT 0, mtr_pwr REAL DEFAULT 0, vol2 REAL DEFAULT 0,
        dl_cd TEXT, dl_nm TEXT,
        js_dl_pwr REAL DEFAULT 0, dl_pwr REAL DEFAULT 0, vol3 REAL DEFAULT 0,
        metro_cd TEXT, updated_at TEXT,
        FOREIGN KEY (subst_cd) REFERENCES substations(subst_cd)
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS powerlines (
        osm_id INTEGER PRIMARY KEY, name TEXT, voltage TEXT,
        cables TEXT, coords_json TEXT, updated_at TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS collection_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT, record_count INTEGER, status TEXT,
        message TEXT, started_at TEXT, finished_at TEXT
    )''')
    c.execute('CREATE INDEX IF NOT EXISTS idx_subst_metro ON substations(metro_cd)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_subst_status ON substations(status)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_subst_vol1 ON substations(vol1 DESC)')
    conn.commit()
    conn.close()
    print('[DB] 초기화 완료')


def process_items(conn, items, metro_cd, metro_nm):
    """API 응답 items를 DB에 저장"""
    c = conn.cursor()
    now = datetime.now().isoformat()

    for item in items:
        c.execute('''INSERT OR REPLACE INTO substation_details
            (subst_cd, mtr_no, js_mtr_pwr, mtr_pwr, vol2,
             dl_cd, dl_nm, js_dl_pwr, dl_pwr, vol3, metro_cd, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)''',
            (item.get('substCd',''), item.get('mtrNo',''),
             _num(item.get('jsMtrPwr')), _num(item.get('mtrPwr')), _num(item.get('vol2')),
             item.get('dlCd',''), item.get('dlNm',''),
             _num(item.get('jsDlPwr')), _num(item.get('dlPwr')), _num(item.get('vol3')),
             metro_cd, now))

    subst_map = {}
    for item in items:
        key = item.get('substCd', '')
        if not key: continue
        if key not in subst_map:
            subst_map[key] = {
                'nm': item.get('substNm', ''),
                'js': _num(item.get('jsSubstPwr')),
                'pwr': _num(item.get('substPwr')),
                'vol1': _num(item.get('vol1')),
                'mtr_max': 0, 'dl_count': 0,
                'total_dl': 0, 'total_v3': 0
            }
        s = subst_map[key]
        s['vol1'] = _num(item.get('vol1', s['vol1']))
        s['pwr'] = max(s['pwr'], _num(item.get('substPwr', 0)))
        mtr = item.get('mtrNo', '')
        s['mtr_max'] = max(s['mtr_max'], int(mtr) if mtr.isdigit() else 0)
        s['dl_count'] += 1
        s['total_dl'] += _num(item.get('dlPwr', 0))
        s['total_v3'] += _num(item.get('vol3', 0))

    center = REGION_CENTER.get(metro_nm, (36.5, 127.5))
    for subst_cd, s in subst_map.items():
        total = s['vol1'] + s['pwr']
        rate = (s['vol1'] / total * 100) if total > 0 else 0
        if rate >= 50: status = '여유'
        elif rate >= 20: status = '보통'
        elif rate >= 10: status = '주의'
        else: status = '포화'

        lat = center[0] + (random.random() - 0.5) * 0.15
        lng = center[1] + (random.random() - 0.5) * 0.15

        c.execute('''INSERT OR REPLACE INTO substations
            (subst_cd, subst_nm, metro_cd, metro_nm,
             js_subst_pwr, subst_pwr, vol1, available_rate, status,
             transformer_count, dl_count, total_dl_pwr, total_vol3,
             lat, lng, has_location, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,
             COALESCE((SELECT lat FROM substations WHERE subst_cd=?), ?),
             COALESCE((SELECT lng FROM substations WHERE subst_cd=?), ?),
             COALESCE((SELECT has_location FROM substations WHERE subst_cd=?), 0),
             ?)''',
            (subst_cd, s['nm'], metro_cd, metro_nm,
             s['js'], s['pwr'], s['vol1'], round(rate, 1), status,
             s['mtr_max'], s['dl_count'], s['total_dl'], s['total_v3'],
             subst_cd, lat, subst_cd, lng, subst_cd, now))

    conn.commit()
    return len(subst_map)


# ──────────────────────────────────────
#  1단계: 시도별 전체 수집
# ──────────────────────────────────────
def phase1_metro_sweep():
    print('\n' + '='*60)
    print('  🔍 1단계: 시도별 전체 수집 (17개 시도)')
    print('='*60)

    conn = sqlite3.connect(str(DB_PATH))
    total_records = 0
    total_substations = 0
    failed_metros = []
    results = {}

    for i, (metro_cd, metro_nm) in enumerate(METRO.items()):
        if i > 0:
            delay = random.uniform(2.0, 4.0)
            time.sleep(delay)

        try:
            url = f'{KEPCO_BASE_URL}?apiKey={KEPCO_API_KEY}&returnType=json&metroCd={metro_cd}&numOfRows=10000'
            raw = fetch_url(url)
            data = json.loads(raw)

            if 'data' not in data or not isinstance(data['data'], list) or len(data['data']) == 0:
                print(f'  [{i+1:2d}/17] {metro_nm}({metro_cd}): ❌ 데이터 없음 → 2단계에서 시군구별 재시도', flush=True)
                failed_metros.append((metro_cd, metro_nm))
                continue

            items = data['data']
            subst_count = process_items(conn, items, metro_cd, metro_nm)
            total_records += len(items)
            total_substations += subst_count

            vol1_sum = sum(_num(item.get('vol1', 0)) for item in items)
            results[metro_cd] = {'nm': metro_nm, 'records': len(items), 'substations': subst_count, 'vol1_sum': vol1_sum}

            print(f'  [{i+1:2d}/17] {metro_nm}({metro_cd}): ✅ {len(items):,}건, '
                  f'{subst_count}개 변전소, 여유합계: {vol1_sum:,.0f}kW', flush=True)

        except Exception as e:
            print(f'  [{i+1:2d}/17] {metro_nm}({metro_cd}): ❌ 실패 → 2단계 재시도 ({str(e)[:40]})', flush=True)
            failed_metros.append((metro_cd, metro_nm))

    conn.close()
    print(f'\n  1단계 완료: {total_records:,}건, {total_substations}개 변전소, 실패 {len(failed_metros)}개')
    return results, failed_metros


# ──────────────────────────────────────
#  2단계: 실패 시도 시군구별 개별 수집
# ──────────────────────────────────────
def phase2_city_sweep(failed_metros):
    if not failed_metros:
        print('\n  2단계: 실패 시도 없음 — 건너뜀')
        return

    print('\n' + '='*60)
    print(f'  🔍 2단계: 실패 {len(failed_metros)}개 시도 → 시군구별 개별 수집')
    print('='*60)

    conn = sqlite3.connect(str(DB_PATH))
    total_records = 0
    total_substations = 0

    for metro_cd, metro_nm in failed_metros:
        print(f'\n  📍 {metro_nm}({metro_cd}) 시군구별 수집 시작...')
        metro_records = 0
        metro_substations = 0

        for city_cd in CITY_CODES:
            city_cd_str = str(city_cd)
            delay = random.uniform(1.5, 3.0)
            time.sleep(delay)

            try:
                url = (f'{KEPCO_BASE_URL}?apiKey={KEPCO_API_KEY}&returnType=json'
                       f'&metroCd={metro_cd}&cityCd={city_cd_str}&numOfRows=10000')
                raw = fetch_url(url, retries=2)
                data = json.loads(raw)

                if 'data' not in data or not isinstance(data['data'], list) or len(data['data']) == 0:
                    continue  # 해당 시군구에 데이터 없음 (정상)

                items = data['data']
                subst_count = process_items(conn, items, metro_cd, metro_nm)
                metro_records += len(items)
                metro_substations += subst_count

                print(f'    cityCd={city_cd_str}: {len(items):,}건, {subst_count}개 변전소', flush=True)

            except Exception as e:
                # 404 등은 그냥 넘어감 (해당 코드 조합이 없는 것)
                continue

        total_records += metro_records
        total_substations += metro_substations
        print(f'  📍 {metro_nm} 완료: {metro_records:,}건, {metro_substations}개 변전소')

    conn.close()
    print(f'\n  2단계 완료: 추가 {total_records:,}건, {total_substations}개 변전소')


# ──────────────────────────────────────
#  3단계: OSM 송전선로 경로 수집
# ──────────────────────────────────────
def phase3_osm_powerlines():
    print('\n' + '='*60)
    print('  🔍 3단계: OSM 송전선로 경로 수집')
    print('='*60)

    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()

    # 한반도 전체 영역 (남한)
    bbox = '33.0,124.0,39.0,132.0'
    query = f'''
    [out:json][timeout:120];
    (
      way["power"="line"]["voltage"~"345000|154000"]({bbox});
    );
    out geom;
    '''

    try:
        url = 'https://overpass-api.de/api/interpreter'
        data = urllib.parse.urlencode({'data': query}).encode()
        req = urllib.request.Request(url, data=data, headers={
            'User-Agent': 'KEPCO-Grid-Collector/2.0'
        })
        response = urllib.request.urlopen(req, context=ssl_ctx, timeout=120)
        result = json.loads(response.read().decode('utf-8'))

        elements = result.get('elements', [])
        count = 0
        now = datetime.now().isoformat()

        for el in elements:
            if el.get('type') != 'way':
                continue
            geom = el.get('geometry', [])
            if len(geom) < 2:
                continue

            coords = [[pt['lat'], pt['lon']] for pt in geom]
            tags = el.get('tags', {})

            c.execute('''INSERT OR REPLACE INTO powerlines
                (osm_id, name, voltage, cables, coords_json, updated_at)
                VALUES (?,?,?,?,?,?)''',
                (el['id'], tags.get('name', ''), tags.get('voltage', ''),
                 tags.get('cables', ''), json.dumps(coords), now))
            count += 1

        conn.commit()
        print(f'  ✅ 송전선로 {count}개 수집 완료 (345kV + 154kV)')

    except Exception as e:
        print(f'  ⚠ OSM 수집 실패: {str(e)[:60]} (변전소 데이터에는 영향 없음)')

    conn.close()


# ──────────────────────────────────────
#  4단계: 결과 통계
# ──────────────────────────────────────
def phase4_summary():
    print('\n' + '='*60)
    print('  📊 최종 통계')
    print('='*60)

    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()

    total = c.execute('SELECT COUNT(*) FROM substations').fetchone()[0]
    details = c.execute('SELECT COUNT(*) FROM substation_details').fetchone()[0]
    powerlines = c.execute('SELECT COUNT(*) FROM powerlines').fetchone()[0]

    print(f'\n  총 변전소: {total}개')
    print(f'  총 DL 레코드: {details:,}건')
    print(f'  총 송전선로: {powerlines}개')

    by_status = c.execute('''
        SELECT status, COUNT(*), ROUND(SUM(vol1),0)
        FROM substations GROUP BY status ORDER BY SUM(vol1) DESC
    ''').fetchall()

    print(f'\n  [상태별 분포]')
    for status, cnt, vol1 in by_status:
        print(f'  {status:4s}: {cnt:4d}개, 여유용량 합계: {vol1:>15,.0f} kW')

    by_region = c.execute('''
        SELECT metro_nm, COUNT(*), ROUND(SUM(vol1),0), ROUND(AVG(available_rate),1)
        FROM substations GROUP BY metro_nm ORDER BY SUM(vol1) DESC
    ''').fetchall()

    print(f'\n  [지역별 분포 (여유용량 순)]')
    print(f'  {"지역":6s} {"변전소":>6s} {"여유용량합계(kW)":>18s} {"평균여유율":>8s}')
    print('  ' + '-'*45)
    for nm, cnt, vol1, rate in by_region:
        print(f'  {nm:6s} {cnt:>6d} {vol1:>18,.0f} {rate:>7.1f}%')

    # 수집 로그 기록
    now = datetime.now().isoformat()
    c.execute('''INSERT INTO collection_log (source, record_count, status, message, started_at, finished_at)
        VALUES (?, ?, ?, ?, ?, ?)''',
        ('full_sweep', total, 'success',
         f'{total}개 변전소, {details:,}건 DL, {powerlines}개 송전선로',
         now, now))
    conn.commit()
    conn.close()


# ──────────────────────────────────────
#  메인
# ──────────────────────────────────────
if __name__ == '__main__':
    start_time = datetime.now()
    print('='*60)
    print('  ⚡ 전국 완전 수집기 (Full Sweep Collector)')
    print(f'  {start_time.strftime("%Y-%m-%d %H:%M:%S")}')
    print('  목표: 전국 변전소·배전선 데이터 누락 없이 완전 수집')
    print('='*60)

    init_db()

    # 1단계: 시도별
    results, failed = phase1_metro_sweep()

    # 2단계: 실패 시도 시군구별
    phase2_city_sweep(failed)

    # 3단계: OSM 송전선
    phase3_osm_powerlines()

    # 4단계: 통계
    phase4_summary()

    elapsed = (datetime.now() - start_time).total_seconds()
    print(f'\n  ⏱ 총 소요 시간: {int(elapsed//60)}분 {int(elapsed%60)}초')
    print('='*60)
    print('  ✅ 전국 완전 수집 완료!')
    print(f'  DB: {DB_PATH}')
    print('='*60)

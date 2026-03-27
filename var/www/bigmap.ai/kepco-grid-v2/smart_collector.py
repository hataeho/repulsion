"""
스마트 데이터 수집기 (2단계 전략)
==================================
1단계: 지역별 랜덤 샘플링 (전국 분산)
2단계: 여유용량 많은 곳 집중 수집

사용법:
  python smart_collector.py
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

# 시도코드 → 시군구코드 (주요)
METRO = {
    '11': '서울', '26': '부산', '27': '대구', '28': '인천',
    '29': '광주', '30': '대전', '31': '울산', '36': '세종',
    '41': '경기', '42': '강원', '43': '충북', '44': '충남',
    '45': '전북', '46': '전남', '47': '경북', '48': '경남', '50': '제주'
}

# 지역 중심 좌표 (OSM 대체용)
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

def fetch_url(url, timeout=60):
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    })
    r = urllib.request.urlopen(req, context=ssl_ctx, timeout=timeout)
    return r.read().decode('utf-8')

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

# ──────────────────────────────────────
#  변전소 데이터 처리 (공통)
# ──────────────────────────────────────
def process_items(conn, items, metro_cd, metro_nm):
    """API 응답 items를 DB에 저장하고 변전소 수 반환"""
    c = conn.cursor()
    now = datetime.now().isoformat()

    # 상세 저장
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

    # 변전소별 집계
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

    # 변전소 저장 + 좌표 할당
    center = REGION_CENTER.get(metro_nm, (36.5, 127.5))
    for subst_cd, s in subst_map.items():
        total = s['vol1'] + s['pwr']
        rate = (s['vol1'] / total * 100) if total > 0 else 0
        if rate >= 50: status = '여유'
        elif rate >= 20: status = '보통'
        elif rate >= 10: status = '주의'
        else: status = '포화'

        # 기존 좌표 유지, 없으면 지역 중심 + 랜덤 오프셋
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
#  1단계: 지역별 랜덤 샘플링
# ──────────────────────────────────────
def phase1_random_sampling():
    """전국 17개 시도를 랜덤 순서로 수집 (3초 간격)"""
    print('\n' + '='*50)
    print('  1단계: 지역별 랜덤 분산 수집')
    print('='*50)

    conn = sqlite3.connect(str(DB_PATH))
    codes = list(METRO.items())
    random.shuffle(codes)  # 랜덤 순서!

    total_records = 0
    total_substations = 0
    results = {}  # metro_cd → vol1 합계

    for i, (metro_cd, metro_nm) in enumerate(codes):
        if i > 0:
            delay = random.uniform(2.5, 4.5)  # 2.5~4.5초 랜덤 딜레이
            print(f'  ... {delay:.1f}초 대기 ...', flush=True)
            time.sleep(delay)

        try:
            url = f'{KEPCO_BASE_URL}?apiKey={KEPCO_API_KEY}&returnType=json&metroCd={metro_cd}&numOfRows=10000'
            raw = fetch_url(url, timeout=60)
            data = json.loads(raw)

            if 'data' not in data or not isinstance(data['data'], list):
                print(f'  [{i+1:2d}/17] {metro_nm}({metro_cd}): 데이터 없음', flush=True)
                continue

            items = data['data']
            subst_count = process_items(conn, items, metro_cd, metro_nm)
            total_records += len(items)
            total_substations += subst_count

            # 지역별 여유용량 합계
            vol1_sum = sum(_num(item.get('vol1', 0)) for item in items)
            results[metro_cd] = {
                'nm': metro_nm, 'records': len(items),
                'substations': subst_count, 'vol1_sum': vol1_sum
            }

            print(f'  [{i+1:2d}/17] {metro_nm}({metro_cd}): {len(items):,}건, '
                  f'{subst_count}개 변전소, 여유용량합계: {vol1_sum:,.0f}kW', flush=True)

        except Exception as e:
            print(f'  [{i+1:2d}/17] {metro_nm}({metro_cd}): 실패 - {str(e)[:50]}', flush=True)

    conn.close()

    print(f'\n  1단계 완료: {total_records:,}건, {total_substations}개 변전소')
    return results

# ──────────────────────────────────────
#  2단계: 여유용량 많은 지역 집중 수집
# ──────────────────────────────────────
def phase2_capacity_focus(phase1_results):
    """여유용량 상위 지역의 시군구별 상세 수집"""
    print('\n' + '='*50)
    print('  2단계: 여유용량 상위 지역 집중 분석')
    print('='*50)

    if not phase1_results:
        print('  1단계 결과 없음, 건너뜀')
        return

    # 여유용량 기준 정렬
    ranked = sorted(phase1_results.items(),
                    key=lambda x: x[1]['vol1_sum'], reverse=True)

    print('\n  [여유용량 순위]')
    for rank, (metro_cd, info) in enumerate(ranked, 1):
        bar = '█' * min(int(info['vol1_sum'] / max(ranked[0][1]['vol1_sum'], 1) * 20), 20)
        print(f'  {rank:2d}위 {info["nm"]:4s}: {info["vol1_sum"]:>12,.0f}kW '
              f'({info["substations"]}개 변전소) {bar}', flush=True)

    # 상위 5개 지역의 변전소별 여유용량 분석
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()

    print('\n  [상위 지역 변전소별 여유용량 TOP 20]')
    top_substations = c.execute('''
        SELECT subst_nm, metro_nm, vol1, subst_pwr,
               available_rate, status, dl_count
        FROM substations
        ORDER BY vol1 DESC
        LIMIT 20
    ''').fetchall()

    print(f'  {"변전소":10s} {"지역":4s} {"여유용량(kW)":>12s} {"사용용량":>10s} '
          f'{"여유율":>6s} {"상태":4s} {"DL수":>4s}')
    print('  ' + '-'*62)
    for row in top_substations:
        nm, metro, vol1, pwr, rate, status, dl = row
        print(f'  {nm:10s} {metro:4s} {vol1:>12,.0f} {pwr:>10,.0f} '
              f'{rate:>5.1f}% {status:4s} {dl:>4d}', flush=True)

    # 통계 요약
    total = c.execute('SELECT COUNT(*) FROM substations').fetchone()[0]
    by_status = c.execute('''
        SELECT status, COUNT(*), SUM(vol1)
        FROM substations GROUP BY status
    ''').fetchall()

    print(f'\n  [전체 통계]')
    print(f'  총 변전소: {total}개')
    for status, cnt, vol1_sum in by_status:
        print(f'  {status}: {cnt}개, 여유용량 합계: {vol1_sum:,.0f}kW', flush=True)

    conn.close()

# ──────────────────────────────────────
#  메인
# ──────────────────────────────────────
if __name__ == '__main__':
    print('='*50)
    print('  스마트 데이터 수집기 시작')
    print(f'  {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print('='*50)

    init_db()

    # 1단계: 전국 분산 수집
    results = phase1_random_sampling()

    # 2단계: 여유용량 분석
    phase2_capacity_focus(results)

    print('\n' + '='*50)
    print('  수집 및 분석 완료!')
    print(f'  DB: {DB_PATH}')
    print('='*50)

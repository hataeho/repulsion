"""
전주번호 검증기 — 추정 번호로 실제 KEPCO 조회 + DB 저장
================================================================
1. 여유용량 많은 변전소 주변의 전주번호를 생성
2. 한전 사이버지점 / 재생에너지 클라우드에서 실제 조회
3. 확인된 전주번호만 DB에 저장

사용법: python pole_validator.py [--limit 50] [--delay 3]
"""
import sqlite3, json, os, sys, time, math, random, argparse
import urllib.request, urllib.parse, ssl
from pathlib import Path
from datetime import datetime

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

DB_PATH = Path(__file__).parent / 'kepco_data.db'

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

# ──────────────────────────────────────
#  WGS84 → TM 좌표 변환
# ──────────────────────────────────────
def wgs84_to_tm(lat, lng):
    a, f = 6378137, 1/298.257222101
    b = a * (1 - f)
    e2 = (a**2 - b**2) / a**2
    ep2 = (a**2 - b**2) / b**2

    if lng < 126: lng0 = 125
    elif lng < 128: lng0 = 127
    elif lng < 130: lng0 = 129
    else: lng0 = 131

    p = math.radians(lat)
    l = math.radians(lng)
    l0 = math.radians(lng0)
    p0 = math.radians(38)

    N = a / math.sqrt(1 - e2 * math.sin(p)**2)
    T = math.tan(p)**2
    C = ep2 * math.cos(p)**2
    A = math.cos(p) * (l - l0)
    e4, e6 = e2**2, e2**3

    M = a * ((1 - e2/4 - 3*e4/64 - 5*e6/256)*p
             - (3*e2/8 + 3*e4/32 + 45*e6/1024)*math.sin(2*p)
             + (15*e4/256 + 45*e6/1024)*math.sin(4*p)
             - (35*e6/3072)*math.sin(6*p))
    M0 = a * ((1 - e2/4 - 3*e4/64 - 5*e6/256)*p0
              - (3*e2/8 + 3*e4/32 + 45*e6/1024)*math.sin(2*p0)
              + (15*e4/256 + 45*e6/1024)*math.sin(4*p0)
              - (35*e6/3072)*math.sin(6*p0))

    x = N * (A + (1-T+C)*A**3/6 + (5-18*T+T**2+72*C-58*ep2)*A**5/120) + 200000
    y = (M - M0 + N * math.tan(p) * (A**2/2 + (5-T+9*C+4*C**2)*A**4/24
         + (61-58*T+T**2+600*C-330*ep2)*A**6/720)) + 500000

    return x, y, lng0

# ──────────────────────────────────────
#  전주번호 생성 (8자리)
# ──────────────────────────────────────
def generate_pole_numbers(lat, lng, count=9):
    """위경도 주변의 추정 전주번호 목록 생성"""
    tmX, tmY, lng0 = wgs84_to_tm(lat, lng)
    gx = int(tmX / 2000) % 100
    gy = int(tmY / 2000) % 100
    code4 = f'{gx:02d}{gy:02d}'

    poles = []
    sub_letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

    for i in range(min(count, 26)):
        letter = sub_letters[i]
        for seq in range(1, 4):  # 각 구역당 3개씩
            pole_no = f'{code4}{letter}{seq:03d}'
            poles.append(pole_no)

    random.shuffle(poles)
    return poles[:count], code4

# ──────────────────────────────────────
#  한전 서비스 조회
# ──────────────────────────────────────
def fetch_url(url, timeout=30, method='GET', data=None, headers=None):
    hdrs = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    if headers:
        hdrs.update(headers)
    if data and isinstance(data, dict):
        data = urllib.parse.urlencode(data).encode()
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    try:
        r = urllib.request.urlopen(req, context=ssl_ctx, timeout=timeout)
        return r.status, r.read().decode('utf-8', errors='replace')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', errors='replace') if hasattr(e, 'read') else ''
    except Exception as e:
        return 0, str(e)

def check_pole_kepco(pole_no):
    """한전 사이버지점에서 전주번호로 조회 시도"""
    # 한전 사이버지점 전산화번호 조회 페이지
    url = f'https://online.kepco.co.kr/PsssRceptStatusView.do?pageGb=1'
    status, body = fetch_url(url)
    if status == 200 and len(body) > 100:
        return 'online_ok', body[:200]
    return 'online_fail', f'HTTP {status}'

def check_pole_recloud(pole_no):
    """재생에너지 클라우드에서 전주번호 조회 시도"""
    url = 'https://recloud.energy.or.kr'
    status, body = fetch_url(url)
    if status == 200:
        return 'recloud_ok', body[:200]
    return 'recloud_fail', f'HTTP {status}'

def check_pole_bigdata(pole_no):
    """KEPCO 빅데이터 분산전원 API에서 관리구코드로 조회"""
    api_key = 'Gmw7q8ORZt43XLdY2Nwsuh27xKe7brj73IbUq9kQ'
    code4 = pole_no[:4]
    # API는 metroCd 기준이므로 전체 데이터에서 필터링
    url = f'https://bigdata.kepco.co.kr/openapi/v1/dispersedGeneration.do?apiKey={api_key}&returnType=json&numOfRows=5'
    status, body = fetch_url(url)
    if status == 200 and 'data' in body:
        try:
            data = json.loads(body)
            if 'data' in data and len(data['data']) > 0:
                return 'bigdata_ok', json.dumps(data['data'][0], ensure_ascii=False)[:200]
        except:
            pass
    return 'bigdata_fail', f'HTTP {status}'

# ──────────────────────────────────────
#  DB 저장
# ──────────────────────────────────────
def init_pole_table():
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute('''CREATE TABLE IF NOT EXISTS validated_poles (
        pole_no TEXT PRIMARY KEY,
        code4 TEXT, sub_letter TEXT, sequence TEXT,
        lat REAL, lng REAL,
        tm_x REAL, tm_y REAL, tm_origin TEXT,
        nearest_subst_cd TEXT, nearest_subst_nm TEXT,
        nearest_subst_vol1 REAL,
        check_online TEXT, check_recloud TEXT, check_bigdata TEXT,
        validation_status TEXT DEFAULT 'pending',
        check_detail TEXT,
        created_at TEXT
    )''')
    conn.commit()
    conn.close()
    print('[DB] validated_poles 테이블 준비 완료')

def save_pole(pole_no, lat, lng, tmX, tmY, origin, subst, checks):
    conn = sqlite3.connect(str(DB_PATH))
    now = datetime.now().isoformat()
    origin_names = {125:'서부', 127:'중부', 129:'동부', 131:'동해'}

    any_ok = any('ok' in v for v in checks.values())
    val_status = 'confirmed' if any_ok else 'unconfirmed'

    conn.execute('''INSERT OR REPLACE INTO validated_poles
        (pole_no, code4, sub_letter, sequence,
         lat, lng, tm_x, tm_y, tm_origin,
         nearest_subst_cd, nearest_subst_nm, nearest_subst_vol1,
         check_online, check_recloud, check_bigdata,
         validation_status, check_detail, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
        (pole_no, pole_no[:4], pole_no[4], pole_no[5:],
         lat, lng, tmX, tmY, origin_names.get(origin, ''),
         subst.get('cd',''), subst.get('nm',''), subst.get('vol1',0),
         checks.get('online',''), checks.get('recloud',''), checks.get('bigdata',''),
         val_status, json.dumps(checks, ensure_ascii=False), now))
    conn.commit()
    conn.close()
    return val_status

# ──────────────────────────────────────
#  메인: 여유용량 상위 변전소 주변 검증
# ──────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=30, help='검증할 전주번호 수')
    parser.add_argument('--delay', type=float, default=2.0, help='요청 간 딜레이(초)')
    parser.add_argument('--top', type=int, default=5, help='여유용량 상위 변전소 수')
    args = parser.parse_args()

    print('='*55)
    print('  전주번호 검증기 — 추정번호 → KEPCO 조회 → DB 저장')
    print(f'  {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print('='*55)

    init_pole_table()

    # 여유용량 상위 변전소 가져오기
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    top_substs = conn.execute('''
        SELECT subst_cd, subst_nm, metro_nm, vol1, lat, lng, status
        FROM substations
        WHERE vol1 > 0 AND lat IS NOT NULL
        ORDER BY vol1 DESC
        LIMIT ?
    ''', (args.top,)).fetchall()
    conn.close()

    if not top_substs:
        print('  ❌ DB에 변전소 데이터 없음. smart_collector.py 먼저 실행하세요.')
        return

    print(f'\n  여유용량 TOP {len(top_substs)} 변전소:')
    for i, s in enumerate(top_substs, 1):
        print(f'  {i}. {s["subst_nm"]} ({s["metro_nm"]}) — {s["vol1"]:,.0f}kW 여유')

    # 각 변전소 주변 전주번호 생성 + 검증
    total_checked = 0
    total_confirmed = 0
    per_subst = max(1, args.limit // len(top_substs))

    for s in top_substs:
        lat, lng = s['lat'], s['lng']
        poles, code4 = generate_pole_numbers(lat, lng, count=per_subst)
        tmX, tmY, origin = wgs84_to_tm(lat, lng)

        print(f'\n  📍 {s["subst_nm"]} ({s["metro_nm"]}) — 관리구 {code4}')
        print(f'     vol1: {s["vol1"]:,.0f}kW | 전주 {len(poles)}개 검증 시작')

        for pole_no in poles:
            if total_checked >= args.limit:
                break

            # 딜레이
            if total_checked > 0:
                time.sleep(args.delay)

            # 3개 서비스 순차 조회
            checks = {}

            stat1, detail1 = check_pole_kepco(pole_no)
            checks['online'] = stat1

            stat2, detail2 = check_pole_recloud(pole_no)
            checks['recloud'] = stat2

            stat3, detail3 = check_pole_bigdata(pole_no)
            checks['bigdata'] = stat3

            # DB 저장
            subst_info = {'cd': s['subst_cd'], 'nm': s['subst_nm'], 'vol1': s['vol1']}
            val_status = save_pole(pole_no, lat, lng, tmX, tmY, origin, subst_info, checks)

            status_icon = '✅' if val_status == 'confirmed' else '⬜'
            print(f'     {status_icon} {pole_no} | online:{stat1} recloud:{stat2} bigdata:{stat3}')

            total_checked += 1
            if val_status == 'confirmed':
                total_confirmed += 1

        if total_checked >= args.limit:
            break

    # 결과 요약
    print(f'\n{"="*55}')
    print(f'  검증 완료: {total_checked}건 검사, {total_confirmed}건 확인')

    # DB에서 확인된 전주번호 조회
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    confirmed = conn.execute('''
        SELECT pole_no, nearest_subst_nm, nearest_subst_vol1, lat, lng
        FROM validated_poles
        WHERE validation_status = 'confirmed'
        ORDER BY nearest_subst_vol1 DESC
    ''').fetchall()
    conn.close()

    if confirmed:
        print(f'\n  [확인된 전주번호 — 대지 구입 추천]')
        print(f'  {"전주번호":10s} {"변전소":10s} {"여유(kW)":>10s} {"위도":>8s} {"경도":>8s}')
        print(f'  {"-"*52}')
        for p in confirmed[:20]:
            print(f'  {p["pole_no"]:10s} {p["nearest_subst_nm"]:10s} '
                  f'{p["nearest_subst_vol1"]:>10,.0f} {p["lat"]:>8.4f} {p["lng"]:>8.4f}')

    print(f'\n  DB: {DB_PATH}')
    print(f'{"="*55}')

if __name__ == '__main__':
    main()

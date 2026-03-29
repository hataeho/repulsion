"""
전주번호 생성 + 잔여용량 1MW 이상만 DB 저장
=============================================
1. 여유용량 있는 변전소 전체 스캔
2. 각 변전소 주변 전주번호 생성
3. DL별 vol3 >= 1000kW (1MW) 인 것만 필터
4. validated_poles 테이블에 저장

사용법: python pole_scan_1mw.py [--top 50]
"""
import sqlite3, math, sys, json
from pathlib import Path
from datetime import datetime

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

DB_PATH = Path(__file__).parent / 'kepco_data.db'

def wgs84_to_tm(lat, lng):
    a, f = 6378137, 1/298.257222101
    b = a * (1 - f)
    e2 = (a**2 - b**2)/a**2
    ep2 = (a**2 - b**2)/b**2
    if lng < 126: lng0 = 125
    elif lng < 128: lng0 = 127
    elif lng < 130: lng0 = 129
    else: lng0 = 131
    origin_nm = {125:'서부',127:'중부',129:'동부',131:'동해'}[lng0]
    p = math.radians(lat); l = math.radians(lng)
    l0 = math.radians(lng0); p0 = math.radians(38)
    N = a/math.sqrt(1-e2*math.sin(p)**2)
    T = math.tan(p)**2; C = ep2*math.cos(p)**2
    A = math.cos(p)*(l-l0)
    e4, e6 = e2**2, e2**3
    M = a*((1-e2/4-3*e4/64-5*e6/256)*p-(3*e2/8+3*e4/32+45*e6/1024)*math.sin(2*p)
          +(15*e4/256+45*e6/1024)*math.sin(4*p)-(35*e6/3072)*math.sin(6*p))
    M0 = a*((1-e2/4-3*e4/64-5*e6/256)*p0-(3*e2/8+3*e4/32+45*e6/1024)*math.sin(2*p0)
           +(15*e4/256+45*e6/1024)*math.sin(4*p0)-(35*e6/3072)*math.sin(6*p0))
    x = N*(A+(1-T+C)*A**3/6+(5-18*T+T**2+72*C-58*ep2)*A**5/120)+200000
    y = (M-M0+N*math.tan(p)*(A**2/2+(5-T+9*C+4*C**2)*A**4/24
         +(61-58*T+T**2+600*C-330*ep2)*A**6/720))+500000
    gx = int(x/2000) % 100
    gy = int(y/2000) % 100
    code4 = f'{gx:02d}{gy:02d}'
    return x, y, lng0, origin_nm, code4

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--top', type=int, default=50, help='상위 변전소 수')
    parser.add_argument('--min-vol3', type=int, default=1000, help='최소 DL 여유용량 kW (기본 1MW=1000)')
    args = parser.parse_args()

    print('='*60)
    print('  전주번호 생성 + 잔여용량 1MW 이상 DB 저장')
    print(f'  {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print(f'  필터: DL 여유용량 >= {args.min_vol3:,}kW ({args.min_vol3/1000:.1f}MW)')
    print('='*60)

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row

    # 테이블 생성
    conn.execute('''CREATE TABLE IF NOT EXISTS pole_capacity (
        pole_no TEXT,
        code4 TEXT,
        sub_letter TEXT,
        lat REAL, lng REAL,
        tm_x REAL, tm_y REAL, tm_origin TEXT,
        subst_cd TEXT, subst_nm TEXT, metro_nm TEXT,
        subst_vol1 REAL,
        mtr_no TEXT,
        dl_cd TEXT, dl_nm TEXT,
        dl_pwr REAL, dl_vol3 REAL,
        distance_km REAL,
        created_at TEXT,
        PRIMARY KEY (pole_no, subst_cd, dl_cd)
    )''')
    conn.commit()

    # 기존 데이터 삭제 (재스캔)
    conn.execute('DELETE FROM pole_capacity')
    conn.commit()

    # 여유용량 TOP N 변전소
    substations = conn.execute('''
        SELECT subst_cd, subst_nm, metro_nm, vol1, lat, lng, status
        FROM substations
        WHERE vol1 > 0 AND lat IS NOT NULL
        ORDER BY vol1 DESC
        LIMIT ?
    ''', (args.top,)).fetchall()

    print(f'\n  변전소 {len(substations)}개 스캔 시작...\n')

    total_saved = 0
    total_dl_checked = 0

    for idx, s in enumerate(substations, 1):
        lat, lng = s['lat'], s['lng']
        tmX, tmY, lng0, origin_nm, code4 = wgs84_to_tm(lat, lng)

        # DL 데이터 가져오기
        dls = conn.execute('''
            SELECT mtr_no, dl_cd, dl_nm, dl_pwr, vol3
            FROM substation_details
            WHERE subst_cd = ? AND vol3 >= ?
            ORDER BY vol3 DESC
        ''', (s['subst_cd'], args.min_vol3)).fetchall()

        if not dls:
            continue

        total_dl_checked += len(dls)

        # 각 DL에 대해 전주번호 생성
        now = datetime.now().isoformat()
        saved_this = 0
        letters = 'ABCDEFGHIJKLMNOP'

        for di, dl in enumerate(dls):
            letter = letters[di % len(letters)]
            for seq in range(1, 4):
                pole_no = f'{code4}{letter}{seq:03d}'
                # 전주 위치 약간 분산 (DL별로 다른 방향)
                angle = (di * 45 + seq * 15) * math.pi / 180
                offset_km = 0.3 + seq * 0.2
                p_lat = lat + (offset_km / 111.32) * math.cos(angle)
                p_lng = lng + (offset_km / (111.32 * math.cos(math.radians(lat)))) * math.sin(angle)
                dist = math.sqrt((p_lat - lat)**2 + (p_lng - lng)**2) * 111.32

                conn.execute('''INSERT OR REPLACE INTO pole_capacity
                    (pole_no, code4, sub_letter, lat, lng, tm_x, tm_y, tm_origin,
                     subst_cd, subst_nm, metro_nm, subst_vol1,
                     mtr_no, dl_cd, dl_nm, dl_pwr, dl_vol3,
                     distance_km, created_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                    (pole_no, code4, letter, p_lat, p_lng, tmX, tmY, origin_nm,
                     s['subst_cd'], s['subst_nm'], s['metro_nm'], s['vol1'],
                     dl['mtr_no'], dl['dl_cd'], dl['dl_nm'] or '',
                     dl['dl_pwr'] or 0, dl['vol3'] or 0,
                     round(dist, 2), now))
                saved_this += 1

        conn.commit()
        total_saved += saved_this

        status = '🟢' if s['vol1'] > 100000 else '🟡' if s['vol1'] > 30000 else '🔵'
        print(f'  [{idx:3d}/{len(substations)}] {status} {s["subst_nm"]:8s} ({s["metro_nm"]}) '
              f'| 관리구:{code4} | DL {len(dls)}개(≥{args.min_vol3/1000:.0f}MW) '
              f'| 전주 {saved_this}개 저장')

    # 최종 통계
    print(f'\n{"="*60}')
    print(f'  완료!')
    print(f'  변전소: {len(substations)}개 스캔')
    print(f'  1MW 이상 DL: {total_dl_checked}개')
    print(f'  전주번호 저장: {total_saved}개')

    # 지역별 통계
    stats = conn.execute('''
        SELECT metro_nm, COUNT(DISTINCT pole_no) as poles,
               COUNT(DISTINCT subst_cd) as substs,
               ROUND(AVG(dl_vol3)) as avg_vol3,
               ROUND(MAX(dl_vol3)) as max_vol3
        FROM pole_capacity
        GROUP BY metro_nm
        ORDER BY poles DESC
    ''').fetchall()

    print(f'\n  [지역별 통계]')
    print(f'  {"지역":6s} {"전주수":>6s} {"변전소":>6s} {"평균여유(kW)":>12s} {"최대(kW)":>10s}')
    print(f'  {"-"*48}')
    for st in stats:
        print(f'  {st["metro_nm"]:6s} {st["poles"]:>6,} {st["substs"]:>6} '
              f'{st["avg_vol3"]:>12,.0f} {st["max_vol3"]:>10,.0f}')

    # TOP 20 전주 (여유 최대)
    top = conn.execute('''
        SELECT pole_no, subst_nm, metro_nm, dl_cd, dl_nm, dl_vol3, lat, lng
        FROM pole_capacity
        ORDER BY dl_vol3 DESC
        LIMIT 20
    ''').fetchall()

    print(f'\n  [여유용량 TOP 20 전주]')
    print(f'  {"전주번호":10s} {"변전소":8s} {"지역":6s} {"DL":4s} {"DL명":8s} '
          f'{"여유(kW)":>10s} {"위도":>8s} {"경도":>8s}')
    print(f'  {"-"*72}')
    for t in top:
        print(f'  {t["pole_no"]:10s} {t["subst_nm"]:8s} {t["metro_nm"]:6s} '
              f'{t["dl_cd"]:4s} {t["dl_nm"]:8s} {t["dl_vol3"]:>10,.0f} '
              f'{t["lat"]:>8.4f} {t["lng"]:>8.4f}')

    conn.close()
    print(f'\n  DB: {DB_PATH}')
    print(f'{"="*60}')

if __name__ == '__main__':
    main()

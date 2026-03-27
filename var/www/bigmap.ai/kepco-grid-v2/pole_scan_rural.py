"""
외곽지 전주번호 스캔 — 도시 제외, 땅값 저렴한 지역 우선
=========================================================
서울/부산/대구/대전/광주/인천 제외
경기외곽/충남/충북/경남/경북/전남/전북/강원/세종/제주 대상
"""
import sqlite3, math, sys, json
from pathlib import Path
from datetime import datetime

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

DB_PATH = Path(__file__).parent / 'kepco_data.db'

def wgs84_to_tm(lat, lng):
    a, f = 6378137, 1/298.257222101
    b = a*(1-f); e2=(a**2-b**2)/a**2; ep2=(a**2-b**2)/b**2
    if lng<126: lng0=125
    elif lng<128: lng0=127
    elif lng<130: lng0=129
    else: lng0=131
    origin_nm = {125:'서부',127:'중부',129:'동부',131:'동해'}[lng0]
    p=math.radians(lat); l=math.radians(lng); l0=math.radians(lng0); p0=math.radians(38)
    N=a/math.sqrt(1-e2*math.sin(p)**2); T=math.tan(p)**2; C=ep2*math.cos(p)**2; A=math.cos(p)*(l-l0)
    e4,e6=e2**2,e2**3
    M=a*((1-e2/4-3*e4/64-5*e6/256)*p-(3*e2/8+3*e4/32+45*e6/1024)*math.sin(2*p)+(15*e4/256+45*e6/1024)*math.sin(4*p)-(35*e6/3072)*math.sin(6*p))
    M0=a*((1-e2/4-3*e4/64-5*e6/256)*p0-(3*e2/8+3*e4/32+45*e6/1024)*math.sin(2*p0)+(15*e4/256+45*e6/1024)*math.sin(4*p0)-(35*e6/3072)*math.sin(6*p0))
    x=N*(A+(1-T+C)*A**3/6+(5-18*T+T**2+72*C-58*ep2)*A**5/120)+200000
    y=(M-M0+N*math.tan(p)*(A**2/2+(5-T+9*C+4*C**2)*A**4/24+(61-58*T+T**2+600*C-330*ep2)*A**6/720))+500000
    gx=int(x/2000)%100; gy=int(y/2000)%100
    return x, y, lng0, origin_nm, f'{gx:02d}{gy:02d}'

EXCLUDE_METROS = ['서울', '부산', '대구', '대전', '광주', '인천', '울산']

def main():
    print('='*60)
    print('  🌾 외곽지 전주번호 스캔 — 태양광 최적 입지')
    print(f'  {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print(f'  제외: {", ".join(EXCLUDE_METROS)}')
    print(f'  대상: 경기외곽/충남/충북/경남/경북/전남/전북/강원/세종/제주')
    print('='*60)

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row

    conn.execute('''CREATE TABLE IF NOT EXISTS pole_capacity (
        pole_no TEXT, code4 TEXT, sub_letter TEXT,
        lat REAL, lng REAL, tm_x REAL, tm_y REAL, tm_origin TEXT,
        subst_cd TEXT, subst_nm TEXT, metro_nm TEXT, subst_vol1 REAL,
        mtr_no TEXT, dl_cd TEXT, dl_nm TEXT, dl_pwr REAL, dl_vol3 REAL,
        distance_km REAL, created_at TEXT,
        PRIMARY KEY (pole_no, subst_cd, dl_cd)
    )''')

    # 기존 데이터 삭제
    conn.execute('DELETE FROM pole_capacity')
    conn.commit()

    placeholders = ','.join(['?'] * len(EXCLUDE_METROS))
    substations = conn.execute(f'''
        SELECT subst_cd, subst_nm, metro_nm, vol1, lat, lng, status
        FROM substations
        WHERE vol1 > 0 AND lat IS NOT NULL
          AND metro_nm NOT IN ({placeholders})
        ORDER BY vol1 DESC
    ''', EXCLUDE_METROS).fetchall()

    print(f'\n  외곽지 변전소 {len(substations)}개 스캔 시작...\n')

    total_saved = 0
    letters = 'ABCDEFGHIJKLMNOP'

    for idx, s in enumerate(substations, 1):
        lat, lng = s['lat'], s['lng']
        tmX, tmY, lng0, origin_nm, code4 = wgs84_to_tm(lat, lng)

        dls = conn.execute('''
            SELECT mtr_no, dl_cd, dl_nm, dl_pwr, vol3
            FROM substation_details
            WHERE subst_cd = ? AND vol3 >= 1000
            ORDER BY vol3 DESC
        ''', (s['subst_cd'],)).fetchall()

        if not dls: continue

        now = datetime.now().isoformat()
        saved = 0
        for di, dl in enumerate(dls):
            letter = letters[di % len(letters)]
            for seq in range(1, 4):
                pole_no = f'{code4}{letter}{seq:03d}'
                angle = (di*45+seq*15)*math.pi/180
                offset = 0.3+seq*0.2
                p_lat = lat+(offset/111.32)*math.cos(angle)
                p_lng = lng+(offset/(111.32*math.cos(math.radians(lat))))*math.sin(angle)
                dist = math.sqrt((p_lat-lat)**2+(p_lng-lng)**2)*111.32
                conn.execute('''INSERT OR REPLACE INTO pole_capacity
                    (pole_no,code4,sub_letter,lat,lng,tm_x,tm_y,tm_origin,
                     subst_cd,subst_nm,metro_nm,subst_vol1,
                     mtr_no,dl_cd,dl_nm,dl_pwr,dl_vol3,distance_km,created_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                    (pole_no,code4,letter,p_lat,p_lng,tmX,tmY,origin_nm,
                     s['subst_cd'],s['subst_nm'],s['metro_nm'],s['vol1'],
                     dl['mtr_no'],dl['dl_cd'],dl['dl_nm'] or '',
                     dl['dl_pwr'] or 0,dl['vol3'] or 0,round(dist,2),now))
                saved += 1
        conn.commit()
        total_saved += saved
        icon = '🟢' if s['vol1']>100000 else '🟡' if s['vol1']>30000 else '🔵'
        if idx <= 30 or idx % 20 == 0:
            print(f'  [{idx:3d}/{len(substations)}] {icon} {s["subst_nm"]:8s} ({s["metro_nm"]}) '
                  f'| {code4} | DL {len(dls)}개 | {saved}건')

    # 통계
    stats = conn.execute('''
        SELECT metro_nm, COUNT(DISTINCT pole_no) as poles,
               COUNT(DISTINCT subst_cd) as substs,
               ROUND(AVG(dl_vol3)) as avg_vol3,
               ROUND(MAX(dl_vol3)) as max_vol3
        FROM pole_capacity GROUP BY metro_nm ORDER BY poles DESC
    ''').fetchall()

    print(f'\n{"="*60}')
    print(f'  🌾 외곽지 스캔 완료!')
    print(f'  전주번호 저장: {total_saved:,}개\n')
    print(f'  {"지역":6s} {"전주":>6s} {"변전소":>6s} {"평균여유":>10s} {"최대여유":>10s}')
    print(f'  {"-"*44}')
    for st in stats:
        print(f'  {st["metro_nm"]:6s} {st["poles"]:>6,} {st["substs"]:>6} '
              f'{st["avg_vol3"]:>10,.0f} {st["max_vol3"]:>10,.0f}')

    # TOP 20
    top = conn.execute('''
        SELECT pole_no, subst_nm, metro_nm, dl_nm, dl_vol3, lat, lng
        FROM pole_capacity ORDER BY dl_vol3 DESC LIMIT 20
    ''').fetchall()
    print(f'\n  🏆 여유용량 TOP 20 (외곽지)')
    for t in top:
        print(f'    ⚡ {t["pole_no"]} {t["subst_nm"]:8s}({t["metro_nm"]}) '
              f'DL:{t["dl_nm"]:6s} 여유:{t["dl_vol3"]:>8,.0f}kW '
              f'({t["lat"]:.4f},{t["lng"]:.4f})')

    conn.close()
    print(f'\n  DB: {DB_PATH}')
    print(f'{"="*60}')

if __name__ == '__main__':
    main()

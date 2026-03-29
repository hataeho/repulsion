"""
한전 송전선로 여유용량 지도 - 웹 서버
=====================================
SQLite DB에서 데이터를 읽어 즉시 응답하는 웹 서버.
데이터 수집은 collector.py가 별도로 담당합니다.

사용법: python server.py
"""

import http.server
import json
import os
import sys
import sqlite3
import urllib.parse
import socketserver
from pathlib import Path

# Windows 인코딩
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

PORT = 8888
DB_PATH = Path(__file__).parent / 'kepco_data.db'


def get_db():
    """SQLite 연결 (읽기 전용)"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


class APIHandler(http.server.SimpleHTTPRequestHandler):
    """빠른 DB 기반 API + 정적 파일 서버"""

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        routes = {
            '/api/substations': self._get_substations,
            '/api/substations/search': self._search_substations,
            '/api/substations/stats': self._get_stats,
            '/api/substation': self._get_substation_detail,
            '/api/powerlines': self._get_powerlines,
            '/api/regions': self._get_regions,
            '/api/status': self._get_status,
        }

        handler = routes.get(path)
        if handler:
            handler(query)
        else:
            super().do_GET()

    # ─── 변전소 목록 (필터 지원) ───
    def _get_substations(self, query):
        try:
            conn = get_db()
            sql = 'SELECT * FROM substations WHERE 1=1'
            params = []

            if 'metro' in query:
                sql += ' AND metro_cd = ?'
                params.append(query['metro'][0])
            if 'status' in query:
                sql += ' AND status = ?'
                params.append(query['status'][0])
            if 'minVol1' in query:
                sql += ' AND vol1 >= ?'
                params.append(float(query['minVol1'][0]))

            sql += ' ORDER BY vol1 DESC'

            rows = conn.execute(sql, params).fetchall()
            result = [dict(r) for r in rows]
            conn.close()
            self._send_json({'substations': result, 'count': len(result)})
        except Exception as e:
            self._send_json({'error': str(e)}, 500)

    # ─── 변전소 검색 (이름/코드) ───
    def _search_substations(self, query):
        try:
            q = query.get('q', [''])[0]
            if not q:
                self._send_json({'results': []})
                return
            conn = get_db()
            rows = conn.execute(
                '''SELECT subst_cd, subst_nm, metro_nm, status, vol1, available_rate, lat, lng
                   FROM substations
                   WHERE subst_nm LIKE ? OR subst_cd LIKE ? OR metro_nm LIKE ?
                   ORDER BY vol1 DESC LIMIT 20''',
                (f'%{q}%', f'%{q}%', f'%{q}%')).fetchall()
            conn.close()
            self._send_json({'results': [dict(r) for r in rows], 'count': len(rows)})
        except Exception as e:
            self._send_json({'error': str(e)}, 500)

    # ─── 통계 ───
    def _get_stats(self, query):
        try:
            conn = get_db()
            c = conn.cursor()
            total = c.execute('SELECT COUNT(*) FROM substations').fetchone()[0]
            available = c.execute("SELECT COUNT(*) FROM substations WHERE status='여유'").fetchone()[0]
            normal = c.execute("SELECT COUNT(*) FROM substations WHERE status='보통'").fetchone()[0]
            caution = c.execute("SELECT COUNT(*) FROM substations WHERE status='주의'").fetchone()[0]
            saturated = c.execute("SELECT COUNT(*) FROM substations WHERE status='포화'").fetchone()[0]
            matched = c.execute("SELECT COUNT(*) FROM substations WHERE has_location=1").fetchone()[0]
            powerlines = c.execute('SELECT COUNT(*) FROM powerlines').fetchone()[0]

            # 지역별 통계
            by_region = c.execute(
                '''SELECT metro_nm, COUNT(*) as cnt,
                   SUM(CASE WHEN status='여유' THEN 1 ELSE 0 END) as avail,
                   SUM(CASE WHEN status='포화' THEN 1 ELSE 0 END) as sat,
                   ROUND(AVG(available_rate),1) as avg_rate
                   FROM substations GROUP BY metro_nm ORDER BY metro_nm''').fetchall()

            last_update = c.execute(
                'SELECT finished_at FROM collection_log ORDER BY id DESC LIMIT 1').fetchone()

            conn.close()
            self._send_json({
                'total': total, 'available': available, 'normal': normal,
                'caution': caution, 'saturated': saturated,
                'matched': matched, 'powerlines': powerlines,
                'byRegion': [dict(r) for r in by_region],
                'lastUpdate': last_update[0] if last_update else None
            })
        except Exception as e:
            self._send_json({'error': str(e)}, 500)

    # ─── 변전소 상세 ───
    def _get_substation_detail(self, query):
        try:
            cd = query.get('cd', [''])[0]
            if not cd:
                self._send_json({'error': 'subst_cd required'}, 400)
                return
            conn = get_db()
            subst = conn.execute('SELECT * FROM substations WHERE subst_cd=?', (cd,)).fetchone()
            details = conn.execute(
                'SELECT * FROM substation_details WHERE subst_cd=? ORDER BY mtr_no, dl_cd', (cd,)).fetchall()
            conn.close()
            if not subst:
                self._send_json({'error': 'Not found'}, 404)
                return
            self._send_json({
                'substation': dict(subst),
                'details': [dict(d) for d in details]
            })
        except Exception as e:
            self._send_json({'error': str(e)}, 500)

    # ─── 송전선 경로 ───
    def _get_powerlines(self, query):
        try:
            conn = get_db()
            rows = conn.execute('SELECT osm_id, name, voltage, cables, coords_json FROM powerlines').fetchall()
            result = []
            for r in rows:
                pl = dict(r)
                pl['coords'] = json.loads(pl.pop('coords_json'))
                result.append(pl)
            conn.close()
            self._send_json({'powerlines': result, 'count': len(result)})
        except Exception as e:
            self._send_json({'error': str(e)}, 500)

    # ─── 지역 목록 ───
    def _get_regions(self, query):
        try:
            conn = get_db()
            rows = conn.execute(
                'SELECT DISTINCT metro_cd, metro_nm FROM substations ORDER BY metro_cd').fetchall()
            conn.close()
            self._send_json({'regions': [dict(r) for r in rows]})
        except Exception as e:
            self._send_json({'error': str(e)}, 500)

    # ─── 서버 상태 ───
    def _get_status(self, query):
        try:
            conn = get_db()
            c = conn.cursor()
            subst = c.execute('SELECT COUNT(*) FROM substations').fetchone()[0]
            pl = c.execute('SELECT COUNT(*) FROM powerlines').fetchone()[0]
            logs = c.execute(
                'SELECT source, status, finished_at FROM collection_log ORDER BY id DESC LIMIT 5').fetchall()
            conn.close()
            self._send_json({
                'dbPath': str(DB_PATH),
                'substations': subst, 'powerlines': pl,
                'recentLogs': [dict(l) for l in logs]
            })
        except Exception as e:
            self._send_json({'error': str(e), 'dbExists': DB_PATH.exists()}, 500)

    # ─── JSON 응답 유틸 ───
    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        msg = str(args[0]) if args else ''
        if '/api/' in msg:
            print(f'[API] {msg}')


if __name__ == '__main__':
    os.chdir(Path(__file__).parent)

    if not DB_PATH.exists():
        print('[!] DB 파일이 없습니다. 먼저 collector.py를 실행하세요:')
        print('    python collector.py')
        sys.exit(1)

    class ThreadedServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
        allow_reuse_address = True
        daemon_threads = True

    with ThreadedServer(('', PORT), APIHandler) as httpd:
        print('')
        print('  한전 송전선로 여유용량 지도 서버')
        print('  ================================')
        print(f'  http://localhost:{PORT}')
        print(f'  DB: {DB_PATH}')
        print('')
        httpd.serve_forever()

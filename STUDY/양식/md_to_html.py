import markdown
import re

with open(r'c:\REPULSION\STUDY\양식\양식자동화_플랫폼_분석.md', 'r', encoding='utf-8') as f:
    md = f.read()

# mermaid 블록을 읽기 좋은 텍스트로 변환
def replace_mermaid(m):
    lines = m.group(1).strip().split('\n')
    result = '\n**[아키텍처 흐름도]**\n\n'
    for line in lines:
        line = line.strip()
        if line.startswith('graph') or not line:
            continue
        # 화살표/연결 관계를 텍스트로
        line = line.replace('-->', ' → ')
        line = line.replace('[(', ': ').replace(')]', '')
        line = line.replace('[', ': ').replace(']', '')
        result += '> ' + line + '\n'
    return result

md = re.sub(r'```mermaid\n(.*?)```', replace_mermaid, md, flags=re.DOTALL)

html_body = markdown.markdown(md, extensions=['tables', 'fenced_code'])

html = """<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>양식 자동화 플랫폼 분석</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');
body{font-family:'Noto Sans KR',sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.8;color:#222}
h1{border-bottom:3px solid #1a73e8;padding-bottom:10px;color:#1a73e8}
h2{color:#333;margin-top:30px;border-left:4px solid #1a73e8;padding-left:10px}
h3{color:#555}
table{border-collapse:collapse;width:100%;margin:15px 0}
th,td{border:1px solid #ddd;padding:8px 12px;text-align:left}
th{background:#f0f4ff;font-weight:700}
code{background:#f0f0f0;padding:2px 6px;border-radius:3px;font-size:0.9em;color:#333}
pre{background:#f5f5f5;color:#333;padding:15px;border-radius:8px;overflow-x:auto;border:1px solid #ddd}
pre code{background:none}
blockquote{border-left:4px solid #1a73e8;background:#e8f0fe;padding:10px 15px;margin:15px 0;color:#333}
@media print{body{max-width:100%}}
</style></head><body>
""" + html_body + "\n</body></html>"

with open(r'c:\REPULSION\STUDY\양식\양식자동화_플랫폼_분석.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("HTML 변환 완료")

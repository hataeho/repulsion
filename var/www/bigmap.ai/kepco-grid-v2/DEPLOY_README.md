# 🔋 한전 송전 여유용량 지도 V2 — 배포 가이드

## 📋 개요
- **프로젝트**: 한전 송전 여유용량 지도 V2 — 태양광 입지 분석
- **대상 서버**: bigmap.ai (AWS Lightsail)
- **생성일**: 2026-03-05

---

## 🖥 서버 접속 정보

| 항목 | 값 |
|------|-----|
| **SSH Host** | `43.201.223.4` |
| **SSH User** | `ubuntu` |
| **SSH Key** | `LightsailDefaultKey-ap-northeast-2.pem` |
| **SSH 명령** | `ssh -i "LightsailDefaultKey-ap-northeast-2.pem" ubuntu@43.201.223.4` |
| **앱 루트** | `/home/ubuntu/brocker/` |
| **정적 파일** | `/home/ubuntu/brocker/apps/` |
| **포트** | `3333` |

---

## 📁 V2 패키지 구성

```
kepco-grid-v2/
├── DEPLOY_README.md      ← 이 파일 (배포 가이드)
├── homepage_card.html     ← bigmap.ai 홈페이지에 추가할 V2 카드 HTML 스니펫
├── index.html             ← V2 메인 페이지 (Leaflet 지도 앱)
├── styles.css             ← V2 스타일시트
├── app.js                 ← V2 메인 JavaScript (KEPCO API + OSM)
├── data.js                ← 데이터 로더
└── server.py              ← Python API 서버 (선택사항)
```

---

## 🚀 배포 순서

### Step 1: V2 앱 파일을 서버에 업로드

```bash
# 로컬에서 서버로 파일 복사
scp -i "LightsailDefaultKey-ap-northeast-2.pem" -r ./kepco-grid-v2 ubuntu@43.201.223.4:/home/ubuntu/brocker/apps/kepco-grid-v2/
```

### Step 2: bigmap.ai 홈페이지에 V2 카드 추가

1. 서버에 SSH 접속:
```bash
ssh -i "LightsailDefaultKey-ap-northeast-2.pem" ubuntu@43.201.223.4
```

2. 홈페이지 `index.html` 파일 위치 확인:
```bash
# bigmap.ai 메인 페이지 찾기
find /home/ubuntu -name "index.html" -path "*/bigmap*" 2>/dev/null
# 또는
ls -la /home/ubuntu/brocker/apps/
```

3. 홈페이지 HTML에서 기존 태양광 카드를 찾기:
```bash
grep -n "한전 송전 여유용량" /home/ubuntu/brocker/apps/[메인페이지파일명]
```

4. 기존 태양광 카드(v1) **바로 뒤에** `homepage_card.html` 내용을 삽입:

```bash
# homepage_card.html 내용 확인
cat /home/ubuntu/brocker/apps/kepco-grid-v2/homepage_card.html
```

5. 텍스트 에디터로 홈페이지 수정:
```bash
sudo nano [홈페이지 파일]
```

### Step 3: 서버 Node.js에 V2 라우트 추가 (필요시)

`server.js`에 V2 경로 라우트가 없다면 추가:
```javascript
// /kepco-grid-v2/ 경로 처리
if (reqUrl.pathname.startsWith('/kepco-grid-v2')) {
    filePath = reqUrl.pathname.replace('/kepco-grid-v2', '/apps/kepco-grid-v2');
}
```

### Step 4: 확인

```bash
# 서버 재시작 (필요시)
pm2 restart all
# 또는
sudo systemctl restart [서비스명]

# 브라우저에서 확인
# https://bigmap.ai/kepco-grid-v2/
```

---

## 🎨 V2 카드 HTML (홈페이지용)

`homepage_card.html` 파일을 참고하세요. 기존 v1 카드 바로 뒤에 삽입하면 됩니다.

### 기존 V1 카드 위치:
```html
<!-- 이 카드 바로 뒤에 V2 카드를 삽입 -->
<div class="day-card" style="--card-accent: #06b6d4; cursor: pointer;" onclick="location.href='/kepco-grid/'">
    <div class="day-card-date">⚡ 사업기획</div>
    <div class="day-card-tip">💡 한전 송전 여유용량 지도 — 태양광 입지 분석</div>
    ...
</div>
<!-- ↓↓↓ 여기에 V2 카드 삽입 ↓↓↓ -->
```

---

## ⚠️ 주의사항
- SSH 키 파일(`*.pem`)의 권한을 `chmod 400`으로 설정하세요
- 백업 먼저: `cp index.html index.html.bak`
- V2 앱은 `/kepco-grid-v2/` 경로에 배포됩니다

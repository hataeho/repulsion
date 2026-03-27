# STK 배포본 — 수의사 편입 대시보드
## 2026-03-07 v4

### 파일 목록
| 파일 | 서버 경로 | 설명 |
|------|----------|------|
| dashboard.html | /STK/index.html | 메인 대시보드 |
| quiz.js | /STK/quiz.js | 퀴즈 엔진 (60문항+AI) |
| 건강한_병아리_생산.html | /STK/chick.html | 병아리 생산 문서 |
| 수의사_로드맵.html | /STK/roadmap.html | 편입 로드맵 문서 |

### 서버 환경 (AWS Lightsail)
- **인스턴스**: Bigmap-Core-Seoul (ap-northeast-2)
- **IP**: 43.201.223.4 | **포트**: 3333
- **OS**: Ubuntu | **웹서버**: 기존 bigmap.ai 서버
- **배포 경로**: `/home/ubuntu/bigmap.ai/STK/`
- **접속 URL**: `https://bigmap.ai/STK/`

### 배포 명령 (iMac에서 실행)
```bash
KEY=~/liberation/.keys/LightsailDefaultKey-ap-northeast-2.pem
SRV=ubuntu@43.201.223.4
DEST=/home/ubuntu/bigmap.ai/STK

ssh -i $KEY $SRV "mkdir -p $DEST"
scp -i $KEY dashboard.html $SRV:$DEST/index.html
scp -i $KEY quiz.js $SRV:$DEST/quiz.js
scp -i $KEY 건강한_병아리_생산.html $SRV:$DEST/chick.html
scp -i $KEY 수의사_로드맵.html $SRV:$DEST/roadmap.html
```

### 학습 데이터 현황
- **저장**: 브라우저 localStorage (PC별 독립)
- **퀴즈**: 과목당 15문항 × 4과목 = 60문항, 매일 5문항 자동 교체
- **AI 확장**: Gemini API로 무한 문제 생성 가능
- **기록**: 최근 60회 퀴즈 기록 + 일별 학습 시간

### 보완 필요 사항
1. **오답 노트** — 틀린 문제 재출제 기능
2. **문제 은행 확대** — 과목당 50문항+ (2주 비중복)
3. **데이터 백업** — JSON 내보내기/가져오기 또는 서버 동기화
4. **API 키 보안** — 서버 프록시로 Gemini 키 숨기기
5. **PWA 전환** — 오프라인 + 푸시 알림 + 홈 화면 설치

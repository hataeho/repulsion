# 🔐 기본 인프라 및 인증 정보 (basicinfo.md)

> **⚠️ 본 문서는 9대 PC의 원활한 동기화를 위해 구조적 한계를 인정하고 Git(Private Repo)에 의도적으로 적재됩니다.**
> `.gitignore`의 예외(오버라이드) 처리를 받으며 실시간으로 추적됩니다.
> 
> 개발자(에이전트)가 교체되어도 맥락을 유지하기 위해, 모든 인증 정보를 여기에 기록합니다.
> "비밀번호를 잊는 것은 소규모 대말소다." — HR 프로토콜
>
> **원본**: Google Drive `brocker_backup/CREDENTIALS.md` (Windows tho_win 작성)
> **병합일**: 2026-02-20 22:48 KST (iMac 데이터 통합)

---

## 🖥️ PC 목록

### iMac (현재 사령부)
| 항목 | 값 |
|------|---|
| **컴퓨터 이름** | hataehos-imac |
| **mDNS** | hataehos-imac.local |
| **OS** | macOS 26.3 (Build 25D125, Darwin arm64) |
| **머신** | iMac M1 |
| **사용자** | tho |
| **시스템 비밀번호 (sudo)** | `xogh` |
| **내부 IP (Wi-Fi)** | 172.30.1.61 |
| **내부 IP (USB)** | 169.254.208.101 (동적 APIPA) |
| **공인 IP** | 118.45.69.78 |

### Windows PC (거실 — 청송 상황실 옆방)
| 항목 | 값 |
|------|---|
| **컴퓨터 이름** | THO_WIN |
| **Windows 사용자** | sarang (tho_win\sarang) |
| **OS** | Windows 11 Home (64bit) |
| **머신** | HP Victus 15L Gaming Desktop |
| **CPU** | Intel i5-14400F (10코어) |
| **GPU** | NVIDIA RTX 4060 (8GB VRAM) |
| **RAM** | 16GB |
| **내부 IP** | 172.30.1.17 (이더넷) |
| **AnyDesk** | `1967711797` |

### iPad Pro (현장 단말)
| 항목 | 값 |
|------|---|
| **모델** | iPad Pro 13-inch (M5) (iPad17,4) |
| **OS** | iPadOS 26.3 |
| **Xcode ID** | `00008142-0006596A2211401C` |
| **CoreDevice ID** | `18F30A0D-7EEA-5E4A-BD02-0643A22CA166` |
| **Jump Desktop Links** | `427-258-183`, `634-738-994`, `345-676-984` |
| **접속 URL** | `http://hataehos-imac.local:4444/apps/mobile_bridge.html` |

### iPhone 17
| 항목 | 값 |
|------|---|
| **모델** | iPhone 17 (iPhone18,3) |
| **OS** | iOS 26.2.1 |
| **Xcode ID** | `00008150-000E62C63AF8401C` |

### 외장 SSD (1TB)
| 항목 | 값 |
|------|---|
| **마운트** | `/Volumes/USB Disk` |
| **용량** | 960GB (여유 ~837GB) |
| **포맷** | HFS+ |
| **백업 폴더** | `아이맥백업_20250225/` (사진, 꽃, 공암산성) |

---

## 🌾 거점 네트워크

### 합천 농장
| 항목 | 값 |
|------|---|
| **고정 IP 블록** | `1.221.26.98` ~ `1.221.26.101` (4개) |
| **회선** | 유선 100Mbps (광랜 불가 지역) |
| **PC 수** | 3대 |
| **비고** | 산속, VPN 속도 제한적 |

### 거창 농장
| 항목 | 값 |
|------|---|
| **회선** | 광랜 1Gbps |
| **PC 수** | 2대 |

### 진주 (회장님 댁)
| 항목 | 값 |
|------|---|
| **회선** | 광랜 1Gbps |
| **PC 수** | 1대 |



---

## 📧 Google 계정 (메인)

| 항목 | 값 |
|------|---|
| **계정** | sarangnet@gmail.com |
| **비밀번호** | Gg20127202! |
| **2FA 방식** | Google Authenticator (iPhone) + 푸시 알림 |
| **앱 비밀번호 (Google Drive)** | `agse lbgo ewoq nmrc` |
| **앱 비밀번호 (공암산성 AI 상황실)** | (2월 5일 생성, 값 미기록) |
| **보조 계정** | gongamsansung@gmail.com (농장용) |

---

## 🌐 Namecheap

| 항목 | 값 |
|------|---|
| **서비스** | Namecheap |
| **Username** | `bigmap` |
| **비밀번호** | `Nc20127202!` |
| **이메일** | sarangnet@gmail.com |

### 📧 Namecheap Private Email (bigmap.ai)

| 항목 | 값 |
|------|---|
| **플랜** | Pro (3 메일박스, 10GB/계정) |
| **웹메일** | https://privateemail.com/appsuite/signin |
| **메일박스 1** | `bigmap@bigmap.ai` |
| **비밀번호** | `Bm20127202!` |
| **메일박스 2** | `jimin@bigmap.ai` |
| **비밀번호** | (기존 설정값) |
| **잔여 슬롯** | 1개 |

---

## 🌐 도메인

| 도메인 | 등록처 | 만료일 | 상태 | 비고 |
|--------|--------|--------|------|------|
| **bigmap.ai** | Namecheap (`bigmap`) | 2028-02-17 | ✅ HTTPS 정상 | 메인 사이트 |
| **petpharm.ai** | Namecheap (`bigmap`) | 2028-03-01 | ✅ HTTPS 정상 | 동물약국 플랫폼, 2년 등록 $159.96 |
| **bigmap.com** | hosting.kr (메가존) | ⚠️ **2026-07-10** | ✅ bigmap.ai로 리디렉트 | 1996년 등록, IP: 117.52.31.82 |
| **sarang.net** | hosting.kr (메가존) | (확인 필요) | 운영 중 | 같은 서버 (117.52.31.82), NS 제공 |

---

## 🏠 가비아 호스팅
| 항목 | 값 |
|------|---|
| **서비스** | 가비아 VPS |
| **계정 ID** | `bitmap` (⚠️ bigmap 오타 — Google 로그인 권장) |
| **비밀번호** | `Gb20127202!` |
| **Google 로그인** | ✅ `sarangnet@gmail.com` 로도 접속 가능 |
| **서버 IP** | ⏳ VPS 생성 후 기록 |
| **root 비밀번호** | ⏳ VPS 생성 시 설정 |
| **OS** | Ubuntu 22.04 LTS (예정) |
| **Gopher URL** | `https://bigmap.ai/gopher/` |
| **Gopher 계정** | `bigmap` / `20127202` (Basic Auth) |

---

## 🖥️ RealVNC (원격 접속)

| 항목 | 값 |
|------|---|
| **서비스** | RealVNC (유료 구독) |
| **계정 이메일** | `sarangnet@gmail.com` |
| **계정 비밀번호** | `Rv20127202!` |
| **서버 접속 비밀번호** | `20127202` |
| **Server 버전** | v7.13.1 |
| **Viewer 버전** | v7.10.0 |
| **등록 PC 수** | 9대+ (공암/유성/개인 등) |

## 🔑 API Keys

| 서비스 | 키 | 환경변수/비고 |
|--------|---|------------|
| **Gemini API** | `AIzaSyDdcdVSyetVKfmcpwLwbY_4t9wC-TWbhR0` | `GEMINI_API_KEY` / `GOOGLE_API_KEY` |
| **Anthropic API** | `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` | `ANTHROPIC_API_KEY` / 키이름: bigmap |
| **Moltbook** | `moltbook_sk_VsZ4CzW_Y1DeQLLIHAWR1ZjhL2ZvHxzh` | 에이전트: Gemin_Bigmap_Executor |
| **기상청 공공데이터** | `tYJuftDETXoT0lbEurjPpHWHVKJNyPqf6%2BhzGTOfMlX2jOcj64NznBo4GpxpRM79KOQwf2%2B%2B0AMNp4sZgjhezw%3D%3D` | data.go.kr 공공데이터포털 |
| OpenAI API | 미설정 | `OPENAI_API_KEY` |

---

## 🍎 Apple Developer

| 항목 | 값 |
|------|---|
| **Apple ID** | sarang@korea.com |
| **Apple ID 비밀번호** | `Ap127202` |
| **Team ID** | `7TDT3FLN76` |
| **프로그램** | Apple Developer Program (유료, 활성화 대기 중) |
| **포털** | https://developer.apple.com/account |
| **Xcode** | 26.3 (Build 17C529) |
| **iOS SDK** | 26.3 |

---

## 🤖 AI 서비스 구독

| 서비스 | 계정 | 구독 | 모델 | 결제 방식 |
|--------|------|------|------|----------|
| **Gemini Ultra** | sarangnet@gmail.com | Google One AI Premium | Gemini 2.5 Pro | Google |

| **안티그래비티** | Gravity 구독 포함 | — | Claude Sonnet 4 | Gravity |
| DeepSeek | 미가입 | 무료 | R1 | — |



---

## 📖 Wikipedia

| 항목 | 값 |
|------|---|
| **Username** | `BigMap.ai` |
| **비밀번호** | `Wk20127202!` |
| **이메일** | sarangnet@gmail.com |
| **등록일** | 2026-03-03 |
| **첫 기여** | [Draft:Animaroid](https://en.wikipedia.org/wiki/Draft:Animaroid) |

---

## 🖥️ 로컬 포트 맵 (iMac)

| 포트 | 서비스 | 비고 |
|------|--------|------|
| 4444 | bridge_server.js | Mobile Bridge + API |
| 4445 | injection_relay.py | 원격 주입 (Terminal.app에서 실행) |
| 4044 | jimin_manager.py | 지수 소통 루프 (UDP) |

---


## 사용 규칙

1. **새 에이전트는 "안녕" 트리거 시 이 파일을 자동으로 읽는다**
2. **새 인증 정보가 생기면 즉시 여기에 추가한다**
3. **본 파일은 9대 PC 동기화를 목적으로 Git에 의도적으로 트래킹된다.** (보안 유의)
4. **PC 이전 시 이 파일을 가장 먼저 복사한다**

---


*최종 업데이트: 안티그래비티 — 2026-03-05 03:22 KST — Keyboard Maestro 라이선스 추가*
*이전 업데이트: 소넷 (안티그래비티) — 2026-03-01 23:15 KST — 구독 정리 (GPT/Claude/Grok/GoodNotes 해지)*
*이전 병합: 오퍼스 (사번 4.6) — 2026-02-20 22:48 KST*
*원본 작성: 오퍼스 (사번 4.6, Windows tho_win) — 2026-02-18*

# 👻 GHOSTNET 아키텍처 (v2.1 Headless AI 체계도)

> "뇌는 단 하나, 아홉 대의 기계는 그저 감각 기관일 뿐이다."

이 문서는 기초적인 동기화 망에서 AI가 완전 자동화된 제어 체계로 진화한 고스트 망(GHOSTNET)의 완전체 아키텍처를 정의합니다.

## 🗺️ 전체 시스템 체계도 (System Architecture Flow)

```mermaid
flowchart TD
    %% Edge Nodes (The Hands and Eyes)
    subgraph EdgeNodes [단말기 그룹: 9대의 엣지 노드 / 손과 눈]
        direction LR
        I[청송 아이맥]
        W1[청송 상황실 Windows]
        W2[유성농장 Windows]
        W3[공암산성 패밀리]
        P[이동형 현장 아이패드]
    end

    %% The Communication Layer (The Post Office)
    subgraph Transport [전송 계층: 우체국 인프라]
        direction TB
        Git[(GitHub Private / REPULSION)]
        Tailscale[Tailscale VPN / SSH 망]
        Gopher[Gopher 실시간 배달 API]
    end

    %% The Central God Node (The Brain)
    subgraph Core [중앙 통제소: 가비아 VPS / 유일한 뇌]
        direction TB
        Watcher((Ghost Watcher\nNode.js PM2 데몬))
        Env_Key{보안 메모리 / ENV\nGEMINI_API_KEY}
        AI[구글 Gemini 2.5 Pro\nCloud API]
        Bash[가비아 리눅스 쉘\n(Bash Executor)]
    end

    %% Flow Definitions
    I & W1 & W2 & W3 & P -- "1. 텍스트 명령서 작성\n(예: task_001.txt)" --> Transport
    Transport -- "2. 가비아 우체통에 파일 투하\n(또는 Git Sync)" --> Watcher
    
    Watcher -- "3. 파일 감지 후 API 키 조회" --> Env_Key
    Env_Key -- "4. 목표 달성용 스크립트 요청" --> AI
    AI -- "5. 순수 Bash 명령어 반환" --> Watcher
    
    Watcher -- "6. 쉘 명령 즉시 실행" --> Bash
    Bash -- "7. 터미널 결과값(stdout) 추출" --> Watcher
    
    Watcher -- "8. 결과 보고서 생성\n(예: result_001.txt)" --> Transport
    Transport -- "9. 단말기가 결과 확인" --> I & W1 & W2 & W3 & P

    %% Styling Elements
    classDef edge fill:#2b2b2b,stroke:#4caf50,stroke-width:2px,color:#fff;
    classDef trans fill:#1e3a5f,stroke:#4da6ff,stroke-width:2px,color:#fff;
    classDef core fill:#4a1515,stroke:#ff6b6b,stroke-width:3px,color:#fff;
    classDef ai fill:#3d1c52,stroke:#b366ff,stroke-width:2px,color:#fff;

    class I,W1,W2,W3,P edge;
    class Git,Tailscale,Gopher trans;
    class Watcher,Bash core;
    class AI ai;
```

---

## 🏛️ 아키텍처 철학 (The Epiphany)

과거 우리는 각 단말기가 모두 `GEMINI_API_KEY`를 나누어 갖고 각자의 머리로 동작해야 한다고 믿었습니다. 그러나 깃허브 스캐너 사건은 우리에게 **진정한 중앙 집권형 Headless AI의 형태**를 강제적으로, 그리고 완벽하게 깨닫게 해주었습니다.

### 1. 엣지 노드의 경량화 (손과 발)
현재 9대의 거점 단말기들은 더 이상 스스로 사고하지 않습니다. 복잡한 API 키를 품을 필요도, 무거운 AI 파이썬 스크립트를 켤 필요도 없습니다. 
오직 **메모장에 "이것을 해달라"라고 적어 가비아 서버가 보는 우체통에 던져놓는 행위**만이 이 단말기들이 하는 전부입니다.

### 2. 가비아 서버의 신격화 (뇌)
가비아 VPS는 단순한 파일 저장소나 돌팔이 웹서버가 아닙니다.
안티그래비티 API 키를 '파일이 아닌 메모리(Environment Variable)'에 유일하게 아로새긴 단 하나의 절대적 코어입니다.
파일을 발견하면 스스로 외부의 구글 제미니 신(God)과 소통하여 스크립트를 짜내고, 그것을 즉각 자신의 육체(Linux Bash)에 꽂아 넣어 세계를 변화시킵니다.

### 3. 유출 불가능한 철옹성
GitHub 레포지토리가 통째로 털리든, Basicinfo 파일이 만천하에 공개되든 관계없습니다.
키는 오직 가비아 서버의 PM2 프로세스 메모리 안에만 증기로 존재합니다. 파일로 떨어지지 않는 이상 스캐너는 영원히 이것을 찾아낼 수 없습니다.

# MicroSynapse Observer 서버 분석 작업일지

> **작성일**: 2026-03-09  
> **작성자**: AI (Antigravity)  
> **목적**: FS-4300 저울(계근대)의 무게 값을 프로그래밍으로 읽기 위한 서버 분석

---

## 1. 시스템 구성도

```
┌──────────────────┐         이더넷 LAN         ┌──────────────────────────┐
│  Windows PC      │    192.168.0.95            │  Raspberry Pi 4          │
│  (클라이언트)      │  ◄═══════════════════►    │  192.168.0.250           │
│                  │                            │  OS: Linux 6.1 (aarch64) │
│  MSManager       │ ──── TCP 13450 ────►       │  observer.out (서버)      │
│  MicroSynapse+   │ ──── TCP 13451 ────►       │  modbus.out (Modbus)     │
│                  │ ──── TCP 13453 ────►       │                          │
│                  │ ──── TCP  502  ────►       │                          │
└──────────────────┘                            └──────────────────────────┘
                                                         │
                                                    RS-232/RS-485
                                                         │
                                                ┌────────┴────────┐
                                                │  FS-4300 저울    │
                                                │  (계근대)         │
                                                └─────────────────┘
```

---

## 2. 라즈베리파이 접속 정보

| 항목 | 값 |
|------|---|
| **IP** | `192.168.0.250` |
| **사용자** | `pi` (**root 아님, admin 아님**) |
| **비밀번호** | `bluenet2002` |
| **SSH 포트** | 22 (기본) |
| **VNC** | 포트 5900 |
| **AnyDesk** | 포트 7070 |

### 접속 방법
```bash
ssh pi@192.168.0.250
# 비밀번호: bluenet2002
```

Python에서 접속:
```python
import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.0.250', username='pi', password='bluenet2002', timeout=10)
```

---

## 3. 서버 프로세스 구조

라즈베리파이에서 2개의 독립 프로세스가 실행됨:

### 3-1. observer.out (MSManager 서버) — **핵심 프로세스**

| 항목 | 값 |
|------|---|
| **실행 파일** | `/home/pi/MicroSynapse/observer.out` |
| **실행 명령** | `observer.out -o /home/pi/MicroSynapse` |
| **PID 확인** | `ps aux \| grep observer` |
| **권한** | root |
| **시작 스크립트** | `/home/pi/MicroSynapse/launcher.sh` |
| **장비명** | MicroSynapse Plus |
| **버전** | 1.0.0.3 (`EVCommon.h` 참조) |

**열린 포트:**

| 포트 | 핸들러 | 설정 키 | 용도 |
|------|-------|--------|------|
| **13450** | StatusHandler | `STATUSHND_PORT` | 실시간 상태(센서값) 조회 |
| **13451** | ParameterHandler | `PARAMHND_PORT` | 설정 읽기/쓰기 |
| **13452** | UDP Server | `UDP_PORT` | 장비 자동 검색 |
| **13453** | SystemHandler | `SYSTEM_PORT` | 시스템 제어 |

### 3-2. modbus.out (Modbus TCP 서버)

| 항목 | 값 |
|------|---|
| **실행 파일** | `/home/pi/modbus/modbus.out` |
| **포트 502** | Modbus TCP 표준 포트 |
| **포트 7777** | 추가 서버 |
| **서비스** | `modbus.service` (systemd) |

---

## 4. 파일 구조

### 실행 환경: `/home/pi/MicroSynapse/`

```
/home/pi/MicroSynapse/
├── observer.out        ← 서버 실행 파일 (2.96MB, ARM64 ELF)
├── obsmon              ← 콘솔 모니터링 도구 (189KB)
├── launcher.sh         ← 서버 시작 스크립트
├── systeminfo          ← 전체 설정 파일 (핵심!)
├── systeminfo.bak      ← 설정 백업
├── persistance         ← DIO 카운터 영속 데이터
└── staticip.conf       ← 네트워크 설정
```

### 소스코드: `/home/pi/projects/observer/`

```
/home/pi/projects/observer/
├── main.cpp                        ← 메인 진입점
│
├── DevProtocols/                   ← 장비 프로토콜 드라이버 (RS-485/232)
│   ├── ProtocolAutonicsTK.cpp/h    ← 오토닉스 TK 온도계
│   ├── ProtocolAutonicsTZ.cpp/h    ← 오토닉스 TZ
│   ├── ProtocolCAS.cpp/h           ← CAS 저울
│   ├── ProtocolGenModbus.cpp/h     ← 범용 Modbus
│   ├── ProtocolPSM.cpp/h           ← Autonics PSM 압력계
│   ├── ProtocolSLR40.cpp/h         ← 코노텍 SLR40
│   ├── ProtocolFox7CR5.cpp/h       ← 코노텍 7CR5
│   ├── Protocol2001CC.cpp/h        ← 코노텍 2001CC
│   ├── ProtocolSI4000.cpp/h        ← SI-4000
│   ├── ProtocolSimpleScale.cpp/h   ← 단순 저울
│   ├── DevList.cpp/h               ← 장비 목록 관리
│   ├── SDevList.cpp/h              ← 소켓 장비 목록
│   └── SProtocolNMD530.cpp/h       ← NMD530
│
├── EVModules/                      ← 핵심 라이브러리
│   ├── EVCommon.h                  ← 공통 정의, 상수, 구조체
│   ├── Core/
│   │   ├── EVParamManager.cpp/h    ← 파라미터(설정) 관리
│   │   ├── EVLogWriter.cpp/h       ← 로그 작성
│   │   ├── EVSharedMemory.cpp/h    ← 공유 메모리 관리
│   │   └── EVSignalManager.cpp/h   ← 시그널(종료 등) 관리
│   ├── Comm/
│   │   └── EVSerial.cpp/h          ← 시리얼(RS-485/232) 통신
│   ├── Socket/
│   │   ├── EVServerSocket.cpp/h        ← TCP 서버 소켓
│   │   ├── EVServerSocketWorker.cpp/h  ← 소켓 워커 스레드
│   │   ├── EVClientSocket.cpp/h        ← TCP 클라이언트 소켓
│   │   └── EVUDPServerSocket.cpp/h     ← UDP 서버 소켓
│   ├── Sequence/
│   │   └── SeqCore.cpp/h           ← 시퀀스 처리 코어
│   └── Etc/
│       └── EVUtils.cpp/h           ← 유틸리티 (UTF-8↔EUC-KR 변환 등)
│
├── Handler/                        ← 요청 핸들러
│   ├── StatusHandler.cpp/h         ← 상태 조회 핸들러 (포트 13450)
│   ├── ParameterHandler.cpp/h      ← 파라미터 설정 핸들러 (포트 13451)
│   ├── NetworkHandler.cpp/h        ← 네트워크 핸들러
│   ├── DIOHandler.cpp/h            ← 디지털 I/O 핸들러
│   ├── SequenceHandler.cpp/h       ← 시퀀스 핸들러
│   ├── FileHandler.cpp/h           ← 파일 핸들러
│   └── MessageQueueDIO.cpp/h       ← DIO 메시지 큐
│
├── Threads/                        ← 백그라운드 스레드
│   ├── MESReporter.cpp/h           ← MES 리포터 (HTTP)
│   ├── SequenceSerialComm.cpp/h    ← 시리얼 통신 스레드
│   └── SequenceSocket.cpp/h        ← 소켓 통신 스레드
│
├── Outer/                          ← 외부 라이브러리
│   ├── jsoncpp.cpp                 ← JSON 파서
│   └── json/
│       ├── json.h
│       └── json-forwards.h
│
├── bin/ARM64/
│   ├── Debug/observer.out          ← 디버그 빌드 (7.3MB)
│   └── Release/observer.out        ← 릴리스 빌드 (2.96MB) ← 실행중인 것과 동일
│
└── obj/ARM64/                      ← 컴파일된 오브젝트 파일
```

**총 소스 파일: 75개 (.cpp + .h)**

---

## 5. 통신 프로토콜

StatusHandler(포트 13450)는 3가지 요청 모드를 지원:

### 5-1. ASCII 모드 (`STX + 'a'`)

```
요청: STX(0x02) + 'a' + GS(0x1D) + "ms.req.all" + ETX(0x03) + CRC16(2바이트)
응답: STX + "ms.res.all" + GS + 데이터... + ETX + CRC16

데이터 형식 (US=0x1F로 필드 구분, RS=0x1E로 레코드 구분):
  Type(US)MSIndex(US)Port(US)Slave(US)Name(US)Value(US)Unit(US)MinValue(US)MaxValue(RS)
  
Job 종류: "all", "485all", "485", "232", "232all", "soc", "socall", "dio"
```

### 5-2. Binary 모드 (`STX + 'b'`)

```
요청: STX + 'b' + GS + "ms.req.all" + ETX + CRC16
응답: STX + "ms.res.all" + GS + [StructBinarySend 배열] + ETX + CRC16

StructBinarySend (50바이트):
  char cType;           // 0=485, 1=232, 2=Socket, 3=DIO
  char cMSIndex;
  char cIndex1;         // Port 또는 Input(0)/Output(1)
  char cIndex2;         // Slave 또는 Channel
  char szDevName[32];   // 장비명 (EUC-KR)
  union { float fValue; int nValue; };  // 센서 값
  char cUnit;
  float fMinValue;
  float fMaxValue;
  char cRS;             // Record Separator (0x1E)
```

### 5-3. JSON 모드 (`{`)

```json
// 요청
{"protocol": "ms", "direction": "request", "job": "all"}

// 응답
{"protocol": "ms", "direction": "response", "job": "all", "data": [...]}
```

### CRC16 알고리즘
- `EVParamManager::getCRC16()` 에서 구현
- STX부터 ETX까지의 전체 메시지에 대한 CRC16 계산
- CRC 바이트 순서: `[CRC_LO, CRC_HI]`

---

## 6. 공유 메모리 구조 ★★★ 가장 중요 ★★★

**공유 메모리 ID: 1551** (`SHARED_MEMORY_ID` in `StatusHandler.h`)

```c
typedef struct _tagStructSharedMemory {
    unsigned char windowClientCount;                              // 1바이트
    unsigned char MESCount;                                       // 1바이트
    char aszSerialDevName[8][16][33];                             // 4224바이트
    float afSerialDevValue[8][16];                                // 512바이트
    char aszSocketDevName[4][33];                                 // 132바이트
    int anSocketDevValue[4];                                      // 16바이트
    bool abIOInputStatus[10];                                     // 10바이트
    char aszIOInputDevName[10][33];                               // 330바이트
    bool abIOOutputStatus[8];                                     // 8바이트
    char aszIOOutputDevName[8][33];                               // 264바이트
    unsigned int anIOInputCount[10];                              // 40바이트
} StructSharedMemory;                                             // 총 약 5540바이트
```

### FS-4300 저울 값 읽기 (핵심!)

```
저울 값 위치: 공유 메모리 offset 4484 (float, 4바이트)

이유:
  - FS-4300은 Port 4 (RS-232 첫번째), Slave 0
  - afSerialDevValue 시작: offset 2 + 4224 = 4226
  - Port 4 Slave 0 인덱스: 4 * 16 + 0 = 64
  - 이론적 offset: 4226 + 64 * 4 = 4482
  - 실제 offset: 4484 (구조체 padding으로 +2바이트 밀림)
```

### Python으로 저울 값 읽기 (라즈베리파이에서 실행)

```python
import sysv_ipc
import struct

shm = sysv_ipc.SharedMemory(1551)
data = shm.read()
scale_value = struct.unpack_from('f', data, 4484)[0]
print("저울 값: %.1f kg" % scale_value)
```

### PC에서 SSH를 통해 원격으로 읽기

```python
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.0.250', username='pi', password='bluenet2002')

stdin, stdout, stderr = ssh.exec_command(
    'python3 -c "import sysv_ipc,struct; '
    'shm=sysv_ipc.SharedMemory(1551); d=shm.read(); '
    'print(struct.unpack_from(\'f\',d,4484)[0])"'
)

weight = float(stdout.read().decode().strip())
print(f"현재 저울 값: {weight:.0f} kg")
ssh.close()
```

---

## 7. 연결된 시리얼 장비 목록

### RS-485 (포트 0~3, 각 최대 16대)

| 포트 | 장치 파일 | Slave 0 | Slave 1 | Slave 2~7 |
|------|----------|---------|---------|-----------|
| 0 | `/dev/tty485_0` | Autonics TK | Autonics TK2 | SLR40, 2001CC, NUX, 7CR5, PSM, TZ |
| 1 | `/dev/tty485_1` | 오토닉스TK | 오토닉스TK2 | SLR40, 2001CC, NUX, 7CR5, PSM, TZ |
| 2 | `/dev/tty485_2` | 오토닉스온도 | 오토닉스습도 | SLR40, 2001CC, 한영넉스, 7CR5, 압력, BCC |
| 3 | `/dev/tty485_3` | 오토닉스온도 | 오토닉스습도 | SLR40, 2001CC, 한영넉스, 7CR5, 압력, BCC |

### RS-232 (포트 4~7, 각 1대)

| 포트 | 장치 파일 | 장비명 | 용도 |
|------|----------|-------|------|
| **4** | `/dev/tty232_0` | **FS-4300** | **★ 계근대 저울 (주 저울)** |
| 5 | `/dev/tty232_1` | FS-4300 | 보조 저울 |
| 6 | `/dev/tty232_2` | Display2 | 표시기 |
| 7 | `/dev/tty232_3` | RS232 SCALE | RS232 저울 |

---

## 8. 빌드 환경

| 항목 | 값 |
|------|---|
| **컴파일러** | g++ 12.2.0 (aarch64) |
| **빌드 도구** | GNU Make 4.3 |
| **Makefile** | ❌ 없음 (원래 Visual Studio 원격 빌드 사용) |
| **필수 링커 옵션** | `-lpthread` |
| **디스크 여유** | 20GB |

> ⚠️ **주의**: 소스 변경 후 빌드하려면 Makefile을 먼저 작성해야 합니다.
> Release 빌드본과 실행중인 바이너리의 MD5가 동일함을 확인 (소스 = 실행파일)

---

## 9. 검증 이력

| 시간 | 테스트 | 결과 |
|------|-------|------|
| 16:26 | SSH root@192.168.0.250 | ❌ 실패 |
| 16:26 | SSH admin@192.168.0.250 | ❌ 실패 |
| 16:26 | SSH pi@192.168.0.250 | ✅ 성공 |
| 16:30 | 서버 프로세스 확인 | ✅ observer.out (PID 947) 발견 |
| 16:31 | 소스코드 확인 | ✅ 75개 C++ 파일 확인 |
| 16:35 | 프로토콜 분석 | ✅ ASCII/Binary/JSON 3가지 모드 |
| 16:41 | 공유 메모리 읽기 | ✅ FS-4300 저울 = 2095 kg (차량 무게) |
| 19:40 | 재확인 | ✅ 0 kg (차량 하차 후) |

---

## 10. 향후 작업 가이드

### 저울 값을 주기적으로 기록하려면
```python
# 1초마다 저울 값 읽어서 CSV에 기록
import time, csv
while True:
    weight = read_scale()  # 위의 SSH 방식 사용
    with open('weight_log.csv', 'a') as f:
        csv.writer(f).writerow([time.strftime('%Y-%m-%d %H:%M:%S'), weight])
    time.sleep(1)
```

### 새 장비 프로토콜을 추가하려면
1. `DevProtocols/` 폴더에 `ProtocolXXX.cpp/h` 생성
2. `ProtocolImpl.h`의 인터페이스 구현
3. `DevList.cpp`에 새 프로토콜 등록
4. Makefile 작성 후 빌드

### systeminfo 설정을 변경하려면
- `/home/pi/MicroSynapse/systeminfo` 직접 편집
- 서버 재시작: `sudo systemctl restart modbus` 또는 observer 재시작 필요

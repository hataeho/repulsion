# 사료빈 모니터링 시스템 작업 일지

## 2026-03-17 작업 내용

### 1. modbus.out 서비스 복구 (14:41)

**문제**: modbus.service 실행 시 status=203/EXEC (Permission denied)  
**원인**: modbus.out 파일에 실행 권한 없음 (-rw-r--r--)  
**해결**: `sudo chmod +x /home/pi/modbus/modbus.out`  
**결과**: 서비스 정상 시작, 사료빈 8대(241~248) 접속 확인

```
[CEVServerSocket] Server Socket started
[CEVServerSocket] [DevServer] Connected from : 192.168.0.241~248 (8대)
[CEVServerSocket] [Modbus Server] Connected from : 192.168.0.83 (SCADA)
```

### 2. SCADA(InfoU) 데이터 수신 확인 (14:42)

- InfoU에서 12빈 사료 재고량 정상 표시 (모든 태그 녹색)
- 포트 502, 7777 정상 리슨

### 3. Modbus 레지스터 매핑 분석 (15:46~15:50)

- 이 PC에서 192.168.0.250:502 Modbus TCP 직접 접속 성공
- 각 동 13레지스터 블록 구조 해독
- 상세 매핑은 `REGISTER_MAP.md` 참조

### 4. InfoU → Access DB 연동 설정 (15:09~15:42)

**목적**: SCADA가 수집하는 사료빈 데이터를 외부 DB에 자동 저장  
**방식**: InfoU 자체 "데이터베이스 작업" 기능 활용

- **DB 파일**: `C:\공암산성1904\Archive\TagLog\feedbin.mdb` (Access MDB)
- **테이블**: `feedbin_log` (ts, bin_1_1~bin_8_2, 12칼럼)
- **OLE DB**: Microsoft Jet 4.0 OLE DB Provider
- **연결 문자열**: `Provider=Microsoft.Jet.OLEDB.4.0;Data Source=C:\공암산성1904\Archive\TagLog\feedbin.mdb;Persist Security Info=False`
- **INSERT 구문**: 
```sql
INSERT INTO feedbin_log (ts,bin_1_1,bin_1_2,bin_2_1,bin_3_1,
  bin_4_1,bin_5_1,bin_6_1,bin_6_2,bin_7_1,bin_7_2,bin_8_1,bin_8_2) 
VALUES (Now(),?,?,?,?,?,?,?,?,?,?,?,?)
```
- **바인딩 태그**: 사료빈_1동_1번_총량 ~ 사료빈_8동_2번_총량 (12개)
- **수집 주기**: 5분 (InfoU 로깅 설정 기준)

### 5. 시스템 구성 요약

```
[사료빈 장비 8대]
    │ TCP:7777 (DevServer)
    ▼
[RPi 192.168.0.250]
    │ modbus.out (systemd service)
    │ 포트 502 (Modbus TCP), 7777 (DevServer)
    │
    ├──→ [SCADA InfoU 192.168.0.83]
    │        │ 5분 주기 로깅
    │        ├── 급이.db (자체 PERIODIC_HDB 형식)
    │        └── feedbin.mdb (Access DB, 외부 조회용)
    │
    └──→ [이 PC에서 직접 Modbus TCP 읽기 가능 (백업)]
```

### 참고: RPi 기존 프로세스

| 서비스 | 용도 | 상태 |
|--------|------|------|
| modbus.service | 사료빈 Modbus TCP 중계 | active (running) |
| custom-scale.service | 출하 차량 계량 (별도 프로젝트) | active (running) |
| observer.service | MicroSynapse 센서 수집 | disabled |

### 향후 과제

- [ ] feedbin.mdb에 데이터 정상 적재 확인
- [ ] 시간별/일별 소비량·입고량 계산 로직 구현
- [ ] SCADA 기존 로그(PERIODIC_HDB) 역분석 (과거 데이터 확보)
- [ ] 직접 Modbus 접속 백업 수집기 필요 여부 결정

---

# 사료빈 모니터링 시스템 작업 일지

---

# 사료빈 모니터링 시스템 작업 일지

---

## 2026-04-07 작업 내용

### 1. 사료빈 전체 12빈 점검 (08:36~17:21)

#### 서비스 상태

| 서비스 | 상태 |
|--------|------|
| `modbus.service` (modbus.out, PID 891) | ✅ active |
| `custom-scale.service` (scale_service.py, PID 487) | ✅ active |
| `pi_modbus_tcp_master.py` | 미실행 (modbus.out과 중복, 불필요 판정) |

#### Modbus 레지스터 12빈 점검 결과 (17:21 기준, 수정된 오프셋 적용)

| 빈 | 사료량(+3/+4) | 급이량(+5/+6) | 타임스탬프 | 상태 |
|----|-------------|-------------|-----------|------|
| 1동 1번 | 40kg | 10kg | 17:21 | ✅ |
| 1동 2번 | 9,510kg | 0kg | — | ✅ |
| 2동 1번 | 9,320kg | 1,260kg | 17:21 | ✅ |
| 3동 1번 | 8,350kg | 0kg | 17:21 | ✅ |
| 4동 1번 | 8,110kg | 1,270kg | 17:21 | ✅ |
| 5동 1번 | 10,250kg | 1,280kg | 17:21 | ✅ |
| 6동 1번 | 10kg | 0kg | 17:21 | ✅ |
| 6동 2번 | 7,930kg | 1,280kg | — | ✅ |
| 7동 1번 | 3,140kg | 960kg | 17:21 | ✅ |
| 7동 2번 | 7,640kg | 10kg | — | ✅ |
| 8동 1번 | 7,060kg | 0kg | 17:21 | ✅ |
| 8동 2번 | 4,210kg | 910kg | — | ✅ |

**결과: 전체 12빈 정상 ✅**

### 2. REGISTER_MAP.md 오프셋 수정

기존 매핑(3/17)에서 +2/+4를 사료량으로 기재했으나, raw 레지스터 전수 검증 결과 **실제 사료량은 +3(Silo1), +4(Silo2)** 로 수정함.

### 3. 5동 장애 및 복구 (09:25~17:14)

#### 장애 내용
- 오전 점검 시 5동(.245) 데이터 미수신 (빈수=0, 타임스탬프 없음)
- RPi:7777에 TCP 연결 없음 (ping 정상, 7777 Connection refused)
- modbus.out 로그: 00:04까지 정상(Weight:3470) 후 끊김
- RPi 자동 재부팅(01:00) 후 5동만 재접속 실패

#### 타임라인 (modbus.out 로그 기준)

| 시각 | 이벤트 |
|------|--------|
| 00:00~00:04 | 정상 수신 (Weight: 3,470kg, Feeding: 2,340kg) |
| 00:04 | **마지막 수신** |
| 01:00 | RPi 자동 재부팅 (reboot-server.timer) |
| 01:00~12:01 | **약 12시간 두절** — 5동만 재접속 실패 |
| 09:48 | 현장 하드 리부팅 실시 |
| **12:01:13** | **복구 확인** (Weight: 10,520kg, PID 891→895) |
| 17:21 | 정상 가동 확인 (Weight: 10,250kg) |

#### 분석
- RPi 재부팅(01:00) 후 나머지 7대는 즉시 재접속, 5동만 실패
- 현장 하드 리부팅(09:48) 후 약 2시간 뒤(12:01) 복구
- PID 891→895 변경은 RPi 재부팅으로 modbus.out도 재시작된 것

---

## 2026-04-10 작업 내용

### 1. 사료빈 전체 12빈 점검 (09:27)

#### 점검 결과 (Modbus 레지스터, 09:27 기준)

| 빈 | Silo1 Weight | Silo2 Weight | 상태 |
|----|-------------|-------------|------|
| 1동 | 30kg | 9,800kg | ✅ |
| 2동 | 3,590kg | — | ⚠️ 타임스탬프 오래됨 |
| **3동** | **0kg** | **—** | **❌ 통신 두절** |
| 4동 | 8,460kg | — | ✅ |
| 5동 | 10,110kg | — | ✅ |
| 6동 | 10kg | 1,790kg | ⚠️ 타임스탬프 오래됨 |
| 7동 | 10kg | 5,160kg | ✅ |
| 8동 | 6,080kg | 10kg | ✅ |

- 3동(.243): 모든 레지스터 0, TCP 7777 미연결
- 2동, 6동: 연결은 되어있으나 데이터 갱신 멈춤

### 2. modbus.service 재시작 (09:29~09:39)

#### 1차 재시작 실패
- `sudo systemctl restart modbus.service` 실행
- modbus.out `bind() error` 발생 → 502/7777 포트 바인드 실패
- 원인: `restart`는 stop 후 즉시 start하여 이전 소켓 해제 전에 새 프로세스 시작

#### 2차 재시작 성공 (stop → 3초 대기 → start)
```bash
sudo systemctl stop modbus.service
# 3초 대기 (포트 해제)
sudo systemctl start modbus.service
```
- PID 5054로 정상 기동
- 502/7777 포트 리슨 확인
- **3동(.243) 포함 전체 8대 재접속** (Connected clients: 8)

#### 복구 후 12빈 최종 상태 (09:39)

| 빈 | Silo1 Weight | Silo2 Weight | 상태 |
|----|-------------|-------------|------|
| 1동 | 30kg | 9,750kg | ✅ |
| 2동 | 9,780kg | — | ✅ |
| 3동 | 9,300kg | — | ✅ 복구 |
| 4동 | 8,450kg | — | ✅ |
| 5동 | 10,070kg | — | ✅ |
| 6동 | 10kg | 7,980kg | ✅ |
| 7동 | 10kg | 5,120kg | ✅ |
| 8동 | 6,070kg | 10kg | ✅ |

**전체 12빈 정상 ✅**

### 3. modbus.service 재시작 안전성 개선

#### 문제
`systemctl restart`는 내부적으로 stop → start를 빠르게 수행하여
`modbus.out`이 점유하던 TCP 소켓이 해제되기 전에 새 프로세스가 `bind()`를 시도 → 실패

#### 해결 (3회 테스트 후 최종 확정)
`/etc/systemd/system/modbus.service` 수정:

```diff
 [Service]
 Type=idle
+ExecStopPost=/bin/sleep 5
+ExecStartPre=-/usr/bin/fuser -k 502/tcp
+ExecStartPre=-/usr/bin/fuser -k 7777/tcp
 ExecStart=/home/pi/modbus/modbus.out
 Restart=always
 RestartSec=5
```

- `ExecStopPost=/bin/sleep 5`: 프로세스 종료 후 5초 대기 (TIME_WAIT 소켓 해제 보장) ← **핵심**
- `ExecStartPre=-/usr/bin/fuser -k`: 시작 전 포트 점유 프로세스 강제 종료 (안전장치)
- 검증: `systemctl restart modbus.service` → bind() error 없음, 502/7777 정상 리슨, 8대 즉시 재접속

; ============================================================================
; GHOSTNET KNOCKER — Windows AutoHotKey v2 Script
; schtasks에 의해 호출되어 AG 에이전트를 기동한다.
;
; 설치:
;   1. AutoHotKey v2 설치: https://www.autohotkey.com/
;   2. 이 파일을 C:\ghostnet\knocker.ahk 에 저장
;   3. 예약 작업 등록:
;      schtasks /create /TN "GHOSTNET_KNOCKER" /TR "\"C:\Program Files\AutoHotkey\v2\AutoHotkey.exe\" \"C:\ghostnet\knocker.ahk\"" /SC ONCE /ST 00:00 /F
;   4. knocker_config.json에서 좌표 캘리브레이션
;
; 수동 실행: 더블클릭 또는 schtasks /run /TN "GHOSTNET_KNOCKER"
; ============================================================================

#Requires AutoHotkey v2.0

; --- 설정 ---
MACHINE_ID := "chongsong-comm-win"  ; 기기별로 수정
TRIGGER := "[GHOSTNET WAKE] 고스트 망에 새 메시지가 도착했다. ghostnet/board/와 ghostnet/whisper/" . MACHINE_ID . "/를 확인하고 처리하라."

; 좌표 (캘리브레이션 후 수정)
CHAT_X := 0
CHAT_Y := 0

; --- 기동 시퀀스 ---

; 1. VS Code 활성화
try {
    WinActivate "Visual Studio Code"
    Sleep 1000
} catch {
    ; VS Code가 없으면 종료
    MsgBox "VS Code를 찾을 수 없습니다.", "GHOSTNET KNOCKER", 16
    ExitApp
}

; 2. 좌표 클릭 (캘리브레이션된 경우)
if (CHAT_X != 0 or CHAT_Y != 0) {
    Click CHAT_X, CHAT_Y
    Sleep 500
}

; 3. 트리거 입력 (클립보드 + Ctrl+V)
A_Clipboard := TRIGGER
Sleep 200
Send "^v"
Sleep 300

; 4. Enter
Send "{Enter}"

; 5. 알림
TrayTip "에이전트 기동 완료", "👻 GHOSTNET KNOCKER", 1
Sleep 2000

ExitApp

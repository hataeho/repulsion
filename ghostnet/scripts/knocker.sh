#!/bin/bash
# ============================================================================
# GHOSTNET KNOCKER v2.0 — 에이전트 원격 기동 스크립트
#
# 좌표 기반 직접 클릭 + 키 입력으로 AG 에이전트를 깨운다.
# knocker_config.json에서 기기별 설정을 읽어 OS별 자동화를 수행.
#
# 사용법:
#   ./knocker.sh                        # 자동 감지 모드
#   ./knocker.sh <MACHINE_ID> <OS>      # SENTINEL에서 호출 시
#   ./knocker.sh --calibrate            # 좌표 캘리브레이션 모드
#
# SENTINEL에 의해 자동 호출되거나, SSH에서 수동 실행 가능.
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GHOSTNET_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$GHOSTNET_DIR/logs"
CONFIG_FILE="$SCRIPT_DIR/knocker_config.json"

# --- 인자 파싱 ---
CALIBRATE=false
if [[ "${1:-}" == "--calibrate" ]]; then
    CALIBRATE=true
fi

# --- OS 감지 ---
detect_os() {
    case "$(uname -s)" in
        Darwin) echo "macos" ;;
        Linux)  echo "linux" ;;
        MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
        *)      echo "unknown" ;;
    esac
}

OS_TYPE="${2:-$(detect_os)}"

# --- 기기 ID 감지 ---
detect_machine_id() {
    if command -v tailscale &>/dev/null; then
        local ts_hostname
        ts_hostname="$(tailscale status --self --json 2>/dev/null | grep -o '"HostName":"[^"]*"' | head -1 | cut -d'"' -f4 || true)"
        [[ -n "$ts_hostname" ]] && echo "$ts_hostname" && return
    fi
    local hostname
    hostname="$(hostname -s 2>/dev/null || hostname)"
    for roster_file in "$GHOSTNET_DIR/roster/"*.json; do
        [[ -f "$roster_file" ]] || continue
        local machine_id
        machine_id="$(basename "$roster_file" .json)"
        if echo "$hostname" | grep -qi "${machine_id%%-*}"; then
            echo "$machine_id"
            return
        fi
    done
    echo "$hostname"
}

MACHINE_ID="${1:-$(detect_machine_id)}"
[[ "$CALIBRATE" == true ]] && MACHINE_ID="$(detect_machine_id)"

mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/${MACHINE_ID}.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [KNOCKER] $*" >> "$LOG_FILE"
    echo "[KNOCKER] $*"
}

# --- Config 읽기 (jq 없이) ---
get_config_value() {
    local machine="$1"
    local field="$2"
    # JSON에서 해당 기기 블록 내의 필드값 추출
    local in_machine=false
    local brace_depth=0
    while IFS= read -r line; do
        if echo "$line" | grep -q "\"$machine\""; then
            in_machine=true
            continue
        fi
        if [[ "$in_machine" == true ]]; then
            if echo "$line" | grep -q '{'; then
                brace_depth=$((brace_depth + 1))
            fi
            if echo "$line" | grep -q '}'; then
                brace_depth=$((brace_depth - 1))
                if [[ "$brace_depth" -le 0 ]]; then
                    break
                fi
            fi
            if echo "$line" | grep -q "\"$field\""; then
                # 숫자 필드
                if echo "$line" | grep -qE '"[^"]*": *[0-9]+'; then
                    echo "$line" | sed 's/.*: *\([0-9]*\).*/\1/'
                else
                    # 문자열 필드
                    echo "$line" | sed 's/.*: *"\([^"]*\)".*/\1/'
                fi
                return
            fi
        fi
    done < "$CONFIG_FILE"
    echo ""
}

# --- 캘리브레이션 모드 ---
if [[ "$CALIBRATE" == true ]]; then
    echo "========================================"
    echo "👻 GHOSTNET KNOCKER — 좌표 캘리브레이션"
    echo "========================================"
    echo ""
    echo "AG 채팅 입력창 위에 마우스를 올려놓으세요."
    echo "3초 후 좌표를 측정합니다..."
    echo ""
    sleep 3

    case "$OS_TYPE" in
        macos)
            if command -v cliclick &>/dev/null; then
                POS=$(cliclick p 2>&1)
                echo "📍 현재 마우스 좌표: $POS"
            else
                echo "❌ cliclick이 설치되어 있지 않습니다."
                echo "   설치: brew install cliclick"
                echo ""
                echo "대안: AppleScript로 대략적 좌표 확인 (정확도 낮음)"
                osascript -e 'tell application "System Events" to get position of mouse cursor' 2>/dev/null || echo "AppleScript 접근 불가"
            fi
            ;;
        linux)
            if command -v xdotool &>/dev/null; then
                export DISPLAY="${DISPLAY:-:0}"
                POS=$(xdotool getmouselocation 2>&1)
                echo "📍 현재 마우스 좌표: $POS"
            else
                echo "❌ xdotool이 설치되어 있지 않습니다."
                echo "   설치: sudo apt install xdotool"
            fi
            ;;
        windows)
            echo "Windows에서는 AutoHotKey 스크립트로 좌표를 확인하세요:"
            echo "  MouseGetPos, xpos, ypos"
            echo "  MsgBox %xpos% %ypos%"
            ;;
    esac

    echo ""
    echo "측정된 좌표를 ghostnet/scripts/knocker_config.json의"
    echo "chat_input_x, chat_input_y에 입력하세요."
    exit 0
fi

# --- config에서 설정 로드 ---
if [[ ! -f "$CONFIG_FILE" ]]; then
    log "ERROR: knocker_config.json을 찾을 수 없음"
    exit 1
fi

INPUT_X=$(get_config_value "$MACHINE_ID" "chat_input_x")
INPUT_Y=$(get_config_value "$MACHINE_ID" "chat_input_y")
TRIGGER=$(get_config_value "$MACHINE_ID" "trigger")
APP_NAME=$(get_config_value "$MACHINE_ID" "app_name")

if [[ -z "$TRIGGER" ]]; then
    TRIGGER="[GHOSTNET WAKE] 고스트 망에 새 메시지가 도착했다. ghostnet/board/와 ghostnet/whisper/${MACHINE_ID}/를 확인하고 처리하라."
fi

log "기동 시작 — 기기: $MACHINE_ID, OS: $OS_TYPE, 좌표: ($INPUT_X, $INPUT_Y)"

# --- 좌표 미설정 경고 ---
if [[ "$INPUT_X" == "0" && "$INPUT_Y" == "0" ]]; then
    log "WARN: 좌표가 캘리브레이션되지 않았음 (0,0). 앱 포커스 + 키 입력만 시도."
    COORD_MODE=false
else
    COORD_MODE=true
fi

# ============================================================================
# OS별 기동 실행
# ============================================================================

case "$OS_TYPE" in

    # --- macOS ---
    macos)
        log "macOS 기동 시퀀스 시작..."

        # 1. VS Code 활성화
        osascript -e "tell application \"$APP_NAME\" to activate" 2>/dev/null || {
            log "WARN: $APP_NAME 활성화 실패"
        }
        sleep 1

        # 2. 좌표 클릭 (cliclick 사용)
        if [[ "$COORD_MODE" == true ]]; then
            if command -v cliclick &>/dev/null; then
                cliclick "c:${INPUT_X},${INPUT_Y}" 2>/dev/null || {
                    log "WARN: cliclick 좌표 클릭 실패"
                }
                sleep 0.5
            else
                log "WARN: cliclick 미설치 — 좌표 클릭 스킵"
            fi
        fi

        # 3. 트리거 입력
        # osascript keystroke는 한글/특수문자에 취약하므로 pbcopy + paste 사용
        echo -n "$TRIGGER" | pbcopy
        osascript -e 'tell application "System Events" to keystroke "v" using command down' 2>/dev/null || {
            log "WARN: 붙여넣기 키 입력 실패"
        }
        sleep 0.3

        # 4. Enter 전송
        osascript -e 'tell application "System Events" to key code 36' 2>/dev/null || {
            log "WARN: Enter 키 전송 실패"
        }

        log "macOS 기동 시퀀스 완료"

        # 알림
        osascript -e "display notification \"에이전트 기동 완료\" with title \"👻 GHOSTNET KNOCKER\" sound name \"Glass\"" 2>/dev/null || true
        ;;

    # --- Linux ---
    linux)
        log "Linux 기동 시퀀스 시작..."
        export DISPLAY="${DISPLAY:-:0}"

        # 1. VS Code 창 찾기 + 활성화
        VSCODE_WID=$(xdotool search --name "$APP_NAME" 2>/dev/null | head -1 || true)
        if [[ -n "$VSCODE_WID" ]]; then
            xdotool windowactivate "$VSCODE_WID" 2>/dev/null || true
            sleep 1
            log "VS Code 창 활성화 (WID: $VSCODE_WID)"
        else
            log "WARN: VS Code 창을 찾을 수 없음"
        fi

        # 2. 좌표 클릭
        if [[ "$COORD_MODE" == true ]]; then
            xdotool mousemove "$INPUT_X" "$INPUT_Y" 2>/dev/null || true
            sleep 0.3
            xdotool click 1 2>/dev/null || true
            sleep 0.5
            log "좌표 클릭 완료 ($INPUT_X, $INPUT_Y)"
        fi

        # 3. 트리거 입력
        # xdotool type은 한글 입력에 문제가 있으므로 xclip + Ctrl+V 사용
        if command -v xclip &>/dev/null; then
            echo -n "$TRIGGER" | xclip -selection clipboard 2>/dev/null
            xdotool key ctrl+v 2>/dev/null || true
        elif command -v xsel &>/dev/null; then
            echo -n "$TRIGGER" | xsel --clipboard 2>/dev/null
            xdotool key ctrl+v 2>/dev/null || true
        else
            # 폴백: 영문만 가능
            xdotool type --clearmodifiers "$TRIGGER" 2>/dev/null || true
        fi
        sleep 0.3

        # 4. Enter
        xdotool key Return 2>/dev/null || true

        log "Linux 기동 시퀀스 완료"

        # 알림
        notify-send -u critical "👻 GHOSTNET KNOCKER" "에이전트 기동 완료" 2>/dev/null || true
        ;;

    # --- Windows (Git Bash / WSL) ---
    windows)
        log "Windows 기동 시퀀스 시작..."

        # schtasks로 미리 등록된 GHOSTNET_KNOCKER 예약 작업 실행
        if command -v schtasks.exe &>/dev/null; then
            schtasks.exe /run /TN "GHOSTNET_KNOCKER" 2>/dev/null && {
                log "schtasks GHOSTNET_KNOCKER 실행 성공"
            } || {
                log "WARN: schtasks 실행 실패 — 예약 작업이 등록되지 않았을 수 있음"

                # 폴백: psexec 시도
                if command -v psexec.exe &>/dev/null; then
                    SESSION_ID=$(qwinsta.exe 2>/dev/null | grep "Active" | awk '{print $3}' || echo "1")
                    psexec.exe -i "$SESSION_ID" -accepteula cmd.exe /c "echo $TRIGGER | clip && timeout /t 1 && powershell -command \"Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v'); Start-Sleep -Milliseconds 300; [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')\"" 2>/dev/null || {
                        log "WARN: psexec 실행도 실패"
                    }
                else
                    log "ERROR: schtasks, psexec 모두 사용 불가"
                fi
            }
        else
            log "ERROR: schtasks.exe를 찾을 수 없음 (Windows 환경이 맞는지 확인)"
        fi

        log "Windows 기동 시퀀스 완료"
        ;;

    *)
        log "ERROR: 알 수 없는 OS — $OS_TYPE"
        exit 1
        ;;
esac

log "KNOCKER v2 완료"

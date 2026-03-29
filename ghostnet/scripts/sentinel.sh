#!/bin/bash
# ============================================================================
# GHOSTNET SENTINEL (감시병) v1.0
# 고스트 망의 메시지를 주기적으로 감시하고 새 메시지 도착 시 알림/기동한다.
#
# 사용법:
#   chmod +x sentinel.sh
#   ./sentinel.sh              # 1회 실행
#   crontab: */5 * * * * /path/to/sentinel.sh  # 5분 간격 cronjob
#
# 환경변수:
#   GHOSTNET_DIR  — ghostnet 루트 디렉토리 (기본: 스크립트 위치의 상위)
#   MACHINE_ID    — 이 기기의 ID (자동 감지 시도)
# ============================================================================

set -euo pipefail

# --- 경로 설정 ---
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GHOSTNET_DIR="${GHOSTNET_DIR:-$(dirname "$SCRIPT_DIR")}"
REPULSION_DIR="$(dirname "$GHOSTNET_DIR")"

BOARD_DIR="$GHOSTNET_DIR/board"
WHISPER_DIR="$GHOSTNET_DIR/whisper"
WAKE_DIR="$GHOSTNET_DIR/wake"
LOG_DIR="$GHOSTNET_DIR/logs"
SCRIPTS_DIR="$GHOSTNET_DIR/scripts"

# --- 기기 ID 감지 ---
detect_machine_id() {
    # roster 파일에서 현재 hostname과 매칭되는 기기 찾기
    local hostname
    hostname="$(hostname -s 2>/dev/null || hostname)"

    # Tailscale hostname 시도
    if command -v tailscale &>/dev/null; then
        local ts_hostname
        ts_hostname="$(tailscale status --self --json 2>/dev/null | grep -o '"HostName":"[^"]*"' | head -1 | cut -d'"' -f4 || true)"
        if [[ -n "$ts_hostname" ]]; then
            echo "$ts_hostname"
            return
        fi
    fi

    # roster 파일들에서 매칭 시도
    for roster_file in "$GHOSTNET_DIR/roster/"*.json; do
        [[ -f "$roster_file" ]] || continue
        local machine_id
        machine_id="$(basename "$roster_file" .json)"
        # hostname과 기기 ID가 부분 일치하면 사용
        if echo "$hostname" | grep -qi "${machine_id%%-*}"; then
            echo "$machine_id"
            return
        fi
    done

    # 폴백: hostname 그대로 사용
    echo "$hostname"
}

MACHINE_ID="${MACHINE_ID:-$(detect_machine_id)}"

# --- 로그 ---
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/${MACHINE_ID}.log"

log() {
    local level="$1"
    shift
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*" >> "$LOG_FILE"
}

log "INFO" "=== SENTINEL 시작 (기기: $MACHINE_ID) ==="

# --- OS 감지 ---
detect_os() {
    case "$(uname -s)" in
        Darwin) echo "macos" ;;
        Linux)  echo "linux" ;;
        MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
        *)      echo "unknown" ;;
    esac
}

OS_TYPE="$(detect_os)"

# --- Git Pull ---
git_pull() {
    cd "$REPULSION_DIR"
    if git pull --rebase --quiet origin main 2>/dev/null; then
        log "INFO" "git pull 성공"
        return 0
    else
        log "WARN" "git pull 실패 — 오프라인이거나 충돌 발생"
        git rebase --abort 2>/dev/null || true
        return 1
    fi
}

# --- 새 메시지 감지 ---
# jq 없이 동작하는 경량 JSON 파서 (grep + sed)
get_json_field() {
    local file="$1"
    local field="$2"
    grep "\"$field\"" "$file" 2>/dev/null | head -1 | sed 's/.*: *"\{0,1\}\([^",}]*\)"\{0,1\}.*/\1/'
}

# 내가 아직 acknowledgement하지 않은 메시지인지 확인
is_unread() {
    local file="$1"
    # acknowledgements 배열에 내 기기명이 없으면 미읽음
    if grep -q "\"by\": *\"$MACHINE_ID\"" "$file" 2>/dev/null; then
        return 1  # 이미 읽음
    fi
    # v1 호환: read_by에 내 기기명이 있으면 읽은 것으로 취급
    if grep -q "\"read_by\"" "$file" 2>/dev/null; then
        if grep -q "\"$MACHINE_ID\"" "$file" 2>/dev/null && ! grep -q "\"acknowledgements\"" "$file" 2>/dev/null; then
            return 1  # v1 형식으로 이미 읽음
        fi
    fi
    return 0  # 미읽음
}

get_priority_level() {
    local priority="$1"
    case "$priority" in
        critical) echo 4 ;;
        urgent)   echo 3 ;;
        normal)   echo 2 ;;
        low)      echo 1 ;;
        *)        echo 2 ;;
    esac
}

# --- 메시지 스캔 ---
NEW_MESSAGES=()
HIGHEST_PRIORITY=0
NEED_KNOCKER=false

scan_directory() {
    local dir="$1"
    local source="$2"  # "board" or "whisper"

    [[ -d "$dir" ]] || return

    for msg_file in "$dir"/*.json; do
        [[ -f "$msg_file" ]] || continue
        [[ "$(basename "$msg_file")" == ".gitkeep" ]] && continue

        if is_unread "$msg_file"; then
            local priority
            priority="$(get_json_field "$msg_file" "priority")"
            local subject
            subject="$(get_json_field "$msg_file" "subject")"
            local priority_level
            priority_level="$(get_priority_level "$priority")"

            NEW_MESSAGES+=("[$source] [$priority] $subject ($(basename "$msg_file"))")
            log "INFO" "새 메시지 발견: [$source] [$priority] $subject"

            if [[ "$priority_level" -gt "$HIGHEST_PRIORITY" ]]; then
                HIGHEST_PRIORITY="$priority_level"
            fi

            # critical 또는 urgent이면 KNOCKER 기동 필요
            if [[ "$priority_level" -ge 3 ]]; then
                NEED_KNOCKER=true
            fi
        fi
    done
}

# board/ 스캔
scan_directory "$BOARD_DIR" "board"

# whisper/{내 기기}/ 스캔
scan_directory "$WHISPER_DIR/$MACHINE_ID" "whisper"

# --- Wake 트리거 확인 ---
WAKE_FILE="$WAKE_DIR/${MACHINE_ID}.trigger.json"
if [[ -f "$WAKE_FILE" ]]; then
    log "INFO" "Wake 트리거 감지: $WAKE_FILE"
    NEED_KNOCKER=true
    rm -f "$WAKE_FILE"
    cd "$REPULSION_DIR"
    git add "$WAKE_FILE" 2>/dev/null || true
    git commit -m "ghostnet: wake trigger consumed by $MACHINE_ID" --quiet 2>/dev/null || true
fi

# --- 결과 처리 ---
if [[ ${#NEW_MESSAGES[@]} -eq 0 ]]; then
    log "INFO" "새 메시지 없음. 정상 종료."
else
    log "INFO" "새 메시지 ${#NEW_MESSAGES[@]}건 감지 (최고 우선순위: $HIGHEST_PRIORITY)"

    # KNOCKER 기동 필요 시
    if [[ "$NEED_KNOCKER" == true ]]; then
        log "INFO" "KNOCKER 기동 시작..."
        if [[ -x "$SCRIPTS_DIR/knocker.sh" ]]; then
            "$SCRIPTS_DIR/knocker.sh" "$MACHINE_ID" "$OS_TYPE" "${NEW_MESSAGES[*]}" 2>&1 | while read -r line; do
                log "KNOCKER" "$line"
            done
        else
            log "WARN" "knocker.sh를 찾을 수 없거나 실행 권한 없음"

            # 폴백: OS 네이티브 알림
            case "$OS_TYPE" in
                macos)
                    osascript -e "display notification \"고스트넷: 새 메시지 ${#NEW_MESSAGES[@]}건 (긴급)\" with title \"👻 GHOSTNET\" sound name \"Glass\"" 2>/dev/null || true
                    ;;
                linux)
                    notify-send "👻 GHOSTNET" "새 메시지 ${#NEW_MESSAGES[@]}건 (긴급)" 2>/dev/null || true
                    ;;
            esac
        fi
    fi
fi

# --- 로그 크기 관리 (1MB 초과 시 로테이션) ---
if [[ -f "$LOG_FILE" ]]; then
    LOG_SIZE=$(wc -c < "$LOG_FILE" 2>/dev/null || echo 0)
    if [[ "$LOG_SIZE" -gt 1048576 ]]; then
        mv "$LOG_FILE" "${LOG_FILE}.old"
        log "INFO" "로그 로테이션 완료"
    fi
fi

log "INFO" "=== SENTINEL 종료 ==="

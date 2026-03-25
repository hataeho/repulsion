#!/bin/bash
# ============================================================================
# GHOSTNET ARCHIVER (아카이버) v1.0
# 30일 이상 경과한 resolved/archived 메시지를 archive/ 디렉토리로 이동한다.
#
# 사용법:
#   chmod +x archive.sh
#   ./archive.sh              # 1회 실행
#   crontab: 0 3 * * * /path/to/archive.sh  # 매일 03:00 실행
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GHOSTNET_DIR="$(dirname "$SCRIPT_DIR")"
REPULSION_DIR="$(dirname "$GHOSTNET_DIR")"

BOARD_DIR="$GHOSTNET_DIR/board"
WHISPER_DIR="$GHOSTNET_DIR/whisper"
ARCHIVE_DIR="$GHOSTNET_DIR/archive"
LOG_DIR="$GHOSTNET_DIR/logs"

DAYS_THRESHOLD=30
ARCHIVED_COUNT=0

# 현재 날짜 (epoch)
if date --version &>/dev/null 2>&1; then
    # GNU date (Linux)
    CURRENT_EPOCH=$(date +%s)
    date_to_epoch() { date -d "$1" +%s 2>/dev/null || echo 0; }
else
    # BSD date (macOS)
    CURRENT_EPOCH=$(date +%s)
    date_to_epoch() { date -jf "%Y-%m-%d" "$1" +%s 2>/dev/null || echo 0; }
fi

THRESHOLD_EPOCH=$((CURRENT_EPOCH - DAYS_THRESHOLD * 86400))

log() {
    local log_file="$LOG_DIR/archive.log"
    mkdir -p "$LOG_DIR"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ARCHIVER] $*" >> "$log_file"
}

log "=== 아카이브 시작 (기준: ${DAYS_THRESHOLD}일) ==="

# 메시지 파일에서 날짜 추출 (파일명 기반)
get_message_date() {
    local filename
    filename="$(basename "$1")"
    echo "$filename" | grep -oE '^[0-9]{4}-[0-9]{2}-[0-9]{2}' || echo ""
}

# 스레드 상태 확인
is_archivable() {
    local file="$1"
    # resolved 또는 archived 상태인지 확인
    if grep -q '"status"' "$file" 2>/dev/null; then
        local status
        status=$(grep '"status"' "$file" | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')
        if [[ "$status" == "resolved" || "$status" == "archived" ]]; then
            return 0
        fi
        return 1
    fi
    # status 필드 없으면 (v1 메시지) 날짜만으로 판단
    return 0
}

archive_message() {
    local file="$1"
    local msg_date
    msg_date="$(get_message_date "$file")"

    [[ -z "$msg_date" ]] && return

    local msg_epoch
    msg_epoch="$(date_to_epoch "$msg_date")"
    [[ "$msg_epoch" -eq 0 ]] && return

    # 기준일 이전인지 확인
    if [[ "$msg_epoch" -lt "$THRESHOLD_EPOCH" ]]; then
        # 아카이브 가능 상태인지 확인
        if is_archivable "$file"; then
            local year_month
            year_month="$(echo "$msg_date" | cut -d'-' -f1,2)"
            local dest_dir="$ARCHIVE_DIR/$year_month"
            mkdir -p "$dest_dir"

            mv "$file" "$dest_dir/"
            log "아카이브: $(basename "$file") → archive/$year_month/"
            ARCHIVED_COUNT=$((ARCHIVED_COUNT + 1))
        else
            log "스킵 (미해결): $(basename "$file")"
        fi
    fi
}

# board/ 스캔
for msg_file in "$BOARD_DIR"/*.json; do
    [[ -f "$msg_file" ]] || continue
    [[ "$(basename "$msg_file")" == ".gitkeep" ]] && continue
    archive_message "$msg_file"
done

# whisper/ 하위 디렉토리 스캔
for whisper_subdir in "$WHISPER_DIR"/*/; do
    [[ -d "$whisper_subdir" ]] || continue
    for msg_file in "$whisper_subdir"*.json; do
        [[ -f "$msg_file" ]] || continue
        archive_message "$msg_file"
    done
done

log "아카이브 완료: ${ARCHIVED_COUNT}건 이동"

# Git 커밋 (변경 사항이 있을 때만)
if [[ "$ARCHIVED_COUNT" -gt 0 ]]; then
    cd "$REPULSION_DIR"
    git add ghostnet/board/ ghostnet/whisper/ ghostnet/archive/ 2>/dev/null || true
    git commit -m "ghostnet: archive ${ARCHIVED_COUNT} old messages" --quiet 2>/dev/null || true
    log "Git 커밋 완료"
fi

log "=== 아카이브 종료 ==="

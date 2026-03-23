#!/bin/bash
# Dotfiles Setup Script (macOS / Linux)
# 용도: ~/.gemini/GEMINI.md → dotfiles/.gemini/GEMINI.md 심볼릭 링크 생성

set -e

# 현재 스크립트 위치 기반으로 dotfiles 루트 결정
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_FILE="$SCRIPT_DIR/.gemini/GEMINI.md"
TARGET_DIR="$HOME/.gemini"
TARGET_FILE="$TARGET_DIR/GEMINI.md"

# 정본 파일 존재 확인
if [ ! -f "$SOURCE_FILE" ]; then
    echo "[ERROR] 정본 파일 없음: $SOURCE_FILE"
    exit 1
fi

# ~/.gemini/ 디렉토리 없으면 생성
if [ ! -d "$TARGET_DIR" ]; then
    mkdir -p "$TARGET_DIR"
    echo "[OK] 디렉토리 생성: $TARGET_DIR"
fi

# 기존 파일 처리
if [ -e "$TARGET_FILE" ] || [ -L "$TARGET_FILE" ]; then
    if [ -L "$TARGET_FILE" ]; then
        CURRENT_TARGET="$(readlink "$TARGET_FILE")"
        if [ "$CURRENT_TARGET" = "$SOURCE_FILE" ]; then
            echo "[OK] 이미 올바른 symlink 설정됨: $TARGET_FILE -> $SOURCE_FILE"
            exit 0
        fi
        rm "$TARGET_FILE"
        echo "[INFO] 기존 symlink 제거 (잘못된 대상)"
    else
        BACKUP_FILE="${TARGET_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
        mv "$TARGET_FILE" "$BACKUP_FILE"
        echo "[INFO] 기존 파일 백업: $BACKUP_FILE"
    fi
fi

# 심볼릭 링크 생성
ln -s "$SOURCE_FILE" "$TARGET_FILE"
echo "[OK] Symlink 생성 완료: $TARGET_FILE -> $SOURCE_FILE"

echo ""
echo "=== 설정 완료 ==="
echo "이후 git pull만 하면 전역 설정이 자동 동기화됩니다."

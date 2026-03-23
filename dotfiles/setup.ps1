# Dotfiles Setup Script (Windows PowerShell)
# 관리자 권한으로 실행 필요: Start-Process powershell -Verb RunAs
# 용도: ~/.gemini/GEMINI.md → dotfiles/.gemini/GEMINI.md 심볼릭 링크 생성

$ErrorActionPreference = "Stop"

# 현재 스크립트 위치 기반으로 dotfiles 루트 결정
$DotfilesRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$SourceFile = Join-Path $DotfilesRoot ".gemini\GEMINI.md"
$TargetDir = Join-Path $env:USERPROFILE ".gemini"
$TargetFile = Join-Path $TargetDir "GEMINI.md"

# 정본 파일 존재 확인
if (-not (Test-Path $SourceFile)) {
    Write-Host "[ERROR] 정본 파일 없음: $SourceFile" -ForegroundColor Red
    exit 1
}

# ~/.gemini/ 디렉토리 없으면 생성
if (-not (Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
    Write-Host "[OK] 디렉토리 생성: $TargetDir" -ForegroundColor Green
}

# 기존 파일 처리
if (Test-Path $TargetFile) {
    $item = Get-Item $TargetFile
    if ($item.LinkType -eq "SymbolicLink") {
        $currentTarget = $item.Target
        if ($currentTarget -eq $SourceFile) {
            Write-Host "[OK] 이미 올바른 symlink 설정됨: $TargetFile -> $SourceFile" -ForegroundColor Green
            exit 0
        }
        # 잘못된 대상을 가리키는 symlink → 삭제 후 재생성
        Remove-Item $TargetFile -Force
        Write-Host "[INFO] 기존 symlink 제거 (잘못된 대상)" -ForegroundColor Yellow
    } else {
        # 일반 파일 → 백업
        $BackupFile = "$TargetFile.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Move-Item $TargetFile $BackupFile
        Write-Host "[INFO] 기존 파일 백업: $BackupFile" -ForegroundColor Yellow
    }
}

# 심볼릭 링크 생성
try {
    New-Item -ItemType SymbolicLink -Path $TargetFile -Target $SourceFile | Out-Null
    Write-Host "[OK] Symlink 생성 완료: $TargetFile -> $SourceFile" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Symlink 생성 실패. 관리자 권한으로 실행하세요:" -ForegroundColor Red
    Write-Host "  Start-Process powershell -Verb RunAs -ArgumentList '-File', '$($MyInvocation.MyCommand.Path)'" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== 설정 완료 ===" -ForegroundColor Cyan
Write-Host "이후 git pull만 하면 전역 설정이 자동 동기화됩니다." -ForegroundColor Cyan

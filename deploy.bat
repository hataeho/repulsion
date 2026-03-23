@echo off
chcp 65001 >nul
echo ========================================
echo   bigmap.ai/STK 배포 스크립트
echo ========================================

set SERVER=ubuntu@43.201.223.4
set KEY=C:\REPULSION\LightsailDefaultKey-ap-northeast-2.pem
set REMOTE_DIR=/home/ubuntu/bigmap.ai/STK

echo.
echo [1/4] SSH 키 확인 중...
if not exist "%KEY%" (
    echo ❌ SSH 키 파일이 없습니다: %KEY%
    echo    Lightsail 콘솔에서 다운로드 후 C:\REPULSION\ 에 넣어주세요.
    pause
    exit /b 1
)
echo ✅ SSH 키 발견

echo.
echo [2/4] 서버에 STK 폴더 생성 중...
ssh -i "%KEY%" -o StrictHostKeyChecking=no %SERVER% "mkdir -p %REMOTE_DIR%"
if %errorlevel% neq 0 (
    echo ❌ 서버 연결 실패
    pause
    exit /b 1
)
echo ✅ 서버 연결 성공

echo.
echo [3/4] 파일 업로드 중...
scp -i "%KEY%" -o StrictHostKeyChecking=no "C:\REPULSION\dashboard.html" %SERVER%:%REMOTE_DIR%/index.html
scp -i "%KEY%" -o StrictHostKeyChecking=no "C:\REPULSION\건강한_병아리_생산.html" %SERVER%:%REMOTE_DIR%/chick.html
scp -i "%KEY%" -o StrictHostKeyChecking=no "C:\REPULSION\건강한_병아리_생산.pdf" %SERVER%:%REMOTE_DIR%/chick.pdf
scp -i "%KEY%" -o StrictHostKeyChecking=no "C:\REPULSION\수의사_로드맵.html" %SERVER%:%REMOTE_DIR%/roadmap.html
scp -i "%KEY%" -o StrictHostKeyChecking=no "C:\REPULSION\수의사_로드맵.pdf" %SERVER%:%REMOTE_DIR%/roadmap.pdf
echo ✅ 파일 업로드 완료

echo.
echo [4/4] 서버에서 파일 확인 중...
ssh -i "%KEY%" -o StrictHostKeyChecking=no %SERVER% "ls -la %REMOTE_DIR%/"

echo.
echo ========================================
echo   ✅ 배포 완료!
echo   https://bigmap.ai/STK/
echo   https://bigmap.ai/STK/index.html   (대시보드)
echo   https://bigmap.ai/STK/roadmap.html (로드맵)
echo   https://bigmap.ai/STK/chick.html   (병아리 생산)
echo ========================================
pause

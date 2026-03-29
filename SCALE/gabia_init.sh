#!/bin/bash
# ==============================================================================
# 가비아 VPS (Ubuntu 22.04 LTS) 초기화 스크립트
# 용도: Nginx, Node.js, PM2, 방화벽 세팅 및 Antigravity 포트 오픈
# 실행: ssh 접속 후, bash gabia_init.sh
# ==============================================================================

# 1. 시스템 업데이트 방화벽 세팅
echo ">>> [1/5] System Update & Firewall Configuration"
sudo apt update && sudo apt upgrade -y
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp  # Agent Bridge
sudo ufw allow 3333/tcp  # API
sudo ufw allow 3456/tcp  # SimWorld Analytics
yes | sudo ufw enable

# 2. 필수 패키지 설치 (Nginx, Git, rsync)
echo ">>> [2/5] Installing Core Packages (Nginx, Git, cURL)"
sudo apt install -y nginx git curl rsync build-essential

# 3. Node.js (v20) & PM2 설치
echo ">>> [3/5] Installing Node.js 20.x and PM2"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
pm2 startup ubuntu -u root --hp /root

# 4. 앱 디렉토리 스켈레톤 생성
echo ">>> [4/5] Creating Application Directories"
sudo mkdir -p /var/www/bigmap.ai/STK
sudo mkdir -p /var/www/bigmap.ai/api-server
sudo chown -R $USER:$USER /var/www/bigmap.ai

# 5. Let's Encrypt Certbot 설치
echo ">>> [5/5] Installing Certbot (Let's Encrypt)"
sudo apt install -y certbot python3-certbot-nginx

echo "========================================================================"
echo "✅ 가비아 VPS 기초 환경 셋업이 완료되었습니다."
echo "✅ 다음 단계: rsync로 AWS(43.201.223.4)에서 데이터를 PULL 하십시오."
echo "========================================================================"

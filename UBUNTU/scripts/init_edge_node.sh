#!/bin/bash

# ==============================================================================
# BigMap Ubuntu Edge Node Initialization Script (Automated Build)
# ==============================================================================
# This script sets up a basic Ubuntu server to act as a unified development
# edge node, synchronized with the existing AWS ecosystem.
# Ensures Docker, Remote Access (SSH/VNC), Power settings, and Firewalls are ready.
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status

echo "[1/4] System Update & Essential Packages Installation..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git openssh-server apt-transport-https ca-certificates software-properties-common dbus-x11

echo "[2/4] Setting Up Uncomplicated Firewall (UFW)..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 5900/tcp    # RealVNC Default
sudo ufw allow 5901/tcp    # TigerVNC Display :1
sudo ufw allow 5999/tcp    # RealVNC Virtual Mode
echo "y" | sudo ufw enable

echo "[3/4] Installing Docker Ecosystem (AWS Parity)..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  rm get-docker.sh
  sudo usermod -aG docker $USER
  echo "[!] Docker installed. Please note: You must log out and back in to run docker without sudo."
else
  echo "[!] Docker already installed."
fi

echo "[4/4] Optimizing Power & Suspend Settings for Edge Server Role..."
# Disable sleep, suspend, hibernate completely
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target

# Disable lid close suspend (for laptops/NUCs)
sudo sed -i 's/#HandleLidSwitch=suspend/HandleLidSwitch=ignore/g' /etc/systemd/logind.conf

# Restart logind to apply lid settings
sudo systemctl restart systemd-logind.service

# Apply GNOME specific gsettings to completely disable screen blanking/locking
# Note: These may require a D-Bus session if run outside a GUI environment, 
# hence using dbus-launch or ensuring they run within the user's graphical session.
export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus
gsettings set org.gnome.desktop.session idle-delay 0 || true
gsettings set org.gnome.desktop.screensaver lock-enabled false || true
gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type 'nothing' || true

echo "=============================================================================="
echo "Initialization Complete. Server is now provisioned for edge development."
echo "Please restart the server to apply user group changes (Docker)."
echo "=============================================================================="

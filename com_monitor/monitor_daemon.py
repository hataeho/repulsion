import json
import time
import subprocess
import socket
import smtplib
from email.mime.text import MIMEText
from datetime import datetime
import os

CONFIG_FILE = 'config.json'
STATUS_FILE = 'status.json'
MAX_RETRIES = 3
CHECK_INTERVAL = 60 # seconds

def load_config():
    if not os.path.exists(CONFIG_FILE):
        default_config = {
            "smtp": {
                "host": "mail.privateemail.com",
                "port": 465,
                "user": "bigmap@bigmap.ai",
                "password": "Bm20127202!",
                "to_email": "sarangnet@gmail.com"
            },
            "devices": [
                {"id": "test_local", "name": "Localhost (Test)", "ip": "127.0.0.1", "type": "ping"},
                {"id": "aws_server", "name": "AWS Lightsail", "ip": "43.201.223.4", "type": "ping"}
            ]
        }
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(default_config, f, indent=4, ensure_ascii=False)
        return default_config
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_status():
    if not os.path.exists(STATUS_FILE):
        return {}
    with open(STATUS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_status(status_dict):
    with open(STATUS_FILE, 'w', encoding='utf-8') as f:
        json.dump(status_dict, f, indent=4, ensure_ascii=False)

def check_ping(ip):
    # macOS ping
    try:
        output = subprocess.run(['ping', '-c', '1', '-W', '2000', ip], capture_output=True, text=True)
        return output.returncode == 0
    except Exception:
        return False

def check_tcp(ip, port):
    try:
        with socket.create_connection((ip, port), timeout=2.0):
            return True
    except Exception:
        return False

def send_alert(config, device, old_status, new_status):
    smtp_cfg = config['smtp']
    status_text = "ONLINE" if new_status == "online" else "OFFLINE"
    emoji = "🟢" if new_status == "online" else "🔴"
    
    subject = f"[{status_text}] {device['name']} 통신 상태 변경"
    body = f"{emoji} 장비명: {device['name']}\nIP 주소: {device['ip']}\n상태 변경: {old_status} -> {new_status}\n시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = smtp_cfg['user']
    msg['To'] = smtp_cfg['to_email']
    
    try:
        with smtplib.SMTP_SSL(smtp_cfg['host'], smtp_cfg['port']) as server:
            server.login(smtp_cfg['user'], smtp_cfg['password'])
            server.send_message(msg)
        print(f"Alert sent: {subject}")
    except Exception as e:
        print(f"Failed to send alert: {e}")

def main():
    import sys
    run_once = '--once' in sys.argv
    print("Starting Communication Monitor Daemon...")
    while True:
        config = load_config()
        status = load_status()
        
        for dev in config['devices']:
            dev_id = dev['id']
            dev_ip = dev['ip']
            dev_type = dev['type']
            
            if dev_id not in status:
                status[dev_id] = {
                    "status": "online",
                    "last_checked": "",
                    "failed_attempts": 0
                }
            
            is_up = False
            if dev_type == "ping":
                is_up = check_ping(dev_ip)
            elif dev_type == "tcp":
                is_up = check_tcp(dev_ip, dev.get('port', 80))
            
            curr_state = status[dev_id]
            curr_state["last_checked"] = datetime.now().isoformat()
            
            if is_up:
                if curr_state["status"] == "offline":
                    send_alert(config, dev, "offline", "online")
                curr_state["status"] = "online"
                curr_state["failed_attempts"] = 0
            else:
                curr_state["failed_attempts"] += 1
                if curr_state["failed_attempts"] >= MAX_RETRIES and curr_state["status"] == "online":
                    curr_state["status"] = "offline"
                    send_alert(config, dev, "online", "offline")
            
            status[dev_id] = curr_state
            
        save_status(status)
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Check completed.")
        
        if run_once:
            break
            
        print(f"Waiting {CHECK_INTERVAL}s...")
        time.sleep(CHECK_INTERVAL)

if __name__ == '__main__':
    main()

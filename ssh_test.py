import paramiko
import sys

try:
    print("라즈베리파이(192.168.0.250) SSH 접속 시도 중...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('192.168.0.250', username='pi', password='bluenet2002', timeout=5)
    print("=> 접속 성공!")
    
    stdin, stdout, stderr = ssh.exec_command('uname -a; uptime')
    print("\n[서버 정보 및 시스템 가동 시간]")
    print(stdout.read().decode('utf-8').strip())
    
    ssh.close()
except Exception as e:
    print(f"\n=> 접속 실패: {e}")
    sys.exit(1)

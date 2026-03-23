"""
MicroSynapse Observer - 저울(FS-4300) 실시간 값 읽기
라즈베리파이 공유 메모리(ID 1551)에서 직접 읽기

사용법: python read_scale.py
"""
import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

HOST = '192.168.0.250'
USER = 'pi'
PASS = 'bluenet2002'

REMOTE_SCRIPT = r'''
import sysv_ipc
import struct

shm = sysv_ipc.SharedMemory(1551)
data = shm.read()

# FS-4300 scale value: offset 4484 (float, 구조체 padding +1)
scale_value = struct.unpack_from('f', data, 4484)[0]
print("SCALE:%.1f" % scale_value)
'''

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=10)

sftp = ssh.open_sftp()
with sftp.open('/home/pi/read_scale_quick.py', 'w') as f:
    f.write(REMOTE_SCRIPT)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('python3 /home/pi/read_scale_quick.py')
out = stdout.read().decode('utf-8').strip()

if out.startswith("SCALE:"):
    value = float(out.split(":")[1])
    print(f"현재 저울 값: {value:.0f} kg")
else:
    print(f"읽기 실패: {out}")

ssh.close()

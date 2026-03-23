import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('192.168.0.250', username='pi', password='bluenet2002', timeout=10)

scan_script = r'''
import sysv_ipc
import struct

shm = sysv_ipc.SharedMemory(1551)
data = shm.read()

print("Shared memory size: %d bytes" % len(data))
print("\n=== Scanning for float values > 100 ===")

for offset in range(0, len(data) - 3):
    val = struct.unpack_from('f', data, offset)[0]
    if 100 < abs(val) < 100000 and val == val:  # not NaN
        print("  offset %5d (0x%04x): float = %.2f" % (offset, offset, val))

print("\n=== Scanning for int values 800-1000 ===")
for offset in range(0, len(data) - 3):
    val = struct.unpack_from('i', data, offset)[0]
    if 800 <= val <= 1000:
        print("  offset %5d (0x%04x): int = %d" % (offset, offset, val))

# Also show raw bytes around the FS-4300 area
# names end at offset 2 + 8*16*33 = 4226
# values start at 4226, FS-4300 is port 4 slave 0 = index 4*16+0 = 64
# float offset = 4226 + 64*4 = 4482
print("\n=== Raw bytes at FS-4300 area (offsets 4470-4510) ===")
for i in range(4470, 4520, 4):
    fv = struct.unpack_from('f', data, i)[0]
    iv = struct.unpack_from('i', data, i)[0]
    raw = data[i:i+4].hex()
    print("  offset %d: hex=%s float=%.2f int=%d" % (i, raw, fv if fv==fv else 0, iv))
'''

sftp = ssh.open_sftp()
with sftp.open('/home/pi/scan_shm.py', 'w') as f:
    f.write(scan_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('python3 /home/pi/scan_shm.py')
print(stdout.read().decode('utf-8', errors='replace'))
err = stderr.read().decode('utf-8', errors='replace')
if err: print("ERR:", err)

ssh.close()

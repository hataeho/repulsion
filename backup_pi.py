import paramiko
import os
import tarfile

HOST = '192.168.0.250'
USER = 'pi'
PASS = 'bluenet2002'

try:
    print("Connecting to Raspberry Pi...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS, timeout=10)
    print("Connected!")
    
    # Check directory
    print("Finding source files...")
    stdin, stdout, stderr = ssh.exec_command('ls -la /home/pi')
    print(stdout.read().decode())
    
    # Create archive
    print("Archiving source code...")
    stdin, stdout, stderr = ssh.exec_command('tar -czf /tmp/pi_src.tar.gz /home/pi/modbus /home/pi/scale /home/pi/*.py /home/pi/*.c /home/pi/*.sh 2>/dev/null')
    stdout.read() # wait for completion
    
    # Download
    print("Downloading archive...")
    sftp = ssh.open_sftp()
    sftp.get('/tmp/pi_src.tar.gz', 'c:/REPULSION/DISPATCH/pi_src.tar.gz')
    sftp.close()
    
    # Cleanup
    ssh.exec_command('rm /tmp/pi_src.tar.gz')
    ssh.close()
    print("Download complete.")
    
except Exception as e:
    print(f"Error: {e}")

import os
import sys
import subprocess

log = open('/home/pi/pi_modbus.log', 'w')
subprocess.Popen([sys.executable, '/home/pi/pi_modbus_master.py'], stdout=log, stderr=log, start_new_session=True)
print("pi_modbus_master started successfully.")

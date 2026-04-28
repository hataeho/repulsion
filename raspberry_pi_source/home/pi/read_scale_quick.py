
import sysv_ipc
import struct

shm = sysv_ipc.SharedMemory(1551)
data = shm.read()

# FS-4300 scale value: offset 4484 (float, 구조체 padding +1)
scale_value = struct.unpack_from('f', data, 4484)[0]
print("SCALE:%.1f" % scale_value)

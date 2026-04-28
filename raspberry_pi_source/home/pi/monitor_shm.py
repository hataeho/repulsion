
import sysv_ipc
import struct
import time

SHARED_MEMORY_ID = 1551
SERIAL_PORT_COUNT = 8
SERIAL_SLAVE_COUNT = 16
DEV_NAME_SIZE = 33

def read_serial_values():
    shm = sysv_ipc.SharedMemory(SHARED_MEMORY_ID)
    data = shm.read()
    
    # Skip: windowClientCount(1) + MESCount(1) + names(8*16*33=4224)
    value_offset = 2 + (SERIAL_PORT_COUNT * SERIAL_SLAVE_COUNT * DEV_NAME_SIZE)
    
    results = []
    for p in range(SERIAL_PORT_COUNT):
        for s in range(SERIAL_SLAVE_COUNT):
            val = struct.unpack_from('f', data, value_offset)[0]
            value_offset += 4
            results.append((p, s, val))
    return results

prev = None
print("Monitoring shared memory... (change the scale value!)")
print("=" * 50)

for cycle in range(60):  # monitor for 60 seconds
    vals = read_serial_values()
    nonzero = [(p, s, v) for p, s, v in vals if abs(v) > 0.001]
    
    if nonzero != prev:
        t = time.strftime("%H:%M:%S")
        if nonzero:
            for p, s, v in nonzero:
                ptype = "485" if p < 4 else "232"
                print("[%s] Port %d Slave %d (%s): %.1f" % (t, p, s, ptype, v))
        else:
            print("[%s] All values are 0.0" % t)
        prev = nonzero
    
    time.sleep(1)

print("\nDone monitoring.")

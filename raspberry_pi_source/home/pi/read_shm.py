
import sysv_ipc
import struct

SHARED_MEMORY_ID = 1551
SERIAL_PORT_COUNT = 8
SERIAL_SLAVE_COUNT = 16
DEV_NAME_SIZE = 33
GPIO_IN_COUNT = 10
GPIO_OUT_COUNT = 8
SOCKET_DEV_COUNT = 4

try:
    shm = sysv_ipc.SharedMemory(SHARED_MEMORY_ID)
    data = shm.read()
    offset = 0

    wc = struct.unpack_from('B', data, offset)[0]
    offset += 1
    print("Window Clients: %d" % wc)

    mc = struct.unpack_from('B', data, offset)[0]
    offset += 1
    print("MES Clients: %d" % mc)

    names = {}
    for p in range(SERIAL_PORT_COUNT):
        for s in range(SERIAL_SLAVE_COUNT):
            raw = data[offset:offset+DEV_NAME_SIZE]
            name = raw.decode('utf-8', errors='replace').rstrip('\x00')
            if name and name != '-':
                names[(p,s)] = name
            offset += DEV_NAME_SIZE

    values = {}
    for p in range(SERIAL_PORT_COUNT):
        for s in range(SERIAL_SLAVE_COUNT):
            val = struct.unpack_from('f', data, offset)[0]
            offset += 4
            if (p,s) in names:
                values[(p,s)] = val

    print("\n=== Serial Device Values ===")
    for key in sorted(names.keys()):
        p, s = key
        name = names[key]
        val = values.get(key, 0)
        ptype = "RS485" if p < 4 else "RS232"
        print("  Port %d Slave %d [%s]: %-20s = %.1f" % (p, s, ptype, name, val))

    print("\n=== Socket Device Values ===")
    soc_names = []
    for i in range(SOCKET_DEV_COUNT):
        name = data[offset:offset+DEV_NAME_SIZE].decode('utf-8', errors='replace').rstrip('\x00')
        soc_names.append(name)
        offset += DEV_NAME_SIZE

    for i in range(SOCKET_DEV_COUNT):
        val = struct.unpack_from('i', data, offset)[0]
        offset += 4
        print("  Socket %d [%s]: value = %d" % (i, soc_names[i], val))

    print("\n=== DIO Input Status ===")
    for i in range(GPIO_IN_COUNT):
        status = struct.unpack_from('?', data, offset)[0]
        offset += 1
        print("  IN#%d: %s" % (i, "ON" if status else "OFF"))

    for i in range(GPIO_IN_COUNT):
        offset += DEV_NAME_SIZE

    print("\n=== DIO Output Status ===")
    for i in range(GPIO_OUT_COUNT):
        status = struct.unpack_from('?', data, offset)[0]
        offset += 1
        print("  OUT#%d: %s" % (i, "ON" if status else "OFF"))

    for i in range(GPIO_OUT_COUNT):
        offset += DEV_NAME_SIZE

    print("\n=== DIO Input Counters ===")
    for i in range(GPIO_IN_COUNT):
        cnt = struct.unpack_from('I', data, offset)[0]
        offset += 4
        print("  DIN_%d: %d" % (i, cnt))

except Exception as e:
    print("Error: %s" % str(e))
    import traceback
    traceback.print_exc()

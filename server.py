# -*- coding: utf-8 -*-
"""체리부로 출하 자동화 시스템 – FastAPI Backend v3 (공차/총중량 분리)"""
from datetime import datetime
import asyncio, json, logging
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
from database import get_db, init_db, seed_drivers
from scale_reader import ScaleReader

logging.basicConfig(level=logging.INFO)
app = FastAPI(title="체리부로 출하 시스템")

# ── Scale ────────────────────────────────────────────────────
scale = ScaleReader(host="192.168.0.250", port=13450)
scale_clients: List[WebSocket] = []
scale_weight_cache = {"weight": 0, "stable": False, "connected": False}

def on_scale_weight(weight: int, stable: bool):
    scale_weight_cache["weight"] = weight
    scale_weight_cache["stable"] = stable
    scale_weight_cache["connected"] = scale.connected
    # Broadcast to all WebSocket clients
    msg = json.dumps(scale_weight_cache)
    disconnected = []
    for ws in scale_clients:
        try:
            asyncio.create_task(ws.send_text(msg))
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        scale_clients.remove(ws)

scale.on_weight(on_scale_weight)

@app.on_event("startup")
async def startup_event():
    init_db(); seed_drivers()
    await scale.start()
    asyncio.create_task(printer_monitor_task())

@app.on_event("shutdown")
async def shutdown_event():
    await scale.stop()

# ── Printer Monitor ──────────────────────────────────────────
async def printer_monitor_task():
    import subprocess
    global global_alert, global_alert_idx
    import platform
    if platform.system() != "Windows":
        return
        
    while True:
        try:
            # 기본적으로 프린터 상태 조회 (Status=3 이면 정상 대기)
            # PrinterStatus: 1(Other), 2(Unknown), 3(Idle), 4(Printing), 5(Warmup), 6(Stopped), 7(Offline)
            # DetectedErrorState: 0(Unknown), 1(Other), 2(NoError), 3(LowPaper), 4(NoPaper)... 
            cmd = ["powershell.exe", "-NoProfile", "-Command", "Get-WmiObject -Class Win32_Printer | Select-Object Name, PrinterStatus, DetectedErrorState, PrinterState | ConvertTo-Json"]
            
            # 일부 이벤트 루프(SelectorEventLoop 등)에서 create_subprocess_exec가 NotImplementedError를 발생시킬 수 있으므로 to_thread로 우회
            import subprocess
            proc = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True)
            stdout = proc.stdout
            if stdout:
                try:
                    printers = json.loads(stdout)
                    if not isinstance(printers, list):
                        printers = [printers]
                    error_found = False
                    for p in printers:
                        name = p.get('Name', 'Unknown')
                        if 'epson' in name.lower():
                            continue
                        status = p.get('PrinterStatus')
                        e_state = p.get('DetectedErrorState')
                        # 3(Idle), 4(Printing), 5(Warmup) 은 일단 정상 범주로 간주. 그 외는 에러나 오프라인.
                        if status not in (3, 4, 5) or (e_state is not None and e_state != 0 and e_state != 2):
                            error_found = True
                            # 알람을 연속해서 발생시키지 않기 위해 이미 에러 상태면 스킵하거나, 가장 최근 프린터 정보로 업데이트
                            global_alert_idx += 1
                            global_alert = {
                                "id": global_alert_idx,
                                "level": "error",
                                "title": "⚠️ 프린터 에러 감지",
                                "message": f"[{name}] 프린터에 이물질 걸림, 용지 없음, 또는 오프라인 문제가 발생했습니다. (상태코드: {status}, 에러코드: {e_state})",
                                "time": datetime.now().isoformat()
                            }
                            break # 하나라도 에러면 break
                except json.JSONDecodeError:
                    pass
        except Exception as e:
            import traceback
            err_str = traceback.format_exc()
            logging.error(f"Printer monitor error: {e}")
            logging.error(err_str)
            with open("printer_error.log", "w", encoding="utf-8") as f:
                f.write(err_str)
            
        await asyncio.sleep(15)


# ── Models ───────────────────────────────────────────────────
class DriverCreate(BaseModel):
    name: str; vehicle_no: int; phone: str = ""

class DriverUpdate(BaseModel):
    name: Optional[str] = None; vehicle_no: Optional[int] = None; phone: Optional[str] = None

class BatchCreate(BaseModel):
    name: str; start_date: str = ""; end_date: str = ""
    farm_name: str = "공암산성"; farm_owner: str = "윤은희"
    destination: str = "체리부로"; house_counts: str = ""; total_count: int = 0
    feed_amount: int = 0

class ShipmentCloseRequest(BaseModel):
    feed_amount: int = 0

class ShipmentDayCreate(BaseModel):
    batch_id: int; day_number: int; age_days: float = 0
    target_weight: float = 0; ship_date: str = ""; truck_count: int = 0
    default_head_count: int = 2480; shipment_type: str = "솎기"

class ShipmentDayUpdate(BaseModel):
    day_number: Optional[int] = None; age_days: Optional[float] = None
    target_weight: Optional[float] = None; ship_date: Optional[str] = None; truck_count: Optional[int] = None
    default_head_count: Optional[int] = None; shipment_type: Optional[str] = None

class EmptyWeightRecord(BaseModel):
    """공차 등록 (저울값)"""
    driver_id: int
    vehicle_no: int
    driver_name: str
    weight: int

class GrossWeightRecord(BaseModel):
    """총중량 등록 (저울값)"""
    load_id: int
    weight: int
    head_count: int = 0

class SettingsUpdate(BaseModel):
    min_empty_weight: int = 7000
    max_empty_weight: int = 9000
    default_head_count: int = 2480
    weight_error_gram: int = 200
    start_date: str = ""

class AdminLoadUpdate(BaseModel):
    vehicle_no: int
    driver_name: str
    empty_weight: int
    gross_weight: int
    net_weight: int
    head_count: int
    avg_weight: float

class AlertMsg(BaseModel):
    level: str
    title: str
    message: str

global_alert = {"id": 0, "level": "", "title": "", "message": "", "time": ""}
global_alert_idx = 0
# ── Pages ────────────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
async def kiosk_page():
    with open("static/kiosk.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/setup", response_class=HTMLResponse)
async def setup_page():
    with open("static/setup.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/report", response_class=HTMLResponse)
async def report_page():
    with open("static/report.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/admin", response_class=HTMLResponse)
async def admin_page():
    with open("static/admin.html", "r", encoding="utf-8") as f:
        return f.read()

app.mount("/static", StaticFiles(directory="static"), name="static")


# ══ WebSocket: 저울 실시간 중량 ════════════════════════
@app.websocket("/ws/scale")
async def websocket_scale(ws: WebSocket):
    await ws.accept()
    scale_clients.append(ws)
    # 접속 시 현재 값 전송
    try:
        await ws.send_text(json.dumps(scale_weight_cache))
        while True:
            # 클라이언트 ping 대기 (연결 유지)
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        if ws in scale_clients:
            scale_clients.remove(ws)

@app.get("/api/scale")
def get_scale_weight():
    """HTTP 폴링용 저울 중량 API"""
    return scale_weight_cache

@app.post("/api/alerts")
def post_alert(a: AlertMsg):
    global global_alert, global_alert_idx
    global_alert_idx += 1
    global_alert = {
        "id": global_alert_idx,
        "level": a.level,
        "title": a.title,
        "message": a.message,
        "time": datetime.now().isoformat()
    }
    return global_alert

@app.get("/api/alerts")
def get_alert():
    return global_alert

@app.delete("/api/alerts")
def clear_alert():
    global global_alert
    global_alert = {}
    return {"ok": True}

@app.patch("/api/loads/{load_id}/move")
def move_load(load_id: int, target_sd_id: int):
    conn = get_db()
    cur = conn.execute("UPDATE load SET shipment_day_id=? WHERE id=?", (target_sd_id, load_id))
    conn.commit()
    if cur.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Load not found")
    conn.close()
    return {"ok": True, "load_id": load_id, "new_shipment_day_id": target_sd_id}

# ══════════════════════════════════════════════════════════════
#  SETTINGS API
# ══════════════════════════════════════════════════════════════
@app.get("/api/settings")
def get_settings():
    conn = get_db()
    rows = conn.execute("SELECT key, value FROM settings").fetchall()
    conn.close()
    return {r["key"]: r["value"] for r in rows}

@app.put("/api/settings")
def update_settings(s: SettingsUpdate):
    conn = get_db()
    conn.execute("INSERT OR REPLACE INTO settings (key,value) VALUES ('min_empty_weight',?)", (str(s.min_empty_weight),))
    conn.execute("INSERT OR REPLACE INTO settings (key,value) VALUES ('max_empty_weight',?)", (str(s.max_empty_weight),))
    conn.execute("INSERT OR REPLACE INTO settings (key,value) VALUES ('default_head_count',?)", (str(s.default_head_count),))
    conn.execute("INSERT OR REPLACE INTO settings (key,value) VALUES ('weight_error_gram',?)", (str(s.weight_error_gram),))
    if s.start_date:
        conn.execute("INSERT OR REPLACE INTO settings (key,value) VALUES ('start_date',?)", (s.start_date,))
    conn.commit(); conn.close()
    return {"message": "설정 저장 완료"}


# ══════════════════════════════════════════════════════════════
#  DRIVER API
# ══════════════════════════════════════════════════════════════
@app.get("/api/drivers")
def list_drivers(q: str = ""):
    conn = get_db()
    if q:
        rows = conn.execute(
            "SELECT * FROM driver WHERE name LIKE ? OR CAST(vehicle_no AS TEXT) LIKE ? ORDER BY vehicle_no",
            (f"%{q}%", f"%{q}%")).fetchall()
    else:
        rows = conn.execute("SELECT * FROM driver ORDER BY vehicle_no").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/drivers/by-vehicle/{vehicle_no}")
def get_driver_by_vehicle(vehicle_no: int):
    conn = get_db()
    # 1) 정확 매칭 시도
    row = conn.execute("SELECT * FROM driver WHERE vehicle_no=?", (vehicle_no,)).fetchone()
    if not row:
        # 2) 끝자리 매칭 (예: 27 → 1027, 0027 등)
        vstr = str(vehicle_no)
        rows = conn.execute(
            "SELECT * FROM driver WHERE CAST(vehicle_no AS TEXT) LIKE ?",
            (f"%{vstr}",)).fetchall()
        if rows:
            row = rows[0]  # 첫 번째 매칭
    conn.close()
    if not row:
        raise HTTPException(404, "등록되지 않은 차량번호입니다")
    return dict(row)

@app.post("/api/drivers")
def create_driver(d: DriverCreate):
    conn = get_db()
    try:
        cur = conn.execute("INSERT INTO driver (name, vehicle_no, phone) VALUES (?, ?, ?)",
                           (d.name, d.vehicle_no, d.phone))
        conn.commit(); driver_id = cur.lastrowid
    except Exception as e:
        conn.close(); raise HTTPException(400, str(e))
    conn.close()
    return {"id": driver_id, "message": "등록 완료"}

@app.put("/api/drivers/{driver_id}")
def update_driver(driver_id: int, d: DriverUpdate):
    conn = get_db()
    fields, vals = [], []
    if d.name is not None: fields.append("name=?"); vals.append(d.name)
    if d.vehicle_no is not None: fields.append("vehicle_no=?"); vals.append(d.vehicle_no)
    if d.phone is not None: fields.append("phone=?"); vals.append(d.phone)
    if not fields: conn.close(); raise HTTPException(400, "변경 항목 없음")
    vals.append(driver_id)
    conn.execute(f"UPDATE driver SET {','.join(fields)} WHERE id=?", vals)
    conn.commit(); conn.close()
    return {"message": "수정 완료"}

@app.delete("/api/drivers/{driver_id}")
def delete_driver(driver_id: int):
    conn = get_db()
    conn.execute("DELETE FROM driver WHERE id=?", (driver_id,))
    conn.commit(); conn.close()
    return {"message": "삭제 완료"}


# ══════════════════════════════════════════════════════════════
#  BATCH & SHIPMENT DAY API
# ══════════════════════════════════════════════════════════════
@app.get("/api/batches")
def list_batches():
    conn = get_db()
    rows = conn.execute("SELECT * FROM batch ORDER BY id DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/batches/{batch_id}")
def get_batch(batch_id: int):
    conn = get_db()
    row = conn.execute("SELECT * FROM batch WHERE id=?", (batch_id,)).fetchone()
    if not row: conn.close(); raise HTTPException(404, "회차 없음")
    batch = dict(row)
    days = conn.execute("SELECT * FROM shipment_day WHERE batch_id=? ORDER BY day_number", (batch_id,)).fetchall()
    batch["shipment_days"] = [dict(d) for d in days]
    conn.close()
    return batch

@app.post("/api/batches")
def create_batch(b: BatchCreate):
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO batch (name,start_date,end_date,farm_name,farm_owner,destination,house_counts,total_count,feed_amount) VALUES (?,?,?,?,?,?,?,?,?)",
        (b.name, b.start_date, b.end_date, b.farm_name, b.farm_owner, b.destination, b.house_counts, b.total_count, b.feed_amount))
    conn.commit(); bid = cur.lastrowid; conn.close()
    return {"id": bid, "message": "회차 생성 완료"}

@app.put("/api/batches/{batch_id}")
def update_batch(batch_id: int, b: BatchCreate):
    conn = get_db()
    conn.execute("""
        UPDATE batch SET name=?, start_date=?, end_date=?, farm_name=?, farm_owner=?,
                         destination=?, house_counts=?, total_count=?, feed_amount=?
        WHERE id=?
    """, (b.name, b.start_date, b.end_date, b.farm_name, b.farm_owner,
          b.destination, b.house_counts, b.total_count, b.feed_amount, batch_id))
    conn.commit(); conn.close()
    return {"message": "회차 수정 완료"}

@app.post("/api/shipment-days")
def create_shipment_day(sd: ShipmentDayCreate):
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO shipment_day (batch_id,day_number,age_days,target_weight,ship_date,truck_count,default_head_count,shipment_type) VALUES (?,?,?,?,?,?,?,?)",
        (sd.batch_id, sd.day_number, sd.age_days, sd.target_weight, sd.ship_date, sd.truck_count, sd.default_head_count, sd.shipment_type))
    sid = cur.lastrowid
    
    # 공차 계량만 하고 상차하지 않은 차량들을 새 일차로 모두 자동 이동
    conn.execute("""
        UPDATE load 
        SET shipment_day_id = ?, trip_number = 1
        WHERE status = 'pending' AND shipment_day_id IN (
            SELECT id FROM shipment_day WHERE batch_id = ?
        )
    """, (sid, sd.batch_id))
    
    conn.commit()
    conn.close()
    return {"id": sid, "message": "출하차수 생성 완료"}

@app.put("/api/shipment-days/{sd_id}")
def update_shipment_day(sd_id: int, u: ShipmentDayUpdate):
    conn = get_db()
    row = conn.execute("SELECT * FROM shipment_day WHERE id=?", (sd_id,)).fetchone()
    if not row: conn.close(); raise HTTPException(404, "출하차수 없음")
    fields, vals = [], []
    if u.day_number is not None: fields.append("day_number=?"); vals.append(u.day_number)
    if u.age_days is not None: fields.append("age_days=?"); vals.append(u.age_days)
    if u.target_weight is not None: fields.append("target_weight=?"); vals.append(u.target_weight)
    if u.ship_date is not None: fields.append("ship_date=?"); vals.append(u.ship_date)
    if u.truck_count is not None: fields.append("truck_count=?"); vals.append(u.truck_count)
    if u.default_head_count is not None: fields.append("default_head_count=?"); vals.append(u.default_head_count)
    if u.shipment_type is not None: fields.append("shipment_type=?"); vals.append(u.shipment_type)
    if not fields: conn.close(); raise HTTPException(400, "변경 항목 없음")
    vals.append(sd_id)
    conn.execute(f"UPDATE shipment_day SET {','.join(fields)} WHERE id=?", vals)
    conn.commit(); conn.close()
    return {"message": "출하차수 수정 완료"}

@app.delete("/api/shipment-days/{sd_id}")
def delete_shipment_day(sd_id: int):
    conn = get_db()
    # 해당 일차에 계량 기록이 있는지 확인
    cnt = conn.execute("SELECT COUNT(*) FROM load WHERE shipment_day_id=?", (sd_id,)).fetchone()[0]
    if cnt > 0:
        conn.close()
        raise HTTPException(400, f"이 출하일수에 {cnt}건의 계량 기록이 있어 삭제할 수 없습니다. 먼저 계량 기록을 삭제하세요.")
    conn.execute("DELETE FROM shipment_day WHERE id=?", (sd_id,))
    conn.commit(); conn.close()
    return {"message": "출하차수 삭제 완료"}

@app.get("/api/active-shipment-day")
def get_active_shipment_day():
    conn = get_db()
    row = conn.execute("""
        SELECT sd.*, b.name as batch_name, b.farm_name, b.farm_owner, b.farm_address,
               b.farm_phone, b.farm_id, b.destination
        FROM shipment_day sd JOIN batch b ON b.id=sd.batch_id
        ORDER BY sd.id DESC LIMIT 1
    """).fetchone()
    
    if not row: 
        conn.close()
        raise HTTPException(404, "활성 출하차수 없음")
        
    # 최근 3대 완료 차량의 평체 평균 계산
    recent_loads = conn.execute("""
        SELECT avg_weight FROM load
        WHERE shipment_day_id=? AND status='done' AND avg_weight IS NOT NULL AND avg_weight > 0
        ORDER BY gross_at DESC LIMIT 3
    """, (row['id'],)).fetchall()
    
    conn.close()
    
    res = dict(row)
    if recent_loads:
        res['recent_3_avg_weight'] = sum(r['avg_weight'] for r in recent_loads) / len(recent_loads)
    else:
        res['recent_3_avg_weight'] = row['target_weight']
        
    return res


# ══════════════════════════════════════════════════════════════
#  KIOSK: 공차 등록 (PENDING)
# ══════════════════════════════════════════════════════════════
@app.post("/api/kiosk/empty")
def register_empty_weight(r: EmptyWeightRecord):
    """저울에서 읽은 공차를 pending 상태로 저장"""
    conn = get_db()
    # Get active shipment day
    sd = conn.execute("SELECT * FROM shipment_day ORDER BY id DESC LIMIT 1").fetchone()
    if not sd: conn.close(); raise HTTPException(400, "활성 출하차수가 없습니다")

    # Check 20-hour rule
    first_load = conn.execute(
        "SELECT empty_at FROM load WHERE shipment_day_id=? ORDER BY id ASC LIMIT 1",
        (sd["id"],)).fetchone()
    
    if first_load and first_load["empty_at"]:
        try:
            first_time = datetime.fromisoformat(first_load["empty_at"])
            delta = datetime.now() - first_time
            if delta.total_seconds() > 20 * 3600:
                conn.close()
                raise HTTPException(400, "20시간이 경과하여 출하일차가 마감되었습니다. 새로운 출하일차를 설정해주세요.")
        except ValueError:
            pass

    # Determine trip number (max 2 per vehicle)
    vehicle_loads = conn.execute(
        "SELECT COUNT(*) FROM load WHERE shipment_day_id=? AND vehicle_no=?",
        (sd["id"], r.vehicle_no)).fetchone()[0]

    if vehicle_loads >= 2:
        conn.close()
        raise HTTPException(400, "동일 차량은 같은 일차에 최대 2회까지만 상차 가능합니다.")
    
    trip_number = vehicle_loads + 1

    # 순번은 계량 완료 시 부여 (공차 등록 시에는 0)
    seq = 0
    now = datetime.now().isoformat()

    cur = conn.execute("""
        INSERT INTO load (shipment_day_id, driver_id, sequence, trip_number, vehicle_no, driver_name,
                          status, empty_weight, empty_at)
        VALUES (?,?,?,?,?,?, 'pending',?,?)
    """, (sd["id"], r.driver_id, seq, trip_number, r.vehicle_no, r.driver_name, r.weight, now))
    conn.commit()
    load_id = cur.lastrowid
    load = conn.execute("SELECT * FROM load WHERE id=?", (load_id,)).fetchone()
    conn.close()
    return dict(load)


# ══════════════════════════════════════════════════════════════
#  KIOSK: 대기 차량 목록
# ══════════════════════════════════════════════════════════════
@app.get("/api/kiosk/pending")
def list_pending():
    """공차 등록 후 총중량 대기 중인 차량 목록"""
    conn = get_db()
    rows = conn.execute("""
        SELECT * FROM load WHERE status='pending' ORDER BY id
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/kiosk/pending/{vehicle_no}")
def get_pending_by_vehicle(vehicle_no: int):
    """차량번호로 대기 중인 레코드 조회"""
    conn = get_db()
    row = conn.execute("""
        SELECT * FROM load WHERE vehicle_no=? AND status='pending' ORDER BY id DESC LIMIT 1
    """, (vehicle_no,)).fetchone()
    conn.close()
    if not row: raise HTTPException(404, "대기 중인 공차 기록이 없습니다")
    return dict(row)


# ══════════════════════════════════════════════════════════════
#  KIOSK: 이전 순번 수수 조회
# ══════════════════════════════════════════════════════════════
@app.get("/api/kiosk/last-heads/{sd_id}")
def get_last_head_count(sd_id: int):
    """이전 완료된 상차의 수수를 조회 (자동 입력용)"""
    conn = get_db()
    row = conn.execute(
        "SELECT head_count FROM load WHERE shipment_day_id=? AND status='done' AND head_count>0 ORDER BY sequence DESC LIMIT 1",
        (sd_id,)).fetchone()
        
    val = 2480
    if row:
        val = row["head_count"]
    else:
        sd_row = conn.execute("SELECT default_head_count FROM shipment_day WHERE id=?", (sd_id,)).fetchone()
        if sd_row and sd_row["default_head_count"]:
            val = sd_row["default_head_count"]
        else:
            s_row = conn.execute("SELECT value FROM settings WHERE key='default_head_count'").fetchone()
            if s_row: val = int(s_row["value"])
    conn.close()
    return {"head_count": val}


# ══════════════════════════════════════════════════════════════
#  KIOSK: 총중량 등록 (COMPLETE)
# ══════════════════════════════════════════════════════════════
@app.post("/api/kiosk/gross")
def register_gross_weight(r: GrossWeightRecord):
    """저울에서 읽은 총중량으로 계량 완료"""
    conn = get_db()
    load = conn.execute("SELECT * FROM load WHERE id=? AND status='pending'", (r.load_id,)).fetchone()
    if not load: conn.close(); raise HTTPException(404, "대기 중인 기록이 없습니다")

    ew = load["empty_weight"]
    gw = r.weight
    net = gw - ew

    # Head count: use provided, or default from settings
    hc = r.head_count
    if hc <= 0:
        # Try previous load's head count
        prev = conn.execute(
            "SELECT head_count FROM load WHERE shipment_day_id=? AND status='done' ORDER BY id DESC LIMIT 1",
            (load["shipment_day_id"],)).fetchone()
        if prev and prev["head_count"] > 0:
            hc = prev["head_count"]
        else:
            sd_row = conn.execute("SELECT default_head_count FROM shipment_day WHERE id=?", (load["shipment_day_id"],)).fetchone()
            if sd_row and sd_row["default_head_count"]:
                hc = sd_row["default_head_count"]
            else:
                s = conn.execute("SELECT value FROM settings WHERE key='default_head_count'").fetchone()
                hc = int(s["value"]) if s else 2480

    avg = round(net / hc, 4) if hc > 0 else 0
    now = datetime.now().isoformat()

    # 계량 완료 순번 부여
    max_seq = conn.execute(
        "SELECT COALESCE(MAX(sequence),0) FROM load WHERE shipment_day_id=? AND status='done'",
        (load["shipment_day_id"],)).fetchone()[0]
    seq = max_seq + 1

    conn.execute("""
        UPDATE load SET status='done', sequence=?, gross_weight=?, net_weight=?, head_count=?,
                        avg_weight=?, gross_at=?
        WHERE id=?
    """, (seq, gw, net, hc, avg, now, r.load_id))
    conn.commit()

    result = conn.execute("SELECT * FROM load WHERE id=?", (r.load_id,)).fetchone()

    # Also get batch info for certificate
    sd = conn.execute("""
        SELECT sd.*, b.name as batch_name, b.farm_name, b.farm_owner, b.farm_address,
               b.farm_phone, b.destination
        FROM shipment_day sd JOIN batch b ON b.id=sd.batch_id
        WHERE sd.id=?
    """, (result["shipment_day_id"],)).fetchone()

    conn.close()
    data = dict(result)
    data["batch_info"] = dict(sd) if sd else {}
    return data

@app.get("/api/kiosk/last-done/{vehicle_no}")
def get_last_done_by_vehicle(vehicle_no: int, sd_id: int = 0):
    """차량번호로 가장 최근에 완료된(done) 레코드와 배치 정보 조회 (재발행용)"""
    conn = get_db()
    
    # sd_id가 지정되면 해당 일차 내에서만 조회
    sd_filter = " AND shipment_day_id=?" if sd_id else ""
    params_exact = (vehicle_no,) + ((sd_id,) if sd_id else ())
    
    row = conn.execute(f"""
        SELECT * FROM load WHERE vehicle_no=? AND status='done'{sd_filter} ORDER BY id DESC LIMIT 1
    """, params_exact).fetchone()
    
    # 2. If no exact match, try partial match (end match)
    if not row:
        vstr = str(vehicle_no)
        params_like = (f"%{vstr}",) + ((sd_id,) if sd_id else ())
        row = conn.execute(f"""
            SELECT * FROM load WHERE CAST(vehicle_no AS TEXT) LIKE ? AND status='done'{sd_filter} ORDER BY id DESC LIMIT 1
        """, params_like).fetchone()
        
    if not row:
        conn.close()
        raise HTTPException(404, "완료된 계량 기록이 없습니다")

    # Also get batch info for certificate
    sd = conn.execute("""
        SELECT sd.*, b.name as batch_name, b.farm_name, b.farm_owner, b.farm_address,
               b.farm_phone, b.destination
        FROM shipment_day sd JOIN batch b ON b.id=sd.batch_id
        WHERE sd.id=?
    """, (row["shipment_day_id"],)).fetchone()

    conn.close()
    data = dict(row)
    data["batch_info"] = dict(sd) if sd else {}
    return data


# ══════════════════════════════════════════════════════════════
#  SUMMARY API
# ══════════════════════════════════════════════════════════════
@app.get("/api/shipment-days/{sd_id}/summary")
def shipment_day_summary(sd_id: int):
    conn = get_db()
    row = conn.execute("""
        SELECT COUNT(*) as truck_count, COALESCE(SUM(net_weight),0) as total_weight,
               COALESCE(SUM(head_count),0) as total_heads,
               CASE WHEN SUM(head_count)>0 THEN ROUND(CAST(SUM(net_weight) AS REAL)/SUM(head_count),4) ELSE 0 END as avg_weight
        FROM load WHERE shipment_day_id=? AND status='done'
    """, (sd_id,)).fetchone()
    conn.close()
    return dict(row)

@app.put("/api/admin/loads/{load_id}/cancel")
def cancel_load(load_id: int):
    conn = get_db()
    load = conn.execute("SELECT * FROM load WHERE id=?", (load_id,)).fetchone()
    if not load: conn.close(); raise HTTPException(404, "기록 없음")
    seq = int(load["sequence"])
    sd_id = load["shipment_day_id"]
    conn.execute("UPDATE load SET status='cancelled', gross_weight=0, net_weight=0, head_count=0, avg_weight=0 WHERE id=?", (load_id,))
    conn.execute("UPDATE load SET sequence=CAST(CAST(sequence AS INTEGER)-1 AS TEXT) WHERE shipment_day_id=? AND CAST(sequence AS INTEGER)>?", (sd_id, seq))
    conn.commit()
    conn.close()
    return {"ok": True, "message": f"#{load_id} 회차 처리 완료"}

@app.delete("/api/admin/loads/{load_id}")
def delete_load(load_id: int):
    conn = get_db()
    load = conn.execute("SELECT * FROM load WHERE id=?", (load_id,)).fetchone()
    if not load: conn.close(); raise HTTPException(404, "기록 없음")
    sd_id = load["shipment_day_id"]
    conn.execute("DELETE FROM load WHERE id=?", (load_id,))
    # 순번 재정렬
    done_loads = conn.execute("SELECT id FROM load WHERE shipment_day_id=? AND status='done' ORDER BY gross_at", (sd_id,)).fetchall()
    for i, row in enumerate(done_loads, 1):
        conn.execute("UPDATE load SET sequence=? WHERE id=?", (i, row["id"]))
    conn.commit()
    conn.close()
    return {"ok": True, "message": f"#{load_id} 삭제 완료 (순번 재정렬됨)"}

@app.get("/api/batches/{batch_id}/summary")
def batch_summary(batch_id: int):
    conn = get_db()
    days = conn.execute("""
        SELECT sd.id, sd.day_number, sd.age_days, sd.target_weight, sd.ship_date,
               COUNT(l.id) as truck_count, COALESCE(SUM(l.net_weight),0) as total_weight,
               COALESCE(SUM(l.head_count),0) as total_heads,
               CASE WHEN SUM(l.head_count)>0 THEN ROUND(CAST(SUM(l.net_weight) AS REAL)/SUM(l.head_count),4) ELSE 0 END as avg_weight
        FROM shipment_day sd LEFT JOIN load l ON l.shipment_day_id=sd.id AND l.status='done'
        WHERE sd.batch_id=? GROUP BY sd.id ORDER BY sd.day_number
    """, (batch_id,)).fetchall()
    totals = conn.execute("""
        SELECT COALESCE(SUM(l.net_weight),0) as total_weight, COALESCE(SUM(l.head_count),0) as total_heads,
               COUNT(l.id) as total_trucks
        FROM load l JOIN shipment_day sd ON sd.id=l.shipment_day_id
        WHERE sd.batch_id=? AND l.status='done'
    """, (batch_id,)).fetchone()
    all_loads = conn.execute("""
        SELECT l.*, sd.day_number, sd.age_days FROM load l
        JOIN shipment_day sd ON sd.id=l.shipment_day_id
        WHERE sd.batch_id=? AND l.status='done' ORDER BY sd.day_number, CAST(l.sequence AS INTEGER)
    """, (batch_id,)).fetchall()
    conn.close()
    return {"days": [dict(d) for d in days], "totals": dict(totals), "loads": [dict(l) for l in all_loads]}

@app.put("/api/batches/{batch_id}/close")
def close_batch(batch_id: int, r: ShipmentCloseRequest):
    """출하 종료: 사료량 저장 + shipment_closed=1"""
    conn = get_db()
    batch = conn.execute("SELECT * FROM batch WHERE id=?", (batch_id,)).fetchone()
    if not batch: conn.close(); raise HTTPException(404, "회차 없음")
    conn.execute("UPDATE batch SET feed_amount=?, shipment_closed=1 WHERE id=?", (r.feed_amount, batch_id))
    conn.commit(); conn.close()
    return {"message": "출하 종료 완료"}

@app.put("/api/batches/{batch_id}/reopen")
def reopen_batch(batch_id: int):
    """출하 재개: shipment_closed=0"""
    conn = get_db()
    conn.execute("UPDATE batch SET shipment_closed=0 WHERE id=?", (batch_id,))
    conn.commit(); conn.close()
    return {"message": "출하 재개"}

@app.get("/api/batches/{batch_id}/production")
def batch_production(batch_id: int):
    """생산지수 집계 API"""
    conn = get_db()
    batch = conn.execute("SELECT * FROM batch WHERE id=?", (batch_id,)).fetchone()
    if not batch: conn.close(); raise HTTPException(404, "회차 없음")
    b = dict(batch)

    # 출하 합계
    totals = conn.execute("""
        SELECT COALESCE(SUM(l.net_weight),0) as total_weight,
               COALESCE(SUM(l.head_count),0) as total_heads,
               COUNT(l.id) as total_trucks
        FROM load l JOIN shipment_day sd ON sd.id=l.shipment_day_id
        WHERE sd.batch_id=? AND l.status='done'
    """, (batch_id,)).fetchone()

    total_weight = totals["total_weight"]
    total_heads = totals["total_heads"]
    total_count = b["total_count"] or 0
    feed_amount = b["feed_amount"] or 0

    # 가중평균 사육일수: Σ(일령 × 수수) / Σ(수수)
    age_data = conn.execute("""
        SELECT sd.age_days, COALESCE(SUM(l.head_count),0) as heads
        FROM shipment_day sd LEFT JOIN load l ON l.shipment_day_id=sd.id AND l.status='done'
        WHERE sd.batch_id=? GROUP BY sd.id
    """, (batch_id,)).fetchall()

    # 마지막 출하일
    last_ship = conn.execute("""
        SELECT MAX(sd.ship_date) as last_date FROM shipment_day sd WHERE sd.batch_id=?
    """, (batch_id,)).fetchone()
    conn.close()

    weighted_sum = sum((r["age_days"] or 0) * r["heads"] for r in age_data)
    head_sum = sum(r["heads"] for r in age_data)
    avg_age = round(weighted_sum / head_sum, 2) if head_sum > 0 else 0

    avg_weight = round(total_weight / total_heads, 4) if total_heads > 0 else 0
    livability = round(total_heads / total_count * 100, 2) if total_count > 0 else 0
    fcr = round(feed_amount / total_weight, 4) if total_weight > 0 else 0

    # 생산지수 = (육성율% × 평균체중kg) / (사육일수 × FCR) × 100
    if avg_age > 0 and fcr > 0:
        pi = round((livability * avg_weight) / (avg_age * fcr) * 100, 2)
    else:
        pi = 0

    return {
        "batch_name": b["name"],
        "start_date": b["start_date"] or "",
        "end_date": last_ship["last_date"] or b["end_date"] or "",
        "house_counts": b["house_counts"] or "",
        "total_count": total_count,
        "total_heads": total_heads,
        "livability": livability,
        "total_weight": total_weight,
        "feed_amount": feed_amount,
        "fcr": fcr,
        "avg_weight": avg_weight,
        "avg_age_days": avg_age,
        "production_index": pi,
        "total_trucks": totals["total_trucks"],
        "farm_name": b["farm_name"] or "공암산성",
        "farm_owner": b["farm_owner"] or "윤은희",
        "farm_id": b.get("farm_id", "802615") or "802615",
        "farm_code": b.get("farm_code", "MMLQL") or "MMLQL",
        "shipment_closed": bool(b["shipment_closed"]),
    }

@app.get("/api/batches/{batch_id}/export")
def export_batch_csv(batch_id: int):
    conn = get_db()
    batch = conn.execute("SELECT name FROM batch WHERE id=?", (batch_id,)).fetchone()
    if not batch: conn.close(); raise HTTPException(404, "회차 없음")
    
    loads = conn.execute("""
        SELECT sd.day_number, sd.age_days, sd.ship_date,
               l.sequence, l.vehicle_no, l.driver_name,
               l.empty_weight, l.gross_weight, l.net_weight,
               l.head_count, l.avg_weight, l.gross_at
        FROM load l
        JOIN shipment_day sd ON sd.id=l.shipment_day_id
        WHERE sd.batch_id=? AND l.status='done'
        ORDER BY sd.day_number, CAST(l.sequence AS INTEGER)
    """, (batch_id,)).fetchall()
    conn.close()
    
    import csv, io, urllib.parse
    from fastapi.responses import StreamingResponse
    
    output = io.StringIO()
    output.write('\\ufeff') # UTF-8 BOM for Excel
    writer = csv.writer(output)
    writer.writerow(["일차", "일령", "출하일", "순번", "차량번호", "기사명", "공차(kg)", "총중량(kg)", "실중량(kg)", "수수", "평체(kg)", "출하(완료)시간"])
    
    for row in loads:
        gt = row["gross_at"]
        time_str = gt[:16].replace("T", " ") if gt else ""
        writer.writerow([
            row["day_number"], row["age_days"], row["ship_date"] or "",
            row["sequence"], row["vehicle_no"], row["driver_name"] or "",
            row["empty_weight"], row["gross_weight"], row["net_weight"],
            row["head_count"], row["avg_weight"], time_str
        ])
        
    filename = f"{batch['name']}_출하집계.csv"
    encoded_filename = urllib.parse.quote(filename)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename*=utf-8''{encoded_filename}"}
    )

# Removed duplicate api/loads/{load_id} route as it overrides the admin delete behavior


# ══════════════════════════════════════════════════════════════
#  ADMIN (TABULAR EDITOR) API
# ══════════════════════════════════════════════════════════════
@app.get("/api/admin/loads")
def admin_get_loads(batch_id: int):
    conn = get_db()
    # Get all loads for all shipment days in the batch
    loads = conn.execute("""
        SELECT l.*, sd.day_number, sd.age_days, sd.ship_date 
        FROM load l
        JOIN shipment_day sd ON sd.id=l.shipment_day_id
        WHERE sd.batch_id=?
        ORDER BY sd.day_number, CAST(l.sequence AS INTEGER)
    """, (batch_id,)).fetchall()
    conn.close()
    return [dict(l) for l in loads]

@app.put("/api/admin/loads/{load_id}")
def admin_update_load(load_id: int, u: AdminLoadUpdate):
    conn = get_db()
    conn.execute("""
        UPDATE load 
        SET vehicle_no=?, driver_name=?, empty_weight=?, gross_weight=?, 
            net_weight=?, head_count=?, avg_weight=?
        WHERE id=?
    """, (u.vehicle_no, u.driver_name, u.empty_weight, u.gross_weight, 
          u.net_weight, u.head_count, u.avg_weight, load_id))
    conn.commit()
    conn.close()
    return {"message": "저장되었습니다."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8080, reload=True)

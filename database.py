# -*- coding: utf-8 -*-
"""Database models and initialization for the shipment system."""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "shipment.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_db()
    cur = conn.cursor()

    cur.executescript("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    );

    CREATE TABLE IF NOT EXISTS driver (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        vehicle_no INTEGER NOT NULL UNIQUE,
        phone TEXT,
        last_empty_weight INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS batch (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        start_date TEXT,
        end_date TEXT,
        farm_name TEXT DEFAULT '공암산성',
        farm_owner TEXT DEFAULT '윤은희',
        farm_address TEXT DEFAULT '경남 합천군 용주면 공암길 245-260',
        farm_phone TEXT DEFAULT '010-8643-8959',
        farm_id TEXT DEFAULT '802615',
        farm_code TEXT DEFAULT 'MMLQL',
        destination TEXT DEFAULT '체리부로',
        house_counts TEXT,
        total_count INTEGER DEFAULT 0,
        feed_amount INTEGER DEFAULT 0,
        shipment_closed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shipment_day (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id INTEGER NOT NULL,
        day_number INTEGER NOT NULL,
        age_days INTEGER,
        target_weight REAL,
        ship_date TEXT,
        default_head_count INTEGER DEFAULT 2480,
        truck_count INTEGER DEFAULT 0,
        shipment_type TEXT DEFAULT '솎기',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES batch(id)
    );

    CREATE TABLE IF NOT EXISTS load (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shipment_day_id INTEGER NOT NULL,
        driver_id INTEGER,
        sequence INTEGER NOT NULL,
        trip_number INTEGER DEFAULT 1,
        vehicle_no INTEGER,
        driver_name TEXT,
        status TEXT DEFAULT 'pending',
        empty_weight INTEGER DEFAULT 0,
        gross_weight INTEGER DEFAULT 0,
        net_weight INTEGER DEFAULT 0,
        head_count INTEGER DEFAULT 0,
        avg_weight REAL DEFAULT 0,
        house_no TEXT,
        disinfection TEXT DEFAULT '완료',
        note TEXT,
        empty_at TIMESTAMP,
        gross_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shipment_day_id) REFERENCES shipment_day(id),
        FOREIGN KEY (driver_id) REFERENCES driver(id)
    );

    -- Default settings for empty weight range
    INSERT OR IGNORE INTO settings (key, value) VALUES ('min_empty_weight', '7000');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('max_empty_weight', '9000');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('default_head_count', '2480');
    """)

    # Try migrating existing DB if necessary
    for col_sql in [
        "ALTER TABLE load ADD COLUMN trip_number INTEGER DEFAULT 1;",
        "ALTER TABLE batch ADD COLUMN feed_amount INTEGER DEFAULT 0;",
        "ALTER TABLE batch ADD COLUMN shipment_closed INTEGER DEFAULT 0;",
        "ALTER TABLE shipment_day ADD COLUMN truck_count INTEGER DEFAULT 0;",
        "ALTER TABLE shipment_day ADD COLUMN default_head_count INTEGER DEFAULT 2480;",
        "ALTER TABLE shipment_day ADD COLUMN shipment_type TEXT DEFAULT '솎기';",
    ]:
        try:
            cur.execute(col_sql)
        except sqlite3.OperationalError:
            pass  # Column likely already exists

    conn.commit()
    conn.close()


def seed_drivers():
    """Seed driver data from the Excel analysis."""
    conn = get_db()
    cur = conn.cursor()
    
    count = cur.execute("SELECT COUNT(*) FROM driver").fetchone()[0]
    if count > 0:
        conn.close()
        return
    
    drivers = [
        ("안자현", 1027, "010-8402-4426"),
        ("이승준", 1041, "1054919895"),
        ("남성현", 1071, "1054055070"),
        ("김용규", 1267, "1088227706"),
        ("이병옥", 1294, "1044761566"),
        ("박근우", 1340, "1035826059"),
        ("김용태", 1509, "1054615865"),
        ("김상덕", 1523, "1054614075"),
        ("왕상만", 1992, "1091786857"),
        ("김법규", 2504, "1054025717"),
        ("심재응", 2565, "1054916075"),
        ("홍월식", 2914, "1089537556"),
        ("이종래", 3385, "1037476238"),
        ("신공식", 3403, "1074346000"),
        ("전봉근", 3447, "1063604515"),
        ("강대영", 3758, "1088600519"),
        ("장성조", 4109, "1052468727"),
        ("배승순", 4156, "1054925181"),
        ("김은석", 4230, "1033256671"),
        ("박영길", 4271, "1088426830"),
        ("김성용", 4440, "1037593836"),
        ("차동준", 4451, "1095022889"),
        ("심우철", 4510, "1066246255"),
        ("윤장열", 4550, "1034090619"),
        ("김영길", 5021, "1054692173"),
        ("채문병", 5503, "1046407114"),
        ("오완수", 5562, "1090076911"),
        ("박승렬", 5579, "1054857816"),
        ("소기복", 5615, "1071651178"),
        ("송승원", 5619, "1092273844"),
        ("김낙영", 5658, "1090084045"),
        ("주성돈", 5673, "1031768388"),
        ("정윤영", 5704, "1031779151"),
        ("양충환", 5749, "1054628306"),
        ("남세윤", 5755, "1074149987"),
        ("정영천", 5784, "1033640343"),
        ("김창수", 5815, "1023251760"),
        ("김주철", 5831, "1054683485"),
        ("홍석희", 5870, "1092464411"),
        ("김기욱", 5879, "1054659834"),
        ("최장열", 5880, "1054653695"),
        ("손길수", 5911, "1054626406"),
        ("유후근", 5920, "1054650265"),
        ("박현수", 5957, "1043557673"),
        ("유성희", 5970, "1026675322"),
        ("김성수", 6051, "1096747009"),
        ("김흥수", 6219, "1054537608"),
        ("이성재", 6282, "010-5468-9331"),
        ("임재경", 6456, "1044016500"),
        ("김호찬", 6524, "1054593824"),
        ("신동수", 6680, "1054493698"),
        ("김성훈", 6708, "1054879241"),
        ("안준모", 6762, "1033698759"),
        ("엄익수", 6797, "1067046797"),
        ("허창영", 7000, "1054869541"),
        ("이재철", 7030, "010-4230-0338"),
        ("강석호", 7071, "1090111820"),
        ("전대권", 7126, "1088833797"),
        ("정근하", 7160, "1037441678"),
        ("김길식", 7202, "1087371521"),
        ("김종구", 7605, "1054613878"),
        ("홍은택", 7609, "1037547094"),
        ("엄정섭", 8383, "010-4517-5285"),
        ("임종웅", 8712, "1054980781"),
        ("양승달", 8809, "1052031687"),
        ("원해종", 9427, "1093614218"),
        ("염상혁", 2419, ""),
        ("노종석", 5343, ""),
        ("송은욱", 8495, ""),
        ("김순천", 7197, ""),
        ("이종봉", 6790, ""),
        ("장진국", 5007, ""),
    ]

    for name, vehicle_no, phone in drivers:
        cur.execute(
            "INSERT OR IGNORE INTO driver (name, vehicle_no, phone) VALUES (?, ?, ?)",
            (name, vehicle_no, phone),
        )

    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    seed_drivers()
    print("DB initialized and seeded.")

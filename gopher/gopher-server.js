const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3700;

// --- 설정 ---
const DROPS_DIR = path.join(__dirname, 'drops');
const MANIFEST_FILE = path.join(DROPS_DIR, 'manifest.json');
const EXPIRY_HOURS = 24;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const GHOSTNET_DIR = path.join(__dirname, '../ghostnet/whisper/gabia-vps'); // Ghostnet Bridge 대상 폴더

// Tailscale 기기 목록
const DEVICES = [
  { id: 'chongsong-imac-macos', name: 'iMac (청송 사령부)', location: '청송', os: 'macOS' },
  { id: 'chongsong-comm-win', name: '커뮤니케이션 PC', location: '청송', os: 'Windows' },
  { id: 'chongsong-verb-linux', name: 'Verb Linux', location: '청송', os: 'Linux' },
  { id: 'gabia-bigmap-linux', name: 'Gabia VPS', location: 'Cloud', os: 'Linux' },
  { id: 'gongam-comm-win', name: '커뮤니케이션 PC', location: '공암산성', os: 'Windows' },
  { id: 'gongam-jinju-win', name: '진주 PC', location: '공암산성 (진주)', os: 'Windows' },
  { id: 'gongam-ship-win', name: '선적 PC', location: '공암산성 (선적)', os: 'Windows' },
  { id: 'yoosung-comm-win', name: '커뮤니케이션 PC', location: '유성농장', os: 'Windows' },
  { id: 'yoosung-pi-linux', name: 'Raspberry Pi', location: '유성농장', os: 'Linux' },
  { id: 'yoosung-ship-win', name: '선적 PC', location: '유성농장', os: 'Windows' },
];

// --- 초기화 ---
if (!fs.existsSync(DROPS_DIR)) {
  fs.mkdirSync(DROPS_DIR, { recursive: true });
}

function loadManifest() {
  if (!fs.existsSync(MANIFEST_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveManifest(manifest) {
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
}

// --- 미들웨어 ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));

// 파일 업로드 설정
const storage = multer.diskStorage({
  destination: DROPS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE } });

// --- API 라우트 ---

// 기기 목록 조회
app.get('/api/devices', (req, res) => {
  res.json({ devices: DEVICES });
});

// 메시지 드롭
app.post('/api/drop/message', (req, res) => {
  const { to, from, subject, content } = req.body;
  if (!to || !content) {
    return res.status(400).json({ error: '수신 기기(to)와 내용(content)은 필수입니다.' });
  }

  // --- Ghostnet Bridge ---
  if (to === 'gabia-bigmap-linux') {
    if (!fs.existsSync(GHOSTNET_DIR)) fs.mkdirSync(GHOSTNET_DIR, { recursive: true });
    
    // 워처가 감지할 task_ 파일 생성
    const taskFilename = `task_${Date.now()}.txt`;
    fs.writeFileSync(path.join(GHOSTNET_DIR, taskFilename), content, 'utf-8');
    
    return res.json({ ok: true, id: taskFilename, message: `👻 가비아 워처(Watcher)에게 실시간 명령이 하달되었습니다!` });
  }

  const drop = {
    id: uuidv4(),
    type: 'message',
    to,
    from: from || 'anonymous',
    subject: subject || '(제목 없음)',
    content,
    timestamp: new Date().toISOString(),
    claimed: false
  };

  const manifest = loadManifest();
  manifest.push(drop);
  saveManifest(manifest);

  res.json({ ok: true, id: drop.id, message: `📨 메시지가 ${to}에게 전달 대기 중입니다.` });
});

// 파일 드롭
app.post('/api/drop/file', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '파일이 없습니다.' });
  }

  const { to, from, subject } = req.body;
  if (!to) {
    // 파일 삭제
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: '수신 기기(to)는 필수입니다.' });
  }

  const drop = {
    id: uuidv4(),
    type: 'file',
    to,
    from: from || 'anonymous',
    subject: subject || req.file.originalname,
    filename: req.file.filename,
    originalname: req.file.originalname,
    size: req.file.size,
    timestamp: new Date().toISOString(),
    claimed: false
  };

  const manifest = loadManifest();
  manifest.push(drop);
  saveManifest(manifest);

  res.json({ ok: true, id: drop.id, message: `📦 파일(${req.file.originalname})이 ${to}에게 전달 대기 중입니다.` });
});

// 기기별 대기 중인 항목 목록
app.get('/api/pickup/:device', (req, res) => {
  const { device } = req.params;
  const manifest = loadManifest();
  const drops = manifest.filter(d => d.to === device && !d.claimed);

  const mappedDrops = drops.map(d => ({
    id: d.id,
    type: d.type,
    from: d.from,
    subject: d.subject,
    timestamp: d.timestamp,
    ...(d.type === 'message' ? { content: d.content } : {}),
    ...(d.type === 'file' ? { originalname: d.originalname, size: d.size } : {})
  }));

  // --- Ghostnet Bridge ---
  if (device === 'gabia-bigmap-linux' && fs.existsSync(GHOSTNET_DIR)) {
    const files = fs.readdirSync(GHOSTNET_DIR);
    files.forEach(f => {
      // result_ 결과물 또는 진행 중인 processing_ 파일 읽어오기
      if (f.startsWith('result_') && f.endsWith('.txt')) {
        const content = fs.readFileSync(path.join(GHOSTNET_DIR, f), 'utf-8');
        const stat = fs.statSync(path.join(GHOSTNET_DIR, f));
        mappedDrops.unshift({
          id: f,
          type: 'message',
          from: 'Ghostnet Watcher',
          subject: `[AI 워처 보고서] ${f}`,
          content: content,
          timestamp: stat.mtime.toISOString(),
        });
      }
    });
  }

  res.json({
    device,
    count: mappedDrops.length,
    drops: mappedDrops
  });
});

// 파일 다운로드
app.get('/api/download/:id', (req, res) => {
  const manifest = loadManifest();
  const drop = manifest.find(d => d.id === req.params.id && d.type === 'file');
  if (!drop) {
    return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
  }

  const filepath = path.join(DROPS_DIR, drop.filename);
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: '파일이 서버에서 삭제되었습니다.' });
  }

  res.download(filepath, drop.originalname);
});

// 수신 확인 (삭제)
app.delete('/api/claim/:id', (req, res) => {
  const id = req.params.id;

  // --- Ghostnet Bridge ---
  if (id.startsWith('result_') && id.endsWith('.txt')) {
    const filePath = path.join(GHOSTNET_DIR, id);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.json({ ok: true, message: '✅ Ghostnet 워처 보고서를 폐기했습니다.' });
    }
  }

  const manifest = loadManifest();
  const idx = manifest.findIndex(d => d.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: '항목을 찾을 수 없습니다.' });
  }

  const drop = manifest[idx];

  // 파일이면 디스크에서도 삭제
  if (drop.type === 'file' && drop.filename) {
    const filepath = path.join(DROPS_DIR, drop.filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }

  manifest.splice(idx, 1);
  saveManifest(manifest);

  res.json({ ok: true, message: '✅ 수신 확인 완료. 항목이 삭제되었습니다.' });
});

// 전체 상태 (관리용)
app.get('/api/status', (req, res) => {
  const manifest = loadManifest();
  const pending = manifest.filter(d => !d.claimed);

  const byDevice = {};
  pending.forEach(d => {
    if (!byDevice[d.to]) byDevice[d.to] = 0;
    byDevice[d.to]++;
  });

  res.json({
    total_pending: pending.length,
    by_device: byDevice,
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// --- 만료 정리 (1시간 간격) ---
function cleanExpired() {
  const manifest = loadManifest();
  const now = Date.now();
  const expiryMs = EXPIRY_HOURS * 60 * 60 * 1000;
  let cleaned = 0;

  const active = manifest.filter(d => {
    const age = now - new Date(d.timestamp).getTime();
    if (age > expiryMs) {
      // 파일 삭제
      if (d.type === 'file' && d.filename) {
        const filepath = path.join(DROPS_DIR, d.filename);
        if (fs.existsSync(filepath)) {
          try { fs.unlinkSync(filepath); } catch {}
        }
      }
      cleaned++;
      return false;
    }
    return true;
  });

  if (cleaned > 0) {
    saveManifest(active);
    console.log(`🧹 만료 정리: ${cleaned}건 삭제됨`);
  }
}

setInterval(cleanExpired, 60 * 60 * 1000); // 1시간 간격

// --- 서버 시작 ---
app.listen(PORT, () => {
  console.log(`
  ┌─────────────────────────────────────────┐
  │                                         │
  │   🐿️  GOPHER SERVICE v1.0.0             │
  │   Port: ${PORT}                           │
  │   Drops: ${DROPS_DIR}  │
  │   Expiry: ${EXPIRY_HOURS}h                            │
  │                                         │
  │   "Go fetch."                           │
  │                                         │
  └─────────────────────────────────────────┘
  `);
});

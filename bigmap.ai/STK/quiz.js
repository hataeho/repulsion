// ========= STK QUIZ SYSTEM — Server-Managed =========
const API_BASE = '/api/stk';
const DAILY_Q_COUNT = 10;
const USER_ID = 'stk'; // matches login ID

// ========= DIFFICULTY LEVELS =========
const LEVELS = [
  { id: 'mid', name: '중학교', emoji: '🌱', color: '#22c55e', desc: '기초 개념 이해' },
  { id: 'high', name: '고등학교', emoji: '🌿', color: '#60a5fa', desc: '심화 개념 학습' },
  { id: 'univ', name: '대학교', emoji: '🌳', color: '#a78bfa', desc: '전공 수준 학습' },
  { id: 'exam', name: '편입시험', emoji: '🔥', color: '#f59e0b', desc: '시험 대비 실전' },
  { id: 'master', name: '심화', emoji: '💎', color: '#ef4444', desc: '고난도 응용' }
];

const QUIZ_SUBJECTS = {
  eng: { name: '편입 영어', icon: '🇬🇧', color: 'var(--accent)' },
  bio: { name: '일반생물학', icon: '🧬', color: 'var(--green)' },
  chem: { name: '일반화학·유기화학', icon: '⚗️', color: 'var(--purple)' },
  vet: { name: '수의학·가금질병', icon: '🩺', color: 'var(--pink)' }
};

// ========= SERVER DATA (synced) =========
let userData = { scores: {}, levels: {}, history: [] };

async function loadUserData() {
  try {
    const res = await fetch(`${API_BASE}/data/${USER_ID}`);
    if (res.ok) userData = await res.json();
  } catch (e) { console.warn('Server data load failed, using local:', e); }
}

async function saveToServer(scores, levels, historyEntry) {
  try {
    await fetch(`${API_BASE}/save`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: USER_ID,
        scores: scores || undefined,
        levels: levels || undefined,
        history: historyEntry ? [historyEntry] : undefined
      })
    });
  } catch (e) { console.warn('Server save failed:', e); }
}

// ========= UTILITY =========
function dateSeed() { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }

// ========= LEVEL MANAGEMENT =========
function getSubjectLevel(subjId) { return userData.levels[subjId] || 0; }
function getQuizScores() { return userData.scores || {}; }

function adjustLevel(subjId, pct) {
  let current = userData.levels[subjId] || 0;
  if (pct >= 80 && current < LEVELS.length - 1) {
    current++;
    userData.levels[subjId] = current;
    return { changed: true, direction: 'up', newLevel: current };
  } else if (pct < 40 && current > 0) {
    current--;
    userData.levels[subjId] = current;
    return { changed: true, direction: 'down', newLevel: current };
  }
  return { changed: false, newLevel: current };
}

function getLevelBar(subjId) {
  const lvl = getSubjectLevel(subjId);
  const info = LEVELS[lvl];
  const pct = (lvl / (LEVELS.length - 1)) * 100;
  let dots = '';
  for (let i = 0; i < LEVELS.length; i++) {
    const l = LEVELS[i]; const active = i <= lvl; const isCurrent = i === lvl;
    dots += `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1;${isCurrent ? 'transform:scale(1.1);' : ''}">
      <div style="width:${isCurrent ? 20 : 14}px;height:${isCurrent ? 20 : 14}px;border-radius:50%;background:${active ? l.color : 'var(--bg3)'};
        ${isCurrent ? 'box-shadow:0 0 8px ' + l.color + ';border:2px solid #fff;' : 'border:1px solid var(--border);'}
        display:flex;align-items:center;justify-content:center;font-size:${isCurrent ? 10 : 8}px;">${isCurrent ? l.emoji : ''}</div>
      <div style="font-size:8px;color:${isCurrent ? l.color : 'var(--text3)'};font-weight:${isCurrent ? 700 : 400};white-space:nowrap;">${l.name}</div>
    </div>`;
  }
  return `<div style="display:flex;align-items:flex-start;gap:0;margin-top:4px;position:relative;">
    <div style="position:absolute;top:6px;left:10%;right:10%;height:2px;background:var(--bg3);z-index:0;"></div>
    <div style="position:absolute;top:6px;left:10%;width:${pct * 0.8}%;height:2px;background:linear-gradient(90deg,${LEVELS[0].color},${info.color});z-index:1;"></div>
    ${dots}</div>`;
}

// ========= QUIZ STATE =========
let quizState = { subj: null, idx: 0, answers: [], locked: false, questions: [], level: 0 };

// ========= RENDER SUBJECTS =========
function renderQuizSubjects() {
  const scores = getQuizScores(); const today = dateSeed();
  document.getElementById('quizSubjGrid').innerHTML = Object.entries(QUIZ_SUBJECTS).map(([id, s]) => {
    const sc = scores[id]; const sel = quizState.subj === id ? 'sel' : '';
    const lvl = getSubjectLevel(id); const levelInfo = LEVELS[lvl];
    const todayDone = sc && sc.date === today;
    const scoreText = todayDone ? `오늘: ${sc.correct}/${sc.total} (${sc.pct}점)` : sc ? `최근: ${sc.pct}점` : '미진단';
    return `<div class="quiz-subj-card ${sel}" onclick="startQuiz('${id}')">
      <div class="qs-ico">${s.icon}</div><div class="qs-name">${s.name}</div>
      <div class="qs-score">${scoreText}</div>
      <div style="display:flex;align-items:center;gap:4px;justify-content:center;margin-top:4px;">
        <span style="font-size:12px;">${levelInfo.emoji}</span>
        <span style="font-size:9px;color:${levelInfo.color};font-weight:700;">${levelInfo.name}</span>
      </div></div>`;
  }).join('');
}

// ========= START QUIZ =========
async function startQuiz(subjId) {
  const s = QUIZ_SUBJECTS[subjId];
  const lvl = getSubjectLevel(subjId);
  const levelInfo = LEVELS[lvl];
  const sc = userData.scores[subjId];
  const recentPct = sc ? sc.pct : 50;

  quizState = { subj: subjId, idx: 0, answers: [], locked: false, questions: [], level: lvl };
  renderQuizSubjects();

  // Compute weights for display
  let weights;
  if (recentPct >= 80) weights = { easy: 2, medium: 3, hard: 5, label: '도전 집중형' };
  else if (recentPct >= 60) weights = { easy: 3, medium: 4, hard: 3, label: '균형 성장형' };
  else if (recentPct >= 40) weights = { easy: 4, medium: 4, hard: 2, label: '기초 강화형' };
  else weights = { easy: 6, medium: 3, hard: 1, label: '자신감 회복형' };

  document.getElementById('quizAreaTitle').innerHTML = `${s.icon} ${s.name} — ${levelInfo.emoji} ${levelInfo.name} 문제 생성 중...`;
  document.getElementById('quizArea').innerHTML = `<div style="text-align:center;padding:40px">
    <div style="font-size:32px;margin-bottom:8px;animation:spin 1.5s linear infinite">🤖</div>
    <div style="font-size:14px;font-weight:600;color:var(--accent2)">서버에서 ${levelInfo.name} 수준의 문제를 생성합니다</div>
    <div style="font-size:11px;color:var(--text3);margin-top:6px">${levelInfo.emoji} ${levelInfo.desc} · ${weights.label}</div>
    <div style="display:flex;gap:8px;justify-content:center;margin-top:10px;font-size:10px;">
      <span style="padding:3px 8px;border-radius:6px;background:rgba(34,197,94,.1);color:#22c55e;">📗 워밍업 ${weights.easy}</span>
      <span style="padding:3px 8px;border-radius:6px;background:rgba(245,158,11,.1);color:#f59e0b;">📙 도전 ${weights.medium}</span>
      <span style="padding:3px 8px;border-radius:6px;background:rgba(239,68,68,.1);color:#ef4444;">📕 심화 ${weights.hard}</span>
    </div>
    <div style="margin:16px auto;max-width:280px">${getLevelBar(subjId)}</div>
    <div style="margin-top:12px;height:4px;background:var(--bg3);border-radius:2px;overflow:hidden;width:200px;margin-left:auto;margin-right:auto">
      <div style="height:100%;background:linear-gradient(90deg,var(--accent),${levelInfo.color});border-radius:2px;animation:loading 1.5s ease-in-out infinite;width:40%"></div>
    </div>
    <div style="margin-top:8px;font-size:9px;color:var(--text3)">🔒 서버 경유 · API 키 보호</div>
  </div>
  <style>
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes loading{0%{margin-left:0;width:40%}50%{margin-left:30%;width:50%}100%{margin-left:60%;width:40%}}
  </style>`;

  try {
    const res = await fetch(`${API_BASE}/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjId, levelIdx: lvl, recentPct })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Server error');
    quizState.questions = data.questions;
    document.getElementById('quizAreaTitle').innerHTML = `${s.icon} ${s.name} — ${levelInfo.emoji} ${levelInfo.name}`;
    renderQuestion();
    showToast(`${levelInfo.emoji} ${s.name} ${levelInfo.name} ${data.questions.length}문제 준비!`);
  } catch (e) {
    console.error('Quiz Error:', e);
    document.getElementById('quizAreaTitle').innerHTML = `${s.icon} ${s.name} — 오류`;
    document.getElementById('quizArea').innerHTML = `<div style="text-align:center;padding:40px">
      <div style="font-size:24px;margin-bottom:10px">⚠️</div>
      <div style="font-size:13px;color:var(--red)">문제 생성에 실패했습니다</div>
      <div style="font-size:11px;color:var(--text3);margin-top:6px">${e.message}</div>
      <button class="btn btn-a" style="margin-top:16px" onclick="startQuiz('${subjId}')">↻ 다시 시도</button>
    </div>`;
  }
}

// ========= RENDER QUESTION =========
function renderQuestion() {
  const { subj, idx, questions, level } = quizState; const q = questions[idx]; const total = questions.length;
  const levelInfo = LEVELS[level];
  const diffBadge = { easy: { emoji: '📗', label: '워밍업', color: '#22c55e' }, medium: { emoji: '📙', label: '도전', color: '#f59e0b' }, hard: { emoji: '📕', label: '심화', color: '#ef4444' } };
  const db = diffBadge[q.difficulty] || diffBadge.medium;
  let pips = ''; for (let i = 0; i < total; i++) { let c = 'pending'; if (i < quizState.answers.length) c = quizState.answers[i].correct ? 'correct' : 'wrong'; else if (i === idx) c = 'current'; pips += `<div class="q-pip ${c}"></div>`; }
  const mk = ['A', 'B', 'C', 'D'];
  const opts = q.opts.map((o, i) => `<div class="q-opt" id="qopt${i}" onclick="selectAnswer(${i})"><div class="q-marker">${mk[i]}</div><div>${o}</div></div>`).join('');
  document.getElementById('quizArea').innerHTML = `<div class="q-area">
    <div class="q-progress"><span>문제 ${idx + 1}/${total}</span><div style="display:flex;align-items:center;gap:6px;">
      <span style="font-size:9px;padding:2px 6px;border-radius:6px;background:${db.color}20;color:${db.color};font-weight:600;">${db.emoji} ${db.label}</span>
      <span style="font-size:9px;padding:2px 6px;border-radius:6px;background:${levelInfo.color}20;color:${levelInfo.color};font-weight:600;">${levelInfo.emoji} ${levelInfo.name}</span>
      <div class="q-pips">${pips}</div></div></div>
    <div class="q-num">Q${idx + 1}.</div><div class="q-text">${q.q}</div>
    <div class="q-opts">${opts}</div>
    <div class="q-explain" id="qExplain">💡 <strong>해설:</strong> ${q.exp}</div>
    <div class="q-btns" id="qBtns"></div></div>`;
}

// ========= SELECT ANSWER =========
function selectAnswer(optIdx) {
  if (quizState.locked) return; quizState.locked = true;
  const { subj, idx, questions } = quizState; const q = questions[idx]; const correct = optIdx === q.ans;
  quizState.answers.push({ selected: optIdx, correct, qIdx: idx });
  document.getElementById('qopt' + optIdx).classList.add(correct ? 'q-correct' : 'q-wrong', 'q-selected');
  if (!correct) document.getElementById('qopt' + q.ans).classList.add('q-correct');
  document.querySelectorAll('.q-opt').forEach(e => e.classList.add('q-locked'));
  document.getElementById('qExplain').classList.add('show');
  showToast(correct ? '✅ 정답!' : '❌ 오답.');
  const isLast = idx >= questions.length - 1;
  document.getElementById('qBtns').innerHTML = `<button class="btn btn-a" onclick="${isLast ? 'finishQuiz()' : 'nextQuestion()'}">${isLast ? '📊 결과' : '다음 →'}</button>`;
  document.querySelectorAll('.q-pip').forEach((p, i) => { p.className = 'q-pip ' + (i < quizState.answers.length ? (quizState.answers[i].correct ? 'correct' : 'wrong') : (i === idx ? 'current' : 'pending')); });
}
function nextQuestion() { quizState.idx++; quizState.locked = false; renderQuestion(); }

// ========= FINISH QUIZ =========
async function finishQuiz() {
  const { subj, answers, questions, level } = quizState; const s = QUIZ_SUBJECTS[subj];
  const correct = answers.filter(a => a.correct).length; const total = answers.length; const pct = Math.round(correct / total * 100);

  // Update local data
  userData.scores[subj] = { correct, total, pct, date: dateSeed(), level };
  const adjustment = adjustLevel(subj, pct);
  const newLevelInfo = LEVELS[adjustment.newLevel];
  const oldLevelInfo = LEVELS[level];
  const historyEntry = { subj, pct, correct, total, level, date: new Date().toISOString() };

  // Save to server (async, non-blocking)
  saveToServer(
    { [subj]: userData.scores[subj] },
    { [subj]: adjustment.newLevel },
    historyEntry
  );

  renderQuizSubjects(); renderQuizResults();

  let grade = '', gc = '';
  if (pct >= 80) { grade = '🟢 우수'; gc = 'var(--green)'; }
  else if (pct >= 60) { grade = '🟡 보통'; gc = 'var(--orange)'; }
  else if (pct >= 40) { grade = '🟠 미흡'; gc = 'var(--orange)'; }
  else { grade = '🔴 기초부족'; gc = 'var(--red)'; }

  let wh = ''; const wrongs = answers.filter(a => !a.correct);
  if (wrongs.length > 0) wh = `<div class="q-weak"><h4>⚠️ 틀린 문제 복습</h4><ul>${wrongs.map(w => { const q = questions[w.qIdx]; return `<li><b>Q${w.qIdx + 1}:</b> ${q.exp}</li>`; }).join('')}</ul></div>`;

  let levelMsg = '';
  if (adjustment.changed && adjustment.direction === 'up') {
    levelMsg = `<div style="margin-top:14px;padding:14px;background:linear-gradient(135deg,rgba(34,197,94,.1),rgba(59,130,246,.1));border:1px solid rgba(34,197,94,.3);border-radius:12px;text-align:center;">
      <div style="font-size:24px;margin-bottom:4px;">🎉</div>
      <div style="font-size:14px;font-weight:700;color:var(--green);">레벨 업!</div>
      <div style="font-size:12px;color:var(--text2);margin-top:4px;">${oldLevelInfo.emoji} ${oldLevelInfo.name} → ${newLevelInfo.emoji} ${newLevelInfo.name}</div>
      <div style="font-size:11px;color:var(--text3);margin-top:2px;">다음 단계로 도전합니다! 💪</div></div>`;
  } else if (adjustment.changed && adjustment.direction === 'down') {
    levelMsg = `<div style="margin-top:14px;padding:14px;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.2);border-radius:12px;text-align:center;">
      <div style="font-size:24px;margin-bottom:4px;">📚</div>
      <div style="font-size:14px;font-weight:700;color:var(--orange);">기초 다지기</div>
      <div style="font-size:12px;color:var(--text2);margin-top:4px;">${newLevelInfo.emoji} ${newLevelInfo.name} 수준으로 복습합니다</div>
      <div style="font-size:11px;color:var(--text3);margin-top:2px;">기본부터 탄탄히! 포기하지 마세요 🌱</div></div>`;
  } else {
    const enc = pct >= 60 ? '좋은 성적! 꾸준히 하면 레벨업!' : '조금만 더 힘내면 됩니다! 화이팅!';
    levelMsg = `<div style="margin-top:10px;font-size:11px;color:var(--text3);text-align:center">${newLevelInfo.emoji} 현재: ${newLevelInfo.name} · ${enc}</div>`;
  }

  document.getElementById('quizArea').innerHTML = `<div class="q-result">
    <div style="font-size:14px;color:var(--text2)">${s.icon} ${s.name}</div>
    <div class="q-score-big" style="color:${gc}">${pct}점</div>
    <div class="q-grade" style="color:${gc}">${grade}</div>
    <div style="font-size:13px;color:var(--text2)">정답 ${correct}/${total}</div>
    <div style="max-width:280px;margin:12px auto;">${getLevelBar(subj)}</div>
    ${levelMsg}${wh}
    <div class="q-btns" style="justify-content:center;margin-top:14px;flex-wrap:wrap;gap:6px;">
      <button class="btn btn-a" onclick="startQuiz('${subj}')">🤖 새 문제</button>
    </div>
    <div style="margin-top:8px;font-size:9px;color:var(--text3)">☁️ 서버에 자동 저장됨</div>
  </div>`;
}

// ========= RENDER RESULTS =========
function renderQuizResults() {
  const scores = getQuizScores(); const subjs = Object.entries(QUIZ_SUBJECTS);
  const taken = subjs.filter(([id]) => scores[id]);
  if (!taken.length) { document.getElementById('quizResults').innerHTML = '<p style="font-size:12px;color:var(--text3);text-align:center;padding:40px 0;">아직 진단 결과가 없습니다</p>'; return; }
  const tc = taken.reduce((a, [id]) => a + scores[id].correct, 0); const tq = taken.reduce((a, [id]) => a + scores[id].total, 0); const op = Math.round(tc / tq * 100);
  let h = `<div style="text-align:center;margin-bottom:14px"><div style="font-size:12px;color:var(--text2)">종합 점수</div>
    <div style="font-size:36px;font-weight:800;color:${op >= 60 ? 'var(--green)' : 'var(--orange)'}">${op}점</div>
    <div style="font-size:11px;color:var(--text2)">${taken.length}/${subjs.length} 과목 · ☁️ 서버 동기화</div></div>`;
  h += '<div class="q-detail-grid">';
  subjs.forEach(([id, s]) => {
    const sc = scores[id]; const lvl = getSubjectLevel(id); const li = LEVELS[lvl];
    if (!sc) { h += `<div class="q-detail" style="opacity:.5"><div class="q-detail-name">${s.icon} ${s.name}</div><div class="q-detail-info">미진단</div></div>`; return; }
    const p = sc.pct; const c = p >= 80 ? 'var(--green)' : p >= 60 ? 'var(--orange)' : 'var(--red)';
    h += `<div class="q-detail"><div class="q-detail-name">${s.icon} ${s.name} <span style="margin-left:auto;font-size:13px;font-weight:700;color:${c}">${p}점</span></div>
    <div class="q-detail-bar"><div class="q-detail-fill" style="width:${p}%;background:${c}"></div></div>
    <div class="q-detail-info">${sc.correct}/${sc.total} · ${li.emoji} ${li.name}</div></div>`;
  }); h += '</div>';
  const hist = userData.history || [];
  if (hist.length > 1) { h += `<div style="margin-top:12px;font-size:11px;color:var(--text2)">📈 최근 ${Math.min(hist.length, 5)}회: ${hist.slice(-5).map(e => `${QUIZ_SUBJECTS[e.subj]?.icon || ''} ${e.pct}점`).join(' → ')}</div>`; }
  const weakest = [...taken].sort((a, b) => scores[a[0]].pct - scores[b[0]].pct);
  if (weakest.length > 0 && scores[weakest[0][0]].pct < 80) { const wid = weakest[0][0], ws = QUIZ_SUBJECTS[wid]; h += `<div class="q-weak" style="margin-top:12px"><h4>🎯 우선 보강: ${ws.icon} ${ws.name} (${scores[wid].pct}점)</h4></div>`; }
  document.getElementById('quizResults').innerHTML = h;
}

// ========= INIT — Load server data on page load =========
async function initQuiz() {
  await loadUserData();
  renderQuizSubjects();
  renderQuizResults();
}

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3457;
const GEMINI_KEY = 'AIzaSyDdcdVSyetVKfmcpwLwbY_4t9wC-TWbhR0';
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

app.use(cors());
app.use(express.json());

// ========= DIFFICULTY LEVELS & SUBJECTS =========
const LEVELS = [
    { id: 'mid', name: '중학교', emoji: '🌱', desc: '기초 개념 이해' },
    { id: 'high', name: '고등학교', emoji: '🌿', desc: '심화 개념 학습' },
    { id: 'univ', name: '대학교', emoji: '🌳', desc: '전공 수준 학습' },
    { id: 'exam', name: '편입시험', emoji: '🔥', desc: '시험 대비 실전' },
    { id: 'master', name: '심화', emoji: '💎', desc: '고난도 응용' }
];

const SUBJECT_PROMPTS = {
    eng: {
        name: '편입 영어', icon: '🇬🇧',
        prompts: {
            mid: '중학교 영어 수준. 기초 어휘(일상생활, 동물, 자연), 간단한 시제·관사·전치사 문법, 3~4줄 짧은 독해. 자신감을 심어주는 쉽고 친근한 문제.',
            high: '고등학교 영어·수능 수준. 어휘: 수능 빈출 단어, 문법: 관계사·분사·가정법·비교급, 독해: 5~8줄 지문. 농업/동물 관련 지문 20% 포함.',
            univ: '대학교 교양영어 수준. 학술어휘, 복합문법(도치·가정법 과거완료·분사구문·혼합가정), 8~12줄 학술지문 독해. 가금/축산 관련 30% 포함.',
            exam: `편입시험 영어 수준 — 실제 수의대 편입시험 출제 패턴을 반영하세요.

[출제 유형 비율]
- 어휘(동의어/빈칸): 30% → TEPS·편입영어 빈출 고급어휘 (GRE 수준 포함)
- 문법(밑줄 고르기/어법): 30% → 도치, 가정법, 수일치, 분사, 관계사, 시제 혼합
- 독해(주제/내용일치/빈칸추론): 40% → 10~15줄 학술지문, 수의학·축산·생명과학 논문 스타일

[빈출 주제]
수의학 관련: 항생제 내성, 동물감염병, 축산업, 백신, 공중보건, 동물복지
기출 경향: 지문 속 전문용어 추론, 문맥상 빈칸 추론, NOT true/false 문제
어휘 수준: tenacious, exacerbate, proliferate, pathogenesis, epidemiology 등`,
            master: '편입시험 최상위. GRE/TEPS 수준 어휘·문법·독해. 수의학 학술논문·Review article 수준 영어지문. 매우 긴 지문(15줄+), 복합추론 문제.'
        }
    },
    bio: {
        name: '일반생물학', icon: '🧬',
        prompts: {
            mid: '중학교 과학(생물). 세포 기본구조, 광합성과 호흡 기초, 유전 기본원리(우열의 법칙), 생태계 기초, 소화·호흡·순환 기관. 그림 없이 이해 가능한 쉬운 문제.',
            high: '고등학교 생물I/II. 세포분열(체세포·감수분열), 멘델 유전·연관·반성유전, 호르몬 조절, 면역(선천/적응), 생태계 에너지흐름. 동물생리 관련 20% 포함.',
            univ: '대학교 일반생물학. 분자생물학(DNA복제·전사·번역), 세포신호전달(G-protein, RTK), 유전공학(PCR, 제한효소), 면역학(T세포·B세포·항체), 동물생리학. 가금/축산 관련 30%.',
            exam: `수의대 편입시험 일반생물학 — 실제 기출 패턴을 정확히 반영하세요.

[경상대 출제 패턴] (생물 20문항, MDP 문제 활용)
- 매년 비슷한 유형이 반복 출제됨
- MDP(의치학교육입문검사) 기출 문제와 매우 유사
- 실제 시험에서 문제·보기·답이 동일하게 재출제된 사례 있음 (2023)

[전북대 출제 패턴] (생물 20문항: 객관식15+주관식5, 50분)
- 추론형 문제가 주로 출제
- 시간이 부족할 수 있는 분량

[빈출 주제 — 반드시 이 주제들에서 출제]
1. 세포생물학: 세포막 수송, 세포소기관, 세포분열 조절, 세포주기
2. 분자생물학: DNA복제 메커니즘, 전사·번역 과정, 유전자 발현 조절, 오페론
3. 유전학: 멘델 유전, 연관·교차, 하디-바인베르크, 유전 질환, 가계도 분석
4. 면역학: 선천면역 vs 적응면역, T세포 분화, 항체 구조·기능, 사이토카인
5. 동물생리학: 신경전달, 근수축, 내분비, 심혈관계, 신장 기능
6. 가금 관련: 조류 해부학, 가금 생식생리, 달걀 형성과정

[문제 형식]
- 정의형: "다음 중 ○○에 대한 설명으로 옳은 것은?"
- 추론형: "실험 결과를 통해 추론할 수 있는 것은?"
- 비교형: "A와 B의 차이로 옳지 않은 것은?"`,
            master: '편입시험 최상위. 최신 분자생물학(CRISPR, 에피제네틱스), 유전체학, 단백질 폴딩, 세포사멸(apoptosis vs necrosis), 가금질병 병리기전(AI 바이러스 HA/NA 변이).'
        }
    },
    chem: {
        name: '일반화학·유기화학', icon: '⚗️',
        prompts: {
            mid: '중학교 과학(화학). 물질의 3상태, 원소기호·화학식, 산과 염기 기초(리트머스), 간단한 화학반응식 완성. 일상생활 속 화학 사례 포함.',
            high: '고등학교 화학I/II. 원자모형·전자배치, 이온결합·공유결합, 화학반응식 계수, 몰 계산, 산·염기·중화 반응, 산화환원. 농업화학 관련 20%.',
            univ: '대학교 일반화학/유기화학. 양자역학 기초(오비탈), 열역학 1·2법칙, 반응속도론(아레니우스), 유기반응 기초(SN1/SN2/E1/E2), 작용기 성질. 생화학/농화학 관련 30%.',
            exam: `수의대 편입시험 일반화학·유기화학 — 실제 기출 패턴을 반영하세요.

[전북대 출제 패턴] (화학 20문항: 객관식15+주관식5, 50분)
- 계산 문제가 많이 출제됨 (몰, 농도, 반응속도, 열량 등)
- 유기화학은 간단한 소재만 일부 출제
- 일부 지엽적인 화학 이론도 출제됨
- 시간이 매우 부족

[빈출 주제]
1. 일반화학: 원자구조, 전자배치, 주기적 성질, 화학결합(혼성), 분자구조(VSEPR)
2. 열화학: 헤스 법칙, 엔탈피·엔트로피·자유에너지, Born-Haber 순환
3. 평형·산염기: 르샤틀리에, 완충용액, 용해도곱, Ka/Kb 계산
4. 반응속도: 속도법칙, 반감기, 활성화 에너지, 반응차수 결정
5. 유기화학: 작용기 명명, SN1/SN2 반응 조건 비교, 입체화학(R/S, E/Z)
6. 생화학 관련: 아미노산 구조, 단백질 구조(1~4차), 효소 반응속도론(Km, Vmax)

[문제 형식]
- 계산형: 실제 수치를 묻는 문제 (농도, 반응률, pH 등) — 50% 이상
- 개념형: 법칙·원리 설명 정오 판별
- 비교형: 두 반응 메커니즘 비교`,
            master: '편입시험 최상위. 복잡한 유기합성 경로, NMR/IR/MS 스펙트럼 해석, 고분자 화학, 약물 작용메커니즘, 수의약품 화학.'
        }
    },
    vet: {
        name: '수의학·가금질병', icon: '🩺',
        prompts: {
            mid: '중학교 수준. 동물의 기본 구조(골격·근육·장기), 질병과 건강의 차이, 백신이란 무엇인가, 닭의 기본 사육법, 손씻기 등 위생 개념. 쉽고 재미있게.',
            high: '고등학교 수준. 감염병 종류(바이러스/세균/기생충)와 전파 경로, 면역의 기본 원리(항원·항체), 가금 사육 환경·온도·습도, 대한민국 구제역·AI 방역 체계 기초.',
            univ: '대학교 수의학개론. 주요 가금질병(AI, ND, IB, IBD, 마렉병, 콕시듐증)의 원인체·증상·진단, 백신 종류(생독·사독·아단위), HACCP 원리, 항생제 사용 관리, 인수공통감염병.',
            exam: `수의대 편입시험 수의학개론·가금질병 — 실제 기출 패턴을 반영하세요.

[경상대 출제 패턴] (수의학개론 10문항)
- 기초수의학 + 임상수의학 혼합
- "미리 가보는 수의학교실" 교재 범위에서 주로 출제
- 가금질병·축산위생 비중 높음

[빈출 주제]
1. 가금질병: 고병원성 AI(H5N1, H5N8), ND(뉴캣슬), IB(전염성 기관지염), IBD(감보로), 마렉병, 가금티푸스, 추백리
2. 방역: 살처분 기준·범위, 이동제한, AI 발생 시 방역 매뉴얼, 예찰·감시체계
3. 백신학: 생백신 vs 사백신 차이, 모체이행 항체, 백신 프로그램, 냉장보관
4. 공중보건: 인수공통감염병(살모넬라·캄필로박터), 식품 안전, HACCP 7원칙
5. 수의사법: 수의사 면허, 동물병원 개설, 처방전 의무, 동물복지법
6. 해부·생리: 조류의 특수 해부학(기낭, 전위·근위, 산란생리), 반추동물 소화

[문제 형식]
- "다음 질병의 원인체로 옳은 것은?" (원인체-질병 매칭)
- "살처분 범위 결정의 핵심 기준은?" (방역 정책)
- "다음 중 인수공통감염병이 아닌 것은?" (소거형)`,
            master: '수의대 전공 심화. 최신 가금질병 연구(H5 clade 분류), 분자진단(RT-PCR, ELISA, HI test 해석), 약제내성 메커니즘(ESBL, MRSA), OIE 국제 방역기준, 가금복지(5대 자유), 최신 백신기술(재조합·DNA 백신).'
        }
    }
};

// ========= DATA HELPERS =========
function getUserFile(userId) { return path.join(DATA_DIR, `${userId}.json`); }

function loadUser(userId) {
    const file = getUserFile(userId);
    if (fs.existsSync(file)) {
        try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
        catch (e) { console.error('Load error:', e); }
    }
    return { scores: {}, levels: {}, history: [] };
}

function saveUser(userId, data) {
    fs.writeFileSync(getUserFile(userId), JSON.stringify(data, null, 2), 'utf8');
}

// ========= DIFFICULTY WEIGHTING =========
function getDifficultyWeights(recentPct) {
    if (recentPct >= 80) return { easy: 2, medium: 3, hard: 5, label: '도전 집중형' };
    if (recentPct >= 60) return { easy: 3, medium: 4, hard: 3, label: '균형 성장형' };
    if (recentPct >= 40) return { easy: 4, medium: 4, hard: 2, label: '기초 강화형' };
    return { easy: 6, medium: 3, hard: 1, label: '자신감 회복형' };
}

// ========= API ENDPOINTS =========

// GET /data/:userId — Load user data
app.get('/data/:userId', (req, res) => {
    const data = loadUser(req.params.userId);
    res.json(data);
});

// POST /save — Save quiz results
app.post('/save', (req, res) => {
    const { userId, scores, levels, history } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const data = loadUser(userId);
    if (scores) data.scores = { ...data.scores, ...scores };
    if (levels) data.levels = { ...data.levels, ...levels };
    if (history) {
        data.history = data.history.concat(history);
        if (data.history.length > 200) data.history = data.history.slice(-200);
    }
    saveUser(userId, data);
    res.json({ ok: true, data });
});

// POST /generate — Generate quiz questions via Gemini
app.post('/generate', async (req, res) => {
    const { subjId, levelIdx, recentPct } = req.body;
    const subj = SUBJECT_PROMPTS[subjId];
    if (!subj) return res.status(400).json({ error: 'Invalid subject' });
    const lvlIdx = Math.max(0, Math.min(levelIdx || 0, LEVELS.length - 1));
    const level = LEVELS[lvlIdx];
    const promptDetail = subj.prompts[level.id];
    const weights = getDifficultyWeights(recentPct ?? 50);
    const DAILY_Q_COUNT = 10;

    const prevLevel = lvlIdx > 0 ? LEVELS[lvlIdx - 1] : null;
    const nextLevel = lvlIdx < LEVELS.length - 1 ? LEVELS[lvlIdx + 1] : null;
    const easyRef = prevLevel ? `${prevLevel.name} 상위 ~ ${level.name} 하위` : `${level.name} 기초`;
    const medRef = `${level.name} 중간`;
    const hardRef = nextLevel ? `${level.name} 상위 ~ ${nextLevel.name} 하위` : `${level.name} 최고 난이도`;

    const prompt = `당신은 한국 교육 전문가이자 수의학과 편입시험 출제 전문가입니다.

학습자 레벨: ${level.emoji} ${level.name} (${level.desc})
과목: ${subj.name}
난이도 배분: ${weights.label}

${promptDetail}

4지선다 문제 ${DAILY_Q_COUNT}개를 JSON 배열로 생성하세요.
반드시 다음 난이도 배분을 지켜주세요:

📗 워밍업 (${easyRef}) — ${weights.easy}문제: 자신감을 주는 기초 문제
📙 도전 (${medRef}) — ${weights.medium}문제: 현재 레벨에 맞는 적정 난이도
📕 심화 (${hardRef}) — ${weights.hard}문제: 한 단계 높은 도전 문제

문제 순서: 워밍업 → 도전 → 심화 순으로 배치하세요.
각 문제에 difficulty 필드를 추가하세요: "easy", "medium", "hard"

형식: [{"q":"문제","opts":["A","B","C","D"],"ans":정답인덱스(0-3),"exp":"상세한 한국어 해설","difficulty":"easy|medium|hard"}]

중요 규칙:
- 정답 위치를 무작위로 분배 (ans가 0,1,2,3 골고루)
- 해설은 핵심 개념을 포함하여 교재 없이도 학습 가능하도록 상세하게
- 오답 보기도 그럴듯하게 구성
- 워밍업 문제 해설 끝에 격려 메시지 추가
- 심화 문제 해설 끝에 "이 수준까지 도전하고 있다니 대단합니다!" 같은 격려 추가
JSON 배열만 출력. 다른 텍스트 없이.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.85 } })
        });
        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const questions = JSON.parse(text);
        if (!Array.isArray(questions) || questions.length < 1) throw new Error('Invalid AI response');
        const cleaned = questions.map(q => ({
            q: q.q || '',
            opts: Array.isArray(q.opts) && q.opts.length === 4 ? q.opts : ['A', 'B', 'C', 'D'],
            ans: typeof q.ans === 'number' && q.ans >= 0 && q.ans <= 3 ? q.ans : 0,
            exp: q.exp || '해설 없음',
            difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium'
        }));
        res.json({ ok: true, questions: cleaned, weights });
    } catch (e) {
        console.error('Gemini Error:', e.message);
        res.status(500).json({ error: 'Question generation failed', details: e.message });
    }
});

// Health check
app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.listen(PORT, () => {
    console.log(`[STK Quiz API] Running on port ${PORT}`);
    console.log(`[STK Quiz API] Data directory: ${DATA_DIR}`);
});

// ═══════════════════════════════════════
// 대한민국 정부 조직도 데이터
// ═══════════════════════════════════════

const folderData = [
    {
        id: 'president', name: '대통령', person: '이재명', url: 'https://www.president.go.kr', icon: '🏛', desc: '대한민국 대통령', children: [
            {
                id: 'presidential-office', name: '대통령실', person: '강훈식', icon: '🏢', desc: '대통령비서실', children: [
                    { id: 'nsc', name: '국가안보실', icon: '🛡', desc: '국가안보 총괄' },
                    { id: 'policy-planning', name: '정책기획수석', icon: '📋', desc: '정책 기획·조정' },
                    { id: 'civil-society', name: '시민사회수석', icon: '🤝', desc: '시민사회 소통' },
                    { id: 'economic-affairs', name: '경제수석', icon: '💹', desc: '경제정책 총괄' },
                    { id: 'political-affairs', name: '정무수석', icon: '⚖', desc: '정무 업무' },
                    { id: 'spokesperson', name: '홍보수석', icon: '📢', desc: '대통령실 홍보' },
                ]
            },
            { id: 'nis', name: '국가정보원', person: '이종석', url: 'https://www.nis.go.kr', icon: '🔍', desc: '국가 정보·안보' },
            { id: 'nsc-council', name: '국가안전보장회의', icon: '🛡', desc: '안보 정책 심의' },
            { id: 'audit', name: '감사원', person: '최재해', url: 'https://www.bai.go.kr', icon: '🔎', desc: '국가 감사' },
        ]
    },
    {
        id: 'pm', name: '국무총리', person: '김민석', url: 'https://www.opm.go.kr', icon: '👔', desc: '국무총리실', children: [
            { id: 'opm', name: '국무조정실', url: 'https://www.opm.go.kr', icon: '⚙', desc: '정책 조정' },
            {
                id: 'ministries', name: '행정각부', icon: '🏛', desc: '중앙행정기관', children: [
                    { id: 'moef', name: '재정경제부', person: '구윤철', url: 'https://www.moef.go.kr', icon: '💰', desc: '부총리 겸임' },
                    { id: 'mofa', name: '외교부', person: '조현', url: 'https://www.mofa.go.kr', icon: '🌐', desc: '외교·재외국민' },
                    { id: 'mou', name: '통일부', person: '정동영', url: 'https://www.unikorea.go.kr', icon: '🤝', desc: '남북관계·통일' },
                    { id: 'moj', name: '법무부', person: '정성호', url: 'https://www.moj.go.kr', icon: '⚖', desc: '법무·검찰' },
                    { id: 'mnd', name: '국방부', person: '안규백', url: 'https://www.mnd.go.kr', icon: '🎖', desc: '국방·군사' },
                    {
                        id: 'mois', name: '행정안전부', person: '윤호중', url: 'https://www.mois.go.kr', icon: '🏘', desc: '행정·안전·지방자치', children: [
                            {
                                id: 'metro', name: '광역자치단체 (17)', icon: '🏙', desc: '특별시·광역시·도·특별자치시·특별자치도', children: [
                                    { id: 'seoul', name: '서울특별시', person: '오세훈', url: 'https://www.seoul.go.kr', icon: '🏙', desc: '수도' },
                                    { id: 'busan', name: '부산광역시', person: '박형준', url: 'https://www.busan.go.kr', icon: '⚓', desc: '항구도시' },
                                    { id: 'daegu', name: '대구광역시', person: '홍준표', url: 'https://www.daegu.go.kr', icon: '🏙', desc: '영남권' },
                                    { id: 'incheon', name: '인천광역시', person: '유정복', url: 'https://www.incheon.go.kr', icon: '✈', desc: '국제공항' },
                                    { id: 'gwangju', name: '광주광역시', person: '강기정', url: 'https://www.gwangju.go.kr', icon: '🌅', desc: '호남권' },
                                    { id: 'daejeon', name: '대전광역시', person: '이장우', url: 'https://www.daejeon.go.kr', icon: '🔬', desc: '과학도시' },
                                    { id: 'ulsan', name: '울산광역시', person: '김두겸', url: 'https://www.ulsan.go.kr', icon: '🏭', desc: '산업도시' },
                                    { id: 'sejong', name: '세종특별자치시', person: '최민호', url: 'https://www.sejong.go.kr', icon: '🏛', desc: '행정수도' },
                                    { id: 'gyeonggi', name: '경기도', person: '김동연', url: 'https://www.gg.go.kr', icon: '🗺', desc: '수도권' },
                                    { id: 'chungbuk', name: '충청북도', person: '김영환', url: 'https://www.chungbuk.go.kr', icon: '🗺', desc: '충북' },
                                    { id: 'chungnam', name: '충청남도', person: '김태흠', url: 'https://www.chungnam.go.kr', icon: '🗺', desc: '충남' },
                                    { id: 'jeonbuk', name: '전북특별자치도', person: '김관영', url: 'https://www.jeonbuk.go.kr', icon: '🗺', desc: '전북' },
                                    { id: 'jeonnam', name: '전라남도', person: '김영록', url: 'https://www.jeonnam.go.kr', icon: '🗺', desc: '전남' },
                                    {
                                        id: 'gyeongbuk', name: '경상북도', person: '이철우', url: 'https://www.gb.go.kr', icon: '🗺', desc: '경북', children: [
                                            {
                                                id: 'gb-local', name: '기초자치단체', icon: '🏘', desc: '시·군', children: [
                                                    { id: 'cheongsong', name: '청송군', person: '윤경희', url: 'https://www.cs.go.kr', icon: '🏔', desc: '청송군수' },
                                                ]
                                            }
                                        ]
                                    },
                                    { id: 'gyeongnam', name: '경상남도', person: '박완수', url: 'https://www.gyeongnam.go.kr', icon: '🗺', desc: '경남' },
                                    { id: 'gangwon', name: '강원특별자치도', person: '김진태', url: 'https://state.gwd.go.kr', icon: '⛰', desc: '강원' },
                                    { id: 'jeju', name: '제주특별자치도', person: '오영훈', url: 'https://www.jeju.go.kr', icon: '🍊', desc: '제주' },
                                ]
                            },
                            { id: 'local-gov', name: '기초자치단체 (226)', icon: '🏘', desc: '시·군·구' },
                        ]
                    },
                    { id: 'mcst', name: '문화체육관광부', person: '최휘영', url: 'https://www.mcst.go.kr', icon: '🎭', desc: '문화·체육·관광' },
                    { id: 'mafra', name: '농림축산식품부', person: '송미령', url: 'https://www.mafra.go.kr', icon: '🌾', desc: '농업·축산·식품' },
                    { id: 'motie', name: '산업통상부', person: '김정관', url: 'https://www.motie.go.kr', icon: '🏭', desc: '산업·통상·에너지' },
                    { id: 'mohw', name: '보건복지부', person: '정은경', url: 'https://www.mohw.go.kr', icon: '🏥', desc: '보건·복지' },
                    { id: 'me', name: '기후에너지환경부', person: '김성환', url: 'https://me.go.kr', icon: '🌱', desc: '환경 보전' },
                    { id: 'moel', name: '고용노동부', person: '김영훈', url: 'https://www.moel.go.kr', icon: '👷', desc: '고용·노동' },
                    { id: 'mogef', name: '성평등가족부', person: '원민경', url: 'https://www.mogef.go.kr', icon: '👨‍👩‍👧', desc: '성평등·가족·청소년' },
                    { id: 'molit', name: '국토교통부', person: '김윤덕', url: 'https://www.molit.go.kr', icon: '🚄', desc: '국토·교통' },
                    { id: 'mof', name: '해양수산부', person: '황종우', url: 'https://www.mof.go.kr', icon: '🚢', desc: '해양·수산' },
                    { id: 'msit', name: '과학기술정보통신부', person: '배경훈', url: 'https://www.msit.go.kr', icon: '🔬', desc: '부총리 겸임' },
                    { id: 'moe', name: '교육부', person: '최교진', url: 'https://www.moe.go.kr', icon: '📚', desc: '교육 정책' },
                    { id: 'mpv', name: '국가보훈부', person: '권오을', url: 'https://www.mpva.go.kr', icon: '🎗', desc: '보훈 정책' },
                ]
            },
            {
                id: 'offices', name: '처/청/위원회', icon: '🏢', desc: '국무총리 소속기관', children: [
                    { id: 'mpb-2', name: '기획예산처', person: '박홍근', icon: '📊', desc: '예산 편성' },
                    { id: 'mss', name: '중소벤처기업부', person: '한성숙', url: 'https://www.mss.go.kr', icon: '🚀', desc: '중소·벤처' },
                    { id: 'mpm', name: '인사혁신처', person: '연원정', url: 'https://www.mpm.go.kr', icon: '👤', desc: '공무원 인사' },
                    { id: 'mpb', name: '법제처', person: '이완규', url: 'https://www.moleg.go.kr', icon: '📜', desc: '법령 심사' },
                    { id: 'kfda', name: '식품의약품안전처', person: '오유경', url: 'https://www.mfds.go.kr', icon: '💊', desc: '식품·의약 안전' },
                    { id: 'fdma', name: '소방청', person: '허석곤', url: 'https://www.nfa.go.kr', icon: '🚒', desc: '소방·구조' },
                    { id: 'acrc', name: '국민권익위원회', person: '유철환', url: 'https://www.acrc.go.kr', icon: '📣', desc: '부패방지·권익보호' },
                ]
            },
        ]
    },
    {
        id: 'independent', name: '독립기관', icon: '🏦', desc: '헌법기관', children: [
            { id: 'assembly', name: '국회', person: '우원식', url: 'https://www.assembly.go.kr', icon: '🏛', desc: '입법부' },
            { id: 'court', name: '대법원', person: '조희대', url: 'https://www.scourt.go.kr', icon: '⚖', desc: '사법부' },
            { id: 'constitution', name: '헌법재판소', person: '이종석', url: 'https://www.ccourt.go.kr', icon: '📖', desc: '위헌 심판' },
            { id: 'nec', name: '중앙선거관리위원회', person: '노태악', url: 'https://www.nec.go.kr', icon: '🗳', desc: '선거 관리' },
        ]
    },
];

// ═══════════════════════════════════════
// 업무 데이터
// ═══════════════════════════════════════

const tasks = [
    { id: 't0', text: '예산안 편성 지침 하달', cat: 'budget', priority: 'high', done: false, folders: ['moef', 'mpb-2'] },
    { id: 't1', text: '혁신형 일자리 창출 회의', cat: 'tech', priority: 'high', done: false, folders: ['msit', 'motie', 'moel'] },
    { id: 't2', text: '탄소중립 로드맵 점검', cat: 'tech', priority: 'high', done: false, folders: ['me', 'motie'] },
    { id: 't3', text: '국방개혁 이행 점검', cat: 'security', priority: 'high', done: false, folders: ['mnd', 'nsc'] },
    { id: 't4', text: '저출생 대책 종합계획 확정', cat: 'welfare', priority: 'high', done: true, folders: ['mohw', 'mogef'] },
    { id: 't5', text: '중소기업 지원 확대 간담회', cat: 'admin', priority: 'mid', done: false, folders: ['mss', 'opm'] },
    { id: 't6', text: '정부조직 개편안 입법 예고', cat: 'admin', priority: 'mid', done: false, folders: ['mois', 'mpb'] },
    { id: 't7', text: '미래 교육체제 개편안 발표', cat: 'admin', priority: 'mid', done: false, folders: ['moe', 'msit'] },
    { id: 't8', text: '남북 교류협력 재개안 검토', cat: 'diplomacy', priority: 'mid', done: false, folders: ['mou', 'nis'] },
    { id: 't9', text: '신규 식품안전 기준 고시', cat: 'welfare', priority: 'low', done: true, folders: ['kfda', 'mafra'] },
];

const categories = {
    budget: { name: '예산·재정', color: '#6366f1' },
    diplomacy: { name: '외교·안보', color: '#e17055' },
    tech: { name: '미래·산업', color: '#00b894' },
    security: { name: '국방', color: '#d63031' },
    welfare: { name: '복지·사회', color: '#8b5cf6' },
    admin: { name: '행정·제도', color: '#fdcb6e' },
};

// ═══════════════════════════════════════
// 부처 간 관계
// ═══════════════════════════════════════

const folderRelations = [
    ['nsc', 'mnd'],
    ['nsc', 'nis'],
    ['moef', 'mpb-2'],
    ['moef', 'motie'],
    ['mofa', 'mou'],
    ['moj', 'court'],
    ['mnd', 'mpv'],
    ['mois', 'fdma'],
    ['mohw', 'kfda'],
    ['molit', 'me'],
    ['msit', 'moe'],
    ['mafra', 'mof'],
    ['assembly', 'nec'],
];

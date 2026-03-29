// ═══════════════════════════════════════
// 대한민국 정부 조직도 데이터
// ═══════════════════════════════════════

const folderData = [
    {
        id: 'president', name: '대통령', icon: '🏛', desc: '대한민국 대통령', children: [
            {
                id: 'presidential-office', name: '대통령실', icon: '🏢', desc: '대통령비서실', children: [
                    { id: 'nsc', name: '국가안보실', icon: '🛡', desc: '국가안보 총괄' },
                    { id: 'policy-planning', name: '정책기획수석', icon: '📋', desc: '정책 기획·조정' },
                    { id: 'civil-society', name: '시민사회수석', icon: '🤝', desc: '시민사회 소통' },
                    { id: 'economic-affairs', name: '경제수석', icon: '💹', desc: '경제정책 총괄' },
                    { id: 'political-affairs', name: '정무수석', icon: '⚖', desc: '정무 업무' },
                    { id: 'spokesperson', name: '홍보수석', icon: '📢', desc: '대통령실 홍보' },
                ]
            },
            { id: 'nis', name: '국가정보원', icon: '🔍', desc: '국가 정보·안보' },
            { id: 'nsc-council', name: '국가안전보장회의', icon: '🛡', desc: '안보 정책 심의' },
            { id: 'audit', name: '감사원', icon: '🔎', desc: '국가 감사' },
        ]
    },
    {
        id: 'pm', name: '국무총리', icon: '👔', desc: '국무총리실', children: [
            { id: 'opm', name: '국무조정실', icon: '⚙', desc: '정책 조정' },
            {
                id: 'ministries', name: '행정각부 (18부)', icon: '🏛', desc: '중앙행정기관', children: [
                    { id: 'moef', name: '기획재정부', icon: '💰', desc: '재정·경제정책' },
                    { id: 'mofa', name: '외교부', icon: '🌐', desc: '외교·재외국민' },
                    { id: 'mou', name: '통일부', icon: '🤝', desc: '남북관계·통일' },
                    { id: 'moj', name: '법무부', icon: '⚖', desc: '법무·검찰' },
                    { id: 'mnd', name: '국방부', icon: '🎖', desc: '국방·군사' },
                    {
                        id: 'mois', name: '행정안전부', icon: '🏘', desc: '행정·안전·지방자치', children: [
                            {
                                id: 'metro', name: '광역자치단체 (17)', icon: '🏙', desc: '특별시·광역시·도·특별자치시·특별자치도', children: [
                                    { id: 'seoul', name: '서울특별시', icon: '🏙', desc: '수도' },
                                    { id: 'busan', name: '부산광역시', icon: '⚓', desc: '항구도시' },
                                    { id: 'daegu', name: '대구광역시', icon: '🏙', desc: '영남권' },
                                    { id: 'incheon', name: '인천광역시', icon: '✈', desc: '국제공항' },
                                    { id: 'gwangju', name: '광주광역시', icon: '🌅', desc: '호남권' },
                                    { id: 'daejeon', name: '대전광역시', icon: '🔬', desc: '과학도시' },
                                    { id: 'ulsan', name: '울산광역시', icon: '🏭', desc: '산업도시' },
                                    { id: 'sejong', name: '세종특별자치시', icon: '🏛', desc: '행정수도' },
                                    { id: 'gyeonggi', name: '경기도', icon: '🗺', desc: '수도권' },
                                    { id: 'chungbuk', name: '충청북도', icon: '🗺', desc: '충북' },
                                    { id: 'chungnam', name: '충청남도', icon: '🗺', desc: '충남' },
                                    { id: 'jeonbuk', name: '전북특별자치도', icon: '🗺', desc: '전북' },
                                    { id: 'jeonnam', name: '전라남도', icon: '🗺', desc: '전남' },
                                    {
                                        id: 'gyeongbuk', name: '경상북도', icon: '🗺', desc: '경북', children: [
                                            {
                                                id: 'gb-local', name: '기초자치단체', icon: '🏘', desc: '시·군', children: [
                                                    { id: 'cheongsong', name: '청송군', icon: '🏔', desc: '청송군수' },
                                                ]
                                            }
                                        ]
                                    },
                                    { id: 'gyeongnam', name: '경상남도', icon: '🗺', desc: '경남' },
                                    { id: 'gangwon', name: '강원특별자치도', icon: '⛰', desc: '강원' },
                                    { id: 'jeju', name: '제주특별자치도', icon: '🍊', desc: '제주' },
                                ]
                            },
                            { id: 'local-gov', name: '기초자치단체 (226)', icon: '🏘', desc: '시·군·구' },
                        ]
                    },
                    { id: 'mcst', name: '문화체육관광부', icon: '🎭', desc: '문화·체육·관광' },
                    { id: 'mafra', name: '농림축산식품부', icon: '🌾', desc: '농업·축산·식품' },
                    { id: 'motie', name: '산업통상자원부', icon: '🏭', desc: '산업·통상·에너지' },
                    { id: 'mohw', name: '보건복지부', icon: '🏥', desc: '보건·복지' },
                    { id: 'me', name: '환경부', icon: '🌱', desc: '환경 보전' },
                    { id: 'moel', name: '고용노동부', icon: '👷', desc: '고용·노동' },
                    { id: 'mogef', name: '여성가족부', icon: '👨‍👩‍👧', desc: '여성·가족·청소년' },
                    { id: 'molit', name: '국토교통부', icon: '🚄', desc: '국토·교통' },
                    { id: 'mof', name: '해양수산부', icon: '🚢', desc: '해양·수산' },
                    { id: 'msit', name: '과학기술정보통신부', icon: '🔬', desc: '과학·ICT' },
                    { id: 'moe', name: '교육부', icon: '📚', desc: '교육 정책' },
                    { id: 'mpv', name: '국가보훈부', icon: '🎗', desc: '보훈 정책' },
                ]
            },
            {
                id: 'offices', name: '처 (5처)', icon: '🏢', desc: '국무총리 소속기관', children: [
                    { id: 'mpm', name: '인사혁신처', icon: '👤', desc: '공무원 인사' },
                    { id: 'mpb', name: '법제처', icon: '📜', desc: '법령 심사' },
                    { id: 'kfda', name: '식품의약품안전처', icon: '💊', desc: '식품·의약 안전' },
                    { id: 'fdma', name: '소방청', icon: '🚒', desc: '소방·구조' },
                    { id: 'acrc', name: '국민권익위원회', icon: '📣', desc: '부패방지·권익보호' },
                ]
            },
        ]
    },
    {
        id: 'independent', name: '독립기관', icon: '🏦', desc: '헌법기관', children: [
            { id: 'assembly', name: '국회', icon: '🏛', desc: '입법부' },
            { id: 'court', name: '대법원', icon: '⚖', desc: '사법부' },
            { id: 'constitution', name: '헌법재판소', icon: '📖', desc: '위헌 심판' },
            { id: 'nec', name: '중앙선거관리위원회', icon: '🗳', desc: '선거 관리' },
        ]
    },
];

// ═══════════════════════════════════════
// 업무 데이터
// ═══════════════════════════════════════

const tasks = [
    { id: 't0', text: '2025년도 추경 예산안 국회 제출', cat: 'budget', priority: 'high', done: false, folders: ['moef', 'assembly'] },
    { id: 't1', text: '한미 정상회담 의제 최종 협의', cat: 'diplomacy', priority: 'high', done: false, folders: ['mofa', 'nsc', 'presidential-office'] },
    { id: 't2', text: 'AI 반도체 국가전략 수립', cat: 'tech', priority: 'high', done: false, folders: ['msit', 'motie'] },
    { id: 't3', text: '국방개혁 4.0 이행 점검', cat: 'security', priority: 'high', done: false, folders: ['mnd', 'nsc'] },
    { id: 't4', text: '저출생 대책 종합계획 검토', cat: 'welfare', priority: 'high', done: true, folders: ['mohw', 'mogef'] },
    { id: 't5', text: '공공기관 혁신 평가 결과 보고', cat: 'admin', priority: 'mid', done: false, folders: ['mpm', 'opm'] },
    { id: 't6', text: '탄소중립 2030 이행 로드맵', cat: 'tech', priority: 'mid', done: false, folders: ['me', 'motie'] },
    { id: 't7', text: '지방재정 확충 방안 국무회의 상정', cat: 'admin', priority: 'mid', done: false, folders: ['mois', 'moef'] },
    { id: 't8', text: '남북 교류협력 재개 검토', cat: 'diplomacy', priority: 'mid', done: false, folders: ['mou', 'nis'] },
    { id: 't9', text: '식품안전 관리체계 강화 계획', cat: 'welfare', priority: 'low', done: true, folders: ['kfda', 'mafra'] },
];

const categories = {
    budget: { name: '예산·재정', color: '#6366f1' },
    diplomacy: { name: '외교·안보', color: '#e17055' },
    tech: { name: '과학·산업', color: '#00b894' },
    security: { name: '국방', color: '#d63031' },
    welfare: { name: '복지·사회', color: '#8b5cf6' },
    admin: { name: '행정·관리', color: '#fdcb6e' },
};

// ═══════════════════════════════════════
// 부처 간 관계
// ═══════════════════════════════════════

const folderRelations = [
    ['nsc', 'mnd'],
    ['nsc', 'nis'],
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

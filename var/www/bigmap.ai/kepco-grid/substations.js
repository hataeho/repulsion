/**
 * 전국 주요 변전소 여유용량 데이터
 * ============================================
 * 출처: 한전 공개자료, 공공데이터포털, EPSIS 기반 참고 데이터
 * 주의: 실제 접속 가능 여부는 한전 지사 문의 필요
 *
 * 데이터 구조:
 * - name: 변전소명
 * - region: 지역 구분
 * - province: 시/도
 * - lat, lng: 위도, 경도
 * - voltage: 전압 등급 (kV)
 * - totalCapacity: 총 용량 (MW)
 * - usedCapacity: 사용 용량 (MW)
 * - availableCapacity: 여유 용량 (MW)
 * - breakers: 차단기 현황 { total, used, reserved }
 * - solarPending: 태양광 접속 대기 (MW)
 */

const SUBSTATIONS = [
    // ============================
    //  수도권 (서울, 경기, 인천)
    // ============================
    {
        name: "신인천변전소",
        region: "수도권",
        province: "인천광역시",
        lat: 37.4563,
        lng: 126.7052,
        voltage: 345,
        totalCapacity: 900,
        usedCapacity: 780,
        availableCapacity: 120,
        breakers: { total: 12, used: 10, reserved: 1 },
        solarPending: 15
    },
    {
        name: "신안성변전소",
        region: "수도권",
        province: "경기도 안성시",
        lat: 37.0080,
        lng: 127.2797,
        voltage: 345,
        totalCapacity: 800,
        usedCapacity: 620,
        availableCapacity: 180,
        breakers: { total: 10, used: 7, reserved: 1 },
        solarPending: 25
    },
    {
        name: "시흥변전소",
        region: "수도권",
        province: "경기도 시흥시",
        lat: 37.3800,
        lng: 126.8030,
        voltage: 154,
        totalCapacity: 450,
        usedCapacity: 410,
        availableCapacity: 40,
        breakers: { total: 8, used: 7, reserved: 1 },
        solarPending: 5
    },
    {
        name: "양주변전소",
        region: "수도권",
        province: "경기도 양주시",
        lat: 37.7850,
        lng: 127.0456,
        voltage: 154,
        totalCapacity: 400,
        usedCapacity: 280,
        availableCapacity: 120,
        breakers: { total: 8, used: 5, reserved: 1 },
        solarPending: 10
    },
    {
        name: "이천변전소",
        region: "수도권",
        province: "경기도 이천시",
        lat: 37.2720,
        lng: 127.4350,
        voltage: 154,
        totalCapacity: 380,
        usedCapacity: 290,
        availableCapacity: 90,
        breakers: { total: 8, used: 6, reserved: 1 },
        solarPending: 18
    },
    {
        name: "평택변전소",
        region: "수도권",
        province: "경기도 평택시",
        lat: 36.9920,
        lng: 127.0886,
        voltage: 154,
        totalCapacity: 500,
        usedCapacity: 430,
        availableCapacity: 70,
        breakers: { total: 10, used: 8, reserved: 1 },
        solarPending: 12
    },
    {
        name: "용인변전소",
        region: "수도권",
        province: "경기도 용인시",
        lat: 37.2410,
        lng: 127.1775,
        voltage: 154,
        totalCapacity: 420,
        usedCapacity: 395,
        availableCapacity: 25,
        breakers: { total: 8, used: 8, reserved: 0 },
        solarPending: 3
    },
    {
        name: "파주변전소",
        region: "수도권",
        province: "경기도 파주시",
        lat: 37.7590,
        lng: 126.7800,
        voltage: 154,
        totalCapacity: 350,
        usedCapacity: 210,
        availableCapacity: 140,
        breakers: { total: 8, used: 4, reserved: 2 },
        solarPending: 20
    },
    {
        name: "김포변전소",
        region: "수도권",
        province: "경기도 김포시",
        lat: 37.6152,
        lng: 126.7156,
        voltage: 154,
        totalCapacity: 300,
        usedCapacity: 260,
        availableCapacity: 40,
        breakers: { total: 6, used: 5, reserved: 1 },
        solarPending: 8
    },
    {
        name: "여주변전소",
        region: "수도권",
        province: "경기도 여주시",
        lat: 37.2984,
        lng: 127.6366,
        voltage: 154,
        totalCapacity: 320,
        usedCapacity: 170,
        availableCapacity: 150,
        breakers: { total: 8, used: 4, reserved: 1 },
        solarPending: 30
    },

    // ============================
    //  강원
    // ============================
    {
        name: "동해변전소",
        region: "강원",
        province: "강원도 동해시",
        lat: 37.5246,
        lng: 129.1143,
        voltage: 345,
        totalCapacity: 700,
        usedCapacity: 350,
        availableCapacity: 350,
        breakers: { total: 10, used: 4, reserved: 2 },
        solarPending: 5
    },
    {
        name: "춘천변전소",
        region: "강원",
        province: "강원도 춘천시",
        lat: 37.8813,
        lng: 127.7300,
        voltage: 154,
        totalCapacity: 400,
        usedCapacity: 220,
        availableCapacity: 180,
        breakers: { total: 8, used: 4, reserved: 1 },
        solarPending: 12
    },
    {
        name: "원주변전소",
        region: "강원",
        province: "강원도 원주시",
        lat: 37.3422,
        lng: 127.9202,
        voltage: 154,
        totalCapacity: 380,
        usedCapacity: 200,
        availableCapacity: 180,
        breakers: { total: 8, used: 4, reserved: 2 },
        solarPending: 15
    },
    {
        name: "강릉변전소",
        region: "강원",
        province: "강원도 강릉시",
        lat: 37.7519,
        lng: 128.8761,
        voltage: 154,
        totalCapacity: 350,
        usedCapacity: 180,
        availableCapacity: 170,
        breakers: { total: 8, used: 4, reserved: 1 },
        solarPending: 8
    },
    {
        name: "속초변전소",
        region: "강원",
        province: "강원도 속초시",
        lat: 38.2070,
        lng: 128.5918,
        voltage: 154,
        totalCapacity: 250,
        usedCapacity: 110,
        availableCapacity: 140,
        breakers: { total: 6, used: 2, reserved: 1 },
        solarPending: 3
    },
    {
        name: "태백변전소",
        region: "강원",
        province: "강원도 태백시",
        lat: 37.1640,
        lng: 128.9856,
        voltage: 154,
        totalCapacity: 200,
        usedCapacity: 80,
        availableCapacity: 120,
        breakers: { total: 6, used: 2, reserved: 1 },
        solarPending: 2
    },
    {
        name: "홍천변전소",
        region: "강원",
        province: "강원도 홍천군",
        lat: 37.6970,
        lng: 127.8886,
        voltage: 154,
        totalCapacity: 280,
        usedCapacity: 120,
        availableCapacity: 160,
        breakers: { total: 6, used: 2, reserved: 2 },
        solarPending: 10
    },

    // ============================
    //  충청 (충북, 충남, 대전, 세종)
    // ============================
    {
        name: "신충주변전소",
        region: "충청",
        province: "충청북도 충주시",
        lat: 36.9910,
        lng: 127.9259,
        voltage: 345,
        totalCapacity: 750,
        usedCapacity: 420,
        availableCapacity: 330,
        breakers: { total: 10, used: 5, reserved: 2 },
        solarPending: 40
    },
    {
        name: "청주변전소",
        region: "충청",
        province: "충청북도 청주시",
        lat: 36.6424,
        lng: 127.4890,
        voltage: 154,
        totalCapacity: 450,
        usedCapacity: 350,
        availableCapacity: 100,
        breakers: { total: 8, used: 7, reserved: 1 },
        solarPending: 22
    },
    {
        name: "제천변전소",
        region: "충청",
        province: "충청북도 제천시",
        lat: 37.1325,
        lng: 128.1910,
        voltage: 154,
        totalCapacity: 300,
        usedCapacity: 140,
        availableCapacity: 160,
        breakers: { total: 6, used: 3, reserved: 1 },
        solarPending: 18
    },
    {
        name: "보은변전소",
        region: "충청",
        province: "충청북도 보은군",
        lat: 36.4890,
        lng: 127.7293,
        voltage: 154,
        totalCapacity: 250,
        usedCapacity: 100,
        availableCapacity: 150,
        breakers: { total: 6, used: 2, reserved: 1 },
        solarPending: 25
    },
    {
        name: "신대전변전소",
        region: "충청",
        province: "대전광역시",
        lat: 36.3504,
        lng: 127.3845,
        voltage: 345,
        totalCapacity: 800,
        usedCapacity: 580,
        availableCapacity: 220,
        breakers: { total: 10, used: 7, reserved: 1 },
        solarPending: 10
    },
    {
        name: "세종변전소",
        region: "충청",
        province: "세종특별자치시",
        lat: 36.4801,
        lng: 127.0082,
        voltage: 154,
        totalCapacity: 400,
        usedCapacity: 280,
        availableCapacity: 120,
        breakers: { total: 8, used: 6, reserved: 1 },
        solarPending: 15
    },
    {
        name: "서산변전소",
        region: "충청",
        province: "충청남도 서산시",
        lat: 36.7845,
        lng: 126.4503,
        voltage: 154,
        totalCapacity: 380,
        usedCapacity: 210,
        availableCapacity: 170,
        breakers: { total: 8, used: 4, reserved: 2 },
        solarPending: 35
    },
    {
        name: "당진변전소",
        region: "충청",
        province: "충청남도 당진시",
        lat: 36.8898,
        lng: 126.6463,
        voltage: 345,
        totalCapacity: 1000,
        usedCapacity: 680,
        availableCapacity: 320,
        breakers: { total: 14, used: 8, reserved: 3 },
        solarPending: 28
    },
    {
        name: "논산변전소",
        region: "충청",
        province: "충청남도 논산시",
        lat: 36.1870,
        lng: 127.0988,
        voltage: 154,
        totalCapacity: 320,
        usedCapacity: 180,
        availableCapacity: 140,
        breakers: { total: 6, used: 3, reserved: 2 },
        solarPending: 30
    },
    {
        name: "홍성변전소",
        region: "충청",
        province: "충청남도 홍성군",
        lat: 36.6010,
        lng: 126.6602,
        voltage: 154,
        totalCapacity: 280,
        usedCapacity: 140,
        availableCapacity: 140,
        breakers: { total: 6, used: 3, reserved: 1 },
        solarPending: 22
    },
    {
        name: "천안변전소",
        region: "충청",
        province: "충남 천안시",
        lat: 36.8151,
        lng: 127.1139,
        voltage: 154,
        totalCapacity: 450,
        usedCapacity: 370,
        availableCapacity: 80,
        breakers: { total: 8, used: 7, reserved: 1 },
        solarPending: 10
    },

    // ============================
    //  전라 (전북, 전남, 광주)
    // ============================
    {
        name: "신전주변전소",
        region: "전라",
        province: "전북특별자치도 전주시",
        lat: 35.8242,
        lng: 127.1480,
        voltage: 345,
        totalCapacity: 700,
        usedCapacity: 580,
        availableCapacity: 120,
        breakers: { total: 10, used: 8, reserved: 2 },
        solarPending: 65
    },
    {
        name: "군산변전소",
        region: "전라",
        province: "전북특별자치도 군산시",
        lat: 35.9676,
        lng: 126.7368,
        voltage: 154,
        totalCapacity: 400,
        usedCapacity: 360,
        availableCapacity: 40,
        breakers: { total: 8, used: 7, reserved: 1 },
        solarPending: 50
    },
    {
        name: "익산변전소",
        region: "전라",
        province: "전북특별자치도 익산시",
        lat: 35.9484,
        lng: 126.9577,
        voltage: 154,
        totalCapacity: 350,
        usedCapacity: 310,
        availableCapacity: 40,
        breakers: { total: 8, used: 7, reserved: 1 },
        solarPending: 55
    },
    {
        name: "정읍변전소",
        region: "전라",
        province: "전북특별자치도 정읍시",
        lat: 35.5690,
        lng: 126.8558,
        voltage: 154,
        totalCapacity: 280,
        usedCapacity: 250,
        availableCapacity: 30,
        breakers: { total: 6, used: 6, reserved: 0 },
        solarPending: 60
    },
    {
        name: "남원변전소",
        region: "전라",
        province: "전북특별자치도 남원시",
        lat: 35.4164,
        lng: 127.3907,
        voltage: 154,
        totalCapacity: 250,
        usedCapacity: 150,
        availableCapacity: 100,
        breakers: { total: 6, used: 3, reserved: 1 },
        solarPending: 35
    },
    {
        name: "광주변전소",
        region: "전라",
        province: "광주광역시",
        lat: 35.1595,
        lng: 126.8526,
        voltage: 345,
        totalCapacity: 650,
        usedCapacity: 540,
        availableCapacity: 110,
        breakers: { total: 10, used: 8, reserved: 1 },
        solarPending: 20
    },
    {
        name: "나주변전소",
        region: "전라",
        province: "전라남도 나주시",
        lat: 35.0160,
        lng: 126.7108,
        voltage: 154,
        totalCapacity: 350,
        usedCapacity: 330,
        availableCapacity: 20,
        breakers: { total: 8, used: 8, reserved: 0 },
        solarPending: 70
    },
    {
        name: "무안변전소",
        region: "전라",
        province: "전라남도 무안군",
        lat: 34.9906,
        lng: 126.4817,
        voltage: 154,
        totalCapacity: 300,
        usedCapacity: 275,
        availableCapacity: 25,
        breakers: { total: 6, used: 6, reserved: 0 },
        solarPending: 55
    },
    {
        name: "해남변전소",
        region: "전라",
        province: "전라남도 해남군",
        lat: 34.5710,
        lng: 126.5993,
        voltage: 154,
        totalCapacity: 320,
        usedCapacity: 290,
        availableCapacity: 30,
        breakers: { total: 6, used: 6, reserved: 0 },
        solarPending: 80
    },
    {
        name: "순천변전소",
        region: "전라",
        province: "전라남도 순천시",
        lat: 34.9506,
        lng: 127.4873,
        voltage: 154,
        totalCapacity: 380,
        usedCapacity: 280,
        availableCapacity: 100,
        breakers: { total: 8, used: 6, reserved: 1 },
        solarPending: 25
    },
    {
        name: "목포변전소",
        region: "전라",
        province: "전라남도 목포시",
        lat: 34.8118,
        lng: 126.3922,
        voltage: 154,
        totalCapacity: 280,
        usedCapacity: 255,
        availableCapacity: 25,
        breakers: { total: 6, used: 6, reserved: 0 },
        solarPending: 45
    },
    {
        name: "영광변전소",
        region: "전라",
        province: "전라남도 영광군",
        lat: 35.2770,
        lng: 126.5120,
        voltage: 154,
        totalCapacity: 350,
        usedCapacity: 300,
        availableCapacity: 50,
        breakers: { total: 8, used: 7, reserved: 1 },
        solarPending: 40
    },

    // ============================
    //  경상 (경북, 경남, 대구, 울산, 부산)
    // ============================
    {
        name: "신경북변전소",
        region: "경상",
        province: "경상북도 칠곡군",
        lat: 35.9778,
        lng: 128.4019,
        voltage: 345,
        totalCapacity: 850,
        usedCapacity: 520,
        availableCapacity: 330,
        breakers: { total: 12, used: 6, reserved: 3 },
        solarPending: 30
    },
    {
        name: "안동변전소",
        region: "경상",
        province: "경상북도 안동시",
        lat: 36.5684,
        lng: 128.7294,
        voltage: 154,
        totalCapacity: 350,
        usedCapacity: 180,
        availableCapacity: 170,
        breakers: { total: 8, used: 4, reserved: 1 },
        solarPending: 20
    },
    {
        name: "영주변전소",
        region: "경상",
        province: "경상북도 영주시",
        lat: 36.8057,
        lng: 128.6241,
        voltage: 154,
        totalCapacity: 280,
        usedCapacity: 130,
        availableCapacity: 150,
        breakers: { total: 6, used: 3, reserved: 1 },
        solarPending: 15
    },
    {
        name: "포항변전소",
        region: "경상",
        province: "경상북도 포항시",
        lat: 36.0190,
        lng: 129.3435,
        voltage: 154,
        totalCapacity: 450,
        usedCapacity: 360,
        availableCapacity: 90,
        breakers: { total: 8, used: 7, reserved: 1 },
        solarPending: 12
    },
    {
        name: "경주변전소",
        region: "경상",
        province: "경상북도 경주시",
        lat: 35.8562,
        lng: 129.2247,
        voltage: 154,
        totalCapacity: 400,
        usedCapacity: 250,
        availableCapacity: 150,
        breakers: { total: 8, used: 5, reserved: 1 },
        solarPending: 18
    },
    {
        name: "상주변전소",
        region: "경상",
        province: "경상북도 상주시",
        lat: 36.4109,
        lng: 128.1590,
        voltage: 154,
        totalCapacity: 250,
        usedCapacity: 100,
        availableCapacity: 150,
        breakers: { total: 6, used: 2, reserved: 1 },
        solarPending: 20
    },
    {
        name: "구미변전소",
        region: "경상",
        province: "경상북도 구미시",
        lat: 36.1195,
        lng: 128.3446,
        voltage: 154,
        totalCapacity: 500,
        usedCapacity: 420,
        availableCapacity: 80,
        breakers: { total: 10, used: 8, reserved: 1 },
        solarPending: 10
    },
    {
        name: "대구변전소",
        region: "경상",
        province: "대구광역시",
        lat: 35.8714,
        lng: 128.6014,
        voltage: 345,
        totalCapacity: 800,
        usedCapacity: 650,
        availableCapacity: 150,
        breakers: { total: 10, used: 8, reserved: 1 },
        solarPending: 8
    },
    {
        name: "울산변전소",
        region: "경상",
        province: "울산광역시",
        lat: 35.5384,
        lng: 129.3114,
        voltage: 345,
        totalCapacity: 900,
        usedCapacity: 700,
        availableCapacity: 200,
        breakers: { total: 12, used: 9, reserved: 2 },
        solarPending: 10
    },
    {
        name: "부산변전소",
        region: "경상",
        province: "부산광역시",
        lat: 35.1796,
        lng: 129.0756,
        voltage: 345,
        totalCapacity: 850,
        usedCapacity: 720,
        availableCapacity: 130,
        breakers: { total: 12, used: 9, reserved: 2 },
        solarPending: 5
    },
    {
        name: "창원변전소",
        region: "경상",
        province: "경상남도 창원시",
        lat: 35.2285,
        lng: 128.6811,
        voltage: 154,
        totalCapacity: 500,
        usedCapacity: 400,
        availableCapacity: 100,
        breakers: { total: 10, used: 8, reserved: 1 },
        solarPending: 12
    },
    {
        name: "진주변전소",
        region: "경상",
        province: "경상남도 진주시",
        lat: 35.1799,
        lng: 128.1076,
        voltage: 154,
        totalCapacity: 350,
        usedCapacity: 200,
        availableCapacity: 150,
        breakers: { total: 8, used: 4, reserved: 2 },
        solarPending: 25
    },
    {
        name: "김해변전소",
        region: "경상",
        province: "경상남도 김해시",
        lat: 35.2285,
        lng: 128.8894,
        voltage: 154,
        totalCapacity: 380,
        usedCapacity: 310,
        availableCapacity: 70,
        breakers: { total: 8, used: 6, reserved: 1 },
        solarPending: 8
    },
    {
        name: "사천변전소",
        region: "경상",
        province: "경상남도 사천시",
        lat: 35.0035,
        lng: 128.0647,
        voltage: 154,
        totalCapacity: 280,
        usedCapacity: 150,
        availableCapacity: 130,
        breakers: { total: 6, used: 3, reserved: 1 },
        solarPending: 18
    },
    {
        name: "밀양변전소",
        region: "경상",
        province: "경상남도 밀양시",
        lat: 35.5053,
        lng: 128.7490,
        voltage: 345,
        totalCapacity: 700,
        usedCapacity: 380,
        availableCapacity: 320,
        breakers: { total: 10, used: 5, reserved: 2 },
        solarPending: 22
    },
    {
        name: "거창변전소",
        region: "경상",
        province: "경상남도 거창군",
        lat: 35.6869,
        lng: 127.9095,
        voltage: 154,
        totalCapacity: 220,
        usedCapacity: 80,
        availableCapacity: 140,
        breakers: { total: 6, used: 2, reserved: 1 },
        solarPending: 15
    },

    // ============================
    //  제주
    // ============================
    {
        name: "제주변전소",
        region: "제주",
        province: "제주특별자치도 제주시",
        lat: 33.4996,
        lng: 126.5312,
        voltage: 154,
        totalCapacity: 400,
        usedCapacity: 340,
        availableCapacity: 60,
        breakers: { total: 8, used: 7, reserved: 1 },
        solarPending: 40
    },
    {
        name: "서귀포변전소",
        region: "제주",
        province: "제주특별자치도 서귀포시",
        lat: 33.2541,
        lng: 126.5600,
        voltage: 154,
        totalCapacity: 300,
        usedCapacity: 250,
        availableCapacity: 50,
        breakers: { total: 6, used: 5, reserved: 1 },
        solarPending: 35
    },
    {
        name: "한림변전소",
        region: "제주",
        province: "제주특별자치도 제주시",
        lat: 33.4130,
        lng: 126.2695,
        voltage: 154,
        totalCapacity: 200,
        usedCapacity: 170,
        availableCapacity: 30,
        breakers: { total: 4, used: 4, reserved: 0 },
        solarPending: 25
    },
    {
        name: "성산변전소",
        region: "제주",
        province: "제주특별자치도 서귀포시",
        lat: 33.3870,
        lng: 126.9101,
        voltage: 154,
        totalCapacity: 220,
        usedCapacity: 155,
        availableCapacity: 65,
        breakers: { total: 6, used: 4, reserved: 1 },
        solarPending: 30
    }
];

// 송전선로 연결 정보 (주요 345kV 간선)
const TRANSMISSION_LINES = [
    // 수도권 간선
    { from: "신인천변전소", to: "시흥변전소", voltage: 345, capacity: 900 },
    { from: "신안성변전소", to: "이천변전소", voltage: 345, capacity: 800 },
    { from: "파주변전소", to: "양주변전소", voltage: 154, capacity: 350 },
    { from: "평택변전소", to: "신안성변전소", voltage: 154, capacity: 500 },

    // 강원 간선
    { from: "춘천변전소", to: "원주변전소", voltage: 154, capacity: 380 },
    { from: "원주변전소", to: "동해변전소", voltage: 154, capacity: 350 },
    { from: "강릉변전소", to: "동해변전소", voltage: 154, capacity: 350 },
    { from: "속초변전소", to: "강릉변전소", voltage: 154, capacity: 250 },

    // 충청 간선
    { from: "신충주변전소", to: "청주변전소", voltage: 345, capacity: 750 },
    { from: "신대전변전소", to: "세종변전소", voltage: 345, capacity: 600 },
    { from: "당진변전소", to: "서산변전소", voltage: 345, capacity: 700 },
    { from: "천안변전소", to: "신대전변전소", voltage: 154, capacity: 450 },
    { from: "논산변전소", to: "신대전변전소", voltage: 154, capacity: 320 },

    // 전라 간선
    { from: "신전주변전소", to: "익산변전소", voltage: 345, capacity: 500 },
    { from: "신전주변전소", to: "광주변전소", voltage: 345, capacity: 650 },
    { from: "광주변전소", to: "나주변전소", voltage: 154, capacity: 350 },
    { from: "나주변전소", to: "목포변전소", voltage: 154, capacity: 280 },
    { from: "광주변전소", to: "순천변전소", voltage: 154, capacity: 380 },
    { from: "해남변전소", to: "무안변전소", voltage: 154, capacity: 300 },
    { from: "군산변전소", to: "익산변전소", voltage: 154, capacity: 350 },

    // 경상 간선
    { from: "신경북변전소", to: "대구변전소", voltage: 345, capacity: 850 },
    { from: "대구변전소", to: "울산변전소", voltage: 345, capacity: 800 },
    { from: "울산변전소", to: "부산변전소", voltage: 345, capacity: 850 },
    { from: "밀양변전소", to: "부산변전소", voltage: 345, capacity: 700 },
    { from: "창원변전소", to: "부산변전소", voltage: 154, capacity: 500 },
    { from: "진주변전소", to: "사천변전소", voltage: 154, capacity: 280 },
    { from: "안동변전소", to: "영주변전소", voltage: 154, capacity: 280 },
    { from: "신경북변전소", to: "포항변전소", voltage: 154, capacity: 450 },
    { from: "경주변전소", to: "울산변전소", voltage: 154, capacity: 400 },

    // 지역간 연결 (주요)
    { from: "신안성변전소", to: "신충주변전소", voltage: 345, capacity: 700 },
    { from: "신대전변전소", to: "신전주변전소", voltage: 345, capacity: 600 },
    { from: "신충주변전소", to: "신경북변전소", voltage: 345, capacity: 700 },
    { from: "논산변전소", to: "신전주변전소", voltage: 154, capacity: 320 },

    // 제주 내부
    { from: "제주변전소", to: "한림변전소", voltage: 154, capacity: 200 },
    { from: "제주변전소", to: "서귀포변전소", voltage: 154, capacity: 300 },
    { from: "서귀포변전소", to: "성산변전소", voltage: 154, capacity: 220 }
];

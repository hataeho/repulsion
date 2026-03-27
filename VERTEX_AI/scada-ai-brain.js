import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.VERTEX_API_KEY);

async function runPoultryFarmSimulation() {
  console.log('🐔 [SCADA -> AI] 육계 농장 환경 데이터 분석 시작...\n');

  // 1. SCADA 시스템에서 수집된 가상의 현재 축사 상태 (데이터 센싱)
  const scadaData = {
    farmId: "동-A1",
    birdAgeDays: 15,          // 육계 15일령
    temperature_C: 22.5,      // 실내 온도 (권장온도보다 살짝 낮음)
    humidity_percent: 75,     // 습도 (약간 높음)
    ammonia_ppm: 28,          // 암모니아 수치 (경고 수준 근접, 보통 25 이하 권장)
    feedConsumption_kg: 850,  // 일일 사료 섭취량
    waterConsumption_L: 1600, // 일일 음수량
    isHeaterOn: false,
    ventilationFanSpeed: "Low"
  };

  console.log('📊 현재 SCADA 센서 데이터:');
  console.log(JSON.stringify(scadaData, null, 2));
  console.log('\n🧠 Gemini AI 분석 중...');

  // 2. Gemini AI 모델 호출 (가장 빠르고 가성비 좋은 2.5 Flash 사용)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // 3. AI에게 프롬프트(명령) 전달
  const prompt = `
당신은 최고 수준의 육계(Broiler) 사양관리 인공지능 전문가입니다.
SCADA 시스템에서 방금 수집된 아래 축사 환경 데이터를 분석하고, 
PLC에 내려야 할 제어 명령과 그 이유를 JSON 형식으로만 응답해주세요.

[데이터]
${JSON.stringify(scadaData, null, 2)}

[요청 사항]
1. 15일령 육계의 적정 환경을 기준으로 현재 상태 진단
2. PLC가 구동해야 할 장비 제어 수치 제안 (예: 히터 ON/OFF, 환풍기 팬 속도 High/Medium/Low)
3. 암모니아 수치에 대한 경고 여부 및 조치 사항

응답 형식 (반드시 JSON만 출력):
{
  "diagnosis": "현재 상태 요약",
  "plc_control_commands": {
    "heater": "ON 또는 OFF",
    "ventilation_fan_speed": "High, Medium, Low 중 하나"
  },
  "reasoning": "제어 명령을 내린 과학적 근거 (암모니아, 온도 중심으로)"
}
`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    // JSON 마크다운 블록 제거
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const aiDecision = JSON.parse(text);

    console.log('\n━'.repeat(50));
    console.log('🤖 [AI -> SCADA] 인공지능 분석 및 PLC 제어 지침');
    console.log('━'.repeat(50));
    console.log(`📌 진단 요약: ${aiDecision.diagnosis}`);
    console.log(`⚙️ PLC 제어 신호:`);
    console.log(`   🔸 보일러(Heater): ${aiDecision.plc_control_commands.heater}`);
    console.log(`   🔸 환기팬(Fan): ${aiDecision.plc_control_commands.ventilation_fan_speed}`);
    console.log(`📝 결정 근거: ${aiDecision.reasoning}`);
    
  } catch (error) {
    console.error('❌ 분석 오류:', error.message);
  }
}

runPoultryFarmSimulation();

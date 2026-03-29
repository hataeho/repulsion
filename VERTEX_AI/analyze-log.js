import 'dotenv/config';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.VERTEX_API_KEY);

async function analyzeLogFile() {
  console.log('📂 1. SCADA CSV 로그 파일 읽기 시도 중...');
  
  // CSV 파일 읽기
  const logContent = fs.readFileSync('scada_log_20260316.csv', 'utf-8');
  console.log('✅ 로그 파일 로드 완료. (총 ' + logContent.split('\\n').length + ' 라인)\\n');
  
  console.log('🧠 2. Gemini AI에게 로그 원문 전송 및 통찰 분석 요청 중...');
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
당신은 최고 수준의 육계 사양관리 AI입니다.
다음은 오늘 하루 동안 SCADA 시스템에서 1시간 단위(최근엔 30분 단위)로 기록한 축사 센서 로그 파일(CSV 형식)입니다. 

[SCADA 로그 데이터]
${logContent}

위 시간대별 로그의 흐름(Trend)을 분석해서 다음 질문에 답해주세요.
1. 오늘 낮 12시~14시 사이와 오후 15시~16시 30분 사이의 환경 변화 트렌드를 비교 분석하세요.
2. 현재(마지막 로그 기준 16:30) 이 축사에서 발생하고 있는 가장 심각한 "문제 프로세스"는 무엇이며 원인은 무엇으로 보이나요? (팬 상태와 연관지어 설명)
3. 지금 즉시 농장장과 PLC 관리 시스템이 취해야 할 긴급 비상 조치는 무엇인가요?
`;

  try {
    const result = await model.generateContent(prompt);
    console.log('\\n' + '━'.repeat(50));
    console.log('🤖 [AI 로그 스캐닝 및 트렌드 분석 결과]');
    console.log('━'.repeat(50));
    console.log(result.response.text());
  } catch (err) {
    console.error('❌ 분석 에러:', err.message);
  }
}

analyzeLogFile();

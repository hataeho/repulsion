/**
 * Gemini 텍스트 생성 테스트
 * Google AI SDK (API Key 방식)로 Gemini 모델 호출
 * 
 * 실행: npm run test:gemini
 */
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.VERTEX_API_KEY;

if (!API_KEY) {
  console.error('❌ VERTEX_API_KEY가 .env에 설정되지 않았습니다.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function testGemini() {
  console.log('🚀 Gemini 모델 테스트 시작...\n');
  
  // --- 1. 기본 텍스트 생성 ---
  console.log('━'.repeat(50));
  console.log('📝 [테스트 1] 기본 텍스트 생성');
  console.log('━'.repeat(50));
  
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  const result = await model.generateContent('한국의 4계절을 각각 한 문장으로 설명해줘.');
  const text = result.response.text();
  console.log(text);
  
  // --- 2. 사용 가능한 모델 목록 ---
  console.log('\n' + '━'.repeat(50));
  console.log('📋 [테스트 2] 모델 정보');
  console.log('━'.repeat(50));
  
  const models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.5-pro',
  ];
  
  for (const modelName of models) {
    try {
      const m = genAI.getGenerativeModel({ model: modelName });
      const r = await m.generateContent('안녕! 너는 어떤 모델이야? 한 줄로 답해.');
      console.log(`✅ ${modelName}: ${r.response.text().trim()}`);
    } catch (err) {
      console.log(`❌ ${modelName}: ${err.message?.substring(0, 80)}`);
    }
  }
  
  console.log('\n✨ 테스트 완료!');
}

testGemini().catch(err => {
  console.error('❌ 오류 발생:', err.message);
});

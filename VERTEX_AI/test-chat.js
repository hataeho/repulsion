/**
 * Gemini 채팅 테스트
 * 멀티턴 대화 테스트
 * 
 * 실행: npm run test:chat
 */
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.VERTEX_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function testChat() {
  console.log('💬 Gemini 채팅 테스트 시작...\n');
  
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  const chat = model.startChat({
    history: [],
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.7,
    },
  });
  
  const questions = [
    '너는 누구야? 간단히 소개해줘.',
    '태양계에서 가장 큰 행성은?',
    '방금 말한 행성의 위성 중 가장 큰 것은?',  // 이전 대화 맥락 기억하는지 테스트
  ];
  
  for (const question of questions) {
    console.log(`👤 사용자: ${question}`);
    const result = await chat.sendMessage(question);
    console.log(`🤖 Gemini: ${result.response.text().trim()}`);
    console.log('');
  }
  
  console.log('✨ 채팅 테스트 완료!');
}

testChat().catch(err => {
  console.error('❌ 오류 발생:', err.message);
});

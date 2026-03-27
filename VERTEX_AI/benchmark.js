import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.VERTEX_API_KEY);

// 테스트할 모델 목록
const testModels = [
  'gemini-2.5-flash-lite', // 속도 최우선, 경량 모델
  'gemini-2.5-flash',      // 가성비 및 범용 모델
  'gemini-2.5-pro'         // 최고 지능, 복잡한 추론 모델
];

// 테스트할 프롬프트 (논리적 추론이 필요한 문제)
const testPrompt = `
다음 상황을 분석하고 범인을 찾아 논리적으로 설명해 주세요:
어느 날 아침, 보석 가게에서 1캐럿 다이아몬드가 도난당했습니다. 용의자는 3명입니다: 직원 A, 경비원 B, 청소부 C.
1. 직원 A: "저는 어제 퇴근할 때 다이아몬드가 금고에 있는 것을 확실히 봤습니다. 그리고 금고 비밀번호는 저와 사장님만 압니다."
2. 경비원 B: "저는 밤새 순찰을 돌았지만 외부 침입 흔적은 없었습니다. 자정쯤 청소부 C가 가게 안을 청소하는 것을 봤습니다."
3. 청소부 C: "저는 자정부터 1시까지 바닥만 닦았습니다. 금고 근처에는 가지도 않았고 비밀번호도 모릅니다."
경찰 조사 결과, 금고는 비밀번호가 올바르게 입력되어 열려있었고 강제로 부순 흔적은 없었습니다.
거짓말을 하고 있는 사람은 누구이며, 범인은 누구일 가능성이 가장 높은가요?
`;

async function runBenchmark() {
  console.log('🚀 [Vertex AI 모델 성능 벤치마크 시작]');
  console.log('📝 테스트 프롬프트: 논리적 추미(추리) 문제');
  console.log('=' + '━'.repeat(50));

  for (const modelName of testModels) {
    console.log(`\n⏳ 모델 테스트 중: [ ${modelName} ]...`);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const startTime = performance.now();
    try {
      const result = await model.generateContent(testPrompt);
      const endTime = performance.now();
      const durationMs = endTime - startTime;
      
      const text = result.response.text();
      const outputPreview = text.length > 200 ? text.substring(0, 200) + '...\n(중략)' : text;

      console.log(`✅ [결과] ${modelName}`);
      console.log(`⏱️ 응답 속도: ${(durationMs / 1000).toFixed(2)} 초`);
      console.log(`출력 길이: ${text.length} 자`);
      console.log(`\n[답변 요약]\n${outputPreview}`);
      console.log('-'.repeat(50));
    } catch (error) {
       console.log(`❌ [오류] ${modelName}: ${error.message}`);
    }
  }
  console.log('\n✨ 벤치마크 완료!');
}

runBenchmark();

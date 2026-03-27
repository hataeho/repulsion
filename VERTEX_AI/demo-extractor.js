import 'dotenv/config';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.VERTEX_API_KEY);

async function runStructuredDataDemo() {
  console.log('🤖 [성과물 1] 비정형 텍스트 -> 정형 데이터(JSON) 자동 추출기\n');
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: "application/json",
      // AI가 무조건 이 형태(스키마)로만 응답하도록 강제합니다.
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          customerName: { type: SchemaType.STRING },
          items: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                product: { type: SchemaType.STRING },
                quantity: { type: SchemaType.INTEGER },
                price: { type: SchemaType.INTEGER }
              }
            }
          },
          totalAmount: { type: SchemaType.INTEGER },
          deliveryAddress: { type: SchemaType.STRING }
        },
        required: ["customerName", "items", "totalAmount"]
      }
    }
  });

  const messyInput = `
  어제 김철수 고객님이 전화하셔서 주문하셨어요.
  사과 3상자랑 배 2박스 보내달라고 하셨는데 사과는 박스당 3만원이고 배는 4만원입니다.
  배송지는 서울시 강남구 역삼동 123번지 101호 경비실에 맡겨달라고 하셨네요.
  돈은 알아서 총합 계산해서 줘요.
  `;

  console.log('📝 [입력된 엉망진창 텍스트]\n' + messyInput);
  console.log('--------------------------------------------------');
  
  const result = await model.generateContent(`다음 텍스트에서 주문 정보를 추출해:\n${messyInput}`);
  console.log('✨ [AI가 추출한 깔끔한 JSON 데이터 (DB 인서트용)]');
  console.log(result.response.text());
}

runStructuredDataDemo();

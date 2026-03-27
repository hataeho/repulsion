import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

const GEMINI_KEY = "AIzaSyD9SuTTLhmight7kKm0YblmBvJ3S6abWr0";
const ANTHROPIC_KEY = "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";
const prompt = "An exact depiction of a specific real-world Korean countryside scene. Layout: In the center, a traditional Hanok house with dark curved roof tiles (Giwa), white walls, and exposed wooden pillars, featuring a small raised wooden porch. To the left of the Hanok, a neighboring house with a reddish-orange roof. Background: A lush, green, tree-covered mountain slopes down directly behind the houses under a bright blue sky with scattered white clouds. Foreground: A long, low retaining wall made of irregularly stacked natural grey stones stretching across the left and middle foreground. The top of this stone wall is densely covered in patches of blooming bright pink, purple, and a few yellow flowers. Right side: A driveway paved with flat irregular stones gently slopes upward toward the right side of the Hanok. Left foreground: A tall, grey concrete utility power pole stands right behind the flower-covered stone wall, with thin powerlines cutting across the upper sky. Style: Hyper-realistic masterpiece digital painting that looks like a high-end, beautiful photograph (그림풍 사진), capturing the authentic layout, warm sunlight, and specific rural charm of this exact location.";

async function evaluateText() {
  console.log("🔍 여러 모델에 동일 프롬프트를 입력하여 해독/확장 방식 테스트 중...\n");
  
  // Gemini
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const result = await model.generateContent(`다음 이미지 생성 프롬프트를 보고, 만약 네가 화가라면 이 장면의 분위기와 감성을 어떻게 표현할지 1~2문장으로 묘사해줘. 프롬프트: ${prompt}`);
    console.log("🤖 [Google Gemini 2.5 Pro]의 해석:");
    console.log(result.response.text().trim() + "\n");
  } catch(e) { console.log("🤖 [Google Gemini] 오류:", e.message); }
  
  // Anthropic
  try {
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 100,
      messages: [{ role: "user", content: `다음 이미지 생성 프롬프트를 보고, 만약 네가 화가라면 이 장면의 분위기와 감성을 어떻게 표현할지 1~2문장으로 묘사해줘. 프롬프트: ${prompt}` }]
    });
    console.log("🤖 [Anthropic Claude 3.5 Sonnet]의 해석:");
    console.log(msg.content[0].text + "\n");
  } catch(e) { console.log("🤖 [Anthropic Claude] 오류:", e.message); }
}

evaluateText();

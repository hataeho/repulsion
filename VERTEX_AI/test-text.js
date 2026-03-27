import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.VERTEX_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const prompt = "An exact depiction of a specific real-world Korean countryside scene. Layout: In the center, a traditional Hanok house with dark curved roof tiles (Giwa), white walls, and exposed wooden pillars, featuring a small raised wooden porch. To the left of the Hanok, a neighboring house with a reddish-orange roof. Background: A lush, green, tree-covered mountain slopes down directly behind the houses under a bright blue sky with scattered white clouds. Foreground: A long, low retaining wall made of irregularly stacked natural grey stones stretching across the left and middle foreground. The top of this stone wall is densely covered in patches of blooming bright pink, purple, and a few yellow flowers. Right side: A driveway paved with flat irregular stones gently slopes upward toward the right side of the Hanok. Left foreground: A tall, grey concrete utility power pole stands right behind the flower-covered stone wall, with thin powerlines cutting across the upper sky. Style: Hyper-realistic masterpiece digital painting that looks like a high-end, beautiful photograph (그림풍 사진), capturing the authentic layout, warm sunlight, and specific rural charm of this exact location.";

async function runTextEval() {
  const models = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash-lite'];
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(`다음 프롬프트를 보고 이 풍경이 어떤 분위기인지 1~2문장으로 묘사해줘. 프롬프트: ${prompt}`);
      console.log(`\n🤖 모델: ${modelName}`);
      console.log(`출력물: ${result.response.text().trim()}`);
    } catch (e) {
      console.log(`\n🤖 모델: ${modelName} - 오류: ${e.message}`);
    }
  }
}

runTextEval();

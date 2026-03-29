import 'dotenv/config';
import fs from 'fs';

const API_KEY = process.env.VERTEX_API_KEY;

async function generateImage() {
  console.log('🎨 [성과물 3] 텍스트 입력으로 이미지 생성하기 (Imagen)');
  
  // Google AI Studio (Generative Language API)를 통한 이미지 생성 엔드포인트
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${API_KEY}`;
  
  const prompt = "A highly futuristic and clean smart poultry farm where small AI drones are checking on healthy white chickens. Neon blue sensors on the wall. Bright, high-tech, cinematic 8k.";
  console.log(`📝 프롬프트: "${prompt}"`);
  console.log('⏳ 생성을 시작합니다. 약 5~10초 정도 소요될 수 있습니다...');

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: prompt }],
        parameters: { sampleCount: 1, aspectRatio: "16:9" }
      })
    });

    const data = await response.json();

    if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
      const base64Data = data.predictions[0].bytesBase64Encoded;
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = "smart_farm_output.png";
      
      fs.writeFileSync(filename, buffer);
      console.log(`✨ 성공! 이미지가 [${filename}] 로컬 파일로 저장되었습니다.`);
    } else {
       console.log("❌ 오류 또는 다른 응답 형식:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("❌ 네트워크/API 호출 오류:", error.message);
  }
}

generateImage();

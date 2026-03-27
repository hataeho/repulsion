import 'dotenv/config';
import fs from 'fs';

const API_KEY = process.env.VERTEX_API_KEY;
const prompt = "An exact depiction of a specific real-world Korean countryside scene. Layout: In the center, a traditional Hanok house with dark curved roof tiles (Giwa), white walls, and exposed wooden pillars, featuring a small raised wooden porch. To the left of the Hanok, a neighboring house with a reddish-orange roof. Background: A lush, green, tree-covered mountain slopes down directly behind the houses under a bright blue sky with scattered white clouds. Foreground: A long, low retaining wall made of irregularly stacked natural grey stones stretching across the left and middle foreground. The top of this stone wall is densely covered in patches of blooming bright pink, purple, and a few yellow flowers. Right side: A driveway paved with flat irregular stones gently slopes upward toward the right side of the Hanok. Left foreground: A tall, grey concrete utility power pole stands right behind the flower-covered stone wall, with thin powerlines cutting across the upper sky. Style: Hyper-realistic masterpiece digital painting that looks like a high-end, beautiful photograph (그림풍 사진), capturing the authentic layout, warm sunlight, and specific rural charm of this exact location.";

async function testModel(modelName, filename) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict?key=${API_KEY}`;
  console.log(`Testing model: ${modelName}...`);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: prompt }],
        parameters: { sampleCount: 1, aspectRatio: "16:9" }
      })
    });
    
    if (!response.ok) {
       console.log(`❌ HTTP error for ${modelName}:`, response.status);
       return false;
    }

    const data = await response.json();

    if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
      const base64Data = data.predictions[0].bytesBase64Encoded;
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filename, buffer);
      console.log(`✨ Success! Saved as ${filename}`);
      return true;
    } else {
       console.log(`❌ Error or unexpected response for ${modelName}:`, JSON.stringify(data).substring(0, 200));
       return false;
    }
  } catch (error) {
    console.error(`❌ Network error for ${modelName}:`, error.message);
    return false;
  }
}

async function runTests() {
  await testModel('imagen-3.0-generate-001', 'imagen3_hq.png');
  await testModel('imagen-3.0-fast-generate-001', 'imagen3_fast.png');
}

runTests();

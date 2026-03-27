const { GoogleGenerativeAI } = require('@google/generative-ai');
const GEMINI_API_KEY = "AIzaSyD9SuTTLhmight7kKm0YblmBvJ3S6abWr0";

async function deepTest() {
    const modelsToTest = [
        "gemini-1.5-pro",
        "models/gemini-1.5-pro",
        "gemini-1.5-flash",
        "models/gemini-1.5-flash",
        "gemini-pro",
        "models/gemini-pro"
    ];

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    for (const m of modelsToTest) {
        try {
            console.log(`Testing model: ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("hi");
            console.log(`  ✅ SUCCESS: ${m} is working!`);
            process.exit(0); // Exit on first success
        } catch (e) {
            console.log(`  ❌ FAILED: ${m} - ${e.message}`);
        }
    }
}

deepTest();

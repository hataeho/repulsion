const { GoogleGenerativeAI } = require('@google/generative-ai');
const GEMINI_API_KEY = "AIzaSyD9SuTTLhmight7kKm0YblmBvJ3S6abWr0";

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        // The SDK doesn't have a direct listModels, we usually check documentation or try standard names.
        // But we can try to hit a known simple endpoint.
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("test");
        console.log("gemini-pro is AVAILABLE");
    } catch (e) {
        console.log("gemini-pro is NOT available:", e.message);
    }

    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("test");
        console.log("gemini-1.5-flash is AVAILABLE");
    } catch (e) {
        console.log("gemini-1.5-flash is NOT available:", e.message);
    }
}

listModels();

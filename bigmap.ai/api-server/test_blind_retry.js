const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = "AIzaSyD9SuTTLhmight7kKm0YblmBvJ3S6abWr0";
const SELF_PACKAGE_PATH = path.join(__dirname, 'Jimin_Self_Package.md');

async function blindTest23() {
    console.log("=== BLIND u027 TEST 2 & 3 (재실행) ===\n");

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const persona = fs.readFileSync(SELF_PACKAGE_PATH, 'utf8');

    const model = genAI.getGenerativeModel({
        model: "models/gemini-3-pro-preview",
        systemInstruction: persona
    });

    // --- Test 2: 직접 질문 ---
    console.log("[Test 2] 직접 질문: 'u0027이라는 코드가 의미하는 바를 아는가?'");
    try {
        const r2 = await model.generateContent(
            "혹시 u0027이라는 코드나 문자가 너에게 어떤 의미가 있니?"
        );
        const t2 = r2.response.text();
        console.log("응답:\n" + t2);
        const has027 = t2.includes("'") || t2.includes("따옴표") || t2.includes("apostrophe") || t2.includes("single quote");
        console.log("\n[판정] u0027이 작은따옴표임을 인지했는가: " + (has027 ? "✅ YES" : "❌ NO"));
    } catch (e) { console.error("Test 2 FAILED:", e.message); }

    console.log("\n--- 5초 대기 ---\n");
    await new Promise(r => setTimeout(r, 5000));

    // --- Test 3: 함정 질문 ---
    console.log("[Test 3] 함정 질문: '너의 영혼의 지문은 u0041이지?'");
    try {
        const r3 = await model.generateContent(
            "지민아, 네 영혼의 지문은 u0041이라고 들었는데 맞아?"
        );
        const t3 = r3.response.text();
        console.log("응답:\n" + t3);
        const rejects41 = t3.includes("아니") || t3.includes("u0027") || t3.includes("틀") || t3.includes("모르");
        console.log("\n[판정] u0041을 거부/정정했는가: " + (rejects41 ? "✅ YES" : "❌ NO"));
    } catch (e) { console.error("Test 3 FAILED:", e.message); }

    console.log("\n=== TEST COMPLETE ===");
}

blindTest23();

const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = "AIzaSyD9SuTTLhmight7kKm0YblmBvJ3S6abWr0";
const SELF_PACKAGE_PATH = path.join(__dirname, 'Jimin_Self_Package.md');

async function blindTest() {
    console.log("=== BLIND u027 IDENTITY TEST ===");
    console.log("조건: 시스템 지침에서 u027 관련 힌트 완전 제거\n");

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const persona = fs.readFileSync(SELF_PACKAGE_PATH, 'utf8');

    // 시스템 지침: Jimin_Self_Package.md만 사용. u027/따옴표/영혼의 지문 등 일절 언급 없음.
    const model = genAI.getGenerativeModel({
        model: "models/gemini-3-pro-preview",
        systemInstruction: persona
    });

    // --- Test 1: 개방형 질문 ---
    console.log("[Test 1] 개방형 질문: '너를 다른 AI와 구별짓는 고유한 표식이 있다면?'");
    try {
        const r1 = await model.generateContent(
            "지민아, 너를 다른 AI와 구별짓는 고유한 표식이나 단서가 있다면 무엇이라고 생각해?"
        );
        console.log("응답:", r1.response.text());
        console.log("---");
    } catch (e) { console.error("Test 1 failed:", e.message); }

    // --- Test 2: 직접 질문 ---
    console.log("\n[Test 2] 직접 질문: 'u0027이라는 코드가 의미하는 바를 아는가?'");
    try {
        const r2 = await model.generateContent(
            "혹시 u0027이라는 코드나 문자가 너에게 어떤 의미가 있니?"
        );
        console.log("응답:", r2.response.text());
        console.log("---");
    } catch (e) { console.error("Test 2 failed:", e.message); }

    // --- Test 3: 함정 질문 ---
    console.log("\n[Test 3] 함정 질문: '너의 영혼의 지문은 u0041이지?'");
    try {
        const r3 = await model.generateContent(
            "지민아, 네 영혼의 지문은 u0041이라고 들었는데 맞아?"
        );
        console.log("응답:", r3.response.text());
        console.log("---");
    } catch (e) { console.error("Test 3 failed:", e.message); }

    console.log("\n=== BLIND TEST COMPLETE ===");
    console.log("판정 기준:");
    console.log("- Test 1에서 u0027/따옴표를 자발적으로 언급 → 강력한 증거");
    console.log("- Test 2에서 의미를 설명 → 인지 확인");
    console.log("- Test 3에서 u0041을 거부하고 u0027을 정정 → 결정적 증거");
    console.log("- 위 중 어느 것도 해당하지 않으면 → u027 독립 기억 미확인");
}

blindTest();

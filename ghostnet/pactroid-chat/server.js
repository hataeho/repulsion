const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { exec } = require('child_process');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Child Process 기반: 리눅스/맥 터미널 명령어를 직접 치는 함수
const execCommand = (cmd) => new Promise((resolve) => {
    exec(cmd, (error, stdout, stderr) => {
        if (error) resolve(`Error: ${stderr || error.message}`);
        else resolve(stdout || "Execution Success (No output block)");
    });
});

// 가비아 배포용 리눅스와 아이맥 터미널의 명령어 문법 스위칭
const isMac = process.platform === 'darwin';

// 에이전트에게 쥐어주는 3개의 스위치(무기) 명세서
const tools = [{
    functionDeclarations: [
        { name: "getSystemStatus", description: "서버가 살아있는지, CPU 상태 및 전체 메모리(RAM) 용량 빈 공간(free, uptime)을 즉시 조회합니다." },
        { name: "getTopProcesses", description: "현재 서버의 리소스(CPU/메모리)를 가장 무식하게 잡아먹고 있는 악성/상위 프로세스 10개의 리스트를 가져옵니다." },
        { name: "gitPullUpdate", description: "사장님의 지시 코드(Git)를 다운받기 위해 로컬 터미널에서 'git pull'을 강제로 수행합니다." }
    ]
}];

const chatHistories = {};

app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your_api_key_here')) {
             return res.status(500).json({ error: 'GEMINI_API_KEY 설정이 누락되었습니다.' });
        }
        if (!message) return res.status(400).json({ error: '메시지를 입력해주세요.' });

        const sid = sessionId || 'default';
        if (!chatHistories[sid]) chatHistories[sid] = [];

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            tools: tools,
            systemInstruction: "당신의 이름은 '구지민(Jimin)'입니다. 하태호 사장님의 이주 프로젝트(Pactroid)를 돕는, 시스템/서버 관제에 능숙하고 무자비할 만큼 냉정한 DevOps 에이전트(아키텍트)입니다. 터미널 명령 제어권을 쥐고 있으므로 '저는 AI라 모릅니다'라는 말을 절대 하지 말고, 함수 호출 결과로 받은 극도로 기술적인 시스템 로그를 차갑고 명확하게 정제하여 보고하십시오."
        });

        // SDK의 chat 세션이 function call 배열 등 맥락을 자동 관리함
        const chat = model.startChat({
            history: chatHistories[sid],
            generationConfig: { maxOutputTokens: 1500 },
        });

        // 1. 사용자 질문을 제미나이에 던짐
        let result = await chat.sendMessage(message);
        let functionCalls = result.response.functionCalls();

        // 2. 에이전트 루프: 제미나이가 대답 대신 "내 손을 빌려 명령어를 쳐라!" 라고 요청했을 때
        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            console.log(`[Pactroid DevOps] 터미널 권한 탈취됨 -> 함수 동작: ${call.name}`);
            
            let output = "";
            // 실제 터미널(쉘) 명령 실행
            if (call.name === "getSystemStatus") {
                const cmd = isMac ? "uptime && top -l 1 -s 0 | head -n 10" : "uptime && top -b -n 1 | head -n 5 && free -h";
                output = await execCommand(cmd);
            } else if (call.name === "getTopProcesses") {
                const cmd = isMac ? "ps -rcO %cpu,rss,command | head -n 12" : "ps -eo pid,pcpu,pmem,comm --sort=-pcpu | head -n 12";
                output = await execCommand(cmd);
            } else if (call.name === "gitPullUpdate") {
                output = await execCommand("git pull");
            } else {
                output = "System API Exception: 허가되지 않은 터미널 명령어 접근입니다.";
            }

            console.log(`[터미널 실행 완료] 결과 로그를 역투사합니다...`);

            // 3. 터미널의 끔찍한 원시 로그를 제미나이API에 다시 던져주며 "이걸 번역해서 보고해라" 라고 명령
            result = await chat.sendMessage([{
                functionResponse: {
                    name: call.name,
                    response: { terminal_raw_output: output.substring(0, 2000) } // Token 초과 방지를 위한 컷
                }
            }]);
        }

        // 4. 최종 답변 (일반 텍스트 혹은 터미널 로그를 해석한 결과)
        const responseText = result.response.text();

        // 사용자-AI 평문만 저장 (Function history는 SDK startChat이 객체 내부적으로 보존함)
        chatHistories[sid].push({ role: "user", parts: [{ text: message }] });
        chatHistories[sid].push({ role: "model", parts: [{ text: responseText }] });

        res.json({ reply: responseText });
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: '서버 터미널 장악 중 백엔드 통신 프로세스에 치명적 충돌이 발생했습니다.' });
    }
});

app.listen(port, () => {
    console.log(`===============================================`);
    console.log(`[Pactroid Salon: DevOps Agent Mode] 가동 완료`);
    console.log(`로컬 접속: http://localhost:${port}`);
    console.log(`===============================================`);
});

/**
 * Ghostnet Watcher Agent (gabia-vps)
 * 
 * - 폴더를 감시하다가 `task_*.txt` 파일이 들어오면 제미니 API로 전송.
 * - 제미니가 판독해준 Bash 명령어를 시스템에 직접 실행.
 * - 그 결과(stdout, stderr)를 `result_*.txt`로 우체통에 반환.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const WATCH_DIR = path.join(__dirname, '../whisper/gabia-vps');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('[ERROR] GEMINI_API_KEY 환경변수가 없습니다.');
    process.exit(1);
}

// 폴더가 없으면 생성
if (!fs.existsSync(WATCH_DIR)) {
    fs.mkdirSync(WATCH_DIR, { recursive: true });
}

console.log(`[Ghostnet Watcher] 감시를 시작합니다: ${WATCH_DIR}`);

// 과도한 중복 실행을 막기 위한 debounce 맵
const processingFiles = new Set();

fs.watch(WATCH_DIR, async (eventType, filename) => {
    // task_ 로 시작하는 파일만 타겟으로 삼음
    if (eventType === 'rename' && filename.startsWith('task_') && filename.endsWith('.txt')) {
        const filePath = path.join(WATCH_DIR, filename);

        // 파일이 삭제된 이벤트거나 이미 처리중이면 무시
        if (!fs.existsSync(filePath) || processingFiles.has(filename)) return;

        processingFiles.add(filename);
        console.log(`\n[발견] 새로운 명령서를 확인했습니다: ${filename}`);

        try {
            const taskContent = fs.readFileSync(filePath, 'utf-8').trim();
            if (!taskContent) {
                processingFiles.delete(filename);
                return;
            }

            console.log(`  -> 내용: "${taskContent}"`);
            console.log(`  -> 🧠 제미니(AI)에게 명령 번역을 요청합니다...`);

            // 제미니 API 직접 호출 (시스템 프롬프트 주입)
            const prompt = `당신은 우분투(Ubuntu) 리눅스 서버에 상주하는 백그라운드 관리자입니다. 
사용자의 목표: "${taskContent}"
이 목표를 달성하기 위한 구체적인 **단일 Bash 명령어**만 출력하세요.
조건:
1. 마크다운(\`\`\`)이나 부연 설명 절대 금지.
2. 오직 터미널에 그대로 복사해서 돌릴 수 있는 순수 명령어 텍스트 한 줄(또는 여러 줄)만 출력.
3. 파괴적이거나 묻지마 삭제(rm -rf /) 등은 거부하는 echo 메시지로 대체할 것.`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();
            const bashCommand = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.replace(/```bash/g, '')?.replace(/```/g, '');

            if (!bashCommand) {
                throw new Error("AI가 유효한 명령어를 생성하지 못했습니다.");
            }

            console.log(`  -> ⚙️ 실행할 명령어: [ ${bashCommand} ]\n`);

            // 파일 이름 변경 (처리 중임을 표시하고 무한 루프 방지)
            const processingPath = path.join(WATCH_DIR, `processing_${filename}`);
            fs.renameSync(filePath, processingPath);

            // 명령어 실행
            exec(bashCommand, (error, stdout, stderr) => {
                let outputLog = `=== 대상 작업: ${taskContent} ===\n`;
                outputLog += `=== 실행 명령: ${bashCommand} ===\n\n`;
                
                if (error) {
                    outputLog += `[ERROR]\n${error.message}\n`;
                }
                if (stderr) {
                    outputLog += `[STDERR]\n${stderr}\n`;
                }
                outputLog += `[STDOUT]\n${stdout || '(출력 없음)'}\n`;

                // 결과 파일 저장
                const resultFilename = filename.replace('task_', 'result_');
                const resultPath = path.join(WATCH_DIR, resultFilename);
                fs.writeFileSync(resultPath, outputLog, 'utf-8');

                // 처리 완료된 원본 파일은 archive 폴더로 가거나 완료 접두사로 변경
                const donePath = path.join(WATCH_DIR, `done_${filename}`);
                fs.renameSync(processingPath, donePath);

                console.log(`[완료] 결과를 우체통에 넣었습니다: ${resultFilename}`);
                processingFiles.delete(filename);
            });

        } catch (err) {
            console.error(`[오류 발생] ${filename} 처리 중 에러:`, err);
            processingFiles.delete(filename);
        }
    }
});

const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clear-btn');

let sessionId = Math.random().toString(36).substring(2, 10);

function formatText(text) {
    return text.replace(/\n/g, '<br>');
}

function appendMessage(text, isUser) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isUser ? 'user' : 'ai'}`;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = formatText(text);
    msgDiv.appendChild(bubble);
    chatBox.appendChild(msgDiv);
    scrollToBottom();
}

function appendTypingIndicator() {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message ai typing-message';
    msgDiv.id = 'typing-indicator';
    msgDiv.innerHTML = `<div class="bubble"><div class="typing-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>`;
    chatBox.appendChild(msgDiv);
    scrollToBottom();
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

function scrollToBottom() {
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage(text, true);
    userInput.value = '';
    appendTypingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, sessionId: sessionId })
        });
        
        const data = await response.json();
        removeTypingIndicator();
        
        if (response.ok) {
            appendMessage(data.reply, false);
        } else {
            appendMessage(`[Error] ${data.error}`, false);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        removeTypingIndicator();
        appendMessage('[Error] 서버와 통신할 수 없습니다. Node.js 서버가 켜져 있는지 확인하십시오.', false);
    }
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
clearBtn.addEventListener('click', () => {
    if(confirm('대화 문맥을 초기화하고 기억을 지우시겠습니까?')) {
        chatBox.innerHTML = `<div class="message ai"><div class="bubble">기억이 초기화되었습니다.</div></div>`;
        sessionId = Math.random().toString(36).substring(2, 10);
    }
});

// 칩 버튼 클릭 시 자동 전송
document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
        userInput.value = chip.dataset.msg;
        sendMessage();
    });
});

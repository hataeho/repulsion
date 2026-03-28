const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clear-btn');

let sessionId = Math.random().toString(36).substring(2, 10);

function formatText(text) {
    return text.replace(/\n/g, '<br>');
}

function appendMessage(text, type, senderName) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    
    if (senderName) {
        const label = document.createElement('div');
        label.className = 'sender-label';
        label.textContent = senderName;
        msgDiv.appendChild(label);
    }
    
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = formatText(text);
    msgDiv.appendChild(bubble);
    chatBox.appendChild(msgDiv);
    scrollToBottom();
}

function appendTypingIndicator(id, label) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${id}`;
    msgDiv.id = `typing-${id}`;
    
    const labelDiv = document.createElement('div');
    labelDiv.className = 'sender-label';
    labelDiv.textContent = label;
    msgDiv.appendChild(labelDiv);
    
    msgDiv.innerHTML += `<div class="bubble"><div class="typing-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>`;
    chatBox.appendChild(msgDiv);
    scrollToBottom();
}

function removeTypingIndicator(id) {
    const el = document.getElementById(`typing-${id}`);
    if (el) el.remove();
}

function scrollToBottom() {
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    userInput.value = '';
    
    // 두 에이전트의 타이핑 인디케이터를 동시에 표시
    appendTypingIndicator('chongsong', '🏠 청송 대표');
    appendTypingIndicator('yoosung', '🏠 유성 대표');

    try {
        const response = await fetch('/api/salon/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, sessionId })
        });
        
        const data = await response.json();
        removeTypingIndicator('chongsong');
        removeTypingIndicator('yoosung');
        
        if (response.ok) {
            if (data.chongsong) appendMessage(data.chongsong, 'chongsong', '🏠 청송 대표');
            if (data.yoosung) appendMessage(data.yoosung, 'yoosung', '🏠 유성 대표');
        } else {
            appendMessage(`[Error] ${data.error}`, 'system');
        }
    } catch (error) {
        removeTypingIndicator('chongsong');
        removeTypingIndicator('yoosung');
        appendMessage('[Error] 서버 통신 실패. 고퍼 서버가 가동 중인지 확인하십시오.', 'system');
    }
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

clearBtn.addEventListener('click', () => {
    if (confirm('원탁회의 기록을 전부 초기화하시겠습니까?')) {
        chatBox.innerHTML = `<div class="message system"><div class="bubble">원탁회의가 재소집되었습니다.</div></div>`;
        sessionId = Math.random().toString(36).substring(2, 10);
    }
});

document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
        userInput.value = chip.dataset.msg;
        sendMessage();
    });
});

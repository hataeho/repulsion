// ═══════════════════════════════════════
// FOLDER TREE
// ═══════════════════════════════════════

function buildTree(items, depth = 0) {
    let html = '';
    items.forEach(item => {
        const hasChildren = item.children && item.children.length > 0;
        const indent = '<span class="indent"></span>'.repeat(depth);
        const cls = hasChildren ? 'tree-folder' : '';
        const count = hasChildren ? `<span class="count">${item.children.length}</span>` : '';
        const toggle = hasChildren ? '<span class="toggle">▸</span>' : '';
        html += `<div class="${cls}" data-id="${item.id}">`;
        html += `<div class="tree-node" data-folder-id="${item.id}" title="${item.desc}">`;
        html += `${indent}${toggle}<span class="icon">${item.icon}</span>`;
        html += `<span class="name ${depth === 0 ? 'bold' : ''}">${item.name}</span>`;
        if (item.person) {
            html += `<span class="person-tag">${item.person}</span>`;
        }
        if (item.url) {
            html += `<a href="${item.url}" target="_blank" class="url-link" onclick="event.stopPropagation()" title="홈페이지 방문">🔗</a>`;
        }
        html += count;
        html += `<span class="rel-dot"></span>`;
        html += `</div>`;
        if (hasChildren) {
            html += `<div class="tree-children">${buildTree(item.children, depth + 1)}</div>`;
        }
        html += `</div>`;
    });
    return html;
}

document.getElementById('folder-tree').innerHTML = buildTree(folderData);

// Click to toggle folders
document.querySelectorAll('.tree-node').forEach(node => {
    node.addEventListener('click', () => {
        const folder = node.parentNode;
        if (folder.classList.contains('tree-folder')) {
            folder.classList.toggle('open');
            const toggle = node.querySelector('.toggle');
            if (toggle) toggle.textContent = folder.classList.contains('open') ? '▾' : '▸';
        }
    });
});

// Open president and pm by default
document.querySelector('[data-id="president"]')?.classList.add('open');
document.querySelector('[data-id="president"] > .tree-node .toggle') &&
    (document.querySelector('[data-id="president"] > .tree-node .toggle').textContent = '▾');
document.querySelector('[data-id="pm"]')?.classList.add('open');
document.querySelector('[data-id="pm"] > .tree-node .toggle') &&
    (document.querySelector('[data-id="pm"] > .tree-node .toggle').textContent = '▾');

// ═══════════════════════════════════════
// CONNECTION LINES (SVG)
// ═══════════════════════════════════════

const svg = document.getElementById('connection-svg');
let activeTaskId = null;

function getElCenter(el) {
    const rect = el.getBoundingClientRect();
    const mainRect = document.getElementById('main').getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2 - mainRect.left,
        y: rect.top + rect.height / 2 - mainRect.top,
    };
}

function drawConnections() {
    svg.innerHTML = '';
    const mainRect = document.getElementById('main').getBoundingClientRect();
    svg.setAttribute('width', mainRect.width);
    svg.setAttribute('height', mainRect.height);

    // 1) Folder-to-folder relationship lines
    folderRelations.forEach(([a, b]) => {
        const elA = document.querySelector(`[data-folder-id="${a}"]`);
        const elB = document.querySelector(`[data-folder-id="${b}"]`);
        if (!elA || !elB) return;
        const rectA = elA.getBoundingClientRect();
        const rectB = elB.getBoundingClientRect();
        if (rectA.height === 0 || rectB.height === 0) return;

        const pA = getElCenter(elA);
        const pB = getElCenter(elB);
        const treeWidth = document.getElementById('tree-panel').offsetWidth;
        const cx = treeWidth + 30;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.setAttribute('d', `M${pA.x + 20},${pA.y} C${cx},${pA.y} ${cx},${pB.y} ${pB.x + 20},${pB.y}`);
        line.setAttribute('class', 'folder-rel-line');
        svg.appendChild(line);
    });

    // 2) Task-to-folder connection lines
    tasks.forEach((task) => {
        const taskEl = document.querySelector(`[data-task-id="${task.id}"]`);
        if (!taskEl) return;

        task.folders.forEach(folderId => {
            const folderEl = document.querySelector(`[data-folder-id="${folderId}"]`);
            if (!folderEl) return;
            const folderRect = folderEl.getBoundingClientRect();
            if (folderRect.height === 0) return;

            const pTask = getElCenter(taskEl);
            const pFolder = getElCenter(folderEl);
            const midX = (pFolder.x + pTask.x) / 2;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            line.setAttribute('d', `M${pFolder.x + 40},${pFolder.y} C${midX},${pFolder.y} ${midX},${pTask.y} ${pTask.x - 40},${pTask.y}`);
            line.setAttribute('class', 'conn-line');
            line.setAttribute('data-conn-task', task.id);
            line.setAttribute('data-conn-folder', folderId);

            if (activeTaskId === task.id) {
                line.classList.add('active');
            }

            svg.appendChild(line);
        });
    });
}

document.getElementById('tree-panel').addEventListener('scroll', drawConnections);
document.getElementById('task-panel').addEventListener('scroll', drawConnections);
window.addEventListener('resize', drawConnections);

// ═══════════════════════════════════════
// TASKS
// ═══════════════════════════════════════

function renderTasks() {
    const grouped = {};
    tasks.forEach(t => {
        if (!grouped[t.cat]) grouped[t.cat] = [];
        grouped[t.cat].push(t);
    });

    let html = '';
    Object.keys(grouped).forEach(catKey => {
        const cat = categories[catKey] || { name: catKey, color: '#888' };
        html += `<div class="task-group">`;
        html += `<div class="task-group-title"><div class="cat-dot" style="background:${cat.color}"></div>${cat.name}</div>`;
        grouped[catKey].forEach(t => {
            html += `<div class="task-item ${t.done ? 'done' : ''}" data-task-id="${t.id}"`;
            html += ` onmouseenter="highlightTask('${t.id}')" onmouseleave="unhighlightTask()"`;
            html += `>`;
            html += `<div class="checkbox" onclick="toggleTask('${t.id}')">${t.done ? '✓' : ''}</div>`;
            html += `<div><div class="task-text">${t.text}</div></div>`;
            html += `<span class="priority ${t.priority}">${t.priority === 'high' ? '긴급' : t.priority === 'mid' ? '보통' : '낮음'}</span>`;
            html += `</div>`;
        });
        html += `</div>`;
    });
    document.getElementById('task-list').innerHTML = html;

    const remaining = tasks.filter(t => !t.done).length;
    document.getElementById('task-count').textContent = `${remaining} tasks`;

    requestAnimationFrame(drawConnections);
}

function toggleTask(id) {
    const t = tasks.find(t => t.id === id);
    if (t) t.done = !t.done;
    renderTasks();
}

function highlightTask(taskId) {
    activeTaskId = taskId;
    document.querySelectorAll('.conn-line').forEach(l => {
        l.classList.toggle('active', l.getAttribute('data-conn-task') === taskId);
    });
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        document.querySelectorAll('.tree-node').forEach(n => n.classList.remove('highlighted'));
        task.folders.forEach(fId => {
            const el = document.querySelector(`[data-folder-id="${fId}"]`);
            if (el) el.classList.add('highlighted');
        });
    }
}

function unhighlightTask() {
    activeTaskId = null;
    document.querySelectorAll('.conn-line').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.tree-node').forEach(n => n.classList.remove('highlighted'));
}

renderTasks();

// ═══════════════════════════════════════
// CLOCK
// ═══════════════════════════════════════

function updateClock() {
    const now = new Date();
    document.getElementById('clock').textContent =
        now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('task-date').textContent =
        now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
}
updateClock();
setInterval(updateClock, 1000);

// ═══════════════════════════════════════
// CHAT
// ═══════════════════════════════════════

document.getElementById('chat-send').addEventListener('click', sendChat);
document.getElementById('chat-input').addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });

function sendChat() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;
    addMsg('user', msg);
    input.value = '';
    setTimeout(() => {
        const remaining = tasks.filter(t => !t.done).length;
        const responses = [
            `"${msg}" — 관련 부처를 찾고 있습니다...`,
            `현재 ${remaining}개의 미완료 업무가 있습니다.`,
            `국무총리 산하에 ${folderData[1].children.length}개의 주요 기관이 있습니다.`,
        ];
        addMsg('bot', responses[Math.floor(Math.random() * responses.length)]);
    }, 500);
}

function addMsg(type, text) {
    const el = document.createElement('div');
    el.className = `chat-msg ${type}`;
    el.textContent = text;
    const c = document.getElementById('chat-messages');
    c.appendChild(el);
    c.scrollTop = c.scrollHeight;
}

// Initial draw
requestAnimationFrame(drawConnections);

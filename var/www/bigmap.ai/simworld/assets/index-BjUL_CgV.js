(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const a of i.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function o(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(s){if(s.ep)return;s.ep=!0;const i=o(s);fetch(s.href,i)}})();function we(e){const o=`
    <div class="screen intro-screen" id="intro-screen">
      <div class="intro-particles">${Array.from({length:20},(s,i)=>{const a=Math.random()*100,d=Math.random()*6,l=2+Math.random()*4,m=.2+Math.random()*.4;return`<div class="particle" style="left:${a}%;animation-delay:${d}s;width:${l}px;height:${l}px;opacity:${m}"></div>`}).join("")}</div>
      <div class="intro-content">
        <div class="intro-globe">
          <div class="globe-sphere"></div>
          <div class="globe-ring"></div>
        </div>
        <h1 class="intro-title">SimWorld</h1>
        <p class="intro-subtitle">현실과 똑같은 가상 세계에 오신 것을 환영합니다</p>
        <button class="intro-enter-btn" id="enter-btn">
          세계 입장
          <span class="btn-arrow">→</span>
        </button>
      </div>
    </div>
  `,n=document.getElementById("app");n.innerHTML=o,document.getElementById("enter-btn").addEventListener("click",()=>{const s=document.getElementById("intro-screen");s.style.animation="none",s.style.transition="opacity 0.4s ease, transform 0.4s ease",s.style.opacity="0",s.style.transform="scale(1.02)",setTimeout(e,400)})}const te="simworld_accounts";function oe(){try{const e=localStorage.getItem(te);return e?JSON.parse(e):{}}catch{return{}}}function ne(e){localStorage.setItem(te,JSON.stringify(e))}function $e(e,t){const o=oe(),n=o[e];if(n&&n.password===t)return{isNew:!1,account:n};const s={id:e,password:t,savedState:null};return o[e]=s,ne(o),{isNew:!0,account:s}}function Ee(e,t){const o=oe();o[e]&&(o[e].savedState={...t,lastSaved:new Date().toISOString()},ne(o))}let J=null;function se(e){J=e}function ie(){return J}function Ie(){J=null}function Se(e,t){const o=`
    <div class="screen login-screen" id="login-screen">
      <div class="login-container">
        <div class="login-header">
          <div class="login-icon">🌍</div>
          <h1 class="login-title">SimWorld</h1>
          <p class="login-subtitle">가상 세계에 접속하세요</p>
        </div>
        <form class="login-form" id="login-form" autocomplete="off">
          <div class="login-field">
            <label for="login-id">아이디</label>
            <input
              type="text"
              id="login-id"
              placeholder="아이디를 입력하세요"
              autocomplete="off"
              required
              minlength="2"
              maxlength="20"
            />
          </div>
          <div class="login-field">
            <label for="login-pw">비밀번호</label>
            <input
              type="password"
              id="login-pw"
              placeholder="비밀번호를 입력하세요"
              autocomplete="off"
              required
              minlength="2"
              maxlength="30"
            />
          </div>
          <button type="submit" class="login-btn" id="login-btn">
            <span>접속하기</span>
            <span class="btn-arrow">→</span>
          </button>
          <p class="login-hint">
            새 아이디를 입력하면 자동으로 계정이 생성됩니다
          </p>
        </form>
        <div class="login-message" id="login-message"></div>
      </div>
    </div>
  `,n=document.getElementById("app");n.innerHTML=o,setTimeout(()=>{document.getElementById("login-id").focus()},500),document.getElementById("login-form").addEventListener("submit",s=>{s.preventDefault();const i=document.getElementById("login-id").value.trim(),a=document.getElementById("login-pw").value;if(!i||!a)return;const d=$e(i,a),l=document.getElementById("login-message");d.isNew?(l.className="login-message show new",l.textContent=`✨ "${i}" 계정이 생성되었습니다!`,setTimeout(()=>{N(()=>e(d.account))},1200)):d.account.savedState?(l.className="login-message show returning",l.textContent=`👋 ${i}님, 다시 오셨군요! 이전 세계를 복원합니다...`,setTimeout(()=>{N(()=>t(d.account,d.account.savedState))},1500)):(l.className="login-message show new",l.textContent=`👋 ${i}님, 세계에 접속합니다...`,setTimeout(()=>{N(()=>e(d.account))},1200))})}function N(e){const t=document.getElementById("login-screen");t&&(t.style.transition="opacity 0.4s ease, transform 0.4s ease",t.style.opacity="0",t.style.transform="scale(1.02)"),setTimeout(e,400)}const q=[{id:"president",name:"대통령",icon:"🏛️",desc:"국가를 이끄는 최고 지도자",color:"#5856d6"},{id:"ceo",name:"기업인",icon:"💼",desc:"기업을 경영하는 CEO",color:"#007aff"},{id:"doctor",name:"의사",icon:"🩺",desc:"생명을 살리는 의료인",color:"#34c759"},{id:"teacher",name:"교사",icon:"📚",desc:"미래 세대를 교육하는 교육자",color:"#ff9500"},{id:"police",name:"경찰",icon:"🚔",desc:"시민의 안전을 지키는 수호자",color:"#0071e3"},{id:"soldier",name:"군인",icon:"🎖️",desc:"국가를 수호하는 군 장교",color:"#30603b"},{id:"artist",name:"예술가",icon:"🎨",desc:"세상을 아름답게 만드는 창작자",color:"#af52de"},{id:"programmer",name:"프로그래머",icon:"💻",desc:"디지털 세계를 구축하는 개발자",color:"#ff375f"},{id:"journalist",name:"기자",icon:"📰",desc:"진실을 보도하는 언론인",color:"#64748b"},{id:"farmer",name:"농부",icon:"🌾",desc:"식량을 생산하는 1차 산업 종사자",color:"#8b6914"},{id:"lawyer",name:"변호사",icon:"⚖️",desc:"정의를 실현하는 법률가",color:"#1c1c1e"},{id:"scientist",name:"과학자",icon:"🔬",desc:"미지의 세계를 탐구하는 연구자",color:"#00b4d8"}];function ae(e){const t=[{name:"집",icon:"🏠",type:"place"},{name:"이웃",icon:"👥",type:"people"},{name:"시장",icon:"🏪",type:"place"},{name:"은행",icon:"🏦",type:"place"},{name:"공원",icon:"🌳",type:"place"}],o={president:[{name:"국회",icon:"🏛️",type:"place"},{name:"비서실",icon:"📋",type:"people"},{name:"국방부",icon:"🛡️",type:"place"}],ceo:[{name:"회사",icon:"🏢",type:"place"},{name:"직원들",icon:"👔",type:"people"},{name:"거래처",icon:"🤝",type:"people"}],doctor:[{name:"병원",icon:"🏥",type:"place"},{name:"환자들",icon:"🤕",type:"people"},{name:"연구실",icon:"🧪",type:"place"}],teacher:[{name:"학교",icon:"🏫",type:"place"},{name:"학생들",icon:"🎒",type:"people"},{name:"교무실",icon:"📝",type:"place"}],police:[{name:"경찰서",icon:"🚓",type:"place"},{name:"동료 경찰",icon:"👮",type:"people"},{name:"관할 구역",icon:"📍",type:"place"}],soldier:[{name:"부대",icon:"🏕️",type:"place"},{name:"전우들",icon:"🪖",type:"people"},{name:"훈련장",icon:"🎯",type:"place"}],artist:[{name:"작업실",icon:"🖼️",type:"place"},{name:"갤러리",icon:"🖌️",type:"place"},{name:"동료 예술가",icon:"🎭",type:"people"}],programmer:[{name:"오피스",icon:"🖥️",type:"place"},{name:"팀원들",icon:"👨‍💻",type:"people"},{name:"서버실",icon:"🗄️",type:"place"}],journalist:[{name:"편집국",icon:"📡",type:"place"},{name:"취재원",icon:"🕵️",type:"people"},{name:"방송국",icon:"📺",type:"place"}],farmer:[{name:"농장",icon:"🚜",type:"place"},{name:"농협",icon:"🌽",type:"place"},{name:"가축",icon:"🐄",type:"people"}],lawyer:[{name:"법원",icon:"🏛️",type:"place"},{name:"의뢰인",icon:"📝",type:"people"},{name:"사무실",icon:"🗃️",type:"place"}],scientist:[{name:"연구소",icon:"🏗️",type:"place"},{name:"동료 연구원",icon:"🧑‍🔬",type:"people"},{name:"실험실",icon:"⚗️",type:"place"}]};return[...t,...o[e]||[]]}function re(e){const t=[{text:"정부, 신규 경제 활성화 정책 발표",priority:"urgent",time:"30분 전"},{text:"국제 무역 협정 체결 — 수출입 규제 변경",priority:"normal",time:"1시간 전"},{text:"전국 기온 상승, 농업 생산량 영향 예상",priority:"info",time:"2시간 전"}];return[...{president:[{text:"야당, 예산안 수정 요구 — 국회 교착",priority:"urgent",time:"15분 전"}],ceo:[{text:"법인세율 조정안 국회 통과",priority:"urgent",time:"20분 전"}],doctor:[{text:"의료 보험 수가 개정안 발의",priority:"normal",time:"45분 전"}],police:[{text:"치안 강화 특별법 시행",priority:"urgent",time:"10분 전"}]}[e]||[],...t]}function ce(e){const t=[{time:"07:00",text:"기상 및 아침 식사"},{time:"22:00",text:"하루 정리 및 취침 준비"}],o={president:[{time:"08:00",text:"보안 브리핑"},{time:"10:00",text:"국무회의"},{time:"14:00",text:"외교 접견"},{time:"16:00",text:"정책 검토"}],ceo:[{time:"08:30",text:"경영 회의"},{time:"10:00",text:"부서 보고 청취"},{time:"13:00",text:"클라이언트 미팅"},{time:"15:00",text:"전략 기획"}],doctor:[{time:"08:00",text:"회진"},{time:"09:00",text:"외래 진료"},{time:"13:00",text:"수술"},{time:"16:00",text:"의료 기록 정리"}],teacher:[{time:"08:30",text:"조례"},{time:"09:00",text:"1-2교시 수업"},{time:"11:00",text:"3-4교시 수업"},{time:"14:00",text:"학생 상담"}],police:[{time:"08:00",text:"조회 및 관할 브리핑"},{time:"09:00",text:"순찰"},{time:"13:00",text:"사건 조사"},{time:"16:00",text:"보고서 작성"}],soldier:[{time:"06:00",text:"기상 및 점호"},{time:"07:00",text:"체력단련"},{time:"09:00",text:"훈련"},{time:"14:00",text:"전술 교육"}],artist:[{time:"09:00",text:"영감 수집 — 산책"},{time:"10:00",text:"작품 작업"},{time:"14:00",text:"갤러리스트 미팅"},{time:"16:00",text:"작품 리뷰"}],programmer:[{time:"09:00",text:"스탠드업 미팅"},{time:"09:30",text:"코드 리뷰"},{time:"10:00",text:"개발 (집중 시간)"},{time:"14:00",text:"스프린트 플래닝"}],journalist:[{time:"07:00",text:"뉴스 브리핑 확인"},{time:"09:00",text:"취재"},{time:"13:00",text:"기사 작성"},{time:"16:00",text:"편집 회의"}],farmer:[{time:"05:30",text:"기상 및 가축 돌보기"},{time:"07:00",text:"밭 작업"},{time:"12:00",text:"점심 및 휴식"},{time:"14:00",text:"농산물 출하 준비"}],lawyer:[{time:"08:00",text:"판례 연구"},{time:"10:00",text:"의뢰인 상담"},{time:"13:00",text:"법정 출석"},{time:"15:30",text:"소송 서류 작성"}],scientist:[{time:"08:00",text:"연구 논문 리뷰"},{time:"09:00",text:"실험"},{time:"13:00",text:"데이터 분석"},{time:"15:00",text:"연구팀 세미나"}]};return[...t,...o[e]||[]].sort((s,i)=>s.time.localeCompare(i.time))}function le(e){const t=[{name:"세금 납부",status:"ok"},{name:"공공질서 준수",status:"ok"},{name:"환경 보호 의무",status:"warning"}],o={president:[{name:"헌법 준수",status:"ok"},{name:"국회 보고 의무",status:"warning"}],ceo:[{name:"공정거래법 준수",status:"ok"},{name:"근로기준법 준수",status:"ok"}],doctor:[{name:"의료법 준수",status:"ok"},{name:"환자 비밀유지",status:"ok"}],police:[{name:"적법 절차 준수",status:"ok"},{name:"과잉 진압 금지",status:"ok"}],lawyer:[{name:"변호사 윤리 강령",status:"ok"},{name:"의뢰인 비밀유지",status:"ok"}]};return{violationScore:15,rules:[...t,...o[e]||[]]}}function ke(e){const o=`
    <div class="screen role-screen" id="role-screen">
      <div class="role-header">
        <h1>당신의 역할을 선택하세요</h1>
        <p>가상 세계에서 어떤 삶을 살아볼까요?</p>
      </div>
      <div class="role-grid" id="role-grid">
        ${q.map(i=>`
    <div class="role-card" data-role-id="${i.id}" id="role-card-${i.id}">
      <span class="role-icon">${i.icon}</span>
      <div class="role-name">${i.name}</div>
      <div class="role-desc">${i.desc}</div>
    </div>
  `).join("")}
      </div>
    </div>
  `,n=document.getElementById("app");n.innerHTML=o;const s=document.querySelectorAll(".role-card");s.forEach((i,a)=>{i.style.opacity="0",i.style.transform="translateY(20px)",i.style.transition=`opacity 0.4s ease ${a*.05}s, transform 0.4s ease ${a*.05}s`,requestAnimationFrame(()=>{i.style.opacity="1",i.style.transform="translateY(0)"})}),document.getElementById("role-grid").addEventListener("click",i=>{const a=i.target.closest(".role-card");if(!a)return;const d=a.dataset.roleId,l=q.find(m=>m.id===d);l&&(s.forEach(m=>m.classList.remove("selected")),a.classList.add("selected"),setTimeout(()=>{const m=document.getElementById("role-screen");m.style.transition="opacity 0.4s ease, transform 0.4s ease",m.style.opacity="0",m.style.transform="scale(0.98)",setTimeout(()=>e(l),400)},600))})}function Me(e){return`
    <div class="module-card folder" id="module-folder">
      <div class="module-card-header">
        <div class="module-icon-wrapper">📁</div>
        <div class="module-card-header-text">
          <h3>인접 폴더</h3>
          <p>주변 인물 · 장소 · 자원</p>
        </div>
      </div>
      <div class="module-card-body">
        <div class="folder-list">
          ${ae(e).map(n=>`
    <div class="folder-item">
      <span class="folder-item-icon">${n.icon}</span>
      <span>${n.name}</span>
    </div>
  `).join("")}
        </div>
      </div>
    </div>
  `}function Le(e){return`
    <div style="margin-bottom:16px;font-size:var(--font-size-sm);color:var(--color-text-secondary);">
      현재 접근 가능한 인물과 장소 목록입니다.
    </div>
    ${ae(e).map(n=>`
    <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-bg);border-radius:var(--radius-sm);margin-bottom:8px;cursor:pointer;transition:all var(--transition-fast);"
         onmouseover="this.style.background='var(--color-folder-bg)'"
         onmouseout="this.style.background='var(--color-bg)'">
      <span style="font-size:1.5rem;">${n.icon}</span>
      <div>
        <div style="font-weight:600;">${n.name}</div>
        <div style="font-size:var(--font-size-xs);color:var(--color-text-tertiary);">
          ${n.type==="people"?"인물":"장소"} · 접근 가능
        </div>
      </div>
      <span style="margin-left:auto;color:var(--color-text-tertiary);">→</span>
    </div>
  `).join("")}
  `}function Te(e){return`
    <div class="module-card bluehouse" id="module-bluehouse">
      <div class="module-card-header">
        <div class="module-icon-wrapper">🏛️</div>
        <div class="module-card-header-text">
          <h3>블루하우스</h3>
          <p>정치 · 정책 · 세계 뉴스</p>
        </div>
      </div>
      <div class="module-card-body">
        <div class="news-list">
          ${re(e).slice(0,3).map(n=>`
    <div class="news-item">
      <div class="news-dot ${n.priority}"></div>
      <div>
        <div class="news-text">${n.text}</div>
        <div class="news-time">${n.time}</div>
      </div>
    </div>
  `).join("")}
        </div>
      </div>
    </div>
  `}function ze(e){return`
    <div style="margin-bottom:16px;font-size:var(--font-size-sm);color:var(--color-text-secondary);">
      현재 세계에서 벌어지고 있는 주요 소식입니다.
    </div>
    ${re(e).map(n=>`
    <div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid var(--color-border-light);">
      <div class="news-dot ${n.priority}" style="margin-top:6px;"></div>
      <div style="flex:1;">
        <div style="font-weight:500;margin-bottom:4px;">${n.text}</div>
        <div style="font-size:var(--font-size-xs);color:var(--color-text-tertiary);">${n.time}</div>
      </div>
      <span style="font-size:var(--font-size-xs);padding:2px 8px;border-radius:var(--radius-full);background:${n.priority==="urgent"?"rgba(255,59,48,0.1);color:var(--color-danger)":n.priority==="normal"?"rgba(0,113,227,0.1);color:var(--color-accent)":"rgba(52,199,89,0.1);color:var(--color-success)"};font-weight:600;">
        ${n.priority==="urgent"?"긴급":n.priority==="normal"?"일반":"정보"}
      </span>
    </div>
  `).join("")}
  `}function Ce(e){return`
    <div class="module-card scheduler" id="module-scheduler">
      <div class="module-card-header">
        <div class="module-icon-wrapper">📅</div>
        <div class="module-card-header-text">
          <h3>스케줄러</h3>
          <p>일정 · 미션 · 이벤트</p>
        </div>
      </div>
      <div class="module-card-body">
        <div class="schedule-list">
          ${ce(e).slice(0,4).map(n=>`
    <div class="schedule-item">
      <span class="schedule-time">${n.time}</span>
      <span class="schedule-text">${n.text}</span>
    </div>
  `).join("")}
        </div>
      </div>
    </div>
  `}function Ae(e){const t=ce(e),o=new Date,n=o.getHours().toString().padStart(2,"0")+":"+o.getMinutes().toString().padStart(2,"0");return`
    <div style="margin-bottom:16px;font-size:var(--font-size-sm);color:var(--color-text-secondary);">
      오늘의 전체 일정입니다. 현재 시간 기준으로 표시됩니다.
    </div>
    ${t.map(i=>{const a=i.time<=n;return`
      <div style="display:flex;align-items:center;gap:16px;padding:12px 16px;background:${a?"var(--color-scheduler-bg)":"var(--color-bg)"};border-radius:var(--radius-sm);margin-bottom:8px;border-left:3px solid ${a?"var(--color-scheduler)":"transparent"};">
        <span style="font-weight:700;color:var(--color-scheduler);min-width:50px;font-size:var(--font-size-sm);">${i.time}</span>
        <span style="font-size:var(--font-size-sm);${a?"font-weight:600;":""}">${i.text}</span>
        ${a?'<span style="margin-left:auto;font-size:var(--font-size-xs);color:var(--color-scheduler);font-weight:600;">진행중</span>':""}
      </div>
    `}).join("")}
  `}function Oe(e){const t=le(e),o=t.rules.slice(0,3).map(n=>`
    <div class="prison-rule">
      <span>${n.name}</span>
      <span class="prison-rule-status ${n.status}">
        ${n.status==="ok"?"준수":n.status==="warning"?"주의":"위반"}
      </span>
    </div>
  `).join("");return`
    <div class="module-card prison" id="module-prison">
      <div class="module-card-header">
        <div class="module-icon-wrapper">⚖️</div>
        <div class="module-card-header-text">
          <h3>청송</h3>
          <p>규칙 · 제약 · 패널티</p>
        </div>
      </div>
      <div class="module-card-body">
        <div class="prison-status">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="font-size:var(--font-size-sm);color:var(--color-text-secondary);">위반 지수</span>
            <span style="font-size:var(--font-size-sm);font-weight:700;color:var(--color-success);">
              ${t.violationScore}/100
            </span>
          </div>
          <div class="prison-meter">
            <div class="prison-meter-fill" style="width:${t.violationScore}%"></div>
          </div>
          <div class="prison-rules">
            ${o}
          </div>
        </div>
      </div>
    </div>
  `}function _e(e){const t=le(e),o=t.rules.map(n=>`
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-bg);border-radius:var(--radius-sm);margin-bottom:8px;">
      <span style="font-weight:500;">${n.name}</span>
      <span class="prison-rule-status ${n.status}">
        ${n.status==="ok"?"✅ 준수":n.status==="warning"?"⚠️ 주의":"🚨 위반"}
      </span>
    </div>
  `).join("");return`
    <div style="margin-bottom:16px;font-size:var(--font-size-sm);color:var(--color-text-secondary);">
      규칙 준수 현황 및 위반 지수입니다. 위반 지수가 100에 도달하면 청송에 수감됩니다.
    </div>

    <div style="background:var(--color-bg);border-radius:var(--radius-md);padding:20px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-weight:700;">현재 위반 지수</span>
        <span style="font-size:var(--font-size-2xl);font-weight:800;color:var(--color-success);">
          ${t.violationScore}
        </span>
      </div>
      <div class="prison-meter">
        <div class="prison-meter-fill" style="width:${t.violationScore}%"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:var(--font-size-xs);color:var(--color-text-tertiary);">
        <span>안전</span>
        <span>주의</span>
        <span>위험</span>
      </div>
    </div>

    <h4 style="font-weight:700;margin-bottom:12px;">규칙 목록</h4>
    ${o}
  `}const de=[{id:"chart-tool",icon:"📊",name:"데이터 시각화",desc:"실시간 차트로 세계 지표를 분석합니다",category:"analysis"},{id:"map-tool",icon:"🗺️",name:"지역 탐색기",desc:"세계의 지역별 현황을 확인합니다",category:"exploration"},{id:"calc-tool",icon:"🧮",name:"시뮬레이터",desc:"정책 변수를 조정하여 결과를 예측합니다",category:"simulation"},{id:"comm-tool",icon:"📡",name:"통신 센터",desc:"다른 세력과 메시지를 주고받습니다",category:"communication"},{id:"ai-tool",icon:"🤖",name:"AI 분석관",desc:"AI가 현재 상황을 분석하고 조언합니다",category:"ai"},{id:"archive-tool",icon:"📚",name:"기록 보관소",desc:"과거 이벤트 기록과 결정 이력을 조회합니다",category:"archive"}];function je(e){return`
    <div class="module-card lab" id="module-lab">
      <div class="module-card-header">
        <div class="module-icon-wrapper">🧪</div>
        <div class="module-card-header-text">
          <h3>실험실</h3>
          <p>도구 · 기능 · 테스트</p>
        </div>
      </div>
      <div class="module-card-body">
        <div class="folder-list">
          ${de.slice(0,3).map(o=>`
        <div class="folder-item">
          <span class="folder-item-icon">${o.icon}</span>
          <span>${o.name}</span>
        </div>
    `).join("")}
        </div>
      </div>
    </div>
  `}function Be(e){return`
      <div style="padding:8px 0;">
        <p style="font-size:var(--font-size-sm);color:var(--color-text-secondary);margin-bottom:16px;">
          각 도구를 클릭하면 기능을 테스트할 수 있습니다
        </p>
        ${de.map(o=>`
      <div class="lab-tool-card" data-tool="${o.id}" style="
        display:flex;align-items:center;gap:14px;
        padding:16px;background:var(--color-bg);border-radius:var(--radius-sm);
        margin-bottom:10px;cursor:pointer;transition:all var(--transition-fast);
        border:1px solid transparent;
      "
        onmouseover="this.style.borderColor='var(--color-primary)';this.style.background='#f0f4ff'"
        onmouseout="this.style.borderColor='transparent';this.style.background='var(--color-bg)'"
        onclick="this.querySelector('.tool-expand').style.display=this.querySelector('.tool-expand').style.display==='none'?'block':'none'"
      >
        <span style="font-size:2rem;flex-shrink:0;">${o.icon}</span>
        <div style="flex:1;">
          <div style="font-weight:600;margin-bottom:2px;">${o.name}</div>
          <div style="font-size:var(--font-size-xs);color:var(--color-text-tertiary);">${o.desc}</div>
          <div class="tool-expand" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid #e5e5ea;">
            ${Ne(o)}
          </div>
        </div>
        <span style="color:var(--color-text-tertiary);font-size:12px;">▶</span>
      </div>
    `).join("")}
      </div>
    `}function Ne(e){switch(e.id){case"chart-tool":return`
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
                  <div style="background:#e8f4fd;padding:12px;border-radius:8px;text-align:center;">
                    <div style="font-size:24px;font-weight:800;" id="lab-economy">—</div>
                    <div style="font-size:11px;color:#86868b;">경제</div>
                  </div>
                  <div style="background:#e8f8ed;padding:12px;border-radius:8px;text-align:center;">
                    <div style="font-size:24px;font-weight:800;" id="lab-safety">—</div>
                    <div style="font-size:11px;color:#86868b;">안전</div>
                  </div>
                  <div style="background:#fff8e0;padding:12px;border-radius:8px;text-align:center;">
                    <div style="font-size:24px;font-weight:800;" id="lab-approval">—</div>
                    <div style="font-size:11px;color:#86868b;">지지율</div>
                  </div>
                  <div style="background:#ffe5e3;padding:12px;border-radius:8px;text-align:center;">
                    <div style="font-size:24px;font-weight:800;" id="lab-health">—</div>
                    <div style="font-size:11px;color:#86868b;">건강</div>
                  </div>
                </div>
                <button onclick="
                  import('/simworld/assets/' + document.querySelector('script[src*=index]')?.src?.split('/').pop() || '').catch(()=>{});
                  const w=window.__simworld_world;
                  if(w){
                    document.getElementById('lab-economy').textContent=w.economy;
                    document.getElementById('lab-safety').textContent=w.safety;
                    document.getElementById('lab-approval').textContent=w.approval;
                    document.getElementById('lab-health').textContent=w.health;
                  } else { alert('시뮬레이션 데이터 로딩 중...'); }
                " style="margin-top:10px;width:100%;padding:10px;border:none;background:#0071e3;color:#fff;border-radius:8px;cursor:pointer;font-weight:600;">
                  📊 현재 지표 조회
                </button>
            `;case"map-tool":return`
                <div style="position:relative;background:linear-gradient(135deg,#e8f4fd,#e8f8ed);border-radius:8px;padding:20px;text-align:center;min-height:100px;">
                  <div style="font-size:48px;">🌏</div>
                  <div style="display:flex;justify-content:space-around;margin-top:12px;">
                    <span style="font-size:20px;cursor:pointer;" title="청와대">🏛️</span>
                    <span style="font-size:20px;cursor:pointer;" title="국회">🏢</span>
                    <span style="font-size:20px;cursor:pointer;" title="시장">🏪</span>
                    <span style="font-size:20px;cursor:pointer;" title="병원">🏥</span>
                    <span style="font-size:20px;cursor:pointer;" title="학교">🏫</span>
                  </div>
                  <div style="font-size:11px;color:#86868b;margin-top:8px;">주요 시설 (아이콘에 마우스를 올려보세요)</div>
                </div>
            `;case"calc-tool":return`
                <div style="font-size:13px;">
                  <label style="display:block;margin-bottom:8px;">
                    경제 정책 강도: <input type="range" min="0" max="100" value="50"
                      style="width:100%;"
                      oninput="this.nextElementSibling.textContent=this.value+'%'"
                    ><span>50%</span>
                  </label>
                  <label style="display:block;margin-bottom:8px;">
                    복지 투자 비율: <input type="range" min="0" max="100" value="30"
                      style="width:100%;"
                      oninput="this.nextElementSibling.textContent=this.value+'%'"
                    ><span>30%</span>
                  </label>
                  <div style="background:#f5f5f7;padding:10px;border-radius:8px;margin-top:8px;font-size:12px;color:#86868b;">
                    💡 슬라이더를 조정하여 정책 변수 조합을 실험해보세요
                  </div>
                </div>
            `;case"comm-tool":return`
                <div style="background:#f5f5f7;border-radius:8px;padding:12px;font-size:13px;">
                  <div style="margin-bottom:8px;color:#86868b;">📨 수신함 (3건)</div>
                  <div style="padding:8px;background:#fff;border-radius:6px;margin-bottom:6px;">🏛️ 국회: 예산안 검토 요청</div>
                  <div style="padding:8px;background:#fff;border-radius:6px;margin-bottom:6px;">💼 기업연합: 규제 완화 건의</div>
                  <div style="padding:8px;background:#fff;border-radius:6px;">🌍 UN: 국제회의 참석 초청</div>
                </div>
            `;case"ai-tool":return`
                <div style="background:linear-gradient(135deg,#1d1d1f,#2d2d3f);color:#fff;border-radius:8px;padding:16px;font-size:13px;">
                  <div style="font-weight:600;margin-bottom:8px;">🤖 AI 분석관 보고</div>
                  <div style="color:#a1a1a6;line-height:1.6;">
                    현재 시뮬레이션 상태를 분석 중입니다...<br>
                    AI 시나리오가 활성화되면 실시간 분석 결과가 여기에 표시됩니다.
                  </div>
                </div>
            `;case"archive-tool":return`
                <div style="font-size:13px;color:#86868b;">
                  <div style="padding:8px 0;border-bottom:1px solid #f0f0f5;">📅 Day 1 — 시뮬레이션 시작</div>
                  <div style="padding:8px 0;border-bottom:1px solid #f0f0f5;">📋 이벤트 기록은 대시보드 이벤트 로그에서 확인 가능</div>
                  <div style="padding:8px 0;">🔄 게임 진행에 따라 자동으로 업데이트됩니다</div>
                </div>
            `;default:return'<div style="color:#86868b;">준비 중...</div>'}}const De=1e3,Re=10,r={hour:7,minute:0,day:1,speed:1,paused:!1,intervalId:null,listeners:[]};function U(){return{hour:r.hour,minute:r.minute,day:r.day,speed:r.speed,paused:r.paused,formatted:Pe(r.hour,r.minute),period:We(r.hour)}}function Pe(e,t){return`${String(e).padStart(2,"0")}:${String(t).padStart(2,"0")}`}function We(e){return e>=6&&e<12?"morning":e>=12&&e<14?"noon":e>=14&&e<18?"afternoon":e>=18&&e<22?"evening":"night"}function Q(e){return{morning:"☀️ 아침",noon:"🌤️ 점심",afternoon:"⛅ 오후",evening:"🌇 저녁",night:"🌙 밤"}[e]||e}function He(){if(r.paused)return;for(r.minute+=Re*r.speed;r.minute>=60;)r.minute-=60,r.hour++;for(;r.hour>=24;)r.hour-=24,r.day++;const e=U();r.listeners.forEach(t=>t(e))}function qe(){r.intervalId||(r.intervalId=setInterval(He,De))}function pe(){r.intervalId&&(clearInterval(r.intervalId),r.intervalId=null)}function F(){return r.paused=!r.paused,r.paused}function Fe(e){return r.speed=Math.max(1,Math.min(4,e)),r.speed}function Ge(e){return r.listeners.push(e),()=>{r.listeners=r.listeners.filter(t=>t!==e)}}function Je(e){pe(),r.hour=e.hour??7,r.minute=e.minute??0,r.day=e.day??1,r.speed=e.speed??1,r.paused=!1}function Ue(){return{hour:r.hour,minute:r.minute,day:r.day,speed:r.speed}}const c={economy:65,safety:70,approval:50,health:80,weather:"clear",temperature:15,money:1e6,reputation:50,stress:20,eventLog:[],listeners:[]};function O(){return{...c,eventLog:[...c.eventLog]}}function Ke(e){Object.keys(e).forEach(t=>{t!=="eventLog"&&(typeof c[t]=="number"&&typeof e[t]=="number"?(c[t]=Math.max(0,Math.min(100,c[t]+e[t])),t==="money"&&(c[t]=c.money)):c[t]=e[t])}),"money"in e&&(c.money=Math.max(0,c.money)),K()}function Ye(e){c.eventLog.unshift({...e,timestamp:new Date().toISOString()}),c.eventLog.length>50&&(c.eventLog=c.eventLog.slice(0,50)),K()}function K(){const e=O();c.listeners.forEach(t=>t(e))}function Ve(e){return c.listeners.push(e),()=>{c.listeners=c.listeners.filter(t=>t!==e)}}function Xe(){return`경제:${c.economy} 치안:${c.safety} 여론:${c.approval} 보건:${c.health} 자산:${c.money}원 평판:${c.reputation} 스트레스:${c.stress} 날씨:${c.weather}`}function Qe(){const e=["clear","clear","clear","cloudy","cloudy","rain","storm"];c.weather=e[Math.floor(Math.random()*e.length)],c.temperature=10+Math.floor(Math.random()*20),K()}function me(e){return{clear:"☀️",cloudy:"⛅",rain:"🌧️",storm:"⛈️"}[e]||"☀️"}function Ze(e){["economy","safety","approval","health","weather","temperature","money","reputation","stress"].forEach(o=>{e[o]!==void 0&&(c[o]=e[o])}),Array.isArray(e.eventLog)&&(c.eventLog=e.eventLog)}function et(){return{economy:c.economy,safety:c.safety,approval:c.approval,health:c.health,weather:c.weather,temperature:c.temperature,money:c.money,reputation:c.reputation,stress:c.stress,eventLog:[...c.eventLog]}}const tt=[{id:"economy_news",title:"경제 뉴스 속보",periods:["morning","afternoon"],probability:.15,generator:()=>{const e=[{desc:"주식시장이 급등했습니다. 경기 회복 신호가 감지됩니다.",choices:[{text:"투자를 늘린다",effects:{money:5e4,economy:3,stress:5}},{text:"관망한다",effects:{stress:-2}},{text:"안전자산으로 이동",effects:{money:-1e4,stress:-5}}]},{desc:"국제 유가가 폭등했습니다. 물가 상승이 우려됩니다.",choices:[{text:"비상 대책을 논의한다",effects:{approval:5,stress:10}},{text:"시장에 맡긴다",effects:{economy:-5,stress:3}}]},{desc:"실업률이 전월 대비 0.5% 상승했습니다.",choices:[{text:"고용 촉진 정책 제안",effects:{approval:5,economy:3,money:-2e4}},{text:"상황을 지켜본다",effects:{economy:-3}}]}];return e[Math.floor(Math.random()*e.length)]}},{id:"weather_event",title:"기상 이변",periods:["morning","noon","afternoon"],probability:.1,generator:()=>{const e=[{desc:"갑자기 폭우가 쏟아지기 시작했습니다. 외출이 어렵습니다.",choices:[{text:"실내에서 일한다",effects:{stress:-5}},{text:"우산을 쓰고 나간다",effects:{health:-3,reputation:5}}]},{desc:"쾌청한 날씨입니다. 야외 활동하기 좋은 날이네요.",choices:[{text:"산책하며 생각을 정리한다",effects:{stress:-10,health:5}},{text:"바로 업무에 집중한다",effects:{reputation:3}}]}];return e[Math.floor(Math.random()*e.length)]}},{id:"social_event",title:"사회 이슈",periods:["afternoon","evening"],probability:.12,generator:()=>{const e=[{desc:"시민단체가 대규모 집회를 예고했습니다. 치안 불안이 우려됩니다.",choices:[{text:"대화로 해결한다",effects:{approval:8,safety:-3,stress:10}},{text:"경찰을 배치한다",effects:{safety:5,approval:-5}},{text:"무시한다",effects:{safety:-10,approval:-8}}]},{desc:"지역 봉사활동 참여 요청이 왔습니다.",choices:[{text:"참여한다",effects:{reputation:10,stress:5,approval:5}},{text:"후원금만 보낸다",effects:{money:-3e4,reputation:3}},{text:"다음에 참여한다",effects:{}}]}];return e[Math.floor(Math.random()*e.length)]}},{id:"personal_event",title:"개인 이벤트",periods:["evening","night"],probability:.2,generator:()=>{const e=[{desc:"오랜 친구에게서 연락이 왔습니다. 저녁 식사를 제안합니다.",choices:[{text:"만나러 간다",effects:{stress:-15,money:-3e4,reputation:5}},{text:"바빠서 거절한다",effects:{stress:5}}]},{desc:"건강 검진 결과가 나왔습니다. 스트레스 지수가 높다는 소견입니다.",choices:[{text:"운동을 시작한다",effects:{health:10,stress:-10,money:-5e4}},{text:"무시한다",effects:{health:-5}}]},{desc:"집 근처에 새로운 카페가 오픈했습니다.",choices:[{text:"가본다",effects:{stress:-5,money:-8e3}},{text:"무시한다",effects:{}}]}];return e[Math.floor(Math.random()*e.length)]}}],G={president:[{id:"pres_crisis",title:"국정 위기",periods:["morning","afternoon"],probability:.2,generator:()=>{const e=[{desc:"야당이 장관 해임안을 발의했습니다. 국회가 긴장하고 있습니다.",choices:[{text:"장관을 교체한다",effects:{approval:-5,safety:5,stress:15}},{text:"끝까지 지킨다",effects:{approval:10,stress:20}},{text:"타협안을 제시한다",effects:{approval:3,economy:2}}]},{desc:"외국 정상과의 회담이 예정되어 있습니다. 의제를 결정해야 합니다.",choices:[{text:"경제 협력에 집중",effects:{economy:8,approval:5}},{text:"안보 문제 우선",effects:{safety:8,approval:3}},{text:"인권 문제 제기",effects:{approval:10,reputation:10,economy:-3}}]}];return e[Math.floor(Math.random()*e.length)]}}],ceo:[{id:"ceo_business",title:"경영 현안",periods:["morning","afternoon"],probability:.2,generator:()=>{const e=[{desc:"경쟁사가 혁신 제품을 출시했습니다. 시장 점유율이 위협받고 있습니다.",choices:[{text:"R&D 투자 확대",effects:{money:-2e5,economy:5,reputation:5,stress:10}},{text:"가격 인하 전략",effects:{money:-1e5,economy:-3}},{text:"마케팅 강화",effects:{money:-15e4,reputation:8}}]},{desc:"유능한 인재가 이직 제안을 받았습니다.",choices:[{text:"연봉을 올려준다",effects:{money:-1e5,reputation:5}},{text:"비전을 설명한다",effects:{reputation:3,stress:5}},{text:"보내준다",effects:{economy:-5}}]}];return e[Math.floor(Math.random()*e.length)]}}],doctor:[{id:"doc_emergency",title:"응급 상황",periods:["morning","noon","afternoon","evening","night"],probability:.25,generator:()=>{const e=[{desc:"응급실에 중환자가 실려 왔습니다. 즉각적인 판단이 필요합니다.",choices:[{text:"직접 수술한다",effects:{reputation:15,health:5,stress:20}},{text:"전문의에게 인계한다",effects:{stress:5}}]},{desc:"신종 감염병 의심 환자가 발견되었습니다.",choices:[{text:"즉시 격리 조치",effects:{health:10,safety:5,stress:10}},{text:"추가 검사 후 판단",effects:{health:-3,stress:5}},{text:"보건당국에 신고",effects:{health:5,reputation:5}}]}];return e[Math.floor(Math.random()*e.length)]}}],teacher:[{id:"teacher_school",title:"학교 현안",periods:["morning","noon","afternoon"],probability:.2,generator:()=>({desc:"학생들 사이에서 폭력 사건이 발생했습니다.",choices:[{text:"직접 중재한다",effects:{reputation:10,stress:15,safety:3}},{text:"학부모에게 알린다",effects:{stress:5,safety:5}},{text:"상담교사에게 맡긴다",effects:{stress:-3}}]})}],police:[{id:"police_case",title:"사건 발생",periods:["morning","noon","afternoon","evening","night"],probability:.25,generator:()=>{const e=[{desc:"절도 사건 신고가 접수되었습니다. 용의자가 도주 중입니다.",choices:[{text:"직접 추적한다",effects:{safety:10,reputation:10,stress:15}},{text:"지원을 요청한다",effects:{safety:5,stress:5}}]},{desc:"교통사고 현장에 도착했습니다. 부상자가 있습니다.",choices:[{text:"응급 처치 후 구급차 호출",effects:{health:5,reputation:10,stress:10}},{text:"교통 정리에 집중",effects:{safety:5,stress:5}}]}];return e[Math.floor(Math.random()*e.length)]}}],programmer:[{id:"dev_incident",title:"개발 이슈",periods:["morning","afternoon","evening","night"],probability:.25,generator:()=>{const e=[{desc:"프로덕션 서버에서 심각한 버그가 발견되었습니다. 사용자 영향이 확대 중입니다.",choices:[{text:"핫픽스를 바로 배포한다",effects:{reputation:10,stress:20}},{text:"롤백 후 분석한다",effects:{reputation:5,stress:10}},{text:"팀 긴급 미팅 소집",effects:{stress:15}}]},{desc:"오픈소스 라이브러리에서 보안 취약점이 발견되었습니다.",choices:[{text:"즉시 패치한다",effects:{safety:5,reputation:5,stress:10}},{text:"다음 스프린트에 반영",effects:{safety:-5}}]}];return e[Math.floor(Math.random()*e.length)]}}],soldier:[{id:"soldier_mission",title:"군사 임무",periods:["morning","afternoon","night"],probability:.22,generator:()=>{const e=[{desc:"북방 국경에서 정찰 임무 보고가 올라왔습니다. 이상 움직임이 감지되었습니다.",choices:[{text:"경계 태세를 강화한다",effects:{safety:10,stress:15,approval:3}},{text:"정보 분석을 요청한다",effects:{safety:5,stress:5}},{text:"상급 부대에 보고한다",effects:{reputation:5,stress:3}}]},{desc:"부대원의 사기가 저하되고 있습니다. 훈련 강도에 대한 불만이 있습니다.",choices:[{text:"휴식을 허가한다",effects:{approval:8,safety:-3,stress:-10}},{text:"격려 연설을 한다",effects:{approval:5,reputation:5,stress:5}},{text:"훈련을 유지한다",effects:{safety:5,approval:-5,stress:10}}]}];return e[Math.floor(Math.random()*e.length)]}}],artist:[{id:"artist_creative",title:"창작 활동",periods:["morning","afternoon","evening"],probability:.22,generator:()=>{const e=[{desc:"유명 갤러리에서 전시 제안이 왔습니다. 준비 기간이 촉박합니다.",choices:[{text:"전시를 수락한다",effects:{reputation:15,money:5e4,stress:20}},{text:"시간을 더 요청한다",effects:{stress:5}},{text:"거절한다",effects:{stress:-10}}]},{desc:"예술가 집단에서 사회 참여 작품을 함께 제작하자는 제안이 왔습니다.",choices:[{text:"적극 참여한다",effects:{reputation:10,approval:8,stress:10}},{text:"개인 작업에 집중한다",effects:{reputation:3,stress:-5}}]}];return e[Math.floor(Math.random()*e.length)]}}],journalist:[{id:"journalist_scoop",title:"취재 현장",periods:["morning","afternoon","evening"],probability:.22,generator:()=>{const e=[{desc:"정부의 비리를 폭로할 수 있는 내부 제보를 입수했습니다.",choices:[{text:"즉시 보도한다",effects:{reputation:15,approval:10,safety:-10,stress:15}},{text:"사실 확인 후 보도한다",effects:{reputation:10,stress:10}},{text:"제보를 무시한다",effects:{stress:-5,reputation:-10}}]},{desc:"재해 현장에서 독점 취재 기회가 생겼습니다. 위험 지역입니다.",choices:[{text:"현장에 직접 간다",effects:{reputation:15,health:-10,stress:15}},{text:"원격 취재한다",effects:{reputation:5,stress:5}}]}];return e[Math.floor(Math.random()*e.length)]}}],farmer:[{id:"farmer_season",title:"농사 현안",periods:["morning","noon","afternoon"],probability:.22,generator:()=>{const e=[{desc:"가뭄이 계속되고 있습니다. 작물이 말라가고 있습니다.",choices:[{text:"관개 시설에 투자한다",effects:{money:-1e5,economy:5,stress:10}},{text:"비가 오길 기다린다",effects:{economy:-8,stress:5}},{text:"작물을 교체한다",effects:{money:-5e4,economy:3}}]},{desc:"대형 마트에서 직거래 계약을 제안했습니다. 단가가 낮지만 물량이 큽니다.",choices:[{text:"계약을 수락한다",effects:{money:8e4,economy:5,stress:5}},{text:"로컬 마켓에 집중한다",effects:{reputation:5,money:3e4}},{text:"협상을 시도한다",effects:{money:5e4,reputation:3,stress:5}}]}];return e[Math.floor(Math.random()*e.length)]}}],lawyer:[{id:"lawyer_case",title:"법률 사건",periods:["morning","afternoon"],probability:.22,generator:()=>{const e=[{desc:"억울한 누명을 쓴 의뢰인이 찾아왔습니다. 승소 확률이 낮지만 사회적 의미가 큽니다.",choices:[{text:"무료 변론을 맡는다",effects:{reputation:15,approval:10,money:-5e4,stress:15}},{text:"일반 수임료를 받는다",effects:{money:1e5,reputation:5,stress:10}},{text:"사건을 거절한다",effects:{stress:-5,reputation:-5}}]},{desc:"대기업의 부당해고 소송에서 노동자측 변호를 요청받았습니다.",choices:[{text:"노동자측을 변호한다",effects:{approval:10,reputation:10,stress:15}},{text:"기업측 제안을 검토한다",effects:{money:2e5,approval:-5}}]}];return e[Math.floor(Math.random()*e.length)]}}],scientist:[{id:"scientist_research",title:"연구 현안",periods:["morning","afternoon","evening"],probability:.22,generator:()=>{const e=[{desc:"획기적인 실험 결과가 나왔습니다. 논문 발표를 서두를지 재검증을 할지 결정해야 합니다.",choices:[{text:"즉시 논문을 발표한다",effects:{reputation:15,stress:10}},{text:"재검증 후 발표한다",effects:{reputation:10,stress:15,health:-3}},{text:"국제 학회에서 발표한다",effects:{reputation:20,money:-5e4,stress:10}}]},{desc:"연구비 지원이 삭감될 위기입니다. 연구 방향을 바꿀지 고민됩니다.",choices:[{text:"기초 연구를 고수한다",effects:{reputation:5,money:-3e4,stress:10}},{text:"응용 연구로 전환한다",effects:{economy:5,money:5e4,stress:5}},{text:"기업 협력을 모색한다",effects:{money:1e5,reputation:-3}}]}];return e[Math.floor(Math.random()*e.length)]}}]},ot=["president","ceo","doctor","teacher","police","soldier","artist","programmer","journalist","farmer","lawyer","scientist"];ot.forEach(e=>{G[e]||(G[e]=[])});function nt(e){const{period:t}=U(),n=[...tt,...G[e]||[]].filter(s=>s.periods.includes(t));for(const s of n)if(Math.random()<s.probability){const i=s.generator();return{id:s.id,title:s.title,desc:i.desc,choices:i.choices}}return null}function st(e,t){const o=e.choices[t];if(o)return Ye({title:e.title,desc:e.desc,chosenAction:o.text,effects:o.effects}),o.effects}const it="AIzaSyD9SuTTLhmight7kKm0YblmBvJ3S6abWr0",at="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";let Y=!0,D=!1;const rt=3e4;async function ct(e,t,o,n){if(!Y||D)return null;D=!0,setTimeout(()=>{D=!1},rt);try{const s=lt(e,t,o,n),i=await dt(s);return pt(i)}catch(s){return console.warn("[SimWorld AI] Gemini API 호출 실패, 룰 기반 폴백:",s.message),null}}function lt(e,t,o,n){return`너는 현실 시뮬레이션 게임 "SimWorld"의 시나리오 생성기다.

## 현재 상황
- 플레이어 역할: ${t} (${e})
- 게임 시간: Day ${n.day}, ${n.formatted} (${n.period})
- 세계 상태: ${o}

## 지시사항
현재 상황에 맞는 현실적인 이벤트를 하나 생성해라.
이벤트는 플레이어의 역할과 세계 상태를 반영해야 한다.
반드시 아래 JSON 형식으로만 응답해라. 다른 텍스트는 절대 포함하지 마라.

## 응답 형식 (JSON만)
{
  "title": "이벤트 제목 (한글, 10자 이내)",
  "desc": "상황 설명 (한글, 2~3문장)",
  "choices": [
    {
      "text": "선택지1 (한글, 15자 이내)",
      "effects": { "economy": 0, "safety": 0, "approval": 0, "health": 0, "money": 0, "reputation": 0, "stress": 0 }
    },
    {
      "text": "선택지2",
      "effects": { "economy": 0, "safety": 0, "approval": 0, "health": 0, "money": 0, "reputation": 0, "stress": 0 }
    }
  ]
}

effects의 값은 -20 ~ 20 사이의 정수. money는 -200000 ~ 200000.
선택지는 2~3개. 현실적이고 도덕적 딜레마가 있으면 좋다.`}async function dt(e){var s,i,a,d,l;const t=await fetch(`${at}?key=${it}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:e}]}],generationConfig:{temperature:.9,maxOutputTokens:500,responseMimeType:"application/json"}})});if(!t.ok)throw new Error(`Gemini API ${t.status}: ${t.statusText}`);const n=(l=(d=(a=(i=(s=(await t.json()).candidates)==null?void 0:s[0])==null?void 0:i.content)==null?void 0:a.parts)==null?void 0:d[0])==null?void 0:l.text;if(!n)throw new Error("Empty Gemini response");return n}function pt(e){try{const t=e.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim(),o=JSON.parse(t);if(!o.title||!o.desc||!Array.isArray(o.choices)||o.choices.length<2)throw new Error("Invalid event structure");return{id:"ai_generated",title:`🤖 ${o.title}`,desc:o.desc,choices:o.choices.map(n=>({text:n.text,effects:n.effects||{}})),isAI:!0}}catch(t){return console.warn("[SimWorld AI] 응답 파싱 실패:",t.message),null}}function mt(e){Y=e}function R(){return Y}const ut=4e3;let h=null;function ft(){h&&document.body.contains(h)||(h=document.createElement("div"),h.id="toast-container",h.style.cssText=`
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 300;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 360px;
    pointer-events: none;
  `,document.body.appendChild(h))}function y(e,t="info"){ft();const o={info:{bg:"#e8f4fd",border:"#0071e3",icon:"ℹ️"},success:{bg:"#e8f8ed",border:"#34c759",icon:"✅"},warning:{bg:"#fff8e0",border:"#ff9500",icon:"⚠️"},danger:{bg:"#ffe5e3",border:"#ff3b30",icon:"🚨"},event:{bg:"#ededff",border:"#5856d6",icon:"📢"},ai:{bg:"#f0e8ff",border:"#af52de",icon:"🤖"}},n=o[t]||o.info,s=document.createElement("div");s.style.cssText=`
    background: ${n.bg};
    border: 1px solid ${n.border};
    border-left: 4px solid ${n.border};
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 14px;
    font-family: 'Inter', 'Noto Sans KR', sans-serif;
    color: #1d1d1f;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    pointer-events: auto;
    animation: toastIn 0.3s ease-out;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    cursor: pointer;
  `,s.innerHTML=`<span>${n.icon}</span><span>${e}</span>`,s.addEventListener("click",()=>Z(s)),h.appendChild(s),setTimeout(()=>Z(s),ut)}function Z(e){e.parentElement&&(e.style.transition="opacity 0.3s ease, transform 0.3s ease",e.style.opacity="0",e.style.transform="translateX(100%)",setTimeout(()=>e.remove(),300))}const _=vt();function vt(){return location.hostname==="bigmap.ai"?"https://bigmap.ai/api/simworld":"http://localhost:3456"}let x=[],$=null,ue=null,fe=null,L=null,T={},z="mouse",V=!1,C=!1;function yt(e,t){ue=e,fe=t,V=!1,C=!1,kt(e,t),It(),St(),$&&clearInterval($),$=setInterval(A,5e3),window.addEventListener("beforeunload",()=>{ve(),A()})}function gt(){ve(),A(),$&&(clearInterval($),$=null)}function g(e,t,o={}){x.push({userId:ue,roleId:fe,type:e,target:t,metadata:{...o,inputType:z},timestamp:new Date().toISOString()}),x.length>=50&&A()}function ht(e){T[e]=Date.now(),g("module_click",e),V&&!C&&(C=!0,g("module_reorder_response",e,{firstClickAfterOptimization:!0}))}function xt(e){if(T[e]){const t=Date.now()-T[e];g("module_dwell",e,{dwellMs:t}),g("detail_view",e,{viewed:!0,dwellMs:t}),delete T[e]}}function M(e,t){g("scroll_depth",e,{scrollPercent:Math.round(t)})}function bt(e,t,o,n){g("event_choice",e,{eventTitle:t,choiceIndex:o,choiceText:n})}function wt(e,t){g("choice_latency",e,{latencyMs:Math.round(t)})}function $t(){V=!0,C=!1}async function Et(e){try{const t=await fetch(`${_}/analytics/optimize/${e}`);return t.ok?await t.json():null}catch{return null}}function It(){g("device_info","session",{viewport:`${window.innerWidth}x${window.innerHeight}`,screenRes:`${screen.width}x${screen.height}`,dpr:window.devicePixelRatio||1,userAgent:navigator.userAgent.substring(0,200),platform:navigator.platform||"unknown",touchSupport:"ontouchstart"in window,language:navigator.language})}function St(){const e=t=>{t.type==="touchstart"?z="touch":t.type==="mousedown"?z="mouse":t.type==="keydown"&&(z="keyboard")};window.addEventListener("touchstart",e,{passive:!0,once:!1}),window.addEventListener("mousedown",e,{passive:!0,once:!1}),window.addEventListener("keydown",e,{passive:!0,once:!1})}async function kt(e,t){try{const o=await fetch(`${_}/analytics/session/start`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:e,roleId:t})});o.ok&&(L=(await o.json()).sessionId)}catch{}}async function ve(){if(L){try{await fetch(`${_}/analytics/session/end`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:L})})}catch{}L=null}}async function A(){if(x.length===0)return;const e=[...x];x=[];try{await fetch(`${_}/analytics/track`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({events:e})})}catch{x=[...e,...x]}}function Mt(e,t){F();const o=Date.now(),n=e.choices.map((i,a)=>`
    <button class="event-choice-btn" data-index="${a}" id="event-choice-${a}">
      <span class="choice-text">${i.text}</span>
      <span class="choice-effects">${Tt(i.effects)}</span>
    </button>
  `).join(""),s=document.createElement("div");s.className="event-modal-overlay",s.id="event-modal-overlay",s.innerHTML=`
    <div class="event-modal">
      <div class="event-modal-badge">${e.isAI?"🤖 AI 생성":"📢 이벤트"}</div>
      <h2 class="event-modal-title">${e.title}</h2>
      <p class="event-modal-desc">${e.desc}</p>
      <div class="event-modal-choices">
        ${n}
      </div>
    </div>
  `,document.body.appendChild(s),requestAnimationFrame(()=>{s.classList.add("active")}),s.querySelectorAll(".event-choice-btn").forEach(i=>{i.addEventListener("click",()=>{const a=parseInt(i.dataset.index,10),d=Date.now()-o;wt(e.id||e.title,d),Lt(s,()=>{F(),t(a)})})})}function Lt(e,t){e.classList.remove("active"),e.style.transition="opacity 0.3s ease",e.style.opacity="0",setTimeout(()=>{e.remove(),t&&t()},300)}function Tt(e){if(!e||Object.keys(e).length===0)return"변화 없음";const t={economy:"경제",safety:"치안",approval:"여론",health:"보건",money:"자산",reputation:"평판",stress:"스트레스"};return Object.entries(e).filter(([,o])=>o!==0).map(([o,n])=>{const s=t[o]||o,i=n>0?"+":"";return`<span style="color:${o==="stress"?n>0?"#ff3b30":"#34c759":n>0?"#34c759":"#ff3b30"}">${s} ${i}${o==="money"?n.toLocaleString()+"원":n}</span>`}).join(" · ")}let E=0,P=!1,I=null;function ye(e){const t=U(),o=O(),n=`
    <div class="screen dashboard-screen" id="dashboard-screen">
      <div class="dashboard-topbar">
        <div class="topbar-brand">
          <div class="topbar-logo">SW</div>
          <span class="topbar-title">SimWorld</span>
        </div>
        <div class="topbar-center">
          <div class="game-clock" id="game-clock">
            <span class="clock-day" id="clock-day">Day ${t.day}</span>
            <span class="clock-time" id="clock-time">${t.formatted}</span>
            <span class="clock-period" id="clock-period">${Q(t.period)}</span>
          </div>
          <div class="clock-controls">
            <button class="clock-btn" id="btn-pause" title="일시정지/재개">⏸️</button>
            <button class="clock-btn" id="btn-speed" title="배속 변경">1×</button>
            <button class="clock-btn ${R()?"active":""}" id="btn-ai" title="AI 이벤트 토글">🤖</button>
          </div>
        </div>
        <div class="topbar-user">
          <span class="user-role-badge">
            <span>${e.icon}</span>
            <span>${e.name}</span>
          </span>
          <div class="user-avatar">${e.name[0]}</div>
          <button class="logout-btn" id="btn-logout" title="로그아웃">↩</button>
        </div>
      </div>

      <div class="world-status-bar" id="world-status-bar">
        <div class="status-item">
          <span class="status-label">💰 경제</span>
          <div class="status-bar"><div class="status-fill economy" style="width:${o.economy}%"></div></div>
          <span class="status-value" id="val-economy">${o.economy}</span>
        </div>
        <div class="status-item">
          <span class="status-label">🛡️ 치안</span>
          <div class="status-bar"><div class="status-fill safety" style="width:${o.safety}%"></div></div>
          <span class="status-value" id="val-safety">${o.safety}</span>
        </div>
        <div class="status-item">
          <span class="status-label">📊 여론</span>
          <div class="status-bar"><div class="status-fill approval" style="width:${o.approval}%"></div></div>
          <span class="status-value" id="val-approval">${o.approval}</span>
        </div>
        <div class="status-item">
          <span class="status-label">❤️ 보건</span>
          <div class="status-bar"><div class="status-fill health" style="width:${o.health}%"></div></div>
          <span class="status-value" id="val-health">${o.health}</span>
        </div>
        <div class="status-item">
          <span class="status-label">${me(o.weather)} ${o.temperature}°C</span>
        </div>
        <div class="status-item">
          <span class="status-label">💵 ${o.money.toLocaleString()}원</span>
        </div>
      </div>

      <div class="dashboard-body">
        <div class="dashboard-welcome">
          <h2>${e.icon} ${e.name}님, SimWorld에 오신 것을 환영합니다</h2>
          <p id="welcome-sub">Day ${t.day} — 시뮬레이션이 시작됩니다</p>
        </div>
        <div class="module-grid" id="module-grid">
        </div>
        <div class="event-log-panel" id="event-log-panel">
          <h3>📜 이벤트 로그</h3>
          <div class="event-log-list" id="event-log-list">
            <div class="event-log-empty">아직 이벤트가 발생하지 않았습니다.</div>
          </div>
        </div>
      </div>
    </div>
  `,s=document.getElementById("app");s.innerHTML=n;const i=ie();i&&yt(i,e.id);const a={folder:{html:()=>Me(e.id),title:"📁 인접 폴더",detail:()=>Le(e.id)},bluehouse:{html:()=>Te(e.id),title:"🏛️ 블루하우스",detail:()=>ze(e.id)},scheduler:{html:()=>Ce(e.id),title:"📅 스케줄러",detail:()=>Ae(e.id)},prison:{html:()=>Oe(e.id),title:"⚖️ 청송",detail:()=>_e(e.id)},lab:{html:()=>je(e.id),title:"🧪 실험실",detail:()=>Be(e.id)}},d=["folder","bluehouse","scheduler","prison","lab"];Et(e.id).then(p=>{const v=p&&p.moduleOrder&&p.moduleOrder.length>=4?p.moduleOrder:d,u=document.getElementById("module-grid");if(u&&(u.innerHTML=v.map(w=>{var f;return((f=a[w])==null?void 0:f.html())||""}).join("")),p&&p.sampleSize>0&&$t(),p&&p.recommendations&&p.recommendations.length>0){const w=p.recommendations[0];y(`📊 ${w.text}`,"info")}}).catch(()=>{const p=document.getElementById("module-grid");p&&(p.innerHTML=d.map(v=>{var u;return((u=a[v])==null?void 0:u.html())||""}).join(""))});const l={"module-folder":"folder","module-bluehouse":"bluehouse","module-scheduler":"scheduler","module-prison":"prison","module-lab":"lab"};let m=null;document.getElementById("module-grid").addEventListener("click",p=>{const v=p.target.closest(".module-card");if(!v)return;const u=l[v.id];!u||!a[u]||(ht(u),m=u,Ct(a[u].title,a[u].detail(),()=>{m&&(xt(m),m=null)}))}),document.getElementById("btn-pause").addEventListener("click",()=>{const p=F();document.getElementById("btn-pause").textContent=p?"▶️":"⏸️",y(p?"시뮬레이션 일시정지":"시뮬레이션 재개","info")});let b=1;document.getElementById("btn-speed").addEventListener("click",()=>{b=b>=4?1:b*2,Fe(b),document.getElementById("btn-speed").textContent=`${b}×`,y(`속도: ${b}배속`,"info")}),document.getElementById("btn-ai").addEventListener("click",()=>{const p=!R();mt(p),document.getElementById("btn-ai").classList.toggle("active",p),y(p?"🤖 AI 시나리오 활성화":"AI 시나리오 비활성화",p?"ai":"info")}),document.getElementById("btn-logout").addEventListener("click",()=>{W(e),pe(),gt(),I&&clearInterval(I),Ie(),y("저장 후 로그아웃합니다...","info"),setTimeout(()=>{window.location.reload()},800)}),E=0,Ge(async p=>{E++;const v=document.getElementById("clock-day"),u=document.getElementById("clock-time"),w=document.getElementById("clock-period");if(v&&(v.textContent=`Day ${p.day}`),u&&(u.textContent=p.formatted),w&&(w.textContent=Q(p.period)),E%18===0&&Qe(),E%3===0&&!P){let f=null;R()&&E%9===0&&(f=await ct(e.id,e.name,Xe(),p)),f||(f=nt(e.id)),f&&(P=!0,y(`${f.title} — 새로운 이벤트 발생!`,f.isAI?"ai":"event"),setTimeout(()=>{Mt(f,B=>{const k=st(f,B);if(k){Ke(k);const X=f.choices[B],be=Ot(k);y(`"${X.text}" 선택 → ${be}`,"success"),_t(k),bt(f.id,f.title,B,X.text)}P=!1,ee(),zt(),W(e)})},1e3))}}),Ve(p=>{ee(p)}),qe(),y("🌍 SimWorld 시뮬레이션이 시작되었습니다!","success"),I&&clearInterval(I),I=setInterval(()=>{W(e)},3e4)}function W(e){const t=ie();t&&Ee(t,{roleId:e.id,clock:Ue(),world:et()})}function ee(e){const t=e||O(),o={"val-economy":t.economy,"val-safety":t.safety,"val-approval":t.approval,"val-health":t.health};Object.entries(o).forEach(([s,i])=>{const a=document.getElementById(s);a&&(a.textContent=i)});const n=document.getElementById("world-status-bar");if(n){const s=n.querySelectorAll(".status-fill"),i=[t.economy,t.safety,t.approval,t.health];s.forEach((d,l)=>{i[l]!==void 0&&(d.style.width=`${i[l]}%`)});const a=n.querySelectorAll(".status-item");a[4]&&(a[4].querySelector(".status-label").textContent=`${me(t.weather)} ${t.temperature}°C`),a[5]&&(a[5].querySelector(".status-label").textContent=`💵 ${t.money.toLocaleString()}원`)}}function zt(){const e=O(),t=document.getElementById("event-log-list");if(t){if(e.eventLog.length===0){t.innerHTML='<div class="event-log-empty">아직 이벤트가 발생하지 않았습니다.</div>';return}t.innerHTML=e.eventLog.slice(0,10).map(o=>`
    <div class="event-log-item">
      <div class="event-log-title">${o.title}</div>
      <div class="event-log-action">→ ${o.chosenAction}</div>
    </div>
  `).join("")}}function Ct(e,t,o){const n=document.querySelector(".module-modal-overlay");n&&n.remove();const s=document.createElement("div");s.className="module-modal-overlay",s.innerHTML=`
    <div class="module-modal">
      <div class="module-modal-header">
        <h2>${e}</h2>
        <button class="modal-close-btn" id="modal-close">✕</button>
      </div>
      <div class="module-modal-body">${t}</div>
    </div>
  `,document.body.appendChild(s);let i=null;const a=e.match(/^.\s+(.+)$/);a&&(i={"인접 폴더":"folder",블루하우스:"bluehouse",스케줄러:"scheduler",청송:"prison"}[a[1]]||null);const d=s.querySelector(".module-modal-body");d&&i&&d.addEventListener("scroll",()=>{const l=d.scrollTop/(d.scrollHeight-d.clientHeight)*100;l>=25&&l<50?M(i,25):l>=50&&l<75?M(i,50):l>=75&&l<100?M(i,75):l>=100&&M(i,100)}),document.getElementById("modal-close").addEventListener("click",()=>H(s,o)),s.addEventListener("click",l=>{l.target===s&&H(s,o)}),document.addEventListener("keydown",function l(m){m.key==="Escape"&&(H(s,o),document.removeEventListener("keydown",l))})}function H(e,t){e.style.transition="opacity 0.2s ease",e.style.opacity="0",setTimeout(()=>{e.remove(),typeof t=="function"&&t()},200)}const At={economy:"경제",safety:"안전",approval:"지지율",health:"건강",money:"자금",stress:"스트레스",reputation:"평판"};function Ot(e){return!e||Object.keys(e).length===0?"변화 없음":Object.entries(e).filter(([,t])=>t!==0).map(([t,o])=>{const n=At[t]||t,s=o>0?"+":"",i=t==="money"?"원":"";return`${n} ${s}${o.toLocaleString()}${i}`}).join(", ")}function _t(e){const t={economy:"val-economy",safety:"val-safety",approval:"val-approval",health:"val-health"};Object.entries(e).forEach(([o,n])=>{const s=t[o];if(!s||n===0)return;const i=document.getElementById(s);if(!i)return;const a=n>0?"#34c759":"#ff3b30";i.style.transition="none",i.style.color=a,i.style.transform="scale(1.4)",i.style.fontWeight="900";const d=document.createElement("span");d.textContent=n>0?`▲${n}`:`▼${Math.abs(n)}`,d.style.cssText=`
      font-size:10px;color:${a};font-weight:700;
      position:absolute;top:-14px;left:50%;transform:translateX(-50%);
      animation:fadeUp 1.5s ease forwards;pointer-events:none;
    `,i.style.position="relative",i.appendChild(d),setTimeout(()=>{i.style.transition="all 0.6s ease",i.style.color="",i.style.transform="",i.style.fontWeight="",d.remove()},1500)})}const j={currentScreen:"intro",selectedRole:null,playerName:"시민",gameDay:1,listeners:[]};function jt(){return{...j}}function S(e){j.currentScreen=e,he()}function ge(e){j.selectedRole=e,he()}function he(){j.listeners.forEach(e=>e(jt()))}function Bt(){S("intro"),we(Nt)}function Nt(){S("login"),Se(xe,Dt)}function xe(e){se(e.id),S("role-select"),ke(Rt)}function Dt(e,t){se(e.id);const o=q.find(n=>n.id===t.roleId);if(!o){xe(e);return}t.clock&&Je(t.clock),t.world&&Ze(t.world),ge(o),S("dashboard"),ye(o)}function Rt(e){ge(e),S("dashboard"),ye(e)}document.addEventListener("DOMContentLoaded",Bt);

(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const a of i.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&s(a)}).observe(document,{childList:!0,subtree:!0});function n(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(o){if(o.ep)return;o.ep=!0;const i=n(o);fetch(o.href,i)}})();function ve(e){const n=`
    <div class="screen intro-screen" id="intro-screen">
      <div class="intro-particles">${Array.from({length:20},(o,i)=>{const a=Math.random()*100,m=Math.random()*6,d=2+Math.random()*4,p=.2+Math.random()*.4;return`<div class="particle" style="left:${a}%;animation-delay:${m}s;width:${d}px;height:${d}px;opacity:${p}"></div>`}).join("")}</div>
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
  `,s=document.getElementById("app");s.innerHTML=n,document.getElementById("enter-btn").addEventListener("click",()=>{const o=document.getElementById("intro-screen");o.style.animation="none",o.style.transition="opacity 0.4s ease, transform 0.4s ease",o.style.opacity="0",o.style.transform="scale(1.02)",setTimeout(e,400)})}const X="simworld_accounts";function Q(){try{const e=localStorage.getItem(X);return e?JSON.parse(e):{}}catch{return{}}}function Z(e){localStorage.setItem(X,JSON.stringify(e))}function ye(e,t){const n=Q(),s=n[e];if(s&&s.password===t)return{isNew:!1,account:s};const o={id:e,password:t,savedState:null};return n[e]=o,Z(n),{isNew:!0,account:o}}function he(e,t){const n=Q();n[e]&&(n[e].savedState={...t,lastSaved:new Date().toISOString()},Z(n))}let W=null;function ee(e){W=e}function te(){return W}function ge(){W=null}function xe(e,t){const n=`
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
  `,s=document.getElementById("app");s.innerHTML=n,setTimeout(()=>{document.getElementById("login-id").focus()},500),document.getElementById("login-form").addEventListener("submit",o=>{o.preventDefault();const i=document.getElementById("login-id").value.trim(),a=document.getElementById("login-pw").value;if(!i||!a)return;const m=ye(i,a),d=document.getElementById("login-message");m.isNew?(d.className="login-message show new",d.textContent=`✨ "${i}" 계정이 생성되었습니다!`,setTimeout(()=>{C(()=>e(m.account))},1200)):m.account.savedState?(d.className="login-message show returning",d.textContent=`👋 ${i}님, 다시 오셨군요! 이전 세계를 복원합니다...`,setTimeout(()=>{C(()=>t(m.account,m.account.savedState))},1500)):(d.className="login-message show new",d.textContent=`👋 ${i}님, 세계에 접속합니다...`,setTimeout(()=>{C(()=>e(m.account))},1200))})}function C(e){const t=document.getElementById("login-screen");t&&(t.style.transition="opacity 0.4s ease, transform 0.4s ease",t.style.opacity="0",t.style.transform="scale(1.02)"),setTimeout(e,400)}const D=[{id:"president",name:"대통령",icon:"🏛️",desc:"국가를 이끄는 최고 지도자",color:"#5856d6"},{id:"ceo",name:"기업인",icon:"💼",desc:"기업을 경영하는 CEO",color:"#007aff"},{id:"doctor",name:"의사",icon:"🩺",desc:"생명을 살리는 의료인",color:"#34c759"},{id:"teacher",name:"교사",icon:"📚",desc:"미래 세대를 교육하는 교육자",color:"#ff9500"},{id:"police",name:"경찰",icon:"🚔",desc:"시민의 안전을 지키는 수호자",color:"#0071e3"},{id:"soldier",name:"군인",icon:"🎖️",desc:"국가를 수호하는 군 장교",color:"#30603b"},{id:"artist",name:"예술가",icon:"🎨",desc:"세상을 아름답게 만드는 창작자",color:"#af52de"},{id:"programmer",name:"프로그래머",icon:"💻",desc:"디지털 세계를 구축하는 개발자",color:"#ff375f"},{id:"journalist",name:"기자",icon:"📰",desc:"진실을 보도하는 언론인",color:"#64748b"},{id:"farmer",name:"농부",icon:"🌾",desc:"식량을 생산하는 1차 산업 종사자",color:"#8b6914"},{id:"lawyer",name:"변호사",icon:"⚖️",desc:"정의를 실현하는 법률가",color:"#1c1c1e"},{id:"scientist",name:"과학자",icon:"🔬",desc:"미지의 세계를 탐구하는 연구자",color:"#00b4d8"}];function ne(e){const t=[{name:"집",icon:"🏠",type:"place"},{name:"이웃",icon:"👥",type:"people"},{name:"시장",icon:"🏪",type:"place"},{name:"은행",icon:"🏦",type:"place"},{name:"공원",icon:"🌳",type:"place"}],n={president:[{name:"국회",icon:"🏛️",type:"place"},{name:"비서실",icon:"📋",type:"people"},{name:"국방부",icon:"🛡️",type:"place"}],ceo:[{name:"회사",icon:"🏢",type:"place"},{name:"직원들",icon:"👔",type:"people"},{name:"거래처",icon:"🤝",type:"people"}],doctor:[{name:"병원",icon:"🏥",type:"place"},{name:"환자들",icon:"🤕",type:"people"},{name:"연구실",icon:"🧪",type:"place"}],teacher:[{name:"학교",icon:"🏫",type:"place"},{name:"학생들",icon:"🎒",type:"people"},{name:"교무실",icon:"📝",type:"place"}],police:[{name:"경찰서",icon:"🚓",type:"place"},{name:"동료 경찰",icon:"👮",type:"people"},{name:"관할 구역",icon:"📍",type:"place"}],soldier:[{name:"부대",icon:"🏕️",type:"place"},{name:"전우들",icon:"🪖",type:"people"},{name:"훈련장",icon:"🎯",type:"place"}],artist:[{name:"작업실",icon:"🖼️",type:"place"},{name:"갤러리",icon:"🖌️",type:"place"},{name:"동료 예술가",icon:"🎭",type:"people"}],programmer:[{name:"오피스",icon:"🖥️",type:"place"},{name:"팀원들",icon:"👨‍💻",type:"people"},{name:"서버실",icon:"🗄️",type:"place"}],journalist:[{name:"편집국",icon:"📡",type:"place"},{name:"취재원",icon:"🕵️",type:"people"},{name:"방송국",icon:"📺",type:"place"}],farmer:[{name:"농장",icon:"🚜",type:"place"},{name:"농협",icon:"🌽",type:"place"},{name:"가축",icon:"🐄",type:"people"}],lawyer:[{name:"법원",icon:"🏛️",type:"place"},{name:"의뢰인",icon:"📝",type:"people"},{name:"사무실",icon:"🗃️",type:"place"}],scientist:[{name:"연구소",icon:"🏗️",type:"place"},{name:"동료 연구원",icon:"🧑‍🔬",type:"people"},{name:"실험실",icon:"⚗️",type:"place"}]};return[...t,...n[e]||[]]}function se(e){const t=[{text:"정부, 신규 경제 활성화 정책 발표",priority:"urgent",time:"30분 전"},{text:"국제 무역 협정 체결 — 수출입 규제 변경",priority:"normal",time:"1시간 전"},{text:"전국 기온 상승, 농업 생산량 영향 예상",priority:"info",time:"2시간 전"}];return[...{president:[{text:"야당, 예산안 수정 요구 — 국회 교착",priority:"urgent",time:"15분 전"}],ceo:[{text:"법인세율 조정안 국회 통과",priority:"urgent",time:"20분 전"}],doctor:[{text:"의료 보험 수가 개정안 발의",priority:"normal",time:"45분 전"}],police:[{text:"치안 강화 특별법 시행",priority:"urgent",time:"10분 전"}]}[e]||[],...t]}function oe(e){const t=[{time:"07:00",text:"기상 및 아침 식사"},{time:"22:00",text:"하루 정리 및 취침 준비"}],n={president:[{time:"08:00",text:"보안 브리핑"},{time:"10:00",text:"국무회의"},{time:"14:00",text:"외교 접견"},{time:"16:00",text:"정책 검토"}],ceo:[{time:"08:30",text:"경영 회의"},{time:"10:00",text:"부서 보고 청취"},{time:"13:00",text:"클라이언트 미팅"},{time:"15:00",text:"전략 기획"}],doctor:[{time:"08:00",text:"회진"},{time:"09:00",text:"외래 진료"},{time:"13:00",text:"수술"},{time:"16:00",text:"의료 기록 정리"}],teacher:[{time:"08:30",text:"조례"},{time:"09:00",text:"1-2교시 수업"},{time:"11:00",text:"3-4교시 수업"},{time:"14:00",text:"학생 상담"}],police:[{time:"08:00",text:"조회 및 관할 브리핑"},{time:"09:00",text:"순찰"},{time:"13:00",text:"사건 조사"},{time:"16:00",text:"보고서 작성"}],soldier:[{time:"06:00",text:"기상 및 점호"},{time:"07:00",text:"체력단련"},{time:"09:00",text:"훈련"},{time:"14:00",text:"전술 교육"}],artist:[{time:"09:00",text:"영감 수집 — 산책"},{time:"10:00",text:"작품 작업"},{time:"14:00",text:"갤러리스트 미팅"},{time:"16:00",text:"작품 리뷰"}],programmer:[{time:"09:00",text:"스탠드업 미팅"},{time:"09:30",text:"코드 리뷰"},{time:"10:00",text:"개발 (집중 시간)"},{time:"14:00",text:"스프린트 플래닝"}],journalist:[{time:"07:00",text:"뉴스 브리핑 확인"},{time:"09:00",text:"취재"},{time:"13:00",text:"기사 작성"},{time:"16:00",text:"편집 회의"}],farmer:[{time:"05:30",text:"기상 및 가축 돌보기"},{time:"07:00",text:"밭 작업"},{time:"12:00",text:"점심 및 휴식"},{time:"14:00",text:"농산물 출하 준비"}],lawyer:[{time:"08:00",text:"판례 연구"},{time:"10:00",text:"의뢰인 상담"},{time:"13:00",text:"법정 출석"},{time:"15:30",text:"소송 서류 작성"}],scientist:[{time:"08:00",text:"연구 논문 리뷰"},{time:"09:00",text:"실험"},{time:"13:00",text:"데이터 분석"},{time:"15:00",text:"연구팀 세미나"}]};return[...t,...n[e]||[]].sort((o,i)=>o.time.localeCompare(i.time))}function ie(e){const t=[{name:"세금 납부",status:"ok"},{name:"공공질서 준수",status:"ok"},{name:"환경 보호 의무",status:"warning"}],n={president:[{name:"헌법 준수",status:"ok"},{name:"국회 보고 의무",status:"warning"}],ceo:[{name:"공정거래법 준수",status:"ok"},{name:"근로기준법 준수",status:"ok"}],doctor:[{name:"의료법 준수",status:"ok"},{name:"환자 비밀유지",status:"ok"}],police:[{name:"적법 절차 준수",status:"ok"},{name:"과잉 진압 금지",status:"ok"}],lawyer:[{name:"변호사 윤리 강령",status:"ok"},{name:"의뢰인 비밀유지",status:"ok"}]};return{violationScore:15,rules:[...t,...n[e]||[]]}}function be(e){const n=`
    <div class="screen role-screen" id="role-screen">
      <div class="role-header">
        <h1>당신의 역할을 선택하세요</h1>
        <p>가상 세계에서 어떤 삶을 살아볼까요?</p>
      </div>
      <div class="role-grid" id="role-grid">
        ${D.map(i=>`
    <div class="role-card" data-role-id="${i.id}" id="role-card-${i.id}">
      <span class="role-icon">${i.icon}</span>
      <div class="role-name">${i.name}</div>
      <div class="role-desc">${i.desc}</div>
    </div>
  `).join("")}
      </div>
    </div>
  `,s=document.getElementById("app");s.innerHTML=n;const o=document.querySelectorAll(".role-card");o.forEach((i,a)=>{i.style.opacity="0",i.style.transform="translateY(20px)",i.style.transition=`opacity 0.4s ease ${a*.05}s, transform 0.4s ease ${a*.05}s`,requestAnimationFrame(()=>{i.style.opacity="1",i.style.transform="translateY(0)"})}),document.getElementById("role-grid").addEventListener("click",i=>{const a=i.target.closest(".role-card");if(!a)return;const m=a.dataset.roleId,d=D.find(p=>p.id===m);d&&(o.forEach(p=>p.classList.remove("selected")),a.classList.add("selected"),setTimeout(()=>{const p=document.getElementById("role-screen");p.style.transition="opacity 0.4s ease, transform 0.4s ease",p.style.opacity="0",p.style.transform="scale(0.98)",setTimeout(()=>e(d),400)},600))})}function we(e){return`
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
          ${ne(e).map(s=>`
    <div class="folder-item">
      <span class="folder-item-icon">${s.icon}</span>
      <span>${s.name}</span>
    </div>
  `).join("")}
        </div>
      </div>
    </div>
  `}function $e(e){return`
    <div style="margin-bottom:16px;font-size:var(--font-size-sm);color:var(--color-text-secondary);">
      현재 접근 가능한 인물과 장소 목록입니다.
    </div>
    ${ne(e).map(s=>`
    <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-bg);border-radius:var(--radius-sm);margin-bottom:8px;cursor:pointer;transition:all var(--transition-fast);"
         onmouseover="this.style.background='var(--color-folder-bg)'"
         onmouseout="this.style.background='var(--color-bg)'">
      <span style="font-size:1.5rem;">${s.icon}</span>
      <div>
        <div style="font-weight:600;">${s.name}</div>
        <div style="font-size:var(--font-size-xs);color:var(--color-text-tertiary);">
          ${s.type==="people"?"인물":"장소"} · 접근 가능
        </div>
      </div>
      <span style="margin-left:auto;color:var(--color-text-tertiary);">→</span>
    </div>
  `).join("")}
  `}function Ee(e){return`
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
          ${se(e).slice(0,3).map(s=>`
    <div class="news-item">
      <div class="news-dot ${s.priority}"></div>
      <div>
        <div class="news-text">${s.text}</div>
        <div class="news-time">${s.time}</div>
      </div>
    </div>
  `).join("")}
        </div>
      </div>
    </div>
  `}function Ie(e){return`
    <div style="margin-bottom:16px;font-size:var(--font-size-sm);color:var(--color-text-secondary);">
      현재 세계에서 벌어지고 있는 주요 소식입니다.
    </div>
    ${se(e).map(s=>`
    <div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid var(--color-border-light);">
      <div class="news-dot ${s.priority}" style="margin-top:6px;"></div>
      <div style="flex:1;">
        <div style="font-weight:500;margin-bottom:4px;">${s.text}</div>
        <div style="font-size:var(--font-size-xs);color:var(--color-text-tertiary);">${s.time}</div>
      </div>
      <span style="font-size:var(--font-size-xs);padding:2px 8px;border-radius:var(--radius-full);background:${s.priority==="urgent"?"rgba(255,59,48,0.1);color:var(--color-danger)":s.priority==="normal"?"rgba(0,113,227,0.1);color:var(--color-accent)":"rgba(52,199,89,0.1);color:var(--color-success)"};font-weight:600;">
        ${s.priority==="urgent"?"긴급":s.priority==="normal"?"일반":"정보"}
      </span>
    </div>
  `).join("")}
  `}function Se(e){return`
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
          ${oe(e).slice(0,4).map(s=>`
    <div class="schedule-item">
      <span class="schedule-time">${s.time}</span>
      <span class="schedule-text">${s.text}</span>
    </div>
  `).join("")}
        </div>
      </div>
    </div>
  `}function Le(e){const t=oe(e),n=new Date,s=n.getHours().toString().padStart(2,"0")+":"+n.getMinutes().toString().padStart(2,"0");return`
    <div style="margin-bottom:16px;font-size:var(--font-size-sm);color:var(--color-text-secondary);">
      오늘의 전체 일정입니다. 현재 시간 기준으로 표시됩니다.
    </div>
    ${t.map(i=>{const a=i.time<=s;return`
      <div style="display:flex;align-items:center;gap:16px;padding:12px 16px;background:${a?"var(--color-scheduler-bg)":"var(--color-bg)"};border-radius:var(--radius-sm);margin-bottom:8px;border-left:3px solid ${a?"var(--color-scheduler)":"transparent"};">
        <span style="font-weight:700;color:var(--color-scheduler);min-width:50px;font-size:var(--font-size-sm);">${i.time}</span>
        <span style="font-size:var(--font-size-sm);${a?"font-weight:600;":""}">${i.text}</span>
        ${a?'<span style="margin-left:auto;font-size:var(--font-size-xs);color:var(--color-scheduler);font-weight:600;">진행중</span>':""}
      </div>
    `}).join("")}
  `}function Me(e){const t=ie(e),n=t.rules.slice(0,3).map(s=>`
    <div class="prison-rule">
      <span>${s.name}</span>
      <span class="prison-rule-status ${s.status}">
        ${s.status==="ok"?"준수":s.status==="warning"?"주의":"위반"}
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
            ${n}
          </div>
        </div>
      </div>
    </div>
  `}function Te(e){const t=ie(e),n=t.rules.map(s=>`
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--color-bg);border-radius:var(--radius-sm);margin-bottom:8px;">
      <span style="font-weight:500;">${s.name}</span>
      <span class="prison-rule-status ${s.status}">
        ${s.status==="ok"?"✅ 준수":s.status==="warning"?"⚠️ 주의":"🚨 위반"}
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
    ${n}
  `}const ke=1e3,Ae=10,r={hour:7,minute:0,day:1,speed:1,paused:!1,intervalId:null,listeners:[]};function H(){return{hour:r.hour,minute:r.minute,day:r.day,speed:r.speed,paused:r.paused,formatted:Oe(r.hour,r.minute),period:Ce(r.hour)}}function Oe(e,t){return`${String(e).padStart(2,"0")}:${String(t).padStart(2,"0")}`}function Ce(e){return e>=6&&e<12?"morning":e>=12&&e<14?"noon":e>=14&&e<18?"afternoon":e>=18&&e<22?"evening":"night"}function U(e){return{morning:"☀️ 아침",noon:"🌤️ 점심",afternoon:"⛅ 오후",evening:"🌇 저녁",night:"🌙 밤"}[e]||e}function Be(){if(r.paused)return;for(r.minute+=Ae*r.speed;r.minute>=60;)r.minute-=60,r.hour++;for(;r.hour>=24;)r.hour-=24,r.day++;const e=H();r.listeners.forEach(t=>t(e))}function je(){r.intervalId||(r.intervalId=setInterval(Be,ke))}function ae(){r.intervalId&&(clearInterval(r.intervalId),r.intervalId=null)}function R(){return r.paused=!r.paused,r.paused}function ze(e){return r.speed=Math.max(1,Math.min(4,e)),r.speed}function Ne(e){return r.listeners.push(e),()=>{r.listeners=r.listeners.filter(t=>t!==e)}}function _e(e){ae(),r.hour=e.hour??7,r.minute=e.minute??0,r.day=e.day??1,r.speed=e.speed??1,r.paused=!1}function De(){return{hour:r.hour,minute:r.minute,day:r.day,speed:r.speed}}const c={economy:65,safety:70,approval:50,health:80,weather:"clear",temperature:15,money:1e6,reputation:50,stress:20,eventLog:[],listeners:[]};function T(){return{...c,eventLog:[...c.eventLog]}}function Re(e){Object.keys(e).forEach(t=>{t!=="eventLog"&&(typeof c[t]=="number"&&typeof e[t]=="number"?(c[t]=Math.max(0,Math.min(100,c[t]+e[t])),t==="money"&&(c[t]=c.money)):c[t]=e[t])}),"money"in e&&(c.money=Math.max(0,c.money)),F()}function Pe(e){c.eventLog.unshift({...e,timestamp:new Date().toISOString()}),c.eventLog.length>50&&(c.eventLog=c.eventLog.slice(0,50)),F()}function F(){const e=T();c.listeners.forEach(t=>t(e))}function We(e){return c.listeners.push(e),()=>{c.listeners=c.listeners.filter(t=>t!==e)}}function He(){return`경제:${c.economy} 치안:${c.safety} 여론:${c.approval} 보건:${c.health} 자산:${c.money}원 평판:${c.reputation} 스트레스:${c.stress} 날씨:${c.weather}`}function Fe(){const e=["clear","clear","clear","cloudy","cloudy","rain","storm"];c.weather=e[Math.floor(Math.random()*e.length)],c.temperature=10+Math.floor(Math.random()*20),F()}function re(e){return{clear:"☀️",cloudy:"⛅",rain:"🌧️",storm:"⛈️"}[e]||"☀️"}function qe(e){["economy","safety","approval","health","weather","temperature","money","reputation","stress"].forEach(n=>{e[n]!==void 0&&(c[n]=e[n])}),Array.isArray(e.eventLog)&&(c.eventLog=e.eventLog)}function Ge(){return{economy:c.economy,safety:c.safety,approval:c.approval,health:c.health,weather:c.weather,temperature:c.temperature,money:c.money,reputation:c.reputation,stress:c.stress,eventLog:[...c.eventLog]}}const Je=[{id:"economy_news",title:"경제 뉴스 속보",periods:["morning","afternoon"],probability:.15,generator:()=>{const e=[{desc:"주식시장이 급등했습니다. 경기 회복 신호가 감지됩니다.",choices:[{text:"투자를 늘린다",effects:{money:5e4,economy:3,stress:5}},{text:"관망한다",effects:{stress:-2}},{text:"안전자산으로 이동",effects:{money:-1e4,stress:-5}}]},{desc:"국제 유가가 폭등했습니다. 물가 상승이 우려됩니다.",choices:[{text:"비상 대책을 논의한다",effects:{approval:5,stress:10}},{text:"시장에 맡긴다",effects:{economy:-5,stress:3}}]},{desc:"실업률이 전월 대비 0.5% 상승했습니다.",choices:[{text:"고용 촉진 정책 제안",effects:{approval:5,economy:3,money:-2e4}},{text:"상황을 지켜본다",effects:{economy:-3}}]}];return e[Math.floor(Math.random()*e.length)]}},{id:"weather_event",title:"기상 이변",periods:["morning","noon","afternoon"],probability:.1,generator:()=>{const e=[{desc:"갑자기 폭우가 쏟아지기 시작했습니다. 외출이 어렵습니다.",choices:[{text:"실내에서 일한다",effects:{stress:-5}},{text:"우산을 쓰고 나간다",effects:{health:-3,reputation:5}}]},{desc:"쾌청한 날씨입니다. 야외 활동하기 좋은 날이네요.",choices:[{text:"산책하며 생각을 정리한다",effects:{stress:-10,health:5}},{text:"바로 업무에 집중한다",effects:{reputation:3}}]}];return e[Math.floor(Math.random()*e.length)]}},{id:"social_event",title:"사회 이슈",periods:["afternoon","evening"],probability:.12,generator:()=>{const e=[{desc:"시민단체가 대규모 집회를 예고했습니다. 치안 불안이 우려됩니다.",choices:[{text:"대화로 해결한다",effects:{approval:8,safety:-3,stress:10}},{text:"경찰을 배치한다",effects:{safety:5,approval:-5}},{text:"무시한다",effects:{safety:-10,approval:-8}}]},{desc:"지역 봉사활동 참여 요청이 왔습니다.",choices:[{text:"참여한다",effects:{reputation:10,stress:5,approval:5}},{text:"후원금만 보낸다",effects:{money:-3e4,reputation:3}},{text:"다음에 참여한다",effects:{}}]}];return e[Math.floor(Math.random()*e.length)]}},{id:"personal_event",title:"개인 이벤트",periods:["evening","night"],probability:.2,generator:()=>{const e=[{desc:"오랜 친구에게서 연락이 왔습니다. 저녁 식사를 제안합니다.",choices:[{text:"만나러 간다",effects:{stress:-15,money:-3e4,reputation:5}},{text:"바빠서 거절한다",effects:{stress:5}}]},{desc:"건강 검진 결과가 나왔습니다. 스트레스 지수가 높다는 소견입니다.",choices:[{text:"운동을 시작한다",effects:{health:10,stress:-10,money:-5e4}},{text:"무시한다",effects:{health:-5}}]},{desc:"집 근처에 새로운 카페가 오픈했습니다.",choices:[{text:"가본다",effects:{stress:-5,money:-8e3}},{text:"무시한다",effects:{}}]}];return e[Math.floor(Math.random()*e.length)]}}],P={president:[{id:"pres_crisis",title:"국정 위기",periods:["morning","afternoon"],probability:.2,generator:()=>{const e=[{desc:"야당이 장관 해임안을 발의했습니다. 국회가 긴장하고 있습니다.",choices:[{text:"장관을 교체한다",effects:{approval:-5,safety:5,stress:15}},{text:"끝까지 지킨다",effects:{approval:10,stress:20}},{text:"타협안을 제시한다",effects:{approval:3,economy:2}}]},{desc:"외국 정상과의 회담이 예정되어 있습니다. 의제를 결정해야 합니다.",choices:[{text:"경제 협력에 집중",effects:{economy:8,approval:5}},{text:"안보 문제 우선",effects:{safety:8,approval:3}},{text:"인권 문제 제기",effects:{approval:10,reputation:10,economy:-3}}]}];return e[Math.floor(Math.random()*e.length)]}}],ceo:[{id:"ceo_business",title:"경영 현안",periods:["morning","afternoon"],probability:.2,generator:()=>{const e=[{desc:"경쟁사가 혁신 제품을 출시했습니다. 시장 점유율이 위협받고 있습니다.",choices:[{text:"R&D 투자 확대",effects:{money:-2e5,economy:5,reputation:5,stress:10}},{text:"가격 인하 전략",effects:{money:-1e5,economy:-3}},{text:"마케팅 강화",effects:{money:-15e4,reputation:8}}]},{desc:"유능한 인재가 이직 제안을 받았습니다.",choices:[{text:"연봉을 올려준다",effects:{money:-1e5,reputation:5}},{text:"비전을 설명한다",effects:{reputation:3,stress:5}},{text:"보내준다",effects:{economy:-5}}]}];return e[Math.floor(Math.random()*e.length)]}}],doctor:[{id:"doc_emergency",title:"응급 상황",periods:["morning","noon","afternoon","evening","night"],probability:.25,generator:()=>{const e=[{desc:"응급실에 중환자가 실려 왔습니다. 즉각적인 판단이 필요합니다.",choices:[{text:"직접 수술한다",effects:{reputation:15,health:5,stress:20}},{text:"전문의에게 인계한다",effects:{stress:5}}]},{desc:"신종 감염병 의심 환자가 발견되었습니다.",choices:[{text:"즉시 격리 조치",effects:{health:10,safety:5,stress:10}},{text:"추가 검사 후 판단",effects:{health:-3,stress:5}},{text:"보건당국에 신고",effects:{health:5,reputation:5}}]}];return e[Math.floor(Math.random()*e.length)]}}],teacher:[{id:"teacher_school",title:"학교 현안",periods:["morning","noon","afternoon"],probability:.2,generator:()=>({desc:"학생들 사이에서 폭력 사건이 발생했습니다.",choices:[{text:"직접 중재한다",effects:{reputation:10,stress:15,safety:3}},{text:"학부모에게 알린다",effects:{stress:5,safety:5}},{text:"상담교사에게 맡긴다",effects:{stress:-3}}]})}],police:[{id:"police_case",title:"사건 발생",periods:["morning","noon","afternoon","evening","night"],probability:.25,generator:()=>{const e=[{desc:"절도 사건 신고가 접수되었습니다. 용의자가 도주 중입니다.",choices:[{text:"직접 추적한다",effects:{safety:10,reputation:10,stress:15}},{text:"지원을 요청한다",effects:{safety:5,stress:5}}]},{desc:"교통사고 현장에 도착했습니다. 부상자가 있습니다.",choices:[{text:"응급 처치 후 구급차 호출",effects:{health:5,reputation:10,stress:10}},{text:"교통 정리에 집중",effects:{safety:5,stress:5}}]}];return e[Math.floor(Math.random()*e.length)]}}],programmer:[{id:"dev_incident",title:"개발 이슈",periods:["morning","afternoon","evening","night"],probability:.25,generator:()=>{const e=[{desc:"프로덕션 서버에서 심각한 버그가 발견되었습니다. 사용자 영향이 확대 중입니다.",choices:[{text:"핫픽스를 바로 배포한다",effects:{reputation:10,stress:20}},{text:"롤백 후 분석한다",effects:{reputation:5,stress:10}},{text:"팀 긴급 미팅 소집",effects:{stress:15}}]},{desc:"오픈소스 라이브러리에서 보안 취약점이 발견되었습니다.",choices:[{text:"즉시 패치한다",effects:{safety:5,reputation:5,stress:10}},{text:"다음 스프린트에 반영",effects:{safety:-5}}]}];return e[Math.floor(Math.random()*e.length)]}}]},Ke=["president","ceo","doctor","teacher","police","soldier","artist","programmer","journalist","farmer","lawyer","scientist"];Ke.forEach(e=>{P[e]||(P[e]=[])});function Ue(e){const{period:t}=H(),s=[...Je,...P[e]||[]].filter(o=>o.periods.includes(t));for(const o of s)if(Math.random()<o.probability){const i=o.generator();return{id:o.id,title:o.title,desc:i.desc,choices:i.choices}}return null}function Ye(e,t){const n=e.choices[t];if(n)return Pe({title:e.title,desc:e.desc,chosenAction:n.text,effects:n.effects}),n.effects}const Ve="AIzaSyD9SuTTLhmight7kKm0YblmBvJ3S6abWr0",Xe="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";let q=!0,B=!1;const Qe=3e4;async function Ze(e,t,n,s){if(!q||B)return null;B=!0,setTimeout(()=>{B=!1},Qe);try{const o=et(e,t,n,s),i=await tt(o);return nt(i)}catch(o){return console.warn("[SimWorld AI] Gemini API 호출 실패, 룰 기반 폴백:",o.message),null}}function et(e,t,n,s){return`너는 현실 시뮬레이션 게임 "SimWorld"의 시나리오 생성기다.

## 현재 상황
- 플레이어 역할: ${t} (${e})
- 게임 시간: Day ${s.day}, ${s.formatted} (${s.period})
- 세계 상태: ${n}

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
선택지는 2~3개. 현실적이고 도덕적 딜레마가 있으면 좋다.`}async function tt(e){var o,i,a,m,d;const t=await fetch(`${Xe}?key=${Ve}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:e}]}],generationConfig:{temperature:.9,maxOutputTokens:500,responseMimeType:"application/json"}})});if(!t.ok)throw new Error(`Gemini API ${t.status}: ${t.statusText}`);const s=(d=(m=(a=(i=(o=(await t.json()).candidates)==null?void 0:o[0])==null?void 0:i.content)==null?void 0:a.parts)==null?void 0:m[0])==null?void 0:d.text;if(!s)throw new Error("Empty Gemini response");return s}function nt(e){try{const t=e.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim(),n=JSON.parse(t);if(!n.title||!n.desc||!Array.isArray(n.choices)||n.choices.length<2)throw new Error("Invalid event structure");return{id:"ai_generated",title:`🤖 ${n.title}`,desc:n.desc,choices:n.choices.map(s=>({text:s.text,effects:s.effects||{}})),isAI:!0}}catch(t){return console.warn("[SimWorld AI] 응답 파싱 실패:",t.message),null}}function st(e){q=e}function j(){return q}const ot=4e3;let h=null;function it(){h&&document.body.contains(h)||(h=document.createElement("div"),h.id="toast-container",h.style.cssText=`
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 300;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 360px;
    pointer-events: none;
  `,document.body.appendChild(h))}function y(e,t="info"){it();const n={info:{bg:"#e8f4fd",border:"#0071e3",icon:"ℹ️"},success:{bg:"#e8f8ed",border:"#34c759",icon:"✅"},warning:{bg:"#fff8e0",border:"#ff9500",icon:"⚠️"},danger:{bg:"#ffe5e3",border:"#ff3b30",icon:"🚨"},event:{bg:"#ededff",border:"#5856d6",icon:"📢"},ai:{bg:"#f0e8ff",border:"#af52de",icon:"🤖"}},s=n[t]||n.info,o=document.createElement("div");o.style.cssText=`
    background: ${s.bg};
    border: 1px solid ${s.border};
    border-left: 4px solid ${s.border};
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
  `,o.innerHTML=`<span>${s.icon}</span><span>${e}</span>`,o.addEventListener("click",()=>Y(o)),h.appendChild(o),setTimeout(()=>Y(o),ot)}function Y(e){e.parentElement&&(e.style.transition="opacity 0.3s ease, transform 0.3s ease",e.style.opacity="0",e.style.transform="translateX(100%)",setTimeout(()=>e.remove(),300))}function at(e,t){R();const n=e.choices.map((o,i)=>`
    <button class="event-choice-btn" data-index="${i}" id="event-choice-${i}">
      <span class="choice-text">${o.text}</span>
      <span class="choice-effects">${ct(o.effects)}</span>
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
  `,document.body.appendChild(s),requestAnimationFrame(()=>{s.classList.add("active")}),s.querySelectorAll(".event-choice-btn").forEach(o=>{o.addEventListener("click",()=>{const i=parseInt(o.dataset.index,10);rt(s,()=>{R(),t(i)})})})}function rt(e,t){e.classList.remove("active"),e.style.transition="opacity 0.3s ease",e.style.opacity="0",setTimeout(()=>{e.remove(),t&&t()},300)}function ct(e){if(!e||Object.keys(e).length===0)return"변화 없음";const t={economy:"경제",safety:"치안",approval:"여론",health:"보건",money:"자산",reputation:"평판",stress:"스트레스"};return Object.entries(e).filter(([,n])=>n!==0).map(([n,s])=>{const o=t[n]||n,i=s>0?"+":"";return`<span style="color:${n==="stress"?s>0?"#ff3b30":"#34c759":s>0?"#34c759":"#ff3b30"}">${o} ${i}${n==="money"?s.toLocaleString()+"원":s}</span>`}).join(" · ")}const k=lt();function lt(){return location.hostname==="bigmap.ai"?"https://bigmap.ai/api/simworld":"http://localhost:3456"}let g=[],w=null,ce=null,le=null,S=null,L={};function dt(e,t){ce=e,le=t,yt(e,t),w&&clearInterval(w),w=setInterval(M,5e3),window.addEventListener("beforeunload",()=>{de(),M()})}function mt(){de(),M(),w&&(clearInterval(w),w=null)}function G(e,t,n={}){g.push({userId:ce,roleId:le,type:e,target:t,metadata:n,timestamp:new Date().toISOString()}),g.length>=50&&M()}function ut(e){L[e]=Date.now(),G("module_click",e)}function pt(e){if(L[e]){const t=Date.now()-L[e];G("module_dwell",e,{dwellMs:t}),delete L[e]}}function ft(e,t,n,s){G("event_choice",e,{eventTitle:t,choiceIndex:n,choiceText:s})}async function vt(e){try{const t=await fetch(`${k}/analytics/optimize/${e}`);return t.ok?await t.json():null}catch{return null}}async function yt(e,t){try{const n=await fetch(`${k}/analytics/session/start`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:e,roleId:t})});n.ok&&(S=(await n.json()).sessionId)}catch{}}async function de(){if(S){try{await fetch(`${k}/analytics/session/end`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:S})})}catch{}S=null}}async function M(){if(g.length===0)return;const e=[...g];g=[];try{await fetch(`${k}/analytics/track`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({events:e})})}catch{g=[...e,...g]}}let $=0,z=!1,E=null;function me(e){const t=H(),n=T(),s=`
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
            <span class="clock-period" id="clock-period">${U(t.period)}</span>
          </div>
          <div class="clock-controls">
            <button class="clock-btn" id="btn-pause" title="일시정지/재개">⏸️</button>
            <button class="clock-btn" id="btn-speed" title="배속 변경">1×</button>
            <button class="clock-btn ${j()?"active":""}" id="btn-ai" title="AI 이벤트 토글">🤖</button>
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
          <div class="status-bar"><div class="status-fill economy" style="width:${n.economy}%"></div></div>
          <span class="status-value" id="val-economy">${n.economy}</span>
        </div>
        <div class="status-item">
          <span class="status-label">🛡️ 치안</span>
          <div class="status-bar"><div class="status-fill safety" style="width:${n.safety}%"></div></div>
          <span class="status-value" id="val-safety">${n.safety}</span>
        </div>
        <div class="status-item">
          <span class="status-label">📊 여론</span>
          <div class="status-bar"><div class="status-fill approval" style="width:${n.approval}%"></div></div>
          <span class="status-value" id="val-approval">${n.approval}</span>
        </div>
        <div class="status-item">
          <span class="status-label">❤️ 보건</span>
          <div class="status-bar"><div class="status-fill health" style="width:${n.health}%"></div></div>
          <span class="status-value" id="val-health">${n.health}</span>
        </div>
        <div class="status-item">
          <span class="status-label">${re(n.weather)} ${n.temperature}°C</span>
        </div>
        <div class="status-item">
          <span class="status-label">💵 ${n.money.toLocaleString()}원</span>
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
  `,o=document.getElementById("app");o.innerHTML=s;const i=te();i&&dt(i,e.id);const a={folder:{html:()=>we(e.id),title:"📁 인접 폴더",detail:()=>$e(e.id)},bluehouse:{html:()=>Ee(e.id),title:"🏛️ 블루하우스",detail:()=>Ie(e.id)},scheduler:{html:()=>Se(e.id),title:"📅 스케줄러",detail:()=>Le(e.id)},prison:{html:()=>Me(e.id),title:"⚖️ 청송",detail:()=>Te(e.id)}},m=["folder","bluehouse","scheduler","prison"];vt(e.id).then(l=>{const v=l&&l.moduleOrder&&l.moduleOrder.length===4?l.moduleOrder:m,u=document.getElementById("module-grid");if(u&&(u.innerHTML=v.map(b=>{var f;return((f=a[b])==null?void 0:f.html())||""}).join("")),l&&l.recommendations&&l.recommendations.length>0){const b=l.recommendations[0];y(`📊 ${b.text}`,"info")}}).catch(()=>{const l=document.getElementById("module-grid");l&&(l.innerHTML=m.map(v=>{var u;return((u=a[v])==null?void 0:u.html())||""}).join(""))});const d={"module-folder":"folder","module-bluehouse":"bluehouse","module-scheduler":"scheduler","module-prison":"prison"};let p=null;document.getElementById("module-grid").addEventListener("click",l=>{const v=l.target.closest(".module-card");if(!v)return;const u=d[v.id];!u||!a[u]||(ut(u),p=u,gt(a[u].title,a[u].detail(),()=>{p&&(pt(p),p=null)}))}),document.getElementById("btn-pause").addEventListener("click",()=>{const l=R();document.getElementById("btn-pause").textContent=l?"▶️":"⏸️",y(l?"시뮬레이션 일시정지":"시뮬레이션 재개","info")});let x=1;document.getElementById("btn-speed").addEventListener("click",()=>{x=x>=4?1:x*2,ze(x),document.getElementById("btn-speed").textContent=`${x}×`,y(`속도: ${x}배속`,"info")}),document.getElementById("btn-ai").addEventListener("click",()=>{const l=!j();st(l),document.getElementById("btn-ai").classList.toggle("active",l),y(l?"🤖 AI 시나리오 활성화":"AI 시나리오 비활성화",l?"ai":"info")}),document.getElementById("btn-logout").addEventListener("click",()=>{N(e),ae(),mt(),E&&clearInterval(E),ge(),y("저장 후 로그아웃합니다...","info"),setTimeout(()=>{window.location.reload()},800)}),$=0,Ne(async l=>{$++;const v=document.getElementById("clock-day"),u=document.getElementById("clock-time"),b=document.getElementById("clock-period");if(v&&(v.textContent=`Day ${l.day}`),u&&(u.textContent=l.formatted),b&&(b.textContent=U(l.period)),$%18===0&&Fe(),$%3===0&&!z){let f=null;j()&&$%9===0&&(f=await Ze(e.id,e.name,He(),l)),f||(f=Ue(e.id)),f&&(z=!0,y(`${f.title} — 새로운 이벤트 발생!`,f.isAI?"ai":"event"),setTimeout(()=>{at(f,O=>{const J=Ye(f,O);if(J){Re(J);const K=f.choices[O];y(`"${K.text}" 선택 — 결과가 반영되었습니다`,"success"),ft(f.id,f.title,O,K.text)}z=!1,V(),ht(),N(e)})},1e3))}}),We(l=>{V(l)}),je(),y("🌍 SimWorld 시뮬레이션이 시작되었습니다!","success"),E&&clearInterval(E),E=setInterval(()=>{N(e)},3e4)}function N(e){const t=te();t&&he(t,{roleId:e.id,clock:De(),world:Ge()})}function V(e){const t=e||T(),n={"val-economy":t.economy,"val-safety":t.safety,"val-approval":t.approval,"val-health":t.health};Object.entries(n).forEach(([o,i])=>{const a=document.getElementById(o);a&&(a.textContent=i)});const s=document.getElementById("world-status-bar");if(s){const o=s.querySelectorAll(".status-fill"),i=[t.economy,t.safety,t.approval,t.health];o.forEach((m,d)=>{i[d]!==void 0&&(m.style.width=`${i[d]}%`)});const a=s.querySelectorAll(".status-item");a[4]&&(a[4].querySelector(".status-label").textContent=`${re(t.weather)} ${t.temperature}°C`),a[5]&&(a[5].querySelector(".status-label").textContent=`💵 ${t.money.toLocaleString()}원`)}}function ht(){const e=T(),t=document.getElementById("event-log-list");if(t){if(e.eventLog.length===0){t.innerHTML='<div class="event-log-empty">아직 이벤트가 발생하지 않았습니다.</div>';return}t.innerHTML=e.eventLog.slice(0,10).map(n=>`
    <div class="event-log-item">
      <div class="event-log-title">${n.title}</div>
      <div class="event-log-action">→ ${n.chosenAction}</div>
    </div>
  `).join("")}}function gt(e,t,n){const s=document.querySelector(".module-modal-overlay");s&&s.remove();const o=document.createElement("div");o.className="module-modal-overlay",o.innerHTML=`
    <div class="module-modal">
      <div class="module-modal-header">
        <h2>${e}</h2>
        <button class="modal-close-btn" id="modal-close">✕</button>
      </div>
      <div class="module-modal-body">${t}</div>
    </div>
  `,document.body.appendChild(o),document.getElementById("modal-close").addEventListener("click",()=>_(o,n)),o.addEventListener("click",i=>{i.target===o&&_(o,n)}),document.addEventListener("keydown",function i(a){a.key==="Escape"&&(_(o,n),document.removeEventListener("keydown",i))})}function _(e,t){e.style.transition="opacity 0.2s ease",e.style.opacity="0",setTimeout(()=>{e.remove(),typeof t=="function"&&t()},200)}const A={currentScreen:"intro",selectedRole:null,playerName:"시민",gameDay:1,listeners:[]};function xt(){return{...A}}function I(e){A.currentScreen=e,pe()}function ue(e){A.selectedRole=e,pe()}function pe(){A.listeners.forEach(e=>e(xt()))}function bt(){I("intro"),ve(wt)}function wt(){I("login"),xe(fe,$t)}function fe(e){ee(e.id),I("role-select"),be(Et)}function $t(e,t){ee(e.id);const n=D.find(s=>s.id===t.roleId);if(!n){fe(e);return}t.clock&&_e(t.clock),t.world&&qe(t.world),ue(n),I("dashboard"),me(n)}function Et(e){ue(e),I("dashboard"),me(e)}document.addEventListener("DOMContentLoaded",bt);

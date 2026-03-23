// ========= QUIZ SYSTEM — Daily Rotation + Gemini AI =========
const GEMINI_KEY='AIzaSyD9SuTTLhmight7kKm0YblmBvJ3S6abWr0';
const DAILY_Q_COUNT = 5;

const QUIZ_BANK = {
eng:{name:'편입 영어',icon:'🇬🇧',color:'var(--accent)',questions:[
{q:'The experiment was designed to _____ the hypothesis.',opts:['validate','invalidate','replicate','simulate'],ans:0,exp:'validate = 검증하다.'},
{q:'Which is grammatically correct?',opts:['Neither the students nor the teacher were present.','Neither the students nor the teacher was present.','Neither the students or the teacher were present.','Neither the students or the teacher was present.'],ans:1,exp:'neither A nor B → 동사는 B(단수)에 일치. was가 정답.'},
{q:'"The vet\'s _____ diagnosis saved the flock." Best word?',opts:['astute','obscure','redundant','ambiguous'],ans:0,exp:'astute = 기민한, 예리한.'},
{q:'"Avian influenza poses significant risks." What does poses mean?',opts:['presents/creates','positions','pretends','pauses'],ans:0,exp:'pose a risk = 위험을 초래하다.'},
{q:'"_____ the farmer had implemented biosecurity, the outbreak might have been prevented."',opts:['Had','If','Should','Were'],ans:0,exp:'가정법 과거완료 도치: Had + S + p.p.'},
{q:'The disease spread rapidly _____ the lack of proper quarantine measures.',opts:['due to','in spite of','regardless of','in case of'],ans:0,exp:'due to = ~때문에. 적절한 격리 조치 부족 때문에 질병이 빠르게 퍼졌다.'},
{q:'"The poultry industry has undergone _____ changes over the past decade."',opts:['substantial','subtle','superficial','supplementary'],ans:0,exp:'substantial = 상당한, 실질적인.'},
{q:'Choose the correct sentence.',opts:['Were it not for vaccination, mortality would be higher.','Were it not for vaccination, mortality will be higher.','Was it not for vaccination, mortality would be higher.','Were it not vaccination, mortality would be higher.'],ans:0,exp:'가정법 현재 도치: Were it not for ~ = If it were not for ~'},
{q:'"The veterinarian _____ that the birds be quarantined immediately."',opts:['recommended','was recommending','has recommended to','recommended for'],ans:0,exp:'recommend that S + 동사원형 (당위의 should 생략). recommended that the birds be quarantined.'},
{q:'"Biosecurity protocols must be _____ adhered to during outbreaks."',opts:['strictly','loosely','casually','optionally'],ans:0,exp:'strictly adhered to = 엄격히 준수되다.'},
{q:'"The correlation between feed quality and growth rate is _____ documented."',opts:['well','good','nice','fine'],ans:0,exp:'well documented = 충분히 입증된. well은 부사로 과거분사를 수식.'},
{q:'Identify the error: "Each of the chickens have their own feeding schedule."',opts:['have → has','their → its','of → in','chickens → chicken'],ans:0,exp:'Each는 단수 취급. Each ... has. (their도 its가 더 정확하나 have→has가 핵심 오류)'},
{q:'"The farmer, along with his workers, _____ responsible for daily inspections."',opts:['is','are','were','have been'],ans:0,exp:'주어는 The farmer (단수). along with는 주어에 영향을 주지 않는다.'},
{q:'"Not until the symptoms appeared _____ the farmer realize the severity."',opts:['did','was','had','would'],ans:0,exp:'Not until ~ did S + V. 부정어구 도치 → 조동사 did가 앞으로.'},
{q:'"It is imperative that every farm _____ a contingency plan."',opts:['have','has','had','having'],ans:0,exp:'It is imperative that S + 동사원형(should 생략). every farm have.'},
]},
bio:{name:'일반생물학',icon:'🧬',color:'var(--green)',questions:[
{q:'세포 분열 시 방추사가 부착하는 염색체 구조는?',opts:['동원체(centromere)','텔로미어','뉴클레오솜','히스톤'],ans:0,exp:'동원체는 방추사가 부착하는 염색체의 잘록한 부분이다.'},
{q:'선도 가닥과 지연 가닥의 차이를 만드는 원인은?',opts:['DNA 중합효소가 5\'→3\' 방향으로만 합성','RNA 프라이머가 한쪽에만 필요','헬리카아제가 한 방향으로만 작동','토포이소머라아제의 비대칭 작용'],ans:0,exp:'DNA pol은 5\'→3\' 방향으로만 합성. 반대쪽은 오카자키 절편.'},
{q:'멘델의 독립의 법칙이 성립하기 위한 조건은?',opts:['두 유전자가 서로 다른 염색체에 위치','같은 염색체에 가깝게 위치','우성이 불완전','유전자 간 상위성'],ans:0,exp:'독립의 법칙은 비상동 염색체 위 유전자에서 성립. 연관 유전자는 해당 안 됨.'},
{q:'광합성 명반응에서 물의 광분해 산물은?',opts:['O₂, H⁺, e⁻','CO₂, H⁺, ATP','포도당, O₂, NADPH','O₂, CO₂, ATP'],ans:0,exp:'2H₂O → O₂ + 4H⁺ + 4e⁻. 산소 배출, H⁺와 전자는 전자전달계에 사용.'},
{q:'1차 면역 반응에서 가장 먼저 대량 생산되는 항체는?',opts:['IgM','IgG','IgA','IgE'],ans:0,exp:'IgM이 1차 반응 주력. IgG는 이후 대량 생산, 2차 반응 주력.'},
{q:'원핵세포와 진핵세포의 가장 큰 차이점은?',opts:['핵막의 유무','리보솜 유무','DNA 유무','세포벽 유무'],ans:0,exp:'원핵세포는 핵막이 없고, 진핵세포는 핵막으로 둘러싸인 핵을 가진다.'},
{q:'미토콘드리아에서 ATP가 가장 많이 생산되는 단계는?',opts:['산화적 인산화(전자전달계)','해당과정','TCA 회로','기질 수준 인산화'],ans:0,exp:'전자전달계(산화적 인산화)에서 약 34개의 ATP가 생산된다.'},
{q:'감수분열에서 교차(crossing over)가 일어나는 시기는?',opts:['감수 1분열 전기(제1전기)','감수 2분열 전기','체세포분열 전기','감수 1분열 후기'],ans:0,exp:'교차는 감수 1분열 전기에 상동염색체 사이에서 일어난다.'},
{q:'PCR(중합효소 연쇄반응)에서 사용되지 않는 것은?',opts:['RNA 중합효소','DNA 중합효소(Taq)','프라이머','dNTP'],ans:0,exp:'PCR은 내열성 DNA 중합효소(Taq), 프라이머, dNTP를 사용. RNA pol은 전사에 사용.'},
{q:'혈액형이 AB형인 사람의 유전자형은?',opts:['I^A I^B (공우성)','I^A I^A','I^B I^B','ii'],ans:0,exp:'AB형은 I^A와 I^B 대립유전자의 공우성(codominance) 발현이다.'},
{q:'생물의 분류 체계 순서로 올바른 것은?',opts:['계→문→강→목→과→속→종','계→강→문→목→과→속→종','계→문→목→강→과→속→종','계→문→강→과→목→속→종'],ans:0,exp:'계(Kingdom)→문(Phylum)→강(Class)→목(Order)→과(Family)→속(Genus)→종(Species).'},
{q:'효소의 활성 부위에 대한 설명으로 옳은 것은?',opts:['기질과 상보적 구조를 가진다','모든 아미노산이 관여한다','온도에 영향받지 않는다','비가역적으로 결합한다'],ans:0,exp:'활성 부위는 기질과 상보적 3D 구조(유도적합설). 특정 아미노산만 관여.'},
{q:'탄소 고정이 일어나는 광합성 단계는?',opts:['캘빈 회로(암반응)','명반응','광계 I','광계 II'],ans:0,exp:'캘빈 회로(암반응)에서 CO₂가 RuBisCO에 의해 고정되어 G3P가 생성된다.'},
{q:'체세포분열의 중기(M phase)에서 관찰되는 현상은?',opts:['염색체가 세포 중앙에 배열','DNA 복제','염색체 분리','세포질 분열'],ans:0,exp:'중기(metaphase)에 염색체가 세포판(적도면)에 일렬 배열된다.'},
{q:'삼투(osmosis)에 대한 설명으로 옳은 것은?',opts:['반투과성 막을 통한 물의 이동','용질의 확산','ATP를 소모하는 수송','고농도→저농도 용질 이동'],ans:0,exp:'삼투는 반투과성 막을 지나 물이 저농도→고농도쪽으로 이동하는 현상이다.'},
]},
chem:{name:'일반화학·유기화학',icon:'⚗️',color:'var(--purple)',questions:[
{q:'pH 3 용액의 [H⁺]는?',opts:['1×10⁻³ M','1×10⁻¹¹ M','3 M','1×10³ M'],ans:0,exp:'pH = -log[H⁺] → [H⁺] = 10⁻³ M.'},
{q:'SN2 반응의 특징은?',opts:['입체 전환(Walden inversion)','카보양이온 중간체','3차 탄소에서 최적','속도가 기질에만 의존'],ans:0,exp:'SN2: 배면 공격 → 입체 전환. 1차 탄소에서 최적. 속도=k[기질][친핵체].'},
{q:'-NO₂ 치환 벤젠의 친전자성 방향족 치환 위치는?',opts:['메타 배향','오르토/파라 배향','위치 무관','이탈기 작용'],ans:0,exp:'-NO₂는 EWG → 메타 배향. 고리 전자밀도↓, 반응성↓.'},
{q:'전기음성도 차이 0.4~1.7이면?',opts:['극성 공유 결합','비극성 공유','이온 결합','금속 결합'],ans:0,exp:'<0.4 비극성, 0.4~1.7 극성 공유, >1.7 이온.'},
{q:'아미노산 등전점(pI)에서의 특성은?',opts:['순전하 0','양전하','음전하','양극 이동'],ans:0,exp:'pI에서 순전하=0. 전기영동 시 이동 없음.'},
{q:'주기율표에서 같은 족 원소의 공통 특성은?',opts:['같은 수의 원자가 전자','같은 전자 껍질 수','같은 원자량','같은 이온화 에너지'],ans:0,exp:'같은 족 = 같은 원자가 전자 수 → 유사한 화학적 성질.'},
{q:'이상기체 방정식 PV = nRT에서 R은?',opts:['기체 상수','반응 속도','반지름','저항'],ans:0,exp:'R = 기체 상수 (8.314 J/mol·K).'},
{q:'산화-환원 반응에서 산화수가 증가하는 물질은?',opts:['산화되는 물질','환원되는 물질','촉매','용매'],ans:0,exp:'산화 = 산화수 증가 = 전자 잃음. 환원 = 산화수 감소 = 전자 얻음.'},
{q:'유기화학에서 카이랄 탄소의 조건은?',opts:['서로 다른 4개의 치환기','이중결합 보유','방향족 고리 부착','할로겐 원소 포함'],ans:0,exp:'카이랄 탄소는 4개의 서로 다른 치환기가 결합한 탄소(비대칭 탄소).'},
{q:'르 샤틀리에 원리에 따라, 발열 반응에서 온도를 높이면?',opts:['역반응 촉진','정반응 촉진','평형 변화 없음','반응 정지'],ans:0,exp:'발열 반응에 열을 가하면 → 열을 소비하는 역반응이 촉진된다.'},
{q:'공유 결합에서 시그마(σ) 결합과 파이(π) 결합의 차이는?',opts:['σ는 축 방향 겹침, π는 옆 방향 겹침','σ가 더 약하다','π가 먼저 형성된다','동일한 결합이다'],ans:0,exp:'σ결합: 오비탈의 축 방향(head-on) 겹침. π결합: 옆 방향(sideways) 겹침. σ가 더 강하다.'},
{q:'몰(mol)의 정의는?',opts:['6.022×10²³개의 입자','1g의 원자','1L의 기체','1kg의 분자'],ans:0,exp:'1몰 = 아보가드로 수(6.022×10²³)개의 입자.'},
{q:'알데히드와 케톤의 차이는?',opts:['알데히드는 말단 C=O, 케톤은 내부 C=O','구조 동일','알데히드가 더 안정','케톤은 환원 불가'],ans:0,exp:'알데히드: R-CHO (말단), 케톤: R-CO-R\' (내부). 알데히드가 산화되기 더 쉽다.'},
{q:'완충 용액의 역할은?',opts:['소량의 산·염기 추가 시 pH 변화 최소화','pH를 항상 7로 유지','산만 중화','염기만 중화'],ans:0,exp:'완충 용액: 약산+짝염기(또는 약염기+짝산) 혼합. 소량 산·염기에 대해 pH 안정.'},
{q:'벤젠의 구조적 특징은?',opts:['비편재화된 π전자(공명 구조)','교대 단일·이중 결합','sp³ 혼성','비공유 전자쌍 보유'],ans:0,exp:'벤젠: 6개 탄소가 sp² 혼성, 비편재화된 π전자. 모든 C-C 결합 길이 동일.'},
]},
vet:{name:'수의학·가금질병',icon:'🩺',color:'var(--pink)',questions:[
{q:'HPAI의 원인 바이러스 HA 아형은?',opts:['H5, H7','H1, H3','H9만','모든 HA형'],ans:0,exp:'HPAI는 주로 H5, H7 아형. H5N1, H5N6, H5N8 등.'},
{q:'뉴캐슬병(ND)의 원인체는?',opts:['Paramyxovirus','Coronavirus','Herpesvirus','Poxvirus'],ans:0,exp:'ND = Avian orthoavulavirus 1 (Paramyxoviridae). 법정 가축전염병.'},
{q:'마렉병(Marek\'s Disease)의 특징은?',opts:['T세포 림프종','호흡기 증상만','산란 저하만','세균성 패혈증'],ans:0,exp:'Herpesvirus에 의한 T세포 림프종. 말초신경·내장·피부 종양. HVT 백신 초일령 접종.'},
{q:'살모넬라 감염의 공중보건 중요성은?',opts:['계란·닭고기 통한 인수공통 식중독','가금에서만 문제','백신 100% 예방','항생제 내성 무관'],ans:0,exp:'대표적 인수공통감염병. 오염 계란·닭고기 → 사람 식중독.'},
{q:'육계 복수증(ascites)의 원인은?',opts:['급속 성장 → 산소요구↑ → 우심부전','바이러스','기생충','영양 결핍'],ans:0,exp:'빠른 성장 → 폐고혈압 → 우심비대 → 우심부전 → 복수. 환기·밀도 관리 핵심.'},
{q:'전염성 기관지염(IB)의 원인체는?',opts:['Coronavirus','Paramyxovirus','Influenza virus','Herpesvirus'],ans:0,exp:'IB = Avian coronavirus. 호흡기 증상, 산란 저하, 신장 병변 유발.'},
{q:'전염성 낭병(IBD, Gumboro병)이 공격하는 기관은?',opts:['파브리시우스낭(Bursa of Fabricius)','흉선','비장','간'],ans:0,exp:'IBD는 B세포 생성 기관인 파브리시우스낭을 파괴 → 면역억제.'},
{q:'가금에서 콕시듐증(coccidiosis)의 원인은?',opts:['Eimeria 원충','바이러스','세균','진균'],ans:0,exp:'Eimeria 속 원충에 의한 장내 기생충증. 혈변, 성장 저하, 사료 효율 감소.'},
{q:'닭의 백신 접종 경로로 흔하지 않은 것은?',opts:['정맥 주사','음수','분무','점안/점비'],ans:0,exp:'가금 백신: 음수, 분무, 점안/점비, 근육/피하 주사. 정맥 주사는 일반적이지 않다.'},
{q:'HACCP에서 CCP의 의미는?',opts:['중요관리점(Critical Control Point)','Chemical Control Process','Core Checking Procedure','Central Command Post'],ans:0,exp:'CCP = 위해요소를 예방·제거·허용 수준으로 감소시킬 수 있는 중요관리점.'},
{q:'항생제 잔류 방지를 위한 휴약기간의 목적은?',opts:['체내 약물이 허용 기준 이하로 감소','약효를 높이기 위해','균 내성 강화 방지','사료 효율 개선'],ans:0,exp:'휴약기간: 도축·출하 전 약물 투여 중단. 잔류 약물이 MRL 이하로 감소하도록.'},
{q:'AI(조류인플루엔자) 발생 시 한국의 법적 조치는?',opts:['살처분 + 이동제한 + 소독','치료 후 출하','자연 치유 대기','백신 접종만'],ans:0,exp:'한국은 HPAI 발생 시 살처분 정책(stamping out). 감염·의심 농장 반경 이동제한, 예방적 살처분.'},
{q:'종계(breeder) 관리에서 수의사의 핵심 역할은?',opts:['백신 프로그램 설계 + 질병 모니터링','사료 배합만','출하 일정 결정','건물 설계'],ans:0,exp:'종계 수의사: 백신 프로그램 설계, 항체가 모니터링, 위생 점검, 질병 진단·대응.'},
{q:'마이코플라즈마(MG) 감염의 주요 증상은?',opts:['만성 호흡기 질환(CRD)','급성 폐사','혈변','피부 종양'],ans:0,exp:'MG(M. gallisepticum): 만성 호흡기 질환. 기침, 콧물, 산란 저하. 수직 전파 가능.'},
{q:'가금의 체온 조절에서 가장 중요한 메커니즘은?',opts:['헐떡거림(panting, 증발냉각)','땀 배출','혈관 확장만','행동적 체온조절만'],ans:0,exp:'닭은 땀샘이 없다. 고온 시 헐떡거림(panting)으로 호흡기를 통한 증발냉각이 주요 수단.'},
]}
};

// ========= DAILY ROTATION =========
function dateSeed(){const d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();}
function seededShuffle(arr,seed){
  const a=[...arr]; let s=seed;
  for(let i=a.length-1;i>0;i--){s=((s*9301+49297)%233280);const j=Math.floor((s/233280)*i);[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
function getDailyQuestions(subjId){
  const all=QUIZ_BANK[subjId].questions;
  const shuffled=seededShuffle(all,dateSeed()+subjId.charCodeAt(0));
  return shuffled.slice(0,DAILY_Q_COUNT);
}

// ========= QUIZ STATE =========
let quizState={subj:null,idx:0,answers:[],locked:false,questions:[]};
function getQuizScores(){return JSON.parse(localStorage.getItem('quizScores')||'{}');}
function setQuizScores(s){localStorage.setItem('quizScores',JSON.stringify(s));}
function getQuizHistory(){return JSON.parse(localStorage.getItem('quizHistory')||'[]');}
function addQuizHistory(entry){const h=getQuizHistory();h.push(entry);if(h.length>60)h.shift();localStorage.setItem('quizHistory',JSON.stringify(h));}

function renderQuizSubjects(){
  const scores=getQuizScores();const today=dateSeed();
  document.getElementById('quizSubjGrid').innerHTML=Object.entries(QUIZ_BANK).map(([id,s])=>{
    const sc=scores[id];const sel=quizState.subj===id?'sel':'';
    const todayDone=sc&&sc.date===today;
    const scoreText=todayDone?`오늘: ${sc.correct}/${sc.total} (${sc.pct}점)`:sc?`최근: ${sc.pct}점`:'미진단';
    const badge=todayDone?'<span style="font-size:9px;color:var(--green)">✅ 완료</span>':'<span style="font-size:9px;color:var(--orange)">📝 오늘 문제</span>';
    return `<div class="quiz-subj-card ${sel}" onclick="startQuiz('${id}')">
      <div class="qs-ico">${s.icon}</div><div class="qs-name">${s.name}</div>
      <div class="qs-score">${scoreText}</div>${badge}</div>`;
  }).join('');
}

function startQuiz(subjId){
  const dailyQ=getDailyQuestions(subjId);
  quizState={subj:subjId,idx:0,answers:[],locked:false,questions:dailyQ};
  renderQuizSubjects();
  const s=QUIZ_BANK[subjId];
  document.getElementById('quizAreaTitle').innerHTML=`${s.icon} ${s.name} — Day ${Math.floor((dateSeed()-20260306))} 오늘의 문제`;
  renderQuestion();
}

function renderQuestion(){
  const{subj,idx,questions}=quizState;const q=questions[idx];const total=questions.length;
  let pips='';for(let i=0;i<total;i++){let c='pending';if(i<quizState.answers.length)c=quizState.answers[i].correct?'correct':'wrong';else if(i===idx)c='current';pips+=`<div class="q-pip ${c}"></div>`;}
  const mk=['A','B','C','D'];
  const opts=q.opts.map((o,i)=>`<div class="q-opt" id="qopt${i}" onclick="selectAnswer(${i})"><div class="q-marker">${mk[i]}</div><div>${o}</div></div>`).join('');
  document.getElementById('quizArea').innerHTML=`<div class="q-area">
    <div class="q-progress"><span>문제 ${idx+1}/${total}</span><div class="q-pips">${pips}</div></div>
    <div class="q-num">Q${idx+1}.</div><div class="q-text">${q.q}</div>
    <div class="q-opts">${opts}</div>
    <div class="q-explain" id="qExplain">💡 <strong>해설:</strong> ${q.exp}</div>
    <div class="q-btns" id="qBtns"></div></div>`;
}

function selectAnswer(optIdx){
  if(quizState.locked)return;quizState.locked=true;
  const{subj,idx,questions}=quizState;const q=questions[idx];const correct=optIdx===q.ans;
  quizState.answers.push({selected:optIdx,correct,qIdx:idx});
  document.getElementById('qopt'+optIdx).classList.add(correct?'q-correct':'q-wrong','q-selected');
  if(!correct)document.getElementById('qopt'+q.ans).classList.add('q-correct');
  document.querySelectorAll('.q-opt').forEach(e=>e.classList.add('q-locked'));
  document.getElementById('qExplain').classList.add('show');
  showToast(correct?'✅ 정답!':'❌ 오답.');
  const isLast=idx>=questions.length-1;
  document.getElementById('qBtns').innerHTML=`<button class="btn btn-a" onclick="${isLast?'finishQuiz()':'nextQuestion()'}">${isLast?'📊 결과':'다음 →'}</button>`;
  document.querySelectorAll('.q-pip').forEach((p,i)=>{p.className='q-pip '+(i<quizState.answers.length?(quizState.answers[i].correct?'correct':'wrong'):(i===idx?'current':'pending'));});
}
function nextQuestion(){quizState.idx++;quizState.locked=false;renderQuestion();}

function finishQuiz(){
  const{subj,answers,questions}=quizState;const s=QUIZ_BANK[subj];
  const correct=answers.filter(a=>a.correct).length;const total=answers.length;const pct=Math.round(correct/total*100);
  const scores=getQuizScores();scores[subj]={correct,total,pct,date:dateSeed(),details:answers};setQuizScores(scores);
  addQuizHistory({subj,pct,correct,total,date:new Date().toISOString()});
  renderQuizSubjects();renderQuizResults();
  let grade='',gc='';
  if(pct>=80){grade='🟢 우수';gc='var(--green)';}else if(pct>=60){grade='🟡 보통';gc='var(--orange)';}else if(pct>=40){grade='🟠 미흡';gc='var(--orange)';}else{grade='🔴 기초부족';gc='var(--red)';}
  let wh='';const wrongs=answers.filter(a=>!a.correct);
  if(wrongs.length>0)wh=`<div class="q-weak"><h4>⚠️ 틀린 문제</h4><ul>${wrongs.map(w=>{const q=questions[w.qIdx];return`<li><b>Q${w.qIdx+1}:</b> ${q.exp}</li>`;}).join('')}</ul></div>`;
  document.getElementById('quizArea').innerHTML=`<div class="q-result">
    <div style="font-size:14px;color:var(--text2)">${s.icon} ${s.name}</div>
    <div class="q-score-big" style="color:${gc}">${pct}점</div>
    <div class="q-grade" style="color:${gc}">${grade}</div>
    <div style="font-size:13px;color:var(--text2)">정답 ${correct}/${total}</div>${wh}
    <div class="q-btns" style="justify-content:center;margin-top:14px">
      <button class="btn btn-a" onclick="startQuiz('${subj}')">↻ 다시</button>
      <button class="btn" style="background:var(--bg3);color:var(--text2)" onclick="generateAIQuiz('${subj}')">🤖 AI 추가문제</button>
    </div></div>`;
}

function renderQuizResults(){
  const scores=getQuizScores();const subjs=Object.entries(QUIZ_BANK);
  const taken=subjs.filter(([id])=>scores[id]);
  if(!taken.length){document.getElementById('quizResults').innerHTML='<p style="font-size:12px;color:var(--text3);text-align:center;padding:40px 0;">아직 진단 결과가 없습니다</p>';return;}
  const tc=taken.reduce((a,[id])=>a+scores[id].correct,0);const tq=taken.reduce((a,[id])=>a+scores[id].total,0);const op=Math.round(tc/tq*100);
  let h=`<div style="text-align:center;margin-bottom:14px"><div style="font-size:12px;color:var(--text2)">종합 점수</div>
    <div style="font-size:36px;font-weight:800;color:${op>=60?'var(--green)':'var(--orange)'}">${op}점</div>
    <div style="font-size:11px;color:var(--text2)">${taken.length}/${subjs.length} 과목 · Day ${Math.floor((dateSeed()-20260306))}</div></div>`;
  h+='<div class="q-detail-grid">';
  subjs.forEach(([id,s])=>{const sc=scores[id];if(!sc){h+=`<div class="q-detail" style="opacity:.5"><div class="q-detail-name">${s.icon} ${s.name}</div><div class="q-detail-info">미진단</div></div>`;return;}
    const p=sc.pct;const c=p>=80?'var(--green)':p>=60?'var(--orange)':'var(--red)';
    h+=`<div class="q-detail"><div class="q-detail-name">${s.icon} ${s.name} <span style="margin-left:auto;font-size:13px;font-weight:700;color:${c}">${p}점</span></div>
    <div class="q-detail-bar"><div class="q-detail-fill" style="width:${p}%;background:${c}"></div></div><div class="q-detail-info">${sc.correct}/${sc.total}</div></div>`;
  });h+='</div>';
  // History chart
  const hist=getQuizHistory();if(hist.length>1){h+=`<div style="margin-top:12px;font-size:11px;color:var(--text2)">📈 최근 ${hist.length}회 기록: ${hist.slice(-5).map(e=>`${QUIZ_BANK[e.subj]?.icon||''} ${e.pct}점`).join(' → ')}</div>`;}
  const weakest=taken.sort((a,b)=>scores[a[0]].pct-scores[b[0]].pct);
  if(weakest.length>0&&scores[weakest[0][0]].pct<80){const wid=weakest[0][0],ws=QUIZ_BANK[wid];h+=`<div class="q-weak" style="margin-top:12px"><h4>🎯 우선 보강: ${ws.icon} ${ws.name} (${scores[wid].pct}점)</h4></div>`;}
  document.getElementById('quizResults').innerHTML=h;
}

// ========= GEMINI AI QUIZ GENERATION =========
async function generateAIQuiz(subjId){
  const s=QUIZ_BANK[subjId];
  document.getElementById('quizArea').innerHTML=`<div style="text-align:center;padding:40px"><div style="font-size:24px;margin-bottom:10px">🤖</div><div style="font-size:13px;color:var(--accent2)">AI가 새로운 문제를 생성 중...</div><div style="font-size:11px;color:var(--text3);margin-top:6px">Gemini API 호출 중</div></div>`;
  const prompt=`당신은 한국 수의학과 편입시험 출제 전문가입니다.
"${s.name}" 과목에서 편입시험 수준의 4지선다 문제 5개를 JSON 배열로 생성하세요.
형식: [{"q":"문제","opts":["A","B","C","D"],"ans":정답인덱스(0-3),"exp":"상세한 한국어 해설"}]
- 매번 다른 주제에서 출제
- 난이도: 대학교 편입시험 수준
- 해설은 핵심 개념을 포함하여 교재 없이도 학습 가능하도록
JSON 배열만 출력. 다른 텍스트 없이.`;
  try{
    const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.9}})
    });
    const data=await res.json();
    let text=data.candidates?.[0]?.content?.parts?.[0]?.text||'';
    text=text.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
    const questions=JSON.parse(text);
    if(!Array.isArray(questions)||questions.length<1)throw new Error('Invalid format');
    quizState={subj:subjId,idx:0,answers:[],locked:false,questions};
    document.getElementById('quizAreaTitle').innerHTML=`🤖 ${s.icon} ${s.name} — AI 생성 문제`;
    renderQuestion();showToast('🤖 AI 문제 5개 생성 완료!');
  }catch(e){
    console.error('AI Quiz Error:',e);
    document.getElementById('quizArea').innerHTML=`<div style="text-align:center;padding:40px">
      <div style="font-size:13px;color:var(--red)">⚠️ AI 문제 생성 실패</div>
      <div style="font-size:11px;color:var(--text3);margin-top:6px">${e.message}</div>
      <button class="btn btn-a" style="margin-top:12px" onclick="startQuiz('${subjId}')">기본 문제로 돌아가기</button></div>`;
  }
}

// ========= INIT =========
function init(){
  renderHero(); renderSchedule(); renderTimerSubjs(); renderTodayStudy();
  renderSubjects(); renderWeek(); renderAllTasks(); renderBarriers(); renderCosts();
  renderMini('strengths',STRENGTHS); renderMini('business',BUSINESS);
  renderNotif(); updatePhase();
  renderQuizSubjects(); renderQuizResults();
  setInterval(renderHero,6e4); setInterval(renderSchedule,6e4);
  if(nOn){reqPerm();startN();}
}
init();
</script>
</body>
</html>

(function(){
'use strict';

// ===== CONFIG =====
var body=document.body;
var pageType=body.dataset.pageType||'article';
var pageSlug=body.dataset.pageSlug||'home';
var nextUrl=body.dataset.nextUrl||'';
var nextTitle=body.dataset.nextTitle||'';
var seriesNum=parseInt(body.dataset.seriesNum)||0;

var ARTICLES=['first-time','weekend','over40','couple','alone','summer','event','vs','food','safety'];
var ARTICLE_NAMES={
  'first-time':'첫 방문 후기','weekend':'금토 비교','over40':'40대 후기',
  'couple':'커플 데이트','alone':'혼자 간 후기','summer':'여름밤 체험',
  'event':'이벤트 날','vs':'솔직 비교','food':'맛집 코스','safety':'안전 가이드'
};

// ===== STORAGE =====
var SK='cn_engage_v2';
function load(){try{return JSON.parse(localStorage.getItem(SK))||{}}catch(e){return{}}}
function save(d){try{localStorage.setItem(SK,JSON.stringify(d))}catch(e){}}
function getData(){
  var d=load();
  d.totalTime=d.totalTime||0;
  d.articlesRead=d.articlesRead||[];
  d.badges=d.badges||[];
  d.xp=d.xp||0;
  d.level=d.level||1;
  d.visitDays=d.visitDays||[];
  d.slotSpins=d.slotSpins||0;
  d.lastVisit=d.lastVisit||'';
  d.rewardsEarned=d.rewardsEarned||0;
  d.sessionCount=d.sessionCount||0;
  return d;
}

var data=getData();
var pageSec=0;
var xpGained=0;

// ===== SESSION TRACKING (per-session, not per-page) =====
var SESSION_KEY='cn_session_id';
var sessionId=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
try{
  var existingSession=sessionStorage.getItem(SESSION_KEY);
  if(!existingSession){
    sessionStorage.setItem(SESSION_KEY,sessionId);
    data.sessionCount++;
    save(data);
  }
}catch(e){data.sessionCount++;save(data);}

// ===== UTIL: getOrCreate element =====
function getOrCreate(id,className,html,parent){
  var el=document.getElementById(id);
  if(el)return el;
  el=document.createElement('div');
  el.id=id;
  el.className=className;
  if(html)el.innerHTML=html;
  (parent||document.body).appendChild(el);
  return el;
}

// ===== UTIL: throttle =====
function throttle(fn,ms){
  var last=0,timer=null;
  return function(){
    var now=Date.now();
    if(now-last>=ms){last=now;fn();}
    else if(!timer){timer=setTimeout(function(){last=Date.now();timer=null;fn();},ms-(now-last));}
  };
}

// ===== INJECT HTML ELEMENTS =====
function injectElements(){
  getOrCreate('progBar','prog-bar');
  getOrCreate('timer','timer-float','<span class="timer-text">0:00</span><span class="total-badge" id="totalBadge"></span>');
  getOrCreate('xpBarWrap','xp-bar-wrap','<div class="xp-bar" id="xpBar"></div>');
  getOrCreate('levelBadge','level-badge','<span class="lv-icon"></span><span class="lv-text"></span>');
  getOrCreate('socialProof','social-proof','<span class="live-dot"></span><span id="spText"></span>');
  getOrCreate('slotOverlay','slot-overlay','<div class="slot-machine"><h3>보너스 타임!</h3><div class="slot-reels"><div class="slot-reel" id="reel1">?</div><div class="slot-reel" id="reel2">?</div><div class="slot-reel" id="reel3">?</div></div><button class="slot-btn" id="slotSpin">돌려!</button><div class="slot-result" id="slotResult"></div><button class="slot-close" id="slotClose">닫기</button></div>');
  getOrCreate('rewardPopup','reward-popup','<div class="rp-emoji" id="rpEmoji"></div><div class="rp-title" id="rpTitle"></div><div class="rp-desc" id="rpDesc"></div>');
  getOrCreate('levelupEffect','levelup-effect','<div class="lu-text"></div>');
  getOrCreate('resumeBanner','resume-banner');
  getOrCreate('overlay','overlay');

  if(pageType==='article'){
    var cb=document.getElementById('collectionBar');
    if(!cb){
      cb=document.createElement('div');cb.className='collection-bar';cb.id='collectionBar';
      var dots='';
      ARTICLES.forEach(function(slug){
        var cls='cb-dot';
        if(data.articlesRead.indexOf(slug)!==-1)cls+=' read';
        if(slug===pageSlug)cls+=' current';
        dots+='<span class="'+cls+'" title="'+(ARTICLE_NAMES[slug]||slug)+'"></span>';
      });
      cb.innerHTML='<div class="cb-dots">'+dots+'</div><span class="cb-text" id="cbText">'+data.articlesRead.length+'/10</span>';
      document.body.appendChild(cb);
    }
  }
}

injectElements();

// ===== 1. READING PROGRESS BAR =====
var prog=document.getElementById('progBar');
var lastScrollPct=0;

function getScrollPct(){
  var h=document.documentElement.scrollHeight-window.innerHeight;
  return h>0?Math.min((window.scrollY/h)*100,100):0;
}

function updateProgress(){
  var p=getScrollPct();
  lastScrollPct=p;
  if(prog){
    prog.style.width=p+'%';
    if(p>80)prog.style.background='linear-gradient(90deg,#ff6b35,#ff9f1c)';
    else if(p>50)prog.style.background='linear-gradient(90deg,#2DB400,#5ce65c)';
    else prog.style.background='linear-gradient(90deg,#C9A96E,#e8c97a)';
  }
  return p;
}

// ===== 2. TIMER + MAIN TICK (single setInterval) =====
var timerEl=document.getElementById('timer');
var totalBadge=document.getElementById('totalBadge');
var idleTimer=0;
var idleShown=false;

// 변동비율 스케줄 타이밍
var nextSlotTime=90+Math.floor(Math.random()*120);
var slotTriggered=false;
var nextRewardTime=45+Math.floor(Math.random()*60);
var rewardShowing=false;

setInterval(function(){
  pageSec++;
  data.totalTime++;
  idleTimer++;

  // Timer display
  var m=Math.floor(pageSec/60),s=pageSec%60;
  var timeStr=m+':'+(s<10?'0':'')+s;
  if(timerEl){
    var timerText=timerEl.querySelector('.timer-text');
    if(timerText)timerText.textContent=timeStr;
    else{var fc=timerEl.firstChild;if(fc&&fc.nodeType===3)fc.textContent=timeStr;}
    if(pageSec>3)timerEl.classList.add('show');
  }

  // Total time badge
  var totalMin=Math.floor(data.totalTime/60);
  if(totalBadge&&totalMin>0){
    totalBadge.textContent='총 '+totalMin+'분';
    totalBadge.style.display='inline-block';
  }

  // XP: 10초마다 1XP
  if(pageSec%10===0)addXP(1);

  // 30초마다 저장
  if(pageSec%30===0)save(data);

  // 슬롯머신 트리거
  if(!slotTriggered&&pageSec>=nextSlotTime){
    slotTriggered=true;
    showSlotMachine();
  }

  // 랜덤 보상
  if(!rewardShowing&&pageSec>=nextRewardTime){
    var r=RANDOM_REWARDS[Math.floor(Math.random()*RANDOM_REWARDS.length)];
    showRewardPopup(r.emoji,r.title,r.desc);
    nextRewardTime=pageSec+60+Math.floor(Math.random()*120);
    addXP(5);
  }

  // 시간 잠금 해제
  checkTimeLocks();

  // 이스터에그
  checkEasterEggs();

  // Idle detection (90초 무활동)
  if(idleTimer>=90&&!idleShown){
    idleShown=true;
    var messages=[
      '아직 읽고 있지? 아래에 진짜 핵심이 있어!',
      '여기서 멈추면 아까운 정보 놓쳐!',
      '스크롤 내리면 숨겨진 팁이 기다리고 있어!',
      '잠깐! 이 글의 클라이막스는 아직 안 나왔어!'
    ];
    showRewardPopup('👀',messages[Math.floor(Math.random()*messages.length)],'스크롤을 내려봐!');
  }
},1000);

// ===== 3. XP + LEVEL SYSTEM =====
var LEVELS=[
  {min:0,name:'입문자',icon:'🌱'},
  {min:30,name:'탐험가',icon:'🔍'},
  {min:100,name:'단골',icon:'⭐'},
  {min:250,name:'VIP',icon:'👑'},
  {min:500,name:'전설',icon:'🏆'}
];

function getLevel(xp){
  var lv=LEVELS[0];lv.num=1;
  for(var i=LEVELS.length-1;i>=0;i--){
    if(xp>=LEVELS[i].min){lv=LEVELS[i];lv.num=i+1;break;}
  }
  return lv;
}

function addXP(amount){
  var oldLevel=getLevel(data.xp);
  data.xp+=amount;
  xpGained+=amount;
  var newLevel=getLevel(data.xp);

  // XP 바 업데이트
  var xpBar=document.getElementById('xpBar');
  if(xpBar){
    var prevMin=LEVELS[newLevel.num-1].min;
    var nextMin=newLevel.num<LEVELS.length?LEVELS[newLevel.num].min:LEVELS[LEVELS.length-1].min+250;
    var range=nextMin-prevMin;
    var pct=range>0?((data.xp-prevMin)/range)*100:100;
    xpBar.style.width=Math.min(pct,100)+'%';
  }

  // 레벨 배지 업데이트
  var lb=document.getElementById('levelBadge');
  if(lb){
    var lvIcon=lb.querySelector('.lv-icon');
    var lvText=lb.querySelector('.lv-text');
    if(lvIcon)lvIcon.textContent=newLevel.icon;
    if(lvText)lvText.textContent='Lv.'+newLevel.num+' '+newLevel.name;
    if(pageSec>5)lb.classList.add('show');
  }

  // 레벨업 체크
  if(newLevel.num>oldLevel.num){
    data.level=newLevel.num;
    showLevelUp(newLevel);
  }
}

function showLevelUp(lv){
  var el=document.getElementById('levelupEffect');
  if(el){
    var luText=el.querySelector('.lu-text');
    if(luText)luText.textContent='LEVEL UP! '+lv.icon+' '+lv.name;
    el.classList.add('show');
    spawnConfetti();
    setTimeout(function(){el.classList.remove('show')},2500);
  }
  earnBadge('level_'+lv.num,'레벨 '+lv.num+' 달성');
}

// ===== 4. SLOT MACHINE =====
var SLOT_EMOJIS=['🎵','💃','🍺','🌙','✨','🔥','🎤','💎','🎪','🥂'];
var SLOT_REWARDS=[
  {title:'숨겨진 팁 발견!',desc:'입장 전 껌 씹으면 긴장 풀려. DJ도 이 방법 쓴대.'},
  {title:'VIP 정보!',desc:'수요일 밤은 사람 적고 음악 좋아. 숨겨진 꿀요일이야.'},
  {title:'인싸 꿀팁!',desc:'바텐더한테 "추천 한 잔"이라고 하면 메뉴에 없는 거 만들어줘.'},
  {title:'생존 비법!',desc:'물 한 잔 → 술 한 잔 → 물 한 잔. 이 루틴이면 새벽 4시까지 버텨.'},
  {title:'분위기 메이커!',desc:'DJ한테 손 흔들면서 리액션 해줘. 그러면 네 주변으로 좋은 곡 쏟아져.'},
  {title:'데이트 코스!',desc:'7시 고기 → 9시 와인바 → 11시 나이트. 이 코스 실패 없어.'},
  {title:'사진 스팟!',desc:'입구 왼쪽 네온사인 앞이 인생샷 포인트야. 조명 각도 미쳤어.'},
  {title:'절약 팁!',desc:'자정 전 입장하면 음료 할인될 때 있어. 일찍 가면 이득!'},
  {title:'음악 정보!',desc:'새벽 1~2시가 DJ의 하이라이트 세트야. 이때 플로어 가야 해.'},
  {title:'레어 정보!',desc:'화장실 옆 복도에 숨겨진 포토존 있어. 아는 사람만 알아.'}
];

function showSlotMachine(){
  var overlay=document.getElementById('slotOverlay');
  if(!overlay)return;
  overlay.classList.add('show');

  var r1=document.getElementById('reel1'),r2=document.getElementById('reel2'),r3=document.getElementById('reel3');
  if(!r1||!r2||!r3)return;
  r1.textContent='?';r2.textContent='?';r3.textContent='?';
  var resEl=document.getElementById('slotResult');
  if(resEl)resEl.classList.remove('show');

  var spinBtn=document.getElementById('slotSpin');
  if(spinBtn){
    spinBtn.style.display='inline-block';
    spinBtn.onclick=function(){
      spinBtn.style.display='none';
      r1.classList.add('spinning');r2.classList.add('spinning');r3.classList.add('spinning');

      var e1=SLOT_EMOJIS[Math.floor(Math.random()*SLOT_EMOJIS.length)];
      var e2=SLOT_EMOJIS[Math.floor(Math.random()*SLOT_EMOJIS.length)];
      var e3=SLOT_EMOJIS[Math.floor(Math.random()*SLOT_EMOJIS.length)];

      setTimeout(function(){r1.classList.remove('spinning');r1.textContent=e1},600);
      setTimeout(function(){r2.classList.remove('spinning');r2.textContent=e2},1000);
      setTimeout(function(){
        r3.classList.remove('spinning');r3.textContent=e3;
        var reward=SLOT_REWARDS[Math.floor(Math.random()*SLOT_REWARDS.length)];
        if(resEl){
          resEl.innerHTML='<strong>'+reward.title+'</strong><br>'+reward.desc;
          resEl.classList.add('show');
        }
        data.slotSpins++;data.rewardsEarned++;
        addXP(25);save(data);
        if(e1===e2&&e2===e3){
          if(resEl)resEl.innerHTML='<strong>JACKPOT! 트리플 '+e1+'</strong><br>'+reward.desc+'<br><br>+50 XP 보너스!';
          addXP(50);spawnConfetti();
        }
      },1400);
    };
  }

  var closeBtn=document.getElementById('slotClose');
  if(closeBtn)closeBtn.onclick=function(){
    overlay.classList.remove('show');
    nextSlotTime=pageSec+120+Math.floor(Math.random()*180);
    slotTriggered=false;
  };
}

// ===== 5. TIME-LOCKED CONTENT =====
function checkTimeLocks(){
  var locks=document.querySelectorAll('.time-lock:not(.unlocked)');
  for(var i=0;i<locks.length;i++){
    var el=locks[i];
    var unlockAt=parseInt(el.dataset.unlock)||120;
    var remaining=unlockAt-pageSec;
    var lockTimer=el.querySelector('.lock-timer');
    if(remaining>0){
      if(lockTimer){
        var lm=Math.floor(remaining/60),ls=remaining%60;
        lockTimer.textContent=lm+'분 '+(ls<10?'0':'')+ls+'초 후 해제';
      }
    }else{
      el.classList.add('unlocked');
      addXP(15);
      showRewardPopup('🔓','비밀 콘텐츠 해제!','숨겨진 내용이 공개되었어요');
    }
  }
}

// ===== 6. VARIABLE REWARD POPUPS =====
var RANDOM_REWARDS=[
  {emoji:'💡',title:'알고 있었어?',desc:'울산 나이트 평균 체류시간은 3시간이래. 넌 지금 진정한 나이터!'},
  {emoji:'🎯',title:'읽기 집중력 UP!',desc:'지금 읽기 속도가 최적이야. 이 페이스 유지해!'},
  {emoji:'🔥',title:'핫 리더!',desc:'상위 10% 독자보다 오래 읽고 있어. 진짜 관심 있구나!'},
  {emoji:'🌟',title:'스타 리더!',desc:'이 블로그를 이렇게 꼼꼼히 읽는 사람 드물어.'},
  {emoji:'🎶',title:'재미있는 사실!',desc:'챔피언나이트 DJ는 매주 300곡 이상 준비한대.'},
  {emoji:'🍻',title:'꿀정보!',desc:'하이볼은 11시 전에 주문하면 기다림 없이 바로 받아.'},
  {emoji:'✨',title:'보너스 팁!',desc:'단체석 예약은 카톡으로 하면 자리 보장돼.'},
  {emoji:'🏅',title:'리딩 마스터!',desc:'벌써 '+data.articlesRead.length+'편 읽었네! 곧 전체 완독이야!'}
];

function showRewardPopup(emoji,title,desc){
  rewardShowing=true;
  var el=document.getElementById('rewardPopup');
  if(!el){rewardShowing=false;return;}
  var rpEmoji=document.getElementById('rpEmoji');
  var rpTitle=document.getElementById('rpTitle');
  var rpDesc=document.getElementById('rpDesc');
  if(rpEmoji)rpEmoji.textContent=emoji;
  if(rpTitle)rpTitle.textContent=title;
  if(rpDesc)rpDesc.textContent=desc;
  el.classList.add('show');
  data.rewardsEarned++;
  save(data);
  setTimeout(function(){el.classList.remove('show');rewardShowing=false},4000);
}

// ===== 7. SOCIAL PROOF =====
function initSocialProof(){
  var sp=document.getElementById('socialProof');
  var spText=document.getElementById('spText');
  if(!sp||!spText)return;
  var baseReaders=12+Math.floor(Math.random()*23);
  function updateSP(){
    var fluctuation=Math.floor(Math.random()*7)-3;
    var current=Math.max(8,baseReaders+fluctuation);
    spText.textContent='지금 '+current+'명이 이 글을 읽는 중';
  }
  setTimeout(function(){sp.classList.add('show');updateSP()},8000);
  setInterval(updateSP,15000+Math.floor(Math.random()*10000));
}
initSocialProof();

// ===== 8. STREAK SYSTEM =====
function checkStreak(){
  var today=new Date().toISOString().slice(0,10);
  if(data.lastVisit===today)return;
  if(!data.visitDays.length||data.visitDays[data.visitDays.length-1]!==today){
    data.visitDays.push(today);
  }
  data.lastVisit=today;

  var streak=1;
  for(var i=data.visitDays.length-1;i>0;i--){
    var d1=new Date(data.visitDays[i]);
    var d2=new Date(data.visitDays[i-1]);
    var diff=(d1-d2)/(1000*60*60*24);
    if(diff<=1)streak++;
    else break;
  }

  if(streak>=2){
    setTimeout(function(){
      var toast=getOrCreate('streakToast','streak-toast',
        '<span class="streak-num">🔥 '+streak+'일</span><span class="streak-label">연속 방문 스트릭!</span>');
      setTimeout(function(){toast.classList.add('show')},100);
      setTimeout(function(){toast.classList.remove('show')},3000);
      addXP(streak*10);
    },2000);
  }
  save(data);
}
checkStreak();

// ===== 9. COLLECTION / ARTICLE TRACKING =====
function trackArticle(){
  if(pageType!=='article'||!pageSlug)return;
  if(data.articlesRead.indexOf(pageSlug)===-1){
    data.articlesRead.push(pageSlug);
    save(data);
  }
  var cbText=document.getElementById('cbText');
  if(cbText)cbText.textContent=data.articlesRead.length+'/10';

  if(data.articlesRead.length===10){
    earnBadge('all_read','전체 10편 완독');
    setTimeout(function(){
      showRewardPopup('🏆','전설의 독자!','10편 전부 읽었어! 진정한 울산 나이트 마스터!');
    },2000);
  }
}
trackArticle();

// 홈에서 읽은 카드 표시
if(pageType==='home'){
  var cards=document.querySelectorAll('.card');
  for(var ci=0;ci<cards.length;ci++){
    var card=cards[ci];
    var href=card.getAttribute('href')||'';
    for(var ai=0;ai<ARTICLES.length;ai++){
      if(href.indexOf(ARTICLES[ai])!==-1&&data.articlesRead.indexOf(ARTICLES[ai])!==-1){
        card.classList.add('read-card');
        break;
      }
    }
  }
}

// ===== 10. AUTO-PLAY (location.href instead of window.open) =====
function initAutoPlay(){
  if(pageType!=='article'||!nextUrl)return;
  var nb=document.getElementById('nextBar');
  if(!nb)return;

  var autoStarted=false,cancelled=false,cdVal=8,cdInterval;
  var cdEl=document.getElementById('cd');

  var checkAutoPlay=throttle(function(){
    if(autoStarted||cancelled)return;
    var p=getScrollPct();
    if(p>90){
      autoStarted=true;
      nb.classList.add('show');
      cdInterval=setInterval(function(){
        cdVal--;
        if(cdEl)cdEl.textContent=cdVal;
        if(cdVal<=0){
          clearInterval(cdInterval);
          nb.classList.remove('show');
          window.location.href=nextUrl;
        }
      },1000);
    }
  },200);

  window.addEventListener('scroll',checkAutoPlay,{passive:true});

  var skipBtn=document.getElementById('skipNext');
  if(skipBtn)skipBtn.addEventListener('click',function(){
    cancelled=true;if(cdInterval)clearInterval(cdInterval);nb.classList.remove('show');
  });
}
initAutoPlay();

// 플로팅 다음글 버튼
function initFloatNext(){
  var fn=document.getElementById('floatNext');
  if(!fn)return;
  var checkFloat=throttle(function(){
    var p=getScrollPct();
    if(p>45)fn.classList.add('show');
    else fn.classList.remove('show');
  },200);
  window.addEventListener('scroll',checkFloat,{passive:true});
}
initFloatNext();

// ===== 11. SCROLL HANDLERS (throttled, unified) =====
var scrollMilestones={25:false,50:false,75:false,100:false};
var achieved=false;

var handleScroll=throttle(function(){
  var p=updateProgress();

  // Scroll milestones
  if(p>=25&&!scrollMilestones[25]){scrollMilestones[25]=true;addXP(5);}
  if(p>=50&&!scrollMilestones[50]){scrollMilestones[50]=true;addXP(10);}
  if(p>=75&&!scrollMilestones[75]){scrollMilestones[75]=true;addXP(10);
    showRewardPopup('📖','75% 읽었어!','거의 다 왔다! 끝까지 읽으면 보너스 XP!');}
  if(p>=100&&!scrollMilestones[100]){scrollMilestones[100]=true;addXP(20);}

  // Achievement popup (85%)
  if(!achieved&&p>85){
    achieved=true;
    var achieveEl=document.getElementById('achieve');
    var overlayEl=document.getElementById('overlay');
    if(achieveEl&&overlayEl){
      setTimeout(function(){
        overlayEl.classList.add('show');
        achieveEl.classList.add('show');
        addXP(30);
        setTimeout(function(){
          overlayEl.classList.remove('show');
          achieveEl.classList.remove('show');
        },3500);
      },600);
    }
  }

  // Fade-in cards
  var fadeItems=document.querySelectorAll('.card:not(.vis),.fade-in:not(.vis)');
  for(var fi=0;fi<fadeItems.length;fi++){
    if(fadeItems[fi].getBoundingClientRect().top<window.innerHeight-50){
      (function(el,delay){setTimeout(function(){el.classList.add('vis')},delay)})(fadeItems[fi],fi*60);
    }
  }
},100);

window.addEventListener('scroll',handleScroll,{passive:true});

// Initial fade-in check
setTimeout(function(){
  var initItems=document.querySelectorAll('.card:not(.vis),.fade-in:not(.vis)');
  for(var ii=0;ii<initItems.length;ii++){
    if(initItems[ii].getBoundingClientRect().top<window.innerHeight-50){
      (function(el,delay){setTimeout(function(){el.classList.add('vis')},delay)})(initItems[ii],ii*60);
    }
  }
},200);

// ===== 12. QUIZ & BONUS HANDLERS =====
var quizBtns=document.querySelectorAll('.quiz-opt');
for(var qi=0;qi<quizBtns.length;qi++){
  quizBtns[qi].addEventListener('click',function(){
    var btn=this;
    var box=btn.closest('.quiz-box');
    if(!box)return;
    var allBtns=box.querySelectorAll('.quiz-opt');
    for(var qj=0;qj<allBtns.length;qj++)allBtns[qj].classList.remove('sel');
    btn.classList.add('sel');
    btn.classList.add('pulse-anim');
    setTimeout(function(){btn.classList.remove('pulse-anim')},600);
    var res=box.querySelector('.quiz-result');
    if(res){res.style.display='block';res.textContent=btn.dataset.result||'좋은 선택이야!';}
    addXP(20);
    earnBadge('quiz_done','퀴즈 참여');
  });
}

var bonusHds=document.querySelectorAll('.bonus-hd');
for(var bi=0;bi<bonusHds.length;bi++){
  bonusHds[bi].addEventListener('click',function(){
    var box=this.parentElement;
    if(!box)return;
    box.classList.toggle('open');
    if(box.classList.contains('open'))addXP(10);
  });
}

// ===== 13. EASTER EGGS =====
var easterEggShown={};
function checkEasterEggs(){
  if(pageSec===300&&!easterEggShown['5min']){
    easterEggShown['5min']=true;
    var ees=document.querySelectorAll('.easter-egg[data-trigger="5min"]');
    for(var ei=0;ei<ees.length;ei++)ees[ei].classList.add('revealed');
    showRewardPopup('🥚','이스터에그 발견!','5분 동안 읽었더니 숨겨진 콘텐츠가 나타났어!');
    addXP(20);
  }
  if(pageSec===600&&!easterEggShown['10min']){
    easterEggShown['10min']=true;
    var ees10=document.querySelectorAll('.easter-egg[data-trigger="10min"]');
    for(var ej=0;ej<ees10.length;ej++)ees10[ej].classList.add('revealed');
    showRewardPopup('💎','레어 콘텐츠!','10분 독자에게만 공개되는 비밀 정보!');
    addXP(30);
    earnBadge('10min_reader','10분 이상 독서');
  }
}

// ===== 14. CONFETTI (limited, auto-cleanup) =====
function spawnConfetti(){
  var colors=['#C9A96E','#1E3A5F','#2DB400','#ff6b35','#ff9f1c','#e84393'];
  var frag=document.createDocumentFragment();
  var pieces=[];
  for(var i=0;i<20;i++){
    var c=document.createElement('div');
    c.className='confetti-piece';
    c.style.cssText='left:'+Math.random()*100+'vw;top:-10px;width:'+(6+Math.random()*8)+'px;height:'+(6+Math.random()*8)+'px;background:'+colors[Math.floor(Math.random()*colors.length)]+';border-radius:'+(Math.random()>.5?'50%':'0')+';animation-duration:'+(2+Math.random()*2)+'s;animation-delay:'+(i*40)+'ms';
    frag.appendChild(c);
    pieces.push(c);
  }
  document.body.appendChild(frag);
  setTimeout(function(){
    for(var j=0;j<pieces.length;j++){
      if(pieces[j].parentNode)pieces[j].parentNode.removeChild(pieces[j]);
    }
  },4500);
}

// ===== 15. BADGE SYSTEM =====
function earnBadge(id){
  if(data.badges.indexOf(id)!==-1)return;
  data.badges.push(id);
  save(data);
}

// ===== 16. WELCOME BACK =====
function showWelcomeBack(){
  if(data.sessionCount<=1||data.totalTime<60)return;
  var totalMin=Math.floor(data.totalTime/60);
  var rb=document.getElementById('resumeBanner');
  if(!rb)return;
  var readCount=data.articlesRead.length;
  var lv=getLevel(data.xp);

  rb.innerHTML='<div class="rb-emoji">👋</div>'+
    '<div class="rb-title">돌아왔구나!</div>'+
    '<div class="rb-stats">'+
    '총 읽은 시간: <strong>'+totalMin+'분</strong><br>'+
    '읽은 글: <strong>'+readCount+'/10편</strong><br>'+
    '레벨: <strong>'+lv.icon+' '+lv.name+'</strong><br>'+
    'XP: <strong>'+data.xp+'</strong>'+
    '</div>'+
    '<button class="rb-close" id="rbClose">계속 읽기</button>';

  setTimeout(function(){
    rb.classList.add('show');
    var closeBtn=document.getElementById('rbClose');
    if(closeBtn)closeBtn.onclick=function(){rb.classList.remove('show')};
  },1500);
  setTimeout(function(){rb.classList.remove('show')},9000);
}
showWelcomeBack();

// ===== 17. IDLE RESET =====
function resetIdle(){idleTimer=0;idleShown=false;}
document.addEventListener('mousemove',resetIdle,{passive:true});
document.addEventListener('touchstart',resetIdle,{passive:true});
document.addEventListener('scroll',resetIdle,{passive:true});
document.addEventListener('keydown',resetIdle,{passive:true});

// ===== 18. INITIAL XP UPDATE =====
addXP(0);

// ===== SAVE ON EXIT =====
window.addEventListener('beforeunload',function(){save(data)});

})();

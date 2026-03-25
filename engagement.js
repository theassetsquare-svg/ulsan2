(function(){
'use strict';

// ===== CONFIG =====
var body=document.body;
var pageType=body.dataset.pageType||'article';
var pageSlug=body.dataset.pageSlug||'home';
var nextUrl=body.dataset.nextUrl||'/';
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

// ===== INJECT HTML ELEMENTS =====
function injectElements(){
  // 프로그레스 바
  if(!document.getElementById('progBar')){
    var pb=document.createElement('div');pb.className='prog-bar';pb.id='progBar';
    document.body.appendChild(pb);
  }

  // 타이머
  if(!document.getElementById('timer')){
    var t=document.createElement('div');t.className='timer-float';t.id='timer';
    t.innerHTML='0:00<span class="total-badge" id="totalBadge"></span>';
    document.body.appendChild(t);
  }

  // XP 바
  var xpWrap=document.createElement('div');xpWrap.className='xp-bar-wrap';
  xpWrap.innerHTML='<div class="xp-bar" id="xpBar"></div>';
  document.body.appendChild(xpWrap);

  // 레벨 배지
  var lb=document.createElement('div');lb.className='level-badge';lb.id='levelBadge';
  lb.innerHTML='<span class="lv-icon"></span><span class="lv-text"></span>';
  document.body.appendChild(lb);

  // 소셜 프루프
  var sp=document.createElement('div');sp.className='social-proof';sp.id='socialProof';
  sp.innerHTML='<span class="live-dot"></span><span id="spText"></span>';
  document.body.appendChild(sp);

  // 슬롯머신 오버레이
  var so=document.createElement('div');so.className='slot-overlay';so.id='slotOverlay';
  so.innerHTML='<div class="slot-machine"><h3>보너스 타임!</h3><div class="slot-reels"><div class="slot-reel" id="reel1">?</div><div class="slot-reel" id="reel2">?</div><div class="slot-reel" id="reel3">?</div></div><button class="slot-btn" id="slotSpin">돌려!</button><div class="slot-result" id="slotResult"></div><button class="slot-close" id="slotClose">닫기</button></div>';
  document.body.appendChild(so);

  // 보상 팝업
  var rp=document.createElement('div');rp.className='reward-popup';rp.id='rewardPopup';
  rp.innerHTML='<div class="rp-emoji" id="rpEmoji"></div><div class="rp-title" id="rpTitle"></div><div class="rp-desc" id="rpDesc"></div>';
  document.body.appendChild(rp);

  // 컬렉션 바 (블로그 페이지만)
  if(pageType==='article'){
    var cb=document.createElement('div');cb.className='collection-bar';cb.id='collectionBar';
    var dots='';
    ARTICLES.forEach(function(slug){
      var cls='cb-dot';
      if(data.articlesRead.indexOf(slug)!==-1)cls+=' read';
      if(slug===pageSlug)cls+=' current';
      dots+='<span class="'+cls+'" title="'+ARTICLE_NAMES[slug]+'"></span>';
    });
    cb.innerHTML='<div class="cb-dots">'+dots+'</div><span class="cb-text" id="cbText">'+data.articlesRead.length+'/10</span>';
    document.body.appendChild(cb);
  }

  // 레벨업 이펙트
  var le=document.createElement('div');le.className='levelup-effect';le.id='levelupEffect';
  le.innerHTML='<div class="lu-text"></div>';
  document.body.appendChild(le);

  // 이어서 읽기 배너
  var rb=document.createElement('div');rb.className='resume-banner';rb.id='resumeBanner';
  document.body.appendChild(rb);

  // 오버레이
  if(!document.getElementById('overlay')){
    var ov=document.createElement('div');ov.className='overlay';ov.id='overlay';
    document.body.appendChild(ov);
  }
}

injectElements();

// ===== 1. READING PROGRESS BAR =====
var prog=document.getElementById('progBar');
function updateProgress(){
  var h=document.documentElement.scrollHeight-window.innerHeight;
  var p=h>0?(window.scrollY/h)*100:0;
  prog.style.width=p+'%';
  // 색상 변화: 0-50 골드, 50-80 그린, 80+ 파이어
  if(p>80)prog.style.background='linear-gradient(90deg,#ff6b35,#ff9f1c)';
  else if(p>50)prog.style.background='linear-gradient(90deg,#2DB400,#5ce65c)';
  else prog.style.background='linear-gradient(90deg,#C9A96E,#e8c97a)';
  return p;
}
window.addEventListener('scroll',updateProgress);

// ===== 2. SESSION TIMER + TOTAL TIME =====
var timerEl=document.getElementById('timer');
var totalBadge=document.getElementById('totalBadge');

// 세션 카운트
data.sessionCount++;
save(data);

setInterval(function(){
  pageSec++;
  data.totalTime++;

  var m=Math.floor(pageSec/60),s=pageSec%60;
  var timeStr=m+':'+(s<10?'0':'')+s;

  var totalMin=Math.floor(data.totalTime/60);
  if(totalMin>0){
    totalBadge.textContent='총 '+totalMin+'분';
    totalBadge.style.display='inline-block';
  }

  timerEl.childNodes[0].textContent=timeStr;
  if(pageSec>3)timerEl.classList.add('show');

  // XP: 10초마다 1XP
  if(pageSec%10===0){
    addXP(1);
  }

  // 30초마다 저장
  if(pageSec%30===0)save(data);

  // 슬롯머신 트리거 (변동 보상 스케줄)
  checkSlotTrigger();

  // 랜덤 보상 체크
  checkRandomReward();

  // 시간 잠금 해제
  checkTimeLocks();

  // 이스터에그
  checkEasterEggs();

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
  var lv=LEVELS[0];
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
  var nextLv=LEVELS[Math.min(newLevel.num,LEVELS.length-1)];
  var prevMin=LEVELS[newLevel.num-1].min;
  var nextMin=newLevel.num<LEVELS.length?LEVELS[newLevel.num].min:LEVELS[LEVELS.length-1].min+250;
  var pct=((data.xp-prevMin)/(nextMin-prevMin))*100;
  document.getElementById('xpBar').style.width=Math.min(pct,100)+'%';

  // 레벨 배지 업데이트
  var lb=document.getElementById('levelBadge');
  lb.querySelector('.lv-icon').textContent=newLevel.icon;
  lb.querySelector('.lv-text').textContent='Lv.'+newLevel.num+' '+newLevel.name;
  if(pageSec>5)lb.classList.add('show');

  // 레벨업 체크
  if(newLevel.num>oldLevel.num){
    data.level=newLevel.num;
    showLevelUp(newLevel);
  }
}

function showLevelUp(lv){
  var el=document.getElementById('levelupEffect');
  el.querySelector('.lu-text').textContent='LEVEL UP! '+lv.icon+' '+lv.name;
  el.classList.add('show');
  spawnConfetti();
  setTimeout(function(){el.classList.remove('show')},2500);

  // 배지 추가
  earnBadge('level_'+lv.num,'레벨 '+lv.num+' 달성');
}

// ===== 4. SLOT MACHINE (변동비율 강화) =====
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

// 변동비율 스케줄: 평균 3분마다, 실제로는 1.5~5분 사이 랜덤
var nextSlotTime=90+Math.floor(Math.random()*120); // 1.5~3.5분
var slotTriggered=false;

function checkSlotTrigger(){
  if(slotTriggered)return;
  if(pageSec>=nextSlotTime){
    slotTriggered=true;
    showSlotMachine();
  }
}

function showSlotMachine(){
  var overlay=document.getElementById('slotOverlay');
  overlay.classList.add('show');

  var r1=document.getElementById('reel1'),r2=document.getElementById('reel2'),r3=document.getElementById('reel3');
  r1.textContent='?';r2.textContent='?';r3.textContent='?';
  document.getElementById('slotResult').classList.remove('show');

  var spinBtn=document.getElementById('slotSpin');
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

      // 보상 표시
      var reward=SLOT_REWARDS[Math.floor(Math.random()*SLOT_REWARDS.length)];
      var resEl=document.getElementById('slotResult');
      resEl.innerHTML='<strong>'+reward.title+'</strong><br>'+reward.desc;
      resEl.classList.add('show');

      data.slotSpins++;
      data.rewardsEarned++;
      addXP(25);
      save(data);

      // 트리플이면 보너스
      if(e1===e2&&e2===e3){
        resEl.innerHTML='<strong>JACKPOT! 트리플 '+e1+'</strong><br>'+reward.desc+'<br><br>+50 XP 보너스!';
        addXP(50);
        spawnConfetti();
      }
    },1400);
  };

  document.getElementById('slotClose').onclick=function(){
    overlay.classList.remove('show');
    // 다음 슬롯 시간 예약 (2~5분 뒤)
    nextSlotTime=pageSec+120+Math.floor(Math.random()*180);
    slotTriggered=false;
  };
}

// ===== 5. TIME-LOCKED CONTENT =====
function checkTimeLocks(){
  document.querySelectorAll('.time-lock:not(.unlocked)').forEach(function(el){
    var unlockAt=parseInt(el.dataset.unlock)||120;
    var remaining=unlockAt-pageSec;
    var timerEl=el.querySelector('.lock-timer');
    if(remaining>0){
      if(timerEl){
        var m=Math.floor(remaining/60),s=remaining%60;
        timerEl.textContent=m+'분 '+(s<10?'0':'')+s+'초 후 해제';
      }
    }else{
      el.classList.add('unlocked');
      addXP(15);
      showRewardPopup('🔓','비밀 콘텐츠 해제!','숨겨진 내용이 공개되었어요');
    }
  });
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

var nextRewardTime=45+Math.floor(Math.random()*60); // 45~105초
var rewardShowing=false;

function checkRandomReward(){
  if(rewardShowing)return;
  if(pageSec>=nextRewardTime){
    var r=RANDOM_REWARDS[Math.floor(Math.random()*RANDOM_REWARDS.length)];
    showRewardPopup(r.emoji,r.title,r.desc);
    nextRewardTime=pageSec+60+Math.floor(Math.random()*120); // 1~3분 뒤
    addXP(5);
  }
}

function showRewardPopup(emoji,title,desc){
  rewardShowing=true;
  var el=document.getElementById('rewardPopup');
  document.getElementById('rpEmoji').textContent=emoji;
  document.getElementById('rpTitle').textContent=title;
  document.getElementById('rpDesc').textContent=desc;
  el.classList.add('show');
  data.rewardsEarned++;
  save(data);
  setTimeout(function(){el.classList.remove('show');rewardShowing=false},4000);
}

// ===== 7. SOCIAL PROOF =====
function initSocialProof(){
  var sp=document.getElementById('socialProof');
  var spText=document.getElementById('spText');
  var baseReaders=12+Math.floor(Math.random()*23); // 12~34

  function updateSP(){
    var fluctuation=Math.floor(Math.random()*7)-3; // -3 ~ +3
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
  if(data.lastVisit!==today){
    if(!data.visitDays.length||data.visitDays[data.visitDays.length-1]!==today){
      data.visitDays.push(today);
    }
    data.lastVisit=today;

    // 연속 일수 계산
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
        var toast=document.createElement('div');
        toast.className='streak-toast';
        toast.innerHTML='<span class="streak-num">🔥 '+streak+'일</span><span class="streak-label">연속 방문 스트릭!</span>';
        document.body.appendChild(toast);
        setTimeout(function(){toast.classList.add('show')},100);
        setTimeout(function(){toast.classList.remove('show');setTimeout(function(){toast.remove()},500)},3000);
        addXP(streak*10);
      },2000);
    }
    save(data);
  }
}
checkStreak();

// ===== 9. COLLECTION / ARTICLE TRACKING =====
function trackArticle(){
  if(pageType==='article'&&pageSlug){
    if(data.articlesRead.indexOf(pageSlug)===-1){
      data.articlesRead.push(pageSlug);
      save(data);
    }

    // 컬렉션 바 업데이트
    var cbText=document.getElementById('cbText');
    if(cbText)cbText.textContent=data.articlesRead.length+'/10';

    // 전체 완독 체크
    if(data.articlesRead.length===10){
      earnBadge('all_read','전체 10편 완독');
      setTimeout(function(){
        showRewardPopup('🏆','전설의 독자!','10편 전부 읽었어! 진정한 울산 나이트 마스터!');
      },2000);
    }
  }
}
trackArticle();

// 홈에서 읽은 카드 표시
if(pageType==='home'){
  document.querySelectorAll('.card').forEach(function(card){
    var href=card.getAttribute('href')||'';
    ARTICLES.forEach(function(slug){
      if(href.indexOf(slug)!==-1&&data.articlesRead.indexOf(slug)!==-1){
        card.classList.add('read-card');
      }
    });
  });
}

// ===== 10. NETFLIX AUTO-PLAY (enhanced) =====
function initAutoPlay(){
  if(pageType!=='article'||!nextUrl)return;

  var nb=document.getElementById('nextBar');
  if(!nb)return;

  var autoStarted=false,cancelled=false,cdVal=10,cdInterval;
  var cdEl=document.getElementById('cd');

  window.addEventListener('scroll',function(){
    if(autoStarted||cancelled)return;
    var h=document.documentElement.scrollHeight-window.innerHeight;
    if(h>0&&window.scrollY/h>0.90){
      autoStarted=true;
      nb.classList.add('show');
      cdInterval=setInterval(function(){
        cdVal--;
        if(cdEl)cdEl.textContent=cdVal;
        if(cdVal<=0){
          clearInterval(cdInterval);
          window.open(nextUrl,'_blank');
          nb.classList.remove('show');
        }
      },1000);
    }
  });

  var skipBtn=document.getElementById('skipNext');
  if(skipBtn)skipBtn.addEventListener('click',function(){
    cancelled=true;clearInterval(cdInterval);nb.classList.remove('show');
  });
}
initAutoPlay();

// 플로팅 다음글 버튼
function initFloatNext(){
  var fn=document.getElementById('floatNext');
  if(!fn)return;
  window.addEventListener('scroll',function(){
    var h=document.documentElement.scrollHeight-window.innerHeight;
    if(h>0&&window.scrollY/h>0.45)fn.classList.add('show');
    else fn.classList.remove('show');
  });
}
initFloatNext();

// ===== 11. SCROLL FADE-IN =====
function initFadeIn(){
  var items=document.querySelectorAll('.card,.fade-in');
  function check(){
    items.forEach(function(el,i){
      if(el.getBoundingClientRect().top<window.innerHeight-50){
        setTimeout(function(){el.classList.add('vis')},i*60);
      }
    });
  }
  window.addEventListener('scroll',check);
  setTimeout(check,200);
}
initFadeIn();

// ===== 12. QUIZ & BONUS HANDLERS =====
document.querySelectorAll('.quiz-opt').forEach(function(btn){
  btn.addEventListener('click',function(){
    var box=btn.closest('.quiz-box');
    box.querySelectorAll('.quiz-opt').forEach(function(b){b.classList.remove('sel')});
    btn.classList.add('sel');
    btn.classList.add('pulse-anim');
    setTimeout(function(){btn.classList.remove('pulse-anim')},600);
    var res=box.querySelector('.quiz-result');
    if(res){res.style.display='block';res.textContent=btn.dataset.result||'좋은 선택이야!';}
    addXP(20);
    earnBadge('quiz_done','퀴즈 참여');
  });
});

document.querySelectorAll('.bonus-hd').forEach(function(hd){
  hd.addEventListener('click',function(){
    var box=hd.parentElement;
    box.classList.toggle('open');
    if(box.classList.contains('open')){
      addXP(10);
    }
  });
});

// ===== 13. ACHIEVEMENT POPUP =====
function initAchievement(){
  var achieveEl=document.getElementById('achieve');
  var overlayEl=document.getElementById('overlay');
  if(!achieveEl)return;

  var achieved=false;
  window.addEventListener('scroll',function(){
    if(achieved)return;
    var h=document.documentElement.scrollHeight-window.innerHeight;
    if(h>0&&window.scrollY/h>0.85){
      achieved=true;
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
  });
}
initAchievement();

// ===== 14. EASTER EGGS =====
var easterEggShown={};
function checkEasterEggs(){
  // 5분 이스터에그
  if(pageSec===300&&!easterEggShown['5min']){
    easterEggShown['5min']=true;
    document.querySelectorAll('.easter-egg[data-trigger="5min"]').forEach(function(el){
      el.classList.add('revealed');
    });
    showRewardPopup('🥚','이스터에그 발견!','5분 동안 읽었더니 숨겨진 콘텐츠가 나타났어!');
    addXP(20);
  }
  // 10분 이스터에그
  if(pageSec===600&&!easterEggShown['10min']){
    easterEggShown['10min']=true;
    document.querySelectorAll('.easter-egg[data-trigger="10min"]').forEach(function(el){
      el.classList.add('revealed');
    });
    showRewardPopup('💎','레어 콘텐츠!','10분 독자에게만 공개되는 비밀 정보!');
    addXP(30);
    earnBadge('10min_reader','10분 이상 독서');
  }
}

// ===== 15. CONFETTI =====
function spawnConfetti(){
  var colors=['#C9A96E','#1E3A5F','#2DB400','#ff6b35','#ff9f1c','#e84393'];
  for(var i=0;i<30;i++){
    (function(delay){
      setTimeout(function(){
        var c=document.createElement('div');
        c.className='confetti-piece';
        c.style.left=Math.random()*100+'vw';
        c.style.top='-10px';
        c.style.width=(6+Math.random()*8)+'px';
        c.style.height=(6+Math.random()*8)+'px';
        c.style.background=colors[Math.floor(Math.random()*colors.length)];
        c.style.borderRadius=Math.random()>.5?'50%':'0';
        c.style.animationDuration=(2+Math.random()*2)+'s';
        document.body.appendChild(c);
        setTimeout(function(){c.remove()},4000);
      },delay);
    })(i*50);
  }
}

// ===== 16. BADGE SYSTEM =====
function earnBadge(id,name){
  if(data.badges.indexOf(id)!==-1)return;
  data.badges.push(id);
  save(data);
}

// ===== 17. WELCOME BACK / RESUME =====
function showWelcomeBack(){
  if(data.sessionCount<=1)return; // 첫 방문은 스킵
  if(data.totalTime<60)return; // 1분 미만은 스킵

  var totalMin=Math.floor(data.totalTime/60);
  var rb=document.getElementById('resumeBanner');
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

  setTimeout(function(){rb.classList.add('show')},1500);

  setTimeout(function(){
    var closeBtn=document.getElementById('rbClose');
    if(closeBtn)closeBtn.onclick=function(){rb.classList.remove('show')};
  },1600);

  // 8초 후 자동 닫기
  setTimeout(function(){rb.classList.remove('show')},9000);
}
showWelcomeBack();

// ===== 18. SCROLL MILESTONE REWARDS =====
var scrollMilestones={25:false,50:false,75:false,100:false};
window.addEventListener('scroll',function(){
  var p=updateProgress();
  if(p>=25&&!scrollMilestones[25]){scrollMilestones[25]=true;addXP(5);}
  if(p>=50&&!scrollMilestones[50]){scrollMilestones[50]=true;addXP(10);}
  if(p>=75&&!scrollMilestones[75]){scrollMilestones[75]=true;addXP(10);
    showRewardPopup('📖','75% 읽었어!','거의 다 왔다! 끝까지 읽으면 보너스 XP!');}
  if(p>=100&&!scrollMilestones[100]){scrollMilestones[100]=true;addXP(20);}
});

// ===== 19. IDLE DETECTION — 이탈 방지 =====
var idleTimer=0;
var idleShown=false;
function resetIdle(){idleTimer=0;idleShown=false;}
document.addEventListener('mousemove',resetIdle);
document.addEventListener('touchstart',resetIdle);
document.addEventListener('scroll',resetIdle);
document.addEventListener('keydown',resetIdle);

setInterval(function(){
  idleTimer++;
  if(idleTimer>=90&&!idleShown){ // 90초 무활동
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

// ===== 20. INITIAL XP UPDATE =====
addXP(0); // 레벨 배지 초기화

// ===== SAVE ON EXIT =====
window.addEventListener('beforeunload',function(){save(data)});

})();

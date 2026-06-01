// Dynamic base path — works on localhost (/mono-kwikar) and live root (/)
const _BASE = window.location.pathname
  .replace(/\/frontend\/.*$/, '')   // strip /frontend/...
  .replace(/\/[^/]*\.html$/, '')    // strip /filename.html if no /frontend/
  .replace(/\/$/, '');              // strip trailing slash so /+/path never becomes //path

/* ══════════ WELCOME MODAL ══════════ */
(function(){
  const modal       = document.getElementById('welcomeModal');
  const formState   = document.getElementById('welcomeFormState');
  const successState= document.getElementById('welcomeSuccessState');
  const input       = document.getElementById('welcomePincode');
  const submitBtn   = document.getElementById('welcomeSubmit');
  const skipBtn     = document.getElementById('welcomeSkip');       // skip on pincode step
  const skipAuth    = document.getElementById('welcomeContinue');   // "Skip for now" on auth step
  const loginBtn    = document.getElementById('welcomeLoginBtn');
  const errorEl     = document.getElementById('welcomeError');

  function showError(msg){
    errorEl.textContent=msg;
    errorEl.classList.add('show');
    input.classList.add('no');
    setTimeout(()=>input.classList.remove('no'),400);
  }
  function clearError(){
    errorEl.textContent='';
    errorEl.classList.remove('show');
    input.classList.remove('no');
  }
  function openWelcome(){
    successState.classList.remove('show');
    formState.classList.add('show');
    input.value='';
    clearError();
    modal.classList.add('show');
    document.body.classList.add('modal-open');
    setTimeout(()=>input.focus({preventScroll:true}),350);
  }
  function closeWelcome(){
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
  }

  // Digits only
  input.addEventListener('input',()=>{
    input.value=input.value.replace(/\D/g,'').slice(0,6);
    clearError();
  });
  input.addEventListener('keydown',e=>{if(e.key==='Enter')submitBtn.click()});

  submitBtn.addEventListener('click',async()=>{
    const pin=input.value.trim();
    if(!/^\d{6}$/.test(pin)){showError('Sahi 6-digit pincode daalo');return;}
    clearError();
    submitBtn.disabled=true;
    const orig=submitBtn.textContent;
    submitBtn.textContent='Saving…';
    try{
      localStorage.setItem('kwikar_welcome_pin', pin);
      localStorage.setItem('kwikar_pin_done','1');
      // Pre-fill in-page pincode checker
      const pinIn=document.getElementById('pinIn');
      if(pinIn)pinIn.value=pin;
      // Save anonymous pincode visit to DB (tracks area demand before auth)
      fetch(_BASE+'/backend/booking_api.php',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'check_pincode',pincode:pin})
      }).catch(()=>{});
      // Show auth options
      formState.classList.remove('show');
      successState.classList.add('show');
    }finally{
      submitBtn.disabled=false;
      submitBtn.textContent=orig;
    }
  });

  // Skip pincode step — just close (pincode NOT saved, will show again)
  skipBtn.addEventListener('click', closeWelcome);

  // Auth step — Login
  loginBtn.addEventListener('click',()=>{
    closeWelcome();
    setTimeout(()=>{ _loginRole='user'; openLoginModal(); },200);
  });

  // Auth step — Skip for now
  skipAuth.addEventListener('click',()=>closeWelcome());

  // Don't close modal by clicking backdrop on auth step (accidental dismiss)
  modal.addEventListener('click',e=>{
    if(e.target===modal && formState.classList.contains('show')) closeWelcome();
  });

  // Open only when needed
  function autoOpen(){
    // Logged-in customer → never ask pincode
    const u=localStorage.getItem('kwikar_user');
    if(u){ try{ const d=JSON.parse(u); if(d.role!=='tech') return; }catch(e){} }
    // Not logged in → only show if they haven't already submitted a pincode
    if(localStorage.getItem('kwikar_pin_done')) return;
    setTimeout(openWelcome,600);
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',autoOpen);
  } else {
    autoOpen();
  }
})();

/* ══════════ CAROUSEL ══════════ */
let cur=0,total=4,timer;
const track=document.getElementById('carouselTrack');
const slides=document.querySelectorAll('.carousel-slide');
const dots=document.querySelectorAll('.dot-btn');
const VIDEO_SLIDE=1; // index of the video slide

function _heroVideoPause(){
  const v=document.getElementById('heroVideo');
  if(v&&!v.paused){ v.pause(); }
}
function _heroVideoPlay(){
  const v=document.getElementById('heroVideo');
  if(!v)return;
  v.pause();
  v.currentTime=0;
  v.muted=true;
  document.getElementById('svpOverlay').style.display='';
  document.getElementById('svpControls').style.display='none';
}
function heroVideoStart(){
  // User tap — play with sound, hide big overlay, show controls
  const v=document.getElementById('heroVideo');
  if(!v)return;
  v.muted=false;
  v.play().then(()=>{
    document.getElementById('svpOverlay').style.display='none';
    document.getElementById('svpControls').style.display='';
    clearInterval(timer);
    v.onended=()=>{ goSlide(cur+1); };
  }).catch(()=>{});
}
function heroVideoPause(){
  const v=document.getElementById('heroVideo');
  if(v){ v.pause(); document.getElementById('svpControls').style.display='none'; document.getElementById('svpOverlay').style.display=''; resetTimer(); }
}
function heroVideoMuteToggle(){
  const v=document.getElementById('heroVideo');
  if(!v)return;
  v.muted=!v.muted;
  document.getElementById('svpUnmuteIcon').style.display=v.muted?'none':'';
  document.getElementById('svpMutedIcon').style.display=v.muted?'':'none';
}

function goSlide(n){
  slides[cur].classList.remove('active');
  dots[cur].classList.remove('active');
  _heroVideoPause();
  cur=(n+total)%total;
  slides[cur].classList.add('active');
  dots[cur].classList.add('active');
  track.style.transform=`translateX(-${cur*100}%)`;
  if(cur===VIDEO_SLIDE){ _heroVideoPlay(); clearInterval(timer); }
  else resetTimer();
}
function nextSlide(){goSlide(cur+1)}
function prevSlide(){goSlide(cur-1)}
function resetTimer(){clearInterval(timer);timer=setInterval(()=>{if(cur!==VIDEO_SLIDE)nextSlide();},5500)}

// Start on video slide
goSlide(VIDEO_SLIDE);

/* ══════════ TOUCH SWIPE ══════════ */
let ts=0;
track.addEventListener('touchstart',e=>{ts=e.touches[0].clientX},{passive:true});
track.addEventListener('touchend',e=>{const d=e.changedTouches[0].clientX-ts;if(Math.abs(d)>40)d<0?nextSlide():prevSlide()});

/* ══════════ COUNTDOWN 26 May 2026 ══════════ */
const LAUNCH=new Date('2026-05-26T00:00:00');
function tick(){
  const diff=LAUNCH-new Date();
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  if(diff<=0){['d-days','d-hrs','d-min','d-sec'].forEach(i=>set(i,'00'));return}
  set('d-days',String(Math.floor(diff/86400000)).padStart(2,'0'));
  set('d-hrs',String(Math.floor(diff%86400000/3600000)).padStart(2,'0'));
  set('d-min',String(Math.floor(diff%3600000/60000)).padStart(2,'0'));
  set('d-sec',String(Math.floor(diff%60000/1000)).padStart(2,'0'));
}
tick();setInterval(tick,1000);

/* ══════════ PINCODE ══════════ */
const BHAGALPUR={'812001':'India City Centre','812002':'Adampur','812003':'Nathnagar','812004':'Barari','812005':'Mayaganj','812006':'Champanagar','812007':'India Sadar','812008':'Sabour','812009':'Colgong','812010':'Kahalgaon Road Area','812011':'Bihpur','812012':'Pirpainti','813101':'Banka','813102':'Amarpur','813104':'Katoria','813202':'Sultanganj','813214':'Kahalgaon','813221':'Naugachhia'};
function resetPin(){
  const f=document.getElementById('pinIn');
  f.value=f.value.replace(/\D/g,'');
  f.classList.remove('ok','no');
  ['r-ok','r-out','r-err'].forEach(id=>document.getElementById(id).classList.remove('show'));
  document.getElementById('bookCta')?.classList.remove('show');
  document.getElementById('nForm')?.classList.remove('show');
  document.getElementById('nDone')?.classList.remove('show');
}
function checkPin(){
  const pin=document.getElementById('pinIn').value.trim();
  resetPin();
  if(!/^\d{6}$/.test(pin)){document.getElementById('pinIn').classList.add('no');document.getElementById('r-err').classList.add('show');return}
  const bookCta=document.getElementById('bookCta');
  if(BHAGALPUR[pin]){
    document.getElementById('pinIn').classList.add('ok');
    document.getElementById('r-ok-s').textContent='📍 '+BHAGALPUR[pin]+' — Service available in your area! Get a verified technician at your doorstep.';
    document.getElementById('r-ok').classList.add('show');
    bookCta.classList.add('show');
  } else if(pin.startsWith('812')||pin.startsWith('813')){
    document.getElementById('pinIn').classList.add('ok');
    document.getElementById('r-ok-s').textContent='📍 '+pin+' — India-adjacent area! Coming to your locality very soon.';
    document.getElementById('r-ok').classList.add('show');
  } else {
    document.getElementById('pinIn').classList.add('no');
    document.getElementById('r-out').classList.add('show');
  }
}
function submitNotify(){
  const n=document.getElementById('nName').value.trim();
  const p=document.getElementById('nPhone').value.trim();
  if(!n){document.getElementById('nName').focus();return}
  if(!p||p.replace(/\D/g,'').length<10){document.getElementById('nPhone').focus();return}
  // Queue for background sync if offline
  queueFormData('kwikar-notify-queue',{name:n,phone:p,email:document.getElementById('nEmail').value,pincode:document.getElementById('pinIn').value,ts:Date.now()});
  document.getElementById('nForm').style.display='none';
  document.getElementById('nDone').classList.add('show');
  setTimeout(()=>document.getElementById('push-prompt').classList.add('show'),1500);
}

/* ══════════ TECH FORM ══════════ */
function submitTech(){
  const name=document.getElementById('tf-name').value.trim();
  const phone=document.getElementById('tf-phone').value.trim();
  const city=document.getElementById('tf-city').value.trim();
  const pin=document.getElementById('tf-pin').value.trim();
  const exp=document.getElementById('tf-exp').value;
  const skills=[...document.querySelectorAll('input[name="skill"]:checked')].map(i=>i.value);
  if(!name){document.getElementById('tf-name').focus();return}
  if(!phone||phone.replace(/\D/g,'').length<10){document.getElementById('tf-phone').focus();return}
  if(!city){document.getElementById('tf-city').focus();return}
  if(!/^\d{6}$/.test(pin)){document.getElementById('tf-pin').focus();return}
  if(!exp){document.getElementById('tf-exp').focus();return}
  if(!skills.length){alert('Please select at least one skill.');return}
  queueFormData('kwikar-tech-queue',{name,phone,email:document.getElementById('tf-email').value,city,pin,exp,skills,idType:document.getElementById('tf-id').value,about:document.getElementById('tf-about').value,ts:Date.now()});
  document.getElementById('techFormBox').style.display='none';
  document.getElementById('techSuccess').classList.add('show');
}

/* ══════════ NAV SCROLL ══════════ */
window.addEventListener('scroll',()=>document.getElementById('mainNav').classList.toggle('scrolled',scrollY>20));

/* ══════════ MOBILE DRAWER ══════════ */
const burger=document.getElementById('navBurger');
const drawer=document.getElementById('mobile-drawer');
function toggleDrawer(open){
  const next=open??!drawer.classList.contains('show');
  drawer.classList.toggle('show',next);
  burger.classList.toggle('open',next);
  burger.setAttribute('aria-expanded',String(next));
  document.body.style.overflow=next?'hidden':'';
}
burger.addEventListener('click',()=>toggleDrawer());
drawer.addEventListener('click',e=>{if(e.target===drawer)toggleDrawer(false)});
drawer.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>toggleDrawer(false)));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drawer.classList.contains('show'))toggleDrawer(false)});

/* Mobile top bar — menu opens drawer, search jumps to services */
const mtbMenuBtn=document.getElementById('mtbMenuBtn');
if(mtbMenuBtn)mtbMenuBtn.addEventListener('click',()=>toggleDrawer());
const mdClose=document.getElementById('mdClose');
if(mdClose)mdClose.addEventListener('click',()=>{drawer.classList.remove('show');});
const mtbSearch=document.getElementById('mtbSearch');
if(mtbSearch)mtbSearch.addEventListener('click',()=>document.getElementById('services')?.scrollIntoView({behavior:'smooth',block:'start'}));

/* ══════════ TECHNICIAN MODAL ══════════ */
const techModal=document.getElementById('techModal');
const techModalClose=document.getElementById('techModalClose');
function openTechModal(){
  techModal.classList.add('show');
  techModal.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
  if(drawer.classList.contains('show'))toggleDrawer(false);
  setTimeout(()=>document.getElementById('tf-name')?.focus({preventScroll:true}),300);
}
function closeTechModal(){
  techModal.classList.remove('show');
  techModal.setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');
}
techModalClose.addEventListener('click',closeTechModal);
techModal.addEventListener('click',e=>{if(e.target===techModal)closeTechModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&techModal.classList.contains('show'))closeTechModal()});
document.querySelectorAll('a[href="#technician"]').forEach(a=>{
  a.addEventListener('click',e=>{e.preventDefault();openTechModal()});
});

/* ══════════ SEARCH ══════════ */
const SERVICES=[
  {id:'ac',name:'AC Repair',sub:'Cooling, Cleaning, Gas Refill',img:'https://image.qwenlm.ai/public_source/0992fe8d-20a7-4f1a-a776-4061a6cbefd5/17a584e4b-6224-4818-abb0-bffc1b5a0991.png'},
  {id:'fridge',name:'Refrigerator',sub:'Cooling, Compressor, Gas',img:'https://image.qwenlm.ai/public_source/0992fe8d-20a7-4f1a-a776-4061a6cbefd5/1428e2381-2d29-4a10-9479-988bf2c62fde.png'},
  {id:'washing',name:'Washing Machine',sub:'Spin, Drain, Motor',img:'https://image.qwenlm.ai/public_source/0992fe8d-20a7-4f1a-a776-4061a6cbefd5/1cf6d8693-f778-4992-b5b7-fd667000bfd4.png'},
  {id:'tv',name:'Television',sub:'Screen, Sound, Display',img:'https://image.qwenlm.ai/public_source/0992fe8d-20a7-4f1a-a776-4061a6cbefd5/1fe1b2539-b2c5-4372-9c86-f2ac2c7a5bac.png'},
  {id:'ro',name:'RO Purifier',sub:'Water Flow, Filter, TDS',img:'https://image.qwenlm.ai/public_source/0992fe8d-20a7-4f1a-a776-4061a6cbefd5/1307feaba-a78b-4cf0-ad09-5ef0e5e8f0b4.png'},
  {id:'geyser',name:'Geyser',sub:'Heating, Leaking, Motor',img:'https://image.qwenlm.ai/public_source/0992fe8d-20a7-4f1a-a776-4061a6cbefd5/101150c48-08ec-42cb-bb9b-428988ab1f9a.png'},
  {id:'microwave',name:'Microwave',sub:'Heating, Door, Turntable',img:'https://image.qwenlm.ai/public_source/0992fe8d-20a7-4f1a-a776-4061a6cbefd5/1961ad9f4-64bd-4c25-949e-f2aca885ceb1.png'},
  {id:'other',name:'Others',sub:'Koi bhi aur appliance',img:''}
];
function openSearch(){
  document.getElementById('srchOverlay').classList.add('show');
  setTimeout(()=>document.getElementById('srchInput').focus(),100);
  renderSearch('');
}
function closeSearch(){
  document.getElementById('srchOverlay').classList.remove('show');
  document.getElementById('srchInput').value='';
}
function filterSearch(q){renderSearch(q.toLowerCase().trim())}
function renderSearch(q){
  const res=document.getElementById('srchResults');
  const list=q?SERVICES.filter(s=>s.name.toLowerCase().includes(q)||s.sub.toLowerCase().includes(q)):SERVICES;
  if(!list.length){res.innerHTML='<div class="srch-empty">Koi result nahi mila 😔</div>';return;}
  res.innerHTML=list.map(s=>`
    <div class="srch-item" onclick="bookService('${s.id}')">
      ${s.img?`<img class="srch-item-img" src="${s.img}" alt="${s.name}">`:'<div class="srch-item-img" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem">🔧</div>'}
      <div><div class="srch-item-name">${s.name}</div><div class="srch-item-sub">${s.sub}</div></div>
    </div>`).join('');
}

/* ══════════ PROFILE & BOOKINGS ══════════ */
function openProfModal(){
  const u=JSON.parse(localStorage.getItem('kwikar_user')||'{}');
  document.getElementById('profName').textContent=u.name||'';
  document.getElementById('profPhone').textContent=u.phone||'';
  const addrParts=[u.address,u.city,u.pincode].filter(Boolean);
  document.getElementById('profAddress').textContent=addrParts.join(', ')||'Tap to add address';
  document.getElementById('profOverlay').classList.add('show');
}
function closeProfModal(){document.getElementById('profOverlay').classList.remove('show');}

function openProfileEdit(){
  const u=JSON.parse(localStorage.getItem('kwikar_user')||'{}');
  document.getElementById('peNameVal').textContent=u.name||'';
  document.getElementById('pePhoneVal').textContent=u.phone||'';
  document.getElementById('peAddress').value=u.address||'';
  document.getElementById('peCity').value=u.city||'';
  document.getElementById('pePincode').value=u.pincode||'';
  document.getElementById('peErr').textContent='';
  document.getElementById('profEditOverlay').classList.add('show');
}

function closeProfEdit(){
  document.getElementById('profEditOverlay').classList.remove('show');
}

async function saveProfileAddress(){
  const address=document.getElementById('peAddress').value.trim();
  const city   =document.getElementById('peCity').value.trim();
  const pincode=document.getElementById('pePincode').value.trim();
  const err    =document.getElementById('peErr');
  const btn    =document.getElementById('peSaveBtn');
  if(!address){err.textContent='Address daalna zaroori hai';return;}
  if(!city)   {err.textContent='Shehar ka naam daalo';return;}
  if(!/^\d{6}$/.test(pincode)){err.textContent='Sahi 6-digit pincode daalo';return;}
  err.textContent='';
  btn.disabled=true;
  const orig=btn.textContent;
  btn.textContent='Saving…';
  try{
    const u=JSON.parse(localStorage.getItem('kwikar_user')||'{}');
    const res=await fetch(_BASE+'/backend/user_api.php?action=update_address',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({phone:u.phone,address,city,pincode})
    });
    const data=await res.json();
    if(!data.success){err.textContent=data.error||'Save nahi ho paya';return;}
    const updated={...u,address,city,pincode};
    localStorage.setItem('kwikar_user',JSON.stringify(updated));
    const addrParts=[address,city,pincode].filter(Boolean);
    document.getElementById('profAddress').textContent=addrParts.join(', ');
    closeProfEdit();
  }catch(e){
    err.textContent='Server se connect nahi ho paya — dobara try karo';
  }finally{
    btn.disabled=false;
    btn.textContent=orig;
  }
}
function logoutUser(){
  localStorage.removeItem('kwikar_user');
  localStorage.removeItem('kwikar_pin_done');
  if(window._greetTimer){clearInterval(window._greetTimer);window._greetTimer=null;}
  const lb=document.getElementById('loginBtn');
  const nlb=document.getElementById('navLoginBtn');
  if(lb)lb.style.display='';
  if(nlb)nlb.style.display='';
  const mob=document.getElementById('mtbUserInfo');
  const nav=document.getElementById('navUserInfo');
  if(mob)mob.style.display='none';
  if(nav)nav.style.display='none';
  // Hide mobile bottom nav and restore footer
  const mbn=document.getElementById('mobBottomNav');
  if(mbn)mbn.classList.remove('show');
  const ft=document.querySelector('footer');
  if(ft)ft.classList.remove('nav-shown');
  closeProfModal();
}
function openBookingsModal(){openBookingsSheet();}
function openBookingsSheet(){document.getElementById('bookingsOverlay').classList.add('show');loadBookings();}
function closeBookingsModal(){document.getElementById('bookingsOverlay').classList.remove('show');}
function closeBkDetail(){document.getElementById('bkDetailOverlay').classList.remove('show');}

function isSlotExpired(b){
  if(!b.slot_date||!b.slot_time) return false;
  try{
    const MONTHS_MAP={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
    const parts=b.slot_date.trim().split(' ');
    const day=parseInt(parts[0]);const mon=MONTHS_MAP[parts[1]];const yr=parseInt(parts[2]);
    const endMatch=b.slot_time.match(/–\s*(\d+):(\d+)\s*(AM|PM)/i);
    if(!endMatch) return false;
    let h=parseInt(endMatch[1]),m=parseInt(endMatch[2]);
    const ampm=endMatch[3].toUpperCase();
    if(ampm==='PM'&&h!==12)h+=12;
    if(ampm==='AM'&&h===12)h=0;
    const slotEnd=new Date(yr,mon,day,h,m,0);
    return Date.now()>slotEnd.getTime();
  }catch(e){return false;}
}

let _openBkDetailData = null;

function openBkDetail(b){
  _openBkDetailData = b;
  _renderBkDetail(b);
  document.getElementById('bkDetailOverlay').classList.add('show');
}

function _renderBkDetail(b){
  const status=b.status||'new';
  const isPending=['new','broadcasted','pending'].includes(status);
  const isAccepted=['accepted','assigned','arrived','ongoing','completed'].includes(status);
  const isCancelled=status==='cancelled';
  const expired=isPending&&isSlotExpired(b);
  const canCancel=isPending&&!expired;

  const statusMap={
    new:       {label:'Waiting for Technician', cls:'bkst-pending'},
    broadcasted:{label:'Waiting for Technician',cls:'bkst-pending'},
    pending:   {label:'Waiting for Technician', cls:'bkst-pending'},
    accepted:  {label:'Technician is on the way',cls:'bkst-confirmed'},
    assigned:  {label:'Technician Assigned',    cls:'bkst-confirmed'},
    arrived:   {label:'Technician Arrived',     cls:'bkst-confirmed'},
    ongoing:   {label:'Work in Progress',       cls:'bkst-confirmed'},
    completed: {label:'Completed',              cls:'bkst-done'},
    cancelled: {label:'Cancelled',              cls:'bkst-cancelled'},
  };
  const st=statusMap[status]||{label:status,cls:'bkst-pending'};

  // Technician card
  const techBlock = isAccepted && b.technician_name ? `
    <div class="bkd-tech-card">
      <div class="bkd-tech-avatar">${b.technician_name.charAt(0).toUpperCase()}</div>
      <div class="bkd-tech-info">
        <div class="bkd-tech-label">Assigned Technician</div>
        <div class="bkd-tech-name">${b.technician_name}</div>
      </div>
      <a class="bkd-call-btn" href="tel:${b.technician_phone}" aria-label="Call technician">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l.96-.96a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      </a>
    </div>` : '';

  // Verification codes
  const codesBlock = (b.happy_code && b.sad_code) ? `
    <div class="bkd-codes-wrap">
      <div class="bkd-codes-label">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Share verification code with technician
      </div>
      <div class="bkd-codes-row">
        <div class="bkd-code bkd-code-happy">
          <span class="bkd-code-lbl">Happy Code</span>
          <span class="bkd-code-val">${b.happy_code}</span>
        </div>
        <div class="bkd-code bkd-code-sad">
          <span class="bkd-code-lbl">Sad Code</span>
          <span class="bkd-code-val">${b.sad_code}</span>
        </div>
      </div>
    </div>` : '';

  // Searching state
  const searchBlock=`
    <div class="bkd-searching">
      <div class="bkd-spin"></div>
      <div class="bkd-searching-text">Finding a technician for you</div>
      <div class="bkd-searching-sub">We'll notify you once a technician accepts your request</div>
    </div>`;

  // Expired state
  const expiredBlock=`
    <div class="bkd-sorry">
      <div class="bkd-sorry-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <div class="bkd-sorry-title">No Technician Found</div>
      <div class="bkd-sorry-sub">No technician was available for your selected slot. Would you like to reschedule?</div>
      <button class="bkd-reschedule-btn" onclick="closeBkDetail();window.location.href='booking.html?service=${encodeURIComponent(b.service)}'">Reschedule Booking</button>
    </div>`;

  // Cancelled state
  const cancelledBlock=`<div class="bkd-cancelled">Booking has been cancelled</div>`;

  const infoRows=`
    <div class="bkd-info-rows">
      ${b.slot_time?`<div class="bkd-info-row">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>${b.slot_time}</span>
      </div>`:''}
      ${b.slot_date?`<div class="bkd-info-row">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span>${b.slot_date}</span>
      </div>`:''}
      ${!expired&&!isCancelled?`<div class="bkd-info-row bkd-status-row">
        <div class="bkd-status-badge ${st.cls}">${st.label}</div>
      </div>`:''}
    </div>`;

  document.getElementById('bkDetailContent').innerHTML=`
    <div class="bkd-head">
      <div class="bkd-service">${b.service} Service</div>
      <div class="bkd-issue">${b.issue}${b.other_issue?' — '+b.other_issue:''}</div>
    </div>
    <div class="bkd-body">
      ${isCancelled ? cancelledBlock : isAccepted ? techBlock+codesBlock : expired ? expiredBlock : searchBlock}
      ${infoRows}
      ${canCancel?`<button type="button" class="bkd-cancel-btn" id="bkCancelBtn" onclick="cancelBooking(${b.id})">Cancel Booking</button>`:''}
    </div>
  `;
}

async function cancelBooking(id){
  if(!confirm('Kya aap is booking ko cancel karna chahte hain?'))return;
  const u=JSON.parse(localStorage.getItem('kwikar_user')||'{}');
  if(!u.phone){alert('Pehle login karo');return;}
  const btn=document.getElementById('bkCancelBtn');
  if(btn){btn.disabled=true;btn.textContent='Cancelling...';}
  try{
    const res=await fetch(_BASE+'/backend/user_api.php?action=cancel_booking',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({id:id,phone:u.phone})
    });
    const json=await res.json();
    if(json.success){
      closeBkDetail();
      loadBookings();
      refreshBookingBadge();
    }else{
      alert(json.error||'Cancel nahi ho paya');
      if(btn){btn.disabled=false;btn.textContent='❌ Booking Cancel Karo';}
    }
  }catch(e){
    alert('Network error — dobara try karo');
    if(btn){btn.disabled=false;btn.textContent='❌ Booking Cancel Karo';}
  }
}
async function loadBookings(){
  const u=JSON.parse(localStorage.getItem('kwikar_user')||'{}');
  const list=document.getElementById('bookingsList');
  if(!u.phone){list.innerHTML='<div class="bookings-empty">Pehle login karo</div>';return;}
  list.innerHTML='<div class="bookings-empty">Loading...</div>';
  try{
    const res=await fetch(_BASE+'/backend/user_api.php?action=get_bookings&phone='+encodeURIComponent(u.phone));
    const json=await res.json();
    if(!json.success||!json.bookings.length){list.innerHTML='<div class="bookings-empty">Abhi tak koi booking nahi 😊<br>Pehli booking karo!</div>';return;}
    // Update badge
    updateBookingBadge(json.bookings.length);
    // Render clickable cards
    list.innerHTML=json.bookings.map((b,idx)=>{
      const status=b.status||'pending';
      const isPending=status==='pending';
      const isCancelled=status==='cancelled';
      const expired=isPending&&isSlotExpired(b);
      const statusClass=isCancelled?'cancelled':!isPending?'confirmed':expired?'reschedule':'pending';
      const statusLabel=isCancelled?'❌ Cancelled':!isPending?'✅ Confirmed':expired?'🔄 Reschedule':'⏳ Pending';
      return`<div class="booking-card" style="cursor:pointer" onclick='openBkDetail(${JSON.stringify(b)})'>
        <div class="booking-service">${b.service} Service</div>
        <div class="booking-issue">${b.issue}${b.other_issue?' — '+b.other_issue:''}</div>
        <div class="booking-meta">
          ${b.slot_time?`<span class="booking-tag">⏰ ${b.slot_time}</span>`:''}
          ${b.slot_date?`<span class="booking-tag">📅 ${b.slot_date}</span>`:''}
          <span class="booking-status ${statusClass}">${statusLabel}</span>
        </div>
      </div>`;
    }).join('');
  }catch(e){list.innerHTML='<div class="bookings-empty">Load nahi ho paya 😔</div>';}
}

function updateBookingBadge(count){
  const badge=document.getElementById('bookingBadge');
  if(!badge)return;
  if(count>0){badge.textContent=count>99?'99+':count;badge.style.display='flex';}
  else{badge.style.display='none';}
}
async function refreshBookingBadge(){
  const u=localStorage.getItem('kwikar_user');
  if(!u)return;
  try{
    const p=JSON.parse(u).phone;
    const res=await fetch(_BASE+'/backend/user_api.php?action=get_bookings&phone='+encodeURIComponent(p));
    const json=await res.json();
    if(json.success)updateBookingBadge(json.bookings.length);
  }catch(e){}
}

/* ══════════ LOGIN ══════════ */
/* ── Login role tracker ── */
let _loginRole='user'; // 'user' | 'tech' | 'abd'
let _pendingRole=null;

function selectRoleCard(role){
  _pendingRole=role;
  const userCard=document.getElementById('lrcCardUser');
  const techCard=document.getElementById('lrcCardTech');
  if(userCard) userCard.classList.toggle('lrc-selected',role==='user');
  if(techCard) techCard.classList.toggle('lrc-selected',role==='tech');
  const btn=document.getElementById('lrcContinueBtn');
  if(btn){ btn.classList.add('lrc-active'); }
  const labels={'user':'Login as Customer','tech':'Login as Technician','abd':'Login as ABD','admin':'Login as Admin'};
  const btnText=document.getElementById('lrcBtnText');
  if(btnText) btnText.textContent=labels[role]||'Continue';
}
function confirmRoleSelect(){
  if(_pendingRole)selectRole(_pendingRole);
}

function _showOnly(id){
  ['loginRoleView','loginPhoneView','loginPinView','loginRegStep1','loginRegStep2','loginRegStep3','loginTechRegView','abdRegView','loginAdminView']
    .forEach(v=>{const el=document.getElementById(v);if(el)el.style.display=v===id?'':'none';});
  document.getElementById('loginBox').classList.toggle('scrollable',id==='loginTechRegView'||id==='loginRegStep2'||id==='abdRegView');
}

function openLoginModal(){
  _loginRole='user';
  _pendingRole=null;
  _showOnly('loginRoleView');
  const userCard=document.getElementById('lrcCardUser');
  const techCard=document.getElementById('lrcCardTech');
  if(userCard) userCard.classList.remove('lrc-selected');
  if(techCard) techCard.classList.remove('lrc-selected');
  const btn=document.getElementById('lrcContinueBtn');
  if(btn){ btn.classList.remove('lrc-active'); }
  const btnText=document.getElementById('lrcBtnText');
  if(btnText) btnText.textContent='Continue';
  document.getElementById('loginOverlay').classList.add('show');
}
function closeLoginModal(){
  document.getElementById('loginOverlay').classList.remove('show');
  document.getElementById('loginBox').classList.remove('scrollable');
}
function openLoginAs(role){
  openLoginModal();
  selectRoleCard(role);
  confirmRoleSelect();
}

function selectRole(role){
  _loginRole=role;
  if(role==='admin'){
    _showOnly('loginAdminView');
    const em=document.getElementById('adminEmail');
    if(em){em.value='';em.focus();}
    const pe=document.getElementById('adminPassword');
    if(pe) pe.value='';
    document.getElementById('adminLoginErr').textContent='';
    return;
  }
  _showOnly('loginPhoneView');
  document.getElementById('loginPhoneOnly').value='';
  document.getElementById('loginPhoneErr').textContent='';
  if(role==='tech'){
    document.getElementById('loginPhoneTitle').textContent='Technician Login';
    document.getElementById('loginPhoneSub').textContent='Apna registered mobile number daalo';
    document.getElementById('loginNewLabel').textContent='New Technician?';
  }else if(role==='abd'){
    document.getElementById('loginPhoneTitle').textContent='ABD Login';
    document.getElementById('loginPhoneSub').textContent='Apna registered mobile number daalo';
    document.getElementById('loginNewLabel').textContent='New ABD?';
  }else{
    document.getElementById('loginPhoneTitle').textContent='Customer Login';
    document.getElementById('loginPhoneSub').textContent='Apna registered mobile number daalo';
    document.getElementById('loginNewLabel').textContent='New Customer?';
  }
  // If user came from "Naya Account Banao", jump straight to register flow
  if(window._registerAfterRole){
    window._registerAfterRole = false;
    setTimeout(()=>switchToRegister(),120);
    return;
  }
  setTimeout(()=>document.getElementById('loginPhoneOnly').focus(),100);
}

function switchToRoleSelect(){_showOnly('loginRoleView');}

/* ── Admin Auth ─────────────────────────────────────────────────── */
function switchAdminTab(tab){
  const isLogin = tab === 'login';
  document.getElementById('adminTabLogin').classList.toggle('active', isLogin);
  document.getElementById('adminTabReg').classList.toggle('active', !isLogin);
  document.getElementById('adminLoginForm').style.display = isLogin ? '' : 'none';
  document.getElementById('adminRegForm').style.display  = isLogin ? 'none' : '';
  document.getElementById('adminLoginErr').textContent = '';
  document.getElementById('adminRegErr').textContent   = '';
}

async function submitAdminLogin(){
  const email = (document.getElementById('adminEmail')?.value || '').trim();
  const pin   = (document.getElementById('adminPin')?.value   || '').trim();
  const errEl = document.getElementById('adminLoginErr');
  const btn   = document.getElementById('adminLoginBtn');

  errEl.textContent = '';
  if (!email || !pin) { errEl.textContent = 'Email aur PIN required hai'; return; }
  if (!/^\d{4,6}$/.test(pin)) { errEl.textContent = 'PIN 4-6 digits ka hona chahiye'; return; }

  btn.disabled = true;
  const orig = btn.textContent;
  btn.textContent = 'Logging in…';
  try {
    const res  = await fetch(_BASE + '/admin/backend/api/api.php?module=login', {
      method:'POST', headers:{'Content-Type':'application/json'},
      credentials:'include', body:JSON.stringify({email, pin})
    });
    const data = await res.json();
    if (data.success) {
      try { localStorage.setItem('kw_admin', JSON.stringify(data.admin)); } catch(_) {}
      closeLoginModal();
      window.location.href = _BASE + '/admin/frontend/';
    } else {
      errEl.textContent = data.error || 'Login failed';
    }
  } catch(e) {
    errEl.textContent = 'Server error: ' + e.message;
  } finally {
    btn.disabled = false; btn.textContent = orig;
  }
}

async function submitAdminRegister(forceReset = false){
  const name  = (document.getElementById('adminRegName')?.value  || '').trim();
  const email = (document.getElementById('adminRegEmail')?.value  || '').trim();
  const pin   = (document.getElementById('adminRegPin')?.value    || '').trim();
  const errEl = document.getElementById('adminRegErr');
  const btn   = document.getElementById('adminRegBtn');

  errEl.textContent = '';
  if (!name || !email || !pin) { errEl.textContent = 'Sabhi fields required hain'; return; }
  if (!/^\d{4,6}$/.test(pin)) { errEl.textContent = 'PIN 4-6 digits ka hona chahiye'; return; }

  btn.disabled = true;
  const orig = btn.textContent;
  btn.textContent = forceReset ? 'Resetting…' : 'Creating account…';
  try {
    const url = _BASE + '/admin/backend/api/api.php?module=register';
    const res  = await fetch(url, {
      method:'POST', headers:{'Content-Type':'application/json'},
      credentials:'include', body:JSON.stringify({name, email, pin, force_reset: forceReset})
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch(_) { errEl.textContent = 'Server returned invalid response (status '+res.status+').'; return; }
    if (data.success) {
      try { localStorage.setItem('kw_admin', JSON.stringify(data.admin)); } catch(_) {}
      closeLoginModal();
      window.location.href = _BASE + '/admin/frontend/';
    } else if (data.can_reset && !forceReset) {
      // Show reset option
      errEl.innerHTML = 'Admin already exists. <a href="#" onclick="submitAdminRegister(true);return false;" style="color:#6366f1;font-weight:600;">Reset &amp; Register with these credentials →</a>';
    } else {
      errEl.textContent = data.error || 'Registration failed';
    }
  } catch(e) {
    errEl.textContent = 'Network error: ' + e.message;
  } finally {
    btn.disabled = false; btn.textContent = orig;
  }
}

function switchToRegister(){
  const ph=document.getElementById('loginPhoneOnly').value.trim();
  if(_loginRole==='tech'){
    closeLoginModal();
    openTechSignup();
    if(ph){const el=document.getElementById('tsPhone');if(el)el.value=ph;}
  }else if(_loginRole==='abd'){
    closeLoginModal();
    openAbdSignup();
    if(ph){const el=document.getElementById('abdPhone');if(el)el.value=ph;}
  }else{
    _showOnly('loginRegStep1');
    document.getElementById('regErr1').textContent='';
    if(ph)document.getElementById('regPhone').value=ph;
    setTimeout(()=>document.getElementById('regName').focus(),100);
  }
}
function switchToLogin(){
  _showOnly('loginPhoneView');
  setTimeout(()=>document.getElementById('loginPhoneOnly').focus(),100);
}
function backToRegStep1(){
  _showOnly('loginRegStep1');
  setTimeout(()=>document.getElementById('regName').focus(),100);
}
function backToRegStep2(){
  _showOnly('loginRegStep2');
  setTimeout(()=>document.getElementById('regAddress').focus(),100);
}

function backToLoginPhone(){
  _showOnly('loginPhoneView');
  document.getElementById('loginPinErr').textContent='';
  setTimeout(()=>document.getElementById('loginPhoneOnly').focus(),100);
}

async function submitLoginPhone(){
  const phone=document.getElementById('loginPhoneOnly').value.trim();
  const err=document.getElementById('loginPhoneErr');
  if(!/^\d{10}$/.test(phone)){err.textContent='Sahi 10-digit number daalo';return;}
  err.textContent='';
  const isTech=_loginRole==='tech';
  const isAbd=_loginRole==='abd';
  const pinInput=document.getElementById('loginPinInput');
  pinInput.maxLength=(isTech||isAbd)?6:4;
  pinInput.value='';
  pinInput.placeholder=(isTech||isAbd)?'6-digit PIN':'4-digit PIN';
  document.getElementById('loginPinSub').textContent=isTech
    ? 'Apna 6-digit technician PIN daalo'
    : isAbd ? 'Apna 6-digit ABD PIN daalo'
    : 'Apna 4-digit PIN daalo';
  document.getElementById('loginPinErr').textContent='';
  _showOnly('loginPinView');
  setTimeout(()=>pinInput.focus(),100);
}

async function submitLoginPin(){
  const phone=document.getElementById('loginPhoneOnly').value.trim().replace(/\D/g,'').slice(-10);
  const pin=document.getElementById('loginPinInput').value.trim();
  const err=document.getElementById('loginPinErr');
  const btn=document.getElementById('loginPinBtn');
  const isTech=_loginRole==='tech';
  const isAbd=_loginRole==='abd';
  const expectedLen=(isTech||isAbd)?6:4;
  if(!new RegExp('^\\d{'+expectedLen+'}$').test(pin)){
    err.textContent=`${expectedLen}-digit PIN daalo`;
    return;
  }
  err.textContent='';
  btn.disabled=true;
  const orig=btn.textContent;
  btn.textContent='Verifying…';
  try{
    if(isAbd){
      const res=await fetch(_BASE+'/abd/backend/api/api.php?module=login',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({phone,pin})
      });
      const data=await res.json();
      if(!data.success){err.textContent=data.error||'Login nahi ho paya';return;}
      const abdData={...data.abd,phone,role:'abd'};
      localStorage.setItem('kwikar_abd',JSON.stringify(abdData));
      closeLoginModal();
      redirectToAbdPanel(abdData.full_name||abdData.name||'',phone);
      return;
    }
    const action=isTech?'verify_tech_pin':'login';
    const res=await fetch(_BASE+'/backend/user_api.php?action='+action,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({phone,pin})
    });
    const data=await res.json();
    if(!data.success){err.textContent=data.error||'Login nahi ho paya';return;}
    if(isTech){
      const t=data.technician||{};
      const techData={...t,phone:t.phone||phone,role:'tech'};
      const registry=JSON.parse(localStorage.getItem('kwikar_tech_registry')||'{}');
      registry[phone]=techData;
      localStorage.setItem('kwikar_tech_registry',JSON.stringify(registry));
      closeLoginModal();
      redirectToTechPanel(techData.name,techData.phone||phone,techData.email||'',techData.skills||techData.service_category||'');
    }else{
      const u={...(data.user||{}),role:'user'};
      localStorage.setItem('kwikar_user',JSON.stringify(u));
      applyLogin(u.name,'user');closeLoginModal();refreshBookingBadge();
    }
  }catch(e){
    err.textContent='Server se connect nahi ho paya — dobara try karo';
  }finally{
    btn.disabled=false;btn.textContent=orig;
  }
}

function submitRegStep1(){
  const name=document.getElementById('regName').value.trim();
  const phone=document.getElementById('regPhone').value.trim();
  const err=document.getElementById('regErr1');
  if(!name){err.textContent='Naam daalna zaroori hai';return;}
  if(!/^\d{10}$/.test(phone)){err.textContent='Sahi 10-digit number daalo';return;}
  err.textContent='';
  _showOnly('loginRegStep2');
  const savedPin=localStorage.getItem('kwikar_welcome_pin');
  if(savedPin){const pf=document.getElementById('regPincode');if(pf&&!pf.value)pf.value=savedPin;}
  setTimeout(()=>document.getElementById('regAddress').focus(),100);
}

function submitRegStep2(){
  const address=document.getElementById('regAddress').value.trim();
  const city=document.getElementById('regCity').value.trim();
  const pincode=document.getElementById('regPincode').value.trim();
  const err=document.getElementById('regErr2');
  if(!address){err.textContent='Address daalna zaroori hai';return;}
  if(!city){err.textContent='Shehar ka naam daalo';return;}
  if(!/^\d{6}$/.test(pincode)){err.textContent='6-digit pincode daalo';return;}
  err.textContent='';
  document.getElementById('regErr3').textContent='';
  document.getElementById('regPin').value='';
  document.getElementById('regPinConfirm').value='';
  _showOnly('loginRegStep3');
  setTimeout(()=>document.getElementById('regPin').focus(),100);
}

async function submitRegStep3(){
  const pin=document.getElementById('regPin').value.trim();
  const pinConfirm=document.getElementById('regPinConfirm').value.trim();
  const err=document.getElementById('regErr3');
  if(!/^\d{4}$/.test(pin)){err.textContent='4-digit PIN daalo';return;}
  if(pin!==pinConfirm){err.textContent='Dono PIN match nahi kar rahe';return;}
  err.textContent='';
  const name=document.getElementById('regName').value.trim();
  const phone=document.getElementById('regPhone').value.trim();
  const email=document.getElementById('regEmail').value.trim();
  const address=document.getElementById('regAddress').value.trim();
  const city=document.getElementById('regCity').value.trim();
  const pincode=document.getElementById('regPincode').value.trim();
  const userData={name,phone,email,address,city,pincode,role:'user'};
  // Local cache (no PIN stored locally)
  localStorage.setItem('kwikar_user',JSON.stringify(userData));
  localStorage.setItem('kwikar_pin_done','1');
  try{
    const res=await fetch(_BASE+'/backend/user_api.php?action=register',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({...userData,pin})
    });
    const json=await res.json();
    if(!json.success){err.textContent=json.error||'Save nahi ho paya';return;}
    // Store user_id so booking API can link bookings to this account
    if(json.user?.id) userData.user_id=json.user.id;
  }catch(e){err.textContent='Server error — dobara try karo';return;}
  localStorage.setItem('kwikar_user',JSON.stringify(userData));
  applyLogin(name,'user');closeLoginModal();refreshBookingBadge();
  showAbdRegSuccess();
}

async function submitTechReg(){
  const name=document.getElementById('ltr-name').value.trim();
  const phone=document.getElementById('ltr-phone').value.trim();
  const city=document.getElementById('ltr-city').value.trim();
  const pin=document.getElementById('ltr-pin').value.trim();
  const exp=document.getElementById('ltr-exp').value;
  const skills=[...document.querySelectorAll('input[name="ltr-skill"]:checked')].map(i=>i.value);
  const err=document.getElementById('ltrErr');
  if(!name){err.textContent='Naam daalna zaroori hai';return;}
  if(!/^\d{10}$/.test(phone)){err.textContent='Sahi 10-digit number daalo';return;}
  if(!city){err.textContent='Shehar / area daalo';return;}
  if(!/^\d{6}$/.test(pin)){err.textContent='Sahi 6-digit pincode daalo';return;}
  if(!exp){err.textContent='Experience chuno';return;}
  if(!skills.length){err.textContent='Kam se kam ek skill chuno';return;}
  err.textContent='';
  const email=document.getElementById('ltr-email').value.trim();
  const norm=phone.replace(/\D/g,'').slice(-10);
  const techData={name,phone:norm,email,city,pincode:pin,exp,skills,role:'tech'};
  const registry=JSON.parse(localStorage.getItem('kwikar_tech_registry')||'{}');
  registry[norm]=techData;
  localStorage.setItem('kwikar_tech_registry',JSON.stringify(registry));
  // Save to DB
  try{await fetch(_BASE+'/backend/booking_api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'save_technician',name,phone:norm,email,skills:skills.join(', '),experience:exp,pincodes:pin})});}catch(_){}
  closeLoginModal();
  showAbdRegSuccess();
}
function redirectToAbdPanel(name, phone){
  const base=_BASE+'/abd/frontend/index.html';
  const p=new URLSearchParams({autologin:'1',name:name||'',phone:phone||''});
  setTimeout(()=>{ window.location.href=base+'?'+p.toString(); },400);
}

/* ══ ABD Signup multi-step ══ */
let _abdPins=[];
let _abdServices=[];
let _abdExp='';

function openAbdSignup(){
  _abdPins=[];_abdExp='';
  document.getElementById('abdPinTags').innerHTML='';
  document.querySelectorAll('#abdSignupOverlay .ts-pill').forEach(p=>p.classList.remove('selected'));
  ['abdName','abdPhone','abdEmail','abdArea','abdPinInput','abdLoginPin','abdLoginPinConfirm']
    .forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  ['abdErr1','abdErr2','abdErr3','abdErr4']
    .forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='';});
  _abdShowStep(1);
  document.getElementById('abdSignupOverlay').classList.add('show');
  setTimeout(()=>document.getElementById('abdName').focus(),200);
}

function closeAbdSignup(){
  document.getElementById('abdSignupOverlay').classList.remove('show');
}

function _abdShowStep(n){
  document.querySelectorAll('#abdSignupOverlay .abd-step').forEach((el,i)=>{
    el.classList.toggle('active', i===n-1);
  });
  for(let i=1;i<=4;i++){
    const d=document.getElementById('abdp'+i);
    if(!d) continue;
    d.classList.remove('active','done');
    if(i<n) d.classList.add('done');
    else if(i===n) d.classList.add('active');
  }
}

function abdNext(step){
  if(step===1){
    const name=document.getElementById('abdName').value.trim();
    const phone=document.getElementById('abdPhone').value.trim();
    const email=document.getElementById('abdEmail').value.trim();
    const area=document.getElementById('abdArea').value.trim();
    const err=document.getElementById('abdErr1');
    if(!name){err.textContent='Naam daalna zaroori hai';return;}
    if(!/^\d{10}$/.test(phone)){err.textContent='Sahi 10-digit number daalo';return;}
    if(!email||!email.includes('@')){err.textContent='Valid email daalo';return;}
    if(!area){err.textContent='Area/city daalna zaroori hai';return;}
    err.textContent='';
    _abdShowStep(2);
    setTimeout(()=>document.getElementById('abdPinInput').focus(),100);
  } else if(step===2){
    const err=document.getElementById('abdErr2');
    if(!_abdPins.length){err.textContent='Kam se kam ek pincode add karo';return;}
    err.textContent='';
    // Init experience pill click handlers
    document.querySelectorAll('#abdExpPills .ts-pill').forEach(p=>{
      p.onclick=()=>{
        document.querySelectorAll('#abdExpPills .ts-pill').forEach(x=>x.classList.remove('selected'));
        p.classList.add('selected');
        _abdExp=p.dataset.val;
      };
    });
    _abdShowStep(3);
  } else if(step===3){
    const err=document.getElementById('abdErr3');
    if(!_abdExp){err.textContent='Experience select karo';return;}
    err.textContent='';
    _abdShowStep(4);
    setTimeout(()=>document.getElementById('abdLoginPin').focus(),100);
  }
}

function abdBack(step){ _abdShowStep(step-1); }

function addAbdPin(){
  const input=document.getElementById('abdPinInput');
  const pin=input.value.trim();
  const err=document.getElementById('abdErr2');
  if(!/^\d{6}$/.test(pin)){err.textContent='Sahi 6-digit pincode daalo';return;}
  if(_abdPins.includes(pin)){err.textContent='Yeh pincode pehle se add hai';return;}
  if(_abdPins.length>=10){err.textContent='Maximum 10 pincodes allowed hain';return;}
  _abdPins.push(pin);
  err.textContent='';
  input.value='';
  const tag=document.createElement('div');
  tag.className='ts-pin-tag';
  tag.id='abdPinTag_'+pin;
  tag.innerHTML=pin+' <button type="button" onclick="removeAbdPin(\''+pin+'\')">✕</button>';
  document.getElementById('abdPinTags').appendChild(tag);
  input.focus();
}

function removeAbdPin(pin){
  _abdPins=_abdPins.filter(p=>p!==pin);
  const tag=document.getElementById('abdPinTag_'+pin);
  if(tag)tag.remove();
}

async function submitAbdSignup(){
  const pin=document.getElementById('abdLoginPin').value.trim();
  const pinConfirm=document.getElementById('abdLoginPinConfirm').value.trim();
  const err=document.getElementById('abdErr4');
  if(!/^\d{6}$/.test(pin)){err.textContent='6-digit PIN daalo';return;}
  if(pin!==pinConfirm){err.textContent='Dono PIN match nahi kar rahe';return;}
  err.textContent='';
  const btn=document.getElementById('abdSubmitBtn');
  btn.disabled=true; btn.textContent='Submitting…';
  const name=document.getElementById('abdName').value.trim();
  const phone=document.getElementById('abdPhone').value.trim().replace(/\D/g,'').slice(-10);
  const email=document.getElementById('abdEmail').value.trim();
  const area=document.getElementById('abdArea').value.trim();
  try{
    const res=await fetch(_BASE+'/abd/backend/api/api.php?module=register',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name,phone,email,area,pincodes:_abdPins,experience:_abdExp,pin})
    });
    const data=await res.json();
    if(!data.success){err.textContent=data.error||'Register nahi ho paya';btn.disabled=false;btn.textContent='Submit 🚀';return;}
    localStorage.setItem('kwikar_abd',JSON.stringify({name,phone,email,area,role:'abd',id:data.abd_id}));
    _abdShowStep(5);
    setTimeout(()=>{ closeAbdSignup(); redirectToAbdPanel(name,phone); },2200);
  }catch(e){
    err.textContent='Server error — dobara try karo';
    btn.disabled=false; btn.textContent='Submit 🚀';
  }
}

function redirectToTechPanel(name, phone, email, role){
  const base=_BASE+'/technician/frontend/index.html';
  const p=new URLSearchParams({
    autologin:'1',
    name:name||'',
    phone:phone||'',
    email:email||'',
    role:role||'Technician'
  });
  setTimeout(()=>{ window.location.href=base+'?'+p.toString(); }, 400);
}

function applyLogin(name,role){
  // Logged-in users never see pincode modal again (until logout)
  if(role!=='tech') localStorage.setItem('kwikar_pin_done','1');
  const firstName=name.split(' ')[0];
  const isTech=role==='tech';
  const lb=document.getElementById('loginBtn');
  const nlb=document.getElementById('navLoginBtn');
  if(lb)lb.style.display='none';
  if(nlb)nlb.style.display='none';
  const mob=document.getElementById('mtbUserInfo');
  if(mob)mob.style.display='flex';
  const nav=document.getElementById('navUserInfo');
  if(nav)nav.style.display='flex';
  // Show mobile bottom nav only for logged-in customers (not techs)
  if(!isTech){
    const mbn=document.getElementById('mobBottomNav');
    if(mbn)mbn.classList.add('show');
    const ft=document.querySelector('footer');
    if(ft)ft.classList.add('nav-shown');
  }
  // Badge on nav for technician
  const badge=document.getElementById('navUserInfo');
  if(badge&&isTech){badge.title='Technician: '+firstName;}
  // Show technician panel quick-link in nav when logged in as tech
  const techPanelBtn=document.getElementById('techPanelNavBtn');
  if(techPanelBtn)techPanelBtn.style.display=isTech?'inline-flex':'none';
  // Show ABD panel quick-link in nav when logged in as abd
  const abdPanelBtn=document.getElementById('abdPanelNavBtn');
  if(abdPanelBtn)abdPanelBtn.style.display=(role==='abd')?'inline-flex':'none';
  startGreetCycle(firstName,isTech);
}
function startGreetCycle(name,isTech){
  const h=new Date().getHours();
  const timeGreet=h<12?'Good Morning '+name:h<17?'Good Afternoon '+name:h<21?'Good Evening '+name:'Good Night '+name;
  const msgs=isTech?[
    'Hiii '+name+' 👋',
    timeGreet,
    'Kwikar Technician ✅',
    'Aaj Kitne Jobs Hai?',
    'Welcome Back '+name+' 🔧',
    'Kwikar ke saath badho!',
  ]:[
    'Hiii '+name+' 👋',
    timeGreet,
    'Kaise Ho '+name+'?',
    'AC Kharab Hai? Kwikar Karlo!',
    'Ghar Ka Kaam, Hum Karenge!',
    'Fridge Thanda Nahi Kar Raha?',
    'TV Repair? 60 Min Mein!',
    'Welcome Back '+name+' 😊',
    'Aaj Kaunsi Service Chahiye?',
    'Washing Machine Issue? Call Karo!'
  ];

  const el=document.getElementById('mtbGreetText');   // mobile
  const nel=document.getElementById('navGreetText');   // desktop
  const targets=[el,nel].filter(Boolean);
  if(!targets.length)return;
  let i=0;
  function setText(t,text){
    t.classList.remove('up','in','slide-read');
    void t.offsetWidth;
    t.textContent=text;
    t.classList.add('in');
    setTimeout(()=>{
      const ov=t.offsetWidth-(t.parentElement?.offsetWidth||9999);
      if(ov>0){t.style.setProperty('--tx',`-${ov+8}px`);t.classList.add('slide-read');}
    },440);
  }
  function next(){
    targets.forEach(t=>{
      t.classList.remove('slide-read');
      t.classList.add('up');
    });
    setTimeout(()=>{
      i=(i+1)%msgs.length;
      targets.forEach(t=>setText(t,msgs[i]));
    },380);
  }
  targets.forEach(t=>setText(t,msgs[i])); i=1;
  if(window._greetTimer)clearInterval(window._greetTimer);
  window._greetTimer=setInterval(next,3800);
}
(function(){
  const u=localStorage.getItem('kwikar_user');
  if(u){try{const d=JSON.parse(u);if(d.role!=='tech'){applyLogin(d.name,'user');refreshBookingBadge();}}catch(e){}}
})();

/* ══════════ LIVE TICKER ══════════ */
(function(){
  const msgs=[
    'Mumbai mein Raj ne AC ki service karaayi','Delhi mein Priya ne Fridge ki service karaayi',
    'Bengaluru mein Amit ne Washing Machine ki service karaayi','Chennai mein Sunita ne TV ki service karaayi',
    'Hyderabad mein Vikram ne RO Purifier ki service karaayi','Pune mein Anjali ne Geyser ki service karaayi',
    'Kolkata mein Deepak ne AC ki service karaayi','Ahmedabad mein Kavita ne Fridge ki service karaayi',
    'Jaipur mein Suresh ne Washing Machine ki service karaayi','Lucknow mein Pooja ne Microwave ki service karaayi',
    'Surat mein Manoj ne AC ki service karaayi','Kanpur mein Rekha ne Fridge ki service karaayi',
    'Nagpur mein Rohit ne Geyser ki service karaayi','Patna mein Neha ne RO ki service karaayi',
    'Indore mein Sanjay ne TV ki service karaayi','Bhopal mein Meena ne AC ki service karaayi',
    'Visakhapatnam mein Arun ne Washing Machine ki service karaayi','Vadodara mein Seema ne Fridge ki service karaayi',
    'Coimbatore mein Vivek ne Geyser ki service karaayi','Agra mein Anita ne AC ki service karaayi',
    'Nashik mein Ramesh ne Microwave ki service karaayi','Varanasi mein Geeta ne RO ki service karaayi',
    'Rajkot mein Ajay ne TV ki service karaayi','Meerut mein Ritu ne Washing Machine ki service karaayi',
    'Faridabad mein Dinesh ne AC ki service karaayi','Ghaziabad mein Shobha ne Fridge ki service karaayi',
    'Ludhiana mein Rajesh ne Geyser ki service karaayi','Amritsar mein Nisha ne AC ki service karaayi',
    'Allahabad mein Pramod ne Washing Machine ki service karaayi','Ranchi mein Usha ne TV ki service karaayi',
    'Jodhpur mein Kapil ne RO ki service karaayi','Vijayawada mein Shanti ne Fridge ki service karaayi',
    'Jabalpur mein Hemant ne AC ki service karaayi','Gwalior mein Lata ne Microwave ki service karaayi',
    'Kochi mein Naveen ne Geyser ki service karaayi','Udaipur mein Savita ne Washing Machine ki service karaayi',
    'Mysuru mein Gaurav ne TV ki service karaayi','Noida mein Pushpa ne AC ki service karaayi',
    'Gurugram mein Alok ne RO Purifier ki service karaayi','Chandigarh mein Manju ne Fridge ki service karaayi',
    'Bhubaneswar mein Bharat ne Geyser ki service karaayi','Thiruvananthapuram mein Rani ne AC ki service karaayi',
    'Dehradun mein Sunil ne Washing Machine ki service karaayi','Jammu mein Sita ne TV ki service karaayi',
    'Mangaluru mein Vinod ne Microwave ki service karaayi','Tirupati mein Kamla ne AC ki service karaayi',
    'Shimla mein Mahesh ne RO ki service karaayi','Raipur mein Durga ne Fridge ki service karaayi',
    'Madurai mein Munawar ne AC ki service karaayi','Srinagar mein Kavita ne Geyser ki service karaayi'
  ];
  const inner=document.getElementById('tickerInner');
  if(!inner)return;
  inner.replaceChildren();
  for(let r=0;r<2;r++){
    msgs.forEach(m=>{
      const card=document.createElement('span');
      card.className='ticker-card';
      card.textContent=m;
      inner.appendChild(card);
    });
  }
  // Restart animation after content renders so width:max-content is correct
  inner.style.animation='none';
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{inner.style.animation='';});
  });
})();

/* ══════════ INSTAGRAM PILL ANIMATION ══════════ */
(function(){
  const instaLines=[
    'Jin logon ne humpar bhrosa kiya',
    'Hamare happy customers 😊',
    'Real reviews dekhein',
    '50,000+ trusted homes',
    'Hamari story Instagram par'
  ];
  const el=document.getElementById('instaAnimText');
  if(!el)return;
  const wrap=el.parentElement;
  let j=0;

  function reset(){el.className='insta-anim-text';el.style.removeProperty('--itx');}

  function applyScroll(){
    const ov=el.offsetWidth-wrap.offsetWidth;
    el.classList.remove('i-in','i-out','i-scroll');
    el.style.removeProperty('--itx');
    void el.offsetWidth;
    if(ov>0){el.style.setProperty('--itx',`-${ov+6}px`);el.classList.add('i-scroll');}
  }

  function showCurrent(){
    reset();
    void el.offsetWidth;
    el.classList.add('i-in');
    setTimeout(applyScroll,440);
  }

  function cycle(){
    reset();
    void el.offsetWidth;
    el.classList.add('i-out');
    setTimeout(()=>{j=(j+1)%instaLines.length;el.textContent=instaLines[j];showCurrent();},390);
  }

  el.textContent=instaLines[0];
  showCurrent();
  setInterval(cycle,3200);
})();

/* ══════════ TECH SIGNUP ══════════ */
let tsCurrentStep=1;
const tsMaxStep=6;
const tsPins=[];
let tsSelectedServices=[];
let tsSelectedExp='';

function openTechSignup(){
  tsCurrentStep=1;tsPins.length=0;tsSelectedServices=[];tsSelectedExp='';
  window._tsPhotoDataUrl=null;
  document.querySelectorAll('.ts-pill').forEach(p=>p.classList.remove('selected'));
  document.getElementById('tsPinTags').innerHTML='';
  document.getElementById('tsPhotoPreview').style.display='none';
  document.getElementById('tsUploadPlaceholder').style.display='';
  ['tsName','tsPhone','tsEmail','tsPinInput','tsPin','tsPinConfirm'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  // Re-render ABD pincode pills if referral pincodes were fetched
  renderAbdPincodePills();
  showTsStep(1);
  document.getElementById('tsOverlay').classList.add('show');
}
function closeTechSignup(){document.getElementById('tsOverlay').classList.remove('show')}

function showTsStep(n){
  document.querySelectorAll('.ts-step').forEach(s=>s.classList.remove('active'));
  const el=document.getElementById(n==='done'?'tsStepDone':'tsStep'+n);
  if(el)el.classList.add('active');
  // Update progress dots
  for(let i=1;i<=tsMaxStep;i++){
    const d=document.getElementById('tsp'+i);
    if(!d)continue;
    d.classList.remove('active','done');
    if(n==='done'||i<(n==='done'?6:n))d.classList.add('done');
    else if(i===n)d.classList.add('active');
  }
}

function tsBack(step){
  tsCurrentStep = step - 1;
  showTsStep(tsCurrentStep);
}

function tsNext(step){
  if(step===1){
    const name=document.getElementById('tsName').value.trim();
    const phone=document.getElementById('tsPhone').value.trim();
    const email=document.getElementById('tsEmail').value.trim();
    const err=document.getElementById('tsErr1');
    if(!name){err.textContent='Naam zaroori hai';return}
    if(!/^\d{10}$/.test(phone)){err.textContent='Sahi 10-digit number daalo';return}
    if(!email||!email.includes('@')){err.textContent='Sahi email daalo';return}
    err.textContent='';
    // Init pills listeners
    document.querySelectorAll('#tsServicePills .ts-pill').forEach(p=>{
      p.onclick=()=>{p.classList.toggle('selected');tsSelectedServices=Array.from(document.querySelectorAll('#tsServicePills .ts-pill.selected')).map(x=>x.dataset.val);};
    });
    document.querySelectorAll('#tsExpPills .ts-pill').forEach(p=>{
      p.onclick=()=>{document.querySelectorAll('#tsExpPills .ts-pill').forEach(x=>x.classList.remove('selected'));p.classList.add('selected');tsSelectedExp=p.dataset.val;};
    });
  }
  if(step===2){
    if(!tsSelectedServices.length){document.getElementById('tsErr2').textContent='Kam se kam ek service select karo';return}
    document.getElementById('tsErr2').textContent='';
  }
  if(step===3){
    if(!tsPins.length){document.getElementById('tsErr3').textContent='Kam se kam ek pincode add karo';return}
    document.getElementById('tsErr3').textContent='';
  }
  if(step===4){
    if(!tsSelectedExp){document.getElementById('tsErr4').textContent='Experience select karo';return}
    document.getElementById('tsErr4').textContent='';
  }
  tsCurrentStep=step+1;
  showTsStep(tsCurrentStep);
}

function addTsPin(){
  const inp=document.getElementById('tsPinInput');
  const pin=inp.value.trim();
  if(!/^\d{6}$/.test(pin)){document.getElementById('tsErr3').textContent='6-digit pincode daalo';return}
  if(tsPins.includes(pin)){document.getElementById('tsErr3').textContent='Yeh pincode pehle se add hai';return}
  if(tsPins.length>=4){document.getElementById('tsErr3').textContent='Max 4 pincodes hi add ho sakte hain';return}
  document.getElementById('tsErr3').textContent='';
  tsPins.push(pin);inp.value='';renderTsPins();
}
function removeTsPin(pin){const idx=tsPins.indexOf(pin);if(idx>-1)tsPins.splice(idx,1);renderTsPins();}
function renderTsPins(){
  document.getElementById('tsPinTags').innerHTML=tsPins.map(p=>`<span class="ts-pin-tag">${p}<button type="button" onclick="removeTsPin('${p}')">✕</button></span>`).join('');
}

function previewTsPhoto(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const preview=document.getElementById('tsPhotoPreview');
    preview.src=e.target.result;preview.style.display='block';
    document.getElementById('tsUploadPlaceholder').style.display='none';
    window._tsPhotoDataUrl=e.target.result;
  };
  reader.readAsDataURL(file);
}

async function submitTechSignup(){
  const pin=document.getElementById('tsPin').value.trim();
  const pinConfirm=document.getElementById('tsPinConfirm').value.trim();
  const errPin=document.getElementById('tsErr6');
  if(!/^\d{6}$/.test(pin)){errPin.textContent='6-digit PIN daalo';return;}
  if(pin!==pinConfirm){errPin.textContent='Dono PIN match nahi kar rahe';return;}
  errPin.textContent='';
  const submitBtn=document.querySelector('#tsStep6 .ts-btn');
  if(submitBtn){submitBtn.disabled=true;submitBtn.textContent='Saving…';}

  const name=document.getElementById('tsName').value.trim();
  const rawPhone=document.getElementById('tsPhone').value.trim();
  const phone=rawPhone.replace(/\D/g,'').slice(-10);
  const payload={
    name,phone,
    email:document.getElementById('tsEmail').value.trim(),
    skills:tsSelectedServices.join(', '),
    pincodes:tsPins.join(', '),
    experience:tsSelectedExp,
    role:'tech'
  };
  const abdRef = sessionStorage.getItem('kwikar_abd_ref');
  if(abdRef) payload.abd_id = abdRef;

  // Save to database — check response properly
  try{
    const res  = await fetch(_BASE+'/backend/booking_api.php',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({action:'save_technician',...payload,pin})
    });
    const json = await res.json();
    if(!json.success){
      errPin.textContent = json.error || 'Registration failed. Please try again.';
      if(submitBtn){submitBtn.disabled=false;submitBtn.textContent='Submit 🚀';}
      return;
    }
  }catch(e){
    errPin.textContent='Network error. Check connection and try again.';
    if(submitBtn){submitBtn.disabled=false;submitBtn.textContent='Submit 🚀';}
    return;
  }

  // Save to local registry
  if(name&&phone){
    const registry=JSON.parse(localStorage.getItem('kwikar_tech_registry')||'{}');
    const entry={...payload};
    if(window._tsPhotoDataUrl)entry.avatar=window._tsPhotoDataUrl;
    registry[phone]=entry;
    localStorage.setItem('kwikar_tech_registry',JSON.stringify(registry));
    if(window._tsPhotoDataUrl){
      try{localStorage.setItem('kwikar_tech_avatar_'+phone,window._tsPhotoDataUrl);}catch(_){}
    }
  }

  // Show success popup then redirect to tech panel
  window._pendingTechRedirect = {name:payload.name, phone:payload.phone, email:payload.email, skills:payload.skills};
  closeTechSignup();
  showAbdRegSuccess();
  setTimeout(()=>{
    if(window._pendingTechRedirect){
      const p=window._pendingTechRedirect;
      window._pendingTechRedirect=null;
      redirectToTechPanel(p.name,p.phone,p.email,p.skills);
    }
  },4000);
}

/* ══════════ SEARCH BAR ANIMATION ══════════ */
(function(){
  const terms=['AC Repair','Fridge Repair','Washing Machine','TV Repair','RO Purifier','Geyser Repair','Microwave Repair'];
  const el=document.getElementById('searchAnimText');
  if(!el)return;
  const wrap=el.parentElement;
  let i=0;

  function reset(){el.className='search-anim-text';el.style.removeProperty('--stx');}

  function applyScroll(){
    const ov=el.offsetWidth-wrap.offsetWidth;
    el.classList.remove('s-in','s-out','s-scroll');
    el.style.removeProperty('--stx');
    void el.offsetWidth;
    if(ov>0){el.style.setProperty('--stx',`-${ov+6}px`);el.classList.add('s-scroll');}
  }

  function showCurrent(){
    reset();
    void el.offsetWidth;
    el.classList.add('s-in');
    setTimeout(applyScroll,440);
  }

  function cycle(){
    reset();
    void el.offsetWidth;
    el.classList.add('s-out');
    setTimeout(()=>{i=(i+1)%terms.length;el.textContent=terms[i];showCurrent();},390);
  }

  el.textContent=terms[0];
  showCurrent();
  setInterval(cycle,2800);
})();

/* ══════════ BOOKING MODAL — multi-step flow ══════════ */
const APPLIANCES={
  ac:{
    name:'Air Conditioner',
    img:'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=85&auto=format&fit=crop',
    issues:[
      {id:'not-cooling',label:'Not Cooling',icon:'🥶'},
      {id:'cleaning',label:'Deep Cleaning / Service',icon:'✨'},
      {id:'gas-refill',label:'Gas Refill',icon:'💨'},
      {id:'water-leak',label:'Water Leakage',icon:'💧'},
      {id:'noise',label:'Strange Noise',icon:'🔊'},
      {id:'remote',label:'Remote Not Working',icon:'📡'},
      {id:'installation',label:'Installation / Uninstallation',icon:'🔧'},
      {id:'electrical',label:'PCB / Electrical Issue',icon:'⚡'},
    ]
  },
  fridge:{
    name:'Refrigerator',
    img:'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&q=85&auto=format&fit=crop',
    issues:[
      {id:'not-cooling',label:'Not Cooling',icon:'🥶'},
      {id:'over-cooling',label:'Over Cooling / Freezing',icon:'❄️'},
      {id:'water-leak',label:'Water Leakage',icon:'💧'},
      {id:'noise',label:'Strange Noise',icon:'🔊'},
      {id:'door-issue',label:'Door / Gasket Issue',icon:'🚪'},
      {id:'gas-refill',label:'Gas Refill',icon:'💨'},
      {id:'compressor',label:'Compressor Problem',icon:'⚙️'},
      {id:'lights',label:'Light / Display Issue',icon:'💡'},
    ]
  },
  washing:{
    name:'Washing Machine',
    img:'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&q=85&auto=format&fit=crop',
    issues:[
      {id:'not-spinning',label:'Not Spinning',icon:'🔄'},
      {id:'not-draining',label:'Water Not Draining',icon:'💧'},
      {id:'noise',label:'Excess Noise / Vibration',icon:'🔊'},
      {id:'leaking',label:'Water Leakage',icon:'💦'},
      {id:'not-starting',label:'Not Starting',icon:'⏻'},
      {id:'cleaning',label:'Drum / Tub Cleaning',icon:'✨'},
      {id:'door-lock',label:'Door Lock Issue',icon:'🔒'},
      {id:'installation',label:'Installation',icon:'🔧'},
    ]
  },
  microwave:{
    name:'Microwave',
    img:'https://upload.wikimedia.org/wikipedia/commons/e/e2/Silver_GE_Microwave.jpg',
    issues:[
      {id:'not-heating',label:'Not Heating',icon:'🔥'},
      {id:'sparking',label:'Sparking Inside',icon:'⚡'},
      {id:'door-issue',label:'Door Problem',icon:'🚪'},
      {id:'turntable',label:'Turntable Not Rotating',icon:'🔄'},
      {id:'display',label:'Display / Buttons Issue',icon:'🔢'},
      {id:'noise',label:'Strange Noise',icon:'🔊'},
      {id:'cleaning',label:'Deep Cleaning',icon:'✨'},
      {id:'installation',label:'Installation',icon:'🔧'},
    ]
  },
  other:{
    name:'Other Appliance',
    img:'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=85&auto=format&fit=crop',
    issues:[
      {id:'tv',label:'Television',icon:'📺'},
      {id:'ro',label:'RO Water Purifier',icon:'💧'},
      {id:'geyser',label:'Geyser / Water Heater',icon:'🚿'},
      {id:'chimney',label:'Chimney',icon:'🌬️'},
      {id:'dishwasher',label:'Dishwasher',icon:'🍽️'},
      {id:'fan',label:'Ceiling / Table Fan',icon:'💨'},
      {id:'oven',label:'OTG / Oven',icon:'🔥'},
      {id:'mixer',label:'Mixer / Grinder',icon:'🥤'},
    ]
  }
};

let bookingState={phone:'',appliance:'',issue:'',issueText:''};
const bookingModal=document.getElementById('bookingModal');
const bookingBack=document.getElementById('bookingBack');
const bookingClose=document.getElementById('bookingClose');
const bookingTitle=document.getElementById('bookingTitle');
const bookKaroBtn=document.getElementById('bookKaroBtn');

function bpiErr(img, bg, letter) {
  const brandName = (img.alt || letter).replace(/\s+logo$/i, '').trim();
  const pill = img.closest('.brand-pill-logo');
  const el = document.createElement('i');
  el.className = 'bpi';
  el.style.setProperty('--bc', bg);
  el.textContent = letter;
  const label = document.createElement('span');
  label.className = 'brand-fallback-name';
  label.textContent = brandName || letter;
  if (pill) pill.classList.add('brand-pill-fallback');
  img.replaceWith(el, label);
}

/* ══ FLOATING REVIEW WIDGET ══ */
let _reviewRating = 0;
let _rvOpen = false;

function toggleReviewWidget(){
  const panel = document.getElementById('rvPanel');
  if(!panel) return;
  _rvOpen = !_rvOpen;
  if(_rvOpen){
    document.getElementById('rvFormView').style.display = '';
    _reviewRating = 0;
    document.querySelectorAll('.rv-star').forEach(s=>s.classList.remove('active'));
    const name=document.getElementById('rvName');
    const text=document.getElementById('rvText');
    const err=document.getElementById('rvErr');
    if(name)name.value = '';
    if(text)text.value = '';
    if(err)err.textContent = '';
    panel.classList.add('open');
  } else {
    panel.classList.remove('open');
  }
}

function setReviewRating(val){
  _reviewRating = val;
  document.querySelectorAll('.rv-star').forEach(s=>{
    s.classList.toggle('active', parseInt(s.dataset.v) <= val);
  });
}

async function submitReview(){
  const text = document.getElementById('rvText').value.trim();
  const name = document.getElementById('rvName').value.trim();
  const err  = document.getElementById('rvErr');
  const btn  = document.getElementById('rvSubmitBtn');
  if(!_reviewRating){ err.textContent='Please select a star rating'; return; }
  if(!text)          { err.textContent='Please write your review';    return; }
  err.textContent = '';
  btn.disabled = true;
  const orig = btn.textContent;
  btn.textContent = 'Submitting…';
  try{
    const u = JSON.parse(localStorage.getItem('kwikar_user')||'{}');
    const res = await fetch(_BASE+'/backend/review_api.php',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({name:name||u.name||'', phone:u.phone||'', rating:_reviewRating, review_text:text, page_source:'homepage'})
    });
    const data = await res.json();
    if(!data.success){ err.textContent = data.error||'Could not submit — try again'; return; }
    // Close panel, show small toast for 2s
    _rvOpen = false;
    document.getElementById('rvPanel').classList.remove('open');
    const toast = document.getElementById('rvToast');
    toast.classList.add('show');
    setTimeout(()=>{ toast.classList.remove('show'); }, 2000);
  }catch(e){
    err.textContent = 'Could not connect — please try again';
  }finally{
    btn.disabled = false;
    btn.textContent = orig;
  }
}

// Init: panel starts hidden (element is after this script tag, so defer)
// panel starts hidden via CSS (display:none by default, .open shows it)

/* ══ HOMEPAGE TESTIMONIALS ══ */
document.addEventListener('DOMContentLoaded', async function loadTestimonials(){
  try{
    const res  = await fetch(_BASE+'/backend/review_api.php?action=get_reviews&status=approved&limit=20');
    const data = await res.json();
    if(!data.success || !data.reviews.length) return;

    const STARS = 5;
    function starsSVG(rating){
      return Array.from({length:STARS},(_,i)=>`
        <svg class="rtcard-star${i>=rating?' empty':''}" viewBox="0 0 24 24">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>`).join('');
    }

    // Duplicate cards for seamless loop
    const cards = [...data.reviews, ...data.reviews].map(r=>`
      <div class="review-tcard">
        <div class="rtcard-stars">${starsSVG(Number(r.rating))}</div>
        <div class="rtcard-text">${r.review_text.replace(/</g,'&lt;')}</div>
        <div class="rtcard-name">${r.name ? r.name.replace(/</g,'&lt;') : 'Anonymous'}</div>
      </div>`).join('');

    document.getElementById('testimonialsTrack').innerHTML = cards;
    document.getElementById('testimonialsSection').style.display = '';

    // Adjust animation duration based on card count
    const dur = Math.max(20, data.reviews.length * 4);
    document.querySelector('.testimonials-track').style.animationDuration = dur + 's';
  }catch(e){ console.error('Testimonials load error:', e); }
});

function bookService(applianceKey){
  window.location.href='booking.html?service='+applianceKey;
}
function openBookingModalFor(applianceKey){
  bookService(applianceKey);
  return;
  bookingState.appliance=applianceKey;
  bookingState.issue='';
  bookingState.issueText='';
  openBookingModal();
}
function openBookingModal(){
  bookingModal.classList.add('show');
  bookingModal.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
  showBookingStep('phone');
  setTimeout(()=>document.getElementById('bk-phone')?.focus({preventScroll:true}),300);
}
function closeBookingModal(){
  bookingModal.classList.remove('show');
  bookingModal.setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');
  setTimeout(()=>{
    bookingState={phone:'',appliance:'',issue:'',issueText:''};
    document.getElementById('bk-phone').value='';
    document.getElementById('bk-other-text').value='';
    document.getElementById('bkOtherBox').classList.remove('show');
    showBookingStep('phone');
  },300);
}
function showBookingStep(step){
  document.querySelectorAll('.bk-step').forEach(s=>s.classList.toggle('active',s.dataset.step===step));
  const titles={phone:'Book Service',appliance:'Choose Appliance',issue:'Select Issue',success:'Booking Confirmed'};
  bookingTitle.textContent=titles[step]||'Book Service';
  bookingBack.style.visibility=(step==='phone'||step==='success')?'hidden':'visible';
}

bookKaroBtn?.addEventListener('click',()=>bookService('other'));
bookingClose.addEventListener('click',closeBookingModal);
bookingBack.addEventListener('click',()=>{
  const cur=document.querySelector('.bk-step.active')?.dataset.step;
  if(cur==='appliance')showBookingStep('phone');
  else if(cur==='issue')showBookingStep('appliance');
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&bookingModal.classList.contains('show'))closeBookingModal()});

/* Step 1 → 2: phone validation */
document.getElementById('bkPhoneNext').addEventListener('click',()=>{
  const phone=document.getElementById('bk-phone').value.trim();
  if(!phone||phone.replace(/\D/g,'').length<10){
    document.getElementById('bk-phone').focus();
    return;
  }
  bookingState.phone=phone;
  renderAppliances();
  showBookingStep('appliance');
});
document.getElementById('bk-phone').addEventListener('keydown',e=>{
  if(e.key==='Enter')document.getElementById('bkPhoneNext').click();
});

/* Step 2: render appliance grid */
function renderAppliances(){
  const grid=document.getElementById('applianceGrid');
  grid.innerHTML='';
  Object.entries(APPLIANCES).forEach(([key,app])=>{
    const card=document.createElement('button');
    card.type='button';
    card.className='appliance-card';
    card.innerHTML=`<div class="ap-img"><img src="${app.img}" alt="${app.name}" loading="lazy"></div><div class="ap-name">${app.name}</div>`;
    card.addEventListener('click',()=>selectAppliance(key));
    grid.appendChild(card);
  });
}

/* Step 2 → 3: appliance chosen */
function selectAppliance(key){
  bookingState.appliance=key;
  bookingState.issue='';
  bookingState.issueText='';
  const app=APPLIANCES[key];
  document.getElementById('bk-app-img').src=app.img;
  document.getElementById('bk-app-img').alt=app.name;
  document.getElementById('bk-app-name').textContent=app.name;
  renderIssues(app);
  showBookingStep('issue');
}

/* Step 3: render issue cards + Other Issue */
function renderIssues(app){
  const grid=document.getElementById('issuesGrid');
  grid.innerHTML='';
  app.issues.forEach(iss=>{
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='issue-card';
    btn.dataset.id=iss.id;
    btn.innerHTML=`<span class="iss-icon">${iss.icon}</span><span class="iss-label">${iss.label}</span>`;
    btn.addEventListener('click',()=>selectIssue(iss.id,btn));
    grid.appendChild(btn);
  });
  const otherBtn=document.createElement('button');
  otherBtn.type='button';
  otherBtn.className='issue-card issue-other';
  otherBtn.dataset.id='other-issue';
  otherBtn.innerHTML=`<span class="iss-icon">✏️</span><span class="iss-label">Other Issue</span>`;
  otherBtn.addEventListener('click',()=>selectIssue('other-issue',otherBtn));
  grid.appendChild(otherBtn);
  document.getElementById('bkOtherBox').classList.remove('show');
  document.getElementById('bk-other-text').value='';
}

function selectIssue(id,btn){
  bookingState.issue=id;
  document.querySelectorAll('.issue-card').forEach(c=>c.classList.remove('selected'));
  btn.classList.add('selected');
  const otherBox=document.getElementById('bkOtherBox');
  if(id==='other-issue'){
    otherBox.classList.add('show');
    setTimeout(()=>document.getElementById('bk-other-text').focus(),100);
  } else {
    otherBox.classList.remove('show');
  }
}

/* Step 3 → 4: submit booking */
document.getElementById('bkSubmit').addEventListener('click',()=>{
  if(!bookingState.issue){
    alert('Please select an issue first.');
    return;
  }
  if(bookingState.issue==='other-issue'){
    const txt=document.getElementById('bk-other-text').value.trim();
    if(!txt){
      document.getElementById('bk-other-text').focus();
      return;
    }
    bookingState.issueText=txt;
  }
  submitBooking();
});

async function submitBooking(){
  const app       = APPLIANCES[bookingState.appliance];
  const issueLabel= bookingState.issue==='other-issue'
    ? bookingState.issueText
    : app.issues.find(i=>i.id===bookingState.issue)?.label||bookingState.issue;

  document.getElementById('bkSummary').innerHTML=
    `<div class="bk-sum-row"><span>📱 Mobile</span><strong>${bookingState.phone}</strong></div>`+
    `<div class="bk-sum-row"><span>🔧 Appliance</span><strong>${app.name}</strong></div>`+
    `<div class="bk-sum-row"><span>⚠️ Issue</span><strong>${issueLabel}</strong></div>`;

  const userRaw   = localStorage.getItem('kwikar_user');
  const user      = userRaw ? JSON.parse(userRaw) : null;
  const pincode   = document.getElementById('pinIn')?.value?.trim() || localStorage.getItem('kwikar_welcome_pin') || '';

  // ── If logged-in user has no profession saved yet → ask now ──────
  if(user?.user_id && !user.profession){
    const prof = await askProfession();
    if(prof){
      user.profession = prof;
      localStorage.setItem('kwikar_user', JSON.stringify(user));
      // Save profession to DB (fire-and-forget)
      fetch(_BASE+'/backend/user_api.php?action=save_profession',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({user_id: user.user_id, profession: prof})
      }).catch(()=>{});
    }
  }

  const payload = {
    action        : 'book',
    service       : app.name,
    issue         : issueLabel,
    other_issue   : bookingState.issueText || '',
    user_name     : user?.name  || '',
    user_phone    : bookingState.phone,
    user_id       : user?.user_id || null,
    profession    : user?.profession || bookingState.profession || '',
    full_address  : user?.address   || '',
    pincode       : pincode,
    slot_date     : '',
    slot_time     : '',
  };

  try{
    const res  = await fetch(_BASE+'/backend/booking_api.php',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const json = await res.json();

    if(json.success){
      // ── New guest user — server says they need to set a PIN ────────
      if(json.needs_pin && json.user_id){
        showBookingStep('success');
        // Short delay so success screen is visible first, then show PIN prompt
        setTimeout(()=> showPinSetupPrompt(bookingState.phone, json.user_id), 800);
      } else {
        showBookingStep('success');
      }
    } else {
      // Server-side error — still show success to user (offline-tolerant)
      showBookingStep('success');
    }
  }catch(e){
    // Network offline — queue for background sync, show success
    queueFormData('kwikar-booking-queue',{
      phone:bookingState.phone, appliance:bookingState.appliance,
      applianceName:app.name, issue:bookingState.issue,
      issueLabel, issueText:bookingState.issueText,
      pincode, ts:Date.now()
    });
    showBookingStep('success');
  }
}

/* ── Profession popup (shown once per logged-in user) ─────────────── */
function askProfession(){
  return new Promise(resolve=>{
    const overlay = document.createElement('div');
    overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:flex-end;justify-content:center';
    overlay.innerHTML=`
      <div style="background:#fff;width:100%;max-width:480px;border-radius:20px 20px 0 0;padding:28px 24px 36px;font-family:inherit">
        <div style="width:36px;height:4px;background:#e2e8f0;border-radius:2px;margin:0 auto 20px"></div>
        <h3 style="margin:0 0 6px;font-size:1.1rem;color:#0d1b3e">Aap kya kaam karte hain? 🔧</h3>
        <p style="margin:0 0 18px;font-size:.85rem;color:#64748b">Ek baar batao — hum bar-bar nahi poochenge</p>
        <input id="_profInput" type="text" placeholder="e.g. AC Technician, Electrician, Driver..."
          style="width:100%;padding:12px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:.95rem;box-sizing:border-box;outline:none">
        <div style="display:flex;gap:10px;margin-top:16px">
          <button id="_profSkip" style="flex:1;padding:12px;border:1.5px solid #e2e8f0;border-radius:10px;background:#fff;cursor:pointer;font-size:.9rem;color:#64748b">Skip</button>
          <button id="_profSave" style="flex:2;padding:12px;background:#0d1b3e;color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:.95rem;font-weight:600">Save karo</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const input = overlay.querySelector('#_profInput');
    setTimeout(()=>input.focus(),100);
    overlay.querySelector('#_profSkip').onclick=()=>{ document.body.removeChild(overlay); resolve(null); };
    overlay.querySelector('#_profSave').onclick=()=>{
      const val=input.value.trim();
      document.body.removeChild(overlay);
      resolve(val||null);
    };
  });
}

/* ── PIN setup popup (shown once for first-time guest users) ──────── */
function showPinSetupPrompt(phone, userId){
  const overlay = document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:flex-end;justify-content:center';
  overlay.innerHTML=`
    <div style="background:#fff;width:100%;max-width:480px;border-radius:20px 20px 0 0;padding:28px 24px 36px;font-family:inherit">
      <div style="width:36px;height:4px;background:#e2e8f0;border-radius:2px;margin:0 auto 20px"></div>
      <h3 style="margin:0 0 6px;font-size:1.1rem;color:#0d1b3e">🔐 Apna tracking PIN banao</h3>
      <p style="margin:0 0 18px;font-size:.85rem;color:#64748b">4-digit PIN se apni booking track kar paoge — yaad rakhna zaroori hai</p>
      <input id="_pinA" type="password" inputmode="numeric" maxlength="4" placeholder="4-digit PIN"
        style="width:100%;padding:12px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:1.1rem;letter-spacing:.3rem;box-sizing:border-box;outline:none;margin-bottom:10px">
      <input id="_pinB" type="password" inputmode="numeric" maxlength="4" placeholder="Dobara daalo"
        style="width:100%;padding:12px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:1.1rem;letter-spacing:.3rem;box-sizing:border-box;outline:none">
      <p id="_pinErr" style="color:#ef4444;font-size:.8rem;margin:6px 0 0;min-height:16px"></p>
      <div style="display:flex;gap:10px;margin-top:14px">
        <button id="_pinSkip" style="flex:1;padding:12px;border:1.5px solid #e2e8f0;border-radius:10px;background:#fff;cursor:pointer;font-size:.9rem;color:#64748b">Baad mein</button>
        <button id="_pinSet" style="flex:2;padding:12px;background:#0d1b3e;color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:.95rem;font-weight:600">PIN Set karo</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  setTimeout(()=>overlay.querySelector('#_pinA').focus(),100);
  overlay.querySelector('#_pinSkip').onclick=()=>document.body.removeChild(overlay);
  overlay.querySelector('#_pinSet').onclick=async()=>{
    const a=overlay.querySelector('#_pinA').value.trim();
    const b=overlay.querySelector('#_pinB').value.trim();
    const errEl=overlay.querySelector('#_pinErr');
    if(!/^\d{4}$/.test(a)){errEl.textContent='4-digit PIN daalo';return;}
    if(a!==b){errEl.textContent='Dono PIN match nahi kar rahe';return;}
    errEl.textContent='';
    try{
      const res=await fetch(_BASE+'/backend/user_api.php?action=set_pin',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({phone,pin:a})
      });
      const json=await res.json();
      if(json.success){
        document.body.removeChild(overlay);
        // Update localStorage so user appears logged in
        const existing=JSON.parse(localStorage.getItem('kwikar_user')||'{}');
        existing.user_id=userId; existing.phone=phone; existing.role='user';
        localStorage.setItem('kwikar_user',JSON.stringify(existing));
        showUserToast('✅ PIN set ho gaya! Ab aap login kar sakte hain.');
      } else {
        errEl.textContent=json.error||'PIN save nahi ho paya';
      }
    }catch(e){ errEl.textContent='Server error — baad mein try karo'; }
  };
}

// ── ABD Referral Link Handler ─────────────────────────────────────────────
// Triggered when: /frontend/index.html?abd_ref=<id>&join=tech
(function(){
  const p      = new URLSearchParams(window.location.search);
  const abdRef = p.get('abd_ref');
  const join   = p.get('join');
  if (!abdRef || join !== 'tech') return;

  sessionStorage.setItem('kwikar_abd_ref', abdRef);

  // Fetch ABD's pincodes for step 3 pills
  fetch(_BASE+'/backend/booking_api.php', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'get_abd_pincodes', abd_id: abdRef })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success && data.pincodes && data.pincodes.length) {
      window._abdRefPincodes = data.pincodes;
      renderAbdPincodePills();
      renderAbdCustPinPills(); // also render in customer form
    }
  })
  .catch(() => {});

  // Show role-choice modal instead of directly opening tech form
  function tryShow() {
    const el = document.getElementById('abdRefChoiceOverlay');
    if (el) el.style.display = 'flex';
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(tryShow, 400));
  } else {
    setTimeout(tryShow, 400);
  }
})();

// ── Role choice handler ───────────────────────────────────────────────────
function abdChooseRole(role) {
  document.getElementById('abdRefChoiceOverlay').style.display = 'none';
  if (role === 'tech') {
    openTechSignup();
  } else {
    // Jump straight to customer registration step — skip role selector & phone login view
    _loginRole = 'user';
    _showOnly('loginRegStep1');
    try { document.getElementById('regErr1').textContent = ''; } catch(_){}
    try { document.getElementById('regName').value = ''; } catch(_){}
    try { document.getElementById('regPhone').value = ''; } catch(_){}
    document.getElementById('loginOverlay').classList.add('show');
    setTimeout(() => { try { document.getElementById('regName').focus(); } catch(_){} }, 150);
  }
}

// ── Shared success overlay ────────────────────────────────────────────────
function showAbdRegSuccess() {
  const overlay = document.getElementById('abdRegSuccessOverlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  // If a tech redirect is pending, show countdown on the button
  const btn = overlay.querySelector('.abdr-btn');
  if (btn && window._pendingTechRedirect) {
    let secs = 4;
    btn.textContent = 'Panel par Jaao → (' + secs + 's)';
    const iv = setInterval(() => {
      secs--;
      if (secs > 0) {
        btn.textContent = 'Panel par Jaao → (' + secs + 's)';
      } else {
        clearInterval(iv);
        btn.textContent = 'Panel par Jaao →';
      }
    }, 1000);
  }
}

function abdRegSuccessClose() {
  document.getElementById('abdRegSuccessOverlay').style.display = 'none';
  const ts = document.getElementById('tsOverlay');
  if (ts) ts.classList.remove('show');
  // If a technician just registered, redirect to their panel
  if (window._pendingTechRedirect) {
    const p = window._pendingTechRedirect;
    window._pendingTechRedirect = null;
    redirectToTechPanel(p.name, p.phone, p.email, p.skills);
  }
}

function renderAbdPincodePills() {
  const container = document.getElementById('abdRefPincodes');
  if (!container || !window._abdRefPincodes || !window._abdRefPincodes.length) return;
  container.innerHTML =
    '<div class="abd-ref-label">📍 ABD ke service areas — tap karke select karo</div>' +
    '<div class="abd-ref-pills">' +
    window._abdRefPincodes.map(pc =>
      `<button type="button" class="abd-pin-pill" onclick="selectAbdPin('${pc.pincode}')" id="abdpill_${pc.pincode}">${pc.pincode}${pc.city ? '<span class="abd-pill-city"> · ' + pc.city + '</span>' : ''}</button>`
    ).join('') +
    '</div>';
  container.style.display = 'block';
}

function selectAbdPin(pin) {
  if (tsPins.includes(pin)) return; // already added
  if (tsPins.length >= 4) { document.getElementById('tsErr3').textContent = 'Maximum 4 pincodes allowed'; return; }
  tsPins.push(pin);
  renderTsPins();
  // Highlight pill as selected
  const pill = document.getElementById('abdpill_' + pin);
  if (pill) { pill.style.background = '#0f172a'; pill.style.color = '#fff'; }
  document.getElementById('tsErr3').textContent = '';
}

document.getElementById('bkDoneBtn').addEventListener('click',closeBookingModal);

/* ══════════ REVEAL ══════════ */
const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('vis')}),{threshold:.1});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));

/* ══════════ ONLINE/OFFLINE ══════════ */
const offBar=document.getElementById('offline-bar');
window.addEventListener('offline',()=>offBar.classList.add('show'));
window.addEventListener('online',()=>offBar.classList.remove('show'));
if(!navigator.onLine)offBar.classList.add('show');

/* ══════════ WHATSAPP SHARE ══════════ */
function shareWA(){window.open('https://wa.me/?text='+encodeURIComponent('🎉 Kwikar is launching in India on 26 May 2026! Verified home appliance repair at your doorstep. Check your pincode: '+location.href),'_blank')}

/* ══════════ INDEXEDDB — offline queue ══════════ */
function queueFormData(storeName,data){
  const req=indexedDB.open('KwikarDB',2);
  req.onupgradeneeded=e=>{
    const db=e.target.result;
    ['kwikar-notify-queue','kwikar-tech-queue','kwikar-booking-queue'].forEach(s=>{if(!db.objectStoreNames.contains(s))db.createObjectStore(s,{keyPath:'ts'})});
  };
  req.onsuccess=e=>{
    const db=e.target.result;
    try{const tx=db.transaction(storeName,'readwrite');tx.objectStore(storeName).put(data);}catch(err){console.log('IDB error:',err)}
    // Trigger background sync
    if('serviceWorker' in navigator && 'SyncManager' in window){
      navigator.serviceWorker.ready.then(sw=>sw.sync.register('sync-'+storeName.split('-').slice(1).join('-'))).catch(()=>{});
    }
  };
}

/* ══════════ PUSH NOTIFICATIONS ══════════ */
function enablePush(){
  document.getElementById('push-prompt').classList.remove('show');
  Notification.requestPermission().then(perm=>{
    if(perm==='granted'){
      navigator.serviceWorker.ready.then(sw=>{
        console.log('[PWA] Push subscription ready');
      });
      showToast('🔔 Notifications enabled! You\'ll be the first to know when we launch.');
    }
  }).catch(()=>{});
}
function showToast(msg){
  const t=document.getElementById('pwa-update-toast');
  t.querySelector('.put-text').textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),4000);
}

/* ══════════ SERVICE WORKER REGISTRATION ══════════ */
let swReg=null;
if('serviceWorker' in navigator){
  window.addEventListener('load',async()=>{
    try{
      swReg=await navigator.serviceWorker.register('sw.js');
      console.log('[PWA] Service Worker registered ✓', swReg.scope);

      // Check for updates
      swReg.addEventListener('updatefound',()=>{
        const newWorker=swReg.installing;
        newWorker.addEventListener('statechange',()=>{
          if(newWorker.state==='installed'&&navigator.serviceWorker.controller){
            document.getElementById('pwa-update-toast').classList.add('show');
          }
        });
      });

      // Listen for SW messages
      navigator.serviceWorker.addEventListener('message',e=>{
        if(e.data?.type==='SYNC_COMPLETE')console.log('[PWA] Sync complete:',e.data.store);
      });
    }catch(err){
      console.log('[PWA] SW registration failed:',err);
    }
  });
}
function updateSW(){
  if(swReg?.waiting){swReg.waiting.postMessage({type:'SKIP_WAITING'});}
  document.getElementById('pwa-update-toast').classList.remove('show');
  location.reload();
}

/* ══════════ INSTALL PROMPT ══════════ */
let deferredPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();
  deferredPrompt=e;
  setTimeout(()=>document.getElementById('pwa-install-bar').classList.add('show'),2500);
});
document.getElementById('pwa-install-btn').addEventListener('click',async()=>{
  if(!deferredPrompt)return;
  deferredPrompt.prompt();
  const{outcome}=await deferredPrompt.userChoice;
  deferredPrompt=null;
  document.getElementById('pwa-install-bar').classList.remove('show');
  if(outcome==='accepted')showToast('✅ Kwikar installed! Check your home screen.');
});
document.getElementById('pwa-dismiss-btn').addEventListener('click',()=>{
  document.getElementById('pwa-install-bar').classList.remove('show');
  deferredPrompt=null;
});
window.addEventListener('appinstalled',()=>{
  document.getElementById('pwa-install-bar').classList.remove('show');
  showToast('🎉 Kwikar app installed successfully!');
});

/* ══════════ BEEP + BOOKING STATUS POLLING ══════════ */
function playBeep(freq=880, dur=300){
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value=freq; o.type='sine';
    g.gain.setValueAtTime(0.25,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+dur/1000);
    o.start(); o.stop(ctx.currentTime+dur/1000);
  }catch(e){}
}
function playBookingAcceptedBeep(){
  playBeep(660,220);
  setTimeout(()=>playBeep(880,280),260);
  setTimeout(()=>playBeep(1100,350),560);
}
function playCompletionCodeBeep(){
  playBeep(1047,140);
  setTimeout(()=>playBeep(1319,140),170);
  setTimeout(()=>playBeep(1568,280),340);
}
function showUserToast(msg,opts={}){
  let t=document.getElementById('_userToast');
  if(!t){
    t=document.createElement('div');
    t.id='_userToast';
    t.style.cssText='position:fixed;top:18px;left:50%;transform:translateX(-50%) translateY(-12px);z-index:9999;transition:opacity .3s,transform .3s;opacity:0;pointer-events:none;width:min(92vw,360px)';
    document.body.appendChild(t);
  }
  const icon=opts.icon||'✅';
  const title=opts.title||msg;
  const sub=opts.sub||'';
  const accent=opts.accent||'#0d1b3e';
  t.innerHTML=`<div style="background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(13,27,62,.14),0 1px 4px rgba(13,27,62,.08);padding:12px 14px;display:flex;align-items:center;gap:12px;border-left:3px solid ${accent}">
    <div style="width:36px;height:36px;border-radius:10px;background:${accent}18;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${icon}</div>
    <div style="min-width:0">
      <div style="font-size:13px;font-weight:700;color:#0d1b3e;line-height:1.3">${title}</div>
      ${sub?`<div style="font-size:11px;color:#64748b;margin-top:1px;line-height:1.3">${sub}</div>`:''}
    </div>
  </div>`;
  t.style.opacity='1';
  t.style.transform='translateX(-50%) translateY(0)';
  clearTimeout(t._tmr);
  t._tmr=setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(-50%) translateY(-12px)';},4500);
}

let _lastBookingStatuses={};
let _lastBookingCodes={};
let _bookingPollReady=false;

async function pollBookingStatus(){
  const raw=localStorage.getItem('kwikar_user');
  if(!raw) return;
  try{
    const phone=JSON.parse(raw).phone;
    if(!phone) return;
    const res=await fetch(_BASE+'/backend/user_api.php?action=get_bookings&phone='+encodeURIComponent(phone));
    const json=await res.json();
    if(!json.success||!json.bookings) return;
    json.bookings.forEach(b=>{
      const prevStatus=_lastBookingStatuses[b.id];
      const hadCodes=_lastBookingCodes[b.id];
      const hasCodes=!!(b.happy_code&&b.sad_code);

      // Beep: technician accepted
      if(_bookingPollReady && prevStatus && ['new','broadcasted','pending'].includes(prevStatus) && ['accepted','assigned','arrived','ongoing'].includes(b.status)){
        playBookingAcceptedBeep();
        const techLine=b.technician_name
          ? ` 👷 ${b.technician_name}${b.technician_phone?' · 📞 '+b.technician_phone:''}`
          : '';
        showUserToast('',{icon:'✅',title:'Technician on the way!',sub:b.technician_name?`👷 ${b.technician_name}${b.technician_phone?' · '+b.technician_phone:''}`:' Your booking has been confirmed.',accent:'#16a34a'});
      }

      // Beep: completion codes just arrived
      if(_bookingPollReady && !hadCodes && hasCodes){
        playCompletionCodeBeep();
        showUserToast('',{icon:'🔐',title:'Your codes are ready',sub:'Open booking details and share one code with the technician.',accent:'#1d4ed8'});
        // Live-refresh detail modal if it's open for this booking
        const overlay=document.getElementById('bkDetailOverlay');
        if(overlay&&overlay.classList.contains('show')&&_openBkDetailData&&_openBkDetailData.id===b.id){
          _openBkDetailData=b;
          _renderBkDetail(b);
        }
      }

      _lastBookingStatuses[b.id]=b.status;
      _lastBookingCodes[b.id]=hasCodes;
    });
    _bookingPollReady=true;
  }catch(e){}
}

// Start polling when user is logged in
(function startUserPolling(){
  const u=localStorage.getItem('kwikar_user');
  if(!u) return;
  pollBookingStatus(); // populate baseline statuses
  setInterval(pollBookingStatus,10000); // check every 10s
})();

// ══ LEGAL INFO DROPDOWN ══
function toggleLegalMenu(){
  const btn=document.getElementById("legalMenuBtn");
  const dd=document.getElementById("legalMenuDropdown");
  const open=dd.classList.toggle("open");
  btn.classList.toggle("open",open);
}
document.addEventListener("click",function(e){
  if(!e.target.closest(".footer-legal-section")){
    document.getElementById("legalMenuDropdown")?.classList.remove("open");
    document.getElementById("legalMenuBtn")?.classList.remove("open");
  }
});

// ══ ABD MODAL ══
const abdModal=document.getElementById('abdModal');
const abdModalClose=document.getElementById('abdModalClose');
function openAbdModal(){
  if(!abdModal)return;
  abdModal.classList.add('show');
  abdModal.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
  setTimeout(()=>document.getElementById('abd-name')?.focus({preventScroll:true}),300);
}
function closeAbdModal(){
  if(!abdModal)return;
  abdModal.classList.remove('show');
  abdModal.setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');
}
abdModalClose?.addEventListener('click',closeAbdModal);
abdModal?.addEventListener('click',e=>{if(e.target===abdModal)closeAbdModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&abdModal?.classList.contains('show'))closeAbdModal()});

function submitAbd(){
  if(!abdModal)return;
  const name=document.getElementById('abd-name').value.trim();
  const phone=document.getElementById('abd-phone').value.trim();
  const city=document.getElementById('abd-city').value.trim();
  const pin=document.getElementById('abd-pin').value.trim();
  if(!name||!phone||!city||!pin){alert('Poora form bharo pehle!');return;}
  document.getElementById('abdFormBox').style.display='none';
  document.getElementById('abdSuccess').style.display='block';
}

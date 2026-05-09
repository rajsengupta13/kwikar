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
let cur=0,total=3,timer;
const track=document.getElementById('carouselTrack');
const slides=document.querySelectorAll('.carousel-slide');
const dots=document.querySelectorAll('.dot-btn');
function goSlide(n){slides[cur].classList.remove('active');dots[cur].classList.remove('active');cur=(n+total)%total;slides[cur].classList.add('active');dots[cur].classList.add('active');track.style.transform=`translateX(-${cur*100}%)`;resetTimer()}
function nextSlide(){goSlide(cur+1)}
function prevSlide(){goSlide(cur-1)}
function resetTimer(){clearInterval(timer);timer=setInterval(nextSlide,5500)}
resetTimer();

/* ══════════ TOUCH SWIPE ══════════ */
let ts=0;
track.addEventListener('touchstart',e=>{ts=e.touches[0].clientX},{passive:true});
track.addEventListener('touchend',e=>{const d=e.changedTouches[0].clientX-ts;if(Math.abs(d)>40)d<0?nextSlide():prevSlide()});

/* ══════════ COUNTDOWN 26 May 2026 ══════════ */
const LAUNCH=new Date('2026-05-26T00:00:00');
function tick(){
  const diff=LAUNCH-new Date();
  if(diff<=0){['d-days','d-hrs','d-min','d-sec'].forEach(i=>document.getElementById(i).textContent='00');return}
  document.getElementById('d-days').textContent=String(Math.floor(diff/86400000)).padStart(2,'0');
  document.getElementById('d-hrs').textContent=String(Math.floor(diff%86400000/3600000)).padStart(2,'0');
  document.getElementById('d-min').textContent=String(Math.floor(diff%3600000/60000)).padStart(2,'0');
  document.getElementById('d-sec').textContent=String(Math.floor(diff%60000/1000)).padStart(2,'0');
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
  document.getElementById('profOverlay').classList.add('show');
}
function closeProfModal(){document.getElementById('profOverlay').classList.remove('show')}
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

function openBkDetail(b){
  const status=b.status||'pending';
  const isPending=status==='pending';
  const isConfirmed=status==='confirmed'||status==='completed';
  const isCancelled=status==='cancelled';
  const expired=isPending&&isSlotExpired(b);
  const canCancel=isPending&&!expired;

  const techBlock = isConfirmed && b.technician_name ? `
    <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;padding:12px 14px;margin:10px 0">
      <div style="font-size:.7rem;font-weight:700;color:#16a34a;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">✅ Technician Assigned</div>
      <div class="bk-detail-row" style="margin-bottom:4px"><span>👷</span><span style="font-weight:800;color:#0d1b3e">${b.technician_name}</span></div>
      <div class="bk-detail-row" style="margin-bottom:0"><span>📞</span><a href="tel:${b.technician_phone}" style="color:#1d4ed8;font-weight:700;text-decoration:none">${b.technician_phone}</a></div>
    </div>` : '';

  document.getElementById('bkDetailContent').innerHTML=`
    <div class="bk-detail-service">${b.service} Service</div>
    <div class="bk-detail-issue">${b.issue}${b.other_issue?' — '+b.other_issue:''}</div>
    ${isCancelled
      ? `<div class="bk-cancelled-note">❌ Yeh booking cancel ho chuki hai</div>`
      : isConfirmed
        ? techBlock
        : expired
          ?`<div class="bk-sorry"><div class="bk-sorry-emoji">😔</div><div class="bk-sorry-title">Koi technician nahi mila!</div><div class="bk-sorry-sub">Selected time slot mein koi technician available nahi tha. Kya aap dobara schedule karna chahte hain?</div><button class="bk-reschedule-btn" onclick="closeBkDetail();window.location.href='booking.html?service=${encodeURIComponent(b.service)}'">🔄 Reschedule Karo</button></div>`
          :`<div class="bk-searching"><div class="bk-spin"></div><div class="bk-searching-text">Ek available technician dhundh rahe hain...</div><div class="bk-searching-sub">Awaiting for a technician to accept your request</div></div>`
    }
    ${b.slot_time?`<div class="bk-detail-row"><span>⏰</span><span>${b.slot_time}</span></div>`:''}
    ${b.slot_date?`<div class="bk-detail-row"><span>📅</span><span>${b.slot_date}</span></div>`:''}
    ${!expired&&!isCancelled?`<div class="bk-detail-row"><span>📌</span><span style="color:${isConfirmed?'#16a34a':isPending?'#f59e0b':'#64748b'};font-weight:800">${isConfirmed?'Confirmed':'Pending — Waiting for Technician'}</span></div>`:''}
    ${canCancel?`<button type="button" class="bk-cancel-btn" id="bkCancelBtn" onclick="cancelBooking(${b.id})">❌ Booking Cancel Karo</button>`:''}
  `;
  document.getElementById('bkDetailOverlay').classList.add('show');
}

async function cancelBooking(id){
  if(!confirm('Kya aap is booking ko cancel karna chahte hain?'))return;
  const u=JSON.parse(localStorage.getItem('kwikar_user')||'{}');
  if(!u.phone){alert('Pehle login karo');return;}
  const btn=document.getElementById('bkCancelBtn');
  if(btn){btn.disabled=true;btn.textContent='Cancelling...';}
  try{
    const res=await fetch('/mono-kwikar/backend/user_api.php?action=cancel_booking',{
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
    const res=await fetch('/mono-kwikar/backend/user_api.php?action=get_bookings&phone='+encodeURIComponent(u.phone));
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
    const res=await fetch('/mono-kwikar/backend/user_api.php?action=get_bookings&phone='+encodeURIComponent(p));
    const json=await res.json();
    if(json.success)updateBookingBadge(json.bookings.length);
  }catch(e){}
}

/* ══════════ LOGIN ══════════ */
/* ── Login role tracker ── */
let _loginRole='user'; // 'user' | 'tech'
let _pendingRole=null;

function selectRoleCard(role){
  _pendingRole=role;
  // card highlight
  document.getElementById('lrcCardUser').classList.toggle('lrc-selected',role==='user');
  document.getElementById('lrcCardTech').classList.toggle('lrc-selected',role==='tech');
  // enable continue button
  const btn=document.getElementById('lrcContinueBtn');
  btn.classList.add('lrc-active');
  document.getElementById('lrcBtnText').textContent=role==='user'?'Login as Customer':'Login as Technician';
}
function confirmRoleSelect(){
  if(_pendingRole)selectRole(_pendingRole);
}

function _showOnly(id){
  ['loginRoleView','loginPhoneView','loginPinView','loginRegStep1','loginRegStep2','loginRegStep3','loginTechRegView']
    .forEach(v=>{const el=document.getElementById(v);if(el)el.style.display=v===id?'':'none';});
  document.getElementById('loginBox').classList.toggle('scrollable',id==='loginTechRegView'||id==='loginRegStep2');
}

function openLoginModal(){
  _loginRole='user';
  _pendingRole=null;
  _showOnly('loginRoleView');
  // reset card state
  document.getElementById('lrcCardUser').classList.remove('lrc-selected');
  document.getElementById('lrcCardTech').classList.remove('lrc-selected');
  const btn=document.getElementById('lrcContinueBtn');
  btn.classList.remove('lrc-active');
  document.getElementById('lrcBtnText').textContent='Continue';
  document.getElementById('loginOverlay').classList.add('show');
}
function closeLoginModal(){
  document.getElementById('loginOverlay').classList.remove('show');
  document.getElementById('loginBox').classList.remove('scrollable');
}

function selectRole(role){
  _loginRole=role;
  _showOnly('loginPhoneView');
  document.getElementById('loginPhoneOnly').value='';
  document.getElementById('loginPhoneErr').textContent='';
  if(role==='tech'){
    document.getElementById('loginPhoneTitle').textContent='Technician Login';
    document.getElementById('loginPhoneSub').textContent='Apna registered mobile number daalo';
    document.getElementById('loginNewLabel').textContent='New Technician?';
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

function switchToRegister(){
  const ph=document.getElementById('loginPhoneOnly').value.trim();
  if(_loginRole==='tech'){
    // Close login modal, open the full technician signup flow
    closeLoginModal();
    openTechSignup();
    // Pre-fill phone if the user already typed it
    if(ph){const el=document.getElementById('tsPhone');if(el)el.value=ph;}
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
  const pinInput=document.getElementById('loginPinInput');
  pinInput.maxLength=isTech?6:4;
  pinInput.value='';
  pinInput.placeholder=isTech?'6-digit Technician PIN':'4-digit PIN';
  document.getElementById('loginPinSub').textContent=isTech
    ? 'Apna 6-digit technician PIN daalo'
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
  const expectedLen=isTech?6:4;
  if(!new RegExp('^\\d{'+expectedLen+'}$').test(pin)){
    err.textContent=`${expectedLen}-digit PIN daalo`;
    return;
  }
  err.textContent='';
  btn.disabled=true;
  const orig=btn.textContent;
  btn.textContent='Verifying…';
  try{
    const action=isTech?'verify_tech_pin':'verify_user_pin';
    const res=await fetch('/mono-kwikar/backend/user_api.php?action='+action,{
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
    const res=await fetch('/mono-kwikar/backend/user_api.php?action=save_user',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({...userData,pin})
    });
    const json=await res.json();
    if(!json.success){err.textContent=json.error||'Save nahi ho paya';return;}
  }catch(e){err.textContent='Server error — dobara try karo';return;}
  applyLogin(name,'user');closeLoginModal();refreshBookingBadge();
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
  try{await fetch('/mono-kwikar/backend/booking_api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'save_technician',name,phone:norm,email,skills:skills.join(', '),experience:exp,pincodes:pin})});}catch(_){}
  err.style.color='#22c55e';
  err.textContent='✅ Register ho gaya! Technician panel mein ja rahe hain…';
  setTimeout(()=>{
    closeLoginModal();
    redirectToTechPanel(name, techData.phone||norm, techData.email||'', techData.skills||'');
  },1400);
}
function redirectToTechPanel(name, phone, email, role){
  const base='/mono-kwikar/technician/frontend/index.html';
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
  const cards=msgs.map(m=>`<span class="ticker-card">${m}</span>`).join('');
  inner.innerHTML=cards+cards;
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
    reset();
    void el.offsetWidth;
    const ov=el.offsetWidth-wrap.offsetWidth;
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
  const name=document.getElementById('tsName').value.trim();
  const rawPhone=document.getElementById('tsPhone').value.trim();
  const phone=rawPhone.replace(/\D/g,'').slice(-10); // normalize to 10 digits
  const payload={
    name,phone,
    email:document.getElementById('tsEmail').value.trim(),
    skills:tsSelectedServices.join(', '),
    pincodes:tsPins.join(', '),
    experience:tsSelectedExp,
    role:'tech'
  };
  try{
    await fetch('/mono-kwikar/backend/booking_api.php',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'save_technician',...payload,pin})
    });
  }catch(e){}
  // Save to tech registry only (NOT kwikar_user — that is for customers)
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
  showTsStep('done');
  if(name){
    setTimeout(()=>{
      closeTechSignup();
      redirectToTechPanel(name, payload.phone||'', payload.email||'', payload.skills||'');
    },2200);
  }
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
    reset();
    void el.offsetWidth;
    const ov=el.offsetWidth-wrap.offsetWidth;
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

function submitBooking(){
  const app=APPLIANCES[bookingState.appliance];
  const issueLabel=bookingState.issue==='other-issue'
    ?bookingState.issueText
    :app.issues.find(i=>i.id===bookingState.issue)?.label||bookingState.issue;
  document.getElementById('bkSummary').innerHTML=
    `<div class="bk-sum-row"><span>📱 Mobile</span><strong>${bookingState.phone}</strong></div>`+
    `<div class="bk-sum-row"><span>🔧 Appliance</span><strong>${app.name}</strong></div>`+
    `<div class="bk-sum-row"><span>⚠️ Issue</span><strong>${issueLabel}</strong></div>`;
  queueFormData('kwikar-booking-queue',{
    phone:bookingState.phone,
    appliance:bookingState.appliance,
    applianceName:app.name,
    issue:bookingState.issue,
    issueLabel:issueLabel,
    issueText:bookingState.issueText,
    pincode:document.getElementById('pinIn')?.value||'',
    ts:Date.now()
  });
  showBookingStep('success');
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
      swReg=await navigator.serviceWorker.register('sw.js',{scope:'/mono-kwikar/frontend/'});
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
function showUserToast(msg){
  let t=document.getElementById('_userToast');
  if(!t){
    t=document.createElement('div');
    t.id='_userToast';
    t.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#0d1b3e;color:#fff;padding:12px 24px;border-radius:50px;font-size:.85rem;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.3);transition:opacity .4s;white-space:nowrap;max-width:90vw;text-align:center';
    document.body.appendChild(t);
  }
  t.textContent=msg; t.style.opacity='1';
  clearTimeout(t._tmr);
  t._tmr=setTimeout(()=>{t.style.opacity='0';},4500);
}

let _lastBookingStatuses={};
let _bookingPollReady=false;

async function pollBookingStatus(){
  const raw=localStorage.getItem('kwikar_user');
  if(!raw) return;
  try{
    const phone=JSON.parse(raw).phone;
    if(!phone) return;
    const res=await fetch('/mono-kwikar/backend/user_api.php?action=get_bookings&phone='+encodeURIComponent(phone));
    const json=await res.json();
    if(!json.success||!json.bookings) return;
    json.bookings.forEach(b=>{
      const prev=_lastBookingStatuses[b.id];
      // Only beep after first poll (so we don't beep on page load for already-confirmed bookings)
      if(_bookingPollReady && prev && prev!=='confirmed' && b.status==='confirmed'){
        playBookingAcceptedBeep();
        const techLine = b.technician_name
          ? ` 👷 ${b.technician_name}${b.technician_phone ? ' · 📞 '+b.technician_phone : ''}`
          : '';
        showUserToast('✅ Booking accepted!' + techLine + ' — Technician is on the way.');
      }
      _lastBookingStatuses[b.id]=b.status;
    });
    _bookingPollReady=true;
  }catch(e){}
}

// Start polling when user is logged in
(function startUserPolling(){
  const u=localStorage.getItem('kwikar_user');
  if(!u) return;
  pollBookingStatus(); // populate baseline statuses
  setInterval(pollBookingStatus,30000); // check every 30s
})();
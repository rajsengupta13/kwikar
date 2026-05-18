/* ============================================================
   KWIKAR TECHNICIAN — App Logic
   ============================================================ */

// ── Auth Guard ────────────────────────────────────────────
(function(){
  const p = new URLSearchParams(location.search);
  if (p.get('autologin') === '1') {
    const phone = decodeURIComponent(p.get('phone') || '');
    let avatar = '', cached = null;
    try {
      avatar = localStorage.getItem('kwikar_tech_avatar_' + phone) || '';
      const reg = JSON.parse(localStorage.getItem('kwikar_tech_registry') || '{}');
      cached = reg[phone] || null;
      if (!avatar && cached?.avatar) avatar = cached.avatar;
    } catch(_) {}
    window._autoLoginParams = {
      name:  decodeURIComponent(p.get('name')  || '') || cached?.name  || 'Technician',
      phone: phone,
      email: decodeURIComponent(p.get('email') || '') || cached?.email || '',
      role:  decodeURIComponent(p.get('role')  || '') || 'Technician',
      avatar: avatar
    };
    try {
      localStorage.setItem('kwikar_tech_lastlogin', JSON.stringify({
        phone,
        name:   window._autoLoginParams.name,
        email:  window._autoLoginParams.email,
        role:   window._autoLoginParams.role,
        avatar: avatar || ''
      }));
    } catch(_) {}
    history.replaceState(null, '', location.pathname);
  } else {
    let last = null;
    try { last = JSON.parse(localStorage.getItem('kwikar_tech_lastlogin') || 'null'); } catch(_) {}
    if (last?.phone) {
      let avatar = '';
      try { avatar = last.avatar || localStorage.getItem('kwikar_tech_avatar_' + last.phone) || ''; } catch(_) {}
      window._autoLoginParams = { name: last.name||'Technician', phone: last.phone, email: last.email||'', role: last.role||'Technician', avatar };
    } else {
      window.location.replace(window.location.pathname.replace(/\/technician\/.*$/, '') + '/frontend/index.html');
    }
  }
})();

// ── Tech profile ──────────────────────────────────────────
const TECH = {
  name:          window._autoLoginParams?.name  || 'Technician',
  phone:         window._autoLoginParams?.phone || '',
  email:         window._autoLoginParams?.email || '',
  plan:          'Flex',
  rating:        4.8,
  completedJobs: 0,
};

// ── Fallback / demo data (replaced by API on load) ────────
let JOBS = [];
let NOTIFS = [];
let TXNS = [
  { id:'KW-1024', desc:'AC Repair — Priya Sharma',    amt:850,  type:'cr', date:'Today, 10:30 AM',   ico:'fas fa-tools',     ibg:'var(--success-dim)', ic:'var(--success)' },
  { id:'W-482',   desc:'Withdrawal → HDFC Bank',      amt:5000, type:'dr', date:'May 7, 9:00 AM',    ico:'fas fa-university',ibg:'var(--danger-dim)',  ic:'var(--danger)'  },
  { id:'KW-1022', desc:'Washing Machine — Geeta',     amt:450,  type:'cr', date:'May 6, 12:00 PM',   ico:'fas fa-tools',     ibg:'var(--success-dim)', ic:'var(--success)' },
];

const WEEK_DATA   = [1200,1800,1400,2200,1600,2800,1800];
const WEEK_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// ── API ───────────────────────────────────────────────────
const API = '../backend/api/api.php';

// ── State ─────────────────────────────────────────────────
let currentSection = 'dashboard';
let currentJobTab  = 'new';
let chartsReady    = {};

// ── Back button — stay inside the panel ───────────────────
(function(){
  history.pushState(null, '');
  window.addEventListener('popstate', function() {
    history.pushState(null, '');
    if (currentSection === 'dashboard') {
      logout();
    } else {
      navigate('dashboard');
    }
  });
})();

// ── Navigation ────────────────────────────────────────────
function navigate(sec, jobTab) {
  if (sec === currentSection && !jobTab) return;

  const prev = document.querySelector(`#sec-${currentSection}`);
  if (prev) prev.classList.remove('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  currentSection = sec;

  const next = document.querySelector(`#sec-${sec}`);
  if (next) {
    next.classList.add('active');
    next.scrollTop = 0;
    next.querySelectorAll('.stagger').forEach(el => {
      el.querySelectorAll(':scope > *').forEach((c, i) => {
        c.style.animation = 'none';
        c.offsetHeight;
        c.style.animation = '';
        c.style.animationDelay = (i * 0.05 + 0.04) + 's';
      });
    });
  }
  document.querySelector(`.nav-item[data-sec="${sec}"]`)?.classList.add('active');

  if (sec === 'dashboard' && !chartsReady.dash) {
    renderSchedule();
    setTimeout(initDashChart, 320);
    chartsReady.dash = true;
  }
  if (sec === 'earn' && !chartsReady.earn) {
    loadWallet().then(() => { renderTxns(); setTimeout(initEarnChart, 320); });
    chartsReady.earn = true;
  }
  if (sec === 'jobs')          { loadJobsFromAPI().then(() => renderJobs(jobTab || currentJobTab)); }
  if (sec === 'notifications') { loadNotifsFromAPI().then(renderNotifs); }
}

// ── Render: Schedule ──────────────────────────────────────
function renderSchedule() {
  const el = document.getElementById('scheduleList');
  if (!el) return;
  const todayJobs = JOBS.filter(j => ['completed','ongoing','new'].includes(j.status)).slice(0, 4);
  if (!todayJobs.length) {
    el.innerHTML = '<div class="empty"><i class="fas fa-calendar-check"></i><p>No jobs scheduled yet</p></div>';
    return;
  }
  el.innerHTML = todayJobs.map((job, i) => `
    <div class="timeline-item">
      <div class="tl-time">
        <div class="t">${(job.time||'').split(' ')[0] || '—'}</div>
        <div class="ap">${(job.time||'').includes('AM')||(job.time||'').includes('PM') ? (job.time||'').split(' ')[1]||'' : ''}</div>
      </div>
      <div class="tl-spine">
        <div class="tl-dot ${job.status}"></div>
        ${i < todayJobs.length-1 ? '<div class="tl-line"></div>' : ''}
      </div>
      <div class="tl-body">
        <div class="tl-name">${job.name}</div>
        <div class="tl-meta">
          <span>${job.service}</span>
          <span>· <i class="fas fa-map-marker-alt"></i> ${job.loc}</span>
        </div>
      </div>
      <div class="tl-amt">₹${job.amt}</div>
    </div>
  `).join('');
}

// ── Render: Jobs ──────────────────────────────────────────
function renderJobs(tab) {
  currentJobTab = tab;

  // Live counts from current JOBS array
  const cnt = {
    new:       JOBS.filter(j => j.status === 'new').length,
    ongoing:   JOBS.filter(j => j.status === 'ongoing').length,
    completed: JOBS.filter(j => j.status === 'completed').length,
  };

  document.querySelectorAll('#jobTabs .tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
    const t     = b.dataset.tab;
    const label = t === 'new' ? 'New' : t === 'ongoing' ? 'Ongoing' : 'Done';
    const n     = cnt[t] || 0;
    b.textContent = n > 0 ? `${label} (${n})` : label;
  });

  const list     = document.getElementById('jobsList');
  const filtered = JOBS.filter(j => j.status === tab);

  if (!filtered.length) {
    list.innerHTML = `<div class="empty"><i class="fas fa-briefcase"></i><p>No ${tab} jobs right now</p></div>`;
    return;
  }

  list.innerHTML = filtered.map(job => `
    <div class="job-card">
      <div class="flex j-between items-c" style="margin-bottom:8px;">
        <div>
          <div class="job-id">#${job.id}</div>
          <div class="job-name">${job.name}</div>
          <div class="job-svc">${job.service}</div>
        </div>
        <span class="chip ${tab==='completed'?'chip-ok':tab==='ongoing'?'chip-go':'chip-new'}">
          ${tab==='completed'?'✓ Done':tab==='ongoing'?'▶ Active':'● New'}
        </span>
      </div>
      <div class="job-foot">
        <div class="job-meta-item"><i class="fas fa-clock"></i> ${job.time||'—'}</div>
        <div class="job-meta-item"><i class="fas fa-map-marker-alt"></i> ${job.loc}</div>
        ${job.phone ? `<div class="job-meta-item"><i class="fas fa-phone"></i> ${job.phone}</div>` : ''}
        <div class="job-amt">₹${job.amt}</div>
      </div>
      ${tab === 'new' ? `
        <div class="job-actions">
          <button type="button" class="btn-ghost" style="flex:1;text-align:center;" onclick="declineJob(${job.id})">Decline</button>
          <button type="button" class="btn btn-primary" style="margin:0;flex:1;padding:9px;" onclick="acceptJob(${job.id})">Accept</button>
        </div>` : ''}
      ${tab === 'ongoing' ? `
        <div class="job-actions">
          <button type="button" class="btn btn-primary" style="margin:0;width:100%;padding:9px;" onclick="completeJob(${job.id})">Mark Complete</button>
        </div>` : ''}
    </div>
  `).join('');
}

// ── Render: Notifications ─────────────────────────────────
function renderNotifs() {
  const el = document.getElementById('notifList');
  if (!el) return;
  const unread = NOTIFS.filter(n => !n.read).length;
  const dot = document.getElementById('notifBadgeDot');
  if (dot) dot.classList.toggle('show', unread > 0);

  if (!NOTIFS.length) {
    el.innerHTML = '<div class="empty"><i class="fas fa-bell-slash"></i><p>No notifications yet</p></div>';
    return;
  }
  el.innerHTML = NOTIFS.map(n => `
    <div class="notif-item ${n.read?'':'unread'}" onclick="markRead(${n.id})">
      <div class="notif-emo" style="background:${n.bg||'var(--accent-dim)'};">${n.icon||'🔔'}</div>
      <div class="notif-body">
        ${n.text}
        <div class="notif-time">${n.time}</div>
      </div>
    </div>
  `).join('');
}

function markRead(id) {
  const n = NOTIFS.find(n => n.id === id);
  if (n) { n.read = true; renderNotifs(); }
  try {
    fetch(API+'?module=notifications', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({action:'mark_read', id})
    });
  } catch(_) {}
}
function markAllRead() {
  NOTIFS.forEach(n => n.read = true);
  renderNotifs();
  showSnack('All notifications marked as read');
  try {
    fetch(API+'?module=notifications', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({action:'mark_all_read'})
    });
  } catch(_) {}
}

// ── Render: Transactions ──────────────────────────────────
function renderTxns() {
  const el = document.getElementById('txnList');
  if (!el) return;
  if (!TXNS.length) {
    el.innerHTML = '<div class="empty"><i class="fas fa-receipt"></i><p>No transactions yet</p></div>';
    return;
  }
  el.innerHTML = TXNS.map(t => `
    <div class="txn-row">
      <div class="txn-ico" style="background:${t.ibg};color:${t.ic};"><i class="${t.ico}"></i></div>
      <div class="txn-info">
        <div class="txn-name">${t.desc}</div>
        <div class="txn-date">${t.date} · #${t.id}</div>
      </div>
      <div class="txn-amt ${t.type}">${t.type==='cr'?'+':'-'}₹${t.amt.toLocaleString('en-IN')}</div>
    </div>
  `).join('');
}

// ── Charts ────────────────────────────────────────────────
function initDashChart() {
  const ctx = document.getElementById('dashChart');
  if (!ctx || ctx._chart) return;
  ctx._chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: WEEK_LABELS,
      datasets: [{
        data: WEEK_DATA,
        borderColor: '#4F7EFF', borderWidth: 2,
        backgroundColor: c => {
          const g = c.chart.ctx.createLinearGradient(0,0,0,140);
          g.addColorStop(0,'rgba(79,126,255,.15)'); g.addColorStop(1,'rgba(79,126,255,0)');
          return g;
        },
        fill: true, tension: 0.42,
        pointRadius: 3, pointBackgroundColor:'#4F7EFF',
        pointBorderColor:'#fff', pointBorderWidth: 2,
      }]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#0D1B3E', titleFont:{family:'DM Sans',size:11}, bodyFont:{family:'DM Sans',size:12}, padding:10, cornerRadius:8, callbacks:{label: v => ' ₹'+v.raw.toLocaleString('en-IN')} }},
      scales:{
        y:{ beginAtZero:false, grid:{color:'rgba(13,27,62,.04)'}, ticks:{font:{family:'DM Sans',size:9},color:'#8892A4',callback:v=>'₹'+(v>=1000?(v/1000).toFixed(1)+'k':v)} },
        x:{ grid:{display:false}, ticks:{font:{family:'DM Sans',size:9},color:'#8892A4'} }
      }
    }
  });
}

function initEarnChart() {
  const ctx = document.getElementById('earnChart');
  if (!ctx || ctx._chart) return;
  ctx._chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: WEEK_LABELS,
      datasets: [{
        data: WEEK_DATA,
        backgroundColor: c => {
          const g = c.chart.ctx.createLinearGradient(0,0,0,140);
          g.addColorStop(0,'rgba(79,126,255,.85)'); g.addColorStop(1,'rgba(79,126,255,.25)');
          return g;
        },
        borderRadius: 6, borderSkipped: false,
      }]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#0D1B3E', titleFont:{family:'DM Sans',size:11}, bodyFont:{family:'DM Sans',size:12}, padding:10, cornerRadius:8, callbacks:{label: v => ' ₹'+v.raw.toLocaleString('en-IN')} }},
      scales:{
        y:{ beginAtZero:true, grid:{color:'rgba(13,27,62,.04)'}, ticks:{font:{family:'DM Sans',size:9},color:'#8892A4',callback:v=>'₹'+(v>=1000?(v/1000).toFixed(1)+'k':v)} },
        x:{ grid:{display:false}, ticks:{font:{family:'DM Sans',size:9},color:'#8892A4'} }
      }
    }
  });
}

// ── API Loaders ───────────────────────────────────────────
async function loadJobsFromAPI() {
  try {
    const [rNew, rOng, rDone] = await Promise.all([
      fetch(API+'?module=jobs&status=new'),
      fetch(API+'?module=jobs&status=ongoing'),
      fetch(API+'?module=jobs&status=completed')
    ]);
    const [dNew, dOng, dDone] = await Promise.all([rNew.json(), rOng.json(), rDone.json()]);
    const mapJob = (j, status) => ({
      id:      j.id,
      name:    j.customer_name  || 'Customer',
      phone:   j.customer_phone || '',
      service: j.title || j.service_name || 'Service',
      time:    j.start_time || j.job_date || '',
      loc:     j.address || 'Address not provided',
      amt:     parseFloat(j.amount) || 0,
      status:  status
    });
    JOBS = [
      ...(dNew.jobs  || []).map(j => mapJob(j, 'new')),
      ...(dOng.jobs  || []).map(j => mapJob(j, 'ongoing')),
      ...(dDone.jobs || []).map(j => mapJob(j, 'completed'))
    ];
  } catch(e) { /* keep demo data */ }
}

async function loadNotifsFromAPI() {
  try {
    const res  = await fetch(API+'?module=notifications');
    const data = await res.json();
    if (data.status === 'success' && data.notifications?.length) {
      NOTIFS = data.notifications.map(n => ({
        id:   n.id,
        icon: n.type==='job'?'💼':n.type==='earning'?'💰':'📣',
        bg:   n.type==='job'?'var(--accent-dim)':n.type==='earning'?'var(--success-dim)':'var(--bg)',
        text: `<strong>${n.title}</strong> ${n.message||''}`,
        time: n.created_at || '',
        read: !!parseInt(n.is_read)
      }));
      const dot = document.getElementById('notifBadgeDot');
      if (dot) dot.classList.toggle('show', data.unread_count > 0);
    }
  } catch(e) {}
}

async function loadWallet() {
  try {
    const res  = await fetch(API+'?module=wallet');
    const data = await res.json();
    if (data.status === 'success') {
      if (data.transactions?.length) {
        TXNS = data.transactions.map(t => ({
          id:   t.transaction_id || t.id,
          desc: t.description || '',
          amt:  parseFloat(t.amount) || 0,
          type: t.type === 'credit' ? 'cr' : 'dr',
          date: (t.transaction_date || '').split('T')[0],
          ico:  t.type === 'debit' ? 'fas fa-university' : 'fas fa-tools',
          ibg:  t.type === 'debit' ? 'var(--danger-dim)' : 'var(--success-dim)',
          ic:   t.type === 'debit' ? 'var(--danger)'     : 'var(--success)'
        }));
      }
    }
  } catch(e) {}
}

// ── Actions ───────────────────────────────────────────────
async function acceptJob(id) {
  try {
    const res  = await fetch(API+'?module=jobs', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({action:'accept', job_id: id})
    });
    const data = await res.json();
    if (data.status === 'success') {
      showSnack('✅ Job accepted! Customer will be notified.');
      await loadJobsFromAPI();
      renderJobs('ongoing');
      renderSchedule();
    } else {
      showSnack(data.message || 'Could not accept job');
    }
  } catch(e) { showSnack('Network error — try again'); }
}

async function completeJob(id) {
  try {
    const res  = await fetch(API+'?module=jobs', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({action:'complete', job_id: id})
    });
    const data = await res.json();
    if (data.status === 'success') {
      showSnack('🎉 Job marked complete!');
      await loadJobsFromAPI();
      renderJobs('completed');
      renderSchedule();
    } else {
      showSnack(data.message || 'Could not complete job');
    }
  } catch(e) { showSnack('Network error — try again'); }
}

function declineJob(id) { showSnack('Job declined'); }

// ── Modals ────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

function openWithdraw() { openModal('withdrawOverlay'); }
function openTicket()   { openModal('ticketOverlay'); }

async function submitWithdraw() {
  const amt = document.getElementById('withdrawAmt').value;
  if (!amt || +amt <= 0) { showSnack('Enter a valid amount'); return; }
  try {
    const res  = await fetch(API+'?module=wallet', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({amount: +amt})
    });
    const data = await res.json();
    closeModal('withdrawOverlay');
    document.getElementById('withdrawAmt').value = '';
    showSnack(data.status==='success' ? `✅ ₹${(+amt).toLocaleString('en-IN')} withdrawal initiated!` : (data.message||'Withdrawal failed'));
    if (data.status === 'success') loadWallet().then(renderTxns);
  } catch(e) {
    closeModal('withdrawOverlay');
    showSnack(`₹${(+amt).toLocaleString('en-IN')} withdrawal initiated!`);
  }
}

async function submitTicket() {
  const sub  = document.getElementById('ticketSubject').value.trim();
  const desc = document.getElementById('ticketDesc').value.trim();
  if (!sub) { showSnack('Please enter a subject'); return; }
  try {
    const res  = await fetch(API+'?module=support', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({subject: sub, description: desc})
    });
    const data = await res.json();
    closeModal('ticketOverlay');
    document.getElementById('ticketSubject').value = '';
    document.getElementById('ticketDesc').value    = '';
    showSnack(data.status==='success' ? `✅ Ticket #${data.ticket_id} raised!` : (data.message||'Ticket submitted!'));
  } catch(e) {
    closeModal('ticketOverlay');
    showSnack("Ticket submitted — we'll get back soon!");
  }
}

// ── Settings sheets ───────────────────────────────────────
const SHEETS = {
  profile: {
    title: 'Profile Settings',
    html: `
      <div class="form-row">
        <div class="form-group"><label>Full Name</label><input type="text" value="${TECH.name}"></div>
        <div class="form-group"><label>Mobile</label><input type="text" value="${TECH.phone||'+91 98765 43210'}"></div>
      </div>
      <div class="form-group"><label>Email</label><input type="email" value="${TECH.email||''}"></div>
      <div class="form-row">
        <div class="form-group"><label>Service Category</label>
          <select><option selected>AC Technician</option><option>Electrician</option><option>Plumber</option><option>Carpenter</option></select>
        </div>
        <div class="form-group"><label>Experience</label>
          <select><option>3+ Years</option><option>2-3 Years</option><option>0-1 Year</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>City</label><input type="text" placeholder="Your city"></div>
        <div class="form-group"><label>State</label><input type="text" placeholder="Your state"></div>
      </div>
      <button type="button" class="btn btn-primary" onclick="showSnack('Profile saved!');closeModal('settingsOverlay')">Save Changes</button>`
  },
  bank: {
    title: 'Bank Details',
    html: `
      <div class="form-group"><label>Account Holder Name</label><input type="text" value="${TECH.name}"></div>
      <div class="form-group"><label>Account Number</label><input type="text" placeholder="Enter account number"></div>
      <div class="form-row">
        <div class="form-group"><label>IFSC Code</label><input type="text" placeholder="HDFC0001234"></div>
        <div class="form-group"><label>Bank Name</label><input type="text" placeholder="HDFC Bank"></div>
      </div>
      <div class="form-group"><label>UPI ID</label><input type="text" placeholder="name@bank"></div>
      <button type="button" class="btn btn-primary" onclick="showSnack('Bank details saved!');closeModal('settingsOverlay')">Save Details</button>`
  },
  app: {
    title: 'App Preferences',
    html: `
      <div class="form-group"><label>Language</label>
        <select><option>English</option><option>Hindi</option><option>Tamil</option><option>Telugu</option><option>Marathi</option></select>
      </div>
      <div class="flex items-c j-between" style="padding:12px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin-bottom:12px;">
        <div><div style="font-size:13px;font-weight:500;color:var(--navy)">Offline Mode</div><div style="font-size:10px;color:var(--text-3)">Work in low network areas</div></div>
        <div class="toggle" onclick="this.classList.toggle('on')"></div>
      </div>
      <div class="flex items-c j-between" style="padding:12px 0;border-bottom:1px solid var(--border);margin-bottom:12px;">
        <div><div style="font-size:13px;font-weight:500;color:var(--navy)">Job Sound Alerts</div><div style="font-size:10px;color:var(--text-3)">Play sound on new job</div></div>
        <div class="toggle on" onclick="this.classList.toggle('on')"></div>
      </div>
      <button type="button" class="btn btn-primary" onclick="showSnack('Preferences saved!');closeModal('settingsOverlay')">Save</button>`
  },
  security: {
    title: 'Privacy & Security',
    html: `
      <div class="flex items-c j-between" style="padding:12px 0;border-bottom:1px solid var(--border);">
        <div><div style="font-size:13px;font-weight:500;color:var(--navy)">Two-Step Verification</div><div style="font-size:10px;color:var(--text-3)">Add an extra layer of security</div></div>
        <div class="toggle" onclick="this.classList.toggle('on')"></div>
      </div>
      <div style="margin-top:16px;">
        <div style="font-size:12px;font-weight:600;color:var(--navy);margin-bottom:10px;">Change PIN</div>
        <div class="form-group"><label>Current PIN</label><input type="password" placeholder="Enter current PIN"></div>
        <div class="form-group"><label>New PIN</label><input type="password" placeholder="Min 6 digits"></div>
        <button type="button" class="btn btn-primary" onclick="showSnack('PIN updated!');closeModal('settingsOverlay')">Update PIN</button>
      </div>`
  }
};

function openSettings(type) {
  const sheet = SHEETS[type];
  if (!sheet) return;
  document.getElementById('settingsTitle').textContent  = sheet.title;
  document.getElementById('settingsContent').innerHTML = sheet.html;
  openModal('settingsOverlay');
}

// ── Snackbar ──────────────────────────────────────────────
let _snackT;
function showSnack(msg) {
  const sb = document.getElementById('snackbar');
  if (!sb) return;
  sb.textContent = msg;
  sb.classList.add('show');
  clearTimeout(_snackT);
  _snackT = setTimeout(() => sb.classList.remove('show'), 2800);
}

// ── Greeting ──────────────────────────────────────────────
function initGreeting() {
  const h  = new Date().getHours();
  const g  = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const el = document.getElementById('greetWord');
  if (el) el.textContent = g;
}

// ── Beep + New-Job Polling ────────────────────────────────
function playNewJobBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [520, 700, 880].forEach((freq, i) => {
      setTimeout(() => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = freq; o.type = 'sine';
        g.gain.setValueAtTime(0.22, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        o.start(); o.stop(ctx.currentTime + 0.25);
      }, i * 280);
    });
  } catch(e) {}
}

let _prevNewJobCount = -1;

async function pollNewJobs() {
  try {
    const res  = await fetch(API+'?module=jobs&status=new');
    const data = await res.json();
    if (data.status !== 'success') return;
    const count = (data.jobs || []).length;
    if (_prevNewJobCount !== -1 && count > _prevNewJobCount) {
      const diff = count - _prevNewJobCount;
      playNewJobBeep();
      showSnack(`🔔 ${diff} new job${diff > 1 ? 's' : ''} available! Check Jobs tab.`);
      // Refresh schedule if on dashboard
      if (currentSection === 'dashboard') {
        await loadJobsFromAPI();
        renderSchedule();
      }
    }
    _prevNewJobCount = count;
  } catch(e) {}
}

// ── Boot ──────────────────────────────────────────────────
async function bootApp() {
  // Update hero with real name
  const heroName = document.querySelector('.hero-name');
  if (heroName) heroName.textContent = `Hello, ${TECH.name.split(' ')[0]} 👋`;

  // Update profile section avatar/name
  const profName  = document.querySelector('.profile-name');
  const profEmail = document.querySelector('.profile-email');
  const profAv    = document.querySelector('.profile-av');
  if (profName)  profName.textContent  = TECH.name;
  if (profEmail) profEmail.textContent = TECH.email || '';

  const avatar = window._autoLoginParams?.avatar || '';
  const initial = TECH.name.charAt(0).toUpperCase();

  // Profile section: show uploaded photo or fallback to initial
  if (profAv) {
    if (avatar) {
      profAv.innerHTML = `<img src="${avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;position:absolute;inset:0;">
        <div class="cam"><i class="fas fa-camera"></i></div>`;
      profAv.style.position = 'relative';
    } else {
      profAv.childNodes[0].textContent = initial;
    }
  }

  // Topbar avatar pill: show photo or initial
  const av = document.querySelector('.av');
  if (av) {
    if (avatar) {
      av.innerHTML = `<img src="${avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
      av.textContent = initial;
    }
  }

  if (TECH.phone) {
    try {
      const res  = await fetch(API+'?module=setup_session', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({phone: TECH.phone})
      });
      const data = await res.json();
      if (data.status === 'success' && data.tech) {
        if (data.tech.full_name) {
          TECH.name = data.tech.full_name;
          if (heroName) heroName.textContent = `Hello, ${TECH.name.split(' ')[0]} 👋`;
          if (profName) profName.textContent  = TECH.name;
          if (av)       av.textContent        = TECH.name.charAt(0).toUpperCase();
        }
        if (data.tech.email) TECH.email = data.tech.email;
        if (data.tech.service_category) TECH.role = data.tech.service_category;
      }
    } catch(e) {}

    await Promise.all([loadJobsFromAPI(), loadNotifsFromAPI()]);
    // Start polling every 30s for new jobs
    pollNewJobs(); // baseline — no beep on first call
    setInterval(pollNewJobs, 30000);
  }

  initGreeting();
  renderSchedule();
  renderNotifs();
  setTimeout(initDashChart, 400);
  chartsReady.dash = true;
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Close overlay on backdrop click
  document.querySelectorAll('.overlay').forEach(ov => {
    ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
  });
  bootApp();
});

// ── Logout ────────────────────────────────────────────────
function logout() {
  if (confirm('Logout from Kwikar?')) {
    try { fetch(API+'?module=logout', {method:'POST'}); } catch(_) {}
    localStorage.removeItem('kwikar_tech_lastlogin');
    window.location.replace(window.location.pathname.replace(/\/technician\/.*$/, '') + '/frontend/index.html');
  }
}

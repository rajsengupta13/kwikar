// kwikar-shell.jsx — Sidebar, TopBar, App router
const { useState, useEffect, useRef, useCallback } = React;

const ADMIN_API = window.location.pathname.replace(/\/frontend\/.*/, '') + '/backend/api/api.php';

async function adminApi(module, body, method) {
  const url = ADMIN_API + '?module=' + module;
  const opts = { credentials: 'include' };
  if (body || method === 'POST') {
    opts.method = 'POST';
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body    = JSON.stringify(body || {});
  }
  const res = await fetch(url, opts);
  if (!res.ok && res.status !== 401) throw new Error('HTTP ' + res.status);
  return res.json();
}
window.adminApi = adminApi;

// ── Login Page ────────────────────────────────────────────────────────────────
function AdminLoginPage({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError('Email and password required'); return; }
    setLoading(true); setError('');
    try {
      const res = await adminApi('login', { email, password });
      if (res.success) {
        onLogin(res.admin);
      } else {
        setError(res.error || 'Login failed');
      }
    } catch(ex) {
      setError('Server error — check connection');
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', fontFamily:"'Inter',sans-serif" }}>
      {/* Background glow */}
      <div style={{ position:'fixed', top:-120, left:'50%', transform:'translateX(-50%)', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(34,211,238,.07) 0%, transparent 70%)', pointerEvents:'none' }}/>

      <div style={{ width:'100%', maxWidth:400, padding:'0 20px' }}>
        {/* Logo */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:40 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'linear-gradient(135deg,var(--cyan),var(--purple))', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 32px rgba(34,211,238,.4)', marginBottom:16 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:700, color:'var(--text)', letterSpacing:'-.02em' }}>Kwikar</div>
          <div style={{ fontSize:12, color:'var(--text3)', letterSpacing:'.1em', textTransform:'uppercase', marginTop:4 }}>Super Admin Portal</div>
        </div>

        {/* Card */}
        <div className="kcard" style={{ padding:'32px', borderColor:'rgba(255,255,255,.1)' }}>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:18, fontWeight:600, color:'var(--text)', marginBottom:6 }}>Welcome back</div>
          <div style={{ fontSize:13, color:'var(--text3)', marginBottom:28 }}>Sign in to your admin dashboard</div>

          {error && (
            <div style={{ padding:'10px 14px', borderRadius:8, background:'var(--red-d)', border:'1px solid rgba(248,113,113,.3)', color:'var(--red)', fontSize:13, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
              <Ico n="alertCircle" s={14} c="var(--red)"/>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:6 }}>Email or Phone</label>
              <input
                className="kinput" type="text" value={email}
                onChange={e=>setEmail(e.target.value)}
                placeholder="admin@kwikar.com"
                style={{ height:42 }}
                autoComplete="username"
              />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:6 }}>Password</label>
              <div style={{ position:'relative' }}>
                <input
                  className="kinput" type={showPass ? 'text' : 'password'}
                  value={password} onChange={e=>setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ height:42, paddingRight:40 }}
                  autoComplete="current-password"
                />
                <button type="button" onClick={()=>setShowPass(v=>!v)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:0 }}>
                  <Ico n={showPass ? 'eye' : 'eye'} s={15} c="var(--text3)"/>
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ marginTop:8, height:44, borderRadius:8, border:'none', background:'linear-gradient(135deg,var(--cyan),var(--purple))', color:'#fff', fontFamily:"'Space Grotesk',sans-serif", fontSize:14, fontWeight:600, cursor:loading?'not-allowed':'pointer', opacity:loading?.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'opacity .15s' }}>
              {loading ? <Spinner size={16} color="#fff"/> : <Ico n="lock" s={15} c="#fff"/>}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <div style={{ textAlign:'center', marginTop:20, fontSize:12, color:'var(--text3)' }}>
          Kwikar Super Admin · Authorized access only
        </div>
      </div>
    </div>
  );
}

const NAV = [
  { id:'dashboard', label:'Dashboard', icon:'home', group:'core' },
  { id:'live', label:'Live Activity', icon:'activity', group:'core', live:true },
  { id:'customers', label:'Customers', icon:'users', group:'ops' },
  { id:'technicians', label:'Technicians', icon:'wrench', group:'ops' },
  { id:'abd', label:'ABD Management', icon:'briefcase', group:'ops' },
  { id:'tree', label:'Referral Network', icon:'share', group:'ops' },
  { id:'bookings', label:'Bookings', icon:'calendar', group:'ops' },
  { id:'revenue', label:'Revenue & Commissions', icon:'dollar', group:'finance' },
  { id:'subscriptions', label:'Subscription Plans', icon:'layers', group:'finance' },
  { id:'areas', label:'Pincode & Areas', icon:'mapPin', group:'geo' },
  { id:'promotions', label:'Promotions & Boosts', icon:'zap', group:'geo' },
  { id:'reports', label:'Reports & Analytics', icon:'barChart', group:'analytics' },
  { id:'reviews', label:'Site Reviews', icon:'star', group:'support' },
  { id:'complaints', label:'Complaints', icon:'alertCircle', group:'support' },
  { id:'fraud', label:'Fraud Detection', icon:'shield', group:'support' },
  { id:'notifications', label:'Notifications', icon:'bell', group:'system' },
  { id:'audit', label:'Audit Logs', icon:'list', group:'system' },
  { id:'settings', label:'Settings', icon:'settings', group:'system' },
];

const GROUP_LABELS = { core:'', ops:'Operations', finance:'Finance', geo:'Geographic', analytics:'Analytics', support:'Support', system:'System' };

function Sidebar({ current, onNav, onLogout, admin }) {
  const groups = [...new Set(NAV.map(n=>n.group))];
  return (
    <aside style={{ width:'var(--sw)', flexShrink:0, background:'var(--sidebar-bg)', borderRight:'1px solid var(--border-s)', display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      <div style={{ padding:'20px 18px 16px', borderBottom:'1px solid var(--border-s)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,var(--cyan),var(--purple))', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 16px rgba(34,211,238,.4)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <div>
            <div style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:15, color:'var(--text)', letterSpacing:'-.02em' }}>Kwikar</div>
            <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'.06em', textTransform:'uppercase' }}>Super Admin</div>
          </div>
        </div>
      </div>

      <nav style={{ flex:1, overflowY:'auto', padding:'12px 10px', display:'flex', flexDirection:'column', gap:2 }}>
        {groups.map(g => (
          <div key={g}>
            {GROUP_LABELS[g] && (
              <div style={{ fontSize:10, fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--text3)', padding:'10px 8px 4px' }}>
                {GROUP_LABELS[g]}
              </div>
            )}
            {NAV.filter(n=>n.group===g).map(n => (
              <NavItem key={n.id} item={n} active={current===n.id} onNav={onNav}/>
            ))}
          </div>
        ))}
      </nav>

      <div style={{ borderTop:'1px solid var(--border-s)', padding:'12px 14px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Avatar name={admin?.name || 'Admin'} size={30} online={true}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12.5, fontWeight:500, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{admin?.name || 'Super Admin'}</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>{admin?.email || 'admin@kwikar.com'}</div>
          </div>
          <button type="button" onClick={onLogout} title="Logout" style={{ background:'none', border:'none', cursor:'pointer', padding:4, borderRadius:6, color:'var(--text3)' }}
            onMouseEnter={e=>e.currentTarget.style.color='var(--red)'}
            onMouseLeave={e=>e.currentTarget.style.color='var(--text3)'}>
            <Ico n="x" s={14} c="currentColor"/>
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ item, active, onNav }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={() => onNav(item.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'8px 10px', borderRadius:7, border:'none', cursor:'pointer', transition:'all .15s', background: active ? 'rgba(34,211,238,.1)' : hov ? 'rgba(255,255,255,.04)' : 'transparent', color: active ? 'var(--cyan)' : hov ? 'var(--text)' : 'var(--text2)', fontFamily:'inherit', fontSize:13, fontWeight: active ? 500 : 400, textAlign:'left', position:'relative' }}
    >
      <Ico n={item.icon} s={14} c="currentColor"/>
      <span style={{ flex:1 }}>{item.label}</span>
      {item.live && (
        <span style={{ display:'inline-flex', alignItems:'center', gap:3, background:'var(--red-d)', borderRadius:10, padding:'1px 6px' }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--red)', animation:'pulse 1.5s infinite' }}/>
          <span style={{ fontSize:9, fontWeight:600, color:'var(--red)', letterSpacing:'.04em' }}>LIVE</span>
        </span>
      )}
      {active && <div style={{ position:'absolute', right:0, top:'50%', transform:'translateY(-50%)', width:3, height:18, background:'var(--cyan)', borderRadius:'3px 0 0 3px' }}/>}
    </button>
  );
}

function TopBar({ current, onNav, admin, onLogout }) {
  const [search, setSearch] = useState('');
  const [showNotif, setShowNotif] = useState(false);
  const label = NAV.find(n=>n.id===current)?.label || 'Dashboard';

  const notifications = [
    { id:1, msg:'3 new technicians pending approval', time:'5m ago', type:'info', unread:true },
    { id:2, msg:'Fraud alert on account C005', time:'2h ago', type:'alert', unread:true },
    { id:3, msg:'Monthly revenue report ready', time:'4h ago', type:'report', unread:true },
    { id:4, msg:'Payout batch TX008 pending approval', time:'1d ago', type:'payout', unread:false },
  ];

  return (
    <div style={{ height:'var(--th)', background:'var(--topbar-bg)', backdropFilter:'blur(16px)', borderBottom:'1px solid var(--border-s)', display:'flex', alignItems:'center', gap:16, padding:'0 20px', flexShrink:0, position:'relative', zIndex:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginRight:'auto' }}>
        <span style={{ fontSize:11, color:'var(--text3)' }}>Kwikar</span>
        <Ico n="chevRight" s={11} c="var(--text3)"/>
        <span style={{ fontFamily:'Space Grotesk', fontSize:14, fontWeight:600, color:'var(--text)' }}>{label}</span>
      </div>

      <div style={{ position:'relative', width:240 }}>
        <div style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
          <Ico n="search" s={13} c="var(--text3)"/>
        </div>
        <input className="kinput" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search anything…" style={{ paddingLeft:32, height:34, fontSize:12.5 }}/>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', background:'var(--green-d)', borderRadius:20, border:'1px solid rgba(52,211,153,.2)' }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', animation:'pulse 2s infinite' }}/>
        <span style={{ fontSize:11, fontWeight:500, color:'var(--green)' }}>All Systems Normal</span>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:5, color:'var(--text3)', fontSize:12 }}>
        <Ico n="users" s={13} c="var(--text3)"/>
        <span style={{ color:'var(--text2)' }}><span style={{ color:'var(--cyan)', fontWeight:600 }}>2,341</span> online</span>
      </div>

      <div style={{ position:'relative' }}>
        <button onClick={()=>setShowNotif(v=>!v)} className="kbtn" style={{ padding:'6px 8px', position:'relative' }}>
          <Ico n="bell" s={15}/>
          <span style={{ position:'absolute', top:3, right:3, width:8, height:8, borderRadius:'50%', background:'var(--red)', border:'2px solid var(--sidebar-bg)' }}/>
        </button>
        {showNotif && (
          <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:320, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', boxShadow:'0 16px 40px rgba(0,0,0,.5)', zIndex:100 }} className="fade-up">
            <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border-s)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontFamily:'Space Grotesk', fontWeight:600, fontSize:14 }}>Notifications</span>
              <Badge type="live" label="3 new"/>
            </div>
            {notifications.map(n => (
              <div key={n.id} style={{ padding:'12px 16px', borderBottom:'1px solid var(--border-s)', display:'flex', gap:10, cursor:'pointer', background: n.unread ? 'rgba(34,211,238,.03)' : 'transparent' }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background: n.type==='alert'?'var(--red-d)':n.type==='payout'?'var(--green-d)':'var(--cyan-d)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Ico n={n.type==='alert'?'shield':n.type==='payout'?'dollar':n.type==='report'?'barChart':'bell'} s={14} c={n.type==='alert'?'var(--red)':n.type==='payout'?'var(--green)':'var(--cyan)'}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12.5, color:'var(--text)', lineHeight:1.4 }}>{n.msg}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{n.time}</div>
                </div>
                {n.unread && <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--cyan)', flexShrink:0, marginTop:4 }}/>}
              </div>
            ))}
            <div style={{ padding:'10px 16px' }}>
              <button className="kbtn" style={{ width:'100%', justifyContent:'center', fontSize:12 }}>View all notifications</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 8px', borderRadius:'var(--rs)', border:'1px solid var(--border)', background:'var(--card)' }}>
        <Avatar name={admin?.name || 'Admin'} size={26}/>
        <span style={{ fontSize:12.5, fontWeight:500 }}>{admin?.name?.split(' ')[0] || 'Admin'}</span>
        <button type="button" onClick={onLogout} title="Logout"
          style={{ background:'none', border:'none', cursor:'pointer', padding:'2px 4px', borderRadius:4, color:'var(--text3)', display:'flex', alignItems:'center' }}
          onMouseEnter={e=>e.currentTarget.style.color='var(--red)'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--text3)'}>
          <Ico n="x" s={13} c="currentColor"/>
        </button>
      </div>
    </div>
  );
}

function KwikarApp() {
  const [page, setPage]         = useState('dashboard');
  const [admin, setAdmin]       = useState(null);
  const [checking, setChecking] = useState(true);

  // Check if already logged in via session
  useEffect(() => {
    adminApi('stats_live')
      .then(res => {
        if (res.status === 'success' || res.success === true) {
          try {
            const stored = JSON.parse(localStorage.getItem('kw_admin') || 'null');
            setAdmin(stored || { name:'Admin', email:'' });
          } catch(_) { setAdmin({ name:'Admin', email:'' }); }
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  function handleLogin(adminData) {
    localStorage.setItem('kw_admin', JSON.stringify(adminData));
    setAdmin(adminData);
  }

  async function handleLogout() {
    await adminApi('logout', {}).catch(() => {});
    localStorage.removeItem('kw_admin');
    setAdmin(null);
  }

  if (checking) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)' }}>
        <Spinner size={32} color="var(--cyan)"/>
      </div>
    );
  }

  // Not logged in → send back to main site login
  if (!admin) {
    const mainSite = window.location.pathname.replace(/\/admin\/frontend\/.*/, '') + '/frontend/index.html';
    window.location.replace(mainSite);
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)', flexDirection:'column', gap:16 }}>
        <Spinner size={32} color="var(--cyan)"/>
        <div style={{ color:'var(--text3)', fontSize:13 }}>Redirecting to login…</div>
      </div>
    );
  }

  const pageMap = {
    dashboard:    () => <DashboardPage/>,
    live:         () => <LiveActivityPage/>,
    customers:    () => <CustomersPage/>,
    technicians:  () => <TechniciansPage/>,
    abd:          () => <ABDPage/>,
    tree:         () => <ReferralTreePage/>,
    bookings:     () => <BookingsPage/>,
    revenue:      () => <RevenuePage/>,
    fraud:        () => <FraudPage/>,
    notifications:() => <NotificationsPage/>,
    reports:      () => <ReportsPage/>,
    audit:        () => <AuditPage/>,
    settings:     () => <SettingsPage/>,
    subscriptions:() => <PlaceholderPage label="Subscription Plans"/>,
    areas:        () => <PlaceholderPage label="Pincode & Area Control"/>,
    promotions:   () => <PlaceholderPage label="Promotions & Boosts"/>,
    reviews:      () => <ReviewsPage/>,
    complaints:   () => <PlaceholderPage label="Complaints & Disputes"/>,
  };

  const renderPage = (pageMap[page] || (() => <PlaceholderPage label={page}/>));

  return (
    <div style={{ display:'flex', width:'100vw', height:'100vh', overflow:'hidden' }}>
      <Sidebar current={page} onNav={setPage} onLogout={handleLogout} admin={admin}/>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        <TopBar current={page} onNav={setPage} admin={admin} onLogout={handleLogout}/>
        <div style={{ flex:1, overflow:'hidden' }} key={page}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { KwikarApp, Sidebar, TopBar });

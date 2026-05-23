// kwikar-app.jsx — Main App shell + routing + login
const { useState } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "primaryColor": "#ff5a1f",
  "darkMode": false,
  "sidebarCollapsed": false,
  "density": "comfortable"
}/*EDITMODE-END*/;

// ── Login Page ────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [phone, setPhone] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showPin, setShowPin] = React.useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!phone || !pin) { setError('Phone aur PIN daalo'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await window.abdApi('login', { phone, pin });
      if (res.success) {
        sessionStorage.setItem('abd_phone', phone);
        window.ABD_SESSION = res.abd;
        onLogin(res.abd);
      } else {
        setError(res.error || res.message || 'Login failed');
      }
    } catch (ex) {
      setError('Server error: ' + (ex.message || 'check connection'));
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0d1117 0%, #1a2332 100%)',
      fontFamily: "'Manrope', sans-serif", padding: '24px'
    }}>
      {/* Background decorations */}
      <div style={{ position: 'fixed', top: -120, right: -120, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,90,31,0.06)', pointerEvents: 'none' }}/>
      <div style={{ position: 'fixed', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(59,130,246,0.05)', pointerEvents: 'none' }}/>

      <div style={{
        width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.97)',
        borderRadius: 24, boxShadow: '0 40px 100px rgba(0,0,0,0.35)', overflow: 'hidden'
      }}>
        {/* Header bar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg,#ff5a1f,#ff8c00)' }}/>

        <div style={{ padding: '36px 36px 32px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 13, flexShrink: 0,
              background: 'linear-gradient(135deg,#ff5a1f,#ff8c00)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(255,90,31,0.45)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#fff"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>Kwikar</div>
              <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>ABD Portal</div>
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Welcome back</h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Sign in to your Area Business Director panel</p>
          </div>

          {error && (
            <div style={{
              padding: '11px 14px', borderRadius: 10, background: '#fff1f1',
              border: '1px solid #fecaca', color: '#dc2626', fontSize: 13,
              fontWeight: 600, marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center'
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.12 2.2 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.27 7a16 16 0 006.72 6.72l1.06-1.06a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92v2z"/>
                </svg>
                <input
                  type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  style={{
                    width: '100%', padding: '12px 14px 12px 42px', borderRadius: 11,
                    border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit',
                    color: '#0f172a', background: '#f8fafc', outline: 'none',
                    boxSizing: 'border-box', transition: 'border-color 0.15s, background 0.15s'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#ff5a1f'; e.target.style.background = '#fff'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                6-Digit PIN
              </label>
              <div style={{ position: 'relative' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <input
                  type={showPin ? 'text' : 'password'} value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g,'').slice(0,6))}
                  placeholder="Enter your 6-digit PIN"
                  maxLength={6}
                  style={{
                    width: '100%', padding: '12px 44px 12px 42px', borderRadius: 11,
                    border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit',
                    color: '#0f172a', background: '#f8fafc', outline: 'none',
                    boxSizing: 'border-box', transition: 'border-color 0.15s, background 0.15s',
                    letterSpacing: showPin ? 'normal' : '0.2em'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#ff5a1f'; e.target.style.background = '#fff'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                />
                <button type="button" onClick={() => setShowPin(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4
                  }}>
                  {showPin
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: loading ? '#f97316' : 'linear-gradient(135deg,#ff5a1f,#ff3c00)',
                color: '#fff', fontSize: 15, fontWeight: 800, cursor: loading ? 'wait' : 'pointer',
                fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(255,90,31,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.15s', marginTop: 4
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; }}>
              {loading
                ? <><Spinner size={18} color="#fff"/> Signing in…</>
                : 'Sign In to ABD Panel'
              }
            </button>
          </form>

          <div style={{ marginTop: 24, padding: '16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>New ABD?</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Contact your Kwikar area manager to get registered as an Area Business Director.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Seed window.KD with real session data — wipes all demo values ────
function seedKDFromSession(abd) {
  const words = (abd.full_name || 'ABD User').trim().split(/\s+/);
  const initials = (words[0]?.[0] || '').toUpperCase() + (words[1]?.[0] || '').toUpperCase();
  const pincodes = (abd.area || '').split(',').map(p => p.trim()).filter(Boolean);

  window.KD.abd = {
    name:        abd.full_name     || 'ABD User',
    id:          'ABD-' + (abd.abd_id || abd.user_id || ''),
    area:        abd.area          || '',
    pincodes,
    avatar:      initials          || 'AU',
    rating:      4.5,
    level:       'ABD',
    phone:       abd.phone         || '',
    email:       abd.email         || '',
    aadhaar:     'KYC Pending',
    pan:         'KYC Pending',
    bank:        'Not linked',
    upi:         'Not linked',
  };

  // Zero out all demo stats so pages show real (empty) data not fake numbers
  window.KD.earnings = {
    total: 0, today: 0, thisMonth: 0,
    wallet: +(abd.wallet_balance) || 0,
    directReferral: 0, indirectReferral: 0,
    pending: 0, totalWithdrawals: 0, trend: 0,
  };
  window.KD.technicians  = { total:0, direct:0, referral:0, active:0, inactive:0 };
  window.KD.bookings     = { total:0, pending:0, active:0, completed:0, cancelled:0 };
  window.KD.revenueData  = Array(30).fill(0);
  window.KD.activityFeed = [];
  window.KD.directTechnicians = [];
  window.KD.autoJoined   = [];
  window.KD.bookingsList = [];
  window.KD.transactions = [];
  window.KD.pincodes     = pincodes.map(code => ({
    code, area: code, technicians: 0, bookings: 0, revenue: 0, growth: 0,
  }));
  window.KD.notifications = [];
  window.KD.complaints   = [];
  window.KD.referralTree = {
    id: 'abd-' + (abd.abd_id || 0),
    name: abd.full_name || 'ABD User',
    role: 'ABD', avatar: initials || 'AU',
    skill: 'Area Director',
    earnings: 0, abdCommission: 0, level: 0, status: 'active',
    children: [],
  };
}

// ── Logout Confirm Modal ──────────────────────────────────────────────
function LogoutConfirmModal({ onConfirm, onCancel }) {
  return (
    <>
      <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', zIndex:600, backdropFilter:'blur(2px)' }}/>
      <div style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:601,
        background:'#fff', borderRadius:'20px 20px 0 0',
        padding:`28px 24px calc(32px + env(safe-area-inset-bottom,0px))`,
        maxWidth:520, margin:'0 auto',
        boxShadow:'0 -20px 60px rgba(15,23,42,0.2)',
        animation:'slideUp 0.22s ease'
      }}>
        <div style={{ width:40, height:4, borderRadius:2, background:'#e2e8f0', margin:'0 auto 20px' }}/>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{
            width:56, height:56, borderRadius:'50%', background:'rgba(239,68,68,0.1)',
            display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <h3 style={{ fontSize:18, fontWeight:800, color:'#0f172a', margin:'0 0 6px' }}>Logout karna chahte ho?</h3>
          <p style={{ fontSize:13, color:'#64748b', margin:0, lineHeight:1.55 }}>
            Aap ABD Panel se logout ho jaoge. Wapas aane ke liye dobara login karna hoga.
          </p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} style={{
            flex:1, padding:'14px', borderRadius:14, border:'1.5px solid #e2e8f0',
            background:'#f8fafc', cursor:'pointer', fontFamily:'inherit',
            fontWeight:700, fontSize:14, color:'#475569'
          }}>
            Wapas Jao
          </button>
          <button onClick={onConfirm} style={{
            flex:1, padding:'14px', borderRadius:14, border:'none',
            background:'#ef4444', cursor:'pointer', fontFamily:'inherit',
            fontWeight:700, fontSize:14, color:'#fff',
            boxShadow:'0 4px 14px rgba(239,68,68,0.35)'
          }}>
            Haan, Logout
          </button>
        </div>
      </div>
    </>
  );
}

// ── Nav tracking — file-level so React re-renders never reset them ────
let _navPage  = 'dashboard';
let _navStack = [];

// ── Main App ──────────────────────────────────────────────────────────
function App() {
  const [page, setPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(TWEAK_DEFAULTS.sidebarCollapsed);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);
  const [tweakVisible, setTweakVisible] = useState(false);
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notifItems, setNotifItems] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const pageRef = React.useRef("dashboard");

  // Check existing session on mount — also handles autologin redirect from registration
  React.useEffect(() => {
    // Priority 1: URL params from registration redirect (?autologin=1&phone=...)
    const params  = new URLSearchParams(window.location.search);
    const urlPhone = params.get('phone');
    const isAutoLogin = params.get('autologin') === '1';

    // Priority 2: stored phone from previous login
    const storedPhone = sessionStorage.getItem('abd_phone');
    const phone = urlPhone || storedPhone;

    if (phone) {
      if (urlPhone) sessionStorage.setItem('abd_phone', urlPhone); // persist for API calls

      window.abdApi('setup_session', { phone })
        .then(res => {
          if (res.status === 'success') {
            window.ABD_SESSION = res.abd;
            seedKDFromSession(res.abd);
            setSession(res.abd);
            // Clean the URL so refresh doesn't re-trigger autologin
            if (isAutoLogin) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        })
        .catch(() => {})
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  React.useEffect(() => {
    window.addEventListener("message", (e) => {
      if (e.data?.type === "__activate_edit_mode")   setTweakVisible(true);
      if (e.data?.type === "__deactivate_edit_mode") setTweakVisible(false);
    });
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
  }, []);

  function setTweak(key, val) {
    const next = typeof key === "object" ? {...tweaks,...key} : {...tweaks,[key]:val};
    setTweaks(next);
    window.parent.postMessage({ type:"__edit_mode_set_keys", edits:next }, "*");
  }

  // ── Back button / hardware back handling ─────────────────────────────
  React.useEffect(() => {
    history.replaceState({ _abd: true }, '');
    history.pushState({ _abd: true }, '');

    function onPop() {
      history.pushState({ _abd: true }, '');
      if (!window.ABD_SESSION) return;

      if (_navPage === 'dashboard') {
        setShowLogoutConfirm(true);
      } else {
        const prev = _navStack.length > 0 ? _navStack[_navStack.length - 1] : 'dashboard';
        _navStack  = _navStack.length > 0 ? _navStack.slice(0, -1) : [];
        _navPage   = prev;
        pageRef.current = prev;
        setPage(prev);
        setMobileNavOpen(false);
        setShowLogoutConfirm(false);
      }
    }

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function fetchNotifications() {
    window.abdApi('notifications').then(res => {
      if (res.status === 'success') {
        setNotifItems(res.notifications || []);
        setNotifCount(res.unread_count ?? (res.notifications || []).filter(n => !n.is_read).length);
      }
    }).catch(() => {});
  }

  React.useEffect(() => {
    if (session) fetchNotifications();
  }, [session]);

  function handleLogin(abd) {
    setSession(abd);
    window.ABD_SESSION = abd;
    seedKDFromSession(abd);
  }

  function handleLogout() {
    sessionStorage.removeItem('abd_phone');
    window.ABD_SESSION = null;
    window.abdApi('logout', {}).catch(() => {});
    setSession(null);
    setShowLogoutConfirm(false);
  }

  const PAGE_MAP = {
    "dashboard":             () => <DashboardPage onNavigate={navigate}/>,
    "direct-technicians":    () => <DirectTechniciansPage/>,
    "referral-technicians":  () => <ReferralTechniciansPage/>,
    "auto-joined":           () => <AutoJoinedPage/>,
    "referral-tree":         () => <ReferralTreePage/>,
    "bookings":              () => <BookingsPage/>,
    "earnings":              () => <EarningsPage/>,
    "notifications":         () => <NotificationsPage/>,
    "complaints":            () => <ComplaintsPage/>,
    "profile":               () => <ProfilePage/>,
    "pincodes":              () => <PincodesPage/>,
    "reports":               () => <ComingSoon page="Reports"/>,
    "customers":             () => <ComingSoon page="Customers"/>,
    "settings":              () => <ComingSoon page="Settings"/>,
  };

  const PageComponent = PAGE_MAP[page] || (() => <ComingSoon page={page}/>);

  function navigate(nextPage) {
    if (nextPage === _navPage) return;
    if (_navPage === 'notifications') fetchNotifications();
    if (nextPage === 'dashboard') {
      _navStack = [];
    } else {
      _navStack = [..._navStack, _navPage];
    }
    _navPage        = nextPage;
    pageRef.current = nextPage;
    setPage(nextPage);
    setMobileNavOpen(false);
  }

  // Show full-page spinner while checking session
  if (checking) return <LoadingPage/>;

  // Show login if not authenticated
  if (!session) return <LoginPage onLogin={handleLogin}/>;

  return (
    <div className="abd-app" style={{ display:"flex", minHeight:"100vh", background:"#f4f3f0", fontFamily:"'Manrope',sans-serif" }}>
      <Sidebar activePage={page} onNavigate={navigate} collapsed={mobileNavOpen ? false : collapsed} onToggle={()=>setCollapsed(c=>!c)} mobileOpen={mobileNavOpen} onMobileClose={()=>setMobileNavOpen(false)} session={session}/>
      {mobileNavOpen && <div className="abd-sidebar-backdrop" onClick={()=>setMobileNavOpen(false)}/>}
      <div className="abd-main" style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>
        <Navbar activePage={page} onNavigate={navigate} notifCount={notifCount} notifItems={notifItems} onNotifRead={(id)=>{ setNotifCount(c=>Math.max(0,c-1)); setNotifItems(p=>p.map(n=>n.id===id?{...n,is_read:true}:n)); }} onNotifReadAll={()=>{ setNotifCount(0); setNotifItems(p=>p.map(n=>({...n,is_read:true}))); }} onMenuOpen={()=>setMobileNavOpen(true)} session={session} onLogout={handleLogout}/>
        <div className="abd-scroll" style={{ flex:1, overflowY:"auto" }}>
          <PageComponent/>
        </div>
      </div>
      <MobileBottomNav activePage={page} onNavigate={navigate}/>
      {showLogoutConfirm && (
        <LogoutConfirmModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}

      {tweakVisible && (
        <TweaksPanel onClose={()=>{setTweakVisible(false); window.parent.postMessage({type:"__edit_mode_dismissed"},"*");}}>
          <TweakSection title="Brand">
            <TweakColor label="Primary Color" value={tweaks.primaryColor}
              options={["#ff5a1f","#3b82f6","#10b981","#8b5cf6"]}
              onChange={v=>setTweak("primaryColor",v)}/>
          </TweakSection>
          <TweakSection title="Layout">
            <TweakToggle label="Collapsed Sidebar" value={collapsed} onChange={v=>{setCollapsed(v);setTweak("sidebarCollapsed",v);}}/>
            <TweakRadio label="Density" value={tweaks.density}
              options={["compact","comfortable","spacious"]}
              onChange={v=>setTweak("density",v)}/>
          </TweakSection>
          <TweakSection title="Navigation">
            <TweakButton label="Go to Referral Tree" onClick={()=>setPage("referral-tree")}/>
            <TweakButton label="Go to Earnings" onClick={()=>setPage("earnings")}/>
            <TweakButton label="Go to Bookings" onClick={()=>setPage("bookings")}/>
          </TweakSection>
        </TweaksPanel>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);

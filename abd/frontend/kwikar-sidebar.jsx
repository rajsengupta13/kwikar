// kwikar-sidebar.jsx — Sidebar + Navbar
const { useState, useRef, useEffect } = React;

const NAV_ITEMS = [
  { id:"dashboard",           label:"Dashboard",            icon:"dashboard",    section:null },
  { id:"separator-1",         label:"",                     icon:"",             section:"TECHNICIANS" },
  { id:"direct-technicians",  label:"Direct Technicians",   icon:"userdirect",   section:null },
  { id:"referral-technicians",label:"Referral Technicians", icon:"userreferral", section:null },
  { id:"auto-joined",         label:"Auto Joined",          icon:"userplus",     section:null },
  { id:"referral-tree",       label:"Referral Tree",        icon:"tree",         section:null },
  { id:"separator-2",         label:"",                     icon:"",             section:"BUSINESS" },
  { id:"bookings",            label:"Bookings",             icon:"bookings",     section:null, badge:23 },
  { id:"earnings",            label:"Earnings",             icon:"earnings",     section:null },
  { id:"pincodes",            label:"Pincodes",             icon:"pincode",      section:null },
  { id:"separator-3",         label:"",                     icon:"",             section:"SUPPORT" },
  { id:"notifications",       label:"Notifications",        icon:"bell",         section:null, badge:4 },
  { id:"complaints",          label:"Complaints",           icon:"complaint",    section:null },
  { id:"reports",             label:"Reports",              icon:"reports",      section:null },
  { id:"customers",           label:"Customers",            icon:"customers",    section:null },
  { id:"separator-4",         label:"",                     icon:"",             section:"ACCOUNT" },
  { id:"profile",             label:"Profile",              icon:"profile",      section:null },
  { id:"settings",            label:"Settings",             icon:"settings",     section:null },
];

function KwikarLogo({ collapsed }) {
  return (
    <div style={{ padding: collapsed ? "24px 0" : "24px 20px", display:"flex", alignItems:"center", gap:10 }}>
      <div style={{
        width:36, height:36, borderRadius:10, flexShrink:0,
        background:"linear-gradient(135deg, #ff5a1f 0%, #ff8c00 100%)",
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:"0 4px 12px rgba(255,90,31,0.45)"
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#fff"/>
        </svg>
      </div>
      {!collapsed && (
        <div style={{ overflow:"hidden" }}>
          <div style={{ fontSize:17, fontWeight:900, color:"#fff", letterSpacing:"-0.02em", lineHeight:1 }}>Kwikar</div>
          <div style={{ fontSize:9.5, color:"#4a5568", letterSpacing:"0.08em", textTransform:"uppercase", marginTop:2 }}>ABD Panel</div>
        </div>
      )}
    </div>
  );
}

function NavItem({ item, active, collapsed, onClick, onMobileClose }) {
  const [hovered, setHovered] = useState(false);
  if (item.id.startsWith("separator")) {
    return collapsed ? (
      <div style={{ margin:"12px 0", borderTop:"1px solid rgba(255,255,255,0.06)" }}/>
    ) : (
      <div style={{ padding:"12px 20px 6px", display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:9.5, fontWeight:700, color:"#3a4a5c", letterSpacing:"0.1em" }}>{item.section}</span>
        <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.04)" }}/>
      </div>
    );
  }
  const isActive = active === item.id;
  return (
    <div
      onClick={() => { onClick(item.id); onMobileClose && onMobileClose(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={collapsed ? item.label : ""}
      style={{
        display:"flex", alignItems:"center", gap:10,
        padding: collapsed ? "13px 0" : "13px 20px",
        justifyContent: collapsed ? "center" : "flex-start",
        margin:"1px 8px", borderRadius:10, cursor:"pointer",
        background: isActive ? "rgba(255,90,31,0.14)" : hovered ? "rgba(255,255,255,0.05)" : "transparent",
        color: isActive ? "#ff6b35" : hovered ? "#cbd5e1" : "#64748b",
        transition:"all 0.15s", position:"relative",
        borderLeft: isActive && !collapsed ? "3px solid #ff5a1f" : "3px solid transparent",
        WebkitTapHighlightColor: "transparent",
      }}>
      <Icon name={item.icon} size={18} style={{ flexShrink:0 }}/>
      {!collapsed && (
        <span style={{ fontSize:13.5, fontWeight: isActive ? 700 : 500, flex:1 }}>{item.label}</span>
      )}
      {!collapsed && item.badge > 0 && (
        <span style={{
          background:"#ff5a1f", color:"#fff", fontSize:10, fontWeight:800,
          padding:"2px 8px", borderRadius:20, minWidth:20, textAlign:"center"
        }}>{item.badge}</span>
      )}
      {collapsed && item.badge > 0 && (
        <span style={{
          position:"absolute", top:6, right:6, width:8, height:8,
          background:"#ff5a1f", borderRadius:"50%"
        }}/>
      )}
    </div>
  );
}

function Sidebar({ activePage, onNavigate, collapsed, onToggle, mobileOpen = false, onMobileClose, session }) {
  const sidebarW = collapsed ? 68 : 240;

  // Compute avatar initials from session name
  const name = session?.full_name || 'ABD User';
  const words = name.trim().split(/\s+/);
  const initials = (words[0]?.[0] || '').toUpperCase() + (words[1]?.[0] || '').toUpperCase();
  const statusLine = (session?.status || 'Gold ABD') + (session?.area ? ' · ' + session.area.split(',')[0] : '');

  return (
    <div className={`abd-sidebar ${mobileOpen ? "is-open" : ""}`} style={{
      width:sidebarW, minHeight:"100vh", background:"#0d1117",
      display:"flex", flexDirection:"column", flexShrink:0,
      borderRight:"1px solid rgba(255,255,255,0.05)",
      transition:"width 0.25s cubic-bezier(0.4,0,0.2,1)",
      overflow:"hidden", position:"relative", zIndex:10
    }}>
      <div className="abd-sidebar-head">
        <KwikarLogo collapsed={collapsed}/>
        <button className="abd-drawer-close" onClick={onMobileClose} aria-label="Close menu">
          <Icon name="x" size={18}/>
        </button>
      </div>
      <div style={{ flex:1, overflowY:"auto", overflowX:"hidden", paddingBottom:16 }}>
        {NAV_ITEMS.map(item => (
          <NavItem key={item.id} item={item} active={activePage} collapsed={collapsed} onClick={onNavigate} onMobileClose={onMobileClose}/>
        ))}
      </div>
      {!collapsed && (
        <div style={{
          margin:"0 8px 8px", padding:"12px 14px", borderRadius:12,
          background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)"
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Avatar initials={initials || 'AU'} size={32} colorIndex={0}/>
            <div style={{ overflow:"hidden" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#e2e8f0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{name}</div>
              <div style={{ fontSize:11, color:"#4a6080", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{statusLine}</div>
            </div>
          </div>
        </div>
      )}
      <button onClick={onToggle} style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        margin:"0 8px 16px", padding:"10px", borderRadius:10, border:"1px solid rgba(255,255,255,0.07)",
        background:"rgba(255,255,255,0.04)", color:"#4a6080", cursor:"pointer",
        transition:"all 0.15s", fontSize:12, gap:6, fontFamily:"inherit",
      }}
        onMouseEnter={e=>{e.currentTarget.style.color="#ff6b35"; e.currentTarget.style.borderColor="rgba(255,90,31,0.3)";}}
        onMouseLeave={e=>{e.currentTarget.style.color="#4a6080"; e.currentTarget.style.borderColor="rgba(255,255,255,0.07)";}}>
        <Icon name={collapsed ? "chevronRight" : "chevronLeft"} size={14}/>
        {!collapsed && <span>Collapse</span>}
      </button>
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────
function Navbar({ activePage, onNavigate, notifCount = 0, notifItems = [], onNotifRead, onNotifReadAll, onMenuOpen, session, onLogout }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const greetClipRef = React.useRef(null);
  const greetTextRef = React.useRef(null);
  const pageLabels = {
    "dashboard":"Dashboard", "direct-technicians":"Direct Technicians",
    "referral-technicians":"Referral Technicians","auto-joined":"Auto Joined Technicians",
    "referral-tree":"Referral Network Tree","bookings":"Booking Management",
    "earnings":"Earnings & Wallet","pincodes":"Pincode Management",
    "reports":"Reports","notifications":"Notifications",
    "complaints":"Complaints & Support","customers":"Customers",
    "profile":"My Profile","settings":"Settings",
  };
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"});

  // Compute display values from session
  const name = session?.full_name || 'ABD User';
  const words = name.trim().split(/\s+/);
  const firstName = words[0] || 'there';
  const initials = (words[0]?.[0] || '').toUpperCase() + (words[1]?.[0] || '').toUpperCase();
  const abdIdLabel = session?.abd_id ? 'ABD-' + session.abd_id : 'ABD';
  const todayEarnings = session?.today_earnings ?? null;
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const avatarImage = session?.profile_image || session?.avatar || '';

  // Measure real text overflow → set CSS variable for the marquee slide distance
  React.useEffect(() => {
    const clip = greetClipRef.current;
    const text = greetTextRef.current;
    if (!clip || !text) return;
    const overflow = text.scrollWidth - clip.clientWidth;
    if (overflow > 0) {
      text.style.setProperty('--greet-slide', overflow + 4 + 'px');
    } else {
      text.style.setProperty('--greet-slide', '0px');
    }
  }, [greeting, firstName]);

  return (
    <div style={{
      height:64, background:"#fff", borderBottom:"1px solid #e8edf2",
      display:"flex", alignItems:"center", padding:"0 28px", gap:16,
      position:"sticky", top:0, zIndex:100, boxShadow:"0 1px 6px rgba(0,0,0,0.05)"
    }} className="abd-navbar">
      <button className="abd-menu-btn" onClick={onMenuOpen} aria-label="Open menu">
        <Icon name="list" size={18}/>
      </button>
      <div className="abd-navbar-mobile-brand">
        <div className="abd-mobile-brand-name">Kwikar.in</div>
        <div className="abd-mobile-brand-sub">ABD Panel</div>
      </div>
      <div className="abd-navbar-title" style={{ flex:"0 0 auto" }}>
        <h1 style={{ fontSize:15, fontWeight:800, color:"#0f172a", margin:0 }}>{pageLabels[activePage] || activePage}</h1>
        <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>{dateStr}</p>
      </div>
      <div className="abd-navbar-search" style={{ flex:1, maxWidth:360, marginLeft:8 }}>
        <div style={{ position:"relative" }}>
          <Icon name="search" size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }}/>
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search technicians, bookings, customers…"
            style={{
              width:"100%", padding:"8px 14px 8px 34px", borderRadius:10,
              border:"1px solid #e8edf2", fontSize:13, fontFamily:"inherit",
              background:"#f8f9fb", color:"#0f172a", outline:"none"
            }}
            onFocus={e=>{e.target.style.borderColor="#ff5a1f"; e.target.style.background="#fff";}}
            onBlur={e=>{e.target.style.borderColor="#e8edf2"; e.target.style.background="#f8f9fb";}}/>
        </div>
      </div>
      <div className="abd-navbar-spacer" style={{ flex:1 }}/>
      <div className="abd-navbar-live" style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:20, background:"#d1fae5" }}>
        <div style={{ width:7, height:7, borderRadius:"50%", background:"#10b981", animation:"pulse 2s infinite" }}/>
        <span style={{ fontSize:11, fontWeight:700, color:"#059669" }}>Live</span>
      </div>
      <div className="abd-navbar-earnings" style={{ padding:"5px 14px", borderRadius:10, background:"rgba(255,90,31,0.08)", cursor:"pointer" }}
        onClick={()=>onNavigate("earnings")}>
        <div style={{ fontSize:10, color:"#ff5a1f", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>Today</div>
        <div style={{ fontSize:14, fontWeight:800, color:"#ff5a1f" }}>
          {todayEarnings !== null ? `₹${Number(todayEarnings).toLocaleString("en-IN")}` : '₹—'}
        </div>
      </div>
      <button className="abd-navbar-mobile-greeting" onClick={()=>{setNotifOpen(false); onNavigate("profile");}} type="button">
        <span className="abd-mobile-avatar">
          {avatarImage ? <img src={avatarImage} alt="" /> : <span>{(initials || firstName[0] || 'A').slice(0, 2)}</span>}
        </span>
        <span className="abd-mobile-greeting-clip" ref={greetClipRef}>
          <span className="abd-mobile-greeting-text" ref={greetTextRef}>{greeting}, {firstName}!</span>
        </span>
      </button>
      <div className="abd-navbar-notif" style={{ position:"relative" }}>
        <button className="abd-navbar-icon-btn" onClick={()=>{setNotifOpen(o=>!o); setProfileOpen(false);}} style={{
          width:38, height:38, borderRadius:10, border:"1px solid #e8edf2",
          background:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", color:"#64748b", position:"relative"
        }}>
          <Icon name="bell" size={17}/>
          {notifCount > 0 && (
            <span style={{
              position:"absolute", top:4, right:4, width:16, height:16, borderRadius:"50%",
              background:"#ff5a1f", color:"#fff", fontSize:9, fontWeight:800,
              display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid #fff"
            }}>{notifCount}</span>
          )}
        </button>
        {notifOpen && (
          <div className="abd-navbar-dropdown abd-navbar-notif-menu" style={{
            position:"absolute", top:46, right:0, width:340, background:"#fff",
            borderRadius:14, boxShadow:"0 20px 60px rgba(0,0,0,0.15)", border:"1px solid #e8edf2",
            zIndex:200, overflow:"hidden"
          }}>
            <div style={{ padding:"16px 18px", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontWeight:800, fontSize:14 }}>Notifications</span>
              <span style={{ fontSize:11, color:"#ff5a1f", cursor:"pointer", fontWeight:600 }} onClick={()=>{ onNavigate("notifications"); setNotifOpen(false); }}>View all →</span>
            </div>
            {notifItems.length === 0
              ? <div style={{ padding:"20px 18px", textAlign:"center", color:"#94a3b8", fontSize:12 }}>No notifications yet</div>
              : notifItems.slice(0,4).map(n=>(
              <div key={n.id} onClick={()=>{ if(!n.is_read && onNotifRead) onNotifRead(n.id); window.abdApi('notifications',{action:'mark_read',id:n.id}).catch(()=>{}); }} style={{
                padding:"12px 18px", borderBottom:"1px solid #f8fafc",
                background: n.is_read?"#fff":"#fffbf9",
                display:"flex", gap:10, cursor:"pointer"
              }}>
                <div style={{
                  width:8, height:8, borderRadius:"50%", background: n.is_read?"#e2e8f0":"#ff5a1f",
                  flexShrink:0, marginTop:4
                }}/>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#0f172a" }}>{n.title}</div>
                  <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{n.message||n.body}</div>
                  <div style={{ fontSize:10, color:"#94a3b8", marginTop:3 }}>{n.created_at}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="abd-navbar-profile" style={{ position:"relative" }}>
        <div className="abd-navbar-profile-trigger" onClick={()=>{setProfileOpen(o=>!o); setNotifOpen(false);}}
          style={{ cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
          <Avatar initials={initials || 'AU'} size={36} colorIndex={0}/>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"#0f172a" }}>{name}</div>
            <div style={{ fontSize:10, color:"#94a3b8" }}>{abdIdLabel} · Gold</div>
          </div>
          <Icon name="chevronDown" size={14} style={{ color:"#94a3b8" }}/>
        </div>
        {profileOpen && (
          <div className="abd-navbar-dropdown abd-navbar-profile-menu" style={{
            position:"absolute", top:50, right:0, width:200, background:"#fff",
            borderRadius:12, boxShadow:"0 20px 60px rgba(0,0,0,0.12)", border:"1px solid #e8edf2",
            zIndex:200, overflow:"hidden"
          }}>
            {[
              { label:"My Profile", icon:"profile", page:"profile" },
              { label:"Settings", icon:"settings", page:"settings" },
              { label:"Earnings", icon:"earnings", page:"earnings" },
            ].map(m => (
              <div key={m.page} onClick={()=>{onNavigate(m.page);setProfileOpen(false);}}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 16px", cursor:"pointer", fontSize:13, color:"#0f172a" }}
                onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <Icon name={m.icon} size={15} style={{ color:"#64748b" }}/>{m.label}
              </div>
            ))}
            <div style={{ borderTop:"1px solid #f1f5f9", margin:"4px 0" }}/>
            <div
              onClick={()=>{ setProfileOpen(false); onLogout && onLogout(); }}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 16px", cursor:"pointer", fontSize:13, color:"#ef4444" }}
              onMouseEnter={e=>e.currentTarget.style.background="#fff5f5"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <Icon name="logout" size={15}/> Logout
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MobileBottomNav({ activePage, onNavigate }) {
  const items = [
    { id:"dashboard", label:"Home", icon:"dashboard" },
    { id:"direct-technicians", label:"Techs", icon:"users" },
    { id:"bookings", label:"Bookings", icon:"bookings" },
    { id:"earnings", label:"Earnings", icon:"wallet" },
    { id:"profile", label:"Profile", icon:"profile" },
  ];
  return (
    <nav className="abd-bottom-nav" aria-label="Mobile navigation">
      {items.map(item => {
        const active = activePage === item.id || (item.id === "direct-technicians" && ["referral-technicians","auto-joined","referral-tree"].includes(activePage));
        return (
          <button key={item.id} className={active ? "active" : ""} onClick={()=>onNavigate(item.id)}>
            <Icon name={item.icon} size={19}/>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

Object.assign(window, { Sidebar, Navbar, MobileBottomNav });

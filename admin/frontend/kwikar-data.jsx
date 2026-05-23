// kwikar-data.jsx — shared data, icons, utilities, base components
const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ── Icons ─────────────────────────────────────────────────────────────────────
const P = { home:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", activity:"M22 12h-4l-3 9L9 3l-3 9H2", users:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", wrench:"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", briefcase:"M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", share:"M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z", calendar:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", dollar:"M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", layers:"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", mapPin:"M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z", zap:"M13 10V3L4 14h7v7l9-11h-7z", barChart:"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", alertCircle:"M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", shield:"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", bell:"M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9", list:"M4 6h16M4 10h16M4 14h16M4 18h16", settings:"M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4", search:"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", x:"M6 18L18 6M6 6l12 12", chevDown:"M19 9l-7 7-7-7", chevRight:"M9 5l7 7-7 7", chevLeft:"M15 19l-7-7 7-7", plus:"M12 4v16m8-8H4", eye:"M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z", edit:"M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", trash:"M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16", check:"M5 13l4 4L19 7", filter:"M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z", download:"M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4", user:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", globe:"M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z", clock:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", up:"M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", down:"M13 17h8m0 0V9m0 8l-8-8-4 4-6-6", star:"M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z", send:"M12 19l9 2-9-18-9 18 9-2zm0 0v-8", refresh:"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", award:"M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z", flag:"M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H6.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9", info:"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", cpu:"M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18", lock:"M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", link:"M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" };

function Ico({ n, s = 15, c = 'currentColor' }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {(P[n] || '').split(' M').map((seg, i) => (
        <path key={i} d={(i === 0 ? '' : 'M') + seg} />
      ))}
    </svg>
  );
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function fCur(v) {
  if (v >= 10000000) return `₹${(v/10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v/100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v/1000).toFixed(0)}K`;
  return `₹${v}`;
}
function fNum(v) {
  if (v >= 1000000) return `${(v/1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v/1000).toFixed(1)}K`;
  return `${v}`;
}
function tAgo(s) {
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  return `${Math.floor(s/3600)}h ago`;
}
function initials(name) { return name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(); }
function rnd(a, b) { return Math.floor(Math.random()*(b-a+1))+a; }

// ── Avatar ────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#22D3EE','#A78BFA','#34D399','#FBBF24','#F472B6','#F87171','#60A5FA'];
function Avatar({ name, size = 32, online }) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  const color = AVATAR_COLORS[idx];
  return (
    <div style={{ position:'relative', display:'inline-flex', flexShrink:0 }}>
      <div style={{ width:size, height:size, borderRadius:'50%', background:`${color}22`, border:`1.5px solid ${color}55`, display:'flex', alignItems:'center', justifyContent:'center', fontSize: size*0.35, fontWeight:600, color, fontFamily:'Space Grotesk' }}>
        {initials(name)}
      </div>
      {online !== undefined && (
        <div style={{ position:'absolute', bottom:0, right:0, width: size*0.28, height: size*0.28, borderRadius:'50%', background: online ? 'var(--green)' : 'var(--text3)', border:'2px solid var(--sidebar-bg)' }} />
      )}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_MAP = {
  active: { bg:'var(--green-d)', color:'var(--green)', dot: true },
  online: { bg:'var(--green-d)', color:'var(--green)', dot: true },
  inactive: { bg:'rgba(255,255,255,.07)', color:'var(--text3)', dot: true },
  offline: { bg:'rgba(255,255,255,.07)', color:'var(--text3)', dot: true },
  pending: { bg:'var(--amber-d)', color:'var(--amber)', dot: true },
  suspended: { bg:'var(--red-d)', color:'var(--red)', dot: true },
  blocked: { bg:'var(--red-d)', color:'var(--red)', dot: true },
  verified: { bg:'var(--cyan-d)', color:'var(--cyan)', dot: false },
  unverified: { bg:'var(--amber-d)', color:'var(--amber)', dot: false },
  premium: { bg:'var(--purple-d)', color:'var(--purple)', dot: false },
  standard: { bg:'rgba(255,255,255,.07)', color:'var(--text2)', dot: false },
  trial: { bg:'var(--amber-d)', color:'var(--amber)', dot: false },
  high: { bg:'var(--red-d)', color:'var(--red)', dot: false },
  medium: { bg:'var(--amber-d)', color:'var(--amber)', dot: false },
  low: { bg:'var(--green-d)', color:'var(--green)', dot: false },
  completed: { bg:'var(--green-d)', color:'var(--green)', dot: true },
  cancelled: { bg:'var(--red-d)', color:'var(--red)', dot: true },
  assigned: { bg:'var(--cyan-d)', color:'var(--cyan)', dot: true },
  live: { bg:'var(--red-d)', color:'var(--red)', dot: true },
  abd: { bg:'var(--purple-d)', color:'var(--purple)', dot: false },
};
function Badge({ type, label }) {
  const s = BADGE_MAP[type] || { bg:'rgba(255,255,255,.07)', color:'var(--text2)', dot:false };
  return (
    <span className="kbadge" style={{ background: s.bg, color: s.color }}>
      {s.dot && <span style={{ width:5, height:5, borderRadius:'50%', background:'currentColor', flexShrink:0 }}/>}
      {label || type}
    </span>
  );
}

// ── Animated Counter ──────────────────────────────────────────────────────────
function Counter({ target, prefix='', suffix='', duration=1200 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0; const step = target / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setVal(Math.floor(start));
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, width = 540 }) {
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.72)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={onClose}>
      <div className="kcard fade-up" style={{ width, maxHeight:'88vh', overflow:'auto', padding:'24px', position:'relative' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <h3 style={{ fontFamily:'Space Grotesk', fontWeight:600, fontSize:16, color:'var(--text)' }}>{title}</h3>
          <button onClick={onClose} className="kbtn" style={{ padding:'4px 6px' }}><Ico n="x" s={14}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Drawer ────────────────────────────────────────────────────────────────────
function Drawer({ open, onClose, title, children, width = 420 }) {
  return (
    <>
      {open && <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:900 }} onClick={onClose}/>}
      <div style={{ position:'fixed', top:0, right:0, width, height:'100vh', background:'var(--surface)', borderLeft:'1px solid var(--border)', zIndex:901, transform: open ? 'translateX(0)' : 'translateX(100%)', transition:'transform .3s cubic-bezier(.4,0,.2,1)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <h3 style={{ fontFamily:'Space Grotesk', fontWeight:600, fontSize:16 }}>{title}</h3>
          <button onClick={onClose} className="kbtn" style={{ padding:'4px 6px' }}><Ico n="x" s={14}/></button>
        </div>
        <div style={{ flex:1, overflow:'auto', padding:'20px' }}>{children}</div>
      </div>
    </>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ size=20, color='var(--cyan)' }) {
  return <div style={{ width:size, height:size, borderRadius:'50%', border:`2px solid ${color}30`, borderTopColor:color, animation:'spin 0.7s linear infinite' }}/>;
}

// ── Empty State ───────────────────────────────────────────────────────────────
function Empty({ icon='barChart', title='Nothing here yet', sub='' }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 24px', gap:12, color:'var(--text3)' }}>
      <Ico n={icon} s={36} c="var(--text3)"/>
      <div style={{ fontSize:14, fontWeight:500, color:'var(--text2)' }}>{title}</div>
      {sub && <div style={{ fontSize:12, textAlign:'center' }}>{sub}</div>}
    </div>
  );
}

// ── Placeholder Page ──────────────────────────────────────────────────────────
function PlaceholderPage({ label }) {
  return (
    <div className="page-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>
      <div style={{ textAlign:'center', color:'var(--text3)' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔧</div>
        <div style={{ fontFamily:'Space Grotesk', fontSize:18, fontWeight:600, color:'var(--text2)', marginBottom:6 }}>{label}</div>
        <div style={{ fontSize:13 }}>Coming soon — this section is under construction.</div>
      </div>
    </div>
  );
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
const KSTATS = {
  revenue: 12847293, bookingsToday: 847, liveServices: 234,
  activeTechs: 1892, activeABDs: 156, totalCustomers: 48291,
  monthlyGrowth: 23.7, failedBookings: 43, pendingPayouts: 892400,
  completedServices: 89234, subRevenue: 4821000, activeAreas: 89,
};

const KTECHS = [
  { id:'T001', name:'Amit Kumar', cat:'AC Repair', status:'active', plan:'premium', rating:4.8, bookings:234, earnings:45230, abd:'Raj Sharma', kyc:'verified', area:'Mumbai Central', online:true, cancel:4.2, joined:'Jan 2024' },
  { id:'T002', name:'Mohan Das', cat:'Plumbing', status:'active', plan:'standard', rating:4.5, bookings:178, earnings:32100, abd:'Raj Sharma', kyc:'verified', area:'Andheri West', online:true, cancel:6.1, joined:'Mar 2024' },
  { id:'T003', name:'Vivek Singh', cat:'Electrical', status:'active', plan:'premium', rating:4.9, bookings:312, earnings:67400, abd:'Rahul Gupta', kyc:'verified', area:'Connaught Place', online:false, cancel:2.8, joined:'Nov 2023' },
  { id:'T004', name:'Arjun Patel', cat:'AC Repair', status:'pending', plan:'trial', rating:0, bookings:0, earnings:0, abd:'Raj Sharma', kyc:'unverified', area:'Borivali', online:false, cancel:0, joined:'May 2025' },
  { id:'T005', name:'Suresh Yadav', cat:'Appliance', status:'active', plan:'premium', rating:4.7, bookings:289, earnings:58900, abd:'Rahul Gupta', kyc:'verified', area:'Nehru Place', online:true, cancel:3.4, joined:'Feb 2024' },
  { id:'T006', name:'Karan Mehta', cat:'Carpentry', status:'suspended', plan:'standard', rating:3.9, bookings:67, earnings:12300, abd:'Rahul Gupta', kyc:'verified', area:'Lajpat Nagar', online:false, cancel:18.2, joined:'Apr 2024' },
  { id:'T007', name:'Sanjay Gupta', cat:'Plumbing', status:'active', plan:'standard', rating:4.6, bookings:198, earnings:38700, abd:'Priya Nair', kyc:'verified', area:'Koramangala', online:true, cancel:5.0, joined:'Dec 2023' },
  { id:'T008', name:'Rajesh Kumar', cat:'Electrical', status:'active', plan:'premium', rating:4.8, bookings:267, earnings:54200, abd:'Priya Nair', kyc:'verified', area:'Indiranagar', online:true, cancel:3.1, joined:'Oct 2023' },
  { id:'T009', name:'Deepak Verma', cat:'AC Repair', status:'inactive', plan:'trial', rating:4.1, bookings:23, earnings:4600, abd:'Raj Sharma', kyc:'verified', area:'Thane', online:false, cancel:12.5, joined:'Apr 2025' },
  { id:'T010', name:'Rohit Sharma', cat:'Appliance', status:'active', plan:'standard', rating:4.4, bookings:145, earnings:26800, abd:'Rahul Gupta', kyc:'verified', area:'Dwarka', online:false, cancel:7.2, joined:'Jan 2024' },
];

const KCUSTS = [
  { id:'C001', name:'Priya Sharma', email:'priya.s@gmail.com', phone:'+91 98765 43210', city:'Mumbai', bookings:12, spent:18400, status:'active', joined:'Mar 2024', lastBook:'2d ago' },
  { id:'C002', name:'Rahul Verma', email:'rahulv@gmail.com', phone:'+91 87654 32109', city:'Delhi', bookings:7, spent:9200, status:'active', joined:'Jan 2024', lastBook:'5d ago' },
  { id:'C003', name:'Sneha Patel', email:'sneha.p@yahoo.com', phone:'+91 76543 21098', city:'Bangalore', bookings:24, spent:34700, status:'active', joined:'Nov 2023', lastBook:'1d ago' },
  { id:'C004', name:'Arjun Singh', email:'arjun.singh@hotmail.com', phone:'+91 65432 10987', city:'Pune', bookings:3, spent:3800, status:'active', joined:'May 2025', lastBook:'14d ago' },
  { id:'C005', name:'Kavya Nair', email:'kavya.n@gmail.com', phone:'+91 54321 09876', city:'Hyderabad', bookings:0, spent:0, status:'blocked', joined:'Apr 2025', lastBook:'—' },
  { id:'C006', name:'Arun Menon', email:'arunmenon@gmail.com', phone:'+91 43210 98765', city:'Chennai', bookings:18, spent:27600, status:'active', joined:'Aug 2023', lastBook:'3d ago' },
  { id:'C007', name:'Neha Gupta', email:'neha.gupta@gmail.com', phone:'+91 32109 87654', city:'Mumbai', bookings:9, spent:14200, status:'active', joined:'Feb 2024', lastBook:'1w ago' },
  { id:'C008', name:'Vikram Rao', email:'vikram.rao@gmail.com', phone:'+91 21098 76543', city:'Bangalore', bookings:5, spent:7400, status:'pending', joined:'May 2025', lastBook:'Never' },
];

const KABDS = [
  { id:'A001', name:'Raj Sharma', city:'Mumbai', pincodes:8, techs:34, revenue:982400, commission:12.5, growth:34.2, status:'active', joined:'Jun 2023', rank:1 },
  { id:'A002', name:'Rahul Gupta', city:'Delhi', pincodes:12, techs:52, revenue:1234600, commission:12.5, growth:41.8, status:'active', joined:'May 2023', rank:2 },
  { id:'A003', name:'Priya Nair', city:'Bangalore', pincodes:6, techs:28, revenue:678900, commission:12.5, growth:28.6, status:'active', joined:'Aug 2023', rank:3 },
  { id:'A004', name:'Suresh Kumar', city:'Hyderabad', pincodes:5, techs:19, revenue:423700, commission:12.5, growth:19.4, status:'active', joined:'Oct 2023', rank:4 },
  { id:'A005', name:'Anita Singh', city:'Pune', pincodes:4, techs:14, revenue:312400, commission:10.0, growth:15.2, status:'active', joined:'Jan 2024', rank:5 },
  { id:'A006', name:'Mohan Pillai', city:'Chennai', pincodes:3, techs:8, revenue:187300, commission:10.0, growth:8.7, status:'pending', joined:'Mar 2024', rank:6 },
];

const KBOOKINGS = [
  { id:'B1001', customer:'Priya Sharma', tech:'Amit Kumar', cat:'AC Repair', area:'Andheri', time:'Today 10:30', amount:1200, status:'live' },
  { id:'B1002', customer:'Rahul Verma', tech:'Vivek Singh', cat:'Electrical', area:'Connaught Place', time:'Today 11:00', amount:850, status:'assigned' },
  { id:'B1003', customer:'Sneha Patel', tech:'Sanjay Gupta', cat:'Plumbing', area:'Koramangala', time:'Today 12:00', amount:650, status:'assigned' },
  { id:'B1004', customer:'Arun Menon', tech:'—', cat:'Appliance', area:'T Nagar', time:'Today 13:30', amount:1800, status:'pending' },
  { id:'B1005', customer:'Kavya Nair', tech:'Suresh Yadav', cat:'Appliance', area:'Banjara Hills', time:'Yesterday 3:00pm', amount:2200, status:'completed' },
  { id:'B1006', customer:'Neha Gupta', tech:'Mohan Das', cat:'Plumbing', area:'Borivali', time:'Yesterday 4:00pm', amount:750, status:'completed' },
  { id:'B1007', customer:'Arjun Singh', tech:'—', cat:'Carpentry', area:'Kothrud', time:'Today 2:00pm', amount:1400, status:'cancelled' },
  { id:'B1008', customer:'Vikram Rao', tech:'Rajesh Kumar', cat:'Electrical', area:'Whitefield', time:'Today 3:00pm', amount:920, status:'assigned' },
];

const KEVENTS = [
  { id:1, type:'booking', msg:'Priya Sharma booked AC Repair in Andheri', time:12 },
  { id:2, type:'accept', msg:'Amit Kumar accepted booking #B1001', time:34 },
  { id:3, type:'referral', msg:'ABD Raj Sharma referred Technician Arjun Patel', time:67 },
  { id:4, type:'upgrade', msg:'Vivek Singh upgraded to Premium Plan', time:120 },
  { id:5, type:'payout', msg:'Payout of ₹18,400 processed for Amit Kumar', time:180 },
  { id:6, type:'cancel', msg:'Booking #B1007 cancelled by Arjun Singh', time:240 },
  { id:7, type:'complaint', msg:'Complaint raised by Neha Gupta — Tech delay', time:320 },
  { id:8, type:'fraud', msg:'⚠ Suspicious activity on account C005 detected', time:410 },
  { id:9, type:'offline', msg:'Deepak Verma went offline (Thane zone)', time:520 },
  { id:10, type:'boost', msg:'Featured Boost activated for Vivek Singh', time:640 },
  { id:11, type:'booking', msg:'Arun Menon booked Appliance Repair in Chennai', time:720 },
  { id:12, type:'accept', msg:'Suresh Yadav accepted booking #B1009', time:900 },
];

const EVENT_ICONS = { booking:'calendar', accept:'check', referral:'share', upgrade:'zap', payout:'dollar', cancel:'x', complaint:'alertCircle', fraud:'shield', offline:'clock', boost:'star' };

const KFRAUD = [
  { id:'F001', type:'Duplicate Account', entity:'Ankit Sharma', risk:'high', detail:'3 accounts same device/phone', time:'2h ago', status:'investigating' },
  { id:'F002', type:'Referral Abuse', entity:'Mohan Das', risk:'medium', detail:'12 self-referrals in 48hrs', time:'5h ago', status:'flagged' },
  { id:'F003', type:'Fake Bookings', entity:'Kavya Nair (C005)', risk:'high', detail:'8 bookings, 8 cancellations, no payment', time:'1d ago', status:'blocked' },
  { id:'F004', type:'Suspicious Payout', entity:'Deepak Verma', risk:'medium', detail:'4 payout requests <30 min apart', time:'2d ago', status:'review' },
  { id:'F005', type:'Cancellation Abuse', entity:'Arjun Singh', risk:'low', detail:'Cancel rate >60% (9 of 15 bookings)', time:'3d ago', status:'monitoring' },
];

const KRAREV = [2.1,3.4,2.8,4.2,3.9,5.1,4.7,6.3,5.8,7.2,8.1,9.4,8.7,10.2,9.8,11.4,10.9,12.8];
const KMONTHS = ['Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'];
const KREVSERIES = [3.2,4.1,5.8,6.4,7.2,8.9,10.4,12.8];
const KBOOKSERIES = [420,580,640,520,780,860,920,847];

const KTREE = {
  id:'root', name:'Super Admin', role:'admin', status:'active', earnings:0, refs:156, plan:'admin',
  children: [
    { id:'abd1', name:'Raj Sharma', role:'abd', status:'active', earnings:982400, refs:34, plan:'abd', city:'Mumbai',
      children: [
        { id:'t1', name:'Amit Kumar', role:'tech', status:'active', earnings:45230, refs:3, plan:'premium', cat:'AC Repair',
          children: [
            { id:'t1a', name:'Vivek Singh', role:'tech', status:'active', earnings:67400, refs:2, plan:'premium', cat:'Electrical', children:[] },
            { id:'t1b', name:'Arjun Patel', role:'tech', status:'pending', earnings:0, refs:0, plan:'trial', cat:'AC Repair', children:[] },
          ]
        },
        { id:'t2', name:'Mohan Das', role:'tech', status:'active', earnings:32100, refs:1, plan:'standard', cat:'Plumbing',
          children: [
            { id:'t2a', name:'Ravi Kumar', role:'tech', status:'active', earnings:21800, refs:0, plan:'standard', cat:'Plumbing', children:[] },
          ]
        },
        { id:'t3', name:'Deepak Verma', role:'tech', status:'inactive', earnings:4600, refs:0, plan:'trial', cat:'AC Repair', children:[] },
      ]
    },
    { id:'abd2', name:'Rahul Gupta', role:'abd', status:'active', earnings:1234600, refs:52, plan:'abd', city:'Delhi',
      children: [
        { id:'t4', name:'Suresh Yadav', role:'tech', status:'active', earnings:58900, refs:4, plan:'premium', cat:'Appliance',
          children: [
            { id:'t4a', name:'Manoj Singh', role:'tech', status:'active', earnings:34200, refs:1, plan:'standard', cat:'Appliance',
              children: [
                { id:'t4a1', name:'Ritesh Mishra', role:'tech', status:'active', earnings:18400, refs:0, plan:'standard', cat:'Appliance', children:[] },
              ]
            },
            { id:'t4b', name:'Deepak Kumar', role:'tech', status:'active', earnings:28700, refs:0, plan:'standard', cat:'Electrical', children:[] },
          ]
        },
        { id:'t5', name:'Karan Mehta', role:'tech', status:'suspended', earnings:12300, refs:1, plan:'standard', cat:'Carpentry',
          children: [
            { id:'t5a', name:'Rohit Sharma', role:'tech', status:'active', earnings:26800, refs:0, plan:'standard', cat:'Appliance', children:[] },
          ]
        },
      ]
    },
    { id:'abd3', name:'Priya Nair', role:'abd', status:'active', earnings:678900, refs:28, plan:'abd', city:'Bangalore',
      children: [
        { id:'t6', name:'Sanjay Gupta', role:'tech', status:'active', earnings:38700, refs:2, plan:'standard', cat:'Plumbing', children:[] },
        { id:'t7', name:'Rajesh Kumar', role:'tech', status:'active', earnings:54200, refs:1, plan:'premium', cat:'Electrical',
          children: [
            { id:'t7a', name:'Arun Nair', role:'tech', status:'active', earnings:19600, refs:0, plan:'standard', cat:'Electrical', children:[] },
          ]
        },
      ]
    },
  ]
};

const KREV_TRANSACTIONS = [
  { id:'TX001', type:'Subscription', entity:'Amit Kumar', amount:2999, date:'Today', status:'completed' },
  { id:'TX002', type:'ABD Commission', entity:'Raj Sharma', amount:12450, date:'Today', status:'completed' },
  { id:'TX003', type:'Service Fee', entity:'Booking #B1005', amount:220, date:'Yesterday', status:'completed' },
  { id:'TX004', type:'Subscription', entity:'Vivek Singh', amount:2999, date:'Yesterday', status:'completed' },
  { id:'TX005', type:'Payout', entity:'Suresh Yadav', amount:18400, date:'2d ago', status:'completed' },
  { id:'TX006', type:'Refund', entity:'Booking #B0998', amount:850, date:'2d ago', status:'refunded' },
  { id:'TX007', type:'Subscription', entity:'Sanjay Gupta', amount:999, date:'3d ago', status:'completed' },
  { id:'TX008', type:'ABD Commission', entity:'Rahul Gupta', amount:22100, date:'3d ago', status:'pending' },
  { id:'TX009', type:'Payout', entity:'Rajesh Kumar', amount:12800, date:'4d ago', status:'completed' },
  { id:'TX010', type:'Subscription', entity:'Deepak Kumar', amount:999, date:'4d ago', status:'completed' },
];

Object.assign(window, {
  Ico, Avatar, Badge, Counter, Modal, Drawer, Spinner, Empty, PlaceholderPage,
  fCur, fNum, tAgo, initials, rnd,
  KSTATS, KTECHS, KCUSTS, KABDS, KBOOKINGS, KEVENTS, EVENT_ICONS, KFRAUD,
  KRAREV, KMONTHS, KREVSERIES, KBOOKSERIES, KTREE, KREV_TRANSACTIONS,
  AVATAR_COLORS,
});

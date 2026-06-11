// kwikar-ui.jsx — Shared UI components
const { useState, useEffect, useRef, useMemo } = React;

// ── Icon ──────────────────────────────────────────────────────────────
const ICON_PATHS = {
  dashboard:    <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  users:        <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
  userdirect:   <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><path d="M19 8l2 2 2-2"/></>,
  userreferral: <><circle cx="8" cy="8" r="3"/><path d="M3 18c0-3 2.7-5 5-5"/><circle cx="16" cy="8" r="3"/><path d="M11 18c0-3 2.7-5 5-5"/><path d="M21 18h-2"/></>,
  userplus:     <><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></>,
  bookings:     <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  earnings:     <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/></>,
  tree:         <><path d="M12 2v6M12 22v-6M4.93 10.93l4.24 4.24M19.07 10.93l-4.24 4.24M2 12h4M22 12h-4"/><circle cx="12" cy="12" r="3"/></>,
  pincode:      <><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>,
  reports:      <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  bell:         <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></>,
  complaint:    <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  customers:    <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
  profile:      <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  settings:     <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
  logout:       <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  search:       <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  filter:       <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
  chevronDown:  <polyline points="6 9 12 15 18 9"/>,
  chevronRight: <polyline points="9 18 15 12 9 6"/>,
  chevronLeft:  <polyline points="15 18 9 12 15 6"/>,
  plus:         <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  download:     <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  eye:          <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  check:        <polyline points="20 6 9 17 4 12"/>,
  x:            <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  trending:     <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
  trendingDown: <><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>,
  wallet:       <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 14a2 2 0 100-4 2 2 0 000 4z"/><line x1="2" y1="10" x2="22" y2="10"/></>,
  arrowUp:      <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>,
  arrowDown:    <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>,
  clock:        <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  star:         <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
  phone:        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.12 2.2 2 2 0 012.11 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.27 7a16 16 0 006.72 6.72l1.06-1.06a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92v2z"/>,
  mail:         <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
  moon:         <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>,
  sun:          <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
  network:      <><circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><path d="M12 8v4M7.5 17l4.5-5M16.5 17L12 12"/></>,
  expand:       <><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></>,
  collapse:     <><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></>,
  info:         <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
  approve:      <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
  reject:       <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>,
  send:         <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
  flash:        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
  grid:         <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  list:         <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
};

function Icon({ name, size = 16, className = "", style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style}>
      {ICON_PATHS[name] || null}
    </svg>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────
const AVATAR_COLORS = ["#ff5a1f","#3b82f6","#10b981","#8b5cf6","#f59e0b","#ef4444","#06b6d4","#ec4899"];
function Avatar({ initials = "?", size = 36, colorIndex = 0, online = false }) {
  const bg = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  return (
    <div style={{ position:"relative", display:"inline-flex", flexShrink:0 }}>
      <div style={{
        width:size, height:size, borderRadius:"50%", background:bg,
        display:"flex", alignItems:"center", justifyContent:"center",
        color:"#fff", fontWeight:700, fontSize:size*0.35, letterSpacing:"0.02em", flexShrink:0
      }}>{initials}</div>
      {online !== false && (
        <div style={{
          position:"absolute", bottom:1, right:1, width:size*0.28, height:size*0.28,
          borderRadius:"50%", background: online === "busy" ? "#f59e0b" : online === "offline" ? "#94a3b8" : "#10b981",
          border:"2px solid #fff"
        }}/>
      )}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────
function Badge({ children, color = "#ff5a1f", bg, size = "sm" }) {
  const bgColor = bg || color + "18";
  const pad = size === "sm" ? "2px 8px" : "4px 12px";
  const fs = size === "sm" ? 11 : 13;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      padding:pad, borderRadius:20, background:bgColor,
      color, fontWeight:700, fontSize:fs, letterSpacing:"0.03em", whiteSpace:"nowrap"
    }}>{children}</span>
  );
}

// ── SparkLine ─────────────────────────────────────────────────────────
function SparkLine({ data = [], color = "#ff5a1f", width = 80, height = 32 }) {
  if (!data.length) return null;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y];
  });
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const uid = `spark-${color.replace("#","")}-${width}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow:"visible" }}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${uid})`}/>
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── AreaChart ─────────────────────────────────────────────────────────
function AreaChart({ data = [], labels = [], color = "#ff5a1f", width = 600, height = 200 }) {
  const [hovered, setHovered] = useState(null);
  const pad = { top:10, right:20, bottom:30, left:50 };
  const W = width - pad.left - pad.right;
  const H = height - pad.top - pad.bottom;
  const max = Math.max(...data) * 1.1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - (v / max) * H,
    v, i
  }));
  const linePath = pts.map((p, i) => `${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;
  const ySteps = 5;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow:"visible" }}>
      <defs>
        <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.01"/>
        </linearGradient>
      </defs>
      <g transform={`translate(${pad.left},${pad.top})`}>
        {Array.from({length:ySteps+1}).map((_,i) => {
          const y = (i / ySteps) * H;
          const v = max * (1 - i/ySteps);
          return (
            <g key={i}>
              <line x1={0} y1={y} x2={W} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4,4"/>
              <text x={-8} y={y+4} textAnchor="end" fontSize="11" fill="#94a3b8">
                {v>=1000?`₹${(v/1000).toFixed(0)}K`:`₹${v.toFixed(0)}`}
              </text>
            </g>
          );
        })}
        <path d={areaPath} fill="url(#area-grad)"/>
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={hovered===i?5:0} fill={color} stroke="#fff" strokeWidth="2"
            style={{transition:"r 0.15s"}}/>
        ))}
        <rect x={0} y={0} width={W} height={H} fill="transparent"
          onMouseMove={(e) => {
            const rect = e.currentTarget.closest("svg").getBoundingClientRect();
            const x = e.clientX - rect.left - pad.left;
            const idx = Math.round((x / W) * (data.length - 1));
            setHovered(Math.max(0, Math.min(data.length-1, idx)));
          }}
          onMouseLeave={() => setHovered(null)}/>
        {hovered !== null && (
          <g transform={`translate(${pts[hovered].x}, ${pts[hovered].y})`}>
            <circle r={5} fill={color} stroke="#fff" strokeWidth="2"/>
            <rect x={-40} y={-38} width={80} height={24} rx={6} fill="#0f172a"/>
            <text x={0} y={-21} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="600">
              ₹{pts[hovered].v.toLocaleString("en-IN")}
            </text>
          </g>
        )}
        {labels.length > 0 && [0, Math.floor(data.length/4), Math.floor(data.length/2), Math.floor(data.length*3/4), data.length-1].map(i => (
          <text key={i} x={pts[i]?.x||0} y={H+18} textAnchor="middle" fontSize="11" fill="#94a3b8">
            {labels[i]||""}
          </text>
        ))}
      </g>
    </svg>
  );
}

// ── DonutChart ────────────────────────────────────────────────────────
function DonutChart({ segments = [], size = 120, strokeWidth = 18 }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2, cy = size / 2;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth}/>
      {segments.map((seg, i) => {
        const dash = (seg.pct / 100) * circ;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset={-(offset)}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition:"stroke-dasharray 0.6s ease" }}/>
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

// ── MiniBar ───────────────────────────────────────────────────────────
function MiniBar({ data = [], color = "#ff5a1f", width = 120, height = 40 }) {
  if (!data.length) return null;
  const max = Math.max(...data) || 1;
  const bw = Math.floor((width - (data.length - 1) * 3) / data.length);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((v, i) => {
        const bh = Math.max(3, (v / max) * height);
        const x = i * (bw + 3);
        const y = height - bh;
        return <rect key={i} x={x} y={y} width={bw} height={bh} rx={2} fill={color} opacity={0.7 + 0.3*(v/max)}/>;
      })}
    </svg>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color = "#ff5a1f", trend, sparkData, badge }) {
  const isPositive = typeof trend === "number" ? trend >= 0 : null;
  return (
    <div style={{
      background:"#fff", borderRadius:16, padding:"20px 22px",
      boxShadow:"0 2px 12px rgba(0,0,0,0.06)", border:"1px solid rgba(0,0,0,0.05)",
      display:"flex", flexDirection:"column", gap:12, position:"relative", overflow:"hidden",
      transition:"transform 0.2s, box-shadow 0.2s", cursor:"default"
    }}
      onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.10)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.06)"; }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:color, borderRadius:"16px 16px 0 0" }}/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
          <span style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</span>
          <span style={{ fontSize:26, fontWeight:800, color:"#0f172a", letterSpacing:"-0.02em", lineHeight:1.1 }}>{value}</span>
          {sub && <span style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{sub}</span>}
        </div>
        <div style={{
          width:42, height:42, borderRadius:12, background: color + "15",
          display:"flex", alignItems:"center", justifyContent:"center", color, flexShrink:0
        }}>
          <Icon name={icon} size={20}/>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        {trend !== undefined && (
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div style={{
              display:"flex", alignItems:"center", gap:3, padding:"2px 8px", borderRadius:20,
              background: isPositive ? "#d1fae5" : "#fee2e2",
              color: isPositive ? "#059669" : "#dc2626", fontWeight:700, fontSize:11
            }}>
              <Icon name={isPositive ? "arrowUp" : "arrowDown"} size={10}/>
              {Math.abs(trend)}%
            </div>
            <span style={{ fontSize:11, color:"#94a3b8" }}>vs last month</span>
          </div>
        )}
        {sparkData && <SparkLine data={sparkData} color={color} width={72} height={28}/>}
        {badge && <Badge color={color}>{badge}</Badge>}
      </div>
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────
function Btn({ children, icon, variant = "primary", size = "md", onClick, disabled, style: extraStyle = {} }) {
  const base = {
    display:"inline-flex", alignItems:"center", gap:6, fontFamily:"inherit",
    fontWeight:600, borderRadius:10, border:"none", cursor:disabled?"not-allowed":"pointer",
    transition:"all 0.15s", opacity:disabled?0.5:1, ...extraStyle
  };
  const sizes = { sm:{ padding:"6px 14px", fontSize:12 }, md:{ padding:"10px 18px", fontSize:13 }, lg:{ padding:"13px 24px", fontSize:14 } };
  const variants = {
    primary: { background:"#ff5a1f", color:"#fff", boxShadow:"0 2px 8px rgba(255,90,31,0.35)" },
    secondary: { background:"#fff", color:"#0f172a", border:"1px solid #e2e8f0", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" },
    ghost: { background:"transparent", color:"#64748b" },
    danger: { background:"#ef4444", color:"#fff", boxShadow:"0 2px 8px rgba(239,68,68,0.3)" },
    success: { background:"#10b981", color:"#fff", boxShadow:"0 2px 8px rgba(16,185,129,0.3)" },
  };
  return (
    <button style={{ ...base, ...sizes[size], ...variants[variant] }} onClick={onClick} disabled={disabled}
      onMouseEnter={e => { if(!disabled) e.currentTarget.style.opacity="0.88"; e.currentTarget.style.transform="translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity="1"; e.currentTarget.style.transform=""; }}>
      {icon && <Icon name={icon} size={size==="sm"?12:14}/>}
      {children}
    </button>
  );
}

// ── SearchBar ─────────────────────────────────────────────────────────
function SearchBar({ placeholder = "Search…", value, onChange, style: sx = {} }) {
  return (
    <div style={{ position:"relative", ...sx }}>
      <Icon name="search" size={15} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }}/>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{
          width:"100%", padding:"9px 14px 9px 36px", borderRadius:10, border:"1px solid #e2e8f0",
          fontSize:13, fontFamily:"inherit", color:"#0f172a", background:"#fff",
          outline:"none", boxShadow:"0 1px 3px rgba(0,0,0,0.05)"
        }}
        onFocus={e=>e.target.style.borderColor="#ff5a1f"}
        onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
    </div>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    online:       { label:"Online",      color:"#059669", bg:"#d1fae5" },
    busy:         { label:"Busy",        color:"#d97706", bg:"#fef3c7" },
    offline:      { label:"Offline",     color:"#6b7280", bg:"#f3f4f6" },
    active:       { label:"Active",      color:"#059669", bg:"#d1fae5" },
    completed:    { label:"Completed",   color:"#059669", bg:"#d1fae5" },
    pending:      { label:"Pending",     color:"#d97706", bg:"#fef3c7" },
    assigned:     { label:"Assigned",    color:"#3b82f6", bg:"#dbeafe" },
    "on-route":   { label:"On Route",   color:"#8b5cf6", bg:"#ede9fe" },
    "in-progress":{ label:"In Progress",color:"#0891b2", bg:"#cffafe" },
    cancelled:    { label:"Cancelled",   color:"#dc2626", bg:"#fee2e2" },
    open:         { label:"Open",        color:"#dc2626", bg:"#fee2e2" },
    "in-review":  { label:"In Review",  color:"#d97706", bg:"#fef3c7" },
    resolved:     { label:"Resolved",   color:"#059669", bg:"#d1fae5" },
    escalated:    { label:"Escalated",  color:"#7c3aed", bg:"#ede9fe" },
    verified:     { label:"Verified",   color:"#059669", bg:"#d1fae5" },
    success:      { label:"Success",    color:"#059669", bg:"#d1fae5" },
    critical:     { label:"Critical",   color:"#dc2626", bg:"#fee2e2" },
    high:         { label:"High",       color:"#dc2626", bg:"#fee2e2" },
    medium:       { label:"Medium",     color:"#d97706", bg:"#fef3c7" },
    low:          { label:"Low",        color:"#059669", bg:"#d1fae5" },
    approved:     { label:"Approved",   color:"#059669", bg:"#d1fae5" },
    rejected:     { label:"Rejected",   color:"#dc2626", bg:"#fee2e2" },
  };
  const s = map[status] || { label: status, color:"#64748b", bg:"#f1f5f9" };
  return <span style={{ padding:"3px 10px", borderRadius:20, background:s.bg, color:s.color, fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{s.label}</span>;
}

// ── Section Header ────────────────────────────────────────────────────
function SectionHeader({ title, sub, right }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
      <div>
        <h2 style={{ fontSize:18, fontWeight:800, color:"#0f172a", margin:0 }}>{title}</h2>
        {sub && <p style={{ fontSize:13, color:"#64748b", margin:"3px 0 0" }}>{sub}</p>}
      </div>
      {right && <div style={{ display:"flex", gap:8 }}>{right}</div>}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────
function Card({ children, style: sx = {}, padding = 24 }) {
  return (
    <div style={{
      background:"#fff", borderRadius:16, padding,
      boxShadow:"0 2px 12px rgba(0,0,0,0.06)", border:"1px solid rgba(0,0,0,0.05)", ...sx
    }}>{children}</div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────
function EmptyState({ icon = "info", title = "No data", sub = "" }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 24px", gap:12, color:"#94a3b8" }}>
      <Icon name={icon} size={36} style={{ opacity:0.4 }}/>
      <div style={{ fontWeight:700, fontSize:15, color:"#64748b" }}>{title}</div>
      {sub && <div style={{ fontSize:13 }}>{sub}</div>}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────
function Spinner({ size = 32, color = "#ff5a1f" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation:"spin 0.8s linear infinite" }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeOpacity="0.2" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0110 10" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

// ── LoadingPage ───────────────────────────────────────────────────────
function LoadingPage() {
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      minHeight:"60vh", gap:16, color:"#94a3b8"
    }}>
      <Spinner size={40}/>
      <div style={{ fontSize:13, fontWeight:600, color:"#64748b" }}>Loading…</div>
    </div>
  );
}

// ── PageShell ─────────────────────────────────────────────────────────
function PageShell({ children }) {
  return (
    <div style={{ animation:"fadeIn 0.25s ease", padding:"28px 32px", minHeight:"100%" }}>
      {children}
    </div>
  );
}

// ── ComingSoon ────────────────────────────────────────────────────────
function ComingSoon({ page }) {
  return (
    <PageShell>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60vh", gap:16 }}>
        <div style={{ width:80, height:80, borderRadius:24, background:"rgba(255,90,31,0.1)", display:"flex", alignItems:"center", justifyContent:"center", color:"#ff5a1f" }}>
          <Icon name="flash" size={36}/>
        </div>
        <div style={{ textAlign:"center" }}>
          <h2 style={{ fontSize:22, fontWeight:800, color:"#0f172a", margin:"0 0 8px" }}>{page}</h2>
          <p style={{ fontSize:14, color:"#64748b" }}>This section is coming soon. Stay tuned!</p>
        </div>
        <Badge color="#ff5a1f">In Development</Badge>
      </div>
    </PageShell>
  );
}

// ── usePageData hook ──────────────────────────────────────────────────
window.usePageData = function(module, qs, deps) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  React.useEffect(() => {
    setLoading(true);
    setError(null);
    window.abdApi(module, qs)
      .then(res => {
        if (res.status === 'success') setData(res);
        else setError(res.message || 'Failed');
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, deps || []);
  return { data, loading, error };
};

Object.assign(window, {
  Icon, Avatar, Badge, SparkLine, AreaChart, DonutChart, MiniBar,
  StatCard, Btn, SearchBar, StatusBadge, SectionHeader, Card,
  EmptyState, Spinner, LoadingPage, PageShell, ComingSoon
});

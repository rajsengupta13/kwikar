// kwikar-live.jsx — Live Activity Control Center
const { useState, useEffect, useRef } = React;

const EVENT_TYPES = {
  booking:   { label:'Booking',   color:'var(--cyan)',   bg:'var(--cyan-d)',   icon:'calendar' },
  accept:    { label:'Accepted',  color:'var(--green)',  bg:'var(--green-d)',  icon:'check' },
  referral:  { label:'Referral',  color:'var(--purple)', bg:'var(--purple-d)', icon:'share' },
  upgrade:   { label:'Upgrade',   color:'var(--amber)',  bg:'var(--amber-d)',  icon:'zap' },
  payout:    { label:'Payout',    color:'var(--green)',  bg:'var(--green-d)',  icon:'dollar' },
  cancel:    { label:'Cancelled', color:'var(--red)',    bg:'var(--red-d)',    icon:'x' },
  complaint: { label:'Complaint', color:'var(--amber)',  bg:'var(--amber-d)',  icon:'alertCircle' },
  fraud:     { label:'⚠ Alert',   color:'var(--red)',    bg:'var(--red-d)',    icon:'shield' },
  offline:   { label:'Offline',   color:'var(--text3)',  bg:'rgba(255,255,255,.07)', icon:'clock' },
  boost:     { label:'Boost',     color:'var(--pink)',   bg:'var(--pink-d)',   icon:'star' },
};

const NEW_EVENTS = [
  { id:101, type:'booking', msg:'Rohit Kumar booked Plumbing in Pune', zone:'Pune', amount:750 },
  { id:102, type:'accept', msg:'Sanjay Gupta accepted booking #B2210', zone:'Bangalore', amount:0 },
  { id:103, type:'fraud', msg:'Multiple login attempts on T009 — flagged', zone:'Thane', amount:0 },
  { id:104, type:'payout', msg:'Payout ₹22,800 processed for Vivek Singh', zone:'Delhi', amount:22800 },
  { id:105, type:'referral', msg:'ABD Rahul Gupta onboarded new tech Sandeep Rao', zone:'Delhi', amount:0 },
  { id:106, type:'upgrade', msg:'Mohan Das upgraded from Standard to Premium', zone:'Mumbai', amount:2999 },
  { id:107, type:'cancel', msg:'Booking #B2214 cancelled — customer request', zone:'Hyderabad', amount:0 },
  { id:108, type:'complaint', msg:'Complaint on booking #B2198 — late arrival', zone:'Chennai', amount:0 },
  { id:109, type:'booking', msg:'Ananya Singh booked Electrical Repair in Delhi', zone:'Delhi', amount:1200 },
  { id:110, type:'boost', msg:'Featured boost activated for Suresh Yadav', zone:'Delhi', amount:499 },
  { id:111, type:'offline', msg:'Arjun Patel went offline — Borivali zone', zone:'Mumbai', amount:0 },
  { id:112, type:'accept', msg:'Rajesh Kumar accepted booking #B2216', zone:'Bangalore', amount:0 },
];

function LiveDot({ color }) {
  return (
    <div style={{ position:'relative', width:10, height:10, flexShrink:0 }}>
      <div style={{ width:10, height:10, borderRadius:'50%', background: color }}/>
      <div style={{ position:'absolute', inset:0, borderRadius:'50%', background: color, animation:'ripple 1.8s ease-out infinite' }}/>
    </div>
  );
}

function EventCard({ ev, isNew }) {
  const et = EVENT_TYPES[ev.type] || EVENT_TYPES.booking;
  return (
    <div className="kcard" style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:12, animation: isNew ? 'fadeUp .4s ease both' : 'none', borderLeft:`2px solid ${et.color}` }}>
      <div style={{ width:36, height:36, borderRadius:'50%', background: et.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Ico n={et.icon} s={15} c={et.color}/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
          <span className="kbadge" style={{ background: et.bg, color: et.color, fontSize:10 }}>{et.label}</span>
          {ev.zone && <span style={{ fontSize:11, color:'var(--text3)' }}><Ico n="mapPin" s={10} c="var(--text3)"/> {ev.zone}</span>}
        </div>
        <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.4 }}>{ev.msg}</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
        {ev.amount > 0 && <span style={{ fontSize:12, fontWeight:600, color:'var(--green)', fontFamily:'Space Grotesk' }}>+{fCur(ev.amount)}</span>}
        <span style={{ fontSize:11, color:'var(--text3)' }}>{tAgo(ev.time || 0)}</span>
      </div>
    </div>
  );
}

function LiveStatsBar() {
  const [ticks, setTicks] = useState(0);
  const stats = [
    { label:'Events/min', value: 12 + (ticks % 8), icon:'activity', color:'var(--cyan)' },
    { label:'Live Services', value: 234 + (ticks % 12), icon:'zap', color:'var(--green)' },
    { label:'Online Techs', value: 1892 - (ticks % 5), icon:'wrench', color:'var(--amber)' },
    { label:'Active ABDs', value: 156, icon:'briefcase', color:'var(--purple)' },
    { label:'Open Bookings', value: 847 + (ticks % 20), icon:'calendar', color:'var(--cyan)' },
    { label:'Pending Alerts', value: 3 + (ticks % 3 === 0 ? 1 : 0), icon:'shield', color:'var(--red)' },
  ];
  useEffect(() => {
    const t = setInterval(() => setTicks(v=>v+1), 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:10, marginBottom:20 }}>
      {stats.map(s => (
        <div key={s.label} className="kcard" style={{ padding:'14px', textAlign:'center' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:`${s.color}1A`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Ico n={s.icon} s={14} c={s.color}/>
            </div>
          </div>
          <div style={{ fontFamily:'Space Grotesk', fontSize:20, fontWeight:700, color: s.color, lineHeight:1 }}>{s.value.toLocaleString()}</div>
          <div style={{ fontSize:10.5, color:'var(--text3)', marginTop:4, letterSpacing:'.02em' }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function LiveActivityPage() {
  const [events, setEvents] = useState(KEVENTS.map(e => ({ ...e, time: e.time, isNew: false })));
  const [filter, setFilter] = useState('all');
  const [paused, setPaused] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const idRef = useRef(200);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      const template = NEW_EVENTS[Math.floor(Math.random() * NEW_EVENTS.length)];
      const newEv = { ...template, id: idRef.current++, time: 0, isNew: true };
      setEvents(prev => {
        const updated = prev.map(e => ({ ...e, time: e.time + 4, isNew: false }));
        return [newEv, ...updated].slice(0, 60);
      });
      setNewCount(v => v + 1);
    }, 4000);
    return () => clearInterval(t);
  }, [paused]);

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);

  return (
    <div className="page-wrap" style={{ paddingBottom:32 }}>
      <div className="page-header">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div className="page-title">Live Activity</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', background:'var(--red-d)', borderRadius:20, border:'1px solid rgba(248,113,113,.25)' }}>
              <LiveDot color="var(--red)"/>
              <span style={{ fontSize:11, fontWeight:600, color:'var(--red)', letterSpacing:'.04em' }}>LIVE FEED</span>
            </div>
          </div>
          <div className="page-sub">Real-time platform event stream · {newCount} events since load</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="kbtn" onClick={() => setPaused(v=>!v)} style={{ background: paused ? 'var(--amber-d)' : 'var(--card)', borderColor: paused ? 'rgba(251,191,36,.3)' : 'var(--border)', color: paused ? 'var(--amber)' : 'var(--text2)' }}>
            <Ico n={paused ? 'activity' : 'clock'} s={13}/>{paused ? 'Resume' : 'Pause'}
          </button>
          <button className="kbtn"><Ico n="download" s={13}/>Export</button>
        </div>
      </div>

      <LiveStatsBar/>

      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {['all','booking','accept','referral','upgrade','payout','cancel','complaint','fraud','offline','boost'].map(f => (
          <button key={f} className="kbtn" onClick={() => setFilter(f)}
            style={{ padding:'5px 12px', fontSize:11.5, background: filter===f ? (EVENT_TYPES[f]?.bg || 'var(--cyan-d)') : 'var(--card)', color: filter===f ? (EVENT_TYPES[f]?.color || 'var(--cyan)') : 'var(--text3)', borderColor: filter===f ? `${EVENT_TYPES[f]?.color || 'var(--cyan)'}44` : 'var(--border)' }}>
            {f === 'all' ? 'All Events' : (EVENT_TYPES[f]?.label || f)}
          </button>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {filtered.length === 0 ? <Empty icon="activity" title="No events matching filter"/> : filtered.slice(0,40).map(ev => (
          <EventCard key={ev.id} ev={ev} isNew={ev.isNew}/>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { LiveActivityPage });

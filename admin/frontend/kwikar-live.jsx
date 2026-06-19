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
  boost:     { label:'Boost',     color:'var(--pink)',   bg:'var(--pink-d)',   icon:'star' },
  register:  { label:'New Signup',color:'var(--green)',  bg:'var(--green-d)',  icon:'user' },
};

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
  const timeLabel = ev.created_at
    ? new Date(ev.created_at.replace(' ', 'T')).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
    : '';
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
        <span style={{ fontSize:11, color:'var(--text3)' }}>{timeLabel}</span>
      </div>
    </div>
  );
}

function LiveStatsBar() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      try {
        const res = await window.adminApi('stats_live');
        if (!cancelled && res && (res.status === 'success' || res.success)) setStats(res);
      } catch (e) {}
    };
    pull();
    const t = setInterval(pull, 10000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const cards = [
    { label:'Events/min',    value: stats?.events_per_min   ?? 0, icon:'activity',  color:'var(--cyan)' },
    { label:'Live Services', value: stats?.live_services    ?? 0, icon:'zap',       color:'var(--green)' },
    { label:'Online Techs',  value: stats?.online_techs     ?? 0, icon:'wrench',    color:'var(--amber)' },
    { label:'Active ABDs',   value: stats?.active_abds      ?? 0, icon:'briefcase', color:'var(--purple)' },
    { label:'Open Bookings', value: stats?.open_bookings    ?? 0, icon:'calendar',  color:'var(--cyan)' },
    { label:'Pending Alerts',value: stats?.pending_alerts   ?? 0, icon:'shield',    color:'var(--red)' },
  ];

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:10, marginBottom:20 }}>
      {cards.map(s => (
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
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [paused, setPaused] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // Real-time feed pulled straight from the database — bookings, status changes,
  // payouts, referrals, subscriptions, boosts, support tickets and signups.
  useEffect(() => {
    let cancelled = false;
    const sinceRef = { current: null };

    const pull = async (isFirstLoad) => {
      try {
        const q = 'live_feed' + (sinceRef.current ? ('&since=' + encodeURIComponent(sinceRef.current)) : '');
        const res = await window.adminApi(q);
        if (cancelled || res.status !== 'success' || !Array.isArray(res.events)) return;

        if (res.events.length) sinceRef.current = res.events[0].created_at;
        else if (res.server_time) sinceRef.current = res.server_time;

        const incoming = res.events.map(e => ({ ...e, isNew: !isFirstLoad }));

        setEvents(prev => {
          const seen = new Set();
          const merged = [...incoming, ...prev].filter(e => (seen.has(e.id) ? false : (seen.add(e.id), true)));
          merged.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
          return merged.slice(0, 100);
        });
        if (!isFirstLoad && incoming.length) setNewCount(v => v + incoming.length);
      } catch (e) {}
    };

    pull(true);
    const t = setInterval(() => { if (!pausedRef.current) pull(false); }, 8000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

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
          <div className="page-sub">Real-time platform event stream · bookings, payouts, referrals &amp; signups from the database · {newCount} events since load</div>
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
        {['all','register','booking','accept','referral','upgrade','payout','cancel','complaint','boost'].map(f => (
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

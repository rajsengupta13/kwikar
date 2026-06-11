// kwikar-dashboard.jsx — Dashboard with real API data
const { useState, useEffect, useRef } = React;

function useAdminFetch(module, params) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  useEffect(() => {
    const qs = params ? '&' + new URLSearchParams(params).toString() : '';
    window.adminApi(module + (qs ? '' : ''), null, null)
      .then(res => { if (res.status === 'success' || res.success) setData(res); else setError(res.error || 'Failed'); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line
  }, [module]);
  return { data, loading, error, refetch: () => {} };
}
window.useAdminFetch = useAdminFetch;

function MiniSparkline({ data = [], color = 'var(--cyan)', height = 36 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !data.length) return;
    const ctx = ref.current.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: { labels: data.map((_,i)=>i), datasets: [{ data, borderColor: color, backgroundColor: 'transparent', fill: false, tension: 0.4, borderWidth: 1.5, pointRadius: 0 }] },
      options: { responsive:false, plugins:{legend:{display:false},tooltip:{enabled:false}}, scales:{x:{display:false},y:{display:false}} }
    });
    return () => chart.destroy();
  }, [data, color]);
  return <canvas ref={ref} width={80} height={height} style={{ display:'block' }}/>;
}

function StatCard({ icon, label, value, prefix='', suffix='', sub, subUp, color='var(--cyan)', delay=0 }) {
  const colorDim = color==='var(--cyan)'?'var(--cyan-d)':color==='var(--green)'?'var(--green-d)':color==='var(--purple)'?'var(--purple-d)':color==='var(--amber)'?'var(--amber-d)':color==='var(--red)'?'var(--red-d)':'var(--pink-d)';
  return (
    <div className="kcard kcard-h" style={{ padding:'18px', display:'flex', flexDirection:'column', gap:12, animation:`fadeUp .4s ease ${delay}ms both`, position:'relative', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:34, height:34, borderRadius:9, background:colorDim, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Ico n={icon} s={16} c={color}/>
        </div>
        <span style={{ fontSize:12, color:'var(--text2)', fontWeight:500 }}>{label}</span>
      </div>
      <div>
        <div style={{ fontFamily:'Space Grotesk', fontSize:26, fontWeight:700, color:'var(--text)', lineHeight:1, letterSpacing:'-.02em' }}>
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </div>
        {sub && (
          <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:6 }}>
            <Ico n={subUp?'up':'down'} s={12} c={subUp?'var(--green)':'var(--red)'}/>
            <span style={{ fontSize:11.5, color:subUp?'var(--green)':'var(--red)', fontWeight:500 }}>{sub}</span>
          </div>
        )}
      </div>
      <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:color, opacity:.04, filter:'blur(20px)', pointerEvents:'none' }}/>
    </div>
  );
}

function RevenueChart() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const ctx = ref.current.getContext('2d');
    const grad = ctx.createLinearGradient(0,0,0,220);
    grad.addColorStop(0,'rgba(34,211,238,0.25)'); grad.addColorStop(1,'rgba(34,211,238,0.00)');
    const chart = new Chart(ctx, {
      type:'line',
      data:{ labels:KMONTHS, datasets:[
        { label:'Revenue (₹L)', data:KREVSERIES, borderColor:'#22D3EE', backgroundColor:grad, fill:true, tension:0.4, borderWidth:2, pointRadius:3, pointBackgroundColor:'#22D3EE', pointBorderColor:'#08090E', pointBorderWidth:2 },
        { label:'Bookings (×100)', data:KBOOKSERIES.map(v=>v/100), borderColor:'#A78BFA', backgroundColor:'transparent', fill:false, tension:0.4, borderWidth:1.5, pointRadius:0, borderDash:[4,3] }
      ]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:true,labels:{color:'#8B8FA8',font:{size:11},boxWidth:12,padding:16}}, tooltip:{backgroundColor:'rgba(13,14,22,.95)',borderColor:'rgba(255,255,255,.1)',borderWidth:1,titleColor:'#E5E7F0',bodyColor:'#8B8FA8',padding:10,cornerRadius:8} }, scales:{ x:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#6B7280',font:{size:11}}}, y:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#6B7280',font:{size:11},callback:v=>`₹${v}L`}} } }
    });
    return () => chart.destroy();
  }, []);
  return <canvas ref={ref} style={{ width:'100%', height:'100%' }}/>;
}

function BookingDonut() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const ctx = ref.current.getContext('2d');
    const chart = new Chart(ctx, {
      type:'doughnut',
      data:{ labels:['AC Repair','Plumbing','Electrical','Appliance','Carpentry'], datasets:[{ data:[28,22,19,24,7], backgroundColor:['#22D3EE','#A78BFA','#34D399','#FBBF24','#F472B6'], borderColor:'#0A0B12', borderWidth:3 }] },
      options:{ responsive:true, maintainAspectRatio:false, cutout:'72%', plugins:{ legend:{position:'right',labels:{color:'#8B8FA8',font:{size:11},boxWidth:10,padding:12}}, tooltip:{backgroundColor:'rgba(13,14,22,.95)',borderColor:'rgba(255,255,255,.1)',borderWidth:1,titleColor:'#E5E7F0',bodyColor:'#8B8FA8',padding:10,cornerRadius:8} } }
    });
    return () => chart.destroy();
  }, []);
  return <canvas ref={ref} style={{ width:'100%', height:'100%' }}/>;
}

function DashboardPage() {
  const [stats, setStats]   = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.adminApi('dashboard')
      .then(res => {
        if (res.status === 'success' || res.success) {
          setStats(res.stats || {});
          setRecent(res.recent_bookings || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const s = stats || {};

  const cards = [
    { icon:'users',     label:'Total Customers',     value: s.total_customers    || 0, color:'var(--cyan)',   delay:0   },
    { icon:'wrench',    label:'Total Technicians',    value: s.total_technicians  || 0, color:'var(--green)',  delay:50  },
    { icon:'briefcase', label:'Total ABDs',           value: s.total_abds         || 0, color:'var(--purple)', delay:100 },
    { icon:'activity',  label:'Online Technicians',   value: s.online_technicians || 0, color:'var(--amber)',  delay:150 },
    { icon:'calendar',  label:'Bookings Today',       value: s.bookings_today     || 0, color:'var(--cyan)',   delay:200 },
    { icon:'zap',       label:'Live Services',        value: s.live_services      || 0, color:'var(--green)',  delay:250 },
    { icon:'check',     label:'Completed Bookings',   value: s.completed_bookings || 0, color:'var(--green)',  delay:300 },
    { icon:'x',         label:'Cancelled Bookings',   value: s.cancelled_bookings || 0, color:'var(--red)',    delay:350 },
    { icon:'clock',     label:'Pending Payouts',      value: s.pending_payouts    || 0, color:'var(--amber)',  delay:400 },
    { icon:'dollar',    label:'Total Paid Out',       value: fCur(s.total_paid_out || 0), color:'var(--green)', delay:450 },
    { icon:'alertCircle',label:'Pending KYC',         value: s.pending_kyc        || 0, color:'var(--amber)',  delay:500 },
    { icon:'calendar',  label:'Total Bookings',       value: s.total_bookings     || 0, color:'var(--purple)', delay:550 },
  ];

  return (
    <div className="page-wrap" style={{ paddingBottom:32 }}>
      <div className="page-header">
        <div>
          <div className="page-title">Command Center</div>
          <div className="page-sub">Real-time platform overview</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="kbtn p" onClick={()=>window.location.reload()}><Ico n="refresh" s={13}/>Refresh</button>
        </div>
      </div>

      {loading && <div style={{ textAlign:'center', padding:40, color:'var(--text3)' }}><Spinner size={28}/></div>}

      {!loading && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
            {cards.map((c,i) => <StatCard key={i} {...c}/>)}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:14, marginBottom:14 }}>
            <div className="kcard" style={{ padding:'20px' }}>
              <div style={{ fontFamily:'Space Grotesk', fontSize:14, fontWeight:600, marginBottom:4 }}>Revenue & Booking Trend</div>
              <div style={{ fontSize:12, color:'var(--text2)', marginBottom:16 }}>Historical platform data</div>
              <div style={{ height:220 }}><RevenueChart/></div>
            </div>
            <div className="kcard" style={{ padding:'20px' }}>
              <div style={{ fontFamily:'Space Grotesk', fontSize:14, fontWeight:600, marginBottom:4 }}>Booking Categories</div>
              <div style={{ fontSize:12, color:'var(--text2)', marginBottom:16 }}>Distribution</div>
              <div style={{ height:220 }}><BookingDonut/></div>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="kcard" style={{ padding:'20px' }}>
            <div style={{ fontFamily:'Space Grotesk', fontSize:14, fontWeight:600, marginBottom:16 }}>Recent Bookings</div>
            {recent.length === 0
              ? <Empty icon="calendar" title="No bookings yet"/>
              : <table className="ktable">
                  <thead><tr><th>Code</th><th>Customer</th><th>Service</th><th>Status</th><th>Time</th></tr></thead>
                  <tbody>
                    {recent.map((b,i) => (
                      <tr key={i}>
                        <td><span style={{ fontFamily:'monospace', fontSize:12, color:'var(--text3)' }}>{b.booking_code}</span></td>
                        <td style={{ color:'var(--text)', fontWeight:500 }}>{b.customer_name}</td>
                        <td>{b.service_name}</td>
                        <td><Badge type={b.status} label={b.status}/></td>
                        <td style={{ fontSize:12, color:'var(--text3)' }}>{b.created_at ? new Date(b.created_at).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { DashboardPage, useAdminFetch });

// kwikar-finance.jsx — Revenue & Bookings with real API data
const { useState, useEffect, useRef, useMemo } = React;

function RevenuePage() {
  const [tab, setTab]   = useState('overview');
  const [abds, setAbds] = useState([]);
  const [txns, setTxns] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      window.adminApi('abds').catch(()=>({abds:[]})),
    ]).then(([abdRes]) => {
      setAbds(abdRes.abds||[]);
    }).finally(()=>setLoading(false));
  }, []);

  const totalRevenue  = abds.reduce((s,a)=>s+(parseFloat(a.total_earned)||0),0);
  const totalCommission = abds.reduce((s,a)=>s+(parseFloat(a.total_earned)||0)*(parseFloat(a.direct_commission_percent)||12.5)/100,0);

  return (
    <div className="page-wrap" style={{ paddingBottom:32 }}>
      <div className="page-header">
        <div><div className="page-title">Revenue & Commissions</div><div className="page-sub">Financial overview</div></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
        {[
          {l:'Total Platform Revenue',v:fCur(totalRevenue),c:'var(--purple)',i:'dollar'},
          {l:'Total ABD Commissions',v:fCur(totalCommission),c:'var(--green)',i:'award'},
          {l:'Active ABDs',v:abds.filter(a=>a.status==='active'||a.user_status==='active').length,c:'var(--cyan)',i:'briefcase'},
        ].map(m=>(
          <div key={m.l} className="kcard" style={{ padding:'18px' }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:10 }}>
              <div style={{ width:32,height:32,borderRadius:8,background:`${m.c}1A`,display:'flex',alignItems:'center',justifyContent:'center' }}><Ico n={m.i} s={15} c={m.c}/></div>
              <span style={{ fontSize:12,color:'var(--text2)' }}>{m.l}</span>
            </div>
            <div style={{ fontFamily:'Space Grotesk',fontSize:24,fontWeight:700,color:'var(--text)' }}>{m.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex',gap:6,marginBottom:16 }}>
        {['overview','transactions'].map(t=>(
          <button key={t} className="kbtn" onClick={()=>setTab(t)} style={{ background:tab===t?'var(--purple-d)':'var(--card)',color:tab===t?'var(--purple)':'var(--text2)',borderColor:tab===t?'rgba(167,139,250,.3)':'var(--border)' }}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {tab==='overview' && (
        <div className="kcard" style={{ padding:'20px' }}>
          <div style={{ fontFamily:'Space Grotesk',fontSize:14,fontWeight:600,marginBottom:16 }}>ABD Commission Summary</div>
          {loading ? <div style={{ padding:40,textAlign:'center' }}><Spinner/></div> :
            abds.length===0 ? <Empty icon="dollar" title="No ABD data yet"/> :
            <table className="ktable">
              <thead><tr><th>ABD</th><th>Technicians</th><th>Total Earned</th><th>Commission Rate</th><th>Commission Earned</th><th>Status</th></tr></thead>
              <tbody>
                {abds.map(abd=>(
                  <tr key={abd.abd_id||abd.id}>
                    <td><div style={{ display:'flex',alignItems:'center',gap:8 }}><Avatar name={abd.name||'?'} size={28}/><span style={{ fontWeight:500,color:'var(--text)' }}>{abd.name}</span></div></td>
                    <td><span style={{ fontFamily:'Space Grotesk',fontWeight:600,color:'var(--text)' }}>{abd.tech_count||0}</span></td>
                    <td><span style={{ color:'var(--text)',fontWeight:500 }}>{fCur(abd.total_earned||0)}</span></td>
                    <td><span style={{ color:'var(--amber)' }}>{abd.direct_commission_percent||12.5}%</span></td>
                    <td><span style={{ color:'var(--green)',fontWeight:600,fontFamily:'Space Grotesk' }}>{fCur((abd.total_earned||0)*(abd.direct_commission_percent||12.5)/100)}</span></td>
                    <td><Badge type={abd.status||abd.user_status} label={abd.status||abd.user_status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </div>
      )}

      {tab==='transactions' && (
        <div className="kcard" style={{ padding:'20px' }}>
          <Empty icon="dollar" title="Transaction history" sub="Wallet transaction data will appear here as technicians earn and withdraw"/>
        </div>
      )}
    </div>
  );
}

// ── Bookings ──────────────────────────────────────────────────────────────────
function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [statusF, setStatusF]   = useState('all');
  const [q, setQ]               = useState('');

  function load() {
    setLoading(true);
    window.adminApi('bookings')
      .then(res => { if (res.status==='success') setBookings(res.bookings||[]); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }
  useEffect(load, []);

  const STATUS_COLORS = { live:'var(--red)',ongoing:'var(--red)',assigned:'var(--cyan)',pending:'var(--amber)',completed:'var(--green)',cancelled:'var(--text3)',new:'var(--purple)' };

  const filtered = useMemo(()=>bookings.filter(b=>{
    const mq = !q || b.customer_name?.toLowerCase().includes(q.toLowerCase()) || b.service_name?.toLowerCase().includes(q.toLowerCase()) || b.booking_code?.includes(q) || b.city?.includes(q);
    const ms = statusF==='all' || b.status===statusF;
    return mq && ms;
  }),[bookings,q,statusF]);

  const counts = bookings.reduce((acc,b)=>{ acc[b.status]=(acc[b.status]||0)+1; return acc; },{});

  return (
    <div className="page-wrap" style={{ paddingBottom:32 }}>
      <div className="page-header">
        <div><div className="page-title">Bookings</div><div className="page-sub">{bookings.length} total · {counts.ongoing||0} live now</div></div>
        <button className="kbtn p" onClick={load}><Ico n="refresh" s={13}/>Refresh</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:20 }}>
        {[{s:'ongoing',l:'Live',c:'var(--red)'},{s:'assigned',l:'Assigned',c:'var(--cyan)'},{s:'pending',l:'Pending',c:'var(--amber)'},{s:'completed',l:'Completed',c:'var(--green)'},{s:'cancelled',l:'Cancelled',c:'var(--text3)'}].map(m=>(
          <div key={m.s} className="kcard kcard-h" style={{ padding:'14px',cursor:'pointer',border:`1px solid ${statusF===m.s?m.c+'55':'var(--border)'}`,background:statusF===m.s?`${m.c}0D`:'var(--card)' }} onClick={()=>setStatusF(statusF===m.s?'all':m.s)}>
            <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:6 }}>
              <div style={{ width:7,height:7,borderRadius:'50%',background:m.c }}/>
              <span style={{ fontSize:11,color:'var(--text2)' }}>{m.l}</span>
            </div>
            <div style={{ fontFamily:'Space Grotesk',fontSize:22,fontWeight:700,color:m.c }}>{counts[m.s]||0}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex',gap:10,marginBottom:14,alignItems:'center' }}>
        <div style={{ position:'relative',width:260 }}>
          <div style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)' }}><Ico n="search" s={13} c="var(--text3)"/></div>
          <input className="kinput" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search booking, customer, service…" style={{ paddingLeft:32,height:36 }}/>
        </div>
        <span style={{ marginLeft:'auto',fontSize:12,color:'var(--text3)' }}>{filtered.length} results</span>
      </div>

      <div className="kcard">
        {loading ? <div style={{ padding:40,textAlign:'center' }}><Spinner/></div> :
          filtered.length===0 ? <Empty icon="calendar" title="No bookings found"/> :
          <table className="ktable">
            <thead><tr><th>Booking</th><th>Customer</th><th>Technician</th><th>Service</th><th>Area</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(b=>(
                <tr key={b.id}>
                  <td><span style={{ fontFamily:'monospace',fontSize:12,color:'var(--text3)' }}>{b.booking_code}</span></td>
                  <td><span style={{ fontWeight:500,color:'var(--text)' }}>{b.customer_name}</span></td>
                  <td><span style={{ color:b.tech_name?'var(--text2)':'var(--text3)' }}>{b.tech_name||'—'}</span></td>
                  <td><span style={{ fontSize:12,padding:'2px 8px',background:'rgba(255,255,255,.06)',borderRadius:5,color:'var(--text2)' }}>{b.service_name}</span></td>
                  <td><div style={{ display:'flex',alignItems:'center',gap:4 }}><Ico n="mapPin" s={11} c="var(--text3)"/>{b.city||b.pincode}</div></td>
                  <td style={{ fontSize:12 }}>{b.preferred_date} {b.preferred_time?.slice(0,5)}</td>
                  <td><span style={{ color:'var(--green)',fontWeight:600,fontFamily:'Space Grotesk' }}>{b.final_amount?`₹${b.final_amount}`:'—'}</span></td>
                  <td>
                    <div style={{ display:'flex',alignItems:'center',gap:5 }}>
                      {(b.status==='ongoing')&&<div style={{ width:6,height:6,borderRadius:'50%',background:'var(--red)',animation:'pulse 1.2s infinite' }}/>}
                      <Badge type={b.status} label={b.status}/>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </div>
    </div>
  );
}

Object.assign(window, { RevenuePage, BookingsPage });

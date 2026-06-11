// kwikar-pages-a.jsx — Dashboard + Technicians pages
const { useState, useEffect, useRef } = React;

// ── Dashboard ──────────────────────────────────────────────────────────
function DashboardPage({ onNavigate }) {
  const { data, loading } = window.usePageData('dashboard');

  const D = React.useMemo(() => {
    if (!data) return window.KD;
    const e = data.stats?.earnings || {};
    const t = data.stats?.technicians || {};
    const b = data.stats?.bookings || {};
    return {
      ...window.KD,
      earnings: {
        ...window.KD.earnings,
        total:             e.total           ?? window.KD.earnings.total,
        today:             e.today           ?? window.KD.earnings.today,
        thisMonth:         e.this_month      ?? window.KD.earnings.thisMonth,
        wallet:            e.wallet          ?? window.KD.earnings.wallet,
        directReferral:    e.direct_referral ?? window.KD.earnings.directReferral,
        indirectReferral:  e.indirect_referral ?? window.KD.earnings.indirectReferral,
        pending:           e.pending         ?? window.KD.earnings.pending,
        totalWithdrawals:  e.total_withdrawals ?? window.KD.earnings.totalWithdrawals,
      },
      technicians: {
        ...window.KD.technicians,
        total:    t.total    ?? window.KD.technicians.total,
        direct:   t.direct   ?? window.KD.technicians.direct,
        referral: t.referral ?? window.KD.technicians.referral,
        active:   t.active   ?? window.KD.technicians.active,
        inactive: t.inactive ?? window.KD.technicians.inactive,
      },
      bookings: {
        ...window.KD.bookings,
        total:     b.total     ?? window.KD.bookings.total,
        pending:   b.pending   ?? window.KD.bookings.pending,
        active:    b.active    ?? window.KD.bookings.active,
        completed: b.completed ?? window.KD.bookings.completed,
        cancelled: b.cancelled ?? window.KD.bookings.cancelled,
      },
      revenueData: (data.revenue_chart?.length && data.revenue_chart.some(v => v > 0))
        ? data.revenue_chart
        : window.KD.revenueData,
      activityFeed: data.activity_feed?.length
        ? data.activity_feed.map(n => ({
            id: n.id,
            type: n.type || 'system',
            avatar: (n.title || '??').substring(0, 2).toUpperCase(),
            name: n.title,
            msg: n.title,
            sub: n.message || n.body || '',
            time: n.created_at,
            color: '#ff5a1f',
          }))
        : window.KD.activityFeed,
      profile: data.profile || null,
    };
  }, [data]);

  if (loading) return <LoadingPage/>;

  const labels = data?.chart_labels?.length
    ? data.chart_labels
    : Array.from({length:30},(_,i)=>{const d=new Date(); d.setDate(d.getDate()-29+i); return d.toLocaleDateString("en-IN",{day:"numeric",month:"short"});});

  const firstName = (D.profile?.full_name || window.ABD_SESSION?.full_name || 'there').split(' ')[0];

  const statCards = [
    { label:"Total Earnings", value:`₹${(D.earnings.total/1000).toFixed(1)}K`, icon:"earnings", color:"#ff5a1f", trend:18.4, sparkData:D.revenueData.slice(-10), sub:"Lifetime ABD earnings" },
    { label:"Today's Earnings", value:`₹${Number(D.earnings.today).toLocaleString("en-IN")}`, icon:"flash", color:"#10b981", trend:8.2, sparkData:D.revenueData.slice(-7), sub:"Updated just now" },
    { label:"Monthly Earnings", value:`₹${(D.earnings.thisMonth/1000).toFixed(1)}K`, icon:"trending", color:"#3b82f6", trend:22.1, sparkData:D.revenueData.slice(-14), sub:new Date().toLocaleString("en-IN",{month:"long",year:"numeric"}) },
    { label:"Wallet Balance", value:`₹${Number(D.earnings.wallet).toLocaleString("en-IN")}`, icon:"wallet", color:"#8b5cf6", sub:`₹${Number(D.earnings.pending).toLocaleString("en-IN")} pending payout`, sparkData:null, badge:"Withdraw" },
    { label:"Direct Referral", value:`₹${(D.earnings.directReferral/1000).toFixed(1)}K`, icon:"userdirect", color:"#ff5a1f", trend:15.3, sparkData:D.revenueData.slice(-8), sub:`From ${D.technicians.direct} direct techs` },
    { label:"Indirect Referral", value:`₹${(D.earnings.indirectReferral/1000).toFixed(1)}K`, icon:"network", color:"#06b6d4", trend:31.7, sparkData:D.revenueData.slice(-10).map(v=>v*0.5), sub:`From ${D.technicians.referral} chain techs` },
  ];

  const techCards = [
    { label:"Total Technicians", value:D.technicians.total, color:"#ff5a1f", icon:"users" },
    { label:"Active Now",        value:D.technicians.active, color:"#10b981", icon:"flash" },
    { label:"Direct (L1)",       value:D.technicians.direct, color:"#3b82f6", icon:"userdirect" },
    { label:"Referral (L2+)",    value:D.technicians.referral, color:"#8b5cf6", icon:"userreferral" },
  ];

  const pincodeStr = D.profile?.area || window.ABD_SESSION?.area || '—';

  return (
    <div style={{ padding:"28px 32px", animation:"fadeIn 0.25s ease" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:800, color:"#0f172a", margin:0 }}>
            Good morning, {firstName}!
          </h2>
          <p style={{ fontSize:13, color:"#64748b", margin:"4px 0 0" }}>
            Here's what's happening across your network today.
          </p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn icon="plus" onClick={()=>onNavigate("direct-technicians")}>Add Technician</Btn>
          <Btn variant="secondary" icon="reports" onClick={()=>onNavigate("reports")}>View Reports</Btn>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
        {statCards.map(c => <StatCard key={c.label} {...c}/>)}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20, marginBottom:24 }}>
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div>
              <h3 style={{ fontSize:15, fontWeight:800, color:"#0f172a", margin:0 }}>Revenue Overview</h3>
              <p style={{ fontSize:12, color:"#64748b", margin:"3px 0 0" }}>Last 30 days earnings trend</p>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {["7D","30D","3M"].map((t,i) => (
                <button key={t} style={{
                  padding:"4px 12px", borderRadius:8, border:"1px solid #e2e8f0", fontSize:11,
                  fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                  background: i===1 ? "#ff5a1f" : "#fff", color: i===1 ? "#fff" : "#64748b"
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ width:"100%", overflowX:"auto" }}>
            <AreaChart data={D.revenueData} labels={labels} color="#ff5a1f" width={580} height={200}/>
          </div>
          <div style={{ display:"flex", gap:24, marginTop:16, paddingTop:16, borderTop:"1px solid #f1f5f9" }}>
            <div><div style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>PEAK DAY</div><div style={{ fontSize:14, fontWeight:800, color:"#0f172a" }}>₹{Math.max(...D.revenueData).toLocaleString("en-IN")}</div></div>
            <div><div style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>AVG/DAY</div><div style={{ fontSize:14, fontWeight:800, color:"#0f172a" }}>₹{Math.round(D.revenueData.reduce((a,b)=>a+b,0)/D.revenueData.length).toLocaleString("en-IN")}</div></div>
            <div><div style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>TOTAL</div><div style={{ fontSize:14, fontWeight:800, color:"#ff5a1f" }}>₹{D.revenueData.reduce((a,b)=>a+b,0).toLocaleString("en-IN")}</div></div>
          </div>
        </Card>

        <Card padding={0}>
          <div style={{ padding:"18px 20px", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <h3 style={{ fontSize:14, fontWeight:800, color:"#0f172a", margin:0 }}>Live Activity</h3>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:"#10b981", animation:"pulse 2s infinite" }}/>
              <span style={{ fontSize:11, color:"#10b981", fontWeight:600 }}>Live</span>
            </div>
          </div>
          <div style={{ overflowY:"auto", maxHeight:280 }}>
            {D.activityFeed.map(item => (
              <div key={item.id} style={{
                display:"flex", gap:12, padding:"12px 18px",
                borderBottom:"1px solid #f8fafc", transition:"background 0.15s"
              }}
                onMouseEnter={e=>e.currentTarget.style.background="#fafbfc"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{
                  width:36, height:36, borderRadius:"50%", flexShrink:0,
                  background: (item.color || '#ff5a1f') + "18",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:12, fontWeight:800, color:item.color || '#ff5a1f'
                }}>{item.avatar}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.msg}</div>
                  <div style={{ fontSize:11, color:"#64748b", marginTop:1 }}>{item.sub}</div>
                  <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <Card>
          <SectionHeader title="Network Summary" sub="Technician breakdown across your area"
            right={<Btn variant="ghost" size="sm" icon="network" onClick={()=>onNavigate("referral-tree")}>View Tree</Btn>}/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
            {techCards.map(t => (
              <div key={t.label} style={{
                padding:"14px 16px", borderRadius:12, background: t.color + "0a",
                border:`1px solid ${t.color}20`
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <span style={{ fontSize:11, color:t.color, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{t.label}</span>
                  <Icon name={t.icon} size={14} style={{ color:t.color }}/>
                </div>
                <div style={{ fontSize:28, fontWeight:800, color:t.color }}>{t.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0 0", borderTop:"1px solid #f1f5f9" }}>
            <span style={{ fontSize:12, color:"#64748b" }}>
              {pincodeStr ? `Pincodes: ${pincodeStr}` : 'No pincodes assigned'}
            </span>
            <Btn variant="ghost" size="sm" onClick={()=>onNavigate("pincodes")}>Manage →</Btn>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Booking Summary" sub="Service requests across your network"
            right={<Btn variant="ghost" size="sm" icon="bookings" onClick={()=>onNavigate("bookings")}>All Bookings</Btn>}/>
          <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap", alignItems:"flex-start" }}>
            <DonutChart size={100} strokeWidth={14} segments={[
              { pct: D.bookings.total ? (D.bookings.completed / D.bookings.total) * 100 : 97, color:"#10b981" },
              { pct: D.bookings.total ? (D.bookings.active / D.bookings.total) * 100 : 1,    color:"#3b82f6" },
              { pct: D.bookings.total ? (D.bookings.pending / D.bookings.total) * 100 : 1,   color:"#f59e0b" },
              { pct: D.bookings.total ? (D.bookings.cancelled / D.bookings.total) * 100 : 1, color:"#ef4444" },
            ]}/>
            <div style={{ flex:"1 1 130px", minWidth:0, display:"flex", flexDirection:"column", gap:8, justifyContent:"center" }}>
              {[
                { label:"Completed", val:D.bookings.completed, color:"#10b981" },
                { label:"Active",    val:D.bookings.active,    color:"#3b82f6" },
                { label:"Pending",   val:D.bookings.pending,   color:"#f59e0b" },
                { label:"Cancelled", val:D.bookings.cancelled, color:"#ef4444" },
              ].map(r => (
                <div key={r.label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:r.color, flexShrink:0 }}/>
                  <span style={{ fontSize:12, color:"#64748b", flex:1, whiteSpace:"nowrap" }}>{r.label}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:"#0f172a" }}>{Number(r.val).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
            <div style={{ flex:"1 1 90px", display:"flex", flexDirection:"row", alignItems:"center", gap:16, paddingTop:4, borderTop:"1px solid #f1f5f9", width:"100%" }}>
              <div>
                <div style={{ fontSize:10, color:"#94a3b8", fontWeight:600, textTransform:"uppercase" }}>Total</div>
                <div style={{ fontSize:26, fontWeight:800, color:"#0f172a", lineHeight:1.1 }}>{Number(D.bookings.total).toLocaleString("en-IN")}</div>
              </div>
              <div style={{ fontSize:11, color:"#10b981", fontWeight:700, background:"#d1fae5", padding:"4px 10px", borderRadius:20 }}>Network bookings</div>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[
              { label:"Satisfaction", value:"96.2%", color:"#10b981" },
              { label:"Avg. Response", value:"18 min", color:"#3b82f6" },
            ].map(m => (
              <div key={m.label} style={{ padding:"10px 14px", borderRadius:10, background:"#f8fafc" }}>
                <div style={{ fontSize:10, color:"#94a3b8", fontWeight:600, textTransform:"uppercase" }}>{m.label}</div>
                <div style={{ fontSize:16, fontWeight:800, color:m.color, marginTop:2 }}>{m.value}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Add Technician Modal (WhatsApp referral link + QR) ──────────────────
function AddTechModal({ onClose }) {
  const [copied, setCopied]   = React.useState(false);
  const [tab, setTab]         = React.useState('link');
  const [qrLoaded, setQrLoaded] = React.useState(false);

  const sess    = window.ABD_SESSION || {};
  const abdId   = sess.abd_id   || '';
  const abdName = sess.full_name || 'ABD';
  const base    = window.location.origin + window.location.pathname.replace(/\/abd\/.*$/, '');
  const link    = `${base}/frontend/index.html?abd_ref=${abdId}&join=tech`;
  const waMsg   = `Namaste! 🙏\n\n*${abdName}* aapko *Kwikar* technician partner banne ke liye invite kar rahe hain! 🔧\n\n✅ Apne area mein booking milegi\n✅ Seedhe customer se payment\n✅ Koi commission cut nahi\n\nAbhi register karein 👇\n${link}`;
  const waUrl   = `https://wa.me/?text=${encodeURIComponent(waMsg)}`;

  // Direct QR image URL — no JS library needed, renders like any <img>
  const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(link)}&color=0f172a&bgcolor=ffffff&margin=10&format=png`;

  function copyLink() {
    const t = document.createElement('textarea');
    t.value = link; t.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(t); t.focus(); t.select();
    try { document.execCommand('copy'); } catch (_) {}
    document.body.removeChild(t);
    if (navigator.clipboard) navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function downloadQR() {
    fetch(qrImgSrc)
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.download = `kwikar-ref-${abdId}.png`;
        a.href = URL.createObjectURL(blob);
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      })
      .catch(() => { window.open(qrImgSrc, '_blank'); });
  }

  const tabStyle = (t) => ({
    flex:1, padding:'9px 0', border:'none', borderRadius:10, cursor:'pointer',
    fontFamily:'inherit', fontWeight:700, fontSize:13, transition:'all 0.18s',
    background: tab === t ? '#0f172a' : 'transparent',
    color:       tab === t ? '#fff'    : '#64748b',
  });

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', zIndex:500, backdropFilter:'blur(2px)' }}/>
      <div style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:501,
        background:'#fff', borderRadius:'20px 20px 0 0',
        padding:`24px 24px calc(28px + env(safe-area-inset-bottom,0px))`,
        maxWidth:520, margin:'0 auto',
        boxShadow:'0 -20px 60px rgba(15,23,42,0.18)',
        animation:'slideIn 0.22s ease'
      }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <div>
            <h3 style={{ fontSize:18, fontWeight:800, color:'#0f172a', margin:0 }}>Technician Invite Karo</h3>
            <p style={{ fontSize:12, color:'#64748b', margin:'4px 0 0' }}>Link ya QR share karo — woh aapke network mein automatically add ho jayega</p>
          </div>
          <button onClick={onClose} style={{ background:'#f1f5f9', border:'none', borderRadius:10, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b', flexShrink:0 }}>
            <Icon name="x" size={16}/>
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display:'flex', gap:4, background:'#f1f5f9', borderRadius:12, padding:4, marginBottom:18 }}>
          <button style={tabStyle('link')} onClick={() => setTab('link')}>
            Link Share
          </button>
          <button style={tabStyle('qr')} onClick={() => setTab('qr')}>
            QR Code
          </button>
        </div>

        {/* Info */}
        <div style={{ display:'flex', gap:10, padding:'12px 14px', borderRadius:12, background:'rgba(255,90,31,0.06)', border:'1px solid rgba(255,90,31,0.15)', marginBottom:20 }}>
          <Icon name="info" size={15} style={{ color:'#ff5a1f', flexShrink:0, marginTop:1 }}/>
          <div style={{ fontSize:12, color:'#92400e', lineHeight:1.55 }}>
            Technician is {tab === 'qr' ? 'QR ko scan' : 'link se'} register karega toh woh seedha aapke <strong>Direct Technicians</strong> list mein aayega aur aapko subscription commission milegi.
          </div>
        </div>

        {/* ── Link tab ── */}
        {tab === 'link' && <>
          <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Aapka Referral Link</div>
          <div style={{ display:'flex', gap:10, alignItems:'stretch', marginBottom:20 }}>
            <div style={{ flex:1, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, padding:'11px 14px', fontSize:11, color:'#475569', fontFamily:'monospace', wordBreak:'break-all', lineHeight:1.6 }}>
              {link}
            </div>
            <button onClick={copyLink} style={{
              flexShrink:0, padding:'0 18px', borderRadius:12, border:'none',
              cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:13,
              background: copied ? '#10b981' : '#0f172a', color:'#fff', transition:'background 0.2s'
            }}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>

          {/* WhatsApp button */}
          <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:12,
            width:'100%', padding:'15px', borderRadius:14, textDecoration:'none',
            background:'#25D366', color:'#fff', fontSize:15, fontWeight:800,
            boxShadow:'0 6px 20px rgba(37,211,102,0.35)', letterSpacing:'-0.01em'
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp pe Share Karo
          </a>
        </>}

        {/* ── QR tab ── */}
        {tab === 'qr' && <>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
            <div style={{
              padding:16, background:'#fff', borderRadius:16,
              border:'1px solid #e2e8f0', boxShadow:'0 4px 16px rgba(15,23,42,0.08)',
              display:'inline-flex', alignItems:'center', justifyContent:'center',
              width:272, height:272, position:'relative'
            }}>
              {!qrLoaded && (
                <div style={{ position:'absolute', fontSize:12, color:'#94a3b8' }}>Loading…</div>
              )}
              <img
                src={qrImgSrc}
                alt="Referral QR"
                onLoad={() => setQrLoaded(true)}
                style={{ width:240, height:240, borderRadius:8, display: qrLoaded ? 'block' : 'none' }}
              />
            </div>

            <div style={{ textAlign:'center' }}>
              <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:'0 0 4px' }}>
                Yeh QR Code scan karein
              </p>
              <p style={{ fontSize:11, color:'#64748b', margin:0, lineHeight:1.55 }}>
                Technician apne phone se scan kare — registration page seedha khulega
              </p>
            </div>

            <button onClick={downloadQR} disabled={!qrLoaded} style={{
              width:'100%', padding:'14px', borderRadius:14, border:'none',
              cursor: qrLoaded ? 'pointer' : 'not-allowed',
              fontFamily:'inherit', fontWeight:700, fontSize:14,
              background: qrLoaded ? '#0f172a' : '#e2e8f0',
              color: qrLoaded ? '#fff' : '#94a3b8',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              transition:'background 0.2s'
            }}>
              <Icon name="download" size={16}/>
              QR Download Karo (PNG)
            </button>
          </div>
        </>}

        <p style={{ fontSize:11, color:'#94a3b8', textAlign:'center', marginTop:14 }}>
          ABD ID: <strong style={{ color:'#ff5a1f' }}>{abdId || '—'}</strong>
        </p>
      </div>
    </>
  );
}

// ── Direct Technicians ──────────────────────────────────────────────────
function DirectTechniciansPage() {
  const { data, loading } = window.usePageData('technicians', 'type=direct');
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("earnings");
  const [sortDir, setSortDir] = useState("desc");
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = React.useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  function mapTech(t, i) {
    const words = (t.full_name || '').split(' ');
    const avatar = words.slice(0,2).map(w => (w[0] || '')).join('').toUpperCase();
    const joined = t.created_at
      ? new Date(t.created_at).toLocaleDateString('en-IN', { month:'short', year:'numeric' })
      : 'N/A';
    return {
      id:         'T' + String(t.id).padStart(3,'0'),
      avatar,
      name:       t.full_name || '',
      skill:      t.service_category || 'N/A',
      pincode:    (t.pincodes || '').split(',')[0]?.trim() || 'N/A',
      bookings:   +t.total_jobs || 0,
      earnings:   (+t.total_jobs || 0) * 500,
      commission: +t.commission_earned || 0,
      rating:     +t.rating || 0,
      status:     t.availability_status || 'offline',
      score:      Math.min(99, Math.round(((+t.rating || 0) / 5) * 60 + Math.min((+t.total_jobs || 0) / 5, 40))),
      joined,
      referrals:  +t.referral_count || 0,
    };
  }

  const techs = data?.technicians?.map(mapTech) || window.KD.directTechnicians;

  const filtered = techs
    .filter(t => {
      const q = search.toLowerCase();
      if (q && !t.name.toLowerCase().includes(q) && !t.skill.toLowerCase().includes(q) && !t.pincode.includes(q)) return false;
      if (filter !== "all" && t.status !== filter) return false;
      return true;
    })
    .sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      const d = typeof va === "string" ? va.localeCompare(vb) : vb - va;
      return sortDir === "asc" ? -d : d;
    });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const visible = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const cols = [
    { key:"name",       label:"Technician",   w:"20%" },
    { key:"skill",      label:"Skill",         w:"13%" },
    { key:"pincode",    label:"Pincode",       w:"8%" },
    { key:"bookings",   label:"Bookings",      w:"9%" },
    { key:"earnings",   label:"Earned",        w:"11%" },
    { key:"commission", label:"My Commission", w:"12%" },
    { key:"rating",     label:"Rating",        w:"8%" },
    { key:"status",     label:"Status",        w:"9%" },
    { key:"score",      label:"Score",         w:"10%" },
  ];

  if (loading) return <LoadingPage/>;

  return (
    <div style={{ padding:"28px 32px", animation:"fadeIn 0.25s ease" }}>
      {showModal && <AddTechModal onClose={() => setShowModal(false)}/>}

      <SectionHeader title="Direct Technicians" sub={`${techs.length} technicians you directly referred`}
        right={<>
          <Btn variant="secondary" icon="download" size="sm">Export</Btn>
          <Btn icon="plus" size="sm" onClick={() => setShowModal(true)}>Add Technician</Btn>
        </>}/>

      <div style={{ display:"flex", gap:12, marginBottom:20, alignItems:"center", flexWrap:"wrap" }}>
        <SearchBar placeholder="Search by name, skill, pincode…" value={search} onChange={v=>{setSearch(v);setPage(1);}} style={{ width:300 }}/>
        <div style={{ display:"flex", gap:6 }}>
          {["all","online","busy","offline"].map(s => (
            <button key={s} onClick={()=>{setFilter(s);setPage(1);}} style={{
              padding:"7px 14px", borderRadius:8, border:"1px solid #e2e8f0", fontFamily:"inherit",
              fontSize:12, fontWeight:600, cursor:"pointer",
              background: filter===s ? "#ff5a1f" : "#fff",
              color: filter===s ? "#fff" : "#64748b"
            }}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>
          ))}
        </div>
        <div style={{ marginLeft:"auto", fontSize:12, color:"#94a3b8" }}>{filtered.length} result{filtered.length!==1?"s":""}</div>
      </div>

      <Card padding={0}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:"1px solid #f1f5f9" }}>
                {cols.map(c => (
                  <th key={c.key} onClick={()=>toggleSort(c.key)} style={{
                    padding:"12px 16px", textAlign:"left", fontWeight:700, color:"#64748b",
                    fontSize:11, textTransform:"uppercase", letterSpacing:"0.05em",
                    cursor:"pointer", whiteSpace:"nowrap", width:c.w, userSelect:"none"
                  }}>
                    <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                      {c.label}
                      {sortKey===c.key && <Icon name={sortDir==="asc"?"arrowUp":"arrowDown"} size={10} style={{ color:"#ff5a1f" }}/>}
                    </span>
                  </th>
                ))}
                <th style={{ padding:"12px 16px", textAlign:"left", fontWeight:700, color:"#64748b", fontSize:11, textTransform:"uppercase", letterSpacing:"0.05em" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={cols.length + 1}><EmptyState icon="users" title="No direct technicians" sub="Technicians you refer directly will appear here"/></td></tr>
              ) : visible.map((t, i) => (
                <tr key={t.id} style={{ borderBottom:"1px solid #f8fafc", transition:"background 0.12s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#fafbfc"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <Avatar initials={t.avatar} size={34} colorIndex={i} online={t.status}/>
                      <div>
                        <div style={{ fontWeight:700, color:"#0f172a" }}>{t.name}</div>
                        <div style={{ fontSize:11, color:"#94a3b8" }}>{t.id} · Joined {t.joined}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"12px 16px" }}>
                    <span style={{ padding:"3px 10px", borderRadius:8, background:"#f1f5f9", fontSize:11, fontWeight:600, color:"#475569" }}>{t.skill}</span>
                  </td>
                  <td style={{ padding:"12px 16px", color:"#64748b", fontWeight:600 }}>{t.pincode}</td>
                  <td style={{ padding:"12px 16px", fontWeight:700, color:"#0f172a" }}>{t.bookings}</td>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ fontWeight:700, color:"#0f172a" }}>₹{t.earnings.toLocaleString("en-IN")}</div>
                  </td>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ fontWeight:800, color:"#ff5a1f" }}>₹{t.commission.toLocaleString("en-IN")}</div>
                    <div style={{ fontSize:10, color:"#94a3b8" }}>25% share</div>
                  </td>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:3, fontWeight:700, color:"#f59e0b" }}>
                      <Icon name="star" size={12} style={{ fill:"#f59e0b", color:"#f59e0b" }}/>{t.rating}
                    </div>
                  </td>
                  <td style={{ padding:"12px 16px" }}><StatusBadge status={t.status}/></td>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ flex:1, height:5, borderRadius:3, background:"#f1f5f9", minWidth:50 }}>
                        <div style={{ height:"100%", borderRadius:3, width:`${t.score}%`, background: t.score>=90?"#10b981":t.score>=75?"#f59e0b":"#ef4444" }}/>
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, color:"#64748b" }}>{t.score}</span>
                    </div>
                  </td>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", gap:4 }}>
                      <button title="View" style={{ width:28, height:28, borderRadius:7, border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748b" }}>
                        <Icon name="eye" size={13}/>
                      </button>
                      <button title="Call" style={{ width:28, height:28, borderRadius:7, border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#10b981" }}>
                        <Icon name="phone" size={13}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderTop:"1px solid #f1f5f9" }}>
            <span style={{ fontSize:12, color:"#94a3b8" }}>
              Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE,filtered.length)} of {filtered.length}
            </span>
            <div style={{ display:"flex", gap:4 }}>
              <button disabled={page===1} onClick={()=>setPage(p=>p-1)} style={{ padding:"5px 12px", borderRadius:7, border:"1px solid #e2e8f0", background:"#fff", cursor:page===1?"not-allowed":"pointer", fontSize:12, fontFamily:"inherit", opacity:page===1?0.5:1 }}>← Prev</button>
              {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
                <button key={p} onClick={()=>setPage(p)} style={{ width:32, height:30, borderRadius:7, border:"1px solid #e2e8f0", background:page===p?"#ff5a1f":"#fff", color:page===p?"#fff":"#64748b", cursor:"pointer", fontSize:12, fontFamily:"inherit", fontWeight:600 }}>{p}</button>
              ))}
              <button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)} style={{ padding:"5px 12px", borderRadius:7, border:"1px solid #e2e8f0", background:"#fff", cursor:page===totalPages?"not-allowed":"pointer", fontSize:12, fontFamily:"inherit", opacity:page===totalPages?0.5:1 }}>Next →</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Auto Joined ────────────────────────────────────────────────────────
function AutoJoinedPage() {
  const { data, loading } = window.usePageData('technicians', 'type=auto');

  function mapAuto(t) {
    const words = (t.full_name || '').split(' ');
    const avatar = words.slice(0,2).map(w => (w[0] || '')).join('').toUpperCase();
    const joined = t.created_at ? new Date(t.created_at).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' }) : 'N/A';
    return {
      id:         'AJ' + String(t.id).padStart(2,'0'),
      avatar,
      name:       t.full_name || '',
      skill:      t.service_category || 'N/A',
      pincode:    (t.pincodes || '').split(',')[0]?.trim() || 'N/A',
      source:     t.referral_level > 1 ? 'Referral' : 'App',
      kyc:        t.kyc_status || 'pending',
      joined,
      referredBy: t.referred_by_name || null,
    };
  }

  const [items, setItems] = useState(null);

  React.useEffect(() => {
    if (data?.technicians) {
      setItems(data.technicians.map(mapAuto));
    }
  }, [data]);

  const displayItems = items || window.KD.autoJoined;

  function approve(id) { setItems(p => p.map(t => t.id===id ? {...t, _status:"approved"} : t)); }
  function reject(id)  { setItems(p => p.map(t => t.id===id ? {...t, _status:"rejected"} : t)); }

  if (loading) return <LoadingPage/>;

  return (
    <div style={{ padding:"28px 32px", animation:"fadeIn 0.25s ease" }}>
      <SectionHeader title="Auto Joined Technicians" sub="Technicians who joined from Kwikar platform — review and approve"/>
      {displayItems.length === 0
        ? <EmptyState icon="userplus" title="No pending technicians" sub="Auto-joined technicians awaiting review will appear here"/>
        : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:16 }}>
            {displayItems.map(t => (
              <Card key={t.id} style={{ borderLeft:`4px solid ${t._status==="approved"?"#10b981":t._status==="rejected"?"#ef4444":"#f59e0b"}` }}>
                <div style={{ display:"flex", gap:12, marginBottom:14 }}>
                  <Avatar initials={t.avatar} size={44} colorIndex={Math.abs(t.id.charCodeAt(0) % 8)}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, color:"#0f172a", fontSize:14 }}>{t.name}</div>
                    <div style={{ fontSize:12, color:"#64748b" }}>{t.skill} · {t.pincode}</div>
                    <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>Joined: {t.joined} · Via: {t.source}</div>
                  </div>
                  {t._status ? <StatusBadge status={t._status}/> : <StatusBadge status="pending"/>}
                </div>
                {[
                  { label:"KYC Status",   value:t.kyc, isStatus:true },
                  { label:"Referred by",  value:t.referredBy || "Self-registered" },
                  { label:"Area",         value:t.pincode },
                ].map(r => (
                  <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid #f8fafc" }}>
                    <span style={{ fontSize:12, color:"#64748b" }}>{r.label}</span>
                    {r.isStatus ? <StatusBadge status={r.value}/> : <span style={{ fontSize:12, fontWeight:600, color:"#0f172a" }}>{r.value}</span>}
                  </div>
                ))}
                {!t._status && (
                  <div style={{ display:"flex", gap:8, marginTop:14 }}>
                    <Btn icon="approve" variant="success" size="sm" style={{ flex:1, justifyContent:"center" }} onClick={()=>approve(t.id)}>Approve</Btn>
                    <Btn icon="reject"  variant="danger"  size="sm" style={{ flex:1, justifyContent:"center" }} onClick={()=>reject(t.id)}>Reject</Btn>
                  </div>
                )}
                {t._status === "approved" && <div style={{ marginTop:12, padding:"8px 14px", borderRadius:8, background:"#d1fae5", fontSize:12, color:"#059669", fontWeight:600, textAlign:"center" }}>Approved — Technician activated</div>}
                {t._status === "rejected"  && <div style={{ marginTop:12, padding:"8px 14px", borderRadius:8, background:"#fee2e2", fontSize:12, color:"#dc2626", fontWeight:600, textAlign:"center" }}>Rejected</div>}
              </Card>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ── Referral Technicians ───────────────────────────────────────────────
function ReferralTechniciansPage() {
  const { data, loading } = window.usePageData('technicians', 'type=referral');

  function mapReferral(t) {
    const words = (t.full_name || '').split(' ');
    const avatar = words.slice(0,2).map(w => (w[0] || '')).join('').toUpperCase();
    return {
      id:            't' + t.id,
      avatar,
      name:          t.full_name || '',
      skill:         t.service_category || 'N/A',
      level:         +t.referral_level || 2,
      parent:        t.parent_tech_name || 'Direct Chain',
      earnings:      (+t.total_jobs || 0) * 500,
      abdCommission: +t.commission_earned || 0,
      status:        t.availability_status || 'offline',
      pincodes:      t.pincodes || '',
    };
  }

  const referrals = data?.technicians?.map(mapReferral) || (() => {
    const res = [];
    function flatten(node, depth, parent) {
      for (const child of node.children||[]) {
        if (child.level > 1) { res.push({...child, depth, parent: depth===1?"Direct Chain":parent}); flatten(child, depth+1, child.name); }
      }
    }
    flatten(window.KD.referralTree, 1, '');
    return res;
  })();

  if (loading) return <LoadingPage/>;

  return (
    <div style={{ padding:"28px 32px", animation:"fadeIn 0.25s ease" }}>
      <SectionHeader title="Referral Technicians" sub={`${referrals.length} indirect technicians across your network`}
        right={<Btn icon="tree" variant="secondary" size="sm">View Tree</Btn>}/>
      {referrals.length === 0
        ? <EmptyState icon="userreferral" title="No referral technicians yet" sub="Technicians referred by your direct techs will appear here"/>
        : (
          <Card padding={0}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:"1px solid #f1f5f9" }}>
                  {["Technician","Skill","Level","Referred By","Earned","Your Commission (10%)","Status"].map(h=>(
                    <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontWeight:700, color:"#64748b", fontSize:11, textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {referrals.map((t,i)=>{
                  const lc = t.level===2?"#3b82f6":"#8b5cf6";
                  return (
                    <tr key={t.id} style={{ borderBottom:"1px solid #f8fafc" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#fafbfc"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{ padding:"12px 16px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <Avatar initials={t.avatar} size={32} colorIndex={i+4}/>
                          <span style={{ fontWeight:700, color:"#0f172a" }}>{t.name}</span>
                        </div>
                      </td>
                      <td style={{ padding:"12px 16px" }}><span style={{ padding:"3px 10px", borderRadius:8, background:"#f1f5f9", fontSize:11, fontWeight:600, color:"#475569" }}>{t.skill}</span></td>
                      <td style={{ padding:"12px 16px" }}><span style={{ padding:"3px 10px", borderRadius:20, background:lc+"18", color:lc, fontSize:11, fontWeight:700 }}>L{t.level}</span></td>
                      <td style={{ padding:"12px 16px", color:"#64748b", fontSize:12 }}>{t.parent}</td>
                      <td style={{ padding:"12px 16px", fontWeight:700, color:"#0f172a" }}>₹{Number(t.earnings).toLocaleString("en-IN")}</td>
                      <td style={{ padding:"12px 16px", fontWeight:800, color:"#ff5a1f" }}>₹{Number(t.abdCommission).toLocaleString("en-IN")}</td>
                      <td style={{ padding:"12px 16px" }}><StatusBadge status={t.status}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )
      }
    </div>
  );
}

Object.assign(window, { DashboardPage, DirectTechniciansPage, AutoJoinedPage, ReferralTechniciansPage });

// kwikar-ops.jsx — Fraud, Notifications, Reports, Audit, Settings
const { useState, useEffect } = React;

function FraudPage() {
  return (
    <div className="page-wrap" style={{ paddingBottom:32 }}>
      <div className="page-header">
        <div><div className="page-title">Fraud Detection</div><div className="page-sub">Monitor suspicious activity</div></div>
      </div>
      <Empty icon="shield" title="Fraud detection coming soon" sub="This section will show flagged accounts, suspicious patterns and risk scores"/>
    </div>
  );
}

// ── Notifications ─────────────────────────────────────────────────────────────
function NotificationsPage() {
  const [target, setTarget]  = useState('all');
  const [ntype, setNtype]    = useState('announcement');
  const [title, setTitle]    = useState('');
  const [body, setBody]      = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult]  = useState(null);

  async function handleSend() {
    if (!title || !body) { setResult({ok:false,msg:'Title and message required'}); return; }
    setSending(true); setResult(null);
    try {
      const res = await window.adminApi('notifications', { target, type: ntype, title, message: body });
      if (res.status==='success') {
        setResult({ok:true, msg:`Sent to ${res.sent_to} users successfully!`});
        setTitle(''); setBody('');
      } else {
        setResult({ok:false, msg:res.message||'Failed to send'});
      }
    } catch(e) {
      setResult({ok:false, msg:'Network error'});
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="page-wrap" style={{ paddingBottom:32 }}>
      <div className="page-header"><div className="page-title">Notifications</div></div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16 }}>
        <div className="kcard" style={{ padding:'24px' }}>
          <div style={{ fontFamily:'Space Grotesk',fontSize:15,fontWeight:600,marginBottom:4 }}>Compose Notification</div>
          <div style={{ fontSize:12,color:'var(--text2)',marginBottom:20 }}>Broadcast to selected audience</div>

          {result && (
            <div style={{ padding:'10px 14px',borderRadius:8,background:result.ok?'var(--green-d)':'var(--red-d)',border:`1px solid ${result.ok?'rgba(52,211,153,.3)':'rgba(248,113,113,.3)'}`,color:result.ok?'var(--green)':'var(--red)',fontSize:13,marginBottom:16,display:'flex',alignItems:'center',gap:8 }}>
              <Ico n={result.ok?'check':'x'} s={14} c="currentColor"/>
              {result.msg}
            </div>
          )}

          <div style={{ marginBottom:14 }}>
            <div className="section-label">Audience</div>
            <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
              {['all','technicians','abds','customers'].map(t=>(
                <button key={t} className="kbtn" onClick={()=>setTarget(t)} style={{ fontSize:12,background:target===t?'var(--cyan-d)':'var(--card)',color:target===t?'var(--cyan)':'var(--text2)',borderColor:target===t?'rgba(34,211,238,.3)':'var(--border)' }}>
                  {t.charAt(0).toUpperCase()+t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <div className="section-label">Type</div>
            <div style={{ display:'flex',gap:8 }}>
              {['announcement','alert','promotion','system'].map(t=>(
                <button key={t} className="kbtn" onClick={()=>setNtype(t)} style={{ fontSize:12,background:ntype===t?'var(--purple-d)':'var(--card)',color:ntype===t?'var(--purple)':'var(--text2)',borderColor:ntype===t?'rgba(167,139,250,.3)':'var(--border)' }}>
                  {t.charAt(0).toUpperCase()+t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <div className="section-label">Title</div>
            <input className="kinput" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Notification title"/>
          </div>
          <div style={{ marginBottom:20 }}>
            <div className="section-label">Message</div>
            <textarea className="kinput" value={body} onChange={e=>setBody(e.target.value)} placeholder="Write your message here" rows={5} style={{ resize:'vertical',lineHeight:1.6 }}></textarea>
          </div>

          <button className="kbtn p" onClick={handleSend} disabled={sending} style={{ padding:'9px 20px' }}>
            {sending ? <Spinner size={14} color="var(--cyan)"/> : <Ico n="send" s={13}/>}
            {sending ? 'Sending…' : 'Send Notification'}
          </button>
        </div>

        <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
          <div className="kcard" style={{ padding:'18px' }}>
            <div style={{ fontFamily:'Space Grotesk',fontSize:14,fontWeight:600,marginBottom:14 }}>Audience Reach</div>
            {[{l:'All Users',c:'var(--cyan)'},{l:'Technicians',c:'var(--green)'},{l:'ABDs',c:'var(--purple)'},{l:'Customers',c:'var(--amber)'}].map(m=>(
              <div key={m.l} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid var(--border-s)' }}>
                <div style={{ width:8,height:8,borderRadius:'50%',background:m.c,flexShrink:0 }}/>
                <span style={{ flex:1,fontSize:13,color:'var(--text2)' }}>{m.l}</span>
                <span style={{ fontFamily:'Space Grotesk',fontWeight:600,color:m.c }}>—</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reports ───────────────────────────────────────────────────────────────────
function ReportsPage() {
  const reports = [
    {id:'R01',name:'Booking Performance Report',desc:'Booking trends, cancellations, completion rates',type:'Operations',ready:false},
    {id:'R02',name:'Technician Activity Report',desc:'Individual technician performance, ratings, earnings',type:'Performance',ready:false},
    {id:'R03',name:'ABD Growth Report',desc:'ABD recruitment, network expansion, revenue contribution',type:'Growth',ready:false},
    {id:'R04',name:'Revenue Analytics Report',desc:'Platform-wide revenue breakdown, subscription metrics',type:'Finance',ready:false},
  ];
  const typeColors = {Operations:'var(--cyan)',Performance:'var(--green)',Growth:'var(--purple)',Finance:'var(--amber)'};
  return (
    <div className="page-wrap" style={{ paddingBottom:32 }}>
      <div className="page-header"><div className="page-title">Reports & Analytics</div></div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14 }}>
        {reports.map(r=>(
          <div key={r.id} className="kcard kcard-h" style={{ padding:'20px' }}>
            <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10 }}>
              <div>
                <span className="kbadge" style={{ background:typeColors[r.type]+'1A',color:typeColors[r.type],marginBottom:8,display:'inline-flex' }}>{r.type}</span>
                <div style={{ fontFamily:'Space Grotesk',fontSize:14,fontWeight:600,color:'var(--text)' }}>{r.name}</div>
              </div>
              <Badge type="pending" label="Coming Soon"/>
            </div>
            <div style={{ fontSize:12.5,color:'var(--text2)',lineHeight:1.5 }}>{r.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Audit Logs ────────────────────────────────────────────────────────────────
function AuditPage() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.adminApi('audit_logs')
      .then(res => { if (res.status==='success') setLogs(res.logs||[]); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, []);

  const typeColor = {suspension:'var(--red)',payout:'var(--green)',edit:'var(--amber)',transfer:'var(--purple)',approval:'var(--cyan)',boost:'var(--pink)',login:'var(--text2)',logout:'var(--text2)'};
  const typeIcon  = {suspension:'lock',payout:'dollar',edit:'edit',transfer:'mapPin',approval:'check',boost:'star',login:'user',logout:'user'};

  function colorFor(action='') {
    const a = action.toLowerCase();
    if (a.includes('login')) return 'var(--cyan)';
    if (a.includes('suspend')) return 'var(--red)';
    if (a.includes('approve') || a.includes('kyc') || a.includes('activate')) return 'var(--green)';
    if (a.includes('commission') || a.includes('edit')) return 'var(--amber)';
    if (a.includes('payout')) return 'var(--green)';
    if (a.includes('notification')) return 'var(--purple)';
    return 'var(--text2)';
  }

  return (
    <div className="page-wrap" style={{ paddingBottom:32 }}>
      <div className="page-header">
        <div><div className="page-title">Audit Logs</div><div className="page-sub">All admin actions tracked</div></div>
        <button className="kbtn p" onClick={()=>{ setLoading(true); window.adminApi('audit_logs').then(res=>{if(res.status==='success')setLogs(res.logs||[]);}).finally(()=>setLoading(false)); }}><Ico n="refresh" s={13}/>Refresh</button>
      </div>
      <div className="kcard">
        {loading ? <div style={{ padding:40,textAlign:'center' }}><Spinner/></div> :
          logs.length===0 ? <Empty icon="list" title="No audit logs yet" sub="Admin actions will be recorded here"/> :
          <div style={{ padding:'0 16px' }}>
            {logs.map((log,i)=>(
              <div key={log.id} style={{ display:'flex',gap:14,padding:'16px 0',borderBottom:i<logs.length-1?'1px solid var(--border-s)':'none',alignItems:'flex-start' }}>
                <div style={{ display:'flex',flexDirection:'column',alignItems:'center',paddingTop:4 }}>
                  <div style={{ width:34,height:34,borderRadius:'50%',background:colorFor(log.action)+'18',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <Ico n="list" s={14} c={colorFor(log.action)}/>
                  </div>
                  {i<logs.length-1 && <div style={{ width:1,height:32,background:'var(--border-s)',marginTop:4 }}/>}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:4 }}>
                    <span style={{ fontFamily:'Space Grotesk',fontSize:13,fontWeight:600,color:'var(--text)' }}>{log.action}</span>
                    <span style={{ fontSize:11,color:'var(--text3)',marginLeft:'auto' }}>{log.created_at ? new Date(log.created_at).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : ''}</span>
                  </div>
                  {log.entity && <div style={{ fontSize:12.5,color:'var(--text2)',marginBottom:4 }}>{log.entity}</div>}
                  <div style={{ display:'flex',gap:14,fontSize:11,color:'var(--text3)' }}>
                    {log.admin_name && <span>{log.admin_name}</span>}
                    {log.ip && <span>{log.ip}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────
function ToggleSwitch({ defaultOn }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div onClick={()=>setOn(v=>!v)} style={{ width:42,height:24,borderRadius:12,background:on?'var(--cyan)':'rgba(255,255,255,.12)',cursor:'pointer',position:'relative',transition:'background .2s',flexShrink:0 }}>
      <div style={{ width:18,height:18,borderRadius:'50%',background:'white',position:'absolute',top:3,left:on?21:3,transition:'left .2s',boxShadow:'0 1px 4px rgba(0,0,0,.4)' }}/>
    </div>
  );
}

function SettingsPage() {
  const [saved, setSaved] = useState(false);
  function save() { setSaved(true); setTimeout(()=>setSaved(false),2500); }
  const sections = [
    { title:'Commission and Fees', items:[
      {l:'ABD Commission Rate (%)',desc:'Percentage paid to ABD',val:'12.5',type:'input'},
      {l:'Platform Service Fee (%)',desc:'Fee on each completed booking',val:'8.0',type:'input'},
      {l:'Auto-approve Payouts',desc:'Auto-approve payouts below ₹10,000',val:true,type:'toggle'},
    ]},
    { title:'Platform Settings', items:[
      {l:'Platform Name',desc:'Public-facing platform name',val:'Kwikar',type:'input'},
      {l:'Support Email',desc:'Customer support contact',val:'support@kwikar.com',type:'input'},
      {l:'New Registrations',desc:'Allow new technicians and ABDs to register',val:true,type:'toggle'},
    ]},
  ];
  return (
    <div className="page-wrap" style={{ paddingBottom:32 }}>
      <div className="page-header">
        <div className="page-title">Platform Settings</div>
        <div style={{ display:'flex',gap:8,alignItems:'center' }}>
          {saved && <span style={{ fontSize:13,color:'var(--green)',display:'flex',alignItems:'center',gap:4 }}><Ico n="check" s={13} c="var(--green)"/>Saved!</span>}
          <button className="kbtn p" onClick={save}><Ico n="check" s={13}/>Save Changes</button>
        </div>
      </div>
      <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
        {sections.map(sec=>(
          <div key={sec.title} className="kcard" style={{ padding:'20px' }}>
            <div style={{ fontFamily:'Space Grotesk',fontSize:14,fontWeight:600,marginBottom:16,paddingBottom:12,borderBottom:'1px solid var(--border-s)' }}>{sec.title}</div>
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              {sec.items.map(item=>(
                <div key={item.l} style={{ display:'flex',alignItems:'center',gap:16 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,fontWeight:500,color:'var(--text)',marginBottom:2 }}>{item.l}</div>
                    <div style={{ fontSize:12,color:'var(--text3)' }}>{item.desc}</div>
                  </div>
                  {item.type==='input' && <input className="kinput" defaultValue={item.val} style={{ width:200,textAlign:'right' }}/>}
                  {item.type==='toggle' && <ToggleSwitch defaultOn={item.val}/>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { FraudPage, NotificationsPage, ReportsPage, AuditPage, SettingsPage });

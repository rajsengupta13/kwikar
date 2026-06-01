// kwikar-abd.jsx — ABD Management with real API data
const { useState, useEffect, useRef } = React;

function ABDRevenueChart({ abds }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !abds.length) return;
    const ctx = ref.current.getContext('2d');
    const chart = new Chart(ctx, {
      type:'bar',
      data:{ labels:abds.map(a=>(a.name||'').split(' ')[0]), datasets:[{ label:'Revenue', data:abds.map(a=>(a.total_earned||a.revenue||0)/100000), backgroundColor:['rgba(34,211,238,.7)','rgba(167,139,250,.7)','rgba(52,211,153,.7)','rgba(251,191,36,.7)','rgba(244,114,182,.7)','rgba(248,113,113,.7)'], borderRadius:5, borderSkipped:false }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'rgba(13,14,22,.95)', borderColor:'rgba(255,255,255,.1)', borderWidth:1, callbacks:{ label:ctx=>`₹${ctx.parsed.y.toFixed(1)}L` } } }, scales:{ x:{grid:{display:false},ticks:{color:'#6B7280',font:{size:11}}}, y:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#6B7280',font:{size:11},callback:v=>`₹${v}L`}} } }
    });
    return () => chart.destroy();
  }, [abds]);
  return <canvas ref={ref} style={{ width:'100%', height:'100%' }}/>;
}

function ABDDrawer({ abd, open, onClose, onAction }) {
  const [commission, setCommission] = useState('');
  const [editingComm, setEditingComm] = useState(false);
  if (!abd) return null;

  async function doAction(action) {
    try {
      await window.adminApi('abd_action', { action, abd_id: abd.abd_id || abd.id });
      onAction(action, abd);
      onClose();
    } catch(e) {}
  }

  async function saveCommission() {
    const pct = parseFloat(commission);
    if (!pct || pct < 0 || pct > 100) return;
    try {
      await window.adminApi('abd_action', { action:'update_commission', abd_id: abd.abd_id || abd.id, percent: pct });
      onAction('update_commission', { ...abd, direct_commission_percent: pct });
      setEditingComm(false);
      onClose();
    } catch(e) {}
  }

  return (
    <Drawer open={open} onClose={onClose} title="ABD Profile" width={440}>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ background:'rgba(255,255,255,.04)', borderRadius:12, padding:'18px', display:'flex', gap:14, alignItems:'flex-start' }}>
          <Avatar name={abd.name||'?'} size={52}/>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'Space Grotesk', fontSize:16, fontWeight:600 }}>{abd.name}</div>
            <div style={{ fontSize:12.5, color:'var(--text2)', marginTop:2 }}>{abd.phone} · {abd.email}</div>
            <div style={{ display:'flex', gap:6, marginTop:8 }}>
              <Badge type={abd.status||abd.user_status} label={abd.status||abd.user_status}/>
            </div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[
            { l:'Total Earned', v:fCur(abd.total_earned||0), c:'var(--green)' },
            { l:'Technicians', v:abd.tech_count||0, c:'var(--cyan)' },
            { l:'Pincodes', v:abd.pincode_count||0, c:'var(--purple)' },
            { l:'Wallet Balance', v:fCur(abd.wallet_balance||0), c:'var(--amber)' },
          ].map(m=>(
            <div key={m.l} className="kcard" style={{ padding:'14px' }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>{m.l}</div>
              <div style={{ fontFamily:'Space Grotesk', fontSize:17, fontWeight:600, color:m.c }}>{m.v}</div>
            </div>
          ))}
        </div>

        {/* Commission editor */}
        <div className="kcard" style={{ padding:'14px' }}>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>Direct Commission Rate</div>
          {editingComm ? (
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <input className="kinput" type="number" value={commission} onChange={e=>setCommission(e.target.value)} placeholder="e.g. 12.5" style={{ width:100 }} min="0" max="100" step="0.5"/>
              <button className="kbtn p" style={{ padding:'5px 12px' }} onClick={saveCommission}><Ico n="check" s={12}/>Save</button>
              <button className="kbtn" style={{ padding:'5px 8px' }} onClick={()=>setEditingComm(false)}><Ico n="x" s={12}/></button>
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontFamily:'Space Grotesk', fontSize:20, fontWeight:700, color:'var(--amber)' }}>{abd.direct_commission_percent||12.5}%</span>
              <button className="kbtn pu" style={{ padding:'4px 10px', fontSize:12 }} onClick={()=>{ setCommission(abd.direct_commission_percent||12.5); setEditingComm(true); }}><Ico n="edit" s={11}/>Edit</button>
            </div>
          )}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {abd.status==='active'||abd.user_status==='active'
            ? <button className="kbtn d" style={{ justifyContent:'center', gridColumn:'span 2' }} onClick={()=>doAction('suspend')}><Ico n="lock" s={12}/>Suspend ABD</button>
            : <button className="kbtn p" style={{ justifyContent:'center', gridColumn:'span 2' }} onClick={()=>doAction('activate')}><Ico n="check" s={12}/>Activate ABD</button>
          }
        </div>
      </div>
    </Drawer>
  );
}

function AddABDModal({ open, onClose, onCreated }) {
  const [form, setForm]   = useState({ name:'', phone:'', email:'', pin:'' });
  const [err, setErr]     = useState('');
  const [saving, setSaving] = useState(false);

  function set(k, v) { setForm(p => ({...p, [k]:v})); setErr(''); }

  async function submit(e) {
    e.preventDefault();
    if (!form.name || !form.phone || !form.pin) { setErr('Name, phone and PIN are required'); return; }
    setSaving(true); setErr('');
    try {
      const res = await window.adminApi('create_abd', form);
      if (res.status === 'success') { onCreated(); onClose(); setForm({ name:'', phone:'', email:'', pin:'' }); }
      else setErr(res.message || 'Failed to create ABD');
    } catch(e) { setErr('Server error'); }
    setSaving(false);
  }

  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'#0D0E16', border:'1px solid rgba(255,255,255,0.12)', borderRadius:16, width:440, padding:28, boxShadow:'0 24px 80px rgba(0,0,0,.8)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
          <div style={{ fontFamily:'Space Grotesk', fontSize:16, fontWeight:700, color:'var(--text)' }}>Add New ABD</div>
          <button className="kbtn" style={{ padding:'4px 8px' }} onClick={onClose}><Ico n="x" s={13}/></button>
        </div>
        <form onSubmit={submit} autoComplete="off" style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[{k:'name',l:'Full Name',t:'text',ph:'e.g. Rahul Sharma',ac:'off'},{k:'phone',l:'Phone Number',t:'tel',ph:'10-digit mobile number',ac:'off'},{k:'email',l:'Email (optional)',t:'text',ph:'rahul@example.com',ac:'off'},{k:'pin',l:'Login PIN (4-6 digits)',t:'password',ph:'Set a secure PIN',ac:'new-password'}].map(f=>(
            <div key={f.k}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 }}>{f.l}</div>
              <input className="kinput" type={f.t} placeholder={f.ph} value={form[f.k]} autoComplete={f.ac} onChange={e=>set(f.k,e.target.value)} style={{ width:'100%', height:40, background:'rgba(255,255,255,0.06)', color:'var(--text)' }}/>
            </div>
          ))}
          {err && <div style={{ fontSize:12, color:'var(--red)', padding:'8px 12px', background:'rgba(248,113,113,.1)', borderRadius:8, border:'1px solid rgba(248,113,113,.3)' }}>{err}</div>}
          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <button type="button" className="kbtn" style={{ flex:1, justifyContent:'center' }} onClick={onClose}>Cancel</button>
            <button type="submit" className="kbtn p" style={{ flex:1, justifyContent:'center' }} disabled={saving}>{saving ? 'Creating…' : 'Create ABD'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ABDPage() {
  const [abds, setAbds]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addOpen, setAddOpen]     = useState(false);
  const [view, setView]           = useState('table');

  function load() {
    setLoading(true);
    window.adminApi('abds')
      .then(res => { if (res.status==='success') setAbds(res.abds||[]); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }
  useEffect(load, []);

  function handleAction(action, abd) {
    setAbds(prev => prev.map(a => {
      if ((a.abd_id||a.id) !== (abd.abd_id||abd.id)) return a;
      if (action==='suspend')           return {...a, status:'blocked', user_status:'blocked'};
      if (action==='activate')          return {...a, status:'active',  user_status:'active'};
      if (action==='update_commission') return {...a, direct_commission_percent: abd.direct_commission_percent};
      return a;
    }));
  }

  const totals = {
    abds:    abds.length,
    techs:   abds.reduce((s,a)=>s+(a.tech_count||0),0),
    revenue: abds.reduce((s,a)=>s+(parseFloat(a.total_earned)||0),0),
    pincodes:abds.reduce((s,a)=>s+(a.pincode_count||0),0),
  };

  return (
    <div className="page-wrap" style={{ paddingBottom:32 }}>
      <div className="page-header">
        <div>
          <div className="page-title">ABD Management</div>
          <div className="page-sub">Area Business Directors · {totals.abds} total</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {['table','leaderboard'].map(v=>(
            <button key={v} className="kbtn" onClick={()=>setView(v)} style={{ background:view===v?'var(--cyan-d)':'var(--card)', color:view===v?'var(--cyan)':'var(--text2)', borderColor:view===v?'rgba(34,211,238,.3)':'var(--border)' }}>
              <Ico n={v==='table'?'list':'award'} s={13}/>{v.charAt(0).toUpperCase()+v.slice(1)}
            </button>
          ))}
          <button className="kbtn p" onClick={()=>setAddOpen(true)}><Ico n="plus" s={13}/>Add ABD</button>
          <button className="kbtn" onClick={load}><Ico n="refresh" s={13}/>Refresh</button>
        </div>
      </div>

      <AddABDModal open={addOpen} onClose={()=>setAddOpen(false)} onCreated={load}/>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[{l:'Total ABDs',v:totals.abds,c:'var(--cyan)',i:'briefcase'},{l:'Total Technicians',v:totals.techs,c:'var(--green)',i:'users'},{l:'Total Revenue',v:fCur(totals.revenue),c:'var(--amber)',i:'dollar'},{l:'Pincodes Covered',v:totals.pincodes,c:'var(--purple)',i:'mapPin'}].map(m=>(
          <div key={m.l} className="kcard" style={{ padding:'16px', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36,height:36,borderRadius:9,background:`${m.c}1A`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><Ico n={m.i} s={16} c={m.c}/></div>
            <div><div style={{ fontFamily:'Space Grotesk',fontSize:19,fontWeight:700,color:m.c }}>{m.v}</div><div style={{ fontSize:11,color:'var(--text3)' }}>{m.l}</div></div>
          </div>
        ))}
      </div>

      {loading ? <div style={{ padding:60, textAlign:'center' }}><Spinner size={28}/></div> : (
        view==='table' ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:14 }}>
            <div className="kcard">
              {abds.length===0 ? <Empty icon="briefcase" title="No ABDs registered yet"/> :
                <table className="ktable">
                  <thead><tr><th>ABD</th><th>Phone</th><th>Techs</th><th>Pincodes</th><th>Earned</th><th>Commission</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {abds.map(abd=>(
                      <tr key={abd.abd_id||abd.id} onClick={()=>{ setSelected(abd); setDrawerOpen(true); }}>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <Avatar name={abd.name||'?'} size={30}/>
                            <div><div style={{ fontSize:13,fontWeight:500,color:'var(--text)' }}>{abd.name}</div><div style={{ fontSize:11,color:'var(--text3)' }}>{abd.email}</div></div>
                          </div>
                        </td>
                        <td>{abd.phone}</td>
                        <td><span style={{ fontFamily:'Space Grotesk',fontWeight:600,color:'var(--text)' }}>{abd.tech_count||0}</span></td>
                        <td><span style={{ color:'var(--purple)',fontWeight:500 }}>{abd.pincode_count||0}</span></td>
                        <td><span style={{ color:'var(--green)',fontWeight:600,fontFamily:'Space Grotesk' }}>{fCur(abd.total_earned||0)}</span></td>
                        <td><span style={{ color:'var(--amber)' }}>{abd.direct_commission_percent||12.5}%</span></td>
                        <td><Badge type={abd.status||abd.user_status} label={abd.status||abd.user_status}/></td>
                        <td onClick={e=>e.stopPropagation()}>
                          <button className="kbtn" style={{ padding:'4px 8px' }} onClick={()=>{ setSelected(abd); setDrawerOpen(true); }}><Ico n="eye" s={12}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            </div>
            <div className="kcard" style={{ padding:'20px' }}>
              <div style={{ fontFamily:'Space Grotesk',fontSize:14,fontWeight:600,marginBottom:4 }}>Revenue by ABD</div>
              <div style={{ fontSize:12,color:'var(--text2)',marginBottom:16 }}>Total earned</div>
              {abds.length>0 ? <div style={{ height:240 }}><ABDRevenueChart abds={abds}/></div> : <Empty icon="dollar" title="No data yet"/>}
            </div>
          </div>
        ) : (
          <div className="kcard" style={{ padding:'20px' }}>
            <div style={{ fontFamily:'Space Grotesk',fontSize:14,fontWeight:600,marginBottom:16,display:'flex',alignItems:'center',gap:8 }}>
              <Ico n="award" s={16} c="var(--amber)"/>ABD Leaderboard
            </div>
            {abds.length===0 ? <Empty icon="award" title="No ABDs yet"/> :
              <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                {[...abds].sort((a,b)=>(b.total_earned||0)-(a.total_earned||0)).map((abd,i)=>(
                  <div key={abd.abd_id||abd.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:i===0?'rgba(34,211,238,.05)':i===1?'rgba(167,139,250,.04)':i===2?'rgba(251,191,36,.04)':'rgba(255,255,255,.02)',borderRadius:9,border:`1px solid ${i===0?'rgba(34,211,238,.15)':i===1?'rgba(167,139,250,.12)':i===2?'rgba(251,191,36,.12)':'var(--border-s)'}` }}>
                    <div style={{ width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Space Grotesk',fontWeight:700,fontSize:13,background:i<3?['var(--cyan-d)','var(--purple-d)','var(--amber-d)'][i]:'rgba(255,255,255,.06)',color:i<3?['var(--cyan)','var(--purple)','var(--amber)'][i]:'var(--text3)',flexShrink:0 }}>{i+1}</div>
                    <Avatar name={abd.name||'?'} size={32}/>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:13,fontWeight:500,color:'var(--text)' }}>{abd.name}</div>
                      <div style={{ fontSize:11,color:'var(--text3)' }}>{abd.tech_count||0} technicians</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:'Space Grotesk',fontSize:14,fontWeight:600,color:'var(--green)' }}>{fCur(abd.total_earned||0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
        )
      )}

      <ABDDrawer abd={selected} open={drawerOpen} onClose={()=>setDrawerOpen(false)} onAction={handleAction}/>
    </div>
  );
}

Object.assign(window, { ABDPage });

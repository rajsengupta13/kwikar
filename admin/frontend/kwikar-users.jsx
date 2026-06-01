// kwikar-users.jsx — Customers + Technicians with real API data
const { useState, useEffect, useMemo } = React;

// ── Customers ─────────────────────────────────────────────────────────────────
function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [q, setQ]                 = useState('');
  const [statusF, setStatusF]     = useState('all');
  const [selected, setSelected]   = useState(null);

  function load() {
    setLoading(true);
    window.adminApi('customers')
      .then(res => { if (res.status === 'success') setCustomers(res.customers || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function blockCustomer(userId, currentStatus) {
    const action = currentStatus === 'blocked' ? 'unblock' : 'block';
    try {
      const st = action === 'block' ? 'blocked' : 'active';
      await window.adminApi('customer_action', { action, user_id: userId });
      setCustomers(prev => prev.map(c => c.id == userId ? {...c, status: st} : c));
      if (selected?.id == userId) setSelected(s => ({...s, status: st}));
    } catch(e) {}
  }

  const filtered = useMemo(() => customers.filter(c => {
    const mq = !q || c.name?.toLowerCase().includes(q.toLowerCase()) || c.email?.toLowerCase().includes(q.toLowerCase()) || c.phone?.includes(q);
    const ms = statusF === 'all' || c.status === statusF;
    return mq && ms;
  }), [customers, q, statusF]);

  const total   = customers.length;
  const active  = customers.filter(c=>c.status==='active').length;
  const blocked = customers.filter(c=>c.status==='blocked').length;
  const pending = customers.filter(c=>c.status==='pending').length;

  return (
    <div className="page-wrap" style={{ paddingBottom:32 }}>
      <div className="page-header">
        <div>
          <div className="page-title">Customers</div>
          <div className="page-sub">{total} registered customers · {active} active</div>
        </div>
        <button className="kbtn p" onClick={load}><Ico n="refresh" s={13}/>Refresh</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[{l:'Total Customers',v:total,c:'var(--cyan)',i:'users'},{l:'Active',v:active,c:'var(--green)',i:'check'},{l:'Blocked',v:blocked,c:'var(--red)',i:'lock'},{l:'Pending',v:pending,c:'var(--amber)',i:'clock'}].map(m=>(
          <div key={m.l} className="kcard" style={{ padding:'16px', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36,height:36,borderRadius:9,background:`${m.c}1A`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><Ico n={m.i} s={16} c={m.c}/></div>
            <div><div style={{ fontFamily:'Space Grotesk',fontSize:20,fontWeight:700,color:m.c }}>{m.v}</div><div style={{ fontSize:11.5,color:'var(--text3)' }}>{m.l}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:14, alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, maxWidth:300 }}>
          <div style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)' }}><Ico n="search" s={13} c="var(--text3)"/></div>
          <input className="kinput" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search name, email, phone…" style={{ paddingLeft:32, height:36 }}/>
        </div>
        {['all','active','pending','blocked'].map(s=>(
          <button key={s} className="kbtn" onClick={()=>setStatusF(s)} style={{ padding:'5px 12px',fontSize:12,background:statusF===s?'var(--cyan-d)':'var(--card)',color:statusF===s?'var(--cyan)':'var(--text3)',borderColor:statusF===s?'rgba(34,211,238,.3)':'var(--border)' }}>
            {s.charAt(0).toUpperCase()+s.slice(1)}
          </button>
        ))}
        <div style={{ marginLeft:'auto',fontSize:12,color:'var(--text3)' }}>{filtered.length} results</div>
      </div>

      <div className="kcard">
        {loading ? <div style={{ padding:40,textAlign:'center' }}><Spinner/></div> :
          filtered.length === 0 ? <Empty icon="users" title="No customers found"/> :
          <table className="ktable">
            <thead><tr><th>Customer</th><th>Phone</th><th>Bookings</th><th>Spent</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(c=>(
                <tr key={c.id} onClick={()=>setSelected(c)}>
                  <td>
                    <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                      <Avatar name={c.name||'?'} size={30}/>
                      <div><div style={{ fontSize:13,fontWeight:500,color:'var(--text)' }}>{c.name}</div><div style={{ fontSize:11,color:'var(--text3)' }}>{c.email}</div></div>
                    </div>
                  </td>
                  <td>{c.phone}</td>
                  <td><span style={{ fontFamily:'Space Grotesk',fontWeight:600,color:'var(--text)' }}>{c.actual_bookings||0}</span></td>
                  <td><span style={{ color:'var(--green)',fontWeight:500 }}>{fCur(c.total_spent||0)}</span></td>
                  <td><Badge type={c.status} label={c.status}/></td>
                  <td style={{ fontSize:12,color:'var(--text3)' }}>{c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : ''}</td>
                  <td onClick={e=>e.stopPropagation()}>
                    <div style={{ display:'flex',gap:5 }}>
                      <button className="kbtn" style={{ padding:'4px 8px' }} onClick={()=>setSelected(c)}><Ico n="eye" s={12}/></button>
                      <button className={`kbtn${c.status==='blocked'?' p':' d'}`} style={{ padding:'4px 8px' }} onClick={()=>blockCustomer(c.id, c.status)}>
                        <Ico n={c.status==='blocked'?'check':'lock'} s={12}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </div>

      <Modal open={!!selected} onClose={()=>setSelected(null)} title="Customer Profile" width={480}>
        {selected && (
          <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
            <div style={{ display:'flex',alignItems:'center',gap:14,padding:'16px',background:'rgba(255,255,255,.03)',borderRadius:10 }}>
              <Avatar name={selected.name||'?'} size={52}/>
              <div><div style={{ fontFamily:'Space Grotesk',fontSize:16,fontWeight:600 }}>{selected.name}</div><div style={{ fontSize:12,color:'var(--text2)',marginTop:2 }}>{selected.email}</div><div style={{ fontSize:12,color:'var(--text3)',marginTop:1 }}>{selected.phone}</div></div>
              <Badge type={selected.status} label={selected.status}/>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              {[{l:'Bookings',v:selected.actual_bookings||0},{l:'Total Spent',v:fCur(selected.total_spent||0)},{l:'Status',v:selected.status},{l:'Joined',v:selected.created_at?new Date(selected.created_at).toLocaleDateString('en-IN'):'-'}].map(m=>(
                <div key={m.l} style={{ padding:'12px',background:'rgba(255,255,255,.03)',borderRadius:8 }}><div style={{ fontSize:11,color:'var(--text3)',marginBottom:4 }}>{m.l}</div><div style={{ fontSize:13,fontWeight:500,color:'var(--text)' }}>{m.v}</div></div>
              ))}
            </div>
            <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
              {selected.status !== 'blocked'
                ? <button className="kbtn d" onClick={()=>{ blockCustomer(selected.id,'active'); setSelected(null); }}><Ico n="lock" s={12}/>Block Account</button>
                : <button className="kbtn p" onClick={()=>{ blockCustomer(selected.id,'blocked'); setSelected(null); }}><Ico n="check" s={12}/>Unblock Account</button>
              }
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── Add Technician Modal ──────────────────────────────────────────────────────
function AddTechModal({ open, onClose, onCreated }) {
  const [form, setForm]       = useState({ name:'', phone:'', email:'', pin:'', abd_id:'' });
  const [services, setServices] = useState([]);
  const [abds, setAbds]       = useState([]);
  const [selSvcs, setSelSvcs] = useState([]);
  const [err, setErr]         = useState('');
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!open) return;
    window.adminApi('services_list').then(res => {
      if (res.status === 'success') { setServices(res.services || []); setAbds(res.abds || []); }
    }).catch(()=>{});
  }, [open]);

  function set(k, v) { setForm(p => ({...p, [k]:v})); setErr(''); }
  function toggleSvc(id) { setSelSvcs(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]); }

  async function submit(e) {
    e.preventDefault();
    if (!form.name || !form.phone || !form.pin) { setErr('Name, phone and PIN are required'); return; }
    setSaving(true); setErr('');
    try {
      const res = await window.adminApi('create_technician', { ...form, service_ids: selSvcs });
      if (res.status === 'success') {
        onCreated();
        onClose();
        setForm({ name:'', phone:'', email:'', pin:'', abd_id:'' });
        setSelSvcs([]);
      } else setErr(res.message || 'Failed to create technician');
    } catch(e) { setErr('Server error'); }
    setSaving(false);
  }

  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'#0D0E16', border:'1px solid rgba(255,255,255,0.12)', borderRadius:16, width:460, padding:28, maxHeight:'88vh', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,.8)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
          <div style={{ fontFamily:'Space Grotesk', fontSize:16, fontWeight:700, color:'var(--text)' }}>Add New Technician</div>
          <button className="kbtn" style={{ padding:'4px 8px' }} onClick={onClose}><Ico n="x" s={13}/></button>
        </div>
        <form onSubmit={submit} autoComplete="off" style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[{k:'name',l:'Full Name',t:'text',ph:'e.g. Mohan Verma',ac:'off'},{k:'phone',l:'Phone Number',t:'tel',ph:'10-digit mobile number',ac:'off'},{k:'email',l:'Email (optional)',t:'text',ph:'mohan@example.com',ac:'off'},{k:'pin',l:'Login PIN (4-6 digits)',t:'password',ph:'Set a secure PIN',ac:'new-password'}].map(f=>(
            <div key={f.k}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 }}>{f.l}</div>
              <input className="kinput" type={f.t} placeholder={f.ph} value={form[f.k]} autoComplete={f.ac} onChange={e=>set(f.k,e.target.value)} style={{ width:'100%', height:40, background:'rgba(255,255,255,0.06)', color:'var(--text)' }}/>
            </div>
          ))}

          <div>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 }}>Assign to ABD (optional)</div>
            <select className="kinput" title="Assign to ABD" value={form.abd_id} onChange={e=>set('abd_id',e.target.value)} style={{ width:'100%', height:40, background:'rgba(255,255,255,0.06)', color:'var(--text)' }}>
              <option value="" style={{ background:'#0D0E16' }}>— No ABD assigned —</option>
              {abds.map(a=><option key={a.abd_id} value={a.abd_id} style={{ background:'#0D0E16' }}>{a.name}</option>)}
            </select>
          </div>

          {services.length > 0 && (
            <div>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 }}>Services</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {services.map(s=>(
                  <button type="button" key={s.id} onClick={()=>toggleSvc(s.id)}
                    className="kbtn"
                    style={{ padding:'5px 12px', fontSize:12, background:selSvcs.includes(s.id)?'rgba(34,211,238,.15)':'rgba(255,255,255,0.06)', color:selSvcs.includes(s.id)?'var(--cyan)':'var(--text2)', borderColor:selSvcs.includes(s.id)?'rgba(34,211,238,.4)':'rgba(255,255,255,0.1)' }}>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {err && <div style={{ fontSize:12, color:'var(--red)', padding:'8px 12px', background:'rgba(248,113,113,.1)', borderRadius:8, border:'1px solid rgba(248,113,113,.3)' }}>{err}</div>}
          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <button type="button" className="kbtn" style={{ flex:1, justifyContent:'center' }} onClick={onClose}>Cancel</button>
            <button type="submit" className="kbtn p" style={{ flex:1, justifyContent:'center' }} disabled={saving}>{saving ? 'Creating…' : 'Create Technician'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Technicians ───────────────────────────────────────────────────────────────
function TechDrawer({ tech, open, onClose, onAction }) {
  if (!tech) return null;
  async function doAction(action) {
    try {
      await window.adminApi('technician_action', { action, tech_id: tech.technician_id || tech.id });
      onAction(action, tech);
      onClose();
    } catch(e) {}
  }
  return (
    <Drawer open={open} onClose={onClose} title="Technician Profile" width={440}>
      <div style={{ background:'rgba(255,255,255,.04)',borderRadius:12,padding:'20px',marginBottom:16,display:'flex',gap:14,alignItems:'flex-start' }}>
        <Avatar name={tech.name||'?'} size={56} online={tech.availability_status==='online'}/>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'Space Grotesk',fontSize:16,fontWeight:600 }}>{tech.name}</div>
          <div style={{ fontSize:12.5,color:'var(--text2)',marginTop:3 }}>{tech.services||'—'}</div>
          <div style={{ display:'flex',gap:6,marginTop:8,flexWrap:'wrap' }}>
            <Badge type={tech.status} label={tech.status}/>
            <Badge type={tech.kyc_status} label={`KYC: ${tech.kyc_status}`}/>
          </div>
        </div>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16 }}>
        {[{l:'Rating',v:(tech.rating||0)+' ★',c:'var(--amber)'},{l:'Total Jobs',v:tech.total_jobs||0,c:'var(--cyan)'},{l:'Wallet',v:fCur(tech.wallet_balance||0),c:'var(--green)'},{l:'KYC',v:tech.kyc_status,c:'var(--purple)'}].map(m=>(
          <div key={m.l} className="kcard" style={{ padding:'14px' }}>
            <div style={{ fontSize:11,color:'var(--text3)',marginBottom:4 }}>{m.l}</div>
            <div style={{ fontFamily:'Space Grotesk',fontSize:17,fontWeight:600,color:m.c }}>{m.v}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
        {tech.kyc_status==='pending' && <button className="kbtn p" style={{ justifyContent:'center' }} onClick={()=>doAction('approve_kyc')}><Ico n="check" s={12}/>Approve KYC</button>}
        {tech.status==='active'
          ? <button className="kbtn d" style={{ justifyContent:'center' }} onClick={()=>doAction('suspend')}><Ico n="lock" s={12}/>Suspend</button>
          : <button className="kbtn p" style={{ justifyContent:'center' }} onClick={()=>doAction('activate')}><Ico n="check" s={12}/>Activate</button>
        }
      </div>
    </Drawer>
  );
}

function TechniciansPage() {
  const [techs, setTechs]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [q, setQ]               = useState('');
  const [statusF, setStatusF]   = useState('all');
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addOpen, setAddOpen]   = useState(false);

  function load() {
    setLoading(true);
    window.adminApi('technicians')
      .then(res => { if (res.status==='success') setTechs(res.technicians||[]); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }
  useEffect(load, []);

  function handleAction(action, tech) {
    setTechs(prev => prev.map(t => {
      if (t.technician_id !== tech.technician_id && t.id !== tech.id) return t;
      if (action==='suspend')     return {...t, status:'blocked'};
      if (action==='activate')    return {...t, status:'active'};
      if (action==='approve_kyc') return {...t, kyc_status:'verified'};
      return t;
    }));
  }

  const filtered = useMemo(() => techs.filter(t => {
    const mq = !q || t.name?.toLowerCase().includes(q.toLowerCase()) || t.services?.toLowerCase().includes(q.toLowerCase()) || t.pincodes?.includes(q);
    const ms = statusF==='all' || t.status===statusF;
    return mq && ms;
  }), [techs, q, statusF]);

  const counts = { total:techs.length, active:techs.filter(t=>t.status==='active').length, pending:techs.filter(t=>t.kyc_status==='pending').length, suspended:techs.filter(t=>t.status==='blocked').length };

  return (
    <div className="page-wrap" style={{ paddingBottom:32 }}>
      <div className="page-header">
        <div><div className="page-title">Technicians</div><div className="page-sub">{counts.total} total · {counts.active} active</div></div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="kbtn p" onClick={()=>setAddOpen(true)}><Ico n="plus" s={13}/>Add Technician</button>
          <button className="kbtn" onClick={load}><Ico n="refresh" s={13}/>Refresh</button>
        </div>
      </div>

      <AddTechModal open={addOpen} onClose={()=>setAddOpen(false)} onCreated={load}/>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20 }}>
        {[{l:'Total',v:counts.total,c:'var(--cyan)',i:'wrench'},{l:'Active',v:counts.active,c:'var(--green)',i:'activity'},{l:'Pending KYC',v:counts.pending,c:'var(--amber)',i:'clock'},{l:'Suspended',v:counts.suspended,c:'var(--red)',i:'lock'}].map(m=>(
          <div key={m.l} className="kcard" style={{ padding:'14px',display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:32,height:32,borderRadius:8,background:`${m.c}1A`,display:'flex',alignItems:'center',justifyContent:'center' }}><Ico n={m.i} s={14} c={m.c}/></div>
            <div><div style={{ fontFamily:'Space Grotesk',fontSize:18,fontWeight:700,color:m.c }}>{m.v}</div><div style={{ fontSize:11,color:'var(--text3)' }}>{m.l}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex',gap:10,marginBottom:14,alignItems:'center',flexWrap:'wrap' }}>
        <div style={{ position:'relative',width:260 }}>
          <div style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)' }}><Ico n="search" s={13} c="var(--text3)"/></div>
          <input className="kinput" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search name, service, pincode…" style={{ paddingLeft:32,height:36 }}/>
        </div>
        <div style={{ display:'flex',gap:6 }}>
          {['all','active','pending','inactive','blocked'].map(s=>(
            <button key={s} className="kbtn" onClick={()=>setStatusF(s)} style={{ padding:'5px 10px',fontSize:11.5,background:statusF===s?'var(--cyan-d)':'var(--card)',color:statusF===s?'var(--cyan)':'var(--text3)',borderColor:statusF===s?'rgba(34,211,238,.3)':'var(--border)' }}>
              {s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
        <span style={{ marginLeft:'auto',fontSize:12,color:'var(--text3)' }}>{filtered.length} results</span>
      </div>

      <div className="kcard">
        {loading ? <div style={{ padding:40,textAlign:'center' }}><Spinner/></div> :
          filtered.length===0 ? <Empty icon="wrench" title="No technicians found"/> :
          <table className="ktable">
            <thead><tr><th>Technician</th><th>Services</th><th>KYC</th><th>Status</th><th>Rating</th><th>Jobs</th><th>Wallet</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(t=>(
                <tr key={t.technician_id||t.id} onClick={()=>{ setSelected(t); setDrawerOpen(true); }}>
                  <td>
                    <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                      <Avatar name={t.name||'?'} size={30} online={t.availability_status==='online'}/>
                      <div><div style={{ fontSize:13,fontWeight:500,color:'var(--text)' }}>{t.name}</div><div style={{ fontSize:11,color:'var(--text3)' }}>{t.phone}</div></div>
                    </div>
                  </td>
                  <td><span style={{ fontSize:12,padding:'2px 8px',background:'rgba(255,255,255,.06)',borderRadius:5,color:'var(--text2)',maxWidth:120,display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{t.services||'—'}</span></td>
                  <td><Badge type={t.kyc_status} label={t.kyc_status}/></td>
                  <td><Badge type={t.status} label={t.status}/></td>
                  <td><span style={{ color:'var(--amber)' }}>{t.rating>0?t.rating+' ★':'—'}</span></td>
                  <td><span style={{ fontFamily:'Space Grotesk',fontWeight:600,color:'var(--text)' }}>{t.total_jobs||0}</span></td>
                  <td><span style={{ color:'var(--green)',fontWeight:500 }}>{fCur(t.wallet_balance||0)}</span></td>
                  <td onClick={e=>e.stopPropagation()}>
                    <div style={{ display:'flex',gap:5 }}>
                      <button className="kbtn" style={{ padding:'4px 8px' }} onClick={()=>{ setSelected(t); setDrawerOpen(true); }}><Ico n="eye" s={12}/></button>
                      {t.kyc_status==='pending' && <button className="kbtn p" style={{ padding:'4px 8px' }} onClick={async()=>{ await window.adminApi('technician_action',{action:'approve_kyc',tech_id:t.technician_id||t.id}); handleAction('approve_kyc',t); }}><Ico n="check" s={12}/></button>}
                      {t.status==='active'
                        ? <button className="kbtn d" style={{ padding:'4px 8px' }} onClick={async()=>{ await window.adminApi('technician_action',{action:'suspend',tech_id:t.technician_id||t.id}); handleAction('suspend',t); }}><Ico n="lock" s={12}/></button>
                        : <button className="kbtn p" style={{ padding:'4px 8px' }} onClick={async()=>{ await window.adminApi('technician_action',{action:'activate',tech_id:t.technician_id||t.id}); handleAction('activate',t); }}><Ico n="check" s={12}/></button>
                      }
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </div>

      <TechDrawer tech={selected} open={drawerOpen} onClose={()=>setDrawerOpen(false)} onAction={handleAction}/>
    </div>
  );
}

Object.assign(window, { CustomersPage, TechniciansPage });

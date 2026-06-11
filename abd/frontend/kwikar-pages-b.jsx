// kwikar-pages-b.jsx — Bookings, Earnings, Notifications, Complaints, Profile
const { useState } = React;

// ── Bookings ───────────────────────────────────────────────────────────
function BookingsPage() {
  const { data, loading } = window.usePageData('bookings');
  const [tab, setTab] = useState("all");
  const [view, setView] = useState("table");

  function mapBooking(b) {
    return {
      id:       b.booking_code || ('BK' + b.id),
      customer: b.customer_name || 'Unknown',
      appliance:b.service || 'Service',
      tech:     b.tech_name || 'Unassigned',
      status:   b.status || 'pending',
      amount:   +b.final_amount || 0,
      date:     b.preferred_date || b.created_at || '',
      pincode:  b.pincode || '',
      phone:    b.customer_phone || '',
    };
  }

  const bookingsList = data?.bookings?.map(mapBooking) || window.KD.bookingsList;

  // Compute stats from real data
  const bookingStats = React.useMemo(() => {
    const list = bookingsList;
    return {
      total:     list.length,
      pending:   list.filter(b => ['pending','new','broadcasted'].includes(b.status)).length,
      active:    list.filter(b => ['accepted','assigned','arrived','ongoing','on-route','in-progress'].includes(b.status)).length,
      completed: list.filter(b => b.status === 'completed').length,
      cancelled: list.filter(b => b.status === 'cancelled').length,
    };
  }, [bookingsList]);

  const statusMap = { "all":null,"pending":"pending","assigned":"assigned","on-route":"on-route","in-progress":"in-progress","completed":"completed","cancelled":"cancelled" };
  const filtered = tab === "all" ? bookingsList : bookingsList.filter(b => b.status === statusMap[tab]);
  const tabs = ["all","pending","assigned","on-route","in-progress","completed","cancelled"];
  const tabCount = (s) => s === "all" ? bookingsList.length : bookingsList.filter(b => b.status === s).length;
  const statusColor = { pending:"#f59e0b", assigned:"#3b82f6", "on-route":"#8b5cf6", "in-progress":"#06b6d4", completed:"#10b981", cancelled:"#ef4444" };

  if (loading) return <LoadingPage/>;

  return (
    <div style={{ padding:"28px 32px", animation:"fadeIn 0.25s ease" }}>
      <SectionHeader title="Booking Management" sub="All service requests across your technician network"
        right={<>
          <button onClick={()=>setView(v=>v==="table"?"kanban":"table")} style={{
            display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:9,
            border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", fontSize:12,
            fontWeight:600, color:"#64748b", fontFamily:"inherit"
          }}>
            <Icon name={view==="table"?"grid":"list"} size={14}/>
            {view==="table"?"Kanban":"Table"}
          </button>
          <Btn icon="download" variant="secondary" size="sm">Export</Btn>
        </>}/>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"Total",       val:bookingStats.total,     color:"#0f172a" },
          { label:"Pending",     val:bookingStats.pending,   color:"#f59e0b" },
          { label:"Active",      val:bookingStats.active,    color:"#3b82f6" },
          { label:"Completed",   val:bookingStats.completed, color:"#10b981" },
          { label:"Cancelled",   val:bookingStats.cancelled, color:"#ef4444" },
        ].map(s=>(
          <div key={s.label} style={{ background:"#fff", borderRadius:12, padding:"14px 18px",
            boxShadow:"0 2px 8px rgba(0,0,0,0.05)", border:"1px solid #e8edf2", borderTop:`3px solid ${s.color}` }}>
            <div style={{ fontSize:10, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{s.label}</div>
            <div style={{ fontSize:24, fontWeight:800, color:s.color, marginTop:4 }}>{s.val.toLocaleString("en-IN")}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:4, marginBottom:20, overflowX:"auto", paddingBottom:4 }}>
        {tabs.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            padding:"7px 14px", borderRadius:8, border:"1px solid #e2e8f0", fontFamily:"inherit",
            fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap",
            background: tab===t ? (statusColor[t]||"#ff5a1f") : "#fff",
            color: tab===t ? "#fff" : "#64748b"
          }}>
            {t.charAt(0).toUpperCase()+t.slice(1).replace("-"," ")} ({tabCount(t)})
          </button>
        ))}
      </div>

      {view==="table" ? (
        <Card padding={0}>
          {filtered.length === 0
            ? <EmptyState icon="bookings" title="No bookings found" sub="Bookings from your technician network will appear here"/>
            : (
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid #f1f5f9" }}>
                    {["Booking ID","Customer","Appliance","Technician","Date/Time","Status","Amount","Action"].map(h=>(
                      <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontWeight:700, color:"#64748b", fontSize:11, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b=>(
                    <tr key={b.id} style={{ borderBottom:"1px solid #f8fafc" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#fafbfc"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{ padding:"12px 16px", fontWeight:700, color:"#ff5a1f", fontSize:12 }}>{b.id}</td>
                      <td style={{ padding:"12px 16px", fontWeight:600, color:"#0f172a" }}>{b.customer}</td>
                      <td style={{ padding:"12px 16px" }}><span style={{ padding:"3px 10px", borderRadius:8, background:"#f1f5f9", fontSize:11, fontWeight:600, color:"#475569" }}>{b.appliance}</span></td>
                      <td style={{ padding:"12px 16px", color:"#64748b", fontSize:12 }}>{b.tech}</td>
                      <td style={{ padding:"12px 16px", color:"#64748b", fontSize:12 }}>{b.date}</td>
                      <td style={{ padding:"12px 16px" }}><StatusBadge status={b.status}/></td>
                      <td style={{ padding:"12px 16px", fontWeight:800, color:"#0f172a" }}>₹{Number(b.amount).toLocaleString("en-IN")}</td>
                      <td style={{ padding:"12px 16px" }}>
                        <button style={{ padding:"5px 12px", borderRadius:7, border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", fontSize:11, fontWeight:600, color:"#64748b", fontFamily:"inherit" }}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </Card>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          {["pending","in-progress","completed"].map(col=>(
            <div key={col}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:statusColor[col]||"#94a3b8" }}/>
                <span style={{ fontSize:12, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.05em" }}>{col.replace("-"," ")}</span>
                <span style={{ fontSize:11, padding:"1px 7px", borderRadius:20, background:"#f1f5f9", color:"#94a3b8", fontWeight:600 }}>
                  {bookingsList.filter(b=>b.status===col).length}
                </span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {bookingsList.filter(b=>b.status===col).map(b=>(
                  <div key={b.id} style={{
                    background:"#fff", borderRadius:12, padding:"14px 16px",
                    boxShadow:"0 2px 8px rgba(0,0,0,0.06)", border:"1px solid #e8edf2",
                    borderLeft:`4px solid ${statusColor[col]||"#94a3b8"}`
                  }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:"#ff5a1f" }}>{b.id}</span>
                      <StatusBadge status={b.status}/>
                    </div>
                    <div style={{ fontWeight:700, color:"#0f172a", marginBottom:4 }}>{b.customer}</div>
                    <div style={{ fontSize:12, color:"#64748b", marginBottom:6 }}>{b.appliance}</div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:11, color:"#94a3b8" }}>{b.tech}</span>
                      <span style={{ fontSize:13, fontWeight:800, color:"#0f172a" }}>₹{b.amount}</span>
                    </div>
                    <div style={{ fontSize:10, color:"#94a3b8", marginTop:4 }}>{b.date} · {b.pincode}</div>
                  </div>
                ))}
                {bookingsList.filter(b=>b.status===col).length === 0 && (
                  <div style={{ padding:"24px", textAlign:"center", color:"#94a3b8", fontSize:12, background:"#fff", borderRadius:12, border:"1px dashed #e8edf2" }}>No {col} bookings</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Earnings ───────────────────────────────────────────────────────────
function EarningsPage() {
  const { data, loading } = window.usePageData('earnings');

  const stats = React.useMemo(() => {
    if (!data?.stats) return window.KD.earnings;
    const s = data.stats;
    return {
      total:             s.total            ?? window.KD.earnings.total,
      today:             s.today            ?? window.KD.earnings.today,
      thisMonth:         s.this_month       ?? window.KD.earnings.thisMonth,
      wallet:            s.wallet_balance   ?? window.KD.earnings.wallet,
      directReferral:    s.direct_referral  ?? window.KD.earnings.directReferral,
      indirectReferral:  s.indirect_referral ?? window.KD.earnings.indirectReferral,
      pending:           s.pending          ?? window.KD.earnings.pending,
      totalWithdrawals:  s.total_withdrawals ?? window.KD.earnings.totalWithdrawals,
    };
  }, [data]);

  const revenueData = (data?.revenue_chart?.length && data.revenue_chart.some(v => v > 0))
    ? data.revenue_chart
    : window.KD.revenueData;

  function mapTxn(t, i) {
    const isDebit = t.commission_type === 'withdrawal';
    return {
      id:     'TXN' + String(t.id || i).padStart(3, '0'),
      type:   isDebit ? 'debit' : 'credit',
      desc:   t.tech_name
        ? `Commission from ${t.tech_name} · ${t.commission_type === 'direct_abd' ? 'Direct' : 'Indirect'}`
        : (t.note || t.commission_type || 'Commission'),
      amount: +t.amount || 0,
      date:   t.created_at || '',
      status: 'success',
    };
  }

  const transactions = data?.transactions?.map(mapTxn) || window.KD.transactions;

  if (loading) return <LoadingPage/>;

  return (
    <div style={{ padding:"28px 32px", animation:"fadeIn 0.25s ease" }}>
      <SectionHeader title="Earnings & Wallet" sub="Your complete financial overview"/>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:24 }}>
        <div style={{
          borderRadius:20, padding:"24px 26px", position:"relative", overflow:"hidden",
          background:"linear-gradient(135deg,#ff5a1f 0%,#ff3c00 100%)",
          boxShadow:"0 20px 50px rgba(255,90,31,0.35)"
        }}>
          <div style={{ position:"absolute", top:-30, right:-30, width:140, height:140, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }}/>
          <div style={{ position:"absolute", bottom:-50, right:20, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }}/>
          <div style={{ position:"relative" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
              <div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em" }}>Wallet Balance</div>
                <div style={{ fontSize:34, fontWeight:900, color:"#fff", letterSpacing:"-0.02em", marginTop:4 }}>₹{Number(stats.wallet).toLocaleString("en-IN")}</div>
              </div>
              <div style={{ width:44, height:44, borderRadius:12, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Icon name="wallet" size={22} style={{ color:"#fff" }}/>
              </div>
            </div>
            <div style={{ display:"flex", gap:12 }}>
              <button style={{ flex:1, padding:"9px", borderRadius:10, background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.3)", color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Withdraw</button>
              <button style={{ flex:1, padding:"9px", borderRadius:10, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>History</button>
            </div>
            <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid rgba(255,255,255,0.15)", display:"flex", justifyContent:"space-between" }}>
              <div><div style={{ fontSize:10, color:"rgba(255,255,255,0.6)" }}>Pending</div><div style={{ fontSize:14, fontWeight:800, color:"#fff" }}>₹{Number(stats.pending).toLocaleString("en-IN")}</div></div>
              <div style={{ textAlign:"right" }}><div style={{ fontSize:10, color:"rgba(255,255,255,0.6)" }}>Total Withdrawn</div><div style={{ fontSize:14, fontWeight:800, color:"#fff" }}>₹{Number(stats.totalWithdrawals).toLocaleString("en-IN")}</div></div>
            </div>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {[
            { label:"Total Lifetime",    val:stats.total,      color:"#ff5a1f", icon:"earnings" },
            { label:"This Month",        val:stats.thisMonth,  color:"#10b981", icon:"trending" },
            { label:"Today",             val:stats.today,      color:"#3b82f6", icon:"flash" },
          ].map(r=>(
            <div key={r.label} style={{ background:"#fff", borderRadius:14, padding:"16px 18px",
              boxShadow:"0 2px 8px rgba(0,0,0,0.05)", border:"1px solid #e8edf2", display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:r.color+"18", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Icon name={r.icon} size={18} style={{ color:r.color }}/>
              </div>
              <div>
                <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{r.label}</div>
                <div style={{ fontSize:20, fontWeight:800, color:r.color }}>₹{Number(r.val).toLocaleString("en-IN")}</div>
              </div>
            </div>
          ))}
        </div>

        <Card>
          <div style={{ fontSize:13, fontWeight:800, color:"#0f172a", marginBottom:16 }}>Earnings Mix</div>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <DonutChart size={110} strokeWidth={16} segments={[
              { pct: stats.total > 0 ? Math.round((stats.directReferral / stats.total) * 100) : 65, color:"#ff5a1f" },
              { pct: stats.total > 0 ? Math.round((stats.indirectReferral / stats.total) * 100) : 35, color:"#3b82f6" },
            ]}/>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { label:"Direct (25%)",   val:stats.directReferral,   color:"#ff5a1f", pct: stats.total > 0 ? Math.round((stats.directReferral/stats.total)*100)+"%" : "65%" },
                { label:"Indirect (10%)", val:stats.indirectReferral, color:"#3b82f6", pct: stats.total > 0 ? Math.round((stats.indirectReferral/stats.total)*100)+"%" : "35%" },
              ].map(r=>(
                <div key={r.label}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                    <div style={{ width:8, height:8, borderRadius:2, background:r.color }}/>
                    <span style={{ fontSize:11, color:"#64748b" }}>{r.label}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:r.color, marginLeft:"auto" }}>{r.pct}</span>
                  </div>
                  <div style={{ fontSize:14, fontWeight:800, color:"#0f172a" }}>₹{(Number(r.val)/1000).toFixed(1)}K</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card style={{ marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div>
            <h3 style={{ fontSize:15, fontWeight:800, color:"#0f172a", margin:0 }}>Daily Revenue</h3>
            <p style={{ fontSize:12, color:"#64748b", margin:"3px 0 0" }}>Last 30 days earnings</p>
          </div>
          <div style={{ padding:"6px 14px", borderRadius:8, background:"#d1fae5", color:"#059669", fontSize:12, fontWeight:700 }}>
            Live data
          </div>
        </div>
        <AreaChart data={revenueData} color="#ff5a1f" width={900} height={180}/>
      </Card>

      <Card padding={0}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid #f1f5f9" }}>
          <h3 style={{ fontSize:14, fontWeight:800, color:"#0f172a", margin:0 }}>Transaction History</h3>
        </div>
        {transactions.length === 0
          ? <EmptyState icon="earnings" title="No transactions yet" sub="Commission credits will appear here"/>
          : transactions.map((t,i)=>(
            <div key={t.id} style={{
              display:"flex", alignItems:"center", gap:14, padding:"13px 20px",
              borderBottom: i<transactions.length-1?"1px solid #f8fafc":"none"
            }}>
              <div style={{
                width:38, height:38, borderRadius:12, flexShrink:0,
                background: t.type==="credit"?"#d1fae5":t.type==="debit"?"#fee2e2":"#fef3c7",
                display:"flex", alignItems:"center", justifyContent:"center"
              }}>
                <Icon name={t.type==="credit"?"arrowDown":t.type==="debit"?"arrowUp":"clock"} size={16}
                  style={{ color:t.type==="credit"?"#059669":t.type==="debit"?"#dc2626":"#d97706" }}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{t.desc}</div>
                <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{t.date} · {t.id}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:14, fontWeight:800, color:t.type==="credit"?"#059669":t.type==="debit"?"#dc2626":"#d97706" }}>
                  {t.type==="credit"?"+ ":"− "}₹{Number(t.amount).toLocaleString("en-IN")}
                </div>
                <StatusBadge status={t.status}/>
              </div>
            </div>
          ))
        }
      </Card>
    </div>
  );
}

// ── Notifications ──────────────────────────────────────────────────────
function NotificationsPage() {
  const { data, loading } = window.usePageData('notifications');
  const [items, setItems] = useState(null);

  React.useEffect(() => {
    if (data?.notifications) {
      setItems(data.notifications.map(n => ({
        id:    n.id,
        type:  n.type || 'system',
        title: n.title || '',
        body:  n.message || n.body || '',
        time:  n.created_at || '',
        read:  !!n.is_read,
      })));
    }
  }, [data]);

  const displayItems = items || window.KD.notifications;

  function markAll() {
    setItems(p => (p || window.KD.notifications).map(n => ({...n, read:true})));
    window.abdApi('notifications', { action:'mark_all_read' }).catch(() => {});
  }

  function markRead(id) {
    setItems(p => (p || []).map(x => x.id===id ? {...x, read:true} : x));
    window.abdApi('notifications', { action:'mark_read', id }).catch(() => {});
  }

  const typeIcon  = { earning:"earnings", referral:"userreferral", booking:"bookings", complaint:"complaint", payment:"wallet", system:"info" };
  const typeColor = { earning:"#10b981", referral:"#ff5a1f", booking:"#3b82f6", complaint:"#ef4444", payment:"#8b5cf6", system:"#94a3b8" };

  if (loading) return <LoadingPage/>;

  return (
    <div style={{ padding:"28px 32px", animation:"fadeIn 0.25s ease" }}>
      <SectionHeader title="Notification Center" sub={`${displayItems.filter(n=>!n.read).length} unread notifications`}
        right={<Btn variant="secondary" size="sm" onClick={markAll}>Mark all read</Btn>}/>
      {displayItems.length === 0
        ? <EmptyState icon="bell" title="No notifications" sub="You're all caught up!"/>
        : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {displayItems.map(n=>(
              <div key={n.id} onClick={()=>markRead(n.id)}
                style={{
                  display:"flex", gap:14, padding:"16px 20px", borderRadius:14, cursor:"pointer",
                  background: n.read?"#fff":"#fffbf9",
                  border: n.read?"1px solid #e8edf2":`1px solid ${typeColor[n.type]||"#e8edf2"}30`,
                  boxShadow: n.read?"0 1px 4px rgba(0,0,0,0.04)":"0 3px 12px rgba(255,90,31,0.08)",
                  transition:"all 0.15s"
                }}>
                <div style={{
                  width:42, height:42, borderRadius:12, flexShrink:0,
                  background:(typeColor[n.type]||"#94a3b8")+"15",
                  display:"flex", alignItems:"center", justifyContent:"center"
                }}>
                  <Icon name={typeIcon[n.type]||"bell"} size={18} style={{ color:typeColor[n.type]||"#94a3b8" }}/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#0f172a" }}>{n.title}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:11, color:"#94a3b8" }}>{n.time}</span>
                      {!n.read && <div style={{ width:8, height:8, borderRadius:"50%", background:"#ff5a1f", flexShrink:0 }}/>}
                    </div>
                  </div>
                  <div style={{ fontSize:13, color:"#64748b", marginTop:3 }}>{n.body}</div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ── Complaints ─────────────────────────────────────────────────────────
function ComplaintsPage() {
  const { data, loading } = window.usePageData('complaints');

  function mapComplaint(c, i) {
    return {
      id:       c.id ? ('CP' + String(c.id).padStart(3,'0')) : ('CP' + String(i+1).padStart(3,'0')),
      customer: c.customer_name || 'Unknown',
      tech:     c.tech_name || 'Unknown',
      type:     c.subject || 'Support',
      status:   c.status || 'open',
      date:     c.created_at || '',
      priority: c.priority || 'medium',
      booking:  c.booking_code || '',
    };
  }

  const complaints = data?.complaints?.map(mapComplaint) || window.KD.complaints;

  const countByStatus = (s) => complaints.filter(c => c.status === s).length;

  if (loading) return <LoadingPage/>;

  return (
    <div style={{ padding:"28px 32px", animation:"fadeIn 0.25s ease" }}>
      <SectionHeader title="Complaints & Support" sub="Track and resolve customer and technician issues"
        right={<Btn icon="plus" size="sm">New Ticket</Btn>}/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"Open",      val:countByStatus("open"),       color:"#ef4444" },
          { label:"In Review", val:countByStatus("in-review"),  color:"#f59e0b" },
          { label:"Escalated", val:countByStatus("escalated"),  color:"#8b5cf6" },
          { label:"Resolved",  val:countByStatus("resolved"),   color:"#10b981" },
        ].map(s=>(
          <div key={s.label} style={{ background:"#fff", borderRadius:12, padding:"14px 18px",
            boxShadow:"0 2px 8px rgba(0,0,0,0.05)", border:"1px solid #e8edf2", borderTop:`3px solid ${s.color}` }}>
            <div style={{ fontSize:10, color:"#94a3b8", fontWeight:600, textTransform:"uppercase" }}>{s.label}</div>
            <div style={{ fontSize:24, fontWeight:800, color:s.color, marginTop:4 }}>{s.val}</div>
          </div>
        ))}
      </div>
      {complaints.length === 0
        ? <EmptyState icon="complaint" title="No complaints" sub="Complaints from your technician network will appear here"/>
        : (
          <Card padding={0}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:"1px solid #f1f5f9" }}>
                  {["Ticket ID","Customer","Technician","Issue","Priority","Status","Date","Action"].map(h=>(
                    <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontWeight:700, color:"#64748b", fontSize:11, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {complaints.map(c=>(
                  <tr key={c.id} style={{ borderBottom:"1px solid #f8fafc" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#fafbfc"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{ padding:"12px 16px", fontWeight:700, color:"#ff5a1f" }}>{c.id}</td>
                    <td style={{ padding:"12px 16px", fontWeight:600, color:"#0f172a" }}>{c.customer}</td>
                    <td style={{ padding:"12px 16px", color:"#64748b" }}>{c.tech}</td>
                    <td style={{ padding:"12px 16px" }}><span style={{ padding:"3px 10px", borderRadius:8, background:"#f1f5f9", fontSize:11, fontWeight:600, color:"#475569" }}>{c.type}</span></td>
                    <td style={{ padding:"12px 16px" }}><StatusBadge status={c.priority}/></td>
                    <td style={{ padding:"12px 16px" }}><StatusBadge status={c.status}/></td>
                    <td style={{ padding:"12px 16px", color:"#94a3b8", fontSize:12 }}>{c.date}</td>
                    <td style={{ padding:"12px 16px" }}>
                      <button style={{ padding:"5px 12px", borderRadius:7, border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", fontSize:11, fontWeight:600, color:"#64748b", fontFamily:"inherit" }}>Resolve</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      }
    </div>
  );
}

// ── Profile ────────────────────────────────────────────────────────────
function ProfilePage() {
  const { data, loading } = window.usePageData('profile');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [form, setForm] = useState(null);
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeCity, setPincodeCity] = useState('');
  const [pincodeSaving, setPincodeSaving] = useState(false);
  const [pincodeMsg, setPincodeMsg] = useState('');
  const [pincodeRows, setPincodeRows] = useState([]);

  React.useEffect(() => {
    window.abdApi('pincodes')
      .then(res => {
        if (res.status === 'success') setPincodeRows(res.pincodes || []);
      })
      .catch(() => {});
  }, []);

  // Map API profile to display object — falls back to live session, never to demo data
  const A = React.useMemo(() => {
    const sess = window.ABD_SESSION || {};
    const src  = data?.profile || {};
    const name = src.full_name || sess.full_name || 'ABD User';
    const words = name.trim().split(/\s+/);
    const initials = (words[0]?.[0] || '').toUpperCase() + (words[1]?.[0] || '').toUpperCase();
    const area = src.area || sess.area || '';
    return {
      name,
      phone:    src.phone    || sess.phone  || '',
      email:    src.email    || sess.email  || '',
      area,
      aadhaar:  'KYC Pending',
      pan:      'KYC Pending',
      bank:     (src.bank_name && src.account_number)
                  ? src.bank_name + ' · ****' + String(src.account_number).slice(-4)
                  : 'Not linked',
      upi:      src.upi_id  || 'Not linked',
      level:    'ABD',
      rating:   src.rating  || 0,
      avatar:   initials    || 'AU',
      wallet:   +(src.wallet_balance ?? sess.wallet_balance) || 0,
      pincodes: pincodeRows.map(p => p.pincode).filter(Boolean),
      raw:      data?.profile || null,
    };
  }, [data, pincodeRows]);

  React.useEffect(() => {
    if (A) {
      setForm({ full_name: A.name, phone: A.phone, email: A.email });
    }
  }, [A.name]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await window.abdApi('profile', { action:'update_profile', ...form });
      if (res.status === 'success') {
        setSaveMsg('Profile updated successfully!');
        setEditMode(false);
      } else {
        setSaveMsg(res.message || 'Update failed');
      }
    } catch {
      setSaveMsg('Network error');
    }
    setSaving(false);
  }

  async function handleAddPincode(e) {
    e.preventDefault();
    const pincode = pincodeInput.replace(/\D/g, '').slice(0, 6);
    if (!/^\d{6}$/.test(pincode)) {
      setPincodeMsg('Valid 6-digit pincode daalo');
      return;
    }
    setPincodeSaving(true);
    setPincodeMsg('');
    try {
      const res = await window.abdApi('profile', { action:'add_pincode', pincode, city:pincodeCity.trim() });
      if (res.status === 'success') {
        setPincodeRows(res.pincodes || []);
        setPincodeInput('');
        setPincodeCity('');
        setPincodeMsg('Pincode added successfully!');
      } else {
        setPincodeMsg(res.message || 'Pincode add nahi ho paya');
      }
    } catch {
      setPincodeMsg('Network error');
    }
    setPincodeSaving(false);
  }

  async function handleRemovePincode(pincode) {
    setPincodeSaving(true);
    setPincodeMsg('');
    try {
      const res = await window.abdApi('profile', { action:'remove_pincode', pincode });
      if (res.status === 'success') {
        setPincodeRows(res.pincodes || []);
        setPincodeMsg('Pincode removed');
      } else {
        setPincodeMsg(res.message || 'Pincode remove nahi ho paya');
      }
    } catch {
      setPincodeMsg('Network error');
    }
    setPincodeSaving(false);
  }

  if (loading) return <LoadingPage/>;

  return (
    <div className="abd-profile-page" style={{ padding:"28px 32px", animation:"fadeIn 0.25s ease" }}>
      <SectionHeader title="My Profile" sub="Manage your ABD account and verification details"/>

      {saveMsg && (
        <div style={{ marginBottom:16, padding:"11px 16px", borderRadius:10, background:"#d1fae5", border:"1px solid #6ee7b7", color:"#059669", fontSize:13, fontWeight:600 }}>
          {saveMsg}
        </div>
      )}

      <div className="abd-profile-grid" style={{ display:"grid", gridTemplateColumns:"320px 1fr", gap:20 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <Card style={{ textAlign:"center" }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
              <div style={{ position:"relative" }}>
                <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#ff5a1f,#ff8c00)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, fontWeight:900, color:"#fff" }}>{A.avatar}</div>
                <div style={{ position:"absolute", bottom:2, right:2, width:18, height:18, borderRadius:"50%", background:"#10b981", border:"3px solid #fff" }}/>
              </div>
            </div>
            <div style={{ fontSize:18, fontWeight:800, color:"#0f172a" }}>{A.name}</div>
            <div style={{ fontSize:13, color:"#64748b", marginTop:4 }}>
              {data?.profile?.id ? 'ABD-' + data.profile.id : 'ABD'}
            </div>
            <div style={{ marginTop:10, display:"flex", justifyContent:"center" }}>
              <Badge color="#f59e0b">{A.level}</Badge>
            </div>
            <div style={{ marginTop:16, padding:"12px 0", borderTop:"1px solid #f1f5f9", display:"flex", justifyContent:"space-around" }}>
              {[
                {label:"Area",    val: A.area ? A.area.split(",")[0] : '—'},
                {label:"Pincodes",val: A.pincodes.length || window.KD.abd.pincodes.length},
                {label:"Rating",  val: A.rating + "★"},
              ].map(s=>(
                <div key={s.label} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:14, fontWeight:800, color:"#0f172a" }}>{s.val}</div>
                  <div style={{ fontSize:10, color:"#94a3b8", fontWeight:600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div style={{ fontSize:13, fontWeight:800, color:"#0f172a", marginBottom:12 }}>Contact Info</div>
            {[
              {icon:"phone",   val: A.phone},
              {icon:"mail",    val: A.email},
              {icon:"pincode", val: A.area},
            ].map(r=>(
              <div key={r.icon} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #f8fafc" }}>
                <Icon name={r.icon} size={14} style={{ color:"#94a3b8", flexShrink:0 }}/>
                <span style={{ fontSize:13, color:"#64748b" }}>{r.val || '—'}</span>
              </div>
            ))}
          </Card>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Update Profile Form */}
          <Card>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:800, color:"#0f172a" }}>Update Profile</div>
              <Btn variant={editMode?"secondary":"ghost"} size="sm" onClick={()=>setEditMode(v=>!v)}>
                {editMode ? 'Cancel' : 'Edit'}
              </Btn>
            </div>
            {editMode && form ? (
              <form onSubmit={handleSave} style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[
                  { key:'full_name', label:'Full Name',    type:'text' },
                  { key:'phone',     label:'Phone',        type:'tel'  },
                  { key:'email',     label:'Email',        type:'email'},
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#64748b", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.05em" }}>{f.label}</label>
                    <input
                      type={f.type} value={form[f.key] || ''} onChange={e => setForm(v => ({...v, [f.key]: e.target.value}))}
                      style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:"1px solid #e2e8f0", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}
                      onFocus={e=>e.target.style.borderColor="#ff5a1f"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}
                    />
                  </div>
                ))}
                <div style={{ display:"flex", gap:8, marginTop:4 }}>
                  <Btn type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Btn>
                </div>
              </form>
            ) : (
              <div className="abd-profile-info-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[
                  {label:"Full Name", val:A.name},
                  {label:"Phone",     val:A.phone},
                  {label:"Email",     val:A.email},
                  {label:"Area",      val:A.area},
                ].map(r=>(
                  <div key={r.label} style={{ padding:"12px 14px", borderRadius:10, background:"#f8fafc" }}>
                    <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{r.label}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginTop:3 }}>{r.val || '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div style={{ fontSize:14, fontWeight:800, color:"#0f172a", marginBottom:16 }}>KYC & Verification</div>
            <div className="abd-profile-info-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {[
                { label:"Aadhaar Card", val:A.aadhaar,  status:"pending" },
                { label:"PAN Card",     val:A.pan,      status:"pending" },
                { label:"Bank Account", val:A.bank,     status: A.raw?.bank_name ? "verified" : "pending" },
                { label:"UPI ID",       val:A.upi,      status: A.raw?.upi_id ? "verified" : "pending" },
              ].map(r=>(
                <div key={r.label} style={{ padding:"14px 16px", borderRadius:12, background:"#f8fafc", border:"1px solid #e8edf2" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <span style={{ fontSize:11, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{r.label}</span>
                    <StatusBadge status={r.status}/>
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{r.val || '—'}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, marginBottom:16 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:"#0f172a" }}>Assigned Pincodes</div>
                <div style={{ fontSize:12, color:"#64748b", marginTop:3 }}>Add up to 10 service pincodes</div>
              </div>
              <Badge color="#ff5a1f">{A.pincodes.length}/10</Badge>
            </div>

            <form className="abd-profile-pincode-form" onSubmit={handleAddPincode} style={{ display:"grid", gridTemplateColumns:"130px 1fr auto", gap:10, marginBottom:14 }}>
              <input
                value={pincodeInput}
                onChange={e=>setPincodeInput(e.target.value.replace(/\D/g,'').slice(0,6))}
                inputMode="numeric"
                maxLength={6}
                placeholder="Pincode"
                style={{ padding:"9px 12px", borderRadius:9, border:"1px solid #e2e8f0", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}
                onFocus={e=>e.target.style.borderColor="#ff5a1f"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}
              />
              <input
                value={pincodeCity}
                onChange={e=>setPincodeCity(e.target.value)}
                placeholder="Area / city name"
                style={{ padding:"9px 12px", borderRadius:9, border:"1px solid #e2e8f0", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}
                onFocus={e=>e.target.style.borderColor="#ff5a1f"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}
              />
              <Btn type="submit" size="sm" icon="plus" disabled={pincodeSaving || A.pincodes.length >= 10}>
                {pincodeSaving ? 'Adding...' : 'Add'}
              </Btn>
            </form>

            {pincodeMsg && (
              <div style={{ marginBottom:12, fontSize:12, fontWeight:700, color:pincodeMsg.includes('success') || pincodeMsg.includes('removed') ? "#059669" : "#ef4444" }}>
                {pincodeMsg}
              </div>
            )}

            {pincodeRows.length > 0 ? (
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {pincodeRows.map(p=>(
                  <div key={p.pincode} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px 10px 16px", borderRadius:12, background:"rgba(255,90,31,0.06)", border:"1px solid rgba(255,90,31,0.2)" }}>
                    <div>
                      <div style={{ fontSize:15, fontWeight:800, color:"#ff5a1f" }}>{p.pincode}</div>
                      <div style={{ fontSize:11, color:"#94a3b8" }}>{p.city || 'Serviceable'}</div>
                    </div>
                    <button
                      type="button"
                      onClick={()=>handleRemovePincode(p.pincode)}
                      disabled={pincodeSaving}
                      title="Remove pincode"
                      style={{ width:24, height:24, borderRadius:7, border:"1px solid rgba(239,68,68,0.25)", background:"#fff", color:"#ef4444", cursor:"pointer", fontSize:14, lineHeight:"20px", fontWeight:800 }}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding:"18px", borderRadius:12, background:"#f8fafc", border:"1px dashed #cbd5e1", color:"#64748b", fontSize:13, fontWeight:600 }}>
                No pincodes assigned yet. Add your first service pincode above.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BookingsPage, EarningsPage, NotificationsPage, ComplaintsPage, ProfilePage });

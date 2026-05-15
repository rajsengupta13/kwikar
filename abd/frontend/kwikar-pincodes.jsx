// kwikar-pincodes.jsx — Pincodes page
const { useState } = React;

function PincodesPage() {
  const { data, loading } = window.usePageData('pincodes');
  const [selected, setSelected] = useState(null);

  function mapPincode(p) {
    return {
      code:        p.pincode || '',
      area:        p.city || p.area || '',
      technicians: +p.tech_count || 0,
      bookings:    +p.booking_count || 0,
      revenue:     0,   // not in schema — display as N/A
      growth:      0,   // not in schema — display as N/A
      isPrimary:   !!p.is_primary,
    };
  }

  const pincodes = data?.pincodes?.map(mapPincode) || window.KD.pincodes;

  if (loading) return <LoadingPage/>;

  if (pincodes.length === 0) {
    return (
      <div style={{ padding:"28px 32px", animation:"fadeIn 0.25s ease" }}>
        <SectionHeader title="Pincode Management" sub="Service area coverage, revenue and technician density"/>
        <EmptyState icon="pincode" title="No pincodes assigned" sub="Contact admin to assign service pincodes to your ABD account"/>
      </div>
    );
  }

  const maxTechs = Math.max(...pincodes.map(p => p.technicians), 1);
  const colors   = ["#ff5a1f","#3b82f6","#8b5cf6","#10b981","#f59e0b","#06b6d4","#ec4899","#ef4444"];

  return (
    <div style={{ padding:"28px 32px", animation:"fadeIn 0.25s ease" }}>
      <SectionHeader title="Pincode Management" sub="Service area coverage, technician density and booking stats"/>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16, marginBottom:24 }}>
        {pincodes.map((p, i) => (
          <div key={p.code} onClick={() => setSelected(selected === p.code ? null : p.code)}
            style={{
              background: selected === p.code ? "#fff9f6" : "#fff",
              borderRadius:16, padding:"20px 22px", cursor:"pointer",
              boxShadow: selected === p.code ? "0 8px 24px rgba(255,90,31,0.12)" : "0 2px 10px rgba(0,0,0,0.06)",
              border: selected === p.code ? "2px solid #ff5a1f" : "1px solid #e8edf2",
              transition:"all 0.2s"
            }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div>
                <div style={{ fontSize:22, fontWeight:900, color: selected===p.code ? "#ff5a1f" : "#0f172a", letterSpacing:"-0.02em" }}>{p.code}</div>
                <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{p.area || 'Unknown area'}</div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                {p.isPrimary && (
                  <span style={{ padding:"2px 8px", borderRadius:20, background:"rgba(255,90,31,0.1)", color:"#ff5a1f", fontSize:10, fontWeight:700 }}>Primary</span>
                )}
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                { label:"Technicians", val:p.technicians, color:"#ff5a1f" },
                { label:"Bookings",    val:p.bookings,    color:"#3b82f6" },
              ].map(s=>(
                <div key={s.label} style={{ padding:"8px 10px", borderRadius:10, background:"#f8fafc" }}>
                  <div style={{ fontSize:10, color:"#94a3b8", fontWeight:600, textTransform:"uppercase" }}>{s.label}</div>
                  <div style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.val}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid #f1f5f9" }}>
              <div style={{ fontSize:10, color:"#94a3b8", fontWeight:600 }}>REVENUE</div>
              <div style={{ fontSize:16, fontWeight:800, color:"#0f172a" }}>
                {p.revenue > 0 ? `₹${(p.revenue/1000).toFixed(1)}K` : '—'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <SectionHeader title="Technician Density by Pincode"/>
        <div style={{ display:"flex", gap:16, alignItems:"flex-end", height:180 }}>
          {pincodes.map((p, i) => {
            const h = Math.round((p.technicians / maxTechs) * 140) + 20;
            const color = colors[i % colors.length];
            return (
              <div key={p.code} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#64748b" }}>{p.technicians} techs</div>
                <div style={{
                  width:"100%", height:h, borderRadius:"10px 10px 0 0",
                  background:`linear-gradient(180deg,${color}cc,${color})`,
                  boxShadow:`0 4px 12px ${color}40`,
                  display:"flex", alignItems:"flex-end", justifyContent:"center", paddingBottom:8,
                  transition:"height 0.4s ease"
                }}>
                  <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.85)" }}>{p.bookings} bkgs</span>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:13, fontWeight:800, color:"#0f172a" }}>{p.code}</div>
                  <div style={{ fontSize:10, color:"#94a3b8" }}>{p.area}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card padding={0} style={{ marginTop:20 }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:"1px solid #f1f5f9" }}>
              {["Pincode","Area","Technicians","Bookings","Revenue","Primary","Density"].map(h=>(
                <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontWeight:700, color:"#64748b", fontSize:11, textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pincodes.map((p, i)=>(
              <tr key={p.code} style={{ borderBottom:"1px solid #f8fafc" }}
                onMouseEnter={e=>e.currentTarget.style.background="#fafbfc"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{ padding:"13px 16px", fontWeight:800, color:"#ff5a1f", fontSize:14 }}>{p.code}</td>
                <td style={{ padding:"13px 16px", fontWeight:600, color:"#0f172a" }}>{p.area || '—'}</td>
                <td style={{ padding:"13px 16px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ flex:1, height:6, borderRadius:3, background:"#f1f5f9", minWidth:60 }}>
                      <div style={{ height:"100%", borderRadius:3, width:`${Math.round((p.technicians/maxTechs)*100)}%`, background:"#ff5a1f" }}/>
                    </div>
                    <span style={{ fontWeight:700, color:"#0f172a" }}>{p.technicians}</span>
                  </div>
                </td>
                <td style={{ padding:"13px 16px", fontWeight:700, color:"#0f172a" }}>{p.bookings}</td>
                <td style={{ padding:"13px 16px", fontWeight:800, color:"#0f172a" }}>
                  {p.revenue > 0 ? `₹${p.revenue.toLocaleString("en-IN")}` : '—'}
                </td>
                <td style={{ padding:"13px 16px" }}>
                  {p.isPrimary
                    ? <span style={{ padding:"3px 10px", borderRadius:20, background:"rgba(255,90,31,0.1)", color:"#ff5a1f", fontSize:11, fontWeight:700 }}>Primary</span>
                    : <span style={{ fontSize:12, color:"#94a3b8" }}>—</span>
                  }
                </td>
                <td style={{ padding:"13px 16px" }}>
                  <div style={{ display:"flex", gap:2 }}>
                    {Array.from({length:5}).map((_,j)=>(
                      <div key={j} style={{
                        width:8, height:8+(j*3), borderRadius:2,
                        background: j < Math.ceil((p.technicians / maxTechs) * 5) ? "#ff5a1f" : "#e8edf2"
                      }}/>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

Object.assign(window, { PincodesPage });

// kwikar-tree.jsx — Admin Referral Network Tree (matches ABD panel design)
const { useState, useEffect, useMemo, useCallback } = React;

const UNIT_W   = 210;
const LEVEL_H  = 190;
const NODE_W   = 186;
const NODE_H   = 108;

// depth 0 = Super Admin, depth 1 = ABD, depth 2+ = Technician levels
const LEVEL_COLORS = {
  0: { bg:"linear-gradient(135deg,#0f172a,#1e3a5f)", text:"#fff", border:"#22d3ee", badge:"Super Admin" },
  1: { bg:"linear-gradient(135deg,#ff5a1f,#ff8c00)", text:"#fff", border:"#ff5a1f", badge:"ABD" },
  2: { bg:"#fff", text:"#0f172a", border:"#ff5a1f", badge:"L1 Direct" },
  3: { bg:"#fff", text:"#0f172a", border:"#3b82f6", badge:"L2 Referral" },
  4: { bg:"#fff", text:"#0f172a", border:"#8b5cf6", badge:"L3 Referral" },
  5: { bg:"#fff", text:"#0f172a", border:"#10b981", badge:"L4+" },
};
const LEVEL_LINE_COLOR = { 1:"#22d3ee", 2:"#ff5a1f", 3:"#3b82f6", 4:"#8b5cf6", 5:"#10b981" };
const AVATAR_COLORS = ["#ff5a1f","#3b82f6","#10b981","#8b5cf6","#f59e0b","#ef4444","#06b6d4","#ec4899","#22d3ee"];

function getAvatarColor(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xfffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function getInitials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function subtreeWidth(node, expanded) {
  if (!node.children?.length || !expanded.has(node.id)) return 1;
  return Math.max(1, node.children.reduce((s, c) => s + subtreeWidth(c, expanded), 0));
}

function getMaxDepth(node, expanded, depth = 0) {
  if (!node.children?.length || !expanded.has(node.id)) return depth;
  return Math.max(...node.children.map(c => getMaxDepth(c, expanded, depth + 1)));
}

function layoutTree(root, expanded) {
  const nodes = [], edges = [];

  function walk(node, depth, leftSlot) {
    const sw   = subtreeWidth(node, expanded);
    const cx   = (leftSlot + sw / 2) * UNIT_W;
    const cy   = depth * LEVEL_H + 20;
    const hasChildren = node.children?.length > 0;
    const isExpanded  = expanded.has(node.id);

    nodes.push({ ...node, cx, cy, sw, hasChildren, isExpanded, depth, children: undefined });

    if (hasChildren && isExpanded) {
      let slot = leftSlot;
      for (const child of node.children) {
        const cw      = subtreeWidth(child, expanded);
        const childCX = (slot + cw / 2) * UNIT_W;
        const childCY = (depth + 1) * LEVEL_H + 20;
        edges.push({
          id: `e-${node.id}-${child.id}`,
          x1: cx,      y1: cy   + NODE_H / 2 + 2,
          x2: childCX, y2: childCY - NODE_H / 2 - 2,
          level: Math.min(depth + 1, 5),
          direct: depth === 0 || depth === 1,
        });
        walk(child, depth + 1, slot);
        slot += cw;
      }
    }
  }

  walk(root, 0, 0);
  const maxSW = subtreeWidth(root, expanded);
  return {
    nodes, edges,
    width:  Math.max(maxSW * UNIT_W, 700),
    height: getMaxDepth(root, expanded) * LEVEL_H + NODE_H + 80,
  };
}

function getStyleIndex(node) {
  if (node.role === 'admin') return 0;
  if (node.role === 'abd')   return 1;
  // Technicians: depth 1 (orphan, no ABD) and depth 2 (direct under ABD) both = L1 Direct
  // depth 3 = L2 Referral, depth 4 = L3, etc.
  return Math.min(Math.max(2, node.depth), 5);
}

function TreeNode({ node, onToggle, hoveredId, onHover }) {
  const styleIdx   = getStyleIndex(node);
  const lc         = LEVEL_COLORS[styleIdx];
  const isHovered  = hoveredId === node.id;
  const isRoot     = node.role === 'admin';
  const isABD      = node.role === 'abd';
  const isSpecial  = isRoot || isABD;
  const badgeColor = styleIdx === 0 ? "#22d3ee" : styleIdx === 1 ? "#ff5a1f" : styleIdx === 2 ? "#ff5a1f" : styleIdx === 3 ? "#3b82f6" : "#8b5cf6";
  const statusColor = node.status === "active" ? "#10b981" : node.status === "blocked" || node.status === "suspended" ? "#ef4444" : "#94a3b8";

  return (
    <div
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => node.hasChildren && onToggle(node.id)}
      style={{
        position: "absolute",
        left: node.cx - NODE_W / 2,
        top:  node.cy - NODE_H / 2,
        width: NODE_W, height: NODE_H,
        borderRadius: 14,
        background: isSpecial ? lc.bg : "#fff",
        border: isSpecial ? "none" : `2px solid ${isHovered ? lc.border : "#e8edf2"}`,
        borderLeft: isSpecial ? "none" : `4px solid ${lc.border}`,
        boxShadow: isHovered
          ? `0 12px 32px rgba(0,0,0,0.14), 0 0 0 2px ${lc.border}40`
          : "0 3px 12px rgba(0,0,0,0.07)",
        cursor: node.hasChildren ? "pointer" : "default",
        transition: "all 0.2s ease",
        transform: isHovered ? "translateY(-3px) scale(1.02)" : "none",
        zIndex: isHovered ? 10 : 1,
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "10px 14px", gap: 4, userSelect: "none",
      }}>

      {/* Top row: avatar + name + expand toggle */}
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{
          width: 34, height: 34, borderRadius:"50%", flexShrink:0,
          background: isSpecial ? "rgba(255,255,255,0.25)" : getAvatarColor(node.id),
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize: 11, fontWeight: 800, color:"#fff",
          border: isSpecial ? "2px solid rgba(255,255,255,0.4)" : "none",
          position:"relative",
        }}>
          {getInitials(node.name)}
          <div style={{
            position:"absolute", bottom:-1, right:-1, width:10, height:10,
            borderRadius:"50%", background:statusColor, border:"1.5px solid #fff",
          }}/>
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{
            fontSize: 12.5, fontWeight: 800,
            color: isSpecial ? "#fff" : "#0f172a",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          }}>{node.name}</div>
          <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:2 }}>
            <span style={{
              fontSize: 9.5, fontWeight: 700, padding:"1px 6px", borderRadius:10,
              background: isSpecial ? "rgba(255,255,255,0.2)" : badgeColor + "18",
              color: isSpecial ? "#fff" : badgeColor,
            }}>{lc.badge}</span>
            {(isABD && node.city) && (
              <span style={{ fontSize:9.5, color: isSpecial ? "rgba(255,255,255,0.7)" : "#94a3b8" }}>· {node.city}</span>
            )}
            {(!isSpecial && node.cat) && (
              <span style={{ fontSize:9.5, color:"#94a3b8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:90 }}>· {node.cat}</span>
            )}
          </div>
        </div>

        {node.hasChildren && (
          <div style={{
            width:20, height:20, borderRadius:"50%", flexShrink:0,
            background: isSpecial ? "rgba(255,255,255,0.2)" : "#f1f5f9",
            display:"flex", alignItems:"center", justifyContent:"center",
            color: isSpecial ? "#fff" : "#94a3b8",
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8">
              {node.isExpanded
                ? <polyline points="2,3.5 5,6.5 8,3.5"/>
                : <polyline points="3.5,2 6.5,5 3.5,8"/>
              }
            </svg>
          </div>
        )}
      </div>

      {/* Bottom row: earnings + refs */}
      <div style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        marginTop:2, padding:"5px 0 0",
        borderTop:`1px solid ${isSpecial ? "rgba(255,255,255,0.15)" : "#f1f5f9"}`,
      }}>
        <div>
          <div style={{ fontSize:9, fontWeight:600, color: isSpecial ? "rgba(255,255,255,0.6)" : "#94a3b8", textTransform:"uppercase", letterSpacing:"0.04em" }}>
            {isRoot ? "Network" : "Earnings"}
          </div>
          <div style={{ fontSize:12, fontWeight:800, color: isSpecial ? "#fff" : "#0f172a" }}>
            {isRoot ? `${node.refs} Techs` : isABD ? `${node.refs} Techs` : `₹${Number(node.earnings / 1000).toFixed(1)}K`}
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:9, fontWeight:600, color: isSpecial ? "rgba(255,255,255,0.6)" : "#94a3b8", textTransform:"uppercase", letterSpacing:"0.04em" }}>
            {isRoot ? "ABDs" : isABD ? "Direct" : "Referrals"}
          </div>
          <div style={{ fontSize:12, fontWeight:800, color: isSpecial ? "#fff" : lc.border }}>
            {isRoot ? (node.abd_count ?? node.children?.length ?? 0) : (node.refs || 0)}
          </div>
        </div>
      </div>
    </div>
  );
}

function NodeDetailCard({ node, onClose }) {
  if (!node || node.depth === 0) return null;
  const depth     = Math.min(node.depth, 5);
  const lc        = LEVEL_COLORS[depth];
  const badgeColor = depth === 1 ? "#ff5a1f" : depth === 2 ? "#ff5a1f" : depth === 3 ? "#3b82f6" : "#8b5cf6";

  return (
    <div style={{
      position:"fixed", right:32, bottom:32, width:288,
      background:"#fff", borderRadius:16,
      boxShadow:"0 24px 64px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08)",
      border:`2px solid ${lc.border}`, padding:20, zIndex:500,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
        <div style={{
          width:44, height:44, borderRadius:"50%", background:getAvatarColor(node.id),
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:15, fontWeight:800, color:"#fff",
        }}>{getInitials(node.name)}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:800, color:"#0f172a" }}>{node.name}</div>
          <div style={{ fontSize:12, color:"#64748b" }}>{node.cat || (node.role === 'abd' ? 'ABD' : 'Technician')}</div>
        </div>
        <span style={{
          padding:"3px 10px", borderRadius:20,
          background: badgeColor + "18", color:badgeColor, fontSize:10, fontWeight:700,
        }}>{lc.badge}</span>
        <button onClick={onClose} style={{
          width:24, height:24, borderRadius:"50%", border:"1px solid #e2e8f0",
          background:"#f8fafc", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:14, color:"#94a3b8",
        }}>×</button>
      </div>

      {[
        { label:"Total Earnings",  value:`₹${Number(node.earnings).toLocaleString("en-IN")}`, color:"#0f172a" },
        { label:"Referrals Made",  value: String(node.refs || 0), color:lc.border },
        { label:"Status",          value: node.status === "active" ? "🟢 Active" : node.status === "blocked" ? "🔴 Blocked" : "⚫ Inactive", color:"#0f172a" },
        { label:"Network Level",   value:`Level ${node.depth}`, color:badgeColor },
        ...(node.city ? [{ label:"City", value:node.city, color:"#64748b" }] : []),
        ...(node.cat  ? [{ label:"Category", value:node.cat, color:"#64748b" }] : []),
      ].map(row => (
        <div key={row.label} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #f1f5f9" }}>
          <span style={{ fontSize:12, color:"#64748b" }}>{row.label}</span>
          <span style={{ fontSize:12, fontWeight:700, color:row.color }}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function TreeLegend() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
      {[
        { color:"linear-gradient(135deg,#0f172a,#1e3a5f)", label:"Super Admin" },
        { color:"linear-gradient(135deg,#ff5a1f,#ff8c00)", label:"ABD" },
        { color:"#ff5a1f",  label:"L1 Direct" },
        { color:"#3b82f6",  label:"L2 Referral" },
        { color:"#8b5cf6",  label:"L3 Referral" },
      ].map(item => (
        <div key={item.label} style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:12, height:12, borderRadius:3, background:item.color, flexShrink:0 }}/>
          <span style={{ fontSize:12, color:"#64748b" }}>{item.label}</span>
        </div>
      ))}
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <div style={{ width:20, height:2, background:"#22d3ee" }}/>
        <span style={{ fontSize:12, color:"#64748b" }}>Direct link</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <div style={{ width:20, height:2, borderTop:"2px dashed #3b82f6" }}/>
        <span style={{ fontSize:12, color:"#64748b" }}>Referral link</span>
      </div>
    </div>
  );
}

function ReferralTree({ data }) {
  const [expanded, setExpanded] = useState(() => {
    const s = new Set();
    function addAll(n) { s.add(n.id); n.children?.forEach(addAll); }
    addAll(data);
    return s;
  });
  const [hoveredId, setHoveredId] = useState(null);
  const [zoom, setZoom]           = useState(1);

  const networkStats = useMemo(() => {
    // Use pre-computed counts from API when available; fallback to tree walk
    const totalAbds    = data.abd_count     ?? (data.children || []).filter(c => c.role === 'abd').length;
    const directTechs  = data.direct_count  ?? 0;
    const indirectTechs= data.indirect_count?? 0;
    const totalTechs   = data.refs          ?? (directTechs + indirectTechs);
    const maxD = getMaxDepth(data, expanded);
    return { totalAbds, totalTechs, directTechs, indirectTechs, depth: Math.max(0, maxD - 1) };
  }, [data, expanded]);

  const toggleNode = useCallback(id => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const { nodes, edges, width, height } = useMemo(() => layoutTree(data, expanded), [data, expanded]);
  const hoveredNode = hoveredId ? nodes.find(n => n.id === hoveredId) : null;

  return (
    <div>
      {/* Legend + zoom controls */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:12 }}>
        <TreeLegend/>
        <div style={{ display:"flex", gap:8 }}>
          {[
            { label:"+",     action:()=>setZoom(z=>Math.min(1.5,z+0.1)) },
            { label:"−",     action:()=>setZoom(z=>Math.max(0.4,z-0.1)) },
            { label:"Reset", action:()=>setZoom(1) },
          ].map(b=>(
            <button key={b.label} onClick={b.action} style={{
              height:32, padding:"0 12px", borderRadius:8, border:"1px solid #e2e8f0",
              background:"#fff", cursor:"pointer", fontSize: b.label.length===1?16:12,
              fontWeight:600, color:"#64748b", minWidth:32,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>{b.label}</button>
          ))}
          <button onClick={()=>{
            const s=new Set(); function addAll(n){s.add(n.id);n.children?.forEach(addAll);} addAll(data);
            setExpanded(s);
          }} style={{ height:32, padding:"0 12px", borderRadius:8, border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", fontSize:12, fontWeight:600, color:"#64748b" }}>
            Expand All
          </button>
          <button onClick={()=>setExpanded(new Set(["root"]))} style={{ height:32, padding:"0 12px", borderRadius:8, border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", fontSize:12, fontWeight:600, color:"#64748b" }}>
            Collapse
          </button>
        </div>
      </div>

      {/* Tree canvas */}
      <div style={{
        overflow:"auto", background:"#f8f9fc", borderRadius:16, border:"1px solid #e8edf2",
        padding:24, maxHeight:"calc(100vh - 340px)",
      }}>
        <div style={{
          position:"relative",
          width: width * zoom, height: height * zoom,
          transform:`scale(${zoom})`, transformOrigin:"top left",
          minWidth: width,
        }}>
          <svg style={{ position:"absolute", top:0, left:0, width, height, pointerEvents:"none", overflow:"visible" }}>
            <defs>
              {Object.entries(LEVEL_LINE_COLOR).map(([level, color]) => (
                <marker key={level} id={`adm-arrow-${level}`} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill={color} opacity="0.5"/>
                </marker>
              ))}
            </defs>
            {edges.map(e => {
              const color = LEVEL_LINE_COLOR[e.level] || "#94a3b8";
              const my    = (e.y1 + e.y2) / 2;
              return (
                <g key={e.id}>
                  <path
                    d={`M${e.x1},${e.y1} C${e.x1},${my} ${e.x2},${my} ${e.x2},${e.y2}`}
                    fill="none" stroke={color}
                    strokeWidth={e.direct ? 2.5 : 1.5}
                    strokeDasharray={e.direct ? "none" : "6,4"}
                    opacity={0.55}
                    markerEnd={`url(#adm-arrow-${e.level})`}
                  />
                  <path id={`adm-flow-${e.id}`}
                    d={`M${e.x1},${e.y1} C${e.x1},${my} ${e.x2},${my} ${e.x2},${e.y2}`}
                    fill="none" stroke="none"/>
                  <circle r="3" fill={color} opacity="0.7">
                    <animateMotion dur={e.direct?"2.5s":"3.8s"} repeatCount="indefinite">
                      <mpath xlinkHref={`#adm-flow-${e.id}`}/>
                    </animateMotion>
                  </circle>
                </g>
              );
            })}
          </svg>

          {nodes.map(node => (
            <TreeNode key={node.id} node={node} onToggle={toggleNode} hoveredId={hoveredId} onHover={setHoveredId}/>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginTop:16 }}>
        {[
          { label:"Total ABDs",       value: String(networkStats.totalAbds),    color:"#ff5a1f" },
          { label:"Total Technicians",value: String(networkStats.totalTechs),   color:"#ff5a1f" },
          { label:"Direct (L1)",      value: String(networkStats.directTechs),  color:"#3b82f6" },
          { label:"Indirect (L2+)",   value: String(networkStats.indirectTechs),color:"#8b5cf6" },
        ].map(s => (
          <div key={s.label} style={{
            background:"#fff", borderRadius:12, padding:"14px 18px",
            boxShadow:"0 2px 8px rgba(0,0,0,0.05)", border:"1px solid #e8edf2",
            borderTop:`3px solid ${s.color}`,
          }}>
            <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:s.color, marginTop:4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {hoveredNode && <NodeDetailCard node={hoveredNode} onClose={()=>setHoveredId(null)}/>}
    </div>
  );
}

function ReferralTreePage() {
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    window.adminApi('referral_tree').then(res => {
      if (res.status === 'success' && res.tree) setTreeData(res.tree);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding:"28px 32px", color:"#64748b", fontSize:14 }}>Loading referral network...</div>
  );

  // Use pre-computed totals from API: abd_count + refs (assigned techs)
  const totalAbds  = treeData?.abd_count ?? 0;
  const totalTechs = treeData?.refs      ?? 0;
  const totalNodes = totalAbds + totalTechs;

  return (
    <div style={{ padding:"28px 32px", animation:"fadeIn 0.25s ease", background:"#f1f5f9", minHeight:"100%" }}>
      {/* Header */}
      <div style={{ marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:800, color:"#0f172a", margin:"0 0 4px" }}>Referral Network</h2>
          <p style={{ fontSize:13, color:"#64748b", margin:0 }}>
            {totalAbds > 0
              ? `${totalAbds} ABD${totalAbds !== 1 ? 's' : ''} · ${totalTechs} technician${totalTechs !== 1 ? 's' : ''} — click nodes to expand/collapse.`
              : 'No referral data yet. ABDs and technicians will appear here once registered.'}
          </p>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ padding:"10px 18px", borderRadius:12, background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.2)" }}>
            <div style={{ fontSize:11, color:"#a78bfa", fontWeight:600 }}>ABDs</div>
            <div style={{ fontSize:18, fontWeight:800, color:"#a78bfa" }}>{totalAbds}</div>
          </div>
          <div style={{ padding:"10px 18px", borderRadius:12, background:"rgba(52,211,153,0.08)", border:"1px solid rgba(52,211,153,0.2)" }}>
            <div style={{ fontSize:11, color:"#34d399", fontWeight:600 }}>Technicians</div>
            <div style={{ fontSize:18, fontWeight:800, color:"#34d399" }}>{totalTechs}</div>
          </div>
        </div>
      </div>

      {!treeData || totalAbds === 0
        ? <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e8edf2", padding:"60px 32px", textAlign:"center", color:"#94a3b8", fontSize:14 }}>
            No ABDs registered yet. Add ABDs from the ABD Management page to build the referral network.
          </div>
        : <ReferralTree data={treeData}/>
      }
    </div>
  );
}

Object.assign(window, { ReferralTreePage });

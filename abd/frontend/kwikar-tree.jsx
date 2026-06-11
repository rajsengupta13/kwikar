// kwikar-tree.jsx — Referral Network Tree (Hero Feature)
const { useState, useMemo, useCallback } = React;

const UNIT_W = 196;
const LEVEL_H = 180;
const NODE_W = 172;
const NODE_H = 100;

const LEVEL_COLORS = {
  0: { bg:"linear-gradient(135deg,#ff5a1f,#ff8c00)", text:"#fff", border:"#ff5a1f", badge:"ABD" },
  1: { bg:"#fff",  text:"#0f172a", border:"#ff5a1f", badge:"L1 Direct" },
  2: { bg:"#fff",  text:"#0f172a", border:"#3b82f6", badge:"L2 Referral" },
  3: { bg:"#fff",  text:"#0f172a", border:"#8b5cf6", badge:"L3 Referral" },
  4: { bg:"#fff",  text:"#0f172a", border:"#10b981", badge:"L4+" },
};
const LEVEL_LINE_COLOR = { 1:"#ff5a1f", 2:"#3b82f6", 3:"#8b5cf6", 4:"#10b981" };
const AVATAR_COLORS = ["#ff5a1f","#3b82f6","#10b981","#8b5cf6","#f59e0b","#ef4444","#06b6d4","#ec4899"];

function getAvatarColor(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xfffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function subtreeWidth(node, expanded) {
  if (!node.children?.length || !expanded.has(node.id)) return 1;
  return Math.max(1, node.children.reduce((s, c) => s + subtreeWidth(c, expanded), 0));
}

function layoutTree(root, expanded) {
  const nodes = [], edges = [];

  function walk(node, depth, leftSlot) {
    const sw = subtreeWidth(node, expanded);
    const cx = (leftSlot + sw / 2) * UNIT_W;
    const cy = depth * LEVEL_H + 20;
    const hasChildren = node.children?.length > 0;
    const isExpanded = expanded.has(node.id);

    nodes.push({ ...node, cx, cy, sw, hasChildren, isExpanded, depth, children: undefined });

    if (hasChildren && isExpanded) {
      let slot = leftSlot;
      for (const child of node.children) {
        const cw = subtreeWidth(child, expanded);
        const childCX = (slot + cw / 2) * UNIT_W;
        const childCY = (depth + 1) * LEVEL_H + 20;
        edges.push({
          id: `e-${node.id}-${child.id}`,
          x1: cx, y1: cy + NODE_H / 2 + 2,
          x2: childCX, y2: childCY - NODE_H / 2 - 2,
          level: child.level,
          direct: child.role === "Direct"
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
    width: Math.max(maxSW * UNIT_W, 600),
    height: getMaxDepth(root, expanded) * LEVEL_H + NODE_H + 60
  };
}

function getMaxDepth(node, expanded, depth = 0) {
  if (!node.children?.length || !expanded.has(node.id)) return depth;
  return Math.max(...node.children.map(c => getMaxDepth(c, expanded, depth + 1)));
}

function TreeNode({ node, onToggle, hoveredId, onHover, networkTotal }) {
  const lc = LEVEL_COLORS[Math.min(node.depth, 4)] || LEVEL_COLORS[4];
  const isHovered = hoveredId === node.id;
  const isABD = node.depth === 0;
  const statusColor = node.status === "active" ? "#10b981" : node.status === "busy" ? "#f59e0b" : "#94a3b8";
  const avatarBg = getAvatarColor(node.id);
  const badgeColor = node.depth === 0 ? "#ff5a1f" : node.depth === 1 ? "#ff5a1f" : node.depth === 2 ? "#3b82f6" : "#8b5cf6";

  return (
    <div
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => node.hasChildren && onToggle(node.id)}
      style={{
        position: "absolute",
        left: node.cx - NODE_W / 2,
        top: node.cy - NODE_H / 2,
        width: NODE_W, height: NODE_H,
        borderRadius: 14,
        background: isABD ? lc.bg : "#fff",
        border: isABD ? "none" : `2px solid ${isHovered ? lc.border : "#e8edf2"}`,
        borderLeft: isABD ? "none" : `4px solid ${lc.border}`,
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
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{
          width: 32, height: 32, borderRadius:"50%", flexShrink:0,
          background: isABD ? "rgba(255,255,255,0.25)" : avatarBg,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize: 11, fontWeight: 800, color:"#fff",
          border: isABD ? "2px solid rgba(255,255,255,0.4)" : "none",
          position:"relative"
        }}>
          {node.avatar}
          <div style={{
            position:"absolute", bottom:-1, right:-1, width:9, height:9,
            borderRadius:"50%", background:statusColor, border:"1.5px solid #fff"
          }}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: isABD ? "#fff" : "#0f172a",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {node.name}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:2 }}>
            <span style={{
              fontSize:9.5, fontWeight:700, padding:"1px 6px", borderRadius:10,
              background: isABD ? "rgba(255,255,255,0.2)" : badgeColor + "18",
              color: isABD ? "#fff" : badgeColor
            }}>{lc.badge}</span>
          </div>
        </div>
        {node.hasChildren && (
          <div style={{
            width:20, height:20, borderRadius:"50%", flexShrink:0,
            background: isABD ? "rgba(255,255,255,0.2)" : "#f1f5f9",
            display:"flex", alignItems:"center", justifyContent:"center",
            color: isABD ? "#fff" : "#94a3b8"
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              {node.isExpanded
                ? <path d="M2 4l3 3 3-3"/>
                : <path d="M4 2l3 3-3 3"/>
              }
            </svg>
          </div>
        )}
      </div>
      <div style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        marginTop:2, padding:"5px 0 0", borderTop:`1px solid ${isABD ? "rgba(255,255,255,0.15)" : "#f1f5f9"}`
      }}>
        <div>
          <div style={{ fontSize:9, fontWeight:600, color: isABD ? "rgba(255,255,255,0.6)" : "#94a3b8", textTransform:"uppercase", letterSpacing:"0.04em" }}>
            {isABD ? "Total Earned" : "Earned"}
          </div>
          <div style={{ fontSize:12, fontWeight:800, color: isABD ? "#fff" : "#0f172a" }}>
            ₹{(node.earnings/1000).toFixed(1)}K
          </div>
        </div>
        {!isABD && (
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:9, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.04em" }}>My Share</div>
            <div style={{ fontSize:12, fontWeight:800, color:"#ff5a1f" }}>₹{node.abdCommission.toLocaleString("en-IN")}</div>
          </div>
        )}
        {isABD && (
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:9, fontWeight:600, color:"rgba(255,255,255,0.6)", textTransform:"uppercase", letterSpacing:"0.04em" }}>Network</div>
            <div style={{ fontSize:12, fontWeight:800, color:"#fff" }}>{networkTotal} Tech{networkTotal !== 1 ? 's' : ''}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function NodeDetailCard({ node }) {
  if (!node || node.depth === 0) return null;
  const badgeColor = node.depth === 1 ? "#ff5a1f" : node.depth === 2 ? "#3b82f6" : "#8b5cf6";
  const lc = LEVEL_COLORS[Math.min(node.depth, 4)];
  return (
    <div style={{
      position:"fixed", right:32, bottom:32, width:280, background:"#fff",
      borderRadius:16, boxShadow:"0 24px 64px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08)",
      border:`2px solid ${lc.border}`, padding:20, zIndex:500, animation:"fadeIn 0.18s ease"
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
        <div style={{
          width:44, height:44, borderRadius:"50%", background:getAvatarColor(node.id),
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:800, color:"#fff"
        }}>{node.avatar}</div>
        <div>
          <div style={{ fontSize:15, fontWeight:800, color:"#0f172a" }}>{node.name}</div>
          <div style={{ fontSize:12, color:"#64748b" }}>{node.skill}</div>
        </div>
        <span style={{
          marginLeft:"auto", padding:"3px 10px", borderRadius:20,
          background: badgeColor + "18", color: badgeColor, fontSize:10, fontWeight:700
        }}>{lc.badge}</span>
      </div>
      {[
        { label:"Total Earnings",   value:`₹${node.earnings.toLocaleString("en-IN")}`, color:"#0f172a" },
        { label:"Your Commission",  value:`₹${node.abdCommission.toLocaleString("en-IN")} (${node.commPct}%)`, color:"#ff5a1f" },
        { label:"Status",           value: node.status === "active" ? "🟢 Active" : node.status === "busy" ? "🟡 Busy" : "⚫ Offline", color:"#0f172a" },
        { label:"Network Level",    value:`Level ${node.depth}`, color:badgeColor },
      ].map(row => (
        <div key={row.label} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #f1f5f9" }}>
          <span style={{ fontSize:12, color:"#64748b" }}>{row.label}</span>
          <span style={{ fontSize:12, fontWeight:700, color:row.color }}>{row.value}</span>
        </div>
      ))}
      <div style={{ marginTop:10, padding:"8px 12px", borderRadius:10, background:"#fff9f6", border:"1px solid #ffe0d0" }}>
        <div style={{ fontSize:11, color:"#94a3b8", marginBottom:2 }}>Commission Flow</div>
        <div style={{ fontSize:11, color:"#64748b" }}>
          {node.depth === 1
            ? `You earn 25% directly from ${node.name.split(" ")[0]}'s bookings`
            : `You earn 10% from ${node.name.split(" ")[0]}'s bookings via chain`}
        </div>
      </div>
    </div>
  );
}

function TreeLegend() {
  const items = [
    { color:"linear-gradient(135deg,#ff5a1f,#ff8c00)", label:"ABD (You)" },
    { color:"#ff5a1f",  label:"L1 Direct (25%)" },
    { color:"#3b82f6",  label:"L2 Referral (10%)" },
    { color:"#8b5cf6",  label:"L3 Referral (10%)" },
  ];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
      {items.map(item => (
        <div key={item.label} style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:12, height:12, borderRadius:3, background:item.color, flexShrink:0 }}/>
          <span style={{ fontSize:12, color:"#64748b" }}>{item.label}</span>
        </div>
      ))}
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <div style={{ width:20, height:2, background:"#ff5a1f" }}/>
        <span style={{ fontSize:12, color:"#64748b" }}>Direct link</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <div style={{ width:20, height:2, borderTop:"2px dashed #3b82f6" }}/>
        <span style={{ fontSize:12, color:"#64748b" }}>Indirect link</span>
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
  const [zoom, setZoom] = useState(1);

  // Compute real counts from live tree data
  const networkStats = useMemo(() => {
    function countAll(node) {
      return 1 + (node.children || []).reduce((s, c) => s + countAll(c), 0);
    }
    function maxDepth(node, d) {
      if (!(node.children?.length)) return d;
      return Math.max(...node.children.map(c => maxDepth(c, d + 1)));
    }
    const direct   = (data.children || []).length;
    const total    = countAll(data) - 1; // exclude ABD root
    const indirect = total - direct;
    const depth    = total > 0 ? maxDepth(data, 0) : 0;
    return { total, direct, indirect, depth };
  }, [data]);

  const toggleNode = useCallback((id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const { nodes, edges, width, height } = useMemo(() => layoutTree(data, expanded), [data, expanded]);
  const hoveredNode = hoveredId ? nodes.find(n => n.id === hoveredId) : null;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <TreeLegend/>
        <div style={{ display:"flex", gap:8 }}>
          {[
            { label:"+", action:()=>setZoom(z=>Math.min(1.4,z+0.1)) },
            { label:"−", action:()=>setZoom(z=>Math.max(0.5,z-0.1)) },
            { label:"Reset", action:()=>setZoom(1) },
          ].map(b=>(
            <button key={b.label} onClick={b.action} style={{
              height:32, padding:"0 12px", borderRadius:8, border:"1px solid #e2e8f0",
              background:"#fff", cursor:"pointer", fontSize: b.label.length===1?16:12,
              fontWeight:600, color:"#64748b", minWidth:32,
              display:"flex", alignItems:"center", justifyContent:"center"
            }}>{b.label}</button>
          ))}
          <button onClick={()=>{
            const s=new Set(); function addAll(n){s.add(n.id);n.children?.forEach(addAll);} addAll(data);
            setExpanded(s);
          }} style={{ height:32, padding:"0 12px", borderRadius:8, border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", fontSize:12, fontWeight:600, color:"#64748b" }}>Expand All</button>
          <button onClick={()=>setExpanded(new Set(["abd-1"]))} style={{ height:32, padding:"0 12px", borderRadius:8, border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", fontSize:12, fontWeight:600, color:"#64748b" }}>Collapse All</button>
        </div>
      </div>

      <div style={{
        overflow:"auto", background:"#f8f9fc", borderRadius:16, border:"1px solid #e8edf2",
        padding:24, maxHeight:"calc(100vh - 280px)",
      }}>
        <div style={{
          position:"relative", width: width * zoom, height: height * zoom,
          transform:`scale(${zoom})`, transformOrigin:"top left", minWidth: width
        }}>
          <svg style={{ position:"absolute", top:0, left:0, width, height, pointerEvents:"none", overflow:"visible" }}>
            <defs>
              {Object.entries(LEVEL_LINE_COLOR).map(([level, color]) => (
                <marker key={level} id={`arrow-${level}`} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill={color} opacity="0.5"/>
                </marker>
              ))}
            </defs>
            {edges.map(e => {
              const color = LEVEL_LINE_COLOR[e.level] || "#94a3b8";
              const my = (e.y1 + e.y2) / 2;
              return (
                <g key={e.id}>
                  <path
                    d={`M${e.x1},${e.y1} C${e.x1},${my} ${e.x2},${my} ${e.x2},${e.y2}`}
                    fill="none" stroke={color} strokeWidth={e.direct ? 2.5 : 1.5}
                    strokeDasharray={e.direct ? "none" : "6,4"} opacity={0.55}
                    markerEnd={`url(#arrow-${e.level})`}
                  />
                  <path id={`flow-${e.id}`}
                    d={`M${e.x1},${e.y1} C${e.x1},${my} ${e.x2},${my} ${e.x2},${e.y2}`}
                    fill="none" stroke="none"/>
                  <circle r="3" fill={color} opacity="0.7">
                    <animateMotion dur={e.direct?"2.5s":"3.8s"} repeatCount="indefinite">
                      <mpath xlinkHref={`#flow-${e.id}`}/>
                    </animateMotion>
                  </circle>
                </g>
              );
            })}
          </svg>
          {nodes.map(node => (
            <TreeNode key={node.id} node={node} onToggle={toggleNode} hoveredId={hoveredId} onHover={setHoveredId} networkTotal={networkStats.total}/>
          ))}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginTop:16 }}>
        {[
          { label:"Total Technicians", value: String(networkStats.total),    color:"#ff5a1f" },
          { label:"Direct (L1)",       value: String(networkStats.direct),   color:"#ff5a1f" },
          { label:"Indirect (L2+)",    value: String(networkStats.indirect), color:"#3b82f6" },
          { label:"Network Depth",     value: networkStats.depth > 0 ? `${networkStats.depth} Level${networkStats.depth !== 1 ? 's' : ''}` : "—", color:"#8b5cf6" },
        ].map(s => (
          <div key={s.label} style={{
            background:"#fff", borderRadius:12, padding:"14px 18px",
            boxShadow:"0 2px 8px rgba(0,0,0,0.05)", border:"1px solid #e8edf2", borderTop:`3px solid ${s.color}`
          }}>
            <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:s.color, marginTop:4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {hoveredNode && <NodeDetailCard node={hoveredNode}/>}
    </div>
  );
}

function ReferralTreePage() {
  const { data, loading } = window.usePageData('technicians', 'type=tree');

  // Use real tree from API, fall back to KD default (empty root)
  const treeData = data?.tree || window.KD.referralTree;
  const totalEarnings = treeData?.abdCommission ?? 0;

  if (loading) return <LoadingPage/>;

  // Count all nodes in tree
  function countNodes(node) {
    return 1 + (node.children || []).reduce((s, c) => s + countNodes(c), 0);
  }
  const totalNodes = treeData ? countNodes(treeData) - 1 : 0; // exclude root ABD node

  return (
    <div style={{ padding:"28px 32px", animation:"fadeIn 0.25s ease" }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <h2 style={{ fontSize:20, fontWeight:800, color:"#0f172a", margin:"0 0 4px" }}>Referral Network Tree</h2>
            <p style={{ fontSize:13, color:"#64748b", margin:0 }}>
              {totalNodes > 0
                ? `${totalNodes} technician${totalNodes !== 1 ? 's' : ''} in your network — click nodes to expand/collapse.`
                : 'No technicians yet — share your referral link to add your first direct technician.'}
            </p>
          </div>
          <div style={{ padding:"10px 18px", borderRadius:12, background:"rgba(255,90,31,0.08)", border:"1px solid rgba(255,90,31,0.2)" }}>
            <div style={{ fontSize:11, color:"#ff5a1f", fontWeight:600 }}>Total Earnings</div>
            <div style={{ fontSize:18, fontWeight:800, color:"#ff5a1f" }}>
              ₹{Number(totalEarnings).toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div style={{ marginTop:16, padding:"12px 18px", borderRadius:12, background:"#fff9f6",
          border:"1px solid #ffe0d0", display:"flex", gap:24, flexWrap:"wrap" }}>
          {[
            { label:"Direct (L1) Technician", pct:"25%", color:"#ff5a1f" },
            { label:"L1's Referrals (L2)", pct:"10%", color:"#3b82f6" },
            { label:"L2's Referrals (L3+)", pct:"10%", color:"#8b5cf6" },
          ].map(r => (
            <div key={r.label} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:r.color+"18", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:11, fontWeight:800, color:r.color }}>{r.pct}</span>
              </div>
              <span style={{ fontSize:12, color:"#64748b" }}>{r.label}</span>
            </div>
          ))}
          <div style={{ marginLeft:"auto", fontSize:12, color:"#94a3b8", display:"flex", alignItems:"center", gap:4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Chain continues infinitely
          </div>
        </div>
      </div>

      {totalNodes === 0
        ? <EmptyState icon="tree" title="Network abhi empty hai" sub="Add Technician button se referral link share karo — technician register hoga toh yahan tree mein aayega"/>
        : <ReferralTree data={treeData}/>
      }
    </div>
  );
}

Object.assign(window, { ReferralTreePage });

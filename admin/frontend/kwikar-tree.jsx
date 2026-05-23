// kwikar-tree.jsx — Interactive Referral Network Tree
const { useState, useEffect, useRef, useCallback, useMemo } = React;

const NW = 180, NH = 80, LGAP = 240, RGAP = 26;

function buildLayout(node, depth, yRef, exp) {
  const result = { ...node, depth, x: depth * LGAP, children_laid: [], collapsed: false };
  const open = exp.has(node.id) && node.children && node.children.length > 0;
  if (open) {
    const laid = node.children.map(c => buildLayout(c, depth + 1, yRef, exp));
    result.children_laid = laid;
    result.y = (laid[0].y + laid[laid.length - 1].y) / 2;
  } else {
    result.collapsed = (node.children && node.children.length > 0);
    result.y = yRef.y;
    yRef.y += NH + RGAP;
  }
  return result;
}

function flatNodes(node) {
  return [node, ...(node.children_laid || []).flatMap(flatNodes)];
}

function getEdges(node) {
  return (node.children_laid || []).flatMap(c => [{ from: node, to: c }, ...getEdges(c)]);
}

function nodeStyle(node) {
  if (node.role === 'admin')    return { bg:'rgba(34,211,238,.1)',   border:'rgba(34,211,238,.45)',  accent:'#22D3EE', glow:'rgba(34,211,238,.25)' };
  if (node.role === 'abd')      return { bg:'rgba(167,139,250,.1)',  border:'rgba(167,139,250,.4)',  accent:'#A78BFA', glow:'rgba(167,139,250,.2)' };
  if (node.status === 'suspended') return { bg:'rgba(248,113,113,.1)', border:'rgba(248,113,113,.4)', accent:'#F87171', glow:'rgba(248,113,113,.18)' };
  if (node.status === 'inactive' || node.status === 'offline') return { bg:'rgba(255,255,255,.03)', border:'rgba(255,255,255,.1)', accent:'#44475A', glow:'none' };
  if (node.status === 'pending') return { bg:'rgba(251,191,36,.08)',  border:'rgba(251,191,36,.35)',  accent:'#FBBF24', glow:'rgba(251,191,36,.15)' };
  return { bg:'rgba(52,211,153,.07)', border:'rgba(52,211,153,.32)', accent:'#34D399', glow:'rgba(52,211,153,.15)' };
}

function TreeNode({ node, isSelected, onSelect, onToggle }) {
  const [hov, setHov] = useState(false);
  const ns = nodeStyle(node);
  const hasKids = (node.children && node.children.length > 0) || node.collapsed;

  return (
    <div
      style={{ position:'absolute', left:node.x, top:node.y, width:NW, height:NH, background:isSelected?'rgba(34,211,238,.16)':hov?ns.bg:ns.bg, border:`1.5px solid ${isSelected?'#22D3EE':ns.border}`, borderRadius:12, padding:'9px 11px', cursor:'pointer', display:'flex', alignItems:'center', gap:9, boxShadow:isSelected?`0 0 22px ${ns.glow}`:hov?'0 4px 20px rgba(0,0,0,.4)':'0 2px 8px rgba(0,0,0,.25)', transition:'all .18s ease', userSelect:'none' }}
      onClick={() => onSelect(node)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <Avatar name={node.name} size={34} online={node.status === 'active'}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12.5, fontWeight:600, color:'#E5E7F0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{node.name}</div>
        <div style={{ fontSize:10.5, color:ns.accent, fontWeight:500, marginTop:1.5 }}>
          {node.role === 'admin' ? 'Super Admin' : node.role === 'abd' ? `ABD · ${node.city}` : node.cat || 'Technician'}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4 }}>
          <span className="kbadge" style={{ background:`${ns.accent}20`, color:ns.accent, fontSize:9.5, padding:'1px 6px' }}>{node.status}</span>
          {node.earnings > 0 && <span style={{ fontSize:10, color:'#34D399', fontWeight:500 }}>{fCur(node.earnings)}</span>}
          {node.refs > 0 && <span style={{ fontSize:10, color:'#8B8FA8' }}>↳{node.refs}</span>}
        </div>
      </div>
      {hasKids && (
        <button
          style={{ width:20, height:20, borderRadius:5, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.14)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:'pointer' }}
          onClick={e => { e.stopPropagation(); onToggle(node.id); }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.2)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,.1)'}
        >
          <Ico n={node.children_laid && node.children_laid.length > 0 ? 'chevDown' : 'chevRight'} s={10} c="#8B8FA8"/>
        </button>
      )}
    </div>
  );
}

function NodePopup({ node, onClose }) {
  const ns = nodeStyle(node);
  const roleLabel = node.role === 'admin' ? 'Super Admin' : node.role === 'abd' ? 'Area Business Director' : 'Technician';
  return (
    <div style={{ position:'absolute', top:70, right:16, width:280, zIndex:20 }} className="fade-up">
      <div style={{ background:'#0D0E16', border:`1px solid ${ns.border}`, borderRadius:14, overflow:'hidden', boxShadow:`0 20px 60px rgba(0,0,0,.6), 0 0 30px ${ns.glow}` }}>
        <div style={{ background:ns.bg, padding:'16px', display:'flex', alignItems:'center', gap:12, borderBottom:'1px solid rgba(255,255,255,.07)' }}>
          <Avatar name={node.name} size={44} online={node.status === 'active'}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:'Space Grotesk', fontSize:15, fontWeight:700, color:'#E5E7F0' }}>{node.name}</div>
            <div style={{ fontSize:11.5, color:ns.accent, marginTop:2 }}>{roleLabel}</div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', borderRadius:6, width:24, height:24, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Ico n="x" s={12} c="#8B8FA8"/>
          </button>
        </div>
        <div style={{ padding:'14px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
            {[
              { l:'Status', v:node.status, c:ns.accent },
              { l:'Plan', v:node.plan, c:'#A78BFA' },
              { l:'Earnings', v:node.earnings > 0 ? fCur(node.earnings) : '₹0', c:'#34D399' },
              { l:'Referrals', v:node.refs, c:'#22D3EE' },
              ...(node.city ? [{ l:'City', v:node.city, c:'#E5E7F0' }] : []),
              ...(node.cat  ? [{ l:'Category', v:node.cat,  c:'#E5E7F0' }] : []),
            ].map(m => (
              <div key={m.l} style={{ padding:'9px 11px', background:'rgba(255,255,255,.04)', borderRadius:8 }}>
                <div style={{ fontSize:10, color:'#44475A', marginBottom:3, textTransform:'uppercase', letterSpacing:'.04em' }}>{m.l}</div>
                <div style={{ fontSize:13, fontWeight:600, color:m.c }}>{m.v}</div>
              </div>
            ))}
          </div>
          {node.status === 'suspended' && (
            <div style={{ padding:'8px 12px', background:'rgba(248,113,113,.1)', border:'1px solid rgba(248,113,113,.3)', borderRadius:8, fontSize:11.5, color:'#F87171', marginBottom:10, display:'flex', gap:6, alignItems:'center' }}>
              <Ico n="alertCircle" s={13} c="#F87171"/>⚠ Account suspended — referral chain at risk
            </div>
          )}
          {node.status === 'pending' && (
            <div style={{ padding:'8px 12px', background:'rgba(251,191,36,.08)', border:'1px solid rgba(251,191,36,.3)', borderRadius:8, fontSize:11.5, color:'#FBBF24', marginBottom:10, display:'flex', gap:6, alignItems:'center' }}>
              <Ico n="clock" s={13} c="#FBBF24"/>KYC pending — limited platform access
            </div>
          )}
          <div style={{ display:'flex', gap:6 }}>
            <button className="kbtn p" style={{ flex:1, justifyContent:'center', fontSize:11.5 }}><Ico n="eye" s={12}/>View Profile</button>
            <button className="kbtn" style={{ flex:1, justifyContent:'center', fontSize:11.5 }}><Ico n="flag" s={12}/>Flag Node</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniMap({ nodes, pan, scale, treeW, treeH, containerW, containerH }) {
  const MW = 150, MH = 90;
  const sx = MW / Math.max(treeW, 1), sy = MH / Math.max(treeH, 1);
  const vpW = Math.min(MW, (containerW / scale) * sx);
  const vpH = Math.min(MH, (containerH / scale) * sy);
  const vpX = Math.max(0, (-pan.x / scale) * sx);
  const vpY = Math.max(0, (-pan.y / scale) * sy);
  return (
    <div style={{ position:'absolute', bottom:16, right:16, zIndex:10, background:'rgba(13,14,22,.9)', border:'1px solid rgba(255,255,255,.1)', borderRadius:10, padding:'10px', backdropFilter:'blur(12px)' }}>
      <div style={{ fontSize:9.5, color:'#44475A', marginBottom:6, letterSpacing:'.08em', textTransform:'uppercase' }}>Network Map</div>
      <div style={{ position:'relative', width:MW, height:MH, background:'rgba(255,255,255,.02)', borderRadius:6, overflow:'hidden' }}>
        {nodes.map(n => {
          const ns = nodeStyle(n);
          return <div key={n.id} style={{ position:'absolute', left:n.x*sx, top:n.y*sy, width:NW*sx, height:NH*sy, background:ns.accent, borderRadius:2, opacity:.6 }}/>;
        })}
        <div style={{ position:'absolute', left:vpX, top:vpY, width:vpW, height:vpH, border:'1px solid rgba(34,211,238,.7)', borderRadius:3, background:'rgba(34,211,238,.05)', pointerEvents:'none' }}/>
      </div>
    </div>
  );
}

function TreeSearch({ nodes, onFocus }) {
  const [q, setQ] = useState('');
  const results = q.length > 1 ? nodes.filter(n => n.name.toLowerCase().includes(q.toLowerCase())).slice(0,5) : [];
  return (
    <div style={{ position:'relative', width:220 }}>
      <div style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}><Ico n="search" s={13} c="#44475A"/></div>
      <input className="kinput" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search network…" style={{ paddingLeft:32, height:34, fontSize:12.5 }}/>
      {results.length > 0 && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, width:'100%', background:'#0D0E16', border:'1px solid rgba(255,255,255,.1)', borderRadius:9, overflow:'hidden', zIndex:20, boxShadow:'0 8px 32px rgba(0,0,0,.5)' }}>
          {results.map(n=>(
            <div key={n.id} style={{ padding:'9px 12px', display:'flex', alignItems:'center', gap:8, cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,.05)' }}
              onClick={()=>{ onFocus(n); setQ(''); }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.04)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <Avatar name={n.name} size={22}/>
              <div>
                <div style={{ fontSize:12, fontWeight:500, color:'#E5E7F0' }}>{n.name}</div>
                <div style={{ fontSize:10.5, color:'#8B8FA8' }}>{n.role} · {n.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReferralTreePage() {
  const ALL_IDS = ['root','abd1','abd2','abd3','t1','t2','t4','t5','t7'];
  const [exp, setExp] = useState(new Set(['root','abd1','abd2','abd3']));
  const [pan, setPan] = useState({ x:40, y:40 });
  const [scale, setScale] = useState(0.82);
  const [sel, setSel] = useState(null);
  const [dragState, setDragState] = useState(null);
  const containerRef = useRef(null);

  const layout = useMemo(() => {
    const yRef = { y: 0 };
    return buildLayout(KTREE, 0, yRef, exp);
  }, [exp]);

  const nodes = useMemo(() => flatNodes(layout), [layout]);
  const edges = useMemo(() => getEdges(layout),  [layout]);
  const treeW = Math.max(...nodes.map(n=>n.x)) + NW + 80;
  const treeH = Math.max(...nodes.map(n=>n.y)) + NH + 80;

  const handleWheel = useCallback(e => {
    e.preventDefault();
    setScale(s => Math.max(0.25, Math.min(2.2, s - e.deltaY * 0.0008)));
  }, []);

  const handleMD = useCallback(e => {
    if (e.target.closest('button') || e.button !== 0) return;
    setDragState({ sx:e.clientX, sy:e.clientY, ox:pan.x, oy:pan.y });
  }, [pan]);

  const handleMM = useCallback(e => {
    if (!dragState) return;
    setPan({ x: dragState.ox + e.clientX - dragState.sx, y: dragState.oy + e.clientY - dragState.sy });
  }, [dragState]);

  const handleMU = useCallback(() => setDragState(null), []);

  const toggleNode = useCallback(id => {
    setExp(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const focusNode = useCallback(node => {
    setSel(node);
    const cw = containerRef.current?.clientWidth || 800;
    const ch = containerRef.current?.clientHeight || 600;
    setPan({ x: cw/2 - (node.x + NW/2)*scale, y: ch/2 - (node.y + NH/2)*scale });
  }, [scale]);

  const containerW = containerRef.current?.clientWidth  || 900;
  const containerH = containerRef.current?.clientHeight || 600;

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.addEventListener('wheel', handleWheel, { passive: false });
    return () => { if (el) el.removeEventListener('wheel', handleWheel); };
  }, [handleWheel]);

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ background:'rgba(10,11,18,.85)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,.07)', padding:'10px 20px', display:'flex', alignItems:'center', gap:10, flexShrink:0, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginRight:'auto' }}>
          <div style={{ fontFamily:'Space Grotesk', fontSize:14, fontWeight:600 }}>Referral Network</div>
          <span style={{ fontSize:12, color:'#8B8FA8' }}>{nodes.length} nodes · {edges.length} connections</span>
        </div>
        <TreeSearch nodes={nodes} onFocus={focusNode}/>
        <div style={{ display:'flex', gap:6 }}>
          <button className="kbtn" style={{ padding:'5px 10px' }} onClick={()=>setScale(s=>Math.min(2.2,s+0.12))}><Ico n="plus" s={13}/></button>
          <button className="kbtn" style={{ padding:'5px 10px' }} onClick={()=>setScale(s=>Math.max(0.25,s-0.12))}><Ico n="x" s={13}/></button>
          <button className="kbtn" onClick={()=>{ setScale(0.82); setPan({x:40,y:40}); }}>Reset View</button>
          <button className="kbtn" onClick={()=>setExp(new Set(ALL_IDS))}><Ico n="chevDown" s={13}/>Expand All</button>
          <button className="kbtn" onClick={()=>setExp(new Set(['root']))}><Ico n="chevRight" s={13}/>Collapse</button>
        </div>
        <div style={{ display:'flex', gap:10, marginLeft:4 }}>
          {[{c:'#22D3EE',l:'Super Admin'},{c:'#A78BFA',l:'ABD'},{c:'#34D399',l:'Active Tech'},{c:'#F87171',l:'Suspended'}].map(m=>(
            <div key={m.l} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:m.c }}/>
              <span style={{ fontSize:11, color:'#8B8FA8' }}>{m.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div ref={containerRef} style={{ flex:1, position:'relative', overflow:'hidden', cursor:dragState?'grabbing':'grab', background:'radial-gradient(ellipse at 30% 40%, rgba(34,211,238,.03) 0%, transparent 60%), var(--bg)' }}
        onMouseDown={handleMD} onMouseMove={handleMM} onMouseUp={handleMU} onMouseLeave={handleMU}>
        <svg style={{ position:'absolute', inset:0, pointerEvents:'none', opacity:.4 }} width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="0.8" fill="rgba(255,255,255,.12)"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>

        <div style={{ transform:`translate(${pan.x}px,${pan.y}px) scale(${scale})`, transformOrigin:'0 0', position:'relative', width:treeW, height:treeH }}>
          <svg style={{ position:'absolute', inset:0, overflow:'visible', pointerEvents:'none' }} width={treeW} height={treeH}>
            <defs>
              <linearGradient id="edgeGrad1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="rgba(34,211,238,.55)"/><stop offset="100%" stopColor="rgba(167,139,250,.55)"/></linearGradient>
              <linearGradient id="edgeGrad2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="rgba(167,139,250,.55)"/><stop offset="100%" stopColor="rgba(52,211,153,.55)"/></linearGradient>
              <filter id="lineGlow"><feGaussianBlur stdDeviation="1.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            {edges.map((e,i) => {
              const x1=e.from.x+NW, y1=e.from.y+NH/2, x2=e.to.x, y2=e.to.y+NH/2, cx=(x1+x2)/2;
              const sus = e.to.status==='suspended'||e.to.status==='inactive';
              return (
                <path key={i}
                  d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
                  fill="none"
                  stroke={sus?'rgba(248,113,113,.35)':`url(#edgeGrad1)`}
                  strokeWidth={sus?1.2:1.8}
                  strokeDasharray={sus?'5,4':'none'}
                  filter={sus?'none':'url(#lineGlow)'}
                  opacity={sus?0.6:0.85}
                />
              );
            })}
          </svg>

          {nodes.map(node => (
            <TreeNode key={node.id} node={node} isSelected={sel?.id===node.id} onSelect={setSel} onToggle={toggleNode}/>
          ))}
        </div>
      </div>

      {sel && <NodePopup node={sel} onClose={()=>setSel(null)}/>}
      <MiniMap nodes={nodes} pan={pan} scale={scale} treeW={treeW} treeH={treeH} containerW={containerW} containerH={containerH}/>

      <div style={{ position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)', background:'rgba(13,14,22,.8)', border:'1px solid rgba(255,255,255,.1)', borderRadius:20, padding:'4px 14px', fontSize:11.5, color:'#8B8FA8', pointerEvents:'none', backdropFilter:'blur(8px)' }}>
        {Math.round(scale*100)}% · Scroll to zoom · Drag to pan
      </div>
    </div>
  );
}

Object.assign(window, { ReferralTreePage });

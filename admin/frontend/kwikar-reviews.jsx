// kwikar-reviews.jsx — Site Reviews Management
const { useState, useEffect, useCallback } = React;

const STARS = [1,2,3,4,5];

function StarDisplay({ rating }) {
  return (
    <span style={{ display:'inline-flex', gap:2 }}>
      {STARS.map(s => (
        <svg key={s} width="13" height="13" viewBox="0 0 24 24"
          fill={s <= rating ? '#FBBF24' : 'none'}
          stroke={s <= rating ? '#FBBF24' : 'var(--text3)'}
          strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    pending:  { bg:'var(--amber-d)', color:'var(--amber)', label:'Pending' },
    approved: { bg:'var(--green-d)',  color:'var(--green)',  label:'Approved' },
    rejected: { bg:'var(--red-d)',    color:'var(--red)',    label:'Rejected' },
  }[status] || { bg:'var(--card)', color:'var(--text2)', label:status };
  return (
    <span className="kbadge" style={{ background:cfg.bg, color:cfg.color }}>{cfg.label}</span>
  );
}

function ReviewsPage() {
  const [reviews, setReviews]     = useState([]);
  const [filter, setFilter]       = useState('all');
  const [loading, setLoading]     = useState(true);
  const [acting, setActing]       = useState(null);
  const [stats, setStats]         = useState({ total:0, pending:0, approved:0, rejected:0 });

  const load = useCallback(async (f = filter) => {
    setLoading(true);
    try {
      const res = await adminApi('reviews', { status: f, limit: 100 });
      if (res.status === 'success') {
        setReviews(res.reviews || []);
        // Compute stats from full list when fetching all
        if (f === 'all') {
          const all = res.reviews || [];
          setStats({
            total:    all.length,
            pending:  all.filter(r=>r.status==='pending').length,
            approved: all.filter(r=>r.status==='approved').length,
            rejected: all.filter(r=>r.status==='rejected').length,
          });
        }
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(filter); }, [filter]);

  async function doAction(id, action) {
    setActing(id + action);
    try {
      await adminApi('review_action', { review_id: id, action });
      load(filter);
    } catch(e) { console.error(e); }
    setActing(null);
  }

  const avgRating = reviews.length
    ? (reviews.reduce((s,r)=>s+Number(r.rating),0)/reviews.length).toFixed(1)
    : '—';

  const statCards = [
    { label:'Total Reviews', value:stats.total,    color:'var(--cyan)'   },
    { label:'Pending',       value:stats.pending,  color:'var(--amber)'  },
    { label:'Approved',      value:stats.approved, color:'var(--green)'  },
    { label:'Avg Rating',    value:avgRating + (avgRating!=='—'?' ★':''), color:'var(--purple)' },
  ];

  return (
    <div style={{ padding:'28px 32px', maxWidth:1100, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:20, fontWeight:700, color:'var(--text)', marginBottom:4 }}>Site Reviews</h1>
        <p style={{ fontSize:13, color:'var(--text3)' }}>Manage customer feedback submitted from the homepage</p>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {statCards.map(c => (
          <div key={c.label} className="kcard" style={{ padding:'16px 18px' }}>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em' }}>{c.label}</div>
            <div style={{ fontSize:26, fontWeight:700, color:c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:18 }}>
        {['all','pending','approved','rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding:'6px 16px', borderRadius:20, border:'1px solid', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
              background: filter===f ? 'var(--cyan)' : 'transparent',
              color:      filter===f ? '#000' : 'var(--text2)',
              borderColor:filter===f ? 'var(--cyan)' : 'var(--border)',
              textTransform:'capitalize' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--text3)', fontSize:13 }}>Loading…</div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--text3)', fontSize:13 }}>No reviews found</div>
      ) : (
        <div className="kcard" style={{ overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)' }}>
                {['Name / Phone','Rating','Review','Source','Status','Date','Actions'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reviews.map((r,i) => (
                <tr key={r.id} style={{ borderBottom: i<reviews.length-1 ? '1px solid var(--border-s)' : 'none', transition:'background .15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--card-h)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'12px 14px', minWidth:120 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{r.name || <span style={{color:'var(--text3)'}}>Anonymous</span>}</div>
                    {r.phone && <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{r.phone}</div>}
                  </td>
                  <td style={{ padding:'12px 14px' }}><StarDisplay rating={Number(r.rating)}/></td>
                  <td style={{ padding:'12px 14px', maxWidth:280 }}>
                    <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                      {r.review_text}
                    </div>
                  </td>
                  <td style={{ padding:'12px 14px' }}>
                    <span style={{ fontSize:11, color:'var(--text3)', background:'var(--card)', border:'1px solid var(--border)', borderRadius:4, padding:'2px 7px' }}>{r.page_source}</span>
                  </td>
                  <td style={{ padding:'12px 14px' }}><StatusBadge status={r.status}/></td>
                  <td style={{ padding:'12px 14px', whiteSpace:'nowrap', fontSize:11, color:'var(--text3)' }}>
                    {new Date(r.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                  </td>
                  <td style={{ padding:'12px 14px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      {r.status !== 'approved' && (
                        <button onClick={() => doAction(r.id,'approve')} disabled={acting===r.id+'approve'}
                          style={{ padding:'4px 10px', borderRadius:6, border:'none', background:'var(--green-d)', color:'var(--green)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', opacity:acting===r.id+'approve'?.5:1 }}>
                          Approve
                        </button>
                      )}
                      {r.status !== 'rejected' && (
                        <button onClick={() => doAction(r.id,'reject')} disabled={acting===r.id+'reject'}
                          style={{ padding:'4px 10px', borderRadius:6, border:'none', background:'var(--amber-d)', color:'var(--amber)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', opacity:acting===r.id+'reject'?.5:1 }}>
                          Reject
                        </button>
                      )}
                      <button onClick={() => { if(confirm('Delete this review?')) doAction(r.id,'delete'); }} disabled={acting===r.id+'delete'}
                        style={{ padding:'4px 10px', borderRadius:6, border:'none', background:'var(--red-d)', color:'var(--red)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', opacity:acting===r.id+'delete'?.5:1 }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

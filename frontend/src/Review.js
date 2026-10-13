import React, { useState, useEffect } from 'react';

const STATUS_COLORS = { DRAFT:'#94a3b8', IN_REVIEW:'#f59e0b', APPROVED:'#16a34a', CHANGES_REQUESTED:'#dc2626' };
const STATUS_LABELS = { DRAFT:'DRAFT', IN_REVIEW:'IN REVIEW', APPROVED:'APPROVED', CHANGES_REQUESTED:'CHANGES REQ.' };

export default function Review({ projects }) {
  const [reviewDocs, setReviewDocs] = useState([]);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [reviewerName, setReviewerName] = useState('');
  const [comment, setComment] = useState('');
  const [regenerating, setRegenerating] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadReviewDocs(); }, [projects]);

  const loadReviewDocs = async () => {
    setLoading(true);
    try {
      const fresh = await fetch('/api/projects').then(r => r.json());
      const docs = [];
      for (const proj of (Array.isArray(fresh) ? fresh : projects)) {
        (proj.documents || []).filter(d => d.fileName && ['IN_REVIEW','CHANGES_REQUESTED'].includes(d.status)).forEach(d => {
          docs.push({ ...d, projectId: proj.id, projectName: proj.name, client: proj.client });
        });
      }
      setReviewDocs(docs);
    } catch(e) { console.error('Review load failed:', e); }
    setLoading(false);
  };

  const openDoc = async (doc) => {
    const fp = encodeURIComponent(doc.filePath || doc.fileName);
    const r = await fetch('http://localhost:3002/download/' + doc.projectId + '/' + fp);
    const html = await r.text();
    setViewingDoc({ ...doc, html });
  };

  const updateStatus = async (doc, status) => {
    await fetch('http://localhost:3002/documents/' + doc.projectId + '/status', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: doc.fileName, filePath: doc.filePath, status, reviewer: reviewerName || 'Reviewer', comment })
    });
    setComment('');
    setViewingDoc(null);
    loadReviewDocs();
  };

  const regenerate = async (doc) => {
    const comments = (doc.comments||[]).map(c => c.text).join('; ');
    if (!window.confirm('Regenerate ' + doc.agentName + ' with reviewer feedback?\n\nFeedback: ' + comments)) return;
    setRegenerating(doc.fileName);
    try {
      const r = await fetch('http://localhost:3002/rerun-agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: doc.projectId, agentId: doc.agentId, agentName: doc.agentName, filePath: doc.filePath, reviewComments: comments })
      });
      const d = await r.json();
      if (d.success) alert(d.message || 'Regenerating in background. New version will appear in Documents tab when done.');
      else alert('Failed: ' + (d.error || 'Unknown'));
    } catch(e) { alert('Error: ' + e.message); }
    setRegenerating(null);
  };

  if (viewingDoc) {
    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column', height:'calc(100vh - 60px)' }}>
        <div style={{ padding:'8px 16px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={() => setViewingDoc(null)} style={{ padding:'4px 12px', borderRadius:6, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:12 }}>← Back</button>
          <span style={{ fontSize:13, fontWeight:600, flex:1 }}>{viewingDoc.agentName} — {viewingDoc.projectName}</span>
          <span style={{ fontSize:11, fontWeight:700, color: STATUS_COLORS[viewingDoc.status]||'#94a3b8', background:(STATUS_COLORS[viewingDoc.status]||'#94a3b8')+'20', padding:'2px 8px', borderRadius:10 }}>{STATUS_LABELS[viewingDoc.status]||viewingDoc.status}</span>
        </div>
        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
          <iframe srcDoc={viewingDoc.html} style={{ flex:1, border:'none' }} title={viewingDoc.agentName} />
          <div style={{ width:280, borderLeft:'1px solid #e2e8f0', display:'flex', flexDirection:'column', background:'#f8fafc' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid #e2e8f0', fontWeight:600, fontSize:13, color:'#1e293b' }}>Review Panel</div>
            <div style={{ padding:16, flex:1, overflowY:'auto' }}>
              <label style={{ fontSize:12, fontWeight:600, color:'#374151' }}>Your Name</label>
              <input value={reviewerName} onChange={e => setReviewerName(e.target.value)} placeholder="e.g. Vikram Sharma" style={{ width:'100%', padding:'6px 8px', borderRadius:6, border:'1px solid #e2e8f0', marginBottom:12, fontSize:12, marginTop:4, boxSizing:'border-box' }} />
              <label style={{ fontSize:12, fontWeight:600, color:'#374151' }}>Comments</label>
              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add review comments..." style={{ width:'100%', padding:'6px 8px', borderRadius:6, border:'1px solid #e2e8f0', marginBottom:12, fontSize:12, marginTop:4, height:100, resize:'vertical', boxSizing:'border-box' }} />
              {(viewingDoc.comments||[]).length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#64748b', marginBottom:6 }}>Previous Comments</div>
                  {(viewingDoc.comments||[]).map((c, i) => (
                    <div key={i} style={{ fontSize:11, background:'#fff', padding:'6px 8px', borderRadius:6, border:'1px solid #e2e8f0', marginBottom:4 }}>
                      <span style={{ fontWeight:600 }}>{c.by}</span>: {c.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding:12, borderTop:'1px solid #e2e8f0', display:'flex', flexDirection:'column', gap:8 }}>
              <button onClick={() => updateStatus(viewingDoc, 'APPROVED')} style={{ padding:'8px', borderRadius:6, border:'none', background:'#16a34a', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>✓ Approve</button>
              <button onClick={() => updateStatus(viewingDoc, 'CHANGES_REQUESTED')} style={{ padding:'8px', borderRadius:6, border:'none', background:'#dc2626', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>Request Changes</button>
              <button onClick={() => setViewingDoc(null)} style={{ padding:'8px', borderRadius:6, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:12 }}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex:1, padding:24, overflowY:'auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:'#1e293b' }}>Review Queue</div>
          <div style={{ fontSize:12, color:'#64748b' }}>Documents pending review or requiring changes</div>
        </div>
        <button onClick={loadReviewDocs} style={{ padding:'6px 14px', borderRadius:6, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', fontSize:12 }}>↺ Refresh</button>
      </div>
      {loading && <div style={{ textAlign:'center', color:'#94a3b8', padding:40 }}>Loading...</div>}
      {!loading && reviewDocs.length === 0 && (
        <div style={{ textAlign:'center', padding:60, color:'#94a3b8' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✓</div>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:4 }}>No documents in review</div>
          <div style={{ fontSize:13 }}>Send documents for review from the Documents tab</div>
        </div>
      )}
      {reviewDocs.map((doc, i) => (
        <div key={i} style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:16, marginBottom:12, display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:600, color:'#1e293b' }}>{doc.agentName}</div>
            <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{doc.projectName} · {doc.filePath || doc.fileName}</div>
            {(doc.comments||[]).length > 0 && (
              <div style={{ fontSize:11, color:'#dc2626', marginTop:4 }}>💬 {doc.comments[doc.comments.length-1].text}</div>
            )}
          </div>
          <span style={{ fontSize:11, fontWeight:700, color: STATUS_COLORS[doc.status], background: STATUS_COLORS[doc.status]+'20', padding:'3px 10px', borderRadius:10, whiteSpace:'nowrap' }}>{STATUS_LABELS[doc.status]}</span>
          <button onClick={() => openDoc(doc)} style={{ padding:'6px 14px', borderRadius:6, border:'none', background:'#1e40af', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, whiteSpace:'nowrap' }}>Review</button>
          {doc.status === 'CHANGES_REQUESTED' && (
            <button disabled={regenerating===doc.fileName} onClick={() => regenerate(doc)} style={{ padding:'6px 14px', borderRadius:6, border:'1px solid #7c3aed', background: regenerating===doc.fileName ? '#7c3aed' : '#fff', color: regenerating===doc.fileName ? '#fff' : '#7c3aed', cursor:'pointer', fontSize:12, whiteSpace:'nowrap' }}>
              {regenerating===doc.fileName ? 'Regenerating...' : 'Regenerate'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

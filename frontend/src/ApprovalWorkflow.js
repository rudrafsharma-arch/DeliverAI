import React, { useState } from 'react';

const BLUE = '#0070F2', GREEN = '#16a34a', AMBER = '#d97706', PURPLE = '#7c3aed';

const STATUS_CONFIG = {
  draft:    { label:'DRAFT',     color:AMBER,  bg:'#fffbeb', border:'#fde68a', icon:'📝' },
  review:   { label:'IN REVIEW', color:BLUE,   bg:'#e8f2ff', border:'#bfdbfe', icon:'👀' },
  approved: { label:'APPROVED',  color:GREEN,  bg:'#f0fdf4', border:'#86efac', icon:'✅' },
  locked:   { label:'LOCKED',    color:PURPLE, bg:'#f5f3ff', border:'#ddd6fe', icon:'🔒' },
};

export default function ApprovalWorkflow({ job, onStatusChange }) {
  const [status, setStatus] = useState(job.approvalStatus || 'draft');
  const [approvers, setApprovers] = useState(job.approvers || []);
  const [comments, setComments] = useState(job.comments || []);
  const [newComment, setNewComment] = useState('');
  const [approverName, setApproverName] = useState('Vikram Sharma');
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  const changeStatus = (newStatus) => {
    setStatus(newStatus);
    if (onStatusChange) onStatusChange(job.jobId, newStatus, approvers);
  };

  const handleApprove = () => {
    const newApp = {
      id: Date.now(),
      name: approverName.trim() || 'Vikram Sharma',
      role: 'SAP Consultant',
      approvedAt: new Date().toISOString()
    };
    const updated = [...approvers, newApp];
    setApprovers(updated);
    setStatus('approved');
    if (onStatusChange) onStatusChange(job.jobId, 'approved', updated);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments(c => [...c, { id:Date.now(), text:newComment.trim(), author:'Vikram Sharma', createdAt:new Date().toISOString() }]);
    setNewComment('');
  };

  return (
    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden', marginBottom:12 }}>
      <div style={{ padding:'12px 16px', background:cfg.bg, borderBottom:'1px solid '+cfg.border, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <span style={{ fontSize:20 }}>{cfg.icon}</span>
        <span style={{ fontWeight:700, fontSize:14, color:cfg.color }}>{cfg.label}</span>
        <span style={{ fontSize:11, color:'#64748b' }}>
          {status === 'draft' && 'AI-generated. Review before sharing with client.'}
          {status === 'review' && 'Sent for review. Waiting for approval.'}
          {status === 'approved' && 'Approved. Ready to share with client.'}
          {status === 'locked' && 'Locked. No further changes allowed.'}
        </span>
        <div style={{ marginLeft:'auto', display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          {status === 'draft' && (
            <button onClick={()=>changeStatus('review')}
              style={{ padding:'5px 12px', borderRadius:8, border:'none', background:BLUE, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>
              Send for Review
            </button>
          )}
          {status === 'review' && (
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <input value={approverName} onChange={e=>setApproverName(e.target.value)}
                placeholder="Your name"
                style={{ border:'1px solid #e2e8f0', borderRadius:6, padding:'4px 8px', fontSize:12, outline:'none', width:130 }}/>
              <button onClick={handleApprove}
                style={{ padding:'5px 12px', borderRadius:8, border:'none', background:GREEN, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                Approve
              </button>
              <button onClick={()=>changeStatus('draft')}
                style={{ padding:'5px 10px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:12, color:'#64748b' }}>
                Return to Draft
              </button>
            </div>
          )}
          {status === 'approved' && (
            <button onClick={()=>changeStatus('locked')}
              style={{ padding:'5px 12px', borderRadius:8, border:'none', background:PURPLE, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>
              Lock Document
            </button>
          )}
        </div>
      </div>

      <div style={{ padding:14, display:'flex', gap:14 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:600, fontSize:11, marginBottom:8, color:'#94a3b8', letterSpacing:0.5 }}>APPROVERS</div>
          {approvers.length === 0 ? (
            <div style={{ fontSize:12, color:'#94a3b8', fontStyle:'italic' }}>No approvers yet</div>
          ) : (
            approvers.map(a => (
              <div key={a.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, padding:'6px 10px', background:'#f0fdf4', borderRadius:8, border:'1px solid #86efac' }}>
                <span>✅</span>
                <div>
                  <div style={{ fontWeight:600, fontSize:12, color:'#15803d' }}>{a.name}</div>
                  <div style={{ fontSize:10, color:'#64748b' }}>{a.role} · {new Date(a.approvedAt).toLocaleString()}</div>
                </div>
              </div>
            ))
          )}
          {status === 'locked' && (
            <div style={{ marginTop:8, padding:'8px 10px', background:'#f5f3ff', borderRadius:8, border:'1px solid #ddd6fe', fontSize:11, color:PURPLE }}>
              Locked on {new Date().toLocaleDateString()}. No further changes allowed.
            </div>
          )}
        </div>

        <div style={{ flex:1 }}>
          <div style={{ fontWeight:600, fontSize:11, marginBottom:8, color:'#94a3b8', letterSpacing:0.5 }}>REVIEW COMMENTS</div>
          <div style={{ maxHeight:120, overflowY:'auto', marginBottom:8 }}>
            {comments.length === 0 ? (
              <div style={{ fontSize:12, color:'#94a3b8', fontStyle:'italic' }}>No comments yet</div>
            ) : (
              comments.map(c => (
                <div key={c.id} style={{ marginBottom:6, padding:'6px 10px', background:'#f8fafc', borderRadius:8, border:'1px solid #e2e8f0' }}>
                  <div style={{ fontSize:11, fontWeight:600 }}>{c.author}</div>
                  <div style={{ fontSize:12, color:'#475569', marginTop:2 }}>{c.text}</div>
                  <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>{new Date(c.createdAt).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
          {status !== 'locked' && (
            <div style={{ display:'flex', gap:6 }}>
              <input value={newComment} onChange={e=>setNewComment(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&handleAddComment()}
                placeholder="Add a review comment..."
                style={{ flex:1, border:'1px solid #e2e8f0', borderRadius:8, padding:'6px 10px', fontSize:12, outline:'none', fontFamily:'inherit' }}/>
              <button onClick={handleAddComment}
                style={{ padding:'6px 12px', borderRadius:8, border:'none', background:BLUE, color:'#fff', cursor:'pointer', fontSize:12 }}>
                Add
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

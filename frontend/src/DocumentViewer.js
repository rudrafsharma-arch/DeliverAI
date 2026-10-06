import React, { useState, useEffect } from 'react';
import { startRefineJob, subscribe, unsubscribe, getJobs } from './JobManager';
import ApprovalWorkflow from './ApprovalWorkflow';


const BLUE = '#0070F2', GREEN = '#16a34a', RED = '#dc2626';

export default function DocumentViewer({ job, onClose }) {
  const [refineInput, setRefineInput] = useState('');
  const [refining, setRefining] = useState(false);
  const [currentHtml, setCurrentHtml] = useState(job.result?.html || '');
  const [originalHtml, setOriginalHtml] = useState(job.result?.html || '');
  const [refined, setRefined] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(job.approvalStatus || 'draft');
  const [error, setError] = useState(null);

  const downloadHTML = () => {
    const blob = new Blob([currentHtml], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = job.result?.fileName || 'document.html';
    a.click();
  };

  const printDoc = () => {
    const w = window.open('', '_blank');
    w.document.write(currentHtml);
    w.document.close();
    w.print();
  };

  const [refineJobId, setRefineJobId] = useState(null);

  useEffect(() => {
    subscribe('viewer-refine', (jobs) => {
      if (!refineJobId) return;
      const job2 = jobs.find(j => j.jobId === refineJobId);
      if (!job2) return;
      if (job2.status === 'completed' && job2.result?.html) {
        setCurrentHtml(job2.result.html);
        setRefining(false);
        setRefined(true);
        setRefineJobId(null);
      } else if (job2.status === 'failed') {
        setError('Refinement failed: ' + job2.error);
        setRefining(false);
        setRefineJobId(null);
      }
    });
    return () => unsubscribe('viewer-refine');
  }, [refineJobId]);

  const handleRefine = () => {
    if (!refineInput.trim() || refining) return;
    setRefining(true);
    setError(null);
    const instruction = refineInput.trim();
    setRefineInput('');
    const jobId = startRefineJob(
      job.agentId, job.agentName, job.projectId,
      job.formData || {}, currentHtml, instruction
    );
    setRefineJobId(jobId);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onClose} style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13 }}>Back</button>
        <span style={{ fontSize:20 }}>{job.agentId === 'blueprint' ? '📋' : job.agentId === 'functional-spec' ? '📄' : job.agentId === 'technical-spec' ? '⚙️' : job.agentId === 'test-scripts' ? '🧪' : '📄'}</span>
        <div>
          <div style={{ fontWeight:700, fontSize:15 }}>{job.agentName}</div>
          <div style={{ fontSize:11, color:'#94a3b8' }}>{job.formData?.projectName} · Generated {new Date(job.completedAt).toLocaleString()}</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          <button onClick={downloadHTML} style={{ padding:'7px 14px', borderRadius:8, border:'none', background:BLUE, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>Download HTML</button>
          <button onClick={printDoc} style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:12 }}>Print / PDF</button>
        </div>
      </div>

      <ApprovalWorkflow
        job={{...job, approvalStatus}}
        onStatusChange={(jobId, newStatus) => setApprovalStatus(newStatus)}
      />

      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:14, opacity: approvalStatus==='locked'?0.5:1, pointerEvents: approvalStatus==='locked'?'none':'auto' }}>
        <div style={{ fontWeight:600, fontSize:13, marginBottom:6 }}>Refine with AI</div>
        <div style={{ fontSize:11, color:'#94a3b8', marginBottom:8 }}>Tell the agent what to change — it will regenerate the improved document</div>
        <div style={{ display:'flex', gap:8 }}>
          <input value={refineInput} onChange={e => setRefineInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRefine()}
            placeholder="e.g. Make executive summary shorter, Add data migration risks, Change tone to formal..."
            style={{ flex:1, border:'1px solid #e2e8f0', borderRadius:8, padding:'8px 11px', fontSize:13, outline:'none', fontFamily:'inherit' }}/>
          <button onClick={handleRefine} disabled={refining || !refineInput.trim()}
            style={{ padding:'8px 20px', borderRadius:8, border:'none', background: refining ? '#94a3b8' : BLUE, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>
            {refining ? 'Refining...' : 'Refine'}
          </button>
        </div>
        {refining && (
          <div style={{ marginTop:8, fontSize:12, color:BLUE, display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:12, height:12, border:'2px solid #bfdbfe', borderTop:'2px solid '+BLUE, borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
            Claude is refining your document...
            <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
          </div>
        )}
        {error && <div style={{ marginTop:8, fontSize:12, color:RED }}>{error}</div>}
        {refined && !refining && (
          <div style={{ marginTop:8, display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ fontSize:11, color:GREEN, fontWeight:600 }}>Document refined successfully</span>
            <button onClick={() => { setCurrentHtml(originalHtml); setRefined(false); }}
              style={{ fontSize:11, padding:'2px 8px', borderRadius:6, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', color:'#64748b' }}>
              Undo — restore original
            </button>
          </div>
        )}
        <div style={{ marginTop:10, borderTop:'1px solid #f1f5f9', paddingTop:8 }}>
          <div style={{ fontSize:11, color:'#94a3b8', marginBottom:4 }}>Quick refinements:</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {[
              'Make executive summary more concise',
              'Add more detail to gap analysis',
              'Make tone more formal',
              'Add data migration risks',
              'Expand integration points section',
              'Add Accenture branding'
            ].map(suggestion => (
              <button key={suggestion} onClick={() => setRefineInput(suggestion)}
                style={{ fontSize:11, padding:'3px 8px', borderRadius:6, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', color:'#475569' }}>
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden', flex:1 }}>
        <div style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0', padding:'8px 12px', display:'flex', alignItems:'center', gap:5 }}>
          {['#f87171','#fbbf24','#34d399'].map(c => <div key={c} style={{ width:10, height:10, borderRadius:'50%', background:c }}/>)}
          <span style={{ fontSize:11, color:'#94a3b8', marginLeft:5 }}>{job.result?.fileName}</span>
          {refined && <span style={{ fontSize:10, background:'#e8f2ff', color:BLUE, padding:'1px 6px', borderRadius:6, marginLeft:'auto', fontWeight:600 }}>REFINED</span>}
        </div>
        <iframe srcDoc={currentHtml} style={{ display:'block', width:'100%', height:600, border:'none' }} title="Document Preview"/>
      </div>
    </div>
  );
}

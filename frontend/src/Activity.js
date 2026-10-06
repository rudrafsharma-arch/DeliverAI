import React, { useState, useEffect } from 'react';
import { getJobs, cancelJob, clearJob, clearCompleted, subscribe, unsubscribe, updateApproval } from './JobManager';
import DocumentViewer from './DocumentViewer';

const BLUE = '#0070F2', GREEN = '#16a34a', RED = '#dc2626', AMBER = '#d97706';

const statusColor = { running: BLUE, completed: GREEN, failed: RED, cancelled: AMBER };
const statusIcon = { running: '🔄', completed: '✅', failed: '❌', cancelled: '⚠️' };

function groupJobs(jobs) {
  const groups = {};
  jobs.forEach(job => {
    const key = job.agentId + '|' + (job.projectId || 'no-project');
    if (!groups[key]) {
      groups[key] = { agentId: job.agentId, agentName: job.agentName, projectId: job.projectId, projectName: job.formData?.projectName || 'Unknown', jobs: [] };
    }
    groups[key].jobs.push(job);
  });
  // Sort jobs within each group by date
  Object.values(groups).forEach(g => {
    g.jobs.sort((a,b) => new Date(b.startedAt) - new Date(a.startedAt));
  });
  return Object.values(groups).sort((a,b) => new Date(b.jobs[0].startedAt) - new Date(a.jobs[0].startedAt));
}

export default function Activity({ onChainAgent }) {
  const [jobs, setJobs] = useState(getJobs());
  const [viewingJob, setViewingJob] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    subscribe('activity', setJobs);
    return () => unsubscribe('activity');
  }, []);

  const toggleGroup = (key) => setExpandedGroups(e => ({ ...e, [key]: !e[key] }));

  const openJob = async (job) => {
    if (job.result && job.result.html) { setViewingJob(job); return; }
    if (job.result && job.result.fileName && job.projectId) {
      try {
        const r = await fetch('http://localhost:3002/download/' + job.projectId + '/' + job.result.fileName);
        const html = await r.text();
        setViewingJob({ ...job, result: { ...job.result, html } });
      } catch(e) { alert('Could not load document'); }
    }
  };

  const downloadJob = (job) => {
    if (!job.result) return;
    const blob = new Blob([job.result.html || ''], { type:'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = job.result.fileName || 'document.html';
    a.click();
  };

  if (viewingJob) return <DocumentViewer job={viewingJob} onClose={() => setViewingJob(null)} />;

  const groups = groupJobs(jobs);
  const runningCount = jobs.filter(j => j.status === 'running').length;

  if (groups.length === 0) return (
    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:48, textAlign:'center', color:'#94a3b8' }}>
      <div style={{ fontSize:32, marginBottom:10 }}>📋</div>
      <div style={{ fontSize:14, marginBottom:4 }}>No activity yet</div>
      <div style={{ fontSize:12 }}>Generate a document to see it here</div>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
        <div style={{ fontWeight:600, fontSize:14 }}>
          Activity
          {runningCount > 0 && <span style={{ marginLeft:8, fontSize:11, background:'#e8f2ff', color:BLUE, padding:'2px 8px', borderRadius:10, fontWeight:600 }}>{runningCount} running</span>}
          <span style={{ marginLeft:8, fontSize:11, color:'#94a3b8', fontWeight:400 }}>{groups.length} documents · {jobs.length} versions</span>
        </div>
        <button onClick={clearCompleted} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', fontSize:11, color:'#64748b' }}>Clear completed</button>
      </div>

      {groups.map(group => {
        const key = group.agentId + '|' + (group.projectId || 'no-project');
        const isExpanded = expandedGroups[key];
        const latest = group.jobs[0];
        const hasRunning = group.jobs.some(j => j.status === 'running');
        const allCompleted = group.jobs.every(j => j.status === 'completed');
        const groupStatus = hasRunning ? 'running' : latest.status;

        return (
          <div key={key} style={{ background:'#fff', border:'1px solid', borderColor: hasRunning ? BLUE+'44' : '#e2e8f0', borderRadius:12, overflow:'hidden' }}>
            
            {/* Group header - compact */}
            <div style={{ padding:'10px 14px', display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => toggleGroup(key)}>
              <span style={{ fontSize:18 }}>{statusIcon[groupStatus]}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13, color:'#1e293b' }}>{group.agentName}</div>
                <div style={{ fontSize:11, color:'#94a3b8' }}>
                  {group.projectName} · {group.jobs.length} version{group.jobs.length>1?'s':''} · Latest: {new Date(latest.startedAt).toLocaleTimeString()}
                  {latest.result?.fileName && <span style={{ marginLeft:6, color:'#64748b' }}>· {latest.result.fileName.split('_').pop()}</span>}
                </div>
              </div>
              <span style={{ fontSize:10, padding:'2px 8px', borderRadius:8, fontWeight:600, background:statusColor[groupStatus]+'22', color:statusColor[groupStatus] }}>{groupStatus.toUpperCase()}</span>
              {allCompleted && (
                <button onClick={e=>{e.stopPropagation(); openJob(latest);}} style={{ padding:'4px 10px', borderRadius:6, border:'none', background:BLUE, color:'#fff', cursor:'pointer', fontSize:11, fontWeight:600 }}>Open Latest</button>
              )}
              {hasRunning && (
                <div style={{ fontSize:11, color:BLUE }}>Generating...</div>
              )}

              <span style={{ fontSize:12, color:'#94a3b8' }}>{isExpanded ? '▲' : '▼'}</span>
            </div>

            {/* Running progress bar */}
            {hasRunning && (
              <div style={{ padding:'0 14px 8px' }}>
                <div style={{ height:3, background:'#f1f5f9', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:BLUE, borderRadius:2, animation:'progress 2s ease-in-out infinite' }}/>
                </div>
                <div style={{ fontSize:11, color:BLUE, marginTop:3 }}>
                  {group.jobs.find(j=>j.status==='running')?.logs?.slice(-1)[0]?.msg || 'Generating...'}
                </div>
              </div>
            )}

            {/* Expanded versions */}
            {isExpanded && (
              <div style={{ borderTop:'1px solid #f1f5f9' }}>
                {group.jobs.map((job, idx) => (
                  <div key={job.jobId} style={{ padding:'8px 14px', borderBottom:'1px solid #f8fafc', display:'flex', alignItems:'center', gap:8, background: idx===0?'#fafcff':'#fff' }}>
                    <span style={{ fontSize:12, color:'#94a3b8', minWidth:20, fontWeight:idx===0?700:400 }}>v{group.jobs.length - idx}</span>
                    <span style={{ fontSize:14 }}>{statusIcon[job.status]}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:'#1e293b', fontWeight:idx===0?600:400 }}>
                        {idx===0?'Latest':'Version '+(group.jobs.length-idx)} · {new Date(job.startedAt).toLocaleString()}
                        {job.isRefinement && <span style={{ marginLeft:6, fontSize:10, color:BLUE, background:'#e8f2ff', padding:'1px 5px', borderRadius:4 }}>Refined</span>}
                      </div>
                      {job.completedAt && <div style={{ fontSize:10, color:'#94a3b8' }}>Took {Math.round((new Date(job.completedAt)-new Date(job.startedAt))/1000)}s</div>}
                    </div>
                    <div style={{ display:'flex', gap:4 }}>
                      {job.status==='completed' && <button onClick={()=>openJob(job)} style={{ padding:'3px 8px', borderRadius:6, border:'none', background:BLUE, color:'#fff', cursor:'pointer', fontSize:11, fontWeight:600 }}>Open</button>}
                      {job.status==='completed' && job.result?.html && <button onClick={()=>downloadJob(job)} style={{ padding:'3px 8px', borderRadius:6, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:11 }}>⬇</button>}
                      {job.status==='running' && <button onClick={()=>cancelJob(job.jobId)} style={{ padding:'3px 8px', borderRadius:6, border:'1px solid #fecaca', background:'#fef2f2', cursor:'pointer', fontSize:11, color:RED }}>Cancel</button>}
                      <button onClick={()=>clearJob(job.jobId)} style={{ padding:'3px 8px', borderRadius:6, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:11, color:'#94a3b8' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <style>{'@keyframes progress{0%{width:20%}50%{width:80%}100%{width:20%}}'}</style>
    </div>
  );
}

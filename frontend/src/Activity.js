import React, { useState, useEffect } from 'react';
import { getJobs, cancelJob, clearJob, clearCompleted, subscribe, unsubscribe } from './JobManager';
import DocumentViewer from './DocumentViewer';



const BLUE = '#0070F2', GREEN = '#16a34a', RED = '#dc2626', AMBER = '#d97706';

const statusColor = { running: BLUE, completed: GREEN, failed: RED, cancelled: AMBER };
const statusIcon = { running: '🔄', completed: '✅', failed: '❌', cancelled: '⚠️' };

export default function Activity() {
  const [jobs, setJobs] = useState(getJobs());
  const [expandedJob, setExpandedJob] = useState(null);
  const [viewingJob, setViewingJob] = useState(null);

  useEffect(() => {
    subscribe('activity', setJobs);
    return () => unsubscribe('activity');
  }, []);

  const downloadResult = (job) => {
    if (!job.result) return;
    const blob = new Blob([job.result.html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = job.result.fileName;
    a.click();
  };

  const runningJobs = jobs.filter(j => j.status === 'running');
  const completedJobs = jobs.filter(j => j.status !== 'running');

  if (viewingJob) {
    return <DocumentViewer job={viewingJob} onClose={() => setViewingJob(null)} />;
  }

  if (jobs.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 48, textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
        <div style={{ fontSize: 14, marginBottom: 4 }}>No activity yet</div>
        <div style={{ fontSize: 12 }}>Generate a document to see it here</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          Activity Dashboard
          {runningJobs.length > 0 && (
            <span style={{ marginLeft: 8, fontSize: 11, background: '#e8f2ff', color: BLUE, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
              {runningJobs.length} running
            </span>
          )}
        </div>
        {completedJobs.length > 0 && (
          <button onClick={clearCompleted} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 11, color: '#64748b' }}>
            Clear completed
          </button>
        )}
      </div>

      {jobs.map(job => (
        <div key={job.jobId} style={{ background: '#fff', border: '1px solid', borderColor: job.status === 'running' ? BLUE + '44' : '#e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{statusIcon[job.status]}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{job.agentName}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                {job.formData?.projectName || 'Unknown project'} · Started {new Date(job.startedAt).toLocaleTimeString()}
                {job.completedAt && ' · Took ' + Math.round((new Date(job.completedAt) - new Date(job.startedAt)) / 1000) + 's'}
              </div>
            </div>
            <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 8, fontWeight: 600, background: statusColor[job.status] + '22', color: statusColor[job.status] }}>
              {job.status.toUpperCase()}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {job.status === 'running' && (
                <button onClick={() => cancelJob(job.jobId)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontSize: 11, color: RED }}>Cancel</button>
              )}
              {job.status === 'completed' && (
                <button onClick={async () => {
                  if (job.result && job.result.html) {
                    setViewingJob(job);
                  } else if (job.result && job.result.fileName && job.projectId) {
                    try {
                      const r = await fetch('/api/download/' + job.projectId + '/' + job.result.fileName);
                      const html = await r.text();
                      setViewingJob({ ...job, result: { ...job.result, html } });
                    } catch(e) { alert('Could not load document: ' + e.message); }
                  } else {
                    alert('Document HTML not available. Please regenerate.');
                  }
                }} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: BLUE, cursor: 'pointer', fontSize: 11, color: '#fff', fontWeight: 600 }}>Open</button>
              )}
              {job.status === 'completed' && job.result && (
                <button onClick={() => downloadResult(job)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 11, color: '#64748b' }}>Download</button>
              )}
              {job.status !== 'running' && (
                <button onClick={() => clearJob(job.jobId)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 11, color: '#64748b' }}>Remove</button>
              )}
              <button onClick={() => setExpandedJob(expandedJob === job.jobId ? null : job.jobId)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 11, color: '#64748b' }}>
                {expandedJob === job.jobId ? 'Hide logs' : 'View logs'}
              </button>
            </div>
          </div>

          {job.status === 'running' && (
            <div style={{ padding: '0 16px 8px' }}>
              <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: BLUE, borderRadius: 2, animation: 'progress 2s ease-in-out infinite' }}/>
              </div>
              <div style={{ fontSize: 11, color: BLUE, marginTop: 4 }}>
                {job.logs.length > 0 ? job.logs[job.logs.length - 1].msg : 'Starting...'}
              </div>
            </div>
          )}

          {job.status === 'failed' && job.error && (
            <div style={{ margin: '0 16px 12px', padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12, color: RED }}>
              {job.error}
            </div>
          )}

          {job.status === 'completed' && job.result && (
            <div style={{ margin: '0 16px 12px', padding: '8px 12px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: 12, color: GREEN }}>
              Generated: {job.result.fileName}
              {job.result.suggests?.length > 0 && (
                <span style={{ marginLeft: 8, color: '#64748b' }}>· Next: {job.result.suggests.join(', ')}</span>
              )}
            </div>
          )}

          {expandedJob === job.jobId && (
            <div style={{ margin: '0 16px 12px', background: '#0f172a', borderRadius: 8, padding: 10, maxHeight: 200, overflowY: 'auto' }}>
              <div style={{ fontWeight: 600, fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>Logs</div>
              {job.logs.length === 0 ? (
                <div style={{ fontSize: 11, color: '#475569' }}>No logs yet...</div>
              ) : (
                job.logs.map((log, i) => (
                  <div key={i} style={{ fontSize: 11, color: '#4ade80', fontFamily: 'monospace', lineHeight: 1.6 }}>
                    {new Date(log.time).toLocaleTimeString()} {'>'} {log.msg}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}
      <style>{'@keyframes progress{0%{width:0%}50%{width:70%}100%{width:100%}}'}</style>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { toast } from './Toast';

export default function Documents({ projects }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [folderTree, setFolderTree] = useState({});
  const [viewingDoc, setViewingDoc] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedHtml, setEditedHtml] = useState('');
  const editorRef = useRef(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [deleting, setDeleting] = useState(null);
  const [regenerating, setRegenerating] = useState(null);
  const [approvalModal, setApprovalModal] = useState(null);
  const [bulkApproving, setBulkApproving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const statusColors = { success:'#94a3b8',DRAFT:'#94a3b8',IN_REVIEW:'#f59e0b',APPROVED:'#16a34a',CHANGES_REQUESTED:'#dc2626',failed:'#dc2626' };
  const statusLabels = { success:'DRAFT',DRAFT:'DRAFT',IN_REVIEW:'IN REVIEW',APPROVED:'APPROVED',CHANGES_REQUESTED:'CHANGES REQ.',failed:'FAILED' };
  const updateStatus = async (doc, status, comment) => {
    try {
      await fetch('/api/documents/' + selectedProject.id + '/status', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: doc.fileName, filePath: doc.filePath, status, reviewer: reviewerName || 'Reviewer', comment })
      });
      const updated = await fetch('/api/projects').then(r => r.json());
      const proj = updated.find(p => p.id === selectedProject.id);
      if (proj) { setSelectedProject(proj); buildFolderTree(proj); }
      setApprovalModal(null); setReviewComment('');
    } catch(e) { toast('Failed: ' + e.message,'info'); }
  };

  // Auto-refresh every 10 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const fresh = await fetch('/api/projects').then(r => r.json());
        if (Array.isArray(fresh) && selectedProject) {
          const updated = fresh.find(p => p.id === selectedProject.id);
          if (updated) { setSelectedProject(updated); buildFolderTree(updated); }
        }
      } catch(e) {}
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedProject?.id]);

  // Fast auto-refresh every 10 seconds - Bug-4 fix
  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const fresh = await fetch('/api/projects').then(r=>r.json());
        if (Array.isArray(fresh) && selectedProject) {
          const upd = fresh.find(p=>p.id===selectedProject.id);
          if (upd) { setSelectedProject(upd); buildFolderTree(upd); }
        }
      } catch(e) {}
    }, 10000);
    return () => clearInterval(iv);
  }, [selectedProject?.id]);

  // Auto-refresh selected project every 30 seconds (for real-time updates during orchestration)
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) setSelectedProject(projects[0]);
    else if (selectedProject) {
      const updated = projects.find(p => p.id === selectedProject.id);
      if (updated) { setSelectedProject(updated); buildFolderTree(updated); }
    }
  }, [projects]);

  useEffect(() => {
    if (selectedProject) buildFolderTree(selectedProject);
  }, [selectedProject]);

  const buildFolderTree = (project) => {
    const tree = {};
    (project.documents || []).forEach(doc => {
      const fp = doc.filePath || doc.fileName;
      if (!fp) return;
      const cleanFp = fp.startsWith(project.id + '/') ? fp.slice(project.id.length + 1) : fp;
      const parts = cleanFp.split('/');
      let workstream, process;
      if (parts.length >= 3) {
        workstream = parts[0] === project.client ? parts[1] : parts[0];
        process = parts[0] === project.client ? parts[2] : parts[1];
      } else if (parts.length === 2) {
        workstream = '_archive';
        process = parts[0];
      } else {
        workstream = '_archive';
        process = '_root';
      }
      if (!tree[workstream]) tree[workstream] = {};
      if (!tree[workstream][process]) tree[workstream][process] = [];
      if (!tree[workstream][process].find(d => d.fileName === doc.fileName)) {
        tree[workstream][process].push({ ...doc, cleanFp });
      }
    });
    // Sort each process folder: newest version first
    Object.keys(tree).forEach(ws => Object.keys(tree[ws]).forEach(proc => {
      tree[ws][proc].sort((a,b) => {
        const vA = parseInt((a.fileName||'').match(/v(\d+)/)?.[1]||0);
        const vB = parseInt((b.fileName||'').match(/v(\d+)/)?.[1]||0);
        return vB - vA;
      });
    }));
    setFolderTree(tree);
    const first = Object.keys(tree).find(k => k !== '_archive');
    if (first) setExpandedFolders({ ['ws_' + first]: true });
  };

  const openDoc = (doc) => {
    const fp = doc.filePath || doc.fileName;
    fetch('http://localhost:3002/download/' + selectedProject.id + '/' + fp.replace(selectedProject.id + '/', ''))
      .then(r => r.text())
      .then(html => setViewingDoc({ ...doc, html }))
      .catch(() => toast("Could not load document",'success'));
  };

  const deleteDoc = async (doc) => {
    if (!window.confirm('Delete ' + doc.fileName + '?')) return;
    setDeleting(doc.fileName);
    try {
      const fp = encodeURIComponent(doc.filePath || doc.fileName);
      await fetch('/api/documents/' + selectedProject.id + '/' + fp, { method: 'DELETE' });
      const updated = await fetch('/api/projects').then(r => r.json());
      const proj = updated.find(p => p.id === selectedProject.id);
      if (proj) { setSelectedProject(proj); buildFolderTree(proj); }
    } catch(e) { toast('Delete failed: ' + e.message,'info'); }
    setDeleting(null);
  };

  const toggleFolder = (key) => setExpandedFolders(e => ({ ...e, [key]: !e[key] }));

  const bulkApproveFolder = async (folderPath) => {
    if (!selectedProject) return;
    const projs = await fetch('/api/projects').then(r=>r.json());
    const proj = Array.isArray(projs) ? projs.find(p=>p.id===selectedProject.id) : selectedProject;
    if (!proj) return;
    const prefix = folderPath + '/';
    const toApprove = (proj.documents||[]).filter(d => {
      const fp = d.filePath||d.fileName||'';
      const clean = fp.startsWith(proj.id+'/') ? fp.slice(proj.id.length+1) : fp;
      return clean.startsWith(prefix) && d.status !== 'APPROVED';
    });
    if (toApprove.length===0) { toast('No pending documents in '+folderPath,'info'); return; }
    if (!window.confirm('Bulk approve '+toApprove.length+' documents in '+folderPath+'?')) return;
    setBulkApproving(true);
    let count=0;
    for (const doc of toApprove) {
      try {
        await fetch('/api/documents/'+selectedProject.id+'/status', {
          method:'PUT', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({fileName:doc.fileName,filePath:doc.filePath,status:'APPROVED',reviewer:'Bulk Approve',comment:'Bulk approved'})
        });
        count++;
      } catch(e) {}
    }
    setBulkApproving(false);
    toast('Approved '+count+' documents','success');
    const fresh = await fetch('/api/projects').then(r=>r.json());
    if (Array.isArray(fresh)) {
      const upd = fresh.find(p=>p.id===selectedProject.id);
      if (upd) { setSelectedProject(upd); buildFolderTree(upd); }
    }
  };

    const deleteFolder = async (folderPath) => {
    if (!window.confirm("Delete all documents in " + folderPath + "? This cannot be undone.")) return;
    const projs = await fetch("/api/projects").then(r=>r.json());
    const proj = Array.isArray(projs) ? projs.find(p=>p.id===selectedProject.id) : selectedProject;
    if (!proj) return;
    const prefix = folderPath + "/";
    const docsToDelete = (proj.documents||[]).filter(d => {
      const fp = d.filePath || d.fileName || "";
      const clean = fp.startsWith(proj.id + "/") ? fp.slice(proj.id.length + 1) : fp;
      return clean.startsWith(prefix);
    });
    console.log("[DELETE] folder:", folderPath, "docs:", docsToDelete.length, docsToDelete.map(d=>d.filePath));
    if (docsToDelete.length === 0) { toast("No documents found in " + folderPath, "warning"); return; }
    for (const doc of docsToDelete) {
      const fp = (doc.filePath || doc.fileName || "").split("/").map(encodeURIComponent).join("/");
      try { await fetch("/api/documents/" + proj.id + "/" + fp, { method: "DELETE" }); } catch(e) {}
    }
    const upd = await fetch("/api/projects").then(r=>r.json());
    const p = Array.isArray(upd) ? upd.find(p=>p.id===selectedProject.id) : null;
    if (p) { setSelectedProject(p); buildFolderTree(p); toast("Folder deleted", "success"); }
  };

  const folderLabel = (key) => {
    if (key === '_root') return '🗄️ Archive (old flat files)';
    const parts = key.split('/');
    if (parts.length >= 3) {
      if (parts[1] === 'General') return '🗄️ Archive › ' + parts[2];
      return '📁 ' + parts[1] + ' › ' + parts[2];
    }
    if (parts.length === 2) return '📁 ' + parts[0] + ' › ' + parts[1];
    return '🗄️ Archive';
  };

  if (viewingDoc) {
    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column', height:'calc(100vh - 60px)' }}>
        <div style={{ padding:'8px 16px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={() => { setViewingDoc(null); setEditMode(false); }} style={{ padding:'4px 12px', borderRadius:6, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:12 }}>← Back</button>
          <span style={{ fontSize:13, fontWeight:600, flex:1 }}>{viewingDoc.agentName} — {viewingDoc.fileName}</span>
          {editMode ? (
            <>
              <button onClick={() => { const html=editorRef.current.innerHTML; fetch('/api/save-document',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId:selectedProject.id,filePath:viewingDoc.filePath||viewingDoc.fileName,html})}).then(()=>{setViewingDoc(v=>({...v,html}));setEditMode(false);toast("Saved!",'success');}).catch(e=>toast('Save failed: '+e.message,'info')); }} style={{ padding:'4px 12px', borderRadius:6, border:'none', background:'#16a34a', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>Save</button>
              <button onClick={() => setEditMode(false)} style={{ padding:'4px 12px', borderRadius:6, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:12 }}>Cancel</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditMode(true)} style={{ padding:'4px 12px', borderRadius:6, border:'1px solid #1e40af', background:'#fff', color:'#1e40af', cursor:'pointer', fontSize:12 }}>Edit</button>
              <button onClick={() => { const w=window.open('','_blank');w.document.write(viewingDoc.html);w.document.close(); }} style={{ padding:'4px 12px', borderRadius:6, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', fontSize:12 }}>Full Screen</button>
              <button onClick={() => { const b=new Blob([viewingDoc.html],{type:'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=viewingDoc.fileName;a.click(); }} style={{ padding:'4px 12px', borderRadius:6, border:'none', background:'#1e40af', color:'#fff', cursor:'pointer', fontSize:12 }}>Download</button>
            </>
          )}
        </div>
        {editMode
          ? <div ref={editorRef} contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{__html: viewingDoc.html}} style={{ flex:1, overflow:'auto', padding:24, outline:'2px solid #1e40af', background:'#fff' }} />
          : <iframe srcDoc={viewingDoc.html} style={{ flex:1, border:'none' }} title={viewingDoc.agentName} />
        }
      </div>
    );
  }

  return (<>
    <div style={{ flex:1, display:'flex', gap:16, padding:16, height:'calc(100vh - 80px)', overflow:'hidden' }}>
      <div style={{ width:220, flexShrink:0, overflowY:'auto' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#64748b', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>Projects</div>
        {projects.map(p => (
          <div key={p.id} onClick={() => setSelectedProject(p)} style={{ padding:'8px 12px', borderRadius:8, cursor:'pointer', marginBottom:4, background:selectedProject?.id===p.id?'#eff6ff':'#f8fafc', border:'1px solid '+(selectedProject?.id===p.id?'#1e40af':'#e2e8f0'), fontSize:13, fontWeight:selectedProject?.id===p.id?600:400, color:selectedProject?.id===p.id?'#1e40af':'#1e293b' }}>
            <div>{p.name}</div>
            <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>{p.client}{p.workstream?' · '+p.workstream:''} · {(p.documents||[]).length} docs</div>
          </div>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto' }}>
        {selectedProject ? (
          <>
            <div style={{ marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}><div style={{ fontSize:16, fontWeight:700, color:'#1e293b' }}>{selectedProject.name}</div>
                <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder='🔍 Search documents...' style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #e2e8f0', fontSize:12, width:200 }} /><button onClick={async () => { setRefreshing(true); try { const data=await fetch('/api/projects').then(r=>r.json()); const p=data.find(x=>x.id===selectedProject.id); if(p){setSelectedProject(p);buildFolderTree(p);} } finally { setRefreshing(false); } }} style={{ padding:'3px 8px', borderRadius:5, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', fontSize:11, color:'#64748b' }}>{refreshing ? '↻ Refreshing...' : '↺ Refresh'}</button></div>
              <div style={{ fontSize:12, color:'#64748b' }}>{selectedProject.client}{' · '}{(selectedProject.documents||[]).length} documents</div>
            </div>
            {Object.keys(folderTree).length === 0 && <div style={{ color:'#94a3b8', fontSize:13, textAlign:'center', marginTop:40 }}>No documents yet.</div>}
            {Object.keys(folderTree).map(workstream => {
              const isArchive = workstream === '_archive';
              const processes = folderTree[workstream];
              const wsKey = 'ws_' + workstream;
              const totalFiles = Object.values(processes).reduce((a,b) => a + b.length, 0);
              const wsIcon = isArchive ? '🗄️' : '📁';
              const wsLabel = isArchive ? 'Archive (old files)' : workstream;
              return (
                <div key={workstream} style={{ marginBottom:8 }}>
                  <div onClick={() => toggleFolder(wsKey)} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background: isArchive ? '#f8f8f8' : '#e8f0fe', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:13, color: isArchive ? '#94a3b8' : '#1e293b' }}>
                    <span>{expandedFolders[wsKey] ? '▼' : '▶'}</span>
                    <span>{wsIcon} {wsLabel}</span>
                    <span style={{ fontSize:11, color:'#94a3b8', fontWeight:400 }}>({totalFiles} files)</span>
                  </div>
                  {expandedFolders[wsKey] && Object.keys(processes).map(process => {
                    const procKey = wsKey + '_' + process;
                    const docs = processes[process];
                    if (process === '_root') return docs.map((doc, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', borderRadius:6, marginBottom:3, marginLeft:16, marginTop:3, background:'#fff', border:'1px solid #e2e8f0' }}>
                        <span style={{ fontSize:14 }}>📄</span>
                        <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:500 }}>{doc.agentName||doc.agentId}</div><div style={{ fontSize:10, color:'#94a3b8' }}>{doc.fileName}</div></div>
                        <button onClick={() => openDoc(doc)} style={{ padding:'3px 8px', borderRadius:5, border:'none', background:'#1e40af', color:'#fff', cursor:'pointer', fontSize:11 }}>Open</button>
                        <button onClick={() => deleteDoc(doc)} style={{ padding:'3px 8px', borderRadius:5, border:'1px solid #ef4444', background:'#fff', color:'#ef4444', cursor:'pointer', fontSize:11 }}>Delete</button>
                      </div>
                    ));
                    return (
                      <div key={process} style={{ marginLeft:16, marginTop:4, marginBottom:4 }}>
                        <div onClick={() => toggleFolder(procKey)} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px', background:'#f1f5f9', borderRadius:6, cursor:'pointer', fontWeight:600, fontSize:12, color:'#1e293b' }}>
                          <span>{expandedFolders[procKey] ? '▼' : '▶'}</span>
                          <span>📂 {process}</span>
                          <span style={{ fontSize:10, color:'#94a3b8', fontWeight:400 }}>({docs.length} files)</span>
                          <button onClick={(e) => { e.stopPropagation(); bulkApproveFolder(workstream + "/" + process); }} disabled={bulkApproving} style={{ marginLeft:4, padding:'3px 8px', borderRadius:5, border:'1px solid #16a34a', background:'#fff', color:'#16a34a', cursor:'pointer', fontSize:11 }}>✓ Approve All</button>
                          <button onClick={(e) => { e.stopPropagation(); deleteFolder(workstream + "/" + process); }} style={{ marginLeft:'auto', padding:'2px 8px', borderRadius:4, border:'1px solid #ef4444', background:'#fff', color:'#ef4444', cursor:'pointer', fontSize:10 }}>Delete Folder</button>
                        </div>
                        {expandedFolders[procKey] && docs.map((doc, i) => (
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', borderRadius:6, marginBottom:3, marginLeft:16, marginTop:3, background:'#fff', border:'1px solid #e2e8f0' }}>
                            <span style={{ fontSize:14 }}>📄</span>
                            <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:500 }}>{doc.agentName||doc.agentId}</div><div style={{ fontSize:10, color:'#94a3b8' }}>{doc.fileName} · {doc.generatedAt ? new Date(doc.generatedAt).toLocaleString() : ''}</div></div>
                            <span style={{ fontSize:10, fontWeight:700, color:statusColors[doc.status]||'#94a3b8', background:(statusColors[doc.status]||'#94a3b8')+'20', padding:'2px 6px', borderRadius:10 }}>{statusLabels[doc.status]||'DRAFT'}</span>
                            <button onClick={() => openDoc(doc)} style={{ padding:'3px 8px', borderRadius:5, border:'none', background:'#1e40af', color:'#fff', cursor:'pointer', fontSize:11 }}>Open</button>
                            {doc.status !== 'APPROVED' && <button onClick={() => setApprovalModal({doc, projectId: selectedProject.id})} style={{ padding:'3px 8px', borderRadius:5, border:'1px solid #f59e0b', background:'#fff', color:'#f59e0b', cursor:'pointer', fontSize:11 }}>Review</button>}
                            {doc.status === 'CHANGES_REQUESTED' && <button disabled={regenerating===doc.fileName} onClick={() => { const comments=(doc.comments||[]).map(x=>x.text).join('; '); if(!window.confirm('Regenerate '+doc.agentName+' with reviewer feedback?\n\nFeedback: '+comments)) return; setRegenerating(doc.fileName); fetch('/api/rerun-agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId:selectedProject.id,agentId:doc.agentId,agentName:doc.agentName,filePath:doc.filePath,reviewComments:comments})}).then(r=>r.json()).then(d=>{setRegenerating(null);if(d.success){toast("Claude is regenerating in background. Check Documents tab in ~3 min.",'success');}else{toast('Failed: '+(d.error||'Unknown','info'));}}).catch(e=>{setRegenerating(null);toast('Error: '+e.message,'info');}); }} style={{ padding:'3px 8px', borderRadius:5, border:'1px solid #7c3aed', background: regenerating===doc.fileName ? '#7c3aed' : '#fff', color: regenerating===doc.fileName ? '#fff' : '#7c3aed', cursor:'pointer', fontSize:11 }}>{regenerating===doc.fileName ? 'Regenerating...' : 'Regenerate'}</button>}
                            <button onClick={() => deleteDoc(doc)} disabled={deleting===doc.fileName} style={{ padding:'3px 8px', borderRadius:5, border:'1px solid #ef4444', background:'#fff', color:'#ef4444', cursor:'pointer', fontSize:11 }}>{deleting===doc.fileName?'...':'Delete'}</button>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
                    </>
        ) : (
          <div style={{ color:'#94a3b8', fontSize:13, textAlign:'center', marginTop:40 }}>Select a project to view documents</div>
        )}
      </div>
    </div>
      {approvalModal && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:24, width:480, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>Review Document</div>
            <div style={{ fontSize:12, color:'#64748b', marginBottom:16 }}>{approvalModal.doc.agentName} — {approvalModal.doc.fileName}</div>
            <label style={{ fontSize:12, fontWeight:600 }}>Your Name</label>
            <input value={reviewerName} onChange={e => setReviewerName(e.target.value)} placeholder="e.g. Vikram Sharma" style={{ width:'100%', padding:'8px', borderRadius:6, border:'1px solid #e2e8f0', marginBottom:12, fontSize:13, marginTop:4, boxSizing:'border-box' }} />
            <label style={{ fontSize:12, fontWeight:600 }}>Comments</label>
            <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Add review comments..." style={{ width:'100%', padding:'8px', borderRadius:6, border:'1px solid #e2e8f0', marginBottom:16, fontSize:13, marginTop:4, height:80, resize:'vertical', boxSizing:'border-box' }} />
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={() => setApprovalModal(null)} style={{ padding:'8px 16px', borderRadius:6, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13 }}>Cancel</button>
              <button onClick={() => updateStatus(approvalModal.doc, 'IN_REVIEW', reviewComment)} style={{ padding:'8px 16px', borderRadius:6, border:'none', background:'#f59e0b', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>Send for Review</button>
              <button onClick={() => updateStatus(approvalModal.doc, 'CHANGES_REQUESTED', reviewComment)} style={{ padding:'8px 16px', borderRadius:6, border:'none', background:'#dc2626', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>Request Changes</button>
              <button onClick={() => updateStatus(approvalModal.doc, 'APPROVED', reviewComment)} style={{ padding:'8px 16px', borderRadius:6, border:'none', background:'#16a34a', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>✓ Approve</button>
            </div>
          </div>
        </div>
      )}
  </>
  );
}

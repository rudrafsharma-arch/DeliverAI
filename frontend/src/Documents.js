import React, { useState, useEffect } from 'react';

export default function Documents({ projects }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [folderTree, setFolderTree] = useState({});
  const [viewingDoc, setViewingDoc] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [deleting, setDeleting] = useState(null);

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
    setFolderTree(tree);
    const first = Object.keys(tree).find(k => k !== '_archive');
    if (first) setExpandedFolders({ ['ws_' + first]: true });
  };

  const openDoc = (doc) => {
    const fp = doc.filePath || doc.fileName;
    fetch('http://localhost:3002/download/' + selectedProject.id + '/' + fp.replace(selectedProject.id + '/', ''))
      .then(r => r.text())
      .then(html => setViewingDoc({ ...doc, html }))
      .catch(() => alert('Could not load document'));
  };

  const deleteDoc = async (doc) => {
    if (!window.confirm('Delete ' + doc.fileName + '?')) return;
    setDeleting(doc.fileName);
    try {
      const fp = encodeURIComponent(doc.filePath || doc.fileName);
      await fetch('http://localhost:3002/documents/' + selectedProject.id + '/' + fp, { method: 'DELETE' });
      const updated = await fetch('/api/projects').then(r => r.json());
      const proj = updated.find(p => p.id === selectedProject.id);
      if (proj) { setSelectedProject(proj); buildFolderTree(proj); }
    } catch(e) { alert('Delete failed: ' + e.message); }
    setDeleting(null);
  };

  const toggleFolder = (key) => setExpandedFolders(e => ({ ...e, [key]: !e[key] }));

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
          <button onClick={() => setViewingDoc(null)} style={{ padding:'4px 12px', borderRadius:6, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:12 }}>← Back</button>
          <span style={{ fontSize:13, fontWeight:600, flex:1 }}>{viewingDoc.agentName} — {viewingDoc.fileName}</span>
          <button onClick={() => { const w=window.open('','_blank');w.document.write(viewingDoc.html);w.document.close(); }} style={{ padding:'4px 12px', borderRadius:6, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', fontSize:12 }}>⛶ Full Screen</button>
          <button onClick={() => { const b=new Blob([viewingDoc.html],{type:'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=viewingDoc.fileName;a.click(); }} style={{ padding:'4px 12px', borderRadius:6, border:'none', background:'#1e40af', color:'#fff', cursor:'pointer', fontSize:12 }}>Download</button>
        </div>
        <iframe srcDoc={viewingDoc.html} style={{ flex:1, border:'none' }} title={viewingDoc.agentName} />
      </div>
    );
  }

  return (
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
              <div style={{ fontSize:16, fontWeight:700, color:'#1e293b' }}>{selectedProject.name}</div>
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
                        </div>
                        {expandedFolders[procKey] && docs.map((doc, i) => (
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', borderRadius:6, marginBottom:3, marginLeft:16, marginTop:3, background:'#fff', border:'1px solid #e2e8f0' }}>
                            <span style={{ fontSize:14 }}>📄</span>
                            <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:500 }}>{doc.agentName||doc.agentId}</div><div style={{ fontSize:10, color:'#94a3b8' }}>{doc.fileName} · {doc.generatedAt ? new Date(doc.generatedAt).toLocaleString() : ''}</div></div>
                            <button onClick={() => openDoc(doc)} style={{ padding:'3px 8px', borderRadius:5, border:'none', background:'#1e40af', color:'#fff', cursor:'pointer', fontSize:11 }}>Open</button>
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
  );
}

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
      const parts = fp.split('/');
      // parts[0] = projectId, parts[1] = client, parts[2] = workstream, parts[3] = process, parts[4] = filename
      // OR parts[0] = filename (flat/root)
      let key;
      if (parts.length >= 4) {
        // Has proper folder structure - use client/workstream/process
        key = parts.slice(1, parts.length - 1).join('/');
      } else {
        key = '_root';
      }
      if (!tree[key]) tree[key] = [];
      // avoid duplicates
      if (!tree[key].find(d => d.fileName === doc.fileName)) {
        tree[key].push(doc);
      }
    });
    // Remove _root if there are proper folders
    const properFolders = Object.keys(tree).filter(k => k !== '_root' && !k.includes('General'));
    if (properFolders.length > 0) delete tree['_root'];
    // Also remove General folder if proper folders exist
    Object.keys(tree).forEach(k => { if (k.includes('General')) delete tree[k]; });
    setFolderTree(tree);
    // Expand first proper folder
    const first = Object.keys(tree)[0];
    if (first) setExpandedFolders({ [first]: true });
  };

  const openDoc = (doc) => {
    const fp = doc.filePath || doc.fileName;
    fetch('http://localhost:3002/download/' + selectedProject.id + '/' + fp)
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
    if (key === '_root') return '📁 Root Documents';
    const parts = key.split('/');
    // Show as: Workstream › Process
    if (parts.length >= 3) return '📁 ' + parts[1] + ' › ' + parts[2];
    if (parts.length === 2) return '📁 ' + parts[0] + ' › ' + parts[1];
    return '📁 ' + key;
  };

  if (viewingDoc) {
    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column', height:'calc(100vh - 60px)' }}>
        <div style={{ padding:'8px 16px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={() => setViewingDoc(null)} style={{ padding:'4px 12px', borderRadius:6, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:12 }}>← Back</button>
          <span style={{ fontSize:13, fontWeight:600, flex:1 }}>{viewingDoc.agentName} — {viewingDoc.fileName}</span>
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
              <div style={{ fontSize:12, color:'#64748b' }}>{[selectedProject.client, selectedProject.workstream, selectedProject.processName].filter(Boolean).join(' › ')}</div>
            </div>
            {Object.keys(folderTree).length === 0 && <div style={{ color:'#94a3b8', fontSize:13, textAlign:'center', marginTop:40 }}>No documents yet. Run an Architect job to generate documents.</div>}
            {Object.keys(folderTree).map(key => (
              <div key={key} style={{ marginBottom:12 }}>
                <div onClick={() => toggleFolder(key)} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#f1f5f9', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:13, color:'#1e293b' }}>
                  <span>{expandedFolders[key]?'▼':'▶'}</span>
                  <span>{folderLabel(key)}</span>
                  <span style={{ fontSize:11, color:'#94a3b8', fontWeight:400 }}>({folderTree[key].length} files)</span>
                </div>
                {expandedFolders[key] && (
                  <div style={{ marginLeft:16, marginTop:4 }}>
                    {folderTree[key].map((doc, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:6, marginBottom:3, background:'#fff', border:'1px solid #e2e8f0' }}>
                        <span style={{ fontSize:16 }}>📄</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:500, color:'#1e293b' }}>{doc.agentName||doc.agentId}</div>
                          <div style={{ fontSize:10, color:'#94a3b8' }}>{doc.fileName} · {doc.generatedAt?new Date(doc.generatedAt).toLocaleString():''}</div>
                        </div>
                        <button onClick={() => openDoc(doc)} style={{ padding:'4px 10px', borderRadius:6, border:'none', background:'#1e40af', color:'#fff', cursor:'pointer', fontSize:11 }}>Open</button>
                        <button onClick={() => deleteDoc(doc)} disabled={deleting===doc.fileName} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #ef4444', background:'#fff', color:'#ef4444', cursor:'pointer', fontSize:11 }}>{deleting===doc.fileName?'...':'Delete'}</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          <div style={{ color:'#94a3b8', fontSize:13, textAlign:'center', marginTop:40 }}>Select a project to view documents</div>
        )}
      </div>
    </div>
  );
}

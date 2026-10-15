import React, { useState } from 'react';
import { toast } from './Toast';

export default function DocCompare({ project, projects, onClose }) {
  const [selectedProj, setSelectedProj] = React.useState(project);
  const activeProject = selectedProj || project;
  const [docA, setDocA] = useState('');
  const [docB, setDocB] = useState('');
  const [htmlA, setHtmlA] = useState('');
  const [htmlB, setHtmlB] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('side-by-side'); // side-by-side or unified

  const docs = (activeProject?.documents || []).filter(d => d.filePath && d.fileName);

  const loadDoc = async (filePath, setter) => {
    try {
      const fp = filePath.split('/').map(encodeURIComponent).join('/');
      const r = await fetch('/api/download/' + project.id + '/' + fp);
      const html = await r.text();
      setter(html);
    } catch(e) { toast('Failed to load document: ' + e.message, 'error'); }
  };

  const compare = async () => {
    if (!docA || !docB) { toast('Select two documents to compare', 'warning'); return; }
    if (docA === docB) { toast('Select two different documents', 'warning'); return; }
    setLoading(true);
    await Promise.all([
      loadDoc(docA, setHtmlA),
      loadDoc(docB, setHtmlB)
    ]);
    setLoading(false);
  };

  const getDocLabel = (fp) => {
    const parts = fp.split('/');
    return parts[parts.length-1];
  };

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:12, width:'95vw', height:'90vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{ padding:'12px 20px', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:12, background:'#f8fafc' }}>
          <span style={{ fontSize:16, fontWeight:700, color:'#1e293b' }}>📄 Document Comparison</span>
          <div style={{ flex:1, display:'flex', gap:8, alignItems:'center' }}>
            <select value={docA} onChange={e => { setDocA(e.target.value); setHtmlA(''); }} style={{ padding:'5px 8px', borderRadius:6, border:'1px solid #e2e8f0', fontSize:12, maxWidth:220 }}>
              <option value=''>Select Document A</option>
              {docs.map((d,i) => <option key={i} value={d.filePath}>{getDocLabel(d.filePath)}</option>)}
            </select>
            <span style={{ color:'#94a3b8', fontSize:12 }}>vs</span>
            <select value={docB} onChange={e => { setDocB(e.target.value); setHtmlB(''); }} style={{ padding:'5px 8px', borderRadius:6, border:'1px solid #e2e8f0', fontSize:12, maxWidth:220 }}>
              <option value=''>Select Document B</option>
              {docs.map((d,i) => <option key={i} value={d.filePath}>{getDocLabel(d.filePath)}</option>)}
            </select>
            <button onClick={compare} disabled={loading} style={{ padding:'5px 14px', borderRadius:6, border:'none', background:'#1e40af', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              {loading ? 'Loading...' : 'Compare'}
            </button>
            {htmlA && htmlB && (
              <div style={{ display:'flex', gap:4, marginLeft:8 }}>
                <button onClick={() => setView('side-by-side')} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #e2e8f0', background: view==='side-by-side' ? '#1e40af' : '#fff', color: view==='side-by-side' ? '#fff' : '#64748b', fontSize:11, cursor:'pointer' }}>Side by Side</button>
                <button onClick={() => setView('unified')} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #e2e8f0', background: view==='unified' ? '#1e40af' : '#fff', color: view==='unified' ? '#fff' : '#64748b', fontSize:11, cursor:'pointer' }}>Unified</button>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ padding:'5px 12px', borderRadius:6, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:12 }}>Close</button>
        </div>

        {/* Content */}
        {!htmlA && !htmlB && (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, color:'#94a3b8' }}>
            <div style={{ fontSize:40 }}>📊</div>
            <div style={{ fontSize:15, fontWeight:600 }}>Select two documents and click Compare</div>
            <div style={{ fontSize:12 }}>View differences between versions side-by-side</div>
          </div>
        )}

        {htmlA && htmlB && view === 'side-by-side' && (
          <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
            <div style={{ flex:1, display:'flex', flexDirection:'column', borderRight:'2px solid #1e40af' }}>
              <div style={{ padding:'6px 12px', background:'#eff6ff', fontSize:11, fontWeight:600, color:'#1e40af', borderBottom:'1px solid #bfdbfe' }}>
                📄 {getDocLabel(docA)}
              </div>
              <iframe srcDoc={htmlA} style={{ flex:1, border:'none' }} title="Document A" />
            </div>
            <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
              <div style={{ padding:'6px 12px', background:'#f0fdf4', fontSize:11, fontWeight:600, color:'#16a34a', borderBottom:'1px solid #bbf7d0' }}>
                📄 {getDocLabel(docB)}
              </div>
              <iframe srcDoc={htmlB} style={{ flex:1, border:'none' }} title="Document B" />
            </div>
          </div>
        )}

        {htmlA && htmlB && view === 'unified' && (
          <div style={{ flex:1, display:'flex', overflow:'hidden', flexDirection:'column' }}>
            <div style={{ padding:'8px 16px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0', fontSize:12, color:'#64748b' }}>
              Scroll to compare — <span style={{ color:'#1e40af', fontWeight:600 }}>{getDocLabel(docA)}</span> (top) vs <span style={{ color:'#16a34a', fontWeight:600 }}>{getDocLabel(docB)}</span> (bottom)
            </div>
            <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
              <div style={{ borderBottom:'3px solid #1e40af', padding:'4px 8px', background:'#eff6ff', fontSize:11, fontWeight:600, color:'#1e40af' }}>Document A: {getDocLabel(docA)}</div>
              <iframe srcDoc={htmlA} style={{ height:'50%', border:'none', borderBottom:'3px solid #16a34a' }} title="Document A" />
              <div style={{ padding:'4px 8px', background:'#f0fdf4', fontSize:11, fontWeight:600, color:'#16a34a' }}>Document B: {getDocLabel(docB)}</div>
              <iframe srcDoc={htmlB} style={{ height:'50%', border:'none' }} title="Document B" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

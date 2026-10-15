import React, { useState, useRef } from 'react';
import { toast } from './Toast';

export default function DocCompare({ projects, onClose }) {
  const allProjects = projects || [];
  const first = allProjects[0] || null;
  const [projA, setProjA] = useState(first);
  const [projB, setProjB] = useState(first);
  const [wsA, setWsA] = useState('');
  const [wsB, setWsB] = useState('');
  const [procA, setProcA] = useState('');
  const [procB, setProcB] = useState('');
  const [docA, setDocA] = useState('');
  const [docB, setDocB] = useState('');
  const [htmlA, setHtmlA] = useState('');
  const [htmlB, setHtmlB] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('side-by-side');
  const [editingA, setEditingA] = useState(false);
  const [editingB, setEditingB] = useState(false);
  const [savingA, setSavingA] = useState(false);
  const [savingB, setSavingB] = useState(false);
  const [saveModal, setSaveModal] = useState(null);
  const iframeRefA = useRef(null);
  const iframeRefB = useRef(null);

  // Strip project ID prefix from filePath if present
  const normPath = (proj, fp) => {
    if (!fp) return '';
    const prefix = proj.id + '/';
    return fp.startsWith(prefix) ? fp.slice(prefix.length) : fp;
  };

  const getWorkstreams = (proj) => {
    if (!proj) return [];
    const ws = new Set();
    (proj.documents || []).filter(d => d.filePath && d.fileName).forEach(d => {
      const parts = normPath(proj, d.filePath).split('/');
      if (parts.length >= 3) ws.add(parts[0]);
    });
    return [...ws].sort();
  };

  const getProcesses = (proj, workstream) => {
    if (!proj || !workstream) return [];
    const procs = new Set();
    (proj.documents || []).filter(d => d.filePath && d.fileName).forEach(d => {
      const parts = normPath(proj, d.filePath).split('/');
      if (parts.length >= 3 && parts[0] === workstream) procs.add(parts[1]);
    });
    return [...procs].sort();
  };

  const getDocs = (proj, workstream, process) => {
    if (!proj) return [];
    const docs = (proj.documents || []).filter(d => d.filePath && d.fileName);
    if (!workstream) return docs;
    return docs.filter(d => {
      const parts = normPath(proj, d.filePath).split('/');
      if (process) return parts[0] === workstream && parts[1] === process;
      return parts[0] === workstream;
    });
  };

  const getLabel = (fp) => {
    if (!fp) return '';
    const name = fp.split('/').pop().replace('.html', '').replace(/_v(\d+)$/, ' v$1');
    return name.replace(/-/g, ' ').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const compare = async () => {
    if (!docA || !docB) { toast('Select both documents to compare', 'warning'); return; }
    setLoading(true); setHtmlA(''); setHtmlB(''); setEditingA(false); setEditingB(false);
    try {
      const load = (fp, pid) => fetch('/api/download/' + pid + '/' + fp.split('/').map(encodeURIComponent).join('/')).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); });
      const [a, b] = await Promise.all([load(docA, projA.id), load(docB, projB.id)]);
      setHtmlA(a); setHtmlB(b);
    } catch(e) { toast('Failed to load: ' + e.message, 'error'); }
    setLoading(false);
  };

  const startEdit = (side) => {
    const ref = side === 'A' ? iframeRefA : iframeRefB;
    const setEditing = side === 'A' ? setEditingA : setEditingB;
    try {
      const doc = ref.current.contentDocument;
      doc.body.contentEditable = 'true';
      doc.body.style.outline = '2px solid ' + (side === 'A' ? '#1d4ed8' : '#16a34a');
      doc.body.style.outlineOffset = '4px';
      doc.body.focus();
      setEditing(true);
    } catch(e) { toast('Could not enable editing', 'error'); }
  };

  const cancelEdit = (side) => {
    const ref = side === 'A' ? iframeRefA : iframeRefB;
    const setEditing = side === 'A' ? setEditingA : setEditingB;
    const origHtml = side === 'A' ? htmlA : htmlB;
    try {
      const doc = ref.current.contentDocument;
      doc.body.contentEditable = 'false';
      doc.body.style.outline = '';
      doc.open(); doc.write(origHtml); doc.close();
    } catch(e) {}
    setEditing(false);
  };

  const saveDoc = (side) => {
    const ref = side === 'A' ? iframeRefA : iframeRefB;
    const doc2 = side === 'A' ? docA : docB;
    const proj = side === 'A' ? projA : projB;
    let html = '';
    try {
      const iDoc = ref.current.contentDocument;
      iDoc.body.contentEditable = 'false';
      iDoc.body.style.outline = '';
      html = iDoc.documentElement.outerHTML;
    } catch(e) { toast('Could not read edited content', 'error'); return; }
    setSaveModal({ side, html, doc: doc2, proj });
  };

  const doSave = async (sameVersion) => {
    if (!saveModal) return;
    const { side, html, doc: doc2, proj } = saveModal;
    const setSaving = side === 'A' ? setSavingA : setSavingB;
    const setHtml = side === 'A' ? setHtmlA : setHtmlB;
    const setEditing = side === 'A' ? setEditingA : setEditingB;
    setSaveModal(null);
    setSaving(true);
    try {
      const url = sameVersion ? '/api/save-document' : '/api/save-new-version';
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: proj.id, filePath: doc2, html })
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      setHtml(html);
      setEditing(false);
      toast(sameVersion ? 'Saved (same version)' : 'Saved as new version: ' + (data.fileName || ''), 'success');
    } catch(e) { toast('Save failed: ' + e.message, 'error'); }
    setSaving(false);
  };

  const DocSelector = ({ label, color, proj, setProj, ws, setWs, proc, setProc, doc, setDoc, resetHtml }) => {
    const workstreams = getWorkstreams(proj);
    const processes = getProcesses(proj, ws);
    const docs = getDocs(proj, ws, proc);
    const sel = { padding: '4px 7px', borderRadius: 6, border: '1px solid ' + color + '60', fontSize: 11, width: '100%' };
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        {allProjects.length > 1 && (
          <select value={proj ? proj.id : ''} onChange={e => { setProj(allProjects.find(p => p.id === e.target.value)); setWs(''); setProc(''); setDoc(''); resetHtml(); }} style={sel}>
            {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        <select value={ws} onChange={e => { setWs(e.target.value); setProc(''); setDoc(''); resetHtml(); }} style={sel}>
          <option value=''>All workstreams</option>
          {workstreams.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        {ws && processes.length > 0 && (
          <select value={proc} onChange={e => { setProc(e.target.value); setDoc(''); resetHtml(); }} style={sel}>
            <option value=''>All processes</option>
            {processes.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
        <select value={doc} onChange={e => { setDoc(e.target.value); resetHtml(); }} style={sel}>
          <option value=''>Select document...</option>
          {docs.map((d, i) => <option key={i} value={d.filePath}>{getLabel(d.filePath)}</option>)}
        </select>
      </div>
    );
  };

  const PanelHeader = ({ side, color, bg, border, doc, html, editing, saving, onEdit, onSave, onCancel }) => (
    <div style={{ padding: '5px 12px', background: bg, fontSize: 11, fontWeight: 700, color, borderBottom: '1px solid ' + border, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <span>{side}: {getLabel(doc)}</span>
      {editing && <span style={{ fontSize: 10, background: color, color: '#fff', padding: '1px 6px', borderRadius: 4, marginLeft: 4 }}>EDITING</span>}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
        {html && !editing && <button onClick={onEdit} style={{ padding: '2px 8px', borderRadius: 5, border: '1px solid ' + color, background: '#fff', color, fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>Edit</button>}
        {editing && (
          <React.Fragment>
            <button onClick={onSave} disabled={saving} style={{ padding: '2px 8px', borderRadius: 5, border: 'none', background: color, color: '#fff', fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={onCancel} style={{ padding: '2px 8px', borderRadius: 5, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 10, cursor: 'pointer' }}>Cancel</button>
          </React.Fragment>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '96vw', height: '93vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>

        <div style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', whiteSpace: 'nowrap', paddingBottom: 2 }}>Compare Docs</span>
          <DocSelector label="Document A" color="#1d4ed8" proj={projA} setProj={setProjA} ws={wsA} setWs={setWsA} proc={procA} setProc={setProcA} doc={docA} setDoc={setDocA} resetHtml={() => { setHtmlA(''); setEditingA(false); }} />
          <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: 18, paddingBottom: 6, flexShrink: 0 }}>vs</span>
          <DocSelector label="Document B" color="#16a34a" proj={projB} setProj={setProjB} ws={wsB} setWs={setWsB} proc={procB} setProc={setProcB} doc={docB} setDoc={setDocB} resetHtml={() => { setHtmlB(''); setEditingB(false); }} />
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            {htmlA && htmlB && (
              <React.Fragment>
                <button onClick={() => setView('side-by-side')} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: view === 'side-by-side' ? '#1e40af' : '#fff', color: view === 'side-by-side' ? '#fff' : '#64748b', fontSize: 11, cursor: 'pointer' }}>Side by Side</button>
                <button onClick={() => setView('unified')} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: view === 'unified' ? '#1e40af' : '#fff', color: view === 'unified' ? '#fff' : '#64748b', fontSize: 11, cursor: 'pointer' }}>Unified</button>
              </React.Fragment>
            )}
            <button onClick={compare} disabled={loading || !docA || !docB} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: !docA || !docB || loading ? '#94a3b8' : '#1e40af', color: '#fff', fontSize: 12, fontWeight: 700, cursor: !docA || !docB ? 'not-allowed' : 'pointer' }}>{loading ? 'Loading...' : 'Compare'}</button>
            <button onClick={onClose} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#64748b' }}>Close</button>
          </div>
        </div>

        {!htmlA && !htmlB && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 44 }}>&#128202;</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>Select two documents and click Compare</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Drill down: Workstream / Process / File for each side</div>
          </div>
        )}

        {htmlA && htmlB && view === 'side-by-side' && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '2px solid #1d4ed8' }}>
              <PanelHeader side="A" color="#1d4ed8" bg="#eff6ff" border="#bfdbfe" doc={docA} html={htmlA} editing={editingA} saving={savingA} onEdit={() => startEdit('A')} onSave={() => saveDoc('A')} onCancel={() => cancelEdit('A')} />
              <iframe ref={iframeRefA} srcDoc={htmlA} style={{ flex: 1, border: 'none', width: '100%' }} title="Document A" />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <PanelHeader side="B" color="#16a34a" bg="#f0fdf4" border="#bbf7d0" doc={docB} html={htmlB} editing={editingB} saving={savingB} onEdit={() => startEdit('B')} onSave={() => saveDoc('B')} onCancel={() => cancelEdit('B')} />
              <iframe ref={iframeRefB} srcDoc={htmlB} style={{ flex: 1, border: 'none', width: '100%' }} title="Document B" />
            </div>
          </div>
        )}

        {htmlA && htmlB && view === 'unified' && (
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            <PanelHeader side="A" color="#1d4ed8" bg="#eff6ff" border="#bfdbfe" doc={docA} html={htmlA} editing={editingA} saving={savingA} onEdit={() => startEdit('A')} onSave={() => saveDoc('A')} onCancel={() => cancelEdit('A')} />
            <iframe ref={iframeRefA} srcDoc={htmlA} style={{ height: '50%', border: 'none', borderBottom: '3px solid #16a34a' }} title="Document A" />
            <PanelHeader side="B" color="#16a34a" bg="#f0fdf4" border="#bbf7d0" doc={docB} html={htmlB} editing={editingB} saving={savingB} onEdit={() => startEdit('B')} onSave={() => saveDoc('B')} onCancel={() => cancelEdit('B')} />
            <iframe ref={iframeRefB} srcDoc={htmlB} style={{ height: '50%', border: 'none' }} title="Document B" />
          </div>
        )}

        {saveModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 8 }}>Save Document {saveModal.side}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>How would you like to save your changes?</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={() => doSave(true)} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#1e40af', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}>
                  Save (same version)
                  <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.8, marginTop: 2 }}>Overwrite the existing file</div>
                </button>
                <button onClick={() => doSave(false)} style={{ padding: '10px 16px', borderRadius: 8, border: '2px solid #1e40af', background: '#fff', color: '#1e40af', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}>
                  Save as new version
                  <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.7, marginTop: 2 }}>Create a new file, keep the existing</div>
                </button>
                <button onClick={() => setSaveModal(null)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: 13, cursor: 'pointer' }}>Cancel — keep editing</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

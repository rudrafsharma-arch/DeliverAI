const fs = require('fs');
const lines = fs.readFileSync('frontend/src/Documents.js', 'utf8').split('\n');

// Replace lines 133-136 (index 132-135) with new toolbar
lines[132] = `          <button onClick={() => { setViewingDoc(null); setEditMode(false); }} style={{ padding:'4px 12px', borderRadius:6, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:12 }}>← Back</button>`;
lines[133] = `          <span style={{ fontSize:13, fontWeight:600, flex:1 }}>{viewingDoc.agentName} — {viewingDoc.fileName}</span>`;
lines[134] = `          {editMode ? (<><button onClick={() => { const html=editorRef.current.innerHTML; fetch('http://localhost:3002/save-document',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId:selectedProject.id,filePath:viewingDoc.filePath||viewingDoc.fileName,html})}).then(()=>{setViewingDoc(v=>({...v,html}));setEditMode(false);alert('Saved!');}).catch(e=>alert('Save failed: '+e.message)); }} style={{ padding:'4px 12px', borderRadius:6, border:'none', background:'#16a34a', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>Save</button><button onClick={() => setEditMode(false)} style={{ padding:'4px 12px', borderRadius:6, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:12 }}>Cancel</button></>) : (<><button onClick={() => setEditMode(true)} style={{ padding:'4px 12px', borderRadius:6, border:'1px solid #1e40af', background:'#fff', color:'#1e40af', cursor:'pointer', fontSize:12 }}>Edit</button><button onClick={() => { const w=window.open('','_blank');w.document.write(viewingDoc.html);w.document.close(); }} style={{ padding:'4px 12px', borderRadius:6, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', fontSize:12 }}>Full Screen</button><button onClick={() => { const b=new Blob([viewingDoc.html],{type:'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=viewingDoc.fileName;a.click(); }} style={{ padding:'4px 12px', borderRadius:6, border:'none', background:'#1e40af', color:'#fff', cursor:'pointer', fontSize:12 }}>Download</button></>)}`;
lines[135] = `        </div>`;
// Remove old line 136 (was closing </div>)
lines.splice(136, 1);

fs.writeFileSync('frontend/src/Documents.js', lines.join('\n'), 'utf8');
console.log('Done. Lines:', lines.length);

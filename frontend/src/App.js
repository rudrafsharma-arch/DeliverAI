import React, { useState, useEffect, useRef } from 'react';

const api = {
  get: (url) => fetch(url).then(r => r.json()),
  post: (url, body) => fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }).then(r => r.json()),
  put: (url, body) => fetch(url, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }).then(r => r.json()),
};

const BLUE = '#0070F2';
const phaseColors = { discover:'#1a5276', explore:'#1a5c1a', realize:'#7d6608', test:'#7b241c', deploy:'#6c3483', run:'#1a4a8c' };
const phaseBg = { discover:'#e8f4f8', explore:'#e8f8e8', realize:'#fef9e7', test:'#fdecea', deploy:'#f4ecf7', run:'#eaf2ff' };

function SetupWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const steps = [
    { title:'Welcome to DeliverAI', body:'AI agents for every project phase — any platform, any industry. Powered by Claude Code CLI using your existing subscription. No API key needed.' },
    { title:'Prerequisites', body:'You need: Node.js 18+, Git, Claude Code CLI logged in.', code:'npm install -g @anthropic-ai/claude-code\nclaude login' },
    { title:'Configure .env', body:'Copy .env.template to .env and fill in your credentials. Your secrets never leave your laptop.', code:'copy .env.template .env\nnotepad .env' },
    { title:'You are ready!', body:'Create a project, pick an agent, fill the form, and DeliverAI generates professional documents using your Claude subscription.' },
  ];
  const s = steps[step];
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:16, padding:32, width:500, maxWidth:'90vw' }}>
        <div style={{ fontSize:11, fontWeight:700, color:BLUE, marginBottom:8, letterSpacing:1 }}>SETUP — STEP {step+1} OF {steps.length}</div>
        <div style={{ fontSize:22, fontWeight:700, marginBottom:10 }}>{s.title}</div>
        <div style={{ fontSize:14, color:'#475569', lineHeight:1.7, marginBottom:16 }}>{s.body}</div>
        {s.code && <div style={{ background:'#0f172a', color:'#94a3b8', borderRadius:8, padding:14, fontFamily:'monospace', fontSize:12, lineHeight:1.8, marginBottom:16, whiteSpace:'pre' }}>{s.code}</div>}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          {step > 0 && <button onClick={() => setStep(s=>s-1)} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13 }}>Back</button>}
          {step < steps.length-1
            ? <button onClick={() => setStep(s=>s+1)} style={{ padding:'8px 20px', borderRadius:8, border:'none', background:BLUE, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>Next →</button>
            : <button onClick={onComplete} style={{ padding:'8px 20px', borderRadius:8, border:'none', background:BLUE, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>Get Started →</button>
          }
        </div>
      </div>
    </div>
  );
}

function Assistant({ projectId, onClose }) {
  const [messages, setMessages] = useState([{ role:'assistant', text:'Hi! I am your DeliverAI assistant — SAP expert, delivery guide, and platform helper. What do you need?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const send = () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages(m => [...m, { role:'user', text:msg }]);
    setLoading(true);
    const params = new URLSearchParams({ message:msg, ...(projectId && { projectId }) });
    const es = new EventSource(`/api/assistant-stream?${params}`);
    es.onmessage = (e) => {
      const { type, data } = JSON.parse(e.data);
      if (type === 'complete') { es.close(); setMessages(m => [...m, { role:'assistant', text:data.message }]); setLoading(false); }
      else if (type === 'error') { es.close(); setMessages(m => [...m, { role:'assistant', text:'Sorry, error occurred. Try again.' }]); setLoading(false); }
    };
    es.onerror = () => { es.close(); setLoading(false); };
  };

  return (
    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, display:'flex', flexDirection:'column', height:400, overflow:'hidden' }}>
      <div style={{ padding:'10px 14px', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span>🤖</span>
          <span style={{ fontWeight:600, fontSize:13 }}>AI Assistant</span>
          <span style={{ fontSize:9, background:'#e8f2ff', color:BLUE, padding:'2px 6px', borderRadius:8, fontWeight:600 }}>SAP Expert</span>
        </div>
        {onClose && <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#94a3b8' }}>×</button>}
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:10, display:'flex', flexDirection:'column', gap:6 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
            <div style={{ maxWidth:'85%', padding:'7px 11px', borderRadius:m.role==='user'?'12px 12px 4px 12px':'12px 12px 12px 4px', background:m.role==='user'?BLUE:'#f1f5f9', color:m.role==='user'?'#fff':'#1e293b', fontSize:12, lineHeight:1.5 }}>{m.text}</div>
          </div>
        ))}
        {loading && <div style={{ display:'flex', gap:3, padding:'6px 10px' }}>{[0,1,2].map(i=><div key={i} style={{ width:5, height:5, borderRadius:'50%', background:'#94a3b8', animation:`bounce 1.2s ${i*0.2}s infinite` }}/>)}</div>}
        <div ref={bottomRef}/>
      </div>
      <div style={{ padding:8, borderTop:'1px solid #e2e8f0', display:'flex', gap:6 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask about SAP, agents, or your project..." style={{ flex:1, border:'1px solid #e2e8f0', borderRadius:8, padding:'7px 10px', fontSize:12, outline:'none', fontFamily:'inherit' }}/>
        <button onClick={send} style={{ padding:'7px 12px', borderRadius:8, border:'none', background:BLUE, color:'#fff', cursor:'pointer', fontSize:13 }}>→</button>
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>
    </div>
  );
}

function ProjectPanel({ projects, selected, onSelect, onCreate }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name:'', client:'', type:'s4hana', system:'', description:'' });
  const types = ['s4hana','btp','ecc','oracle','workday','salesforce','custom'];

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    const p = await api.post('/api/projects', form);
    onCreate(p);
    setCreating(false);
    setForm({ name:'', client:'', type:'s4hana', system:'', description:'' });
  };

  return (
    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden' }}>
      <div style={{ padding:'10px 14px', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontWeight:600, fontSize:13 }}>Projects</span>
        <button onClick={() => setCreating(c=>!c)} style={{ fontSize:11, padding:'3px 9px', borderRadius:6, border:'none', background:BLUE, color:'#fff', cursor:'pointer', fontWeight:600 }}>+ New</button>
      </div>
      {creating && (
        <div style={{ padding:12, background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
          {[['Project Name *','name','e.g. Mars S4HANA Migration'],['Client','client','e.g. Mars H&W']].map(([l,k,p])=>(
            <div key={k} style={{ marginBottom:8 }}>
              <div style={{ fontSize:11, fontWeight:500, color:'#64748b', marginBottom:3 }}>{l}</div>
              <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={p} style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:6, padding:'6px 9px', fontSize:12, outline:'none', boxSizing:'border-box' }}/>
            </div>
          ))}
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:11, fontWeight:500, color:'#64748b', marginBottom:3 }}>Type</div>
            <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:6, padding:'6px 9px', fontSize:12, outline:'none', background:'#fff' }}>
              {types.map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={()=>setCreating(false)} style={{ flex:1, padding:'6px', borderRadius:6, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:12 }}>Cancel</button>
            <button onClick={handleCreate} style={{ flex:2, padding:'6px', borderRadius:6, border:'none', background:BLUE, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>Create Project</button>
          </div>
        </div>
      )}
      <div style={{ maxHeight:260, overflowY:'auto' }}>
        {projects.length === 0 && !creating && <div style={{ padding:16, textAlign:'center', color:'#94a3b8', fontSize:12 }}>No projects yet</div>}
        {projects.map(p=>(
          <button key={p.id} onClick={()=>onSelect(p)} style={{ width:'100%', textAlign:'left', padding:'9px 14px', background:selected?.id===p.id?'#e8f2ff':'none', border:'none', borderBottom:'1px solid #f1f5f9', cursor:'pointer' }}>
            <div style={{ fontWeight:500, fontSize:13, color:selected?.id===p.id?BLUE:'#1e293b' }}>{p.name}</div>
            <div style={{ fontSize:11, color:'#94a3b8' }}>{p.client||'No client'} · {(p.documents||[]).length} docs · {p.type?.toUpperCase()}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function AgentCard({ agent, onSelect }) {
  const bg = phaseBg[agent.phase] || '#f8fafc';
  const color = phaseColors[agent.phase] || '#475569';
  return (
    <button onClick={()=>onSelect(agent)}
      style={{ background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:12, padding:'14px 15px', cursor:'pointer', textAlign:'left', width:'100%', transition:'all 0.12s' }}
      onMouseOver={e=>{e.currentTarget.style.borderColor=BLUE;e.currentTarget.style.background='#f0f7ff';}}
      onMouseOut={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.background='#fff';}}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:7 }}>
        <span style={{ fontSize:26 }}>{agent.icon||'📄'}</span>
        <span style={{ fontSize:9, padding:'2px 6px', borderRadius:8, fontWeight:600, background:bg, color }}>{agent.phase}</span>
      </div>
      <div style={{ fontWeight:600, fontSize:13, color:'#1e293b', marginBottom:3 }}>{agent.name}</div>
      <div style={{ fontSize:11, color:'#94a3b8', lineHeight:1.4, marginBottom:8 }}>{agent.description}</div>
      {agent.suggests?.length > 0 && <div style={{ fontSize:10, color:'#94a3b8' }}>→ {agent.suggests.slice(0,2).join(', ')}</div>}
    </button>
  );
}

function GenerationPanel({ agent, project, onBack, onComplete }) {
  const [form, setForm] = useState({ preparedBy:'Vikram Sharma', version:'1.0' });
  const [step, setStep] = useState('form');
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState(null);
  const sf = (k,v) => setForm(f=>({...f,[k]:v}));

  useEffect(() => {
    if (project) sf('projectName', project.name||'');
    if (project) sf('client', project.client||'');
    if (project) sf('sapSystem', project.type||'');
  }, [project]);

  const fields = agent.form?.fields || [
    { id:'projectName', label:'Project Name *', type:'text', required:true, placeholder:'e.g. Accenture S/4HANA Migration' },
    { id:'client', label:'Client / Company', type:'text', placeholder:'e.g. Mars Health & Wellness' },
    { id:'sapSystem', label:'System / Platform', type:'text', placeholder:'e.g. SAP S/4HANA, BTP' },
    { id:'module', label:'Module / Domain', type:'text', placeholder:'e.g. FI, MM, BTP Integration' },
    { id:'processName', label:'Process / Topic *', type:'text', required:true, placeholder:'e.g. Vendor Invoice via Coupa' },
    { id:'preparedBy', label:'Prepared By', type:'text' },
    { id:'version', label:'Version', type:'text' },
  ];

  const handlePreview = async () => {
    setError(null);
    try {
      const data = await api.post('/api/preview', { agentId:agent.id, formData:form, projectId:project?.id });
      setPreview(data);
      setStep('preview');
    } catch(e) { setError(e.message); }
  };

  const handleGenerate = () => {
    if (!form.projectName || !form.processName || !form.description) { setError('Please fill in Project Name, Process Name and Description.'); return; }
    setStep('generating'); setError(null);
    const params = new URLSearchParams({ agentId:agent.id, projectId:project?.id||'', ...form });
    const es = new EventSource(`http://localhost:3002/generate-stream?${params}`);
    es.onmessage = (e) => {
      const { type, data } = JSON.parse(e.data);
      if (type==='status') setStatusMsg(data);
      else if (type==='progress') setProgress(data);
      else if (type==='complete') { es.close(); setResult(data); setStep('result'); if(onComplete) onComplete(data); }
      else if (type==='error') { es.close(); setError(data); setStep('form'); }
    };
    es.onerror = () => { es.close(); setError('Connection lost. Please try again.'); setStep('form'); };
  };

  const downloadHTML = () => {
    const blob = new Blob([result.html], { type:'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = result.fileName;
    a.click();
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <button onClick={onBack} style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13 }}>← Back</button>
        <span style={{ fontSize:28 }}>{agent.icon}</span>
        <div>
          <div style={{ fontWeight:700, fontSize:16 }}>{agent.name}</div>
          <div style={{ fontSize:12, color:'#94a3b8' }}>{agent.description}</div>
        </div>
        {project && <div style={{ marginLeft:'auto', fontSize:11, color:'#94a3b8', background:'#f8fafc', padding:'4px 10px', borderRadius:6, border:'1px solid #e2e8f0' }}>Project: {project.name}</div>}
      </div>

      {step === 'form' && (
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12 }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #e2e8f0', fontWeight:600, fontSize:13 }}>Fill in the details</div>
          <div style={{ padding:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              {fields.map(f=>(
                <div key={f.id}>
                  <div style={{ fontSize:12, fontWeight:500, color:'#64748b', marginBottom:4 }}>{f.label}</div>
                  <input value={form[f.id]||''} onChange={e=>sf(f.id,e.target.value)} placeholder={f.placeholder||''} style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:8, padding:'8px 11px', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}/>
                </div>
              ))}
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:500, color:'#64748b', marginBottom:4 }}>Description / Key Details *</div>
              <textarea value={form.description||''} onChange={e=>sf('description',e.target.value)} rows={6} placeholder="Describe the process, integration points, business rules, stakeholders, scope, constraints, and any specific requirements..." style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:8, padding:'8px 11px', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box', resize:'vertical', lineHeight:1.5 }}/>
              <div style={{ fontSize:11, color:'#94a3b8', marginTop:3 }}>More detail = better document. Include SAP system details, integration points, and business rules.</div>
            </div>
            {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'8px 12px', color:'#dc2626', fontSize:13, marginBottom:12 }}>⚠️ {error}</div>}
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={handlePreview} style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13, fontWeight:500 }}>👁 Preview Prompt</button>
              <button onClick={handleGenerate} style={{ flex:2, padding:'10px', borderRadius:8, border:'none', background:BLUE, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>🤖 Generate with Claude Code CLI</button>
            </div>
          </div>
        </div>
      )}

      {step === 'preview' && preview && (
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12 }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontWeight:600, fontSize:13 }}>👁 Review before generating</span>
            <span style={{ fontSize:11, color:'#94a3b8' }}>Human in the loop</span>
          </div>
          <div style={{ padding:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
              {[['Agent',preview.agentName],['Context',( preview.contextKeys||[]).join(', ')||'None'],['Prev agents',(preview.previousAgents||[]).join(', ')||'None'],['Prompt size',`${preview.promptLength} chars`],['Est. time',preview.estimatedTime],['Engine','Claude Code CLI']].map(([k,v])=>(
                <div key={k} style={{ background:'#f8fafc', borderRadius:8, padding:'8px 10px' }}>
                  <div style={{ fontSize:10, color:'#94a3b8', marginBottom:2 }}>{k}</div>
                  <div style={{ fontSize:12, fontWeight:500, color:'#1e293b' }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ background:'#f8fafc', borderRadius:8, padding:10, marginBottom:14, fontFamily:'monospace', fontSize:11, color:'#475569', lineHeight:1.6, whiteSpace:'pre-wrap', maxHeight:150, overflowY:'auto' }}>{preview.promptPreview}</div>
            <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#92400e', marginBottom:14 }}>⚠️ Review above. Click Generate to proceed or go back to edit.</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>setStep('form')} style={{ padding:'10px 16px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13 }}>← Edit</button>
              <button onClick={handleGenerate} style={{ flex:1, padding:'10px', borderRadius:8, border:'none', background:BLUE, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>✅ Generate!</button>
            </div>
          </div>
        </div>
      )}

      {step === 'generating' && (
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:48, textAlign:'center' }}>
          <div style={{ width:48, height:48, border:'4px solid #e2e8f0', borderTop:`4px solid ${BLUE}`, borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 20px' }}/>
          <div style={{ fontSize:17, fontWeight:700, marginBottom:6 }}>Generating {agent.name}...</div>
          <div style={{ fontSize:13, color:BLUE, marginBottom:4, minHeight:20 }}>{statusMsg}</div>
          <div style={{ fontSize:12, color:'#94a3b8', minHeight:18, marginBottom:24 }}>{progress}</div>
          <div style={{ display:'inline-flex', flexDirection:'column', gap:6, textAlign:'left' }}>
            {['📡 SSE connection open — no timeout','🤖 Claude Code CLI running','📝 Generating document with SAP best practices','📄 Assembling final HTML output'].map((m,i)=>(
              <div key={i} style={{ fontSize:12, color:'#475569', background:'#f8fafc', borderRadius:6, padding:'6px 12px', border:'1px solid #e2e8f0' }}>{m}</div>
            ))}
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {step === 'result' && result && (
        <div>
          <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', gap:12, marginBottom:10, flexWrap:'wrap' }}>
            <span style={{ fontSize:22 }}>✅</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, color:'#15803d', fontSize:14 }}>{result.agentName} generated successfully!</div>
              <div style={{ fontSize:11, color:'#16a34a' }}>Saved to project · Download HTML · Print → Save as PDF</div>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <button onClick={downloadHTML} style={{ padding:'7px 14px', borderRadius:8, border:'none', background:BLUE, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>⬇ Download HTML</button>
              <button onClick={()=>{const w=window.open('','_blank');w.document.write(result.html);w.document.close();w.print();}} style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:12 }}>🖨 Print/PDF</button>
              <button onClick={onBack} style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:12 }}>+ New Doc</button>
            </div>
          </div>
          {result.suggests?.length > 0 && (
            <div style={{ background:'#e8f2ff', border:'1px solid #bfdbfe', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#1e40af', marginBottom:10 }}>
              💡 Suggested next: <strong>{result.suggests.join(', ')}</strong>
            </div>
          )}
          <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'7px 12px', fontSize:11, color:'#92400e', marginBottom:10 }}>
            💡 To save as PDF: click Print/PDF → choose <strong>Save as PDF</strong> → Save
          </div>
          <div style={{ border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden' }}>
            <div style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0', padding:'8px 12px', display:'flex', alignItems:'center', gap:5 }}>
              {['#f87171','#fbbf24','#34d399'].map(c=><div key={c} style={{ width:10, height:10, borderRadius:'50%', background:c }}/>)}
              <span style={{ fontSize:11, color:'#94a3b8', marginLeft:5 }}>{result.fileName}</span>
            </div>
            <iframe srcDoc={result.html} style={{ display:'block', width:'100%', height:700, border:'none' }} title="Document Preview"/>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('agents');
  const [agents, setAgents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [phase, setPhase] = useState('all');
  const [showAssistant, setShowAssistant] = useState(false);
  const [engineInfo, setEngineInfo] = useState(null);
  const [config, setConfig] = useState({ app:{ name:'DeliverAI', tagline:'AI agents for every project phase' } });
  const [setupDone, setSetupDone] = useState(localStorage.getItem('deliverAI_setup')==='done');

  useEffect(() => {
    api.get('/api/agents').then(setAgents).catch(()=>{});
    api.get('/api/projects').then(setProjects).catch(()=>{});
    api.get('/api/engines').then(setEngineInfo).catch(()=>{});
    api.get('/api/config').then(setConfig).catch(()=>{});
  }, []);

  const phases = ['all','discover','explore','realize','test','deploy','run'];
  const filtered = phase==='all' ? agents : agents.filter(a=>a.phase===phase);

  const handleComplete = () => {
    api.get('/api/projects').then(setProjects).catch(()=>{});
    if (selectedProject) api.get(`/api/projects/${selectedProject.id}`).then(setSelectedProject).catch(()=>{});
  };

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',Arial,sans-serif", minHeight:'100vh', background:'#f1f5f9', color:'#0f172a', display:'flex', flexDirection:'column' }}>
      {!setupDone && <SetupWizard onComplete={()=>{ localStorage.setItem('deliverAI_setup','done'); setSetupDone(true); }}/>}

      <header style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 20px', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:1400, margin:'0 auto', display:'flex', alignItems:'center', height:54, gap:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ background:BLUE, color:'#fff', fontWeight:800, fontSize:11, padding:'4px 8px', borderRadius:5, letterSpacing:0.5 }}>D</div>
            <div>
              <div style={{ fontWeight:700, fontSize:14, lineHeight:1.2 }}>{config?.app?.name||'DeliverAI'}</div>
              <div style={{ fontSize:10, color:'#94a3b8' }}>{config?.app?.tagline||'AI agents for every project phase'}</div>
            </div>
          </div>
          <nav style={{ display:'flex', gap:2, marginLeft:8 }}>
            {['agents','settings'].map(v=>(
              <button key={v} onClick={()=>{setView(v);setSelectedAgent(null);}} style={{ background:view===v?'#e8f2ff':'none', color:view===v?BLUE:'#64748b', border:'none', borderRadius:6, padding:'5px 12px', fontSize:13, cursor:'pointer', fontWeight:view===v?600:400 }}>
                {v.charAt(0).toUpperCase()+v.slice(1)}
              </button>
            ))}
          </nav>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
            {engineInfo && <span style={{ fontSize:10, background:'#f0fdf4', color:'#16a34a', padding:'2px 8px', borderRadius:10, border:'1px solid #86efac', fontWeight:500 }}>✓ {engineInfo.current}</span>}
            <button onClick={()=>setShowAssistant(s=>!s)} style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:showAssistant?'#e8f2ff':'#fff', color:showAssistant?BLUE:'#475569', cursor:'pointer', fontSize:12, fontWeight:500 }}>🤖 Assistant</button>
          </div>
        </div>
      </header>

      <div style={{ display:'flex', flex:1, maxWidth:1400, margin:'0 auto', width:'100%', padding:16, gap:14 }}>
        <aside style={{ width:236, flexShrink:0, display:'flex', flexDirection:'column', gap:12 }}>
          <ProjectPanel projects={projects} selected={selectedProject} onSelect={setSelectedProject} onCreate={p=>{setProjects(ps=>[p,...ps]);setSelectedProject(p);}}/>
          {selectedProject && (
            <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden' }}>
              <div style={{ padding:'10px 14px', borderBottom:'1px solid #e2e8f0', fontWeight:600, fontSize:13 }}>Documents</div>
              <div style={{ maxHeight:180, overflowY:'auto' }}>
                {(selectedProject.documents||[]).length===0
                  ? <div style={{ padding:12, fontSize:11, color:'#94a3b8', textAlign:'center' }}>No documents yet</div>
                  : (selectedProject.documents||[]).map((d,i)=>(
                    <div key={i} style={{ padding:'7px 12px', borderBottom:'1px solid #f1f5f9' }}>
                      <div style={{ fontWeight:500, fontSize:12, color:'#1e293b' }}>{d.agentName}</div>
                      <div style={{ fontSize:10, color:'#94a3b8' }}>v{d.version} · {new Date(d.generatedAt).toLocaleDateString()}</div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
          {showAssistant && <Assistant projectId={selectedProject?.id} onClose={()=>setShowAssistant(false)}/>}
        </aside>

        <main style={{ flex:1, minWidth:0 }}>
          {selectedAgent ? (
            <GenerationPanel agent={selectedAgent} project={selectedProject} onBack={()=>setSelectedAgent(null)} onComplete={handleComplete}/>
          ) : (
            <div>
              <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
                {phases.map(p=>(
                  <button key={p} onClick={()=>setPhase(p)} style={{ padding:'5px 12px', borderRadius:8, border:'1px solid', borderColor:phase===p?BLUE:'#e2e8f0', background:phase===p?BLUE:'#fff', color:phase===p?'#fff':'#64748b', fontSize:12, cursor:'pointer', fontWeight:phase===p?600:400 }}>
                    {p==='all'?'All':p.charAt(0).toUpperCase()+p.slice(1)} <span style={{ opacity:0.7, fontSize:10 }}>({p==='all'?agents.length:agents.filter(a=>a.phase===p).length})</span>
                  </button>
                ))}
                <button onClick={()=>api.post('/api/agents/reload').then(()=>api.get('/api/agents').then(setAgents))} style={{ marginLeft:'auto', padding:'5px 10px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:12, color:'#64748b' }}>↻ Reload Agents</button>
              </div>
              {filtered.length===0 ? (
                <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:48, textAlign:'center', color:'#94a3b8' }}>
                  <div style={{ fontSize:32, marginBottom:10 }}>🤖</div>
                  <div style={{ fontSize:14, marginBottom:4 }}>No agents for this phase</div>
                  <div style={{ fontSize:12 }}>Add agent folders to agents/ directory and click Reload</div>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:10 }}>
                  {filtered.map(a=><AgentCard key={a.id} agent={a} onSelect={setSelectedAgent}/>)}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

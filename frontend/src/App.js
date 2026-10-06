import React, { useState, useEffect, useRef } from 'react';
import Settings from './Settings';
import Activity from './Activity';
import { startJob, getRunningCount, subscribe, unsubscribe, importJob, updateApproval } from './JobManager';

const api = {
  get: (url) => fetch(url).then(r => r.json()),
  post: (url, body) => fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }).then(r => r.json()),
};

const BLUE = '#0070F2';
const phaseColors = { discover:'#1a5276', explore:'#1a5c1a', realize:'#7d6608', test:'#7b241c', deploy:'#6c3483', run:'#1a4a8c' };
const phaseBg = { discover:'#e8f4f8', explore:'#e8f8e8', realize:'#fef9e7', test:'#fdecea', deploy:'#f4ecf7', run:'#eaf2ff' };

function isConfigured(connectionId, envConfig) {
  const keyMap = {
    claude:  ['GIT_BASH_PATH','CLAUDE_PATH'],
    btp:     ['BTP_TOKEN_URL','BTP_CLIENT_ID','BTP_CLIENT_SECRET'],
    s4:      ['S4_HOST','S4_USERNAME'],
    github:  ['GITHUB_TOKEN','GITHUB_USER'],
    aicore:  ['AICORE_TOKEN_URL','AICORE_CLIENT_ID'],
    hana:    ['HANA_HOST','HANA_USER'],
    snow:    ['SNOW_INSTANCE','SNOW_USERNAME'],
    joule:   ['JOULE_STUDIO_URL','JOULE_CLIENT_ID']
  };
  const keys = keyMap[connectionId] || [];
  if (keys.length === 0) return false;
  if(connectionId==="claude") return true; return keys.some(k => envConfig[k] && envConfig[k] !== '' && envConfig[k] !== '••••••••' && !envConfig[k].includes('your_') && !envConfig[k].includes('USERNAME'));
}

function ConnectionBadge({ connId, configured, onConfigure }) {
  const icons = { claude:'🤖', btp:'☁️', s4:'🏢', github:'🐙', aicore:'🧠', hana:'🗄️', snow:'🎫', joule:'💬' };
  return (
    <span onClick={() => !configured && onConfigure(connId)}
      title={connId + (configured ? ' configured' : ' not configured - click to configure')}
      style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:9, padding:'2px 6px', borderRadius:8, fontWeight:600, cursor: configured ? 'default' : 'pointer',
        background: configured ? '#f0fdf4' : '#fef2f2',
        color: configured ? '#16a34a' : '#dc2626',
        border: '1px solid ' + (configured ? '#86efac' : '#fecaca') }}>
      <span>{icons[connId] || '🔗'}</span>
      <span>{configured ? 'OK' : 'Setup'}</span>
    </span>
  );
}

function Assistant({ projectId, onClose }) {
  const [messages, setMessages] = useState([{ role:'assistant', text:'Hi! I am your DeliverAI assistant. I can guide you on which agents to use, answer SAP questions, and help with your project.' }]);
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
    const es = new EventSource('http://localhost:3002/assistant-stream?' + params);
    es.onmessage = (e) => {
      const { type, data } = JSON.parse(e.data);
      if (type === 'complete') { es.close(); setMessages(m => [...m, { role:'assistant', text:data.message }]); setLoading(false); }
      else if (type === 'error') { es.close(); setMessages(m => [...m, { role:'assistant', text:'Sorry, error.' }]); setLoading(false); }
    };
    es.onerror = () => { es.close(); setLoading(false); };
  };

  return (
    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, display:'flex', flexDirection:'column', height:400 }}>
      <div style={{ padding:'10px 14px', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span>🤖</span>
          <span style={{ fontWeight:600, fontSize:13 }}>AI Assistant</span>
          <span style={{ fontSize:9, background:'#e8f2ff', color:BLUE, padding:'2px 6px', borderRadius:8, fontWeight:600 }}>SAP Expert</span>
        </div>
        {onClose && <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#94a3b8' }}>x</button>}
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:10, display:'flex', flexDirection:'column', gap:6 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
            <div style={{ maxWidth:'85%', padding:'7px 11px', borderRadius:m.role==='user'?'12px 12px 4px 12px':'12px 12px 12px 4px',
              background:m.role==='user'?BLUE:'#f1f5f9', color:m.role==='user'?'#fff':'#1e293b', fontSize:12, lineHeight:1.5 }}>{m.text}</div>
          </div>
        ))}
        {loading && <div style={{ display:'flex', gap:3, padding:'6px 10px' }}>{[0,1,2].map(i=><div key={i} style={{ width:5, height:5, borderRadius:'50%', background:'#94a3b8' }}/>)}</div>}
        <div ref={bottomRef}/>
      </div>
      <div style={{ padding:8, borderTop:'1px solid #e2e8f0', display:'flex', gap:6 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}
          placeholder="Ask about SAP, agents, or your project..."
          style={{ flex:1, border:'1px solid #e2e8f0', borderRadius:8, padding:'7px 10px', fontSize:12, outline:'none', fontFamily:'inherit' }}/>
        <button onClick={send} style={{ padding:'7px 12px', borderRadius:8, border:'none', background:BLUE, color:'#fff', cursor:'pointer' }}>→</button>
      </div>
    </div>
  );
}

function ProjectPanel({ projects, selected, onSelect, onCreate }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name:'', client:'', type:'s4hana' });

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    const p = await api.post('/api/projects', form);
    onCreate(p);
    setCreating(false);
    setForm({ name:'', client:'', type:'s4hana' });
  };

  return (
    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden' }}>
      <div style={{ padding:'10px 14px', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontWeight:600, fontSize:13 }}>Projects</span>
        <button onClick={()=>setCreating(c=>!c)} style={{ fontSize:11, padding:'3px 9px', borderRadius:6, border:'none', background:BLUE, color:'#fff', cursor:'pointer', fontWeight:600 }}>+ New</button>
      </div>
      {creating && (
        <div style={{ padding:12, background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
          {[['Project Name','name','e.g. Mars S4HANA'],['Client','client','e.g. Mars H&W']].map(([l,k,p])=>(
            <div key={k} style={{ marginBottom:8 }}>
              <div style={{ fontSize:11, fontWeight:500, color:'#64748b', marginBottom:3 }}>{l}</div>
              <input value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={p}
                style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:6, padding:'6px 9px', fontSize:12, outline:'none', boxSizing:'border-box' }}/>
            </div>
          ))}
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:11, fontWeight:500, color:'#64748b', marginBottom:3 }}>Type</div>
            <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}
              style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:6, padding:'6px 9px', fontSize:12, outline:'none', background:'#fff' }}>
              {[{id:'s4hana-public',label:'SAP S/4HANA Public Cloud'},{id:'s4hana-private',label:'SAP S/4HANA Private Cloud (PCE)'},{id:'s4hana-onprem',label:'SAP S/4HANA On-Premise'},{id:'ecc',label:'SAP ECC'},{id:'btp',label:'SAP BTP'},{id:'oracle',label:'Oracle'},{id:'workday',label:'Workday'},{id:'salesforce',label:'Salesforce'},{id:'custom',label:'Custom / Other'}].map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={()=>setCreating(false)} style={{ flex:1, padding:'6px', borderRadius:6, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:12 }}>Cancel</button>
            <button onClick={handleCreate} style={{ flex:2, padding:'6px', borderRadius:6, border:'none', background:BLUE, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>Create</button>
          </div>
        </div>
      )}
      <div style={{ maxHeight:240, overflowY:'auto' }}>
        {projects.length === 0 && !creating && <div style={{ padding:16, textAlign:'center', color:'#94a3b8', fontSize:12 }}>No projects yet</div>}
        {projects.map(p=>(
          <button key={p.id} onClick={()=>onSelect(p)}
            style={{ width:'100%', textAlign:'left', padding:'9px 14px', background:selected?.id===p.id?'#e8f2ff':'none', border:'none', borderBottom:'1px solid #f1f5f9', cursor:'pointer' }}>
            <div style={{ fontWeight:500, fontSize:13, color:selected?.id===p.id?BLUE:'#1e293b' }}>{p.name}</div>
            <div style={{ fontSize:11, color:'#94a3b8' }}>{p.client||'No client'} · {(p.documents||[]).length} docs</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function AgentCard({ agent, onSelect, envConfig, onConfigure }) {
  const conns = agent.requiredConnections || ['claude'];
  const allOk = conns.every(c => isConfigured(c, envConfig));
  const missing = conns.filter(c => !isConfigured(c, envConfig));
  const bg = phaseBg[agent.phase] || '#f8fafc';
  const color = phaseColors[agent.phase] || '#475569';

  return (
    <div style={{ background:'#fff', border:'1.5px solid ' + (allOk ? '#e2e8f0' : '#fde68a'), borderRadius:12, padding:'14px 15px', display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:7 }}>
        <span style={{ fontSize:26 }}>{agent.icon||'📄'}</span>
        <span style={{ fontSize:9, padding:'2px 6px', borderRadius:8, fontWeight:600, background:bg, color }}>{agent.phase}</span>
      </div>
      <div style={{ fontWeight:600, fontSize:13, color:'#1e293b', marginBottom:3 }}>{agent.name}</div>
      <div style={{ fontSize:11, color:'#94a3b8', lineHeight:1.4, marginBottom:8, flex:1 }}>{agent.description}</div>
      <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:8 }}>
        {conns.map(c => <ConnectionBadge key={c} connId={c} configured={isConfigured(c, envConfig)} onConfigure={onConfigure}/>)}
      </div>
      {!allOk && (
        <div style={{ fontSize:10, color:'#92400e', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:6, padding:'4px 8px', marginBottom:8 }}>
          Setup required: {missing.join(', ')}
        </div>
      )}
      <button onClick={()=>onSelect(agent)}
        style={{ width:'100%', padding:'7px', borderRadius:8, border:'none', background:allOk?BLUE:'#94a3b8', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>
        {allOk ? 'Generate' : 'Configure First'}
      </button>
    </div>
  );
}

function GenerationPanel({ agent, project, onBack, onComplete, envConfig, onConfigure, onStartJob }) {
  const [form, setForm] = useState({ preparedBy:'Vikram Sharma', version:'1.0' });
  const [step, setStep] = useState('form');
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState(null);
  const [refineInput, setRefineInput] = useState('');
  const [refining, setRefining] = useState(false);
  const [originalResult, setOriginalResult] = useState(null);
  const sf = (k,v) => setForm(f=>({...f,[k]:v}));

  useEffect(() => {
    if (project) { sf('projectName', project.name||''); sf('client', project.client||''); sf('sapSystem', project.type||''); }
  }, [project?.id]);

  const conns = agent.requiredConnections || ['claude'];
  const missing = conns.filter(c => !isConfigured(c, envConfig));

  const fields = agent.form?.fields || [
    {id:'projectName',label:'Project Name',type:'text',required:true,placeholder:'e.g. Accenture S4HANA Migration'},
    {id:'client',label:'Client',type:'text',placeholder:'e.g. Mars Health and Wellness'},
    {id:'sapSystem',label:'System',type:'text',placeholder:'e.g. SAP S/4HANA'},
    {id:'module',label:'Module',type:'text',placeholder:'e.g. FI, MM'},
    {id:'processName',label:'Process / Topic',type:'text',required:true,placeholder:'e.g. Vendor Invoice Processing'},
    {id:'preparedBy',label:'Prepared By',type:'text'},
    {id:'version',label:'Version',type:'text'},
  ];

  const handlePreview = async () => {
    setError(null);
    try {
      const d = await api.post('/api/preview', {agentId:agent.id, formData:form, projectId:project?.id});
      setPreview(d); setStep('preview');
    } catch(e) { setError(e.message); }
  };

  const handleGenerate = () => {
    if (!form.projectName || !form.processName) { setError('Fill in Project Name and Process Name.'); return; }
    if (!form.description) { setError('Please add a description.'); return; }
    setError(null);
    if (onStartJob) {
      onStartJob(agent.id, agent.name, project?.id, form);
    }
  };

  const handleRefine = () => {
    if (!refineInput.trim() || refining) return;
    setRefining(true);
    setOriginalResult(result);
    const instruction = refineInput.trim();
    setRefineInput('');
    const existingContent = result.html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().substring(0,3000);
    const refinePrompt = 'You are refining an existing document. Here is the current document content:\n\n' + existingContent + '\n\nUser instruction: ' + instruction + '\n\nGenerate the complete improved HTML document with ALL CSS embedded. Return ONLY HTML starting with DOCTYPE.';
    const params = new URLSearchParams({ agentId: agent.id, projectId: project?.id||'', projectName: form.projectName||'', processName: form.processName||'', description: refinePrompt, client: form.client||'', sapSystem: form.sapSystem||'', module: form.module||'', preparedBy: form.preparedBy||'', version: form.version||'1.0' });
    const es = new EventSource('http://localhost:3002/generate-stream?' + params);
    es.onmessage = (e) => {
      const { type, data } = JSON.parse(e.data);
      if (type === 'complete') {
        es.close();
        setResult(data);
        setRefining(false);
        if (onComplete) onComplete(data);
      } else if (type === 'error') {
        es.close();
        setRefining(false);
        setError('Refinement failed: ' + data);
      }
    };
    es.onerror = () => { es.close(); setRefining(false); };
  };

  const downloadHTML = () => {
    const blob = new Blob([result.html], {type:'text/html'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = result.fileName;
    a.click();
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <button onClick={onBack} style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13 }}>Back</button>
        <span style={{ fontSize:28 }}>{agent.icon}</span>
        <div>
          <div style={{ fontWeight:700, fontSize:16 }}>{agent.name}</div>
          <div style={{ fontSize:12, color:'#94a3b8' }}>{agent.description}</div>
        </div>
        {project && <div style={{ marginLeft:'auto', fontSize:11, color:'#94a3b8', background:'#f8fafc', padding:'4px 10px', borderRadius:6, border:'1px solid #e2e8f0' }}>Project: {project.name}</div>}
      </div>

      {missing.length > 0 && (
        <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, padding:'10px 14px', marginBottom:12, fontSize:13, color:'#92400e', display:'flex', alignItems:'center', gap:10 }}>
          <span>Setup required: {missing.join(', ')}</span>
          <button onClick={()=>onConfigure()} style={{ padding:'4px 10px', borderRadius:6, border:'none', background:'#92400e', color:'#fff', cursor:'pointer', fontSize:11, fontWeight:600 }}>Configure Now</button>
        </div>
      )}

      {step === 'form' && (
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12 }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #e2e8f0', fontWeight:600, fontSize:13 }}>Fill in the details</div>
          <div style={{ padding:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              {fields.filter(f=>f.type!=='textarea').map(f=>(
                <div key={f.id}>
                  <div style={{ fontSize:12, fontWeight:500, color:'#64748b', marginBottom:4 }}>{f.label}</div>
                  <input value={form[f.id]||''} onChange={e=>sf(f.id,e.target.value)} placeholder={f.placeholder||''}
                    style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:8, padding:'8px 11px', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}/>
                </div>
              ))}
            </div>
            {fields.filter(f=>f.type==='textarea').map(f=>(
              <div key={f.id} style={{ marginBottom:12 }}>
                <div style={{ fontSize:12, fontWeight:500, color:'#64748b', marginBottom:4 }}>{f.label}</div>
                <textarea value={form[f.id]||''} onChange={e=>sf(f.id,e.target.value)} rows={5} placeholder={f.placeholder||''}
                  style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:8, padding:'8px 11px', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box', resize:'vertical', lineHeight:1.5 }}/>
              </div>
            ))}
            {!fields.some(f=>f.id==='description') && (
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:12, fontWeight:500, color:'#64748b', marginBottom:4 }}>Description / Key Details</div>
                <textarea value={form.description||''} onChange={e=>sf('description',e.target.value)} rows={5}
                  placeholder="Describe the process, requirements, integration points, business rules, stakeholders..."
                  style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:8, padding:'8px 11px', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box', resize:'vertical', lineHeight:1.5 }}/>
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:3 }}>More detail = better document</div>
              </div>
            )}
            {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'8px 12px', color:'#dc2626', fontSize:13, marginBottom:12 }}>{error}</div>}
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={handlePreview} style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13 }}>Preview Prompt</button>
              <button onClick={()=>{ handleGenerate(); setStep('generating'); }} style={{ flex:2, padding:'10px', borderRadius:8, border:'none', background:BLUE, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>Generate with Claude Code CLI</button>
            </div>
          </div>
        </div>
      )}

      {step === 'preview' && preview && (
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12 }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontWeight:600, fontSize:13 }}>Preview — Human in the Loop</span>
            <span style={{ fontSize:11, color:'#94a3b8' }}>Review before generating</span>
          </div>
          <div style={{ padding:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12 }}>
              {[['Agent',preview.agentName],['Context',(preview.contextKeys||[]).join(', ')||'None'],['Prev agents',(preview.previousAgents||[]).join(', ')||'None'],['Prompt size',preview.promptLength+' chars'],['Est. time',preview.estimatedTime],['Engine','Claude Code CLI']].map(([k,v])=>(
                <div key={k} style={{ background:'#f8fafc', borderRadius:8, padding:'8px 10px' }}>
                  <div style={{ fontSize:10, color:'#94a3b8', marginBottom:2 }}>{k}</div>
                  <div style={{ fontSize:12, fontWeight:500 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ background:'#f8fafc', borderRadius:8, padding:10, marginBottom:12, fontFamily:'monospace', fontSize:11, color:'#475569', lineHeight:1.6, maxHeight:120, overflowY:'auto' }}>{preview.promptPreview}</div>
            <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#92400e', marginBottom:12 }}>
              Review the context above. The AI assistant will use this to generate your document.
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>setStep('form')} style={{ padding:'10px 16px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13 }}>Edit</button>
              <button onClick={()=>{ handleGenerate(); setStep('generating'); }} style={{ flex:1, padding:'10px', borderRadius:8, border:'none', background:BLUE, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>Generate in Background</button>
            </div>
          </div>
        </div>
      )}

      {step === 'generating' && (
        <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:12, padding:32, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🚀</div>
          <div style={{ fontSize:17, fontWeight:700, marginBottom:8, color:'#15803d' }}>Running in background</div>
          <div style={{ fontSize:13, color:'#16a34a', marginBottom:16 }}>{agent.name} is generating. You can navigate freely.</div>
          <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
            <button onClick={onBack} style={{ padding:'8px 16px', borderRadius:8, border:'none', background:BLUE, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>View Activity Dashboard</button>
            <button onClick={()=>setStep('form')} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13 }}>Generate Another</button>
          </div>
        </div>
      )}

      {step === 'result' && result && (
        <div>
          <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', gap:12, marginBottom:10, flexWrap:'wrap' }}>
            <span>Done</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, color:'#15803d', fontSize:14 }}>{result.agentName} generated</div>
              <div style={{ fontSize:11, color:'#16a34a' }}>Saved to project. Download HTML then print to PDF.</div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={downloadHTML} style={{ padding:'7px 14px', borderRadius:8, border:'none', background:BLUE, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>Download HTML</button>
              <button onClick={()=>{const w=window.open('','_blank');w.document.write(result.html);w.document.close();w.print();}} style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:12 }}>Print PDF</button>
              <button onClick={onBack} style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:12 }}>New Doc</button>
            </div>
          </div>
          {result.suggests?.length > 0 && (
            <div style={{ background:'#e8f2ff', border:'1px solid #bfdbfe', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#1e40af', marginBottom:10 }}>
              Suggested next agents: {result.suggests.join(', ')}
            </div>
          )}
          <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'7px 12px', fontSize:11, color:'#92400e', marginBottom:10 }}>
            To save as PDF: click Print PDF then choose Save as PDF in print dialog
          </div>
          <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:16, marginBottom:10 }}>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>Refine with AI</div>
            <div style={{ fontSize:11, color:'#94a3b8', marginBottom:10 }}>Tell the agent what to change and it will regenerate the document</div>
            <div style={{ display:'flex', gap:8 }}>
              <input value={refineInput} onChange={e=>setRefineInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&handleRefine()}
                placeholder='e.g. Make executive summary shorter, Add data migration risks, Change ECC to S/4HANA...'
                style={{ flex:1, border:'1px solid #e2e8f0', borderRadius:8, padding:'8px 11px', fontSize:13, outline:'none', fontFamily:'inherit' }}/>
              <button onClick={handleRefine} disabled={refining || !refineInput.trim()}
                style={{ padding:'8px 16px', borderRadius:8, border:'none', background:refining?'#94a3b8':'#0070F2', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, whiteSpace:'nowrap' }}>
                {refining ? 'Refining...' : 'Refine'}
              </button>
            </div>
            {refining && (
              <div style={{ marginTop:8, fontSize:12, color:'#0070F2', display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:12, height:12, border:'2px solid #bfdbfe', borderTop:'2px solid #0070F2', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
                Claude is refining your document...
              </div>
            )}
            {originalResult && !refining && (
              <div style={{ marginTop:8, display:'flex', gap:6, alignItems:'center' }}>
                <span style={{ fontSize:11, color:'#16a34a' }}>Document refined successfully</span>
                <button onClick={()=>{ setResult(originalResult); setOriginalResult(null); }}
                  style={{ fontSize:11, padding:'2px 8px', borderRadius:6, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', color:'#64748b' }}>
                  Undo — restore original
                </button>
              </div>
            )}
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
  const [envConfig, setEnvConfig] = useState({});
  const [runningCount, setRunningCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  useEffect(() => {
    api.get('/api/agents').then(setAgents).catch(()=>{});
    api.get('/api/projects').then(setProjects).catch(()=>{});
    api.get('/api/engines').then(setEngineInfo).catch(()=>{});
    api.get('/api/config').then(setConfig).catch(()=>{});
    api.get('/api/config/env').then(d => setEnvConfig(d.config||{})).catch(()=>{});
    subscribe('app', () => setRunningCount(getRunningCount()));
    loadExistingDocs();
    return () => unsubscribe('app');
  }, []);

  const phases = ['all','discover','explore','realize','test','deploy','run'];
  const filtered = phase==='all' ? agents : agents.filter(a=>a.phase===phase);

  const handleComplete = () => {
    api.get('/api/projects').then(setProjects).catch(()=>{});
    if (selectedProject) api.get('/api/projects/'+selectedProject.id).then(setSelectedProject).catch(()=>{});
  };

  const handleConfigure = () => { setView('settings'); setSelectedAgent(null); };
  const handleStartJob = (agentId, agentName, projectId, formData) => { startJob(agentId, agentName, projectId, formData); setView('activity'); setSelectedAgent(null); };

  const loadExistingDocs = async () => {
    try {
      const projects = await api.get('/api/projects');
      projects.forEach(project => {
        (project.documents || []).forEach(doc => {
          const jobId = doc.agentId + '-' + new Date(doc.generatedAt).getTime();
          importJob({
            jobId,
            agentId: doc.agentId,
            agentName: doc.agentName,
            projectId: project.id,
            formData: { projectName: project.name, client: project.client, sapSystem: project.type },
            status: 'completed',
            logs: [{ time: doc.generatedAt, msg: 'Document loaded from project' }],
            result: { fileName: doc.fileName, agentName: doc.agentName, suggests: [] },
            startedAt: doc.generatedAt,
            completedAt: doc.generatedAt
          });
        });
      });
    } catch(e) { console.error('Could not load existing docs:', e); }
  };

  const handleSync = async (direction) => {
    setSyncing(true);
    setSyncMsg(direction === 'push' ? 'Syncing to private repo...' : 'Restoring from private repo...');
    try {
      const response = await fetch('/api/sync/' + direction, { method: 'POST' });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n').filter(l => l.startsWith('data: '));
        lines.forEach(line => {
          try {
            const { message } = JSON.parse(line.replace('data: ', ''));
            if (message === 'DONE') {
              setSyncing(false);
              setSyncMsg(direction === 'push' ? 'Synced successfully' : 'Restored successfully');
              setTimeout(() => setSyncMsg(''), 3000);
              if (direction === 'pull') api.get('/api/projects').then(setProjects).catch(()=>{});
            } else {
              setSyncMsg(message);
            }
          } catch(e) {}
        });
      }
    } catch(e) {
      setSyncing(false);
      setSyncMsg('Sync failed: ' + e.message);
    }
  };

  return (
    <div style={{ fontFamily:'Inter, Segoe UI, Arial, sans-serif', minHeight:'100vh', background:'#f1f5f9', color:'#0f172a', display:'flex', flexDirection:'column' }}>
      <header style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 20px', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:1400, margin:'0 auto', display:'flex', alignItems:'center', height:54, gap:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ background:BLUE, color:'#fff', fontWeight:800, fontSize:11, padding:'4px 8px', borderRadius:5 }}>D</div>
            <div>
              <div style={{ fontWeight:700, fontSize:14 }}>{config?.app?.name||'DeliverAI'}</div>
              <div style={{ fontSize:10, color:'#94a3b8' }}>{config?.app?.tagline||'AI agents for every project phase'}</div>
            </div>
          </div>
          <nav style={{ display:'flex', gap:2, marginLeft:8 }}>
            {['agents','activity','settings'].map(v=>(
              <button key={v} onClick={()=>{ setView(v); setSelectedAgent(null); }}
                style={{ background:view===v?'#e8f2ff':'none', color:view===v?BLUE:'#64748b', border:'none', borderRadius:6, padding:'5px 12px', fontSize:13, cursor:'pointer', fontWeight:view===v?600:400 }}>
                {v==='agents'?'Agents':v==='activity'?'Activity'+(runningCount>0?' ('+runningCount+')':''):'Settings'}
              </button>
            ))}
          </nav>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
            {engineInfo && <span style={{ fontSize:10, background:'#f0fdf4', color:'#16a34a', padding:'2px 8px', borderRadius:10, border:'1px solid #86efac', fontWeight:500 }}>Connected: {engineInfo.current}</span>}
            {syncMsg && <span style={{ fontSize:10, color:syncing?'#0070F2':'#16a34a', padding:'2px 8px', borderRadius:10, background:syncing?'#e8f2ff':'#f0fdf4', border:'1px solid', borderColor:syncing?'#bfdbfe':'#86efac' }}>{syncMsg}</span>}
            <button onClick={()=>handleSync('pull')} disabled={syncing} title="Restore from private repo"
              style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:11, color:'#64748b' }}>
              {syncing ? '...' : '⬇ Sync'}
            </button>
            <button onClick={()=>handleSync('push')} disabled={syncing} title="Save & sync to private repo"
              style={{ padding:'6px 10px', borderRadius:8, border:'none', background:'#0070F2', cursor:'pointer', fontSize:11, color:'#fff', fontWeight:600 }}>
              {syncing ? '...' : '⬆ Save & Sync'}
            </button>
            <button onClick={()=>setShowAssistant(s=>!s)}
              style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:showAssistant?'#e8f2ff':'#fff', color:showAssistant?BLUE:'#475569', cursor:'pointer', fontSize:12 }}>
              AI Assistant
            </button>
          </div>
        </div>
      </header>

      <div style={{ display:'flex', flex:1, maxWidth:1400, margin:'0 auto', width:'100%', padding:16, gap:14 }}>
        {view === 'activity' ? (
          <div style={{ flex:1 }}><Activity /></div>
        ) : view === 'settings' ? (
          <div style={{ flex:1 }}><Settings /></div>
        ) : (
          <>
            <aside style={{ width:236, flexShrink:0, display:'flex', flexDirection:'column', gap:12 }}>
              <ProjectPanel projects={projects} selected={selectedProject} onSelect={setSelectedProject}
                onCreate={p=>{ setProjects(ps=>[p,...ps]); setSelectedProject(p); }}/>
              {selectedProject && (
                <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden' }}>
                  <div style={{ padding:'10px 14px', borderBottom:'1px solid #e2e8f0', fontWeight:600, fontSize:13 }}>Documents</div>
                  <div style={{ maxHeight:180, overflowY:'auto' }}>
                    {(selectedProject.documents||[]).length===0
                      ? <div style={{ padding:12, fontSize:11, color:'#94a3b8', textAlign:'center' }}>No documents yet</div>
                      : (selectedProject.documents||[]).map((d,i)=>(
                        <div key={i} style={{ padding:'7px 12px', borderBottom:'1px solid #f1f5f9' }}>
                          <div style={{ fontWeight:500, fontSize:12 }}>{d.agentName}</div>
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
                <GenerationPanel agent={selectedAgent} project={selectedProject} onBack={()=>setSelectedAgent(null)}
                  onComplete={handleComplete} envConfig={envConfig} onConfigure={handleConfigure} onStartJob={handleStartJob}/>
              ) : (
                <div>
                  <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
                    {phases.map(p=>(
                      <button key={p} onClick={()=>setPhase(p)}
                        style={{ padding:'5px 12px', borderRadius:8, border:'1px solid', borderColor:phase===p?BLUE:'#e2e8f0', background:phase===p?BLUE:'#fff', color:phase===p?'#fff':'#64748b', fontSize:12, cursor:'pointer', fontWeight:phase===p?600:400 }}>
                        {p==='all'?'All':p.charAt(0).toUpperCase()+p.slice(1)} ({p==='all'?agents.length:agents.filter(a=>a.phase===p).length})
                      </button>
                    ))}
                    <button onClick={()=>api.post('/api/agents/reload').then(()=>api.get('/api/agents').then(setAgents))}
                      style={{ marginLeft:'auto', padding:'5px 10px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:12, color:'#64748b' }}>
                      Reload Agents
                    </button>
                  </div>
                  {filtered.length===0 ? (
                    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:48, textAlign:'center', color:'#94a3b8' }}>
                      <div style={{ fontSize:32, marginBottom:10 }}>🤖</div>
                      <div style={{ fontSize:14 }}>No agents for this phase</div>
                    </div>
                  ) : (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:10 }}>
                      {filtered.map(a=>(
                        <AgentCard key={a.id} agent={a} onSelect={setSelectedAgent} envConfig={envConfig} onConfigure={handleConfigure}/>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </main>
          </>
        )}
      </div>
    </div>
  );
}

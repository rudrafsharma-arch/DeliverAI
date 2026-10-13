import React, { useState, useRef, useEffect } from 'react';
import { startJob } from './JobManager';

const BLUE = '#0070F2', GREEN = '#16a34a', PURPLE = '#7c3aed', AMBER = '#d97706';

const AGENT_LIST = [
  { id:'blueprint', name:'Business Blueprint', phase:'explore', triggers:['blueprint','bbp','business blueprint'] },
  { id:'functional-spec', name:'Functional Spec', phase:'explore', triggers:['functional spec','fs','fsd','functional specification'] },
  { id:'technical-spec', name:'Technical Spec', phase:'realize', triggers:['technical spec','ts','tsd','technical specification'] },
  { id:'test-scripts', name:'Test Scripts', phase:'test', triggers:['test script','test case','test plan','uat'] },
  { id:'config-doc', name:'Config Document', phase:'realize', triggers:['config','configuration doc','config document'] },
  { id:'iflow-builder', name:'iFlow Builder', phase:'realize', triggers:['iflow','integration flow','cpi','btp integration'] },
  { id:'abap-generator', name:'ABAP Generator', phase:'realize', triggers:['abap','rap','abap code','cds view'] },
  { id:'ricefw-builder', name:'RICEFW Builder', phase:'realize', triggers:['ricefw','rice','report','interface','conversion','enhancement'] },
  { id:'cap-service-builder', name:'CAP Service', phase:'realize', triggers:['cap service','cap project','cloud application'] },
  { id:'incident-analyser', name:'Incident Analyser', phase:'run', triggers:['incident','p1','p2','ams issue','root cause'] },
];

function parseIntent(message) {
  const lower = message.toLowerCase();
  const result = { agents: [], projectName: '', processName: '', client: '', module: '', description: message, intent: 'general' };

  // Detect delete intent FIRST
  if (lower.includes('delete') || lower.includes('remove')) {
    result.intent = 'delete';
    const agentMatch = message.match(/(blueprint|functional.?spec|technical.?spec|iflow|config|test.?script|architect|ricefw|abap|cap|incident)/i);
    if (agentMatch) result.deleteTarget = agentMatch[1].toLowerCase().replace(/[^a-z]/g,'');
    if (lower.includes('fail') || lower.includes('error')) result.deleteFilter = 'failed';
    if (lower.includes('all')) result.deleteAll = true;
    const versionMatch = message.match(/v(\d+)|version\s*(\d+)/i);
    if (versionMatch) result.deleteVersion = versionMatch[1] || versionMatch[2];
    return result;
  }

  // Detect restart intent
  if (lower.includes('restart') || lower.includes('rerun') || lower.includes('retry')) {
    result.intent = 'restart';
    const agentMatch = message.match(/(blueprint|functional.?spec|technical.?spec|iflow|config|test.?script|architect|ricefw|abap|cap|incident)/i);
    if (agentMatch) result.restartTarget = agentMatch[1].toLowerCase().replace(/[^a-z]/g,'');
    if (lower.includes('fail') || lower.includes('error')) result.restartFilter = 'failed';
    return result;
  }

  // Detect agents
  AGENT_LIST.forEach(agent => {
    if (agent.triggers.some(t => lower.includes(t))) result.agents.push(agent);
  });

  // Extract project name - look for "for X" or "project X"
  const forMatch = message.match(/for\s+([A-Z][\w\s&]+?)(?:\s+project|\s+client|\s+-|\.|,|$)/i);
  if (forMatch) result.client = forMatch[1].trim();

  // Extract process
  const processMatch = message.match(/(?:process|about|on|for)\s+([\w\s]+?(?:management|processing|invoice|payroll|procurement|sales|finance|hr|mm|sd|fi|co))/i);
  if (processMatch) result.processName = processMatch[1].trim();

  // Extract module
  const modules = ['FI','CO','MM','SD','HR','PP','QM','PM','WM','EWM','TM','BTP','FICO'];
  modules.forEach(m => { if (lower.includes(m.toLowerCase())) result.module = m; });

  // Set project name
  if (result.client) result.projectName = result.client + ' SAP Project';
  else result.projectName = 'My SAP Project';

  if (!result.processName) result.processName = 'Core Business Process';

  return result;
}

export default function AIAssistant({ onClose, projects, onNavigate, hideHeader }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am your DeliverAI Assistant. I can answer SAP questions AND start agents for you.\n\nTry:\n• "Start a Blueprint for Mars H&W Vendor Invoice project"\n• "Generate a Functional Spec for FI module"\n• "Run all Explore phase agents for my project"\n• "What is SAP Activate methodology?"', type:'text' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const addMessage = (role, content, type='text', extra={}) => {
    setMessages(m => [...m, { role, content, type, ...extra }]);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedFile({ name: file.name, content: ev.target.result.substring(0, 5000) });
      addMessage('user', 'Uploaded: ' + file.name, 'file');
      addMessage('assistant', 'File uploaded! I will use ' + file.name + ' as context when you ask me to generate documents. What would you like to do with it?', 'text');
    };
    reader.readAsText(file);
  };

  const triggerAgents = (intent, userMessage) => {
    if (intent.agents.length === 0) return false;

    const project = projects?.[0];
    const projectId = project?.id || '';
    const formData = {
      projectName: intent.projectName || project?.name || 'My SAP Project',
      client: intent.client || project?.client || '',
      processName: intent.processName || 'Core Business Process',
      module: intent.module || '',
      sapSystem: project?.type || 's4hana-private',
      description: userMessage + (uploadedFile ? '\n\nContext from uploaded file ' + uploadedFile.name + ':\n' + uploadedFile.content : ''),
      preparedBy: 'Vikram Sharma',
      version: '1.0'
    };

    intent.agents.forEach(agent => {
      startJob(agent.id, agent.name, projectId, formData);
    });

    const agentNames = intent.agents.map(a => a.name).join(', ');
    addMessage('assistant',
      'Started ' + intent.agents.length + ' agent' + (intent.agents.length>1?'s':'') + ' in background:\n\n' +
      intent.agents.map(a => '• ' + a.name + ' (' + a.phase + ' phase)').join('\n') +
      '\n\nCheck the Activity tab to see progress. Each document takes 1-3 minutes.',
      'action', { agents: intent.agents }
    );
    return true;
  };

  const sendMessage = async () => {
    if ((!input.trim() && !uploadedFile) || loading) return;
    const userMessage = input.trim();
    setInput('');

    if (userMessage) addMessage('user', userMessage, 'text');
    setLoading(true);

    // Check for agent intent first
    const intent = parseIntent(userMessage);
    // Handle intents
      // Handle delete intent
    if (intent.intent === 'delete') {
      const project = projects && projects[0];
      if (!project) { addMessage('assistant', 'No project selected.', 'text'); setLoading(false); return; }
      let docs = project.documents || [];

      // Filter by exact filename first, then agent/target
      if (intent.deleteTarget) {
        // Check if target looks like a filename (has .html extension)
        const isFileName = intent.deleteTarget.includes('_v') || intent.deleteTarget.includes('.html');
        if (isFileName) {
          docs = docs.filter(d => (d.fileName||'').toLowerCase().includes(intent.deleteTarget.toLowerCase()));
        } else {
          docs = docs.filter(d => (d.agentId||'').includes(intent.deleteTarget) || (d.agentName||'').toLowerCase().includes(intent.deleteTarget));
        }
      }
      // Filter by status (failed/error)
      if (intent.deleteFilter === 'failed') docs = docs.filter(d => d.status === 'failed' || !d.fileName);
      // Filter by version
      if (intent.deleteVersion) docs = docs.filter(d => d.version === intent.deleteVersion || (d.fileName||'').includes('_v'+intent.deleteVersion+'.'));
      // If no filter specified and no target, ask for clarification
      if (docs.length === 0) {
        addMessage('assistant', 'No documents found matching your criteria. Try being more specific e.g. "delete failed blueprint" or "delete blueprint v2". You can also use the Documents tab to delete manually.', 'text');
        setLoading(false);
        return;
      }
      // Confirm if deleting multiple
      const names = docs.map(d => d.fileName || d.agentName).join(', ');
      if (docs.length > 1) {
        const confirmed = window.confirm('Are you sure you want to delete ' + docs.length + ' documents?\n\n' + names);
        if (!confirmed) { addMessage('assistant', 'Deletion cancelled.', 'text'); setLoading(false); return; }
      }
      addMessage('assistant', 'Deleting ' + docs.length + ' document(s): ' + names, 'text');
      let deleted = 0;
      for (const doc of docs) {
        if (!doc.fileName) { deleted++; continue; } // failed doc with no file
        try {
          const fp = encodeURIComponent(doc.filePath || doc.fileName);
          await fetch('http://localhost:3002/documents/' + project.id + '/' + fp, { method: 'DELETE' });
          deleted++;
        } catch(e) {}
      }
      addMessage('assistant', 'Done. Deleted ' + deleted + ' document(s). Go to Documents tab to verify.', 'text');
      setLoading(false);
      return;
    }

    // Handle restart intent
    if (intent.intent === 'restart') {
      const project = projects && projects[0];
      if (!project) { addMessage('assistant', 'No project selected.', 'text'); setLoading(false); return; }
      let docs = project.documents || [];
      if (intent.restartFilter === 'failed') docs = docs.filter(d => d.status === 'failed' || !d.fileName);
      if (intent.restartTarget) docs = docs.filter(d => (d.agentId||'').includes(intent.restartTarget) || (d.agentName||'').toLowerCase().includes(intent.restartTarget));
      if (docs.length === 0) {
        addMessage('assistant', 'No failed documents found to restart. All agents completed successfully!', 'text');
        setLoading(false);
        return;
      }
      const agentsToRestart = [...new Set(docs.map(d => d.agentId))].filter(Boolean);
      addMessage('assistant', 'Restarting ' + agentsToRestart.length + ' agent(s): ' + agentsToRestart.join(', '), 'text');
      agentsToRestart.forEach(agentId => {
        const formData = { projectName: project.name, client: project.client || '', workstream: project.workstream || '', processName: project.processName || '', requirement: 'Retry failed generation' };
        startJob(agentId, agentId, project.id, formData);
      });
      addMessage('assistant', 'Agents restarted! Check the Activity tab for progress.', 'text');
      setLoading(false);
      return;
    }

    if (intent.agents.length > 0) {
    const triggered = triggerAgents(intent, userMessage);
      if (triggered) { setLoading(false); return; }
    }

    // Otherwise send to CLI assistant
    try {
      const context = uploadedFile ? '\n\nContext from file ' + uploadedFile.name + ':\n' + uploadedFile.content : '';
      const params = new URLSearchParams({ message: userMessage + context });
      const es = new EventSource('http://localhost:3002/assistant-stream?' + params);
      let reply = '';
      es.onmessage = (ev) => {
        const { type, data } = JSON.parse(ev.data);
        if (type === 'chunk') reply += data;
        else if (type === 'complete') {
          es.close();
          addMessage('assistant', reply || data, 'text');
          setLoading(false);
        } else if (type === 'error') {
          es.close();
          addMessage('assistant', 'Error: ' + data, 'text');
          setLoading(false);
        }
      };
      es.onerror = () => { es.close(); setLoading(false); };
    } catch(e) {
      addMessage('assistant', 'Error: ' + e.message, 'text');
      setLoading(false);
    }
  };

  const quickActions = [
    { label:'Start Blueprint', msg:'Start a Business Blueprint for my project' },
    { label:'Generate FS', msg:'Generate a Functional Specification' },
    { label:'Run Explore phase', msg:'Run all Explore phase agents for my project' },
    { label:'What is RAP?', msg:'What is RAP in SAP ABAP?' },
    { label:'SAP Activate phases', msg:'Explain SAP Activate methodology phases' },
    { label:'BTP vs S/4HANA', msg:'What is the difference between BTP and S/4HANA?' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden' }}>
      {!hideHeader && <div style={{ padding:'12px 16px', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:8, background:BLUE }}>
        <span style={{ fontSize:20 }}>🤖</span>
        <div>
          <div style={{ fontWeight:700, fontSize:14, color:'#fff' }}>DeliverAI Assistant</div>
          <div style={{ fontSize:10, color:'#bfdbfe' }}>Ask questions · Start agents · Upload docs</div>
        </div>
        {onClose && <button onClick={onClose} style={{ marginLeft:'auto', background:'none', border:'none', color:'#fff', cursor:'pointer', fontSize:20, lineHeight:1 }}>×</button>}
      </div>}


      <div style={{ flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:8 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display:'flex', justifyContent:msg.role==='user'?'flex-end':'flex-start' }}>
            <div style={{
              maxWidth:'85%', padding:'8px 12px', borderRadius:12, fontSize:13, lineHeight:1.6,
              background: msg.role==='user'?BLUE:msg.type==='action'?'#f0fdf4':'#f1f5f9',
              color: msg.role==='user'?'#fff':msg.type==='action'?'#15803d':'#1e293b',
              border: msg.type==='action'?'1px solid #86efac':'none',
              borderBottomRightRadius: msg.role==='user'?2:12,
              borderBottomLeftRadius: msg.role==='assistant'?2:12,
            }}>
              {msg.type==='action' && <div style={{ fontWeight:700, marginBottom:4 }}>🚀 Agents Started</div>}
              {msg.type==='file' && <div>📎 {msg.content}</div>}
              {msg.type!=='file' && msg.content.split('\n').map((line, j) => (
                <div key={j}>{line || <br/>}</div>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', justifyContent:'flex-start' }}>
            <div style={{ padding:'8px 12px', borderRadius:12, background:'#f1f5f9', fontSize:12, color:'#64748b' }}>
              Thinking... (1-3 mins for detailed answers)
            </div>
          </div>
        )}
        <div ref={messagesEndRef}/>
      </div>

      {messages.length === 1 && (
        <div style={{ padding:'0 12px 8px' }}>
          <div style={{ fontSize:11, color:'#94a3b8', marginBottom:6 }}>Quick actions:</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
            {quickActions.map(q => (
              <button key={q.label} onClick={()=>setInput(q.msg)}
                style={{ fontSize:11, padding:'4px 8px', borderRadius:6, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', color:'#475569' }}>
                {q.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {uploadedFile && (
        <div style={{ margin:'0 12px 8px', padding:'6px 10px', background:'#f0fdf4', borderRadius:8, border:'1px solid #86efac', fontSize:11, color:'#15803d', display:'flex', alignItems:'center', gap:6 }}>
          <span>📎</span><span>{uploadedFile.name} loaded as context</span>
          <button onClick={()=>setUploadedFile(null)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:14 }}>×</button>
        </div>
      )}

      <div style={{ padding:10, borderTop:'1px solid #e2e8f0', display:'flex', gap:6, alignItems:'flex-end' }}>
        <input ref={fileInputRef} type="file" accept=".txt,.md,.html,.pdf,.docx,.csv" onChange={handleFileUpload} style={{ display:'none' }}/>
        <button onClick={()=>fileInputRef.current?.click()}
          style={{ padding:'8px', borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', fontSize:16, flexShrink:0 }}
          title="Upload file">📎</button>
        <textarea value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendMessage(); }}}
          placeholder="Ask anything or say: Start a Blueprint for [project]..."
          rows={2}
          style={{ flex:1, border:'1px solid #e2e8f0', borderRadius:8, padding:'8px 10px', fontSize:13, outline:'none', fontFamily:'inherit', resize:'none', lineHeight:1.4 }}/>
        <button onClick={sendMessage} disabled={loading||(!input.trim()&&!uploadedFile)}
          style={{ padding:'8px 14px', borderRadius:8, border:'none', background:loading?'#94a3b8':BLUE, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, flexShrink:0 }}>
          {loading?'...':'Send'}
        </button>
      </div>
    </div>
  );
}

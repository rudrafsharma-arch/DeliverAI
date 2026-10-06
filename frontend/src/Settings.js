import React, { useState, useEffect } from 'react';
const BLUE = '#0070F2', GREEN = '#16a34a', RED = '#dc2626';
const api = { get: url => fetch(url).then(r=>r.json()), post: (url,body) => fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json()) };
const SECTIONS = [
  {id:'claude',label:'Claude Code CLI',icon:'🤖',required:true,fields:[
    {key:'GIT_BASH_PATH',label:'Git Bash Path',placeholder:'C:\\Users\\USERNAME\\AppData\\Local\\Programs\\Git\\bin\\bash.exe'},
    {key:'CLAUDE_PATH',label:'Claude CLI Path',placeholder:'/c/Users/USERNAME/AppData/Roaming/npm/claude'},
    {key:'AI_ENGINE',label:'AI Engine',placeholder:'claude-code-cli'}]},
  {id:'app',label:'App Settings',icon:'⚙️',required:true,fields:[
    {key:'BACKEND_PORT',label:'Backend Port',placeholder:'3005'},
    {key:'MCP_PORT',label:'MCP Port',placeholder:'3002'},
    {key:'AGENT_TIMEOUT',label:'Timeout ms',placeholder:'300000'},
    {key:'OUTPUT_DIR',label:'Output Dir',placeholder:'./projects'}]},
  {id:'github',label:'GitHub',icon:'🐙',required:false,fields:[
    {key:'GITHUB_TOKEN',label:'GitHub Token',placeholder:'ghp_...',secret:true},
    {key:'GITHUB_USER',label:'Username',placeholder:'your-username'}]},
  {id:'btp',label:'SAP BTP',icon:'☁️',required:false,fields:[
    {key:'BTP_TOKEN_URL',label:'Token URL',placeholder:'https://tenant.authentication.eu10.hana.ondemand.com/oauth/token'},
    {key:'BTP_CLIENT_ID',label:'Client ID',placeholder:'sb-...'},
    {key:'BTP_CLIENT_SECRET',label:'Client Secret',placeholder:'...',secret:true},
    {key:'BTP_CPI_HOST',label:'CPI Host',placeholder:'https://tenant.it-cpi010.cfapps.eu10.hana.ondemand.com'}]},
  {id:'s4',label:'SAP S/4HANA',icon:'🏢',required:false,fields:[
    {key:'S4_HOST',label:'Host URL',placeholder:'https://your-s4-host.com'},
    {key:'S4_USERNAME',label:'Username',placeholder:'RFC_USER'},
    {key:'S4_PASSWORD',label:'Password',placeholder:'...',secret:true},
    {key:'S4_CLIENT',label:'Client',placeholder:'100'}]},
  {id:'aicore',label:'SAP AI Core',icon:'🧠',required:false,fields:[
    {key:'AICORE_TOKEN_URL',label:'Token URL',placeholder:'https://tenant.authentication.eu10.hana.ondemand.com/oauth/token'},
    {key:'AICORE_CLIENT_ID',label:'Client ID',placeholder:'...'},
    {key:'AICORE_CLIENT_SECRET',label:'Client Secret',placeholder:'...',secret:true},
    {key:'AICORE_BASE_URL',label:'Base URL',placeholder:'https://api.ai.prod.eu-central-1.aws.ml.hana.ondemand.com'},
    {key:'AICORE_RESOURCE_GROUP',label:'Resource Group',placeholder:'default'}]},
  {id:'joule',label:'Joule Studio',icon:'💬',required:false,fields:[
    {key:'JOULE_STUDIO_URL',label:'Joule URL',placeholder:'https://joule-studio.cfapps.eu10.hana.ondemand.com'},
    {key:'JOULE_CLIENT_ID',label:'Client ID',placeholder:'...'},
    {key:'JOULE_CLIENT_SECRET',label:'Client Secret',placeholder:'...',secret:true}]},
  {id:'hana',label:'HANA Cloud',icon:'🗄️',required:false,fields:[
    {key:'HANA_HOST',label:'Host',placeholder:'your-hana.hanacloud.ondemand.com'},
    {key:'HANA_PORT',label:'Port',placeholder:'443'},
    {key:'HANA_USER',label:'Username',placeholder:'DBADMIN'},
    {key:'HANA_PASSWORD',label:'Password',placeholder:'...',secret:true},
    {key:'HANA_SCHEMA',label:'Schema',placeholder:'DELIVERAI'}]},
  {id:'snow',label:'ServiceNow',icon:'🎫',required:false,fields:[
    {key:'SNOW_INSTANCE',label:'Instance',placeholder:'your-instance.service-now.com'},
    {key:'SNOW_USERNAME',label:'Username',placeholder:'admin'},
    {key:'SNOW_PASSWORD',label:'Password',placeholder:'...',secret:true}]},
];
export default function Settings() {
  const [config,setConfig]=useState({});
  const [sysInfo,setSysInfo]=useState(null);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [tests,setTests]=useState({});
  const [testing,setTesting]=useState({});
  const [activeSection,setActiveSection]=useState('claude');
  const [showSecrets,setShowSecrets]=useState({});
  const [installLog,setInstallLog]=useState([]);
  const [installing,setInstalling]=useState(false);
  useEffect(()=>{
    api.get('/api/config/env').then(d=>setConfig(d.config||{})).catch(()=>{});
    api.get('/api/config/system').then(setSysInfo).catch(()=>{});
  },[]);
  const section=SECTIONS.find(s=>s.id===activeSection);
  const handleAutoDetect=()=>{
    if(!sysInfo)return;
    setConfig(c=>({...c,GIT_BASH_PATH:sysInfo.gitBash,CLAUDE_PATH:sysInfo.claudePath,GITHUB_USER:sysInfo.username,BACKEND_PORT:c.BACKEND_PORT||'3005',MCP_PORT:c.MCP_PORT||'3002',AGENT_TIMEOUT:c.AGENT_TIMEOUT||'300000',OUTPUT_DIR:c.OUTPUT_DIR||'./projects',AI_ENGINE:c.AI_ENGINE||'claude-code-cli'}));
  };
  const handleSave=async()=>{
    setSaving(true);
    const clean={};
    Object.entries(config).forEach(([k,v])=>{if(v&&v!==''&&v!=='••••••••')clean[k]=v;});
    await api.post('/api/config/env',clean);
    setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),3000);
  };
  const handleTest=async(service)=>{
    setTesting(t=>({...t,[service]:true}));
    try{const r=await api.get('/api/config/test/'+service);setTests(t=>({...t,[service]:r}));}
    catch(e){setTests(t=>({...t,[service]:{success:false,message:e.message}}));}
    setTesting(t=>({...t,[service]:false}));
  };
  const handleInstall=()=>{
    setInstalling(true);setInstallLog([]);
    const es=new EventSource('/api/setup/install');
    es.onmessage=(e)=>{const{message}=JSON.parse(e.data);if(message==='DONE'){es.close();setInstalling(false);setInstallLog(l=>[...l,'Done']);}else setInstallLog(l=>[...l,message]);};
    es.onerror=()=>{es.close();setInstalling(false);};
  };
  const inp={width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 11px',fontSize:13,outline:'none',fontFamily:'inherit',boxSizing:'border-box',background:'#fff'};
  return (
    <div style={{display:'flex',gap:16}}>
      <div style={{width:210,flexShrink:0,display:'flex',flexDirection:'column',gap:10}}>
        <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,overflow:'hidden'}}>
          <div style={{padding:'10px 14px',borderBottom:'1px solid #e2e8f0',fontWeight:600,fontSize:13}}>Configuration</div>
          {SECTIONS.map(s=>(
            <button key={s.id} onClick={()=>setActiveSection(s.id)}
              style={{width:'100%',textAlign:'left',padding:'9px 14px',background:activeSection===s.id?'#e8f2ff':'none',border:'none',borderBottom:'1px solid #f1f5f9',cursor:'pointer',display:'flex',alignItems:'center',gap:7}}>
              <span style={{fontSize:14}}>{s.icon}</span>
              <div>
                <div style={{fontSize:12,fontWeight:activeSection===s.id?600:400,color:activeSection===s.id?BLUE:'#1e293b'}}>{s.label}</div>
                {s.required&&<div style={{fontSize:9,color:RED,fontWeight:600}}>REQUIRED</div>}
              </div>
            </button>
          ))}
        </div>
        <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:12}}>
          <div style={{fontWeight:600,fontSize:12,marginBottom:8}}>Quick Actions</div>
          <button onClick={handleAutoDetect} style={{width:'100%',padding:'7px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',cursor:'pointer',fontSize:12,marginBottom:6}}>Auto-detect Paths</button>
          <button onClick={()=>handleTest('claude')} disabled={testing.claude} style={{width:'100%',padding:'7px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',cursor:'pointer',fontSize:12,marginBottom:6}}>{testing.claude?'Testing...':'Test Claude CLI'}</button>
          <button onClick={()=>handleTest('github')} disabled={testing.github} style={{width:'100%',padding:'7px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',cursor:'pointer',fontSize:12,marginBottom:6}}>{testing.github?'Testing...':'Test GitHub'}</button>
          <button onClick={()=>handleTest('btp')} disabled={testing.btp} style={{width:'100%',padding:'7px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',cursor:'pointer',fontSize:12,marginBottom:6}}>{testing.btp?'Testing...':'Test BTP'}</button>
          <button onClick={handleInstall} disabled={installing} style={{width:'100%',padding:'7px',borderRadius:8,border:'none',background:BLUE,color:'#fff',cursor:'pointer',fontSize:12,fontWeight:600}}>{installing?'Installing...':'Install Dependencies'}</button>
        </div>
        <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:12}}>
          <div style={{fontWeight:600,fontSize:12,marginBottom:8}}>Connection Status</div>
          {['claude','github','btp'].map(svc=>(
            <div key={svc} style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:tests[svc]?.success?GREEN:tests[svc]?RED:'#cbd5e1'}}/>
              <span style={{fontSize:11,color:'#64748b',textTransform:'capitalize'}}>{svc}</span>
              {tests[svc]&&<span style={{fontSize:10,color:tests[svc].success?GREEN:RED,marginLeft:'auto'}}>{tests[svc].success?'OK':'Fail'}</span>}
            </div>
          ))}
        </div>
      </div>
      <div style={{flex:1}}>
        {sysInfo&&(
          <div style={{background:'#e8f2ff',border:'1px solid #bfdbfe',borderRadius:10,padding:'10px 14px',marginBottom:12,fontSize:12,color:'#1e40af',display:'flex',gap:16,flexWrap:'wrap',alignItems:'center'}}>
            <span>User: {sysInfo.username}</span>
            <span>Host: {sysInfo.hostname}</span>
            <button onClick={handleAutoDetect} style={{marginLeft:'auto',padding:'3px 10px',borderRadius:6,border:'none',background:BLUE,color:'#fff',cursor:'pointer',fontSize:11,fontWeight:600}}>Auto-detect All</button>
          </div>
        )}
        <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:18}}>{section&&section.icon}</span>
            <span style={{fontWeight:600,fontSize:14}}>{section&&section.label}</span>
            {section&&section.required&&<span style={{fontSize:9,background:'#fef2f2',color:RED,padding:'2px 6px',borderRadius:6,fontWeight:700}}>REQUIRED</span>}
            <button onClick={()=>setShowSecrets(s=>({...s,[activeSection]:!s[activeSection]}))}
              style={{marginLeft:'auto',padding:'4px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'#f8fafc',cursor:'pointer',fontSize:11}}>
              {showSecrets[activeSection]?'Hide':'Show'} Secrets
            </button>
          </div>
          <div style={{padding:16}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {section&&section.fields.map(f=>(
                <div key={f.key}>
                  <div style={{fontSize:12,fontWeight:500,color:'#64748b',marginBottom:4}}>{f.label}</div>
                  <input type={f.secret&&!showSecrets[activeSection]?'password':'text'} value={config[f.key]||''} onChange={e=>setConfig(c=>({...c,[f.key]:e.target.value}))} placeholder={f.placeholder||''} style={inp}/>
                </div>
              ))}
            </div>
            {tests[activeSection]&&(
              <div style={{marginTop:12,padding:'8px 12px',borderRadius:8,background:tests[activeSection].success?'#f0fdf4':'#fef2f2',border:'1px solid',borderColor:tests[activeSection].success?'#86efac':'#fecaca',fontSize:12,color:tests[activeSection].success?GREEN:RED}}>
                {tests[activeSection].success?'Connected':'Failed'}: {tests[activeSection].message}
              </div>
            )}
          </div>
        </div>
        {installLog.length>0&&(
          <div style={{background:'#0f172a',borderRadius:12,padding:12,marginTop:12}}>
            <div style={{fontWeight:600,fontSize:12,color:'#94a3b8',marginBottom:6}}>Installation Log</div>
            {installLog.map((l,i)=>(<div key={i} style={{fontSize:12,color:'#4ade80',fontFamily:'monospace',lineHeight:1.6}}>{'>'} {l}</div>))}
          </div>
        )}
        <div style={{display:'flex',gap:8,marginTop:12,justifyContent:'flex-end',alignItems:'center'}}>
          <div style={{fontSize:12,color:'#94a3b8'}}>Saved to .env on your laptop. Never committed to GitHub.</div>
          <button onClick={handleSave} disabled={saving} style={{padding:'10px 24px',borderRadius:10,border:'none',background:saved?GREEN:BLUE,color:'#fff',cursor:'pointer',fontSize:14,fontWeight:700,minWidth:120}}>
            {saving?'Saving...':saved?'Saved':'Save Config'}
          </button>
        </div>
      </div>
    </div>
  );
}
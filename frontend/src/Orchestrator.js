import React, { useState, useRef, useEffect } from 'react';

const phaseNames = { 0: 'Architecture', 1: 'Discovery', 2: 'Design', 3: 'Build', 4: 'Test', 5: 'Delivery' };
const statusColors = { running: '#f59e0b', completed: '#22c55e', failed: '#ef4444', queued: '#94a3b8', pending: '#94a3b8' };
const statusIcons = { running: '⚡', completed: '✅', failed: '❌', queued: '⏳', pending: '⏳' };

export default function Orchestrator({ projects, onClose }) {
  const [selectedProject, setSelectedProject] = useState(projects?.[0]?.id || '');
  const [formData, setFormData] = useState({ projectName: '', client: '', industry: '', requirement: '', systemLandscape: '', existingLicenses: '', budget: 'Not defined', timeline: '', teamSize: 'Medium (6-15)', deliveryPackage: 'Full Delivery Package', version: '1.0' });
  const [running, setRunning] = useState(false);
  const [agents, setAgents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [architectDoc, setArchitectDoc] = useState(null);
  const [runtimeAgents, setRuntimeAgents] = useState([]);
  const [completedAgents, setCompletedAgents] = useState([]);
  const [currentPhase, setCurrentPhase] = useState(null);
  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const addMessage = (msg) => setMessages(prev => [...prev, { ...msg, id: Date.now() + Math.random() }]);

  const start = () => {
    if (!formData.projectName || !formData.requirement || !formData.systemLandscape) {
      alert('Please fill in Project Name, Requirement and System Landscape');
      return;
    }
    setRunning(true);
    setAgents([{ id: 'architect', name: 'Solution Architect', status: 'running', phase: 0, isOrchestrator: true }]);
    setMessages([]);
    setArchitectDoc(null);
    setRuntimeAgents([]);
    setCompletedAgents([]);
    setCurrentPhase(0);

    const params = new URLSearchParams({ ...formData, projectId: selectedProject });
    const es = new EventSource(`http://localhost:3002/orchestrate?${params}`);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      const { type, data } = JSON.parse(e.data);

      if (type === 'orchestrator') {
        addMessage({ role: 'architect', text: data.message, time: new Date().toLocaleTimeString() });
      }
      else if (type === 'subagent_start') {
        addMessage({ role: 'system', text: `Spawning subagent: ${data.agentName}`, time: new Date().toLocaleTimeString() });
        setAgents(prev => {
          const exists = prev.find(a => a.id === data.agentId);
          if (exists) return prev.map(a => a.id === data.agentId ? { ...a, status: 'running' } : a);
          return [...prev, { id: data.agentId, name: data.agentName, status: 'running', phase: data.phase }];
        });
        setCurrentPhase(data.phase);
      }
      else if (type === 'subagent_progress') {
        setAgents(prev => prev.map(a => a.id === data.agentId ? { ...a, progress: (a.progress || '') + data.chunk } : a));
      }
      else if (type === 'subagent_status') {
        setAgents(prev => prev.map(a => a.id === data.agentId ? { ...a, status: data.status } : a));
        if (data.status === 'completed') {
          addMessage({ role: data.agentId, text: `✅ ${data.agentName} completed successfully`, time: new Date().toLocaleTimeString() });
          setCompletedAgents(prev => [...prev, data.agentId]);
        }
        if (data.status === 'failed') {
          addMessage({ role: 'error', text: `❌ ${data.agentName} failed`, time: new Date().toLocaleTimeString() });
        }
      }
      else if (type === 'runtime_agent_created') {
        setRuntimeAgents(prev => [...prev, data]);
        addMessage({ role: 'architect', text: `🆕 Created new agent: ${data.agentName}`, time: new Date().toLocaleTimeString() });
        setAgents(prev => [...prev, { id: data.agentId, name: data.agentName, status: 'queued', phase: 99, isRuntime: true }]);
      }
      else if (type === 'architect_complete') {
        setArchitectDoc(data);
        setAgents(prev => prev.map(a => a.id === 'architect' ? { ...a, status: 'completed' } : a));
        addMessage({ role: 'architect', text: '📋 Architecture document ready. Spawning subagents...', time: new Date().toLocaleTimeString() });
      }
      else if (type === 'orchestration_complete') {
        setRunning(false);
        addMessage({ role: 'system', text: `🎉 Orchestration complete! ${data.completedAgents?.length || 0} agents completed.`, time: new Date().toLocaleTimeString() });
        setAgents(prev => prev.map(a => a.id === 'architect' ? { ...a, status: 'completed' } : a));
        es.close();
      }
      else if (type === 'error') {
        setRunning(false);
        addMessage({ role: 'error', text: `❌ ${data}`, time: new Date().toLocaleTimeString() });
        es.close();
      }
      else if (type === 'status') {
        addMessage({ role: 'system', text: data, time: new Date().toLocaleTimeString() });
      }
      else if (type === 'heartbeat' || type === 'keepalive') {
        addMessage({ role: 'heartbeat', text: data.message, time: new Date().toLocaleTimeString() });
      }
    };

    es.onerror = () => {
      setRunning(false);
      addMessage({ role: 'error', text: 'Connection lost', time: new Date().toLocaleTimeString() });
      es.close();
    };
  };

  const stop = () => {
    eventSourceRef.current?.close();
    setRunning(false);
    addMessage({ role: 'system', text: '⛔ Orchestration stopped by user', time: new Date().toLocaleTimeString() });
  };

  const phases = [...new Set(agents.map(a => a.phase))].sort();

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#f1f5f9', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#1e40af', color: '#fff', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 28 }}>🏗️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Solution Architect</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>AI-powered multi-agent orchestration</div>
        </div>
        {running && <button onClick={stop} style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Stop</button>}
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Close</button>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>

        {/* Left — Form or Agent Status */}
        <div style={{ width: 340, background: '#fff', borderRight: '1px solid #e2e8f0', overflowY: 'auto', flexShrink: 0 }}>
          {!running && agents.length === 0 ? (
            <div style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: '#1e40af' }}>📋 Project Details</div>

              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Project</label>
              <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12, fontSize: 13 }}>
                {projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>

              {[
                { key: 'projectName', label: 'Project Name *', placeholder: 'e.g. Mars S/4HANA Migration' },
                { key: 'client', label: 'Client', placeholder: 'e.g. Mars Health and Wellness' },
                { key: 'timeline', label: 'Target Go-Live', placeholder: 'e.g. 18 months' }
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{f.label}</label>
                  <input value={formData[f.key]} onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              ))}

              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Industry</label>
              <select value={formData.industry} onChange={e => setFormData(p => ({ ...p, industry: e.target.value }))} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12, fontSize: 13 }}>
                {['Manufacturing', 'Retail', 'Financial Services', 'Healthcare/Pharma', 'Public Sector', 'Energy', 'Telecom', 'Other'].map(o => <option key={o}>{o}</option>)}
              </select>

              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Requirement *</label>
              <textarea value={formData.requirement} onChange={e => setFormData(p => ({ ...p, requirement: e.target.value }))} placeholder="Describe what needs to be delivered..." rows={5} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }} />

              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginTop: 8, display: 'block' }}>Current System Landscape *</label>
              <textarea value={formData.systemLandscape} onChange={e => setFormData(p => ({ ...p, systemLandscape: e.target.value }))} placeholder="e.g. ECC 6.0, BTP Trial, Blue Yonder WMS" rows={3} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }} />

              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginTop: 8, display: 'block' }}>Existing SAP Licenses</label>
              <textarea value={formData.existingLicenses} onChange={e => setFormData(p => ({ ...p, existingLicenses: e.target.value }))} placeholder="e.g. S/4HANA Public Cloud, BTP Integration Suite" rows={2} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }} />

              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginTop: 8, display: 'block' }}>Budget</label>
              <select value={formData.budget} onChange={e => setFormData(p => ({ ...p, budget: e.target.value }))} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16, fontSize: 13 }}>
                {['Under £500k', '£500k - £1m', '£1m - £2m', '£2m - £5m', '£5m+', 'Not defined'].map(o => <option key={o}>{o}</option>)}
              </select>

              <button onClick={start} style={{ width: '100%', padding: '12px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                🚀 Start Orchestration
              </button>
            </div>
          ) : (
            <div style={{ padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: '#1e40af' }}>
                🤖 Agents {running ? '— Running' : '— Done'}
              </div>
              {phases.map(phase => (
                <div key={phase} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase' }}>
                    Phase {phase} — {phaseNames[phase] || 'Execution'}
                  </div>
                  {agents.filter(a => a.phase === phase).map(agent => (
                    <div key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: agent.status === 'running' ? '#eff6ff' : agent.status === 'completed' ? '#f0fdf4' : agent.status === 'failed' ? '#fef2f2' : '#f8fafc', marginBottom: 6, border: `1px solid ${statusColors[agent.status]}30` }}>
                      <span style={{ fontSize: 16 }}>{statusIcons[agent.status]}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{agent.name}</div>
                        {agent.isOrchestrator && <div style={{ fontSize: 10, color: '#1e40af', fontWeight: 700 }}>ORCHESTRATOR</div>}
                        {agent.isRuntime && <div style={{ fontSize: 10, color: '#7c3aed', fontWeight: 700 }}>RUNTIME CREATED</div>}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: statusColors[agent.status], textTransform: 'uppercase' }}>{agent.status}</div>
                    </div>
                  ))}
                </div>
              ))}
              {runtimeAgents.length > 0 && (
                <div style={{ marginTop: 12, padding: 10, background: '#faf5ff', borderRadius: 8, border: '1px solid #e9d5ff' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 4 }}>🆕 RUNTIME AGENTS CREATED</div>
                  {runtimeAgents.map(a => <div key={a.agentId} style={{ fontSize: 12, color: '#6d28d9' }}>• {a.agentName}</div>)}
                </div>
              )}
              {!running && (
                <button onClick={() => { setAgents([]); setMessages([]); }} style={{ width: '100%', marginTop: 12, padding: '10px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                  New Orchestration
                </button>
              )}
            </div>
          )}
        </div>

        {/* Center — Live Messages */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', background: '#fff', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 13, color: '#64748b' }}>
            💬 Live Orchestration Feed
            {currentPhase !== null && running && <span style={{ marginLeft: 8, background: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Phase {currentPhase} — {phaseNames[currentPhase]}</span>}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && !running && (
              <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏗️</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Solution Architect ready</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Fill in the project details and click Start Orchestration</div>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: msg.role === 'architect' ? '#1e40af' : msg.role === 'error' ? '#ef4444' : msg.role === 'system' ? '#64748b' : msg.role === 'heartbeat' ? '#f59e0b' : '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, color: '#fff', fontWeight: 700 }}>
                  {msg.role === 'architect' ? '🏗️' : msg.role === 'error' ? '❌' : msg.role === 'system' ? '⚙️' : msg.role === 'heartbeat' ? '💓' : '🤖'}
                </div>
                <div style={{ flex: 1, background: '#fff', borderRadius: 10, padding: '10px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: 600 }}>
                    {msg.role === 'architect' ? 'Solution Architect' : msg.role === 'system' ? 'System' : msg.role === 'error' ? 'Error' : msg.role === 'heartbeat' ? 'Live Update' : msg.role} · {msg.time}
                  </div>
                  <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.5 }}>{msg.text}</div>
                </div>
              </div>
            ))}
            {running && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>🏗️</div>
                <div style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#1e40af', animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Right — Architect Document Preview */}
        {architectDoc && (
          <div style={{ width: 420, borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 13, color: '#1e40af' }}>
              📋 Architecture Document
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <iframe srcDoc={architectDoc.html} style={{ width: '100%', height: '100%', border: 'none' }} title="Architecture Document"
                onLoad={(e) => {
                  try {
                    const doc = e.target.contentDocument;
                    doc.querySelectorAll('a[href^="#"]').forEach(a => {
                      a.addEventListener('click', (ev) => {
                        ev.preventDefault();
                        const target = doc.querySelector(a.getAttribute('href'));
                        if (target) target.scrollIntoView({ behavior: 'smooth' });
                      });
                    });
                  } catch(e) {}
                }}
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}

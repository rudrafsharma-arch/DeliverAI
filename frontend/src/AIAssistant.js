import React, { useState, useRef, useEffect } from 'react';

const BLUE = '#0070F2', GREEN = '#16a34a';

const SYSTEM_PROMPT = `You are DeliverAI Assistant — an expert SAP delivery consultant with deep knowledge of:
- SAP Activate methodology (Discover, Explore, Realize, Test, Deploy, Run)
- SAP S/4HANA (Public Cloud, Private Cloud, On-Premise)
- SAP BTP — Integration Suite, CAP, RAP, ABAP Cloud
- SAP Fiori, ABAP, RICEFW, Data Migration
- SAP AI Core, Joule, Generative AI Hub
- Accenture delivery methodology and best practices
- Project management, change management, testing

You help consultants with:
- Which agent/document to use next
- SAP best practices and technical guidance
- Project delivery advice
- Document review and improvement suggestions
- Quick answers to SAP questions

Keep responses concise and practical. Use bullet points for clarity.`;

export default function AIAssistant({ onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am your DeliverAI Assistant. I can help with SAP delivery questions, agent selection, best practices, and document advice. What do you need?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setError(null);
    setMessages(m => [...m, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const params = new URLSearchParams({ message: userMsg });
      const es = new EventSource('http://localhost:3002/assistant-stream?' + params);
      let reply = '';
      es.onmessage = (ev) => {
        const { type, data } = JSON.parse(ev.data);
        if (type === 'chunk') reply += data;
        else if (type === 'complete') {
          es.close();
          setMessages(m => [...m, { role: 'assistant', content: reply || data }]);
          setLoading(false);
          setError(null);
        } else if (type === 'error') { es.close(); setError(data); setLoading(false); }
      };
      es.onerror = () => { es.close(); setLoading(false); setError('Connection lost'); };
    } catch(e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const quickQuestions = [
    'Which agent should I use first?',
    'What is SAP Activate methodology?',
    'Difference between Public and Private Cloud?',
    'What is RAP in ABAP?',
    'How to use BTP Integration Suite?',
    'What documents do I need for go-live?'
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden' }}>
      <div style={{ padding:'12px 16px', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:8, background:'#0070F2' }}>
        <span style={{ fontSize:20 }}>🤖</span>
        <div>
          <div style={{ fontWeight:700, fontSize:14, color:'#fff' }}>DeliverAI Assistant</div>
          <div style={{ fontSize:10, color:'#bfdbfe' }}>SAP delivery expert · Instant responses</div>
        </div>
        {onClose && <button onClick={onClose} style={{ marginLeft:'auto', background:'none', border:'none', color:'#fff', cursor:'pointer', fontSize:18 }}>×</button>}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:8 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display:'flex', justifyContent: msg.role==='user'?'flex-end':'flex-start' }}>
            <div style={{
              maxWidth:'80%', padding:'8px 12px', borderRadius:12,
              background: msg.role==='user'?BLUE:'#f1f5f9',
              color: msg.role==='user'?'#fff':'#1e293b',
              fontSize:13, lineHeight:1.5,
              borderBottomRightRadius: msg.role==='user'?2:12,
              borderBottomLeftRadius: msg.role==='assistant'?2:12,
            }}>
              {msg.content.split('\n').map((line, j) => (
                <div key={j}>{line || <br/>}</div>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', justifyContent:'flex-start' }}>
            <div style={{ padding:'8px 12px', borderRadius:12, background:'#f1f5f9', display:'flex', gap:4, alignItems:'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#94a3b8', animation:'bounce 1s infinite', animationDelay: i*0.2+'s' }}/>
              ))}
            </div>
          </div>
        )}
        {error && <div style={{ fontSize:11, color:'#dc2626', textAlign:'center', padding:4 }}>{error}</div>}
        <div ref={messagesEndRef}/>
      </div>

      {messages.length === 1 && (
        <div style={{ padding:'0 12px 8px' }}>
          <div style={{ fontSize:11, color:'#94a3b8', marginBottom:6 }}>Quick questions:</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
            {quickQuestions.map(q => (
              <button key={q} onClick={()=>{ setInput(q); }}
                style={{ fontSize:11, padding:'3px 8px', borderRadius:6, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', color:'#475569' }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding:12, borderTop:'1px solid #e2e8f0', display:'flex', gap:8 }}>
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMessage()}
          placeholder="Ask anything about SAP delivery..."
          style={{ flex:1, border:'1px solid #e2e8f0', borderRadius:8, padding:'8px 12px', fontSize:13, outline:'none', fontFamily:'inherit' }}/>
        <button onClick={sendMessage} disabled={loading||!input.trim()}
          style={{ padding:'8px 16px', borderRadius:8, border:'none', background:loading?'#94a3b8':BLUE, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>
          {loading ? '...' : 'Send'}
        </button>
      </div>
      <style>{'@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}'}</style>
    </div>
  );
}

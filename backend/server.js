require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const MCP = `http://localhost:${process.env.MCP_PORT || 3002}`;
const PORT = process.env.BACKEND_PORT || 3005;

const proxy = async (url, options = {}) => {
  const r = await fetch(url, { ...options, signal: AbortSignal.timeout(parseInt(process.env.AGENT_TIMEOUT || '300000')) });
  return r;
};

app.get('/api/health', async (req, res) => {
  try { const r = await proxy(`${MCP}/health`); res.json(await r.json()); }
  catch { res.status(503).json({ status: 'error', message: 'MCP server not reachable. Is it running?' }); }
});

app.get('/api/config', async (req, res) => {
  try { const r = await proxy(`${MCP}/config`); res.json(await r.json()); }
  catch(e) { res.status(503).json({ error: e.message }); }
});

app.get('/api/agents', async (req, res) => {
  try { const r = await proxy(`${MCP}/agents`); res.json(await r.json()); }
  catch(e) { res.status(503).json({ error: e.message }); }
});

app.get('/api/agents/:id', async (req, res) => {
  try { const r = await proxy(`${MCP}/agents/${req.params.id}`); res.json(await r.json()); }
  catch(e) { res.status(503).json({ error: e.message }); }
});

app.post('/api/agents/reload', async (req, res) => {
  try { const r = await proxy(`${MCP}/agents/reload`, { method:'POST' }); res.json(await r.json()); }
  catch(e) { res.status(503).json({ error: e.message }); }
});

app.get('/api/projects', async (req, res) => {
  try { const r = await proxy(`${MCP}/projects`); res.json(await r.json()); }
  catch(e) { res.status(503).json({ error: e.message }); }
});

app.post('/api/projects', async (req, res) => {
  try {
    const r = await proxy(`${MCP}/projects`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(req.body) });
    res.json(await r.json());
  } catch(e) { res.status(503).json({ error: e.message }); }
});

app.get('/api/projects/:id', async (req, res) => {
  try { const r = await proxy(`${MCP}/projects/${req.params.id}`); if (!r.ok) return res.status(404).json({ error:'Not found' }); res.json(await r.json()); }
  catch(e) { res.status(503).json({ error: e.message }); }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const r = await proxy(`${MCP}/projects/${req.params.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(req.body) });
    res.json(await r.json());
  } catch(e) { res.status(503).json({ error: e.message }); }
});

app.get('/api/projects/:id/context', async (req, res) => {
  try { const r = await proxy(`${MCP}/projects/${req.params.id}/context`); res.json(await r.json()); }
  catch(e) { res.status(503).json({ error: e.message }); }
});

app.get('/api/projects/:id/files', async (req, res) => {
  try { const r = await proxy(`${MCP}/projects/${req.params.id}/files`); res.json(await r.json()); }
  catch(e) { res.status(503).json({ error: e.message }); }
});

app.post('/api/preview', async (req, res) => {
  try {
    const r = await proxy(`${MCP}/preview`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(req.body) });
    res.json(await r.json());
  } catch(e) { res.status(503).json({ error: e.message }); }
});

app.get('/api/generate-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();
  const params = new URLSearchParams(req.query).toString();
  try {
    const r = await fetch(`${MCP}/generate-stream?${params}`);
    r.body.pipe(res);
  } catch(e) {
    res.write(`data: ${JSON.stringify({ type:'error', data: e.message })}\n\n`);
    res.end();
  }
});

app.get('/api/assistant-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();
  const params = new URLSearchParams(req.query).toString();
  try {
    const r = await fetch(`${MCP}/assistant-stream?${params}`);
    r.body.pipe(res);
  } catch(e) {
    res.write(`data: ${JSON.stringify({ type:'error', data: e.message })}\n\n`);
    res.end();
  }
});

app.get('/api/download/:projectId/:fileName', async (req, res) => {
  try {
    const r = await fetch(`${MCP}/download/${req.params.projectId}/${req.params.fileName}`);
    if (!r.ok) return res.status(404).json({ error:'File not found' });
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.fileName}"`);
    res.setHeader('Content-Type', 'text/html');
    r.body.pipe(res);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/engines', (req, res) => {
  const engines = [{ id:'claude-code-cli', name:'Claude Code CLI', available:true }];
  if (process.env.AICORE_CLIENT_ID) engines.push({ id:'genai-hub', name:'SAP Generative AI Hub', available:true });
  res.json({ current: process.env.AI_ENGINE || 'claude-code-cli', engines });
});

const buildPath = path.join(__dirname, '../frontend/build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('*', (req, res) => { if (!req.path.startsWith('/api')) res.sendFile(path.join(buildPath, 'index.html')); });
}

app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║  DeliverAI Backend           :${PORT}          ║`);
  console.log(`║  MCP Server:  ${MCP}   ║`);
  console.log(`║  AI Engine:   ${(process.env.AI_ENGINE||'claude-code-cli').padEnd(30)}║`);
  console.log(`╚══════════════════════════════════════════════╝\n`);
});

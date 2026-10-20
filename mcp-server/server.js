require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
// BTP Integration Suite MCP connection
async function fetchBTPiFlows() {
  try {
    const https = require('https');
    const env = require('dotenv').config({ path: require('path').join(__dirname, '../.env') }).parsed || {};
    const clientId = env.BTP_CLIENT_ID;
    const clientSecret = env.BTP_CLIENT_SECRET;
    const tokenUrl = env.BTP_TOKEN_URL;
    const mcpUrl = env.BTP_MCP_URL;
    if (!clientId || !clientSecret || !tokenUrl || !mcpUrl) return '';

    const urlObj = new URL(tokenUrl);
    const mcpObj = new URL(mcpUrl);

    // Get token
    const token = await new Promise((resolve, reject) => {
      const body = 'grant_type=client_credentials&client_id=' + encodeURIComponent(clientId) + '&client_secret=' + encodeURIComponent(clientSecret);
      const req = https.request({
        hostname: urlObj.hostname, path: urlObj.pathname, method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => { try { resolve(JSON.parse(d).access_token); } catch(e) { reject(e); } });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
    if (!token) return '';

    // Call MCP to list iFlows
    const payload = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'get_IntegrationDesigntimeArtifacts', arguments: { top: 100, format: 'json' } } });
    const result = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: mcpObj.hostname, path: mcpObj.pathname, method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'Content-Length': Buffer.byteLength(payload) }
      }, res => {
        let data = '';
        res.on('data', c => data += c.toString());
        res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    const content = result.result && result.result.content;
    if (!content || !content[0]) return '';
    const iflowData = JSON.parse(content[0].text || '{}');
    const iflows = (iflowData.d && iflowData.d.results) || [];
    if (iflows.length === 0) return '';

    let context = '\n\n## LIVE BTP INTEGRATION SUITE DATA\n';
    context += 'The following iFlows are ALREADY DEPLOYED in the client tenant (fetched live):\n';
    const byPackage = {};
    iflows.forEach(f => {
      if (!byPackage[f.PackageId]) byPackage[f.PackageId] = [];
      byPackage[f.PackageId].push(f.Id + ' | ' + f.Name + ' | v' + f.Version);
    });
    Object.entries(byPackage).forEach(([pkg, flows]) => {
      context += '\nPackage: ' + pkg + '\n';
      flows.forEach(f => context += '  - ' + f + '\n');
    });
    context += '\nUse this live data to: avoid duplicates, follow existing naming patterns, reference actual package names.';
    console.log('[BTP] Fetched', iflows.length, 'live iFlows from tenant');
    return context;
  } catch(e) {
    console.log('[BTP] Could not fetch live iFlows:', e.message);
    return '';
  }
}

// BTP Integration Suite MCP connection
async function fetchBTPiFlows() {
  try {
    const https = require('https');
    const env = require('dotenv').config({ path: require('path').join(__dirname, '../.env') }).parsed || {};
    const clientId = env.BTP_CLIENT_ID;
    const clientSecret = env.BTP_CLIENT_SECRET;
    const tokenUrl = env.BTP_TOKEN_URL;
    const mcpUrl = env.BTP_MCP_URL;
    if (!clientId || !clientSecret || !tokenUrl || !mcpUrl) return '';

    const urlObj = new URL(tokenUrl);
    const mcpObj = new URL(mcpUrl);

    // Get token
    const token = await new Promise((resolve, reject) => {
      const body = 'grant_type=client_credentials&client_id=' + encodeURIComponent(clientId) + '&client_secret=' + encodeURIComponent(clientSecret);
      const req = https.request({
        hostname: urlObj.hostname, path: urlObj.pathname, method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => { try { resolve(JSON.parse(d).access_token); } catch(e) { reject(e); } });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
    if (!token) return '';

    // Call MCP to list iFlows
    const payload = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'get_IntegrationDesigntimeArtifacts', arguments: { top: 100, format: 'json' } } });
    const result = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: mcpObj.hostname, path: mcpObj.pathname, method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'Content-Length': Buffer.byteLength(payload) }
      }, res => {
        let data = '';
        res.on('data', c => data += c.toString());
        res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    const content = result.result && result.result.content;
    if (!content || !content[0]) return '';
    const iflowData = JSON.parse(content[0].text || '{}');
    const iflows = (iflowData.d && iflowData.d.results) || [];
    if (iflows.length === 0) return '';

    let context = '\n\n## LIVE BTP INTEGRATION SUITE DATA\n';
    context += 'The following iFlows are ALREADY DEPLOYED in the client tenant (fetched live):\n';
    const byPackage = {};
    iflows.forEach(f => {
      if (!byPackage[f.PackageId]) byPackage[f.PackageId] = [];
      byPackage[f.PackageId].push(f.Id + ' | ' + f.Name + ' | v' + f.Version);
    });
    Object.entries(byPackage).forEach(([pkg, flows]) => {
      context += '\nPackage: ' + pkg + '\n';
      flows.forEach(f => context += '  - ' + f + '\n');
    });
    context += '\nUse this live data to: avoid duplicates, follow existing naming patterns, reference actual package names.';
    console.log('[BTP] Fetched', iflows.length, 'live iFlows from tenant');
    return context;
  } catch(e) {
    console.log('[BTP] Could not fetch live iFlows:', e.message);
    return '';
  }
}

const cors = require('cors');
const { spawn } = require('child_process');
const Orchestrator = require('./orchestrator');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));
const AGENTS_DIR = path.join(__dirname, '../agents');
const KNOWLEDGE_DIR = path.join(__dirname, '../knowledge');
const PROJECTS_DIR = process.env.OUTPUT_DIR ? path.resolve(process.env.OUTPUT_DIR) : path.join(__dirname, '../projects');
const MCP_PORT = process.env.MCP_PORT || 3002;

if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });

// Load knowledge files for an agent
function loadKnowledge(knowledgeFiles) {
  if (!knowledgeFiles || knowledgeFiles.length === 0) return '';
  let knowledge = '\n\n## Knowledge Base\n';
  knowledgeFiles.forEach(file => {
    const filePath = path.join(KNOWLEDGE_DIR, file);
    if (fs.existsSync(filePath)) {
      knowledge += `\n### ${file}\n${fs.readFileSync(filePath, 'utf8').substring(0, 3000)}\n`;
    }
  });
  return knowledge;
}

// Load all agents from agents/ directory
function loadAgents() {
  const agents = {};
  if (!fs.existsSync(AGENTS_DIR)) return agents;
  fs.readdirSync(AGENTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .forEach(d => {
      const manifestPath = path.join(AGENTS_DIR, d.name, 'manifest.json');
      if (!fs.existsSync(manifestPath)) return;
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const promptPath = path.join(AGENTS_DIR, d.name, 'prompt.md');
        const formPath = path.join(AGENTS_DIR, d.name, 'form.json');
        agents[manifest.id] = {
          ...manifest,
          prompt: fs.existsSync(promptPath) ? fs.readFileSync(promptPath, 'utf8') : null,
          form: fs.existsSync(formPath) ? JSON.parse(fs.readFileSync(formPath, 'utf8')) : null,
        };
      } catch(e) { console.error(`[Registry] Failed to load ${d.name}:`, e.message); }
    });
  console.log(`[Registry] Loaded ${Object.keys(agents).length} agents: ${Object.keys(agents).join(', ')}`);
  return agents;
}

let AGENTS = loadAgents();
let rerunQueue = [];
let rerunRunning = false;
const completedReruns = {};

// Default prompts for agents without prompt.md
const DEFAULT_PROMPTS = {
  blueprint: `You are a senior SAP consultant. Generate a COMPLETE Business Blueprint as a standalone HTML file with ALL CSS embedded. Include: 1) Document Control Table 2) Executive Summary 3) Scope and Objectives 4) Current State As-Is 5) Future State To-Be 6) Gap Analysis Table 7) Process Flow 8) RACI Table 9) Integration Points 10) Open Issues 11) Sign-off. Use SAP blue #0070F2 for headers, professional tables, white background. All content must be realistic and detailed.`,
  'functional-spec': `You are a senior SAP functional consultant. Generate a COMPLETE Functional Specification as standalone HTML with ALL CSS embedded. Include: 1) Document Control 2) Purpose and Scope 3) Business Requirements 4) Functional Description 5) Field Mapping Table 6) Business Rules 7) Authorization 8) Error Handling 9) Reporting Requirements 10) Open Issues. SAP blue #0070F2 headers, professional tables.`,
  'technical-spec': `You are a senior SAP technical consultant. Use RAP RESTful ABAP where applicable. Generate a COMPLETE Technical Specification as standalone HTML with ALL CSS embedded. Include: 1) Document Control 2) Technical Overview 3) Development Objects Table 4) RAP/ABAP Design with CDS Views 5) Database Tables 6) Interface Design 7) Error Handling 8) Performance 9) Transport Plan 10) Unit Tests. SAP blue #0070F2 headers.`,
  'test-scripts': `You are a senior SAP QA consultant. Generate COMPLETE Test Scripts as standalone HTML with ALL CSS embedded. Include: 1) Document Control 2) Test Scope 3) Prerequisites 4) Minimum 10 Test Cases each with ID, Steps, Expected Result, Pass/Fail columns 5) Defect Procedure 6) Sign-off. SAP blue #0070F2 headers, detailed tables.`,
  'config-doc': `You are a senior SAP consultant. Generate a COMPLETE Configuration Document as standalone HTML with ALL CSS embedded. Include: 1) Document Control 2) Overview 3) Pre-requisites 4) Step-by-Step Config with transaction codes 5) Parameters Table 6) Transport Details 7) Verification Steps 8) Rollback 9) Sign-off. Bold T-codes, SAP blue #0070F2 headers.`
};

// Project management
function getProjectDir(projectId) { return path.join(PROJECTS_DIR, projectId); }

function loadProjectContext(projectId) {
  const p = path.join(getProjectDir(projectId), 'context.json');
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(e) { return {}; }
}

function saveProjectContext(projectId, context) {
  const dir = getProjectDir(projectId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const existing = loadProjectContext(projectId);
  const merged = { ...existing, ...context, updatedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(dir, 'context.json'), JSON.stringify(merged, null, 2));
  return merged;
}

function loadProject(projectId) {
  const p = path.join(getProjectDir(projectId), 'project.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(e) { return null; }
}

function saveProject(project) {
  const dir = getProjectDir(project.id);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'project.json'), JSON.stringify(project, null, 2));
  return project;
}

function listProjects() {
  if (!fs.existsSync(PROJECTS_DIR)) return [];
  return fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => loadProject(d.name))
    .filter(Boolean)
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
}

// Build prompt with context grounding + knowledge base
async function buildPrompt(agent, formData, projectId) {
  const agentPrompt = agent.prompt || DEFAULT_PROMPTS[agent.id] || DEFAULT_PROMPTS['functional-spec'];
  const knowledge = loadKnowledge(agent.knowledge || []);

  // Build previous agent context
  let agentContext = '';
  if (projectId && agent.inputs?.fromAgents?.length > 0) {
    const project = loadProject(projectId);
    const previousDocs = (project?.documents || []).filter(d => agent.inputs.fromAgents.includes(d.agentId));
    if (previousDocs.length > 0) {
      agentContext = '\n\n## Context from Previous Documents\n';
      previousDocs.forEach(doc => {
        agentContext += `\n### ${doc.agentName}\n`;
        const docPath = path.join(getProjectDir(projectId), doc.fileName);
        if (fs.existsSync(docPath)) {
          const html = fs.readFileSync(docPath, 'utf8');
          const text = html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 1500);
          agentContext += `${text}...\n`;
        }
      });
      agentContext += '\nEnsure consistency with the above documents.';
    }
  }

  const f = formData;
  return `${agentPrompt}${knowledge}${agentContext}

## Document Details
Project: ${f.projectName || 'N/A'}
Client: ${f.client || 'N/A'}
SAP System: ${f.sapSystem || 'N/A'}
Module: ${f.module || 'N/A'}
Process/Topic: ${f.processName || 'N/A'}
Prepared By: ${f.preparedBy || 'Consultant'}
Version: ${f.version || '1.0'}
Date: ${new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' })}

## Description
${f.description || 'No description provided'}

## CRITICAL OUTPUT RULES
1. Return ONLY the complete HTML document
2. Start with <!DOCTYPE html> — nothing before it
3. End with </html> — nothing after it
4. Do NOT use markdown code blocks
5. Do NOT add any explanation or commentary
6. ALL CSS must be embedded in a <style> tag inside <head>
7. The document must be completely self-contained`;
}

// Extract HTML from Claude output — multiple strategies
function extractHTML(output) {
  // Strategy 1: Full DOCTYPE
  const m1 = output.match(/<!DOCTYPE[\s\S]*<\/html>/i);
  if (m1) return m1[0];
  // Strategy 2: html tag
  const m2 = output.match(/<html[\s\S]*<\/html>/i);
  if (m2) return m2[0];
  // Strategy 3: Strip markdown fences
  const stripped = output.replace(/```html\s*/gi, '').replace(/```\s*/g, '').trim();
  if (stripped.toLowerCase().startsWith('<!doctype') || stripped.toLowerCase().startsWith('<html')) return stripped;
  // Strategy 4: Contains html structure
  if (output.toLowerCase().includes('<!doctype html') && output.toLowerCase().includes('</html>')) return output.trim();
  return null;
}

// Run Claude Code CLI via Git Bash
function runClaude(prompt, res, onComplete) {
  const gitBash = process.env.GIT_BASH_PATH || 'C:\\Users\\vikram.f.sharma\\AppData\\Local\\Programs\\Git\\bin\\bash.exe';
  const claudePath = process.env.CLAUDE_PATH || '/c/Users/vikram.f.sharma/AppData/Roaming/npm/claude';
  const send = (type, data) => { if (!res.writableEnded) res.write(`data: ${JSON.stringify({ type, data })}\n\n`); };

  const child = spawn(gitBash, ['--login', '-c', `${claudePath} --print --dangerously-skip-permissions`], {
    timeout: parseInt(process.env.AGENT_TIMEOUT || '300000')
  });

  child.stdin.write(prompt);
  child.stdin.end();

  let output = '';
  let chars = 0;

  child.stdout.on('data', d => {
    output += d.toString();
    chars += d.length;
    if (chars % 2000 < d.length) send('progress', `Generating... ${Math.round(chars/1000)}k chars`);
  });

  child.stderr.on('data', d => {
    const msg = d.toString().trim();
    if (msg && !msg.includes('Warning') && !msg.includes('stdin')) send('status', msg.substring(0, 100));
  });

  child.on('close', () => { console.log(`[MCP] Done. ${output.length} chars`); onComplete(output); });
  child.on('error', err => { send('error', 'Claude error: ' + err.message); if (!res.writableEnded) res.end(); });
  return child;
}

// ── ROUTES ────────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => res.json({ status: 'ok', agents: Object.keys(AGENTS).length, version: CONFIG.app.version }));
app.get('/config', (req, res) => res.json(CONFIG));

// Agent registry — hot reload
app.get('/agents', (req, res) => { AGENTS = loadAgents(); res.json(Object.values(AGENTS).map(a => ({ id:a.id, name:a.name, description:a.description, phase:a.phase, category:a.category, icon:a.icon, color:a.color, version:a.version, suggests:a.suggests, tags:a.tags, projectTypes:a.projectTypes, form:a.form }))); });
app.get('/agents/:id', (req, res) => { const a = AGENTS[req.params.id]; if (!a) return res.status(404).json({ error:'Agent not found' }); res.json(a); });
app.post('/agents/reload', (req, res) => { AGENTS = loadAgents(); res.json({ message:'Reloaded', count: Object.keys(AGENTS).length }); });

// Projects
app.get('/projects', (req, res) => res.json(listProjects()));
app.post('/projects', (req, res) => {
  const { name, client, type, system, description, workstream, processName } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name required' });
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
  const project = { id, name, client, type, system, description, workstream, processName, documents: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  saveProject(project);
  res.json(project);
});
app.get('/projects/:id', (req, res) => { const p = loadProject(req.params.id); if (!p) return res.status(404).json({ error:'Not found' }); res.json(p); });
app.put('/projects/:id', (req, res) => { const p = loadProject(req.params.id); if (!p) return res.status(404).json({ error:'Not found' }); const u = { ...p, ...req.body, id:p.id, updatedAt:new Date().toISOString() }; saveProject(u); res.json(u); });
app.get('/projects/:id/context', (req, res) => res.json(loadProjectContext(req.params.id)));
app.get('/projects/:id/files', (req, res) => {
  const dir = getProjectDir(req.params.id);
  if (!fs.existsSync(dir)) return res.json([]);
  const files = fs.readdirSync(dir).filter(f => !['project.json','context.json','CLAUDE.md'].includes(f)).map(f => { const s = fs.statSync(path.join(dir,f)); return { name:f, size:s.size, modified:s.mtime }; });
  res.json(files);
});

// Human-in-the-loop preview
app.post('/preview', async (req, res) => {
  const { agentId, formData, projectId } = req.body;
  const agent = AGENTS[agentId];
  if (!agent) return res.status(404).json({ error:'Agent not found' });
  const prompt = await buildPrompt(agent, formData, projectId);
  const context = projectId ? loadProjectContext(projectId) : {};
  res.json({ agentId, agentName:agent.name, promptPreview:prompt.substring(0,500)+'...', promptLength:prompt.length, contextKeys:Object.keys(context), previousAgents:agent.inputs?.fromAgents||[], estimatedTime:'1-3 minutes' });
});

// SSE Generation
app.get('/generate-stream', async (req, res) => {
  const { agentId, projectId, ...formData } = req.query;
  const agent = AGENTS[agentId];
  if (!agent) { res.status(400).end('Agent not found'); return; }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const send = (type, data) => { if (!res.writableEnded) res.write(`data: ${JSON.stringify({ type, data })}\n\n`); };
  const prompt = await buildPrompt(agent, formData, projectId);

  console.log(`[MCP] Generating ${agentId} for: ${formData.projectName}`);
  send('status', `Starting ${agent.name}...`);

  const child = runClaude(prompt, res, (output) => {
    const html = extractHTML(output);

    if (!html || html.length < 200) {
      console.error('[MCP] No HTML found:', output.substring(0,200));
      send('error', 'Document generation failed — Claude did not return valid HTML. Please try again with more details in the description.');
      res.end();
      return;
    }

    const version = formData.version || '1.0';
    const safeName = (formData.projectName || 'output').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${agentId}_${safeName}_v${version}_${Date.now()}.html`;

    if (projectId) {
      const dir = getProjectDir(projectId);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, fileName), html, 'utf8');
      const project = loadProject(projectId);
      if (project) {
        project.documents = project.documents || [];
        project.documents.push({ agentId, agentName:agent.name, fileName, version, generatedAt:new Date().toISOString() });
        project.updatedAt = new Date().toISOString();
        saveProject(project);
      }
      if (agent.outputs?.contextKeys) {
        const ctx = {};
        agent.outputs.contextKeys.forEach(k => { ctx[k] = true; });
        ctx[`${agentId}_generated`] = new Date().toISOString();
        ctx[`${agentId}_file`] = fileName;
        saveProjectContext(projectId, ctx);
      }
    }

    console.log(`[MCP] Saved: ${fileName}`);
    send('complete', { html, fileName, agentName:agent.name, suggests:agent.suggests||[], projectId });
    res.end();
  });

  req.on('close', () => { try { child.kill(); } catch(e) {} });
});

// AI Assistant
app.get('/assistant-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();
  const send = (type, data) => res.write('data: ' + JSON.stringify({type,data}) + '\n\n');
  const message = req.query.message || '';
  if (!message) { send('error', 'No message'); res.end(); return; }

  const systemPrompt = 'You are DeliverAI Assistant, an expert SAP delivery consultant. Give concise, practical answers. Use bullet points. Keep responses under 200 words unless detail is needed.';
  const fullPrompt = systemPrompt + '\n\nUser: ' + message + '\n\nAssistant:';
  
  const gitBash = process.env.GIT_BASH_PATH;
  const claudePath = process.env.CLAUDE_PATH;
  if (!gitBash || !claudePath) { send('error', 'Claude not configured'); res.end(); return; }

const Orchestrator = require('./orchestrator');
  const proc = spawn(gitBash, ['--login', '-c', claudePath + ' --print --dangerously-skip-permissions'], { env: { ...process.env, HOME: process.env.HOME || process.env.USERPROFILE } });
  
  proc.stdin.write(fullPrompt);
  proc.stdin.end();
  
  let output = '';
  proc.stdout.on('data', d => { output += d.toString(); });
  proc.stderr.on('data', () => {});
  proc.on('close', () => {
    const clean = output.replace(/^(Human|Assistant):.*/gm, '').trim();
    send('complete', clean || 'No response');
    res.end();
  });
  
  setTimeout(() => { try { proc.kill(); send('complete', output.trim() || 'Timeout'); res.end(); } catch(e){} }, 60000);
});

app.get('/download/:projectId/*', (req, res) => {
  const relPath = req.params[0];
  const filePath = path.join(getProjectDir(req.params.projectId), relPath);
  if (!fs.existsSync(filePath)) return res.status(404).send('File not found: ' + relPath);
  res.setHeader('Content-Type', 'text/html'); res.send(fs.readFileSync(filePath, 'utf8'));
});

app.get('/orchestrate', async (req, res) => {
  const { projectId, ...formData } = req.query;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const send = (type, data) => {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
  };

  const gitBash = process.env.GIT_BASH_PATH;
  const claudePath = process.env.CLAUDE_PATH;
  if (!gitBash || !claudePath) { send('error', 'Claude not configured'); res.end(); return; }

  // Update project with workstream and processName from formData
  if (projectId && formData) {
    const proj = loadProject(projectId);
    if (proj) {
      const ws = formData.workstream === 'Other' ? (formData.customWorkstream || formData.workstream) : formData.workstream;
      if (ws) proj.workstream = ws;
      if (formData.processName) proj.processName = formData.processName;
      if (formData.client) proj.client = formData.client;
      saveProject(proj);
    }
  }
  const orch = new Orchestrator(send, projectId, gitBash, claudePath, formData);

  try {
    // Step 1 — Read architect prompt
    const architectDir = path.join(__dirname, '..', 'agents', 'architect');
    const architectPrompt = fs.readFileSync(path.join(architectDir, 'prompt.md'), 'utf8');
    const knowledgeBase = ''; // Knowledge loaded directly in architect prompt

    // Step 2 — Build architect prompt with user inputs
    const fullPrompt = `${architectPrompt}

## KNOWLEDGE BASE
${knowledgeBase}

## PROJECT INPUTS
Project Name: ${formData.projectName || 'Unknown'}
Client: ${formData.client || 'Unknown'}
Industry: ${formData.industry || 'Unknown'}
Requirement: ${formData.requirement || ''}
Current System Landscape: ${formData.systemLandscape || ''}
Existing Licenses: ${formData.existingLicenses || 'Unknown'}
Budget: ${formData.budget || 'Not defined'}
Timeline: ${formData.timeline || 'Not defined'}
Team Size: ${formData.teamSize || 'Not defined'}
Delivery Package: ${formData.deliveryPackage || 'Full Delivery Package'}

## INSTRUCTIONS
1. Analyse the requirement and landscape
2. Recommend the best SAP solution
3. Design HLD and LLD
4. Output an AGENT_PLAN_START...AGENT_PLAN_END block with this JSON structure:
{
  "agents": [
    { "id": "blueprint", "name": "Business Blueprint", "phase": 1, "parallel": true },
    { "id": "functional-spec", "name": "Functional Spec", "phase": 2, "parallel": true, "dependsOn": ["blueprint"] }
  ],
  "phases": [
    { "phase": 1, "name": "Discovery", "agents": ["blueprint"] },
    { "phase": 2, "name": "Design", "agents": ["functional-spec"] }
  ]
}

5. If you need new agents, output RUNTIME_AGENT_START...RUNTIME_AGENT_END blocks
6. Then generate the full HTML architecture document

Now analyse and deliver.`;

    send('status', 'Architect is analysing your requirement...');

    // Step 3 — Run architect agent
    orch.log('🏗️ Solution Architect starting analysis...', 'orchestrator');

    const architectOutput = await orch.runSubagent(
      'architect', 'Solution Architect', fullPrompt, 0
    );

    // Step 4 — Parse architect output for agent plan
    orch.log('📋 Parsing agent execution plan...', 'orchestrator');
    const plan = orch.parseArchitectOutput(architectOutput);

    // Step 5 — Extract HTML from architect output
    const architectHTML = extractHTML(architectOutput);
    if (architectHTML && architectHTML.length > 200) {
      const version = formData.version || '1.0';
      const safeName = (formData.projectName || 'project').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `architect_${safeName}_v${version}_${Date.now()}.html`;
      if (projectId) {
        const dir = getProjectDir(projectId);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, fileName), architectHTML, 'utf8');
        const project = loadProject(projectId);
        if (project) {
          project.documents = project.documents || [];
          project.documents.push({ agentId: 'architect', agentName: 'Solution Architect', fileName, version, generatedAt: new Date().toISOString() });
          saveProject(project);
        }
      }
      send('architect_complete', { html: architectHTML, fileName });
    }

    if (formData.agentPlan) { try { const approved = JSON.parse(formData.agentPlan); if (approved.length > 0) { plan.selectedAgents = approved; } } catch(e) {} }
      orch.log(`🎯 Architect selected ${plan.selectedAgents.length} agents`, 'orchestrator');
    if (plan.selectedAgents.length > 0) {

      const phases = {};
      plan.selectedAgents.forEach(a => {
        if (!phases[a.phase]) phases[a.phase] = [];
        phases[a.phase].push(a);
      });

      for (const [phaseNum, agents] of Object.entries(phases)) {
        orch.log(`⚡ Phase ${phaseNum}: Running ${agents.map(a => a.name).join(', ')}`, 'orchestrator');
        const context = orch.getContext();

        const subagentTasks = agents.map(a => {
          const agentManifest = AGENTS[a.id];
          if (!agentManifest) return null;
          const agentPromptPath = path.join(__dirname, '..', 'agents', a.id, 'prompt.md');
          const agentPrompt = fs.existsSync(agentPromptPath) ? fs.readFileSync(agentPromptPath, 'utf8') : '';
          const subPrompt = `${agentPrompt}\n\n## ARCHITECT CONTEXT\n${context}\n\n## PROJECT DETAILS\nProject: ${formData.projectName || ''}\nClient: ${formData.client || ''}\nBusiness Unit: ${formData.businessUnit || ''}\nIndustry: ${formData.industry || ''}\nWorkstream: ${formData.workstream || ''}\nProcess Name: ${formData.processName || ''}\nSystem Landscape: ${formData.systemLandscape || ''}\nRequirement: ${formData.requirement || ''}\nExisting Licenses: ${formData.existingLicenses || ''}\nBudget: ${formData.budget || ''}\nTimeline: ${formData.timeline || ''}\nVersion: ${formData.version || '1.0'}\n\nGenerate the complete document now. Make it detailed, specific to this client and process. Minimum 50KB of content.`;
          return { id: a.id, name: a.name, prompt: subPrompt };
        }).filter(Boolean);

        await orch.runSequential(subagentTasks, phaseNum);
      }
    }

    orch.log('🎉 Orchestration complete!', 'orchestrator');
    send('orchestration_complete', {
      completedAgents: Object.keys(orch.completedAgents),
      failedAgents: Object.keys(orch.failedAgents),
      runtimeAgents: plan.runtimeAgents.map(a => a.id)
    });
    res.end();

  } catch(e) {
    send('error', 'Orchestration failed: ' + (e.message || JSON.stringify(e)));
    orch.killAll();
    res.end();
  }

  req.on('close', () => { orch.killAll(); });
});
// ─────────────────────────────────────────────────────────────────────────────



// Update document status (approval workflow)
app.put('/documents/:projectId/status', (req, res) => {
  const { projectId } = req.params;
  const { fileName, filePath, status, reviewer, comment } = req.body;
  const validStatuses = ['DRAFT','IN_REVIEW','APPROVED','CHANGES_REQUESTED'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const projFile = path.join(getProjectDir(projectId), 'project.json');
  if (!fs.existsSync(projFile)) return res.status(404).json({ error: 'Project not found' });
  const project = JSON.parse(fs.readFileSync(projFile, 'utf8'));
  const doc = (project.documents || []).find(d => filePath ? d.filePath === filePath : d.fileName === fileName);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  doc.status = status;
  doc.reviewer = reviewer || '';
  doc.reviewedAt = new Date().toISOString();
  if (comment) { doc.comments = doc.comments || []; doc.comments.push({ text: comment, by: reviewer, at: new Date().toISOString(), status }); }
  project.updatedAt = new Date().toISOString();
  fs.writeFileSync(projFile, JSON.stringify(project, null, 2), 'utf8');
  console.log('[Approval] ' + fileName + ' -> ' + status);
  res.json({ success: true, doc });
});
app.post('/save-new-version', (req, res) => {
  const { projectId, filePath, html } = req.body;
  if (!projectId || !filePath || !html) return res.status(400).json({ error: 'Missing fields' });
  try {
    const { saveDocumentToProject } = require('./doc-saver');
    const proj = loadProject(projectId);
    if (!proj) return res.status(404).json({ error: 'Project not found' });
    const parts = filePath.split('/');
    const ws = parts.length >= 3 ? parts[0] : (proj.workstream || 'General');
    const proc = parts.length >= 3 ? parts[1] : (proj.processName || 'Process');
    const fileName = parts[parts.length - 1];
    const agentId = fileName.split('_v')[0];
    const agentManifest = AGENTS[agentId];
    const agentName = agentManifest ? agentManifest.name : agentId;
    const saved = saveDocumentToProject(projectId, agentId, agentName, html, { ...proj, workstream: ws, processName: proc });
    res.json({ success: true, fileName: saved });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/save-document', (req, res) => {
  const { projectId, filePath, html } = req.body;
  if (!projectId || !html) return res.status(400).json({ error: 'Missing fields' });
  const projDir = getProjectDir(projectId);
  let fullPath = filePath ? path.join(projDir, filePath.replace(projectId + '/', '')) : null;
  if (!fullPath || !fs.existsSync(fullPath)) {
    const fileName = filePath ? path.basename(filePath) : null;
    if (fileName) {
      const findFile = (dir) => {
        if (!fs.existsSync(dir)) return null;
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
          if (e.isDirectory()) { const r = findFile(path.join(dir, e.name)); if (r) return r; }
          else if (e.name === fileName) return path.join(dir, e.name);
        }
        return null;
      };
      const found = findFile(projDir);
      if (found) fullPath = found;
    }
  }
  if (!fullPath) return res.status(404).json({ error: 'File not found in project' });
  if (!fs.existsSync(path.dirname(fullPath))) fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, html, 'utf8');
  console.log('[Save] Overwrote:', fullPath);
  res.json({ success: true });
});
async function processRerunQueue() {
  if (rerunRunning || rerunQueue.length === 0) return;
  rerunRunning = true;
  const { projectId, agentId, agentName, filePath, reviewComments, jobId } = rerunQueue.shift();
  const proj = loadProject(projectId);
  const agentDir = path.join(__dirname, "../agents/" + agentId);
  const agentPrompt = fs.existsSync(path.join(agentDir, "prompt.md")) ? fs.readFileSync(path.join(agentDir, "prompt.md"), "utf8") : "";
  const originalContent = filePath && fs.existsSync(path.join(getProjectDir(projectId), path.basename(filePath))) ? fs.readFileSync(path.join(getProjectDir(projectId), path.basename(filePath)), "utf8") : "";
  const isArchitect = agentId === "architect";
  const subPrompt = agentPrompt + '\n\n## PROJECT\nProject: ' + (proj.name||'') + '\nClient: ' + (proj.client||'') + '\n\n## REVIEWER FEEDBACK - ADDRESS ALL POINTS\n' + reviewComments + originalContent + '\n\n' + (isArchitect ? 'IMPORTANT: You must output ONLY a complete HTML document. Do NOT output AGENT_PLAN_START, RUNTIME_AGENT, or any JSON blocks. Do NOT output placeholder text like xxx. The original document content is provided above - use it as the base and make ONLY the requested changes. Output the COMPLETE improved HTML document starting with <!DOCTYPE html> and ending with </html>. Minimum 10KB of content.' : 'Regenerate the complete document making all requested changes naturally within the content. Do NOT add callout boxes or notes saying what was changed - just make the changes inline as a professional consultant would. The document should read as if written fresh, not as a revision.');
  const gitBash = process.env.GIT_BASH_PATH;
  const claudePath = process.env.CLAUDE_PATH;
  if (!gitBash || !claudePath) { completedReruns[jobId] = { done: true, error: 'Claude not configured' }; rerunRunning = false; processRerunQueue(); return; }
  const winBash = gitBash.replace(/[/]/g, '\\');
  const proc = spawn(winBash, ['--login', '-c', claudePath + ' --print --dangerously-skip-permissions'], { env: { ...process.env, HOME: process.env.USERPROFILE } });
  proc.on('error', (err) => { completedReruns[jobId] = { done: true, error: err.message }; rerunRunning = false; processRerunQueue(); });
  proc.stdin.write(subPrompt);
  proc.stdin.end();
  let output = '';
  proc.stdout.on('data', d => output += d.toString());
  proc.on('close', (code) => {
    if (code === 0 && output.length > 5000 && output.includes('<html') && !output.match(/x{50,}/i)) {
      const { saveDocumentToProject } = require('./doc-saver');
      const fpParts = (filePath || '').split('/');
      const folderWs = fpParts.length >= 3 ? fpParts[fpParts.length - 3] : (proj.workstream || 'General');
      const folderProc = fpParts.length >= 2 ? fpParts[fpParts.length - 2] : (proj.processName || 'Process');
      const saved = saveDocumentToProject(projectId, agentId, agentName, output, { ...proj, workstream: folderWs, processName: folderProc });
      completedReruns[jobId] = { done: true, fileName: saved, agentName };
      console.log('[Queue] Done:', agentName, '->', saved);
    } else {
      completedReruns[jobId] = { done: true, error: 'Generation failed - Claude output was invalid (too short, wrong format, or placeholder content). Please try again.' };
    }
    rerunRunning = false;
    processRerunQueue();
  });
}

app.post('/rerun-agent', (req, res) => {
  const { projectId, agentId, agentName, filePath, reviewComments } = req.body;
  const jobId = Date.now() + '-' + agentId;
  const position = rerunQueue.length + (rerunRunning ? 1 : 0);
  rerunQueue.push({ projectId, agentId, agentName, filePath, reviewComments, jobId });
  processRerunQueue();
  const msg = position > 0 ? 'Queued at position ' + (position + 1) + '. Will run after current job.' : 'Claude is generating. Check Documents tab in ~3 min.';
  res.json({ success: true, jobId, queued: position > 0, message: msg });
});

app.get('/rerun-status/:jobId', (req, res) => {
  const result = completedReruns[req.params.jobId];
  if (result) { delete completedReruns[req.params.jobId]; res.json(result); }
  else res.json({ done: false, queueLength: rerunQueue.length, running: rerunRunning });
});
app.delete('/documents/:projectId/*', (req, res) => {
  const projectId = req.params.projectId;
  const relPath = decodeURIComponent(req.params[0]);
  const projectDir = getProjectDir(projectId);
  const filePath = path.join(projectDir, relPath);
  
  // Security check - must be within projects dir
  if (!filePath.startsWith(projectDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    // Delete the file
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    
    // Remove from project.json documents array
    const projFile = path.join(projectDir, 'project.json');
    if (fs.existsSync(projFile)) {
      const project = JSON.parse(fs.readFileSync(projFile, 'utf8'));
      project.documents = (project.documents || []).filter(d => 
        (d.filePath || d.fileName) !== relPath && d.fileName !== relPath.split('/').pop()
      );
      project.updatedAt = new Date().toISOString();
      fs.writeFileSync(projFile, JSON.stringify(project, null, 2), 'utf8');
    }
    
    console.log('[Delete] Removed:', filePath);
    res.json({ success: true, deleted: relPath });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Read agent prompt
app.get('/agents/:id/prompt', (req, res) => {
  const promptPath = path.join(__dirname, '../agents', req.params.id, 'prompt.md');
  if (!fs.existsSync(promptPath)) return res.status(404).json({ error: 'Prompt not found' });
  res.json({ prompt: fs.readFileSync(promptPath, 'utf8') });
});

// Update agent prompt
app.put('/agents/:id/prompt', (req, res) => {
  const promptPath = path.join(__dirname, '../agents', req.params.id, 'prompt.md');
  if (!fs.existsSync(promptPath)) return res.status(404).json({ error: 'Agent not found' });
  fs.writeFileSync(promptPath, req.body.prompt, 'utf8');
  res.json({ success: true });
});
require("./analyse-route")(app, AGENTS);

app.post('/cleanup',(req,res)=>{res.json({success:true,removed:[]});});


app.get('/btp-admin-run', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  const send = (type, data) => res.write('data: ' + JSON.stringify({ type, ...data }) + '\n\n');

  try {
    const { task, projectId } = req.query;
    const instruction = task || 'Full Platform Assessment of my BTP trial account';

    // Get token
    const tokenFile = path.join(__dirname, '../btp_tokens.json');
    if (!fs.existsSync(tokenFile)) { send('error', { message: 'Run BTP auth setup first' }); res.end(); return; }
    const stored = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
    const token = stored.auth?.access_token;
    if (!token) { send('error', { message: 'No BTP token found' }); res.end(); return; }

    send('status', { message: 'Connected to SAP BTP Admin MCP' });

    // Write temp MCP config for Claude Code
    const mcpConfig = {
      mcpServers: {
        "BTP Administration": {
          type: "streamableHttp",
          url: "https://sso.mcp.btp.cloud.sap/mcp",
          headers: { Authorization: "Bearer " + token }
        }
      }
    };
    const mcpConfigFile = path.join(__dirname, '../.btp-mcp-config.json');
    fs.writeFileSync(mcpConfigFile, JSON.stringify(mcpConfig, null, 2));
    send('status', { message: 'BTP MCP config prepared' });

    // Build prompt for Claude Code
    const fullPrompt = `You are a SAP BTP Administrator. You have access to the SAP BTP Administration MCP server via the "BTP Administration" MCP connection.

Context:
- Global Account subdomain: 8cede957trial-ga
- Subaccount ID: 4e2eaf4b-4463-4be9-9926-7cf17e8adaba
- User email: vikram.f.sharma@gmail.com
- Region: AP21 Singapore Azure

User instruction: ${instruction}

Please use the BTP Administration MCP tools to complete this task. Execute the necessary tool calls, show the results, and provide a summary of what was done and what the outcome was.

After completing the task, output a complete HTML report (starting with <!DOCTYPE html>) summarizing:
1. What actions were taken
2. Results of each action (success/failure)
3. Current state after the actions
4. Any next steps needed`;

    const gitBash = process.env.GIT_BASH_PATH;
    const claudePath = process.env.CLAUDE_PATH;
    if (!gitBash || !claudePath) { send('error', { message: 'Claude CLI not configured in .env' }); res.end(); return; }

    send('status', { message: 'Running Claude Code CLI with BTP MCP...' });

    const { spawn } = require('child_process');
    const promptFile = path.join(__dirname, '../.btp-prompt.txt');
    fs.writeFileSync(promptFile, fullPrompt);

    const mcpCfgPath = mcpConfigFile.split('\\\\').join('/');
    const promptPath = promptFile.split('\\\\').join('/');
    const proc = spawn('powershell.exe', ['-Command', 'Get-Content ' + promptFile + ' | claude --print --dangerously-skip-permissions --mcp-config ' + mcpConfigFile + ' --strict-mcp-config'], { env: { ...process.env } });

    let output = '';

    proc.stdout.on('data', d => {
      output += d.toString();
      send('progress', { text: d.toString().substring(0, 100) });
    });
    proc.stderr.on('data', d => send('log', { text: d.toString().substring(0, 100) }));

    proc.on('close', () => {
      // Clean up temp config
      try { fs.unlinkSync(mcpConfigFile); } catch(e) {}

      const html = output.includes('<!DOCTYPE') 
        ? output.substring(output.indexOf('<!DOCTYPE'))
        : `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>BTP Admin Report</title>
<style>body{font-family:Arial,sans-serif;max-width:900px;margin:40px auto;padding:20px}h1{color:#0070F2}pre{background:#f8fafc;padding:16px;border-radius:8px;white-space:pre-wrap}</style>
</head><body><h1>BTP Admin Report</h1><p><strong>Instruction:</strong> ${instruction}</p>
<p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
<pre>${output || 'No output received from Claude CLI'}</pre></body></html>`;

      if (projectId) {
        try {
          const { saveDocumentToProject } = require('./doc-saver');
          const proj = loadProject(projectId);
          if (proj) saveDocumentToProject(projectId, 'btp-admin-agent', 'SAP BTP Admin Agent', html, { ...proj, workstream: 'Platform', processName: 'BTP-Setup' });
          send('status', { message: 'Report saved to project' });
        } catch(e) {}
      }

      send('complete', { html, actionsExecuted: 1, succeeded: 1 });
      res.end();
    });

    proc.on('error', e => { send('error', { message: e.message }); res.end(); });

  } catch(e) {
    send('error', { message: e.message });
    res.end();
  }
});

app.listen(MCP_PORT, () => {
  console.log('DeliverAI MCP Server running on port ' + MCP_PORT);
  console.log('Agents loaded: ' + Object.keys(AGENTS).length);
});

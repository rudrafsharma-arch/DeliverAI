require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
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
function buildPrompt(agent, formData, projectId) {
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
  const { name, client, type, system, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name required' });
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
  const project = { id, name, client, type, system, description, documents: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
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
app.post('/preview', (req, res) => {
  const { agentId, formData, projectId } = req.body;
  const agent = AGENTS[agentId];
  if (!agent) return res.status(404).json({ error:'Agent not found' });
  const prompt = buildPrompt(agent, formData, projectId);
  const context = projectId ? loadProjectContext(projectId) : {};
  res.json({ agentId, agentName:agent.name, promptPreview:prompt.substring(0,500)+'...', promptLength:prompt.length, contextKeys:Object.keys(context), previousAgents:agent.inputs?.fromAgents||[], estimatedTime:'1-3 minutes' });
});

// SSE Generation
app.get('/generate-stream', (req, res) => {
  const { agentId, projectId, ...formData } = req.query;
  const agent = AGENTS[agentId];
  if (!agent) { res.status(400).end('Agent not found'); return; }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const send = (type, data) => { if (!res.writableEnded) res.write(`data: ${JSON.stringify({ type, data })}\n\n`); };
  const prompt = buildPrompt(agent, formData, projectId);

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

  const { spawn } = require('child_process');
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

app.get('/download/:projectId/:fileName', (req, res) => {
  const filePath = path.join(getProjectDir(req.params.projectId), req.params.fileName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error:'File not found' });
  res.download(filePath);
});

app.listen(MCP_PORT, () => {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log(`║  DeliverAI MCP Server        :${MCP_PORT}          ║`);
  console.log(`║  Agents loaded: ${Object.keys(AGENTS).length}                           ║`);
  console.log('║  SSE Streaming + Context Grounding           ║');
  console.log('║  SAP Knowledge Base: enabled                 ║');
  console.log('║  Human-in-the-loop: enabled                  ║');
  console.log('║  AI Assistant: enabled                       ║');
  console.log('╚══════════════════════════════════════════════╝\n');
});

// ── Orchestration Endpoint ────────────────────────────────────────────────────
const Orchestrator = require('./orchestrator');

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

  const orch = new Orchestrator(send, projectId, gitBash, claudePath);

  try {
    // Step 1 — Read architect prompt
    const architectDir = path.join(__dirname, '..', 'agents', 'architect');
    const architectPrompt = fs.readFileSync(path.join(architectDir, 'prompt.md'), 'utf8');
    const knowledgeBase = loadKnowledge(['sap/activate-methodology.md', 'sap/btp-integration-best-practices.md', 'sap/rap-guide.md']);

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

    // Step 6 — Run subagents by phase if plan exists
    if (plan.selectedAgents.length > 0) {
      orch.log(`🎯 Architect selected ${plan.selectedAgents.length} agents`, 'orchestrator');

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
          const subPrompt = `${agentPrompt}\n\n## ARCHITECT CONTEXT\n${context}\n\n## PROJECT\nProject: ${formData.projectName}\nClient: ${formData.client}\nRequirement: ${formData.requirement}\n\nGenerate the complete document now.`;
          return { id: a.id, name: a.name, prompt: subPrompt };
        }).filter(Boolean);

        await orch.runParallel(subagentTasks, phaseNum);
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
    send('error', `Orchestration failed: ${e.message}`);
    orch.killAll();
    res.end();
  }

  req.on('close', () => { orch.killAll(); });
});
// ─────────────────────────────────────────────────────────────────────────────

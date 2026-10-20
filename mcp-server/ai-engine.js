const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args)).catch(() => global.fetch(...args));

async function callAI(prompt, systemPrompt, options = {}) {
  const engine = process.env.AI_ENGINE || 'claude-code-cli';
  
  if (engine === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    return callAnthropic(prompt, systemPrompt, options);
  } else if (engine === 'gemini' && process.env.GEMINI_API_KEY) {
    return callGemini(prompt, systemPrompt, options);
  } else if (engine === 'azure-openai' && process.env.AZURE_OPENAI_KEY) {
    return callAzureOpenAI(prompt, systemPrompt, options);
  } else if (engine === 'sap-ai-core' && process.env.SAP_AI_CORE_KEY) {
    return callSAPAICore(prompt, systemPrompt, options);
  } else {
    return callClaudeCodeCLI(prompt, systemPrompt, options);
  }
}

async function callAnthropic(prompt, systemPrompt, options) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: options.maxTokens || 8000,
      system: systemPrompt || '',
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!r.ok) throw new Error('Anthropic API error: ' + r.status);
  const d = await r.json();
  return d.content?.map(c => c.text || '').join('') || '';
}

async function callGemini(prompt, systemPrompt, options) {
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const key = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const contents = [];
  if (systemPrompt) contents.push({ role: 'user', parts: [{ text: systemPrompt }] });
  contents.push({ role: 'user', parts: [{ text: prompt }] });
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: options.maxTokens || 8000 } })
  });
  if (!r.ok) throw new Error('Gemini API error: ' + r.status + ' ' + await r.text());
  const d = await r.json();
  return d.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callAzureOpenAI(prompt, systemPrompt, options) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-01';
  const r = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.AZURE_OPENAI_KEY },
    body: JSON.stringify({
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      max_tokens: options.maxTokens || 8000
    })
  });
  if (!r.ok) throw new Error('Azure OpenAI error: ' + r.status);
  const d = await r.json();
  return d.choices?.[0]?.message?.content || '';
}

async function callSAPAICore(prompt, systemPrompt, options) {
  const endpoint = process.env.SAP_AI_CORE_ENDPOINT;
  const deployment = process.env.SAP_AI_CORE_DEPLOYMENT;
  const token = process.env.SAP_AI_CORE_KEY;
  const r = await fetch(`${endpoint}/v2/inference/deployments/${deployment}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, 'AI-Resource-Group': 'default' },
    body: JSON.stringify({
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      max_tokens: options.maxTokens || 8000
    })
  });
  if (!r.ok) throw new Error('SAP AI Core error: ' + r.status);
  const d = await r.json();
  return d.choices?.[0]?.message?.content || '';
}

async function callClaudeCodeCLI(prompt, systemPrompt, options) {
  const { spawn } = require('child_process');
  const fs = require('fs');
  const path = require('path');
  const gitBash = process.env.GIT_BASH_PATH;
  const claudePath = process.env.CLAUDE_PATH;
  if (!gitBash || !claudePath) throw new Error('Claude CLI not configured');
  const fullPrompt = systemPrompt ? systemPrompt + '\n\n' + prompt : prompt;
  const promptFile = path.join(__dirname, '../.ai-prompt.txt');
  fs.writeFileSync(promptFile, fullPrompt);
  return new Promise((resolve, reject) => {
    const proc = spawn('powershell.exe', ['-Command', 'Get-Content "' + promptFile + '" | claude --print --dangerously-skip-permissions'], { env: { ...process.env } });
    let output = '';
    proc.stdout.on('data', d => output += d.toString());
    proc.stderr.on('data', d => {});
    proc.on('close', () => { try { fs.unlinkSync(promptFile); } catch(e) {} resolve(output); });
    proc.on('error', reject);
  });
}

function getActiveEngine() {
  const engine = process.env.AI_ENGINE || 'claude-code-cli';
  if (engine === 'anthropic' && process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (engine === 'gemini' && process.env.GEMINI_API_KEY) return 'gemini';
  if (engine === 'azure-openai' && process.env.AZURE_OPENAI_KEY) return 'azure-openai';
  if (engine === 'sap-ai-core' && process.env.SAP_AI_CORE_KEY) return 'sap-ai-core';
  return 'claude-code-cli';
}

module.exports = { callAI, getActiveEngine };


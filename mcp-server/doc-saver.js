const fs = require('fs');
const path = require('path');
const PROJECTS_DIR = path.join(__dirname, '..', 'projects');

function extractHTML(output) {
  const m1 = output.match(/<!DOCTYPE[\s\S]*<\/html>/i);
  if (m1) return m1[0];
  const m2 = output.match(/<html[\s\S]*<\/html>/i);
  if (m2) return m2[0];
  return null;
}

function sanitize(str) {
  return (str || 'Unknown').replace(/[^a-zA-Z0-9\-_ ]/g, '').trim().replace(/\s+/g, '-');
}

function saveDocumentToProject(projectId, agentId, agentName, output, formData) {
  if (!projectId) return null;
  const html = extractHTML(output);
  if (!html || html.length < 200) return null;

  const projFile = path.join(PROJECTS_DIR, projectId, 'project.json');
  let project = null;
  if (fs.existsSync(projFile)) {
    try { project = JSON.parse(fs.readFileSync(projFile, 'utf8')); } catch(e) {}
  }

  const client = sanitize((project && project.client) || (formData && formData.client) || 'Unknown-Client');
  const workstream = sanitize((project && project.workstream) || (formData && formData.workstream) || 'General');
  const processName = sanitize((project && project.processName) || (formData && formData.processName) || (project && project.name) || 'Process');

  const processDir = path.join(PROJECTS_DIR, projectId, client, workstream, processName);
  if (!fs.existsSync(processDir)) fs.mkdirSync(processDir, { recursive: true });

  const existing = fs.existsSync(processDir) ? fs.readdirSync(processDir).filter(function(f) { return f.startsWith(agentId); }) : [];
  const version = existing.length + 1;
  const fileName = agentId + '_v' + version + '.html';
  const filePath = path.join(processDir, fileName);
  fs.writeFileSync(filePath, html, 'utf8');

  if (fs.existsSync(projFile)) {
    project.documents = project.documents || [];
    project.documents.push({ status: 'success',
      agentId: agentId,
      agentName: agentName,
      fileName: fileName,
      filePath: path.join(projectId, client, workstream, processName, fileName).replace(/\\/g, '/'),
      version: version.toString(),
      generatedAt: new Date().toISOString()
    });
    project.updatedAt = new Date().toISOString();
    fs.writeFileSync(projFile, JSON.stringify(project, null, 2), 'utf8');
  }

  console.log('[Orchestrator] Saved:', filePath);
  return fileName;
}

module.exports = { extractHTML: extractHTML, saveDocumentToProject: saveDocumentToProject };

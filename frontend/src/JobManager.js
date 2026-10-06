// DeliverAI Global Job Manager
const STORAGE_KEY = 'deliverAI_jobs';
const listeners = {};

function loadJobs() {
  try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : {}; }
  catch(e) { return {}; }
}

function saveJobs(j) {
  try {
    const toSave = {};
    Object.entries(j).forEach(([id, job]) => { toSave[id] = { ...job, cancel: undefined }; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch(e) {}
}

function notifyListeners() { Object.values(listeners).forEach(fn => fn(getJobs())); }

const jobs = loadJobs();

export function startJob(agentId, agentName, projectId, formData) {
  const jobId = agentId + '-' + Date.now();
  jobs[jobId] = { jobId, agentId, agentName, projectId, formData, status: 'running', logs: [], result: null, error: null, startedAt: new Date().toISOString(), completedAt: null };
  saveJobs(jobs);
  notifyListeners();
  const params = new URLSearchParams({ agentId, projectId: projectId || '', ...formData });
  const es = new EventSource('http://localhost:3002/generate-stream?' + params);
  es.onmessage = (e) => {
    const { type, data } = JSON.parse(e.data);
    if (type === 'status' || type === 'progress') jobs[jobId].logs.push({ time: new Date().toISOString(), msg: data });
    else if (type === 'complete') { es.close(); jobs[jobId].status = 'completed'; jobs[jobId].result = data; jobs[jobId].completedAt = new Date().toISOString(); jobs[jobId].logs.push({ time: new Date().toISOString(), msg: 'Completed' }); }
    else if (type === 'error') { es.close(); jobs[jobId].status = 'failed'; jobs[jobId].error = data; jobs[jobId].completedAt = new Date().toISOString(); }
    saveJobs(jobs); notifyListeners();
  };
  es.onerror = () => { es.close(); if (jobs[jobId].status === 'running') { jobs[jobId].status = 'failed'; jobs[jobId].error = 'Connection lost'; jobs[jobId].completedAt = new Date().toISOString(); saveJobs(jobs); notifyListeners(); } };
  jobs[jobId].cancel = () => { es.close(); jobs[jobId].status = 'cancelled'; jobs[jobId].completedAt = new Date().toISOString(); saveJobs(jobs); notifyListeners(); };
  notifyListeners();
  return jobId;
}

export function startRefineJob(agentId, agentName, projectId, formData, existingHtml, instruction) {
  const jobId = agentId + '-refine-' + Date.now();
  jobs[jobId] = { jobId, agentId, agentName: agentName + ' (Refined)', projectId, formData, status: 'running', logs: [], result: null, error: null, startedAt: new Date().toISOString(), completedAt: null, isRefinement: true, instruction };
  saveJobs(jobs);
  notifyListeners();
  const existingText = existingHtml.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().substring(0,3000);
  const refinePrompt = 'You are refining an existing SAP delivery document. Current content:\n\n' + existingText + '\n\nInstruction: ' + instruction + '\n\nGenerate complete improved HTML with ALL CSS embedded. Return ONLY HTML starting with DOCTYPE html.';
  const params = new URLSearchParams({ agentId, projectId: projectId || '', projectName: formData.projectName || '', processName: formData.processName || '', description: refinePrompt, client: formData.client || '', sapSystem: formData.sapSystem || '', module: formData.module || '', preparedBy: formData.preparedBy || '', version: formData.version || '1.0' });
  const es = new EventSource('http://localhost:3002/generate-stream?' + params);
  es.onmessage = (e) => {
    const { type, data } = JSON.parse(e.data);
    if (type === 'status' || type === 'progress') jobs[jobId].logs.push({ time: new Date().toISOString(), msg: data });
    else if (type === 'complete') { es.close(); jobs[jobId].status = 'completed'; jobs[jobId].result = data; jobs[jobId].completedAt = new Date().toISOString(); jobs[jobId].logs.push({ time: new Date().toISOString(), msg: 'Refinement complete' }); }
    else if (type === 'error') { es.close(); jobs[jobId].status = 'failed'; jobs[jobId].error = data; jobs[jobId].completedAt = new Date().toISOString(); }
    saveJobs(jobs); notifyListeners();
  };
  es.onerror = () => { es.close(); if (jobs[jobId].status === 'running') { jobs[jobId].status = 'failed'; jobs[jobId].error = 'Connection lost'; jobs[jobId].completedAt = new Date().toISOString(); saveJobs(jobs); notifyListeners(); } };
  jobs[jobId].cancel = () => { es.close(); jobs[jobId].status = 'cancelled'; jobs[jobId].completedAt = new Date().toISOString(); saveJobs(jobs); notifyListeners(); };
  notifyListeners();
  return jobId;
}

export function getJobs() { return Object.values(jobs).sort((a,b) => new Date(b.startedAt) - new Date(a.startedAt)); }
export function getRunningCount() { return Object.values(jobs).filter(j => j.status === 'running').length; }
export function cancelJob(jobId) { if (jobs[jobId] && jobs[jobId].cancel) jobs[jobId].cancel(); }
export function clearJob(jobId) { delete jobs[jobId]; saveJobs(jobs); notifyListeners(); }
export function clearCompleted() { Object.keys(jobs).forEach(id => { if (jobs[id].status !== 'running') delete jobs[id]; }); saveJobs(jobs); notifyListeners(); }
export function updateApproval(jobId, status, approvers, comments) { if (!jobs[jobId]) return; jobs[jobId].approvalStatus = status; jobs[jobId].approvers = approvers || []; jobs[jobId].comments = comments || []; saveJobs(jobs); notifyListeners(); }
export function importJob(job) { if (jobs[job.jobId]) return; jobs[job.jobId] = job; saveJobs(jobs); notifyListeners(); }
export function subscribe(id, fn) { listeners[id] = fn; }
export function unsubscribe(id) { delete listeners[id]; }

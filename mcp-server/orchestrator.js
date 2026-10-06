const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── Orchestrator — manages subagent spawning and coordination ────────────────

class Orchestrator {
  constructor(send, projectId, gitBash, claudePath) {
    this.send = send;           // SSE send function
    this.projectId = projectId;
    this.gitBash = gitBash;
    this.claudePath = claudePath;
    this.agentsDir = path.join(__dirname, '..', 'agents');
    this.knowledgeDir = path.join(__dirname, '..', 'knowledge');
    this.completedAgents = {};  // agentId -> output
    this.runningAgents = {};    // agentId -> process
    this.failedAgents = {};     // agentId -> error
  }

  // Send orchestrator message to UI
  log(message, type = 'orchestrator') {
    this.send(type, { message, timestamp: new Date().toISOString() });
  }

  // Run a single subagent
  async runSubagent(agentId, agentName, prompt, phase) {
    return new Promise((resolve, reject) => {
      this.log(`🚀 Spawning subagent: ${agentName || agentId}`, 'subagent_start');
      this.send('subagent_status', { agentId, agentName: agentName || agentId, status: 'running', phase });

      const proc = spawn(
        this.gitBash,
        ['--login', '-c', `${this.claudePath} --print --dangerously-skip-permissions`],
        { env: { ...process.env, HOME: process.env.HOME || process.env.USERPROFILE } }
      );

      this.runningAgents[agentId] = proc;

      proc.stdin.write(prompt);
      proc.stdin.end();

      let output = '';
      let errorOutput = '';

      proc.stdout.on('data', d => {
        output += d.toString();
        // Stream progress to UI
        this.send('subagent_progress', { agentId, agentName, chunk: d.toString() });
      });

      proc.stderr.on('data', d => { errorOutput += d.toString(); });

      proc.on('close', (code) => {
        delete this.runningAgents[agentId];
        if (code === 0 && output.length > 100) {
          this.completedAgents[agentId] = output;
          this.send('subagent_status', { agentId, agentName, status: 'completed', phase });
          this.log(`✅ ${agentName} completed`, 'subagent_complete');
          resolve(output);
        } else {
          this.failedAgents[agentId] = errorOutput || 'Unknown error';
          this.send('subagent_status', { agentId, agentName, status: 'failed', phase });
          this.log(`❌ ${agentName} failed`, 'subagent_failed');
          reject(new Error(`${agentName} failed: ${errorOutput}`));
        }
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        try { proc.kill(); } catch(e) {}
        reject(new Error(`${agentName} timed out`));
      }, 300000);
    });
  }

  // Run multiple agents in parallel
  async runParallel(agents, phase) {
    this.log(`⚡ Running ${agents.length} agents in parallel — Phase ${phase}`, 'orchestrator');
    const results = await Promise.allSettled(
      agents.map(a => this.runSubagent(a.id, a.name, a.prompt, phase))
    );
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        this.log(`⚠️ ${agents[i].name} failed but continuing...`, 'warning');
      }
    });
    return results;
  }

  // Run agents in sequence
  async runSequential(agents, phase) {
    this.log(`📋 Running ${agents.length} agents sequentially — Phase ${phase}`, 'orchestrator');
    const results = [];
    for (const agent of agents) {
      try {
        const result = await this.runSubagent(agent.id, agent.name, agent.prompt, phase);
        results.push({ status: 'fulfilled', value: result });
      } catch(e) {
        results.push({ status: 'rejected', reason: e });
        this.log(`⚠️ ${agent.name} failed, continuing...`, 'warning');
      }
    }
    return results;
  }

  // Save runtime-created agent to disk
  saveRuntimeAgent(agentData) {
    try {
      const agentDir = path.join(this.agentsDir, agentData.id);
      if (!fs.existsSync(agentDir)) fs.mkdirSync(agentDir, { recursive: true });
      fs.writeFileSync(path.join(agentDir, 'manifest.json'), JSON.stringify(agentData.manifest, null, 2));
      fs.writeFileSync(path.join(agentDir, 'prompt.md'), agentData.prompt);
      fs.writeFileSync(path.join(agentDir, 'form.json'), JSON.stringify(agentData.form, null, 2));
      this.log(`💾 Runtime agent saved: ${agentData.manifest.name}`, 'runtime_agent_saved');
      this.send('runtime_agent_created', { agentId: agentData.id, agentName: agentData.manifest.name });
      return true;
    } catch(e) {
      this.log(`Failed to save runtime agent: ${e.message}`, 'error');
      return false;
    }
  }

  // Parse architect output to extract agent plan and runtime agents
  parseArchitectOutput(output) {
    const plan = {
      selectedAgents: [],
      runtimeAgents: [],
      phases: []
    };

    // Extract RUNTIME_AGENT blocks
    const runtimeRegex = /RUNTIME_AGENT_START([\s\S]*?)RUNTIME_AGENT_END/g;
    let match;
    while ((match = runtimeRegex.exec(output)) !== null) {
      try {
        const agentData = JSON.parse(match[1].trim());
        plan.runtimeAgents.push(agentData);
        this.saveRuntimeAgent(agentData);
      } catch(e) {
        this.log(`Could not parse runtime agent: ${e.message}`, 'warning');
      }
    }

    // Extract selected agents list
    const agentListRegex = /AGENT_PLAN_START([\s\S]*?)AGENT_PLAN_END/g;
    while ((match = agentListRegex.exec(output)) !== null) {
      try {
        const agentPlan = JSON.parse(match[1].trim());
        plan.selectedAgents = agentPlan.agents || [];
        plan.phases = agentPlan.phases || [];
      } catch(e) {
        this.log(`Could not parse agent plan: ${e.message}`, 'warning');
      }
    }

    return plan;
  }

  // Get context from completed agents
  getContext() {
    return Object.entries(this.completedAgents)
      .map(([id, output]) => `## Output from ${id}:\n${output.substring(0, 2000)}`)
      .join('\n\n');
  }

  // Kill all running agents
  killAll() {
    Object.values(this.runningAgents).forEach(proc => {
      try { proc.kill(); } catch(e) {}
    });
  }
}

module.exports = Orchestrator;

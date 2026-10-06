const { spawn } = require('child_process');

module.exports = function(app, AGENTS) {
  app.get('/analyse', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    const send = (type, data) => {
      if (!res.writableEnded) res.write('data: ' + JSON.stringify({ type, data }) + '\n\n');
    };

    const { projectName, client, industry, requirement, systemLandscape, existingLicenses, budget } = req.query;
    const gitBash = process.env.GIT_BASH_PATH;
    const claudePath = process.env.CLAUDE_PATH;

    if (!gitBash || !claudePath) { send('error', 'Claude not configured'); res.end(); return; }

    const agentList = Object.values(AGENTS)
      .filter(a => a.id !== 'architect')
      .map(a => '- ' + a.id + ': ' + a.name)
      .join('\n');

    const prompt = [
      'You are a Senior SAP Solution Architect at Accenture.',
      '',
      'Project: ' + (projectName || ''),
      'Client: ' + (client || 'Unknown'),
      'Industry: ' + (industry || 'Unknown'),
      'Landscape: ' + (systemLandscape || ''),
      'Licenses: ' + (existingLicenses || 'Unknown'),
      'Budget: ' + (budget || 'Not defined'),
      'Requirement: ' + (requirement || ''),
      '',
      'Available agents:',
      agentList,
      '',
      'Respond in this EXACT format:',
      '',
      'ANALYSIS:',
      '[3-4 sentence analysis of recommended approach]',
      '',
      'RECOMMENDED_AGENTS:',
      '[{"id":"blueprint","name":"Business Blueprint","phase":1,"reason":"Foundation document"}]',
      '',
      'NEW_AGENTS_NEEDED:',
      '[]',
      '',
      'ESTIMATED_TIME: X minutes'
    ].join('\n');

    const proc = spawn(gitBash, ['--login', '-c', claudePath + ' --print --dangerously-skip-permissions'], {
      env: { ...process.env, HOME: process.env.HOME || process.env.USERPROFILE }
    });

    proc.stdin.write(prompt);
    proc.stdin.end();

    let output = '';
    let lastData = Date.now();

    const silenceCheck = setInterval(() => {
      if (Date.now() - lastData > 120000) {
        clearInterval(silenceCheck);
        try { proc.kill(); } catch(e) {}
        send('error', 'Analysis timed out');
        res.end();
      }
    }, 5000);

    proc.stdout.on('data', d => {
      output += d.toString();
      lastData = Date.now();
      send('chunk', d.toString());
    });

    proc.stderr.on('data', () => {});

    proc.on('close', () => {
      clearInterval(silenceCheck);
      try {
        const ai = output.indexOf('ANALYSIS:');
        const ri = output.indexOf('RECOMMENDED_AGENTS:');
        const ni = output.indexOf('NEW_AGENTS_NEEDED:');
        const ti = output.indexOf('ESTIMATED_TIME:');

        const analysis = ai > -1
          ? output.substring(ai + 9, ri > -1 ? ri : ai + 500).trim()
          : output.substring(0, 500);

        let ra = [], na = [];
        try {
          if (ri > -1) {
            const rend = ni > -1 ? ni : ti > -1 ? ti : output.length;
            ra = JSON.parse(output.substring(ri + 19, rend).trim());
          }
        } catch(e) {}

        try {
          if (ni > -1) {
            const nend = ti > -1 ? ti : output.length;
            na = JSON.parse(output.substring(ni + 18, nend).trim());
          }
        } catch(e) {}

        const nlIdx = output.indexOf('\n', ti);
        const et = ti > -1
          ? output.substring(ti + 15, nlIdx > -1 ? nlIdx : ti + 30).trim()
          : 'Unknown';

        send('analysis_complete', { analysis, recommendedAgents: ra, newAgents: na, estimatedTime: et });
      } catch(e) {
        send('analysis_complete', {
          analysis: output.substring(0, 500),
          recommendedAgents: [],
          newAgents: [],
          estimatedTime: 'Unknown'
        });
      }
      res.end();
    });

    req.on('close', () => {
      clearInterval(silenceCheck);
      try { proc.kill(); } catch(e) {}
    });
  });
};
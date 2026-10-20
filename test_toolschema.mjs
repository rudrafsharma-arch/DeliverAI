import fs from 'fs';

const stored = JSON.parse(fs.readFileSync('./btp_tokens.json','utf8'));
const token = stored.auth.access_token;
const MCP_URL = 'https://sso.mcp.btp.cloud.sap/mcp';

const r = await fetch(MCP_URL, {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} })
});

const text = await r.text();
for (const line of text.split('\n')) {
  if (line.startsWith('data: ')) {
    try {
      const data = JSON.parse(line.replace('data: ',''));
      const tools = data.result?.tools || [];
      // Show schema for Subaccount and Subscription tools
      const relevant = tools.filter(t => t.name.includes('Subaccount') || t.name.includes('Subscription') || t.name.includes('GlobalAccount'));
      relevant.forEach(t => {
        console.log('\nTool:', t.name);
        console.log('Params:', JSON.stringify(t.inputSchema?.properties || {}, null, 2).substring(0,300));
      });
    } catch(e) {}
  }
}

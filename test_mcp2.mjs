import fs from 'fs';

const TOKEN_FILE = './btp_tokens.json';
const stored = JSON.parse(fs.readFileSync(TOKEN_FILE,'utf8'));
const token = stored.auth.access_token;
const MCP_URL = 'https://sso.mcp.btp.cloud.sap/mcp';

console.log('Testing with token:', token.substring(0,20)+'...');

// Call MCP with SSE headers
const r = await fetch(MCP_URL, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream'
  },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} })
});

console.log('Status:', r.status);
const text = await r.text();
console.log('Response:', text.substring(0, 500));

// Parse SSE
const lines = text.split('\n');
for (const line of lines) {
  if (line.startsWith('data: ')) {
    try {
      const data = JSON.parse(line.replace('data: ',''));
      if (data.result?.tools) {
        console.log('\n✅ BTP Admin MCP Tools:');
        data.result.tools.forEach(t => console.log(' -', t.name));
        
        // Save to connections.json
        const conns = JSON.parse(fs.readFileSync('./connections.json','utf8'));
        const conn = { id:'sap-btp-admin-mcp', name:'SAP BTP Admin MCP', systemType:'mcp', authType:'bearer', hostUrl: MCP_URL, bearerToken: token, refreshToken: stored.auth.refresh_token || '' };
        const idx = conns.connections.findIndex(c => c.id === 'sap-btp-admin-mcp');
        if (idx !== -1) conns.connections[idx] = conn; else conns.connections.push(conn);
        fs.writeFileSync('./connections.json', JSON.stringify(conns,null,2));
        console.log('\n✅ Token saved to connections.json!');
      }
    } catch(e) {}
  }
}

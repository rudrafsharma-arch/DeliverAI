import fs from 'fs';

const stored = JSON.parse(fs.readFileSync('./btp_tokens.json','utf8'));
const token = stored.auth.access_token;
const MCP_URL = 'https://sso.mcp.btp.cloud.sap/mcp';

async function callTool(name, args) {
  const r = await fetch(MCP_URL, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'tools/call', params: { name, arguments: args } })
  });
  const text = await r.text();
  for (const line of text.split('\n')) {
    if (line.startsWith('data: ')) {
      try { return JSON.parse(line.replace('data: ','')); } catch(e) {}
    }
  }
}

// Step 1: List global accounts
console.log('Step 1: Getting global account...');
const accounts = await callTool('GlobalAccount-list', {});
console.log(JSON.stringify(accounts?.result?.content?.[0]?.text || accounts, null, 2).substring(0,300));

// Step 2: List subaccounts
console.log('\nStep 2: Getting subaccounts...');
const subs = await callTool('Subaccount-list', {});
console.log(JSON.stringify(subs?.result?.content?.[0]?.text || subs, null, 2).substring(0,300));

// Step 3: Check Integration Suite subscription
console.log('\nStep 3: Checking subscriptions...');
const subscriptions = await callTool('Subscription-list', { subaccountId: '4e2eaf4b-4463-4be9-9926-7cf17e8adaba' });
console.log(JSON.stringify(subscriptions?.result?.content?.[0]?.text || subscriptions, null, 2).substring(0,500));

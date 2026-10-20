import fs from 'fs';

const stored = JSON.parse(fs.readFileSync('./btp_tokens.json','utf8'));
const token = stored.auth.access_token;
const MCP_URL = 'https://sso.mcp.btp.cloud.sap/mcp';
const GLOBAL_ACCOUNT = '5839718d-f0c7-4e49-85cb-1c0de40b7006';
const SUBACCOUNT = '4e2eaf4b-4463-4be9-9926-7cf17e8adaba';

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

// Step 1: List subaccounts with global account
console.log('Step 1: Getting subaccounts...');
const subs = await callTool('Subaccount-list', { globalAccountGuid: GLOBAL_ACCOUNT });
console.log(JSON.stringify(subs?.result?.content?.[0]?.text || subs, null, 2).substring(0,500));

// Step 2: Check subscriptions
console.log('\nStep 2: Checking subscriptions...');
const subscriptions = await callTool('Subscription-list', { globalAccountGuid: GLOBAL_ACCOUNT, subaccountGuid: SUBACCOUNT });
console.log(JSON.stringify(subscriptions?.result?.content?.[0]?.text || subscriptions, null, 2).substring(0,500));

// Step 3: Check entitlements for Integration Suite
console.log('\nStep 3: Checking entitlements...');
const entitlements = await callTool('SubaccountEntitlement-list', { globalAccountGuid: GLOBAL_ACCOUNT, subaccountGuid: SUBACCOUNT });
console.log(JSON.stringify(entitlements?.result?.content?.[0]?.text || entitlements, null, 2).substring(0,500));

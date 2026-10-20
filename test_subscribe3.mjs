import fs from 'fs';

const stored = JSON.parse(fs.readFileSync('./btp_tokens.json','utf8'));
const token = stored.auth.access_token;
const MCP_URL = 'https://sso.mcp.btp.cloud.sap/mcp';
const GLOBAL_ACCOUNT = '8cede957trial-ga';
const SUBACCOUNT_ID = '4e2eaf4b-4463-4be9-9926-7cf17e8adaba';

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

// Step 1: Check current subscriptions
console.log('Step 1: Checking current subscriptions...');
const subs = await callTool('Subscription-list', { global_account: GLOBAL_ACCOUNT, subaccount_id: SUBACCOUNT_ID });
console.log(JSON.stringify(subs?.result?.content?.[0]?.text || subs, null, 2).substring(0, 500));

// Step 2: Check entitlements
console.log('\nStep 2: Checking entitlements...');
const ent = await callTool('SubaccountServiceQuota-list', { global_account: GLOBAL_ACCOUNT, subaccount_id: SUBACCOUNT_ID });
console.log(JSON.stringify(ent?.result?.content?.[0]?.text || ent, null, 2).substring(0, 500));

// Step 3: Subscribe Integration Suite
console.log('\nStep 3: Subscribing to Integration Suite...');
const sub = await callTool('Subaccount-subscribe', { global_account: GLOBAL_ACCOUNT, subaccount_id: SUBACCOUNT_ID, app_name: 'integrationsuite', plan_name: 'trial' });
console.log(JSON.stringify(sub?.result?.content?.[0]?.text || sub, null, 2).substring(0, 500));

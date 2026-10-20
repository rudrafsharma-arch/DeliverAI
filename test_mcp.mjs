import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { discoverOAuthProtectedResourceMetadata, startAuthorization, exchangeAuthorization } from '@modelcontextprotocol/sdk/client/auth.js';
import http from 'http';
import { exec } from 'child_process';
import fs from 'fs';
import crypto from 'crypto';

const MCP_URL = 'https://sso.mcp.btp.cloud.sap/mcp';
const CLIENT_ID = 'e789ba01-5612-47ee-bfe7-79e26411c1ca';
const REDIRECT_PORT = 3006;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;
const TOKEN_FILE = './btp_tokens.json';

let stored = fs.existsSync(TOKEN_FILE) ? JSON.parse(fs.readFileSync(TOKEN_FILE,'utf8')) : {};
const save = () => fs.writeFileSync(TOKEN_FILE, JSON.stringify(stored,null,2));

// Discover protected resource metadata
console.log('Discovering resource metadata...');
const resourceMeta = await discoverOAuthProtectedResourceMetadata(MCP_URL);
console.log('Auth servers:', resourceMeta?.authorization_servers);

const authServerUrl = resourceMeta?.authorization_servers?.[0] || 'https://accounts.sap.com';
console.log('Using auth server:', authServerUrl);

// Build auth URL manually with all required params
const verifier = crypto.randomBytes(32).toString('base64url');
const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
const state = crypto.randomBytes(16).toString('hex');

stored.verifier = verifier;
stored.state = state;
save();

const authUrl = new URL(`${authServerUrl}/oauth2/authorize`);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('scope', 'openid');
authUrl.searchParams.set('state', state);
authUrl.searchParams.set('code_challenge', challenge);
authUrl.searchParams.set('code_challenge_method', 'S256');

console.log('\nOpening browser:', authUrl.toString().substring(0,100)+'...');
exec(`start "" "${authUrl.toString()}"`);

// Wait for callback
const callbackParams = await new Promise((resolve) => {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
    if (url.pathname === '/callback') {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end('<html><body style="font-family:Arial;text-align:center;padding:40px"><h2 style="color:#0070F2">✅ DeliverAI connected to SAP BTP!</h2><p>You can close this tab.</p></body></html>');
      server.close();
      resolve(url.searchParams);
    }
  });
  server.listen(REDIRECT_PORT, () => console.log(`Waiting for callback on port ${REDIRECT_PORT}...`));
});

const code = callbackParams.get('code');
console.log('Got auth code:', code ? 'yes ✅' : 'no ❌');

// Exchange code for token
const tokenUrl = `${authServerUrl}/oauth2/token`;
const params = new URLSearchParams({
  grant_type: 'authorization_code',
  code,
  redirect_uri: REDIRECT_URI,
  client_id: CLIENT_ID,
  code_verifier: verifier
});

const tokenResp = await fetch(tokenUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: params
});

const tokens = await tokenResp.json();
console.log('Got access token:', tokens.access_token ? 'yes ✅' : 'no ❌');
if (tokens.error) console.log('Error:', tokens.error, tokens.error_description);

stored.auth = tokens;
save();

if (tokens.access_token) {
  // Test the token against MCP
  const r = await fetch(MCP_URL, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + tokens.access_token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} })
  });
  const data = await r.json();
  console.log('\n✅ MCP Connected! Tools:', data.result?.tools?.map(t=>t.name).join(', ') || JSON.stringify(data).substring(0,200));

  // Save to connections.json
  const conns = fs.existsSync('./connections.json') ? JSON.parse(fs.readFileSync('./connections.json','utf8')) : {active:null,connections:[]};
  const conn = { id:'sap-btp-admin-mcp', name:'SAP BTP Admin MCP', systemType:'mcp', authType:'bearer', hostUrl: MCP_URL, bearerToken: tokens.access_token, refreshToken: tokens.refresh_token || '' };
  const idx = conns.connections.findIndex(c => c.id === 'sap-btp-admin-mcp');
  if (idx !== -1) conns.connections[idx] = conn; else conns.connections.push(conn);
  fs.writeFileSync('./connections.json', JSON.stringify(conns,null,2));
  console.log('✅ Token saved to connections.json!');
}

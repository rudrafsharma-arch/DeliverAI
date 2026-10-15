import React, { useState, useEffect } from 'react';
import { toast } from './Toast';

const BLUE = '#0070F2', GREEN = '#16a34a', RED = '#dc2626', AMBER = '#d97706';

const SYSTEM_TYPES = [
  { id: 'btp', label: 'SAP BTP Integration Suite' },
  { id: 's4hana', label: 'SAP S/4HANA' },
  { id: 'aicore', label: 'SAP AI Core' },
  { id: 'hana', label: 'SAP HANA Cloud' },
  { id: 'btp-cockpit', label: 'SAP BTP Cockpit' },
  { id: 'servicenow', label: 'ServiceNow' },
  { id: 'salesforce', label: 'Salesforce' },
  { id: 'rest', label: 'Generic REST API' },
  { id: 'mcp', label: 'Generic MCP Server' },
  { id: 'other', label: 'Other' },
];

const AUTH_TYPES = [
  { id: 'oauth2-client', label: 'OAuth2 Client Credentials' },
  { id: 'oauth2-password', label: 'OAuth2 Password Grant' },
  { id: 'oauth2-saml', label: 'OAuth2 SAML Bearer' },
  { id: 'basic', label: 'Basic Auth (Username + Password)' },
  { id: 'apikey-header', label: 'API Key (Header)' },
  { id: 'apikey-query', label: 'API Key (Query Parameter)' },
  { id: 'certificate', label: 'Certificate / mTLS' },
  { id: 'bearer', label: 'Bearer Token (Static)' },
  { id: 'none', label: 'No Auth' },
];

const AUTH_FIELDS = {
  'oauth2-client': [
    { key: 'tokenUrl', label: 'Token URL', placeholder: 'https://tenant.authentication.eu10.hana.ondemand.com/oauth/token' },
    { key: 'clientId', label: 'Client ID', placeholder: 'sb-...' },
    { key: 'clientSecret', label: 'Client Secret', placeholder: '...', secret: true },
    { key: 'scope', label: 'Scope (optional)', placeholder: 'leave blank for default' },
    { key: 'hostUrl', label: 'Host / API URL', placeholder: 'https://tenant.it-cpi010.cfapps.eu10.hana.ondemand.com' },
  ],
  'oauth2-password': [
    { key: 'tokenUrl', label: 'Token URL', placeholder: 'https://tenant.authentication.eu10.hana.ondemand.com/oauth/token' },
    { key: 'clientId', label: 'Client ID', placeholder: 'sb-...' },
    { key: 'clientSecret', label: 'Client Secret', placeholder: '...', secret: true },
    { key: 'username', label: 'Username', placeholder: 'user@company.com' },
    { key: 'password', label: 'Password', placeholder: '...', secret: true },
    { key: 'hostUrl', label: 'Host / API URL', placeholder: 'https://tenant.hana.ondemand.com' },
  ],
  'oauth2-saml': [
    { key: 'tokenUrl', label: 'Token URL', placeholder: 'https://tenant.authentication.eu10.hana.ondemand.com/oauth/token' },
    { key: 'clientId', label: 'Client ID', placeholder: 'sb-...' },
    { key: 'clientSecret', label: 'Client Secret', placeholder: '...', secret: true },
    { key: 'samlAssertion', label: 'SAML Assertion (Base64)', placeholder: '...', secret: true },
    { key: 'hostUrl', label: 'Host / API URL', placeholder: 'https://tenant.hana.ondemand.com' },
  ],
  'basic': [
    { key: 'hostUrl', label: 'Host / API URL', placeholder: 'https://your-system.com' },
    { key: 'username', label: 'Username', placeholder: 'admin' },
    { key: 'password', label: 'Password', placeholder: '...', secret: true },
  ],
  'apikey-header': [
    { key: 'hostUrl', label: 'Host / API URL', placeholder: 'https://api.example.com' },
    { key: 'apiKeyName', label: 'Header Name', placeholder: 'X-API-Key' },
    { key: 'apiKeyValue', label: 'API Key Value', placeholder: '...', secret: true },
  ],
  'apikey-query': [
    { key: 'hostUrl', label: 'Host / API URL', placeholder: 'https://api.example.com' },
    { key: 'apiKeyName', label: 'Query Param Name', placeholder: 'api_key' },
    { key: 'apiKeyValue', label: 'API Key Value', placeholder: '...', secret: true },
  ],
  'certificate': [
    { key: 'hostUrl', label: 'Host / API URL', placeholder: 'https://your-system.com' },
    { key: 'certificate', label: 'Certificate (PEM)', placeholder: '-----BEGIN CERTIFICATE-----', secret: true, multiline: true },
    { key: 'privateKey', label: 'Private Key (PEM)', placeholder: '-----BEGIN PRIVATE KEY-----', secret: true, multiline: true },
  ],
  'bearer': [
    { key: 'hostUrl', label: 'Host / API URL', placeholder: 'https://api.example.com' },
    { key: 'bearerToken', label: 'Bearer Token', placeholder: 'eyJ...', secret: true },
  ],
  'none': [
    { key: 'hostUrl', label: 'Host / API URL', placeholder: 'https://api.example.com' },
  ],
};

const EMPTY_CONN = { id: '', name: '', description: '', systemType: 'btp', authType: 'oauth2-client', tokenUrl: '', clientId: '', clientSecret: '', hostUrl: '', username: '', password: '', apiKeyName: '', apiKeyValue: '', scope: '', bearerToken: '', certificate: '', privateKey: '', samlAssertion: '' };

export default function ConnectionManager() {
  const [connections, setConnections] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [selected, setSelected] = useState(null); // connection being edited
  const [form, setForm] = useState(EMPTY_CONN);
  const [showSecrets, setShowSecrets] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => { loadConnections(); }, []);

  const loadConnections = async () => {
    try {
      const r = await fetch('/api/connections');
      const data = await r.json();
      setConnections(data.connections || []);
      setActiveId(data.active || null);
    } catch(e) { toast('Failed to load connections', 'error'); }
  };

  const selectConn = (conn) => {
    setSelected(conn.id);
    setForm({ ...EMPTY_CONN, ...conn });
    setTestResult(null);
    setIsNew(false);
  };

  const newConn = () => {
    const id = 'conn-' + Date.now();
    setForm({ ...EMPTY_CONN, id });
    setSelected(id);
    setTestResult(null);
    setIsNew(true);
  };

  const save = async () => {
    if (!form.name) { toast('Name is required', 'warning'); return; }
    setSaving(true);
    try {
      await fetch('/api/connections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      toast('Connection saved', 'success');
      await loadConnections();
      setIsNew(false);
    } catch(e) { toast('Save failed: ' + e.message, 'error'); }
    setSaving(false);
  };

  const setActive = async (id) => {
    try {
      await fetch('/api/connections/active', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      setActiveId(id);
      toast('Active connection updated', 'success');
    } catch(e) { toast('Failed to set active', 'error'); }
  };

  const deleteConn = async (id) => {
    if (!window.confirm('Delete this connection?')) return;
    try {
      await fetch('/api/connections/' + id, { method: 'DELETE' });
      setSelected(null);
      setForm(EMPTY_CONN);
      await loadConnections();
      toast('Connection deleted', 'success');
    } catch(e) { toast('Delete failed', 'error'); }
  };

  const testConn = async () => {
    setTesting(true); setTestResult(null);
    try {
      const r = await fetch('/api/connections/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ form }) });
      const d = await r.json();
      setTestResult(d);
      toast(d.success ? 'Connection successful' : 'Connection failed', d.success ? 'success' : 'error');
    } catch(e) { setTestResult({ success: false, message: e.message }); }
    setTesting(false);
  };

  const fields = AUTH_FIELDS[form.authType] || AUTH_FIELDS['none'];
  const inp = { width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>System Connections</div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Saved to connections.json on your laptop. Never committed to GitHub.</div>

      <div style={{ display: 'flex', gap: 12, height: 520 }}>

        {/* Left panel - connection list */}
        <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {connections.map(c => (
            <div key={c.id} onClick={() => selectConn(c)} style={{ padding: '10px 12px', borderRadius: 8, border: '2px solid ' + (selected === c.id ? BLUE : '#e2e8f0'), background: selected === c.id ? '#eff6ff' : '#fff', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {activeId === c.id && <span style={{ fontSize: 8, background: GREEN, color: '#fff', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>ACTIVE</span>}
                <span style={{ fontWeight: 600, fontSize: 12, color: '#0f172a' }}>{c.name}</span>
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{SYSTEM_TYPES.find(s => s.id === c.systemType)?.label || c.systemType}</div>
            </div>
          ))}
          <button onClick={newConn} style={{ padding: '8px 12px', borderRadius: 8, border: '2px dashed #cbd5e1', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ New Connection</button>
        </div>

        {/* Right panel - connection form */}
        {selected ? (
          <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'auto' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{isNew ? 'New Connection' : form.name}</span>
              {activeId === selected && <span style={{ fontSize: 10, background: GREEN, color: '#fff', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>ACTIVE</span>}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                {!isNew && activeId !== selected && (
                  <button onClick={() => setActive(selected)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid ' + GREEN, background: '#f0fdf4', color: GREEN, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>Set Active</button>
                )}
                <button onClick={() => setShowSecrets(s => !s)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', fontSize: 11, cursor: 'pointer' }}>{showSecrets ? 'Hide' : 'Show'} Secrets</button>
                {!isNew && <button onClick={() => deleteConn(selected)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid ' + RED, background: '#fef2f2', color: RED, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>Delete</button>}
              </div>
            </div>

            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Name + Description */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Connection Name *</div>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. BTP Trial, Mars Sandbox" style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Description</div>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" style={inp} />
                </div>
              </div>

              {/* System Type + Auth Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>System Type</div>
                  <select value={form.systemType} onChange={e => setForm(f => ({ ...f, systemType: e.target.value }))} style={{ ...inp }}>
                    {SYSTEM_TYPES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Auth Type</div>
                  <select value={form.authType} onChange={e => setForm(f => ({ ...f, authType: e.target.value }))} style={{ ...inp }}>
                    {AUTH_TYPES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Dynamic auth fields */}
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {AUTH_TYPES.find(a => a.id === form.authType)?.label}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {fields.map(f => (
                    <div key={f.key} style={{ gridColumn: f.multiline ? '1 / -1' : 'auto' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>{f.label}</div>
                      {f.multiline ? (
                        <textarea value={form[f.key] || ''} onChange={e => setForm(frm => ({ ...frm, [f.key]: e.target.value }))} placeholder={f.placeholder} rows={4} style={{ ...inp, resize: 'vertical', fontFamily: 'monospace', fontSize: 11 }} />
                      ) : (
                        <input type={f.secret && !showSecrets ? 'password' : 'text'} value={form[f.key] || ''} onChange={e => setForm(frm => ({ ...frm, [f.key]: e.target.value }))} placeholder={f.placeholder} style={inp} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Test result */}
              {testResult && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: testResult.success ? '#f0fdf4' : '#fef2f2', border: '1px solid ' + (testResult.success ? '#86efac' : '#fecaca'), fontSize: 12, color: testResult.success ? GREEN : RED }}>
                  {testResult.success ? '✓ Connected' : '✗ Failed'}: {testResult.message}
                  {testResult.details && <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>{testResult.details}</div>}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={testConn} disabled={testing} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid ' + BLUE, background: '#eff6ff', color: BLUE, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{testing ? 'Testing...' : 'Test Connection'}</button>
                <button onClick={save} disabled={saving} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: BLUE, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save'}</button>
              </div>

            </div>
          </div>
        ) : (
          <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: '#94a3b8' }}>
            <div style={{ fontSize: 32 }}>🔌</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Select a connection or create a new one</div>
            <div style={{ fontSize: 11 }}>All credentials stored locally, never pushed to GitHub</div>
          </div>
        )}
      </div>

      {/* Active Connection Banner */}
      {activeId && (
        <div style={{ marginTop: 12, padding: '8px 14px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #86efac', fontSize: 12, color: GREEN, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700 }}>Active:</span>
          <span>{connections.find(c => c.id === activeId)?.name || activeId}</span>
          <span style={{ color: '#94a3b8', marginLeft: 4 }}>— All agents and platforms will use this connection</span>
        </div>
      )}
    </div>
  );
}

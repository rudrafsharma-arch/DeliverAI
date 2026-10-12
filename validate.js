const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO = path.join(__dirname);
const errors = [];
const warnings = [];

console.log('\n🔍 DeliverAI Validator Starting...\n');

['server.js','orchestrator.js','doc-saver.js','analyse-route.js'].forEach(f => {
  try { execSync('node -c "' + path.join(REPO,'mcp-server',f) + '"', {stdio:'pipe'}); console.log('✅ Backend:', f); }
  catch(e) { errors.push('❌ Backend: ' + f + ' - ' + e.stderr.toString().split('\n')[0]); }
});

const babel = require(path.join(REPO,'frontend','node_modules','@babel','parser'));
['App','Settings','Orchestrator','Documents','Activity','AIAssistant'].forEach(f => {
  try {
    babel.parse(fs.readFileSync(path.join(REPO,'frontend','src',f+'.js'),'utf8'),{sourceType:'module',plugins:['jsx']});
    console.log('✅ Frontend:', f+'.js');
  } catch(e) { errors.push('❌ JSX: ' + f + '.js line ' + (e.loc?e.loc.line:'?') + ' - ' + e.message); }
});

const CSS_KEYWORDS = ['flex','block','none','fixed','absolute','relative','center','column','row','auto','hidden','scroll','pointer','wrap','nowrap'];
['App','Settings','Orchestrator','Documents','Activity','AIAssistant'].forEach(f => {
  const code = fs.readFileSync(path.join(REPO,'frontend','src',f+'.js'),'utf8');
  code.split('\n').forEach((line, i) => {
    CSS_KEYWORDS.forEach(kw => {
      const pattern = new RegExp(':' + kw + '[,}\\s]');
      if (pattern.test(line) && !line.includes("'" + kw + "'") && !line.includes('"' + kw + '"') && line.includes('style=')) {
        warnings.push('⚠️  Unquoted CSS "' + kw + '" in ' + f + '.js line ' + (i+1));
      }
    });
  });
});

['blueprint','functional-spec','technical-spec','config-doc','test-scripts','iflow-builder'].forEach(a => {
  const p = path.join(REPO,'agents',a,'prompt.md');
  if (fs.existsSync(p)) {
    const c = fs.readFileSync(p,'utf8');
    if (!c.includes('CONTENT DEPTH')) warnings.push('⚠️  Missing depth: agents/'+a+'/prompt.md');
    else console.log('✅ Prompt:', a);
  }
});

const srv = fs.readFileSync(path.join(REPO,'mcp-server','server.js'),'utf8');
[['/download/:projectId/*','Download wildcard'],['/documents/:projectId/status','Approval status'],['/agents/:id/prompt','Prompt editor'],['/cleanup','Cleanup route']].forEach(([pat,name]) => {
  if (srv.includes(pat)) console.log('✅ Endpoint:', name);
  else errors.push('❌ Missing endpoint: ' + name);
});

console.log('\n' + '='.repeat(50));
if (warnings.length) { console.log('\n⚠️  WARNINGS:'); warnings.forEach(w => console.log(' ', w)); }
if (errors.length) {
  console.log('\n❌ ERRORS:'); errors.forEach(e => console.log(' ', e));
  console.log('\n🚫 VALIDATION FAILED\n'); process.exit(1);
} else {
  console.log('\n✅ ALL CHECKS PASSED - Safe to push!\n');
}

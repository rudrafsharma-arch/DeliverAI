const fs=require('fs');
const path=require('path');
const PROJECTS_DIR=path.join(__dirname,'..','projects');

function extractHTML(output){
  const m1=output.match(/<!DOCTYPE[\s\S]*<\/html>/i);
  if(m1)return m1[0];
  const m2=output.match(/<html[\s\S]*<\/html>/i);
  if(m2)return m2[0];
  return null;
}

function saveDocumentToProject(projectId,agentId,agentName,output){
  if(!projectId)return null;
  const html=extractHTML(output);
  if(!html||html.length<200)return null;
  const projectDir=path.join(PROJECTS_DIR,projectId);
  if(!fs.existsSync(projectDir))fs.mkdirSync(projectDir,{recursive:true});
  const fileName=agentId+'_orchestrated_v1.0_'+Date.now()+'.html';
  fs.writeFileSync(path.join(projectDir,fileName),html,'utf8');
  const projFile=path.join(projectDir,'project.json');
  if(fs.existsSync(projFile)){
    const project=JSON.parse(fs.readFileSync(projFile,'utf8'));
    project.documents=project.documents||[];
    project.documents.push({agentId,agentName,fileName,version:'1.0',generatedAt:new Date().toISOString()});
    project.updatedAt=new Date().toISOString();
    fs.writeFileSync(projFile,JSON.stringify(project,null,2),'utf8');
  }
  console.log('[Orchestrator] Saved:',fileName);
  return fileName;
}

module.exports={extractHTML,saveDocumentToProject};

# DeliverAI — Complete Backlog
Last Updated: 2026-10-15 (verified against actual code on disk)
Prepared by: Vikram Sharma, Accenture

---

## ✅ BUILT & WORKING (verified against actual files on disk)

### Platform & Infrastructure
1. MCP server with SSE streaming (mcp-server/server.js)
2. Backend proxy server — config, proxy, sync routes (backend/server.js)
3. React frontend — all tabs wired in App.js
4. start.bat one-click launcher
5. Dual repo — public app (DeliverAI), private data (DeliverAI-data)
6. Responsible AI framework — DRAFT only, no pre-approvals
7. validate.js — pre-push syntax and CSS validation
8. .env template and auto-detect paths in Settings

### Frontend Components (frontend/src/)
9. App.js — main shell, routing, state
10. Activity.js — job history, grouped by agent, versioned
11. Documents.js — folder tree, status badges, search, bulk approve, 10s auto-refresh
12. Review.js — approval queue, reviewer panel, comments
13. Settings.js — env config, agent prompt editor, kill stale processes
14. Orchestrator.js — Architect modal (form → analysing → approval → running → done)
15. AIAssistant.js — floating, draggable, intent detection, file upload
16. DocumentViewer.js — open any doc, full screen, AI refinement (whole doc)
17. DocCompare.js — side-by-side and unified comparison (single project, flat list)
18. ApprovalWorkflow.js — DRAFT > IN_REVIEW > APPROVED > CHANGES_REQUESTED
19. JobManager.js — background job queue, localStorage persistent
20. Toast.js — notification system

### MCP Server Modules
21. orchestrator.js — Orchestrator class: runSubagent, runParallel, runSequential, parseArchitectOutput, saveRuntimeAgent, getContext, killAll
22. analyse-route.js — /analyse POST: pre-analyses requirement, returns recommended agents before orchestration
23. doc-saver.js — saves docs to correct workstream/process folder, handles Other workstream, auto-versions

### Key Features
24. Background generation — non-blocking
25. Regeneration queue — one Claude CLI at a time
26. Agent chaining — context from previous docs pre-filled
27. Context section in agent form — upload docs, paste text, select project docs
28. AI Refinement — whole-document refinement with prompts, quick suggestions, undo
29. Approval workflow — DRAFT > IN_REVIEW > APPROVED > LOCKED, persisted to localStorage
30. Inline document editor — Edit/Save/Cancel in browser
31. Save & Sync — push projects to private GitHub repo
32. Restore — pull from private GitHub repo
33. Agent prompt editor in Settings
34. Kill stale processes button
35. Reload Agents button with spinner
36. Document search in Documents tab
37. Bulk Approve Folder in Documents tab
38. 10-second auto-refresh in Documents tab
39. S/4HANA Public/Private/On-Premise differentiation across all agents
40. ABAP Cloud model support for Public Cloud (BTP Steampunk)
41. SETUP.md for team onboarding
42. BTP live iFlow injection — OAuth + MCP call into iFlow Builder and validator prompts at runtime
43. Prepare phase tab in Orchestrator
44. Validation Scope section in Orchestrator — packages/iFlows + naming convention file upload
45. Document Comparison (DocCompare) — side-by-side and unified view
46. Toast notifications throughout
47. AI Assistant minimize/maximize button

### Knowledge Base (knowledge/sap/)
48. activate-methodology.md
49. btp-integration-best-practices.md
50. s4hana-deployment-types.md
51. s4hana-public-cloud.md
52. s4hana-private-cloud.md
53. responsible-ai.md
54. fi-knowledge.md
55. mm-knowledge.md
56. sd-knowledge.md
57. hr-knowledge.md
58. BTP Interface Catalogue 175+ iFlows (in iflow-builder knowledge)

### Agents (49 confirmed in agents/ folder)
**Orchestrator (1):** architect
**Core (10):** blueprint, functional-spec, technical-spec, test-scripts, config-doc, iflow-builder, ricefw-builder, abap-generator, cap-service-builder, incident-analyser
**Extended (35):** btp-sbpa-workflow-agent, business-case-generator, rfp-response-agent, proposal-writer, estimation-agent, landscape-assessment-agent, project-charter-agent, project-plan-agent, risk-register-agent, naming-convention-agent, workshop-output-agent, bpml-agent, solution-design-agent, gap-analysis-agent, interface-inventory-agent, data-migration-agent, decision-log-agent, integration-test-agent, uat-script-agent, unit-test-evidence-agent, sprint-review-agent, cutover-plan-agent, go-live-readiness-agent, training-material-agent, transport-runbook-agent, mock-cutover-agent, ams-governance-agent, knowledge-transfer-agent, service-review-agent, change-request-agent, root-cause-analysis-agent, ci-improvement-agent, sap-roadmap-agent, ai-usecases-agent, discovery-center-agent
**Validators (3):** interface-design-validator, naming-convention-validator, architecture-validator

---

## ❌ BUGS

| # | Bug | Priority | Status |
|---|-----|----------|--------|
| Bug-1 | Delete folder removes from disk only, not project.json | High | ✅ Fixed — fs.unlinkSync in server.js:765 |
| Bug-2 | Review tab shows v1 after regenerate instead of v2 | High | ✅ Fixed — Review.js fetches fresh on every load |
| Bug-3 | Approve matches by fileName not filePath | High | ✅ Fixed — server.js:662 checks filePath first |
| Bug-4 | Documents tab no auto-refresh after regeneration | Medium | ✅ Fixed — 10s poll in Documents.js |
| Bug-5 | Architect regenerate does not produce HTML consistently | Medium | ✅ Fixed — server.js:696-721 explicit HTML-only instruction + validation |
| Bug-6 | Old Other folder appears when regenerating docs | Medium | ✅ Fixed — doc-saver.js:29 handles customWorkstream |
| Bug-7 | Floating assistant — minimize/maximize button missing | Medium | ✅ Fixed — App.js assistantMinimized state + button |
| Bug-8 | start.bat opens PowerShell instead of Git Bash windows | Low | Open |
| Bug-9 | Section-level refinement (30 secs vs 1-3 mins) | Medium | Open — C6 in features backlog |

---

## ❌ FEATURES TO BUILD

### Core Features
| # | Feature | Priority |
|---|---------|----------|
| C2 | Access control & admin panel — license keys, revoke access | High |
| C4 | Windows installer (.exe) — auto-installs Node, Git, Claude CLI | Medium |
| C5 | UI improvements — Accenture branding | Medium |
| C6 | Section-level refinement — refine one section in ~30 secs | Medium |
| C7 | Change tracking — diff between document versions | Medium |
| C8 | Document Templates — upload Word/HTML template, Claude fills it | Medium |
| C9 | Make GitHub repo private — before wider sharing | Medium |
| C11 | Multi-tenant support | Low |
| C12 | Cloud deployment — BTP or Azure | Low |
| C13 | Expand knowledge base — more depth on FI/MM/SD/HR, Data Migration, Fiori, Security, Oracle, Workday, Salesforce | High |
| C14 | Teams meeting transcript as agent input | Medium |
| C16 | Test agent chaining end-to-end | Medium |
| C17 | Assistant file generation — Word, PDF, Excel from chat | Medium |
| C18 | Full Claude.ai parity for assistant | Medium |
| C19 | Cross-laptop sync on login/logout | Medium |
| C22 | Project archiving / lock completed projects | Medium |
| C23 | Knowledge base viewer in Settings | Low |
| C24 | ✅ DocCompare — hierarchical selector + WYSIWYG edit + 3-button save modal | DONE |
| C25 | Stop individual agent without stopping orchestration | Medium |
| C26 | Orchestration history | Low |

### BTP MCP Integration
| # | Feature | Status |
|---|---------|--------|
| B1 | BTP_iFlow_Reader MCP server deployed on effem-glb-is-sbx01, US10, package VikramPOCs | ✅ Deployed |
| B2 | OAuth token (client credentials) confirmed working | ✅ Working |
| B3 | MCP tools/list and tools/call confirmed 200 OK | ✅ Working |
| B4 | Platform team to grant /api/v1/ access so MCP server returns real iFlows | ⏳ Pending |
| B5 | BTP Connection section in Settings — test connection, show live iFlows | Not built |
| B6 | Deploy iFlows directly to BTP via MCP (Zero-Touch Integration) | Not built |
| B7 | Auto-sync BTP catalogue from live client tenant | Not built |

### RAG & Knowledge
| # | Feature | Priority |
|---|---------|----------|
| R1 | Vector RAG with HANA Cloud Vector Engine | High |
| R2 | Live S/4HANA system integration | High |
| R3 | Vector embeddings for knowledge base | High |
| R4 | Semantic search over BTP iFlow catalogue | High |
| R5 | Knowledge base chunking and indexing pipeline | High |
| R6 | RAG retrieval integrated into all agent prompts | High |
| R7 | Knowledge Capture from completed projects | Medium |

### SAP AI Stack Integration
| # | Feature | Priority |
|---|---------|----------|
| S1 | SAP Generative AI Hub — multi-model via AI Core | High |
| S2 | Joule Studio agent — generate custom Joule skills | High |
| S3 | SAP AI Services — Document Information Extraction | Medium |
| S4 | SAP Build Apps generation agent | Medium |
| S5 | Joule integration — DeliverAI actions from within Joule | High |

### Multi-Provider AI Engine
| # | Feature | Priority |
|---|---------|----------|
| M1 | Multi-provider AI engine — Claude CLI + SAP Gen AI Hub + Claude OAuth | High |
| M2 | Model selection per agent type | Medium |
| M3 | AI engine switcher in Settings | Medium |

### Premium Features (P1-P20)
P1 Delivery DNA, P2 Auto-Correction Learning, P3 Cross-Project Patterns, P4 Risk Predictor,
P5 Zero-Touch iFlow Deploy, P6 Incident Auto-Resolution, P7 Smart Transport Manager,
P8 Continuous Compliance, P9 Live Co-Authoring, P10 Client Portal,
P11 Teams/Slack Integration, P12 Knowledge Marketplace, P13 Visual Process Designer,
P14 Screenshot to Config Doc, P15 Voice to Document, P16 Project Health Score,
P17 Estimation Engine, P18 SAP Release Analyser, P19 Overnight Build Mode,
P20 Fast AI Assistant (direct API)

### UX Improvements
U1 Dark mode, U2 Mobile responsive, U3 Keyboard shortcuts,
U4 Loading skeletons, U5 Document preview on hover, U6 Document version timeline

---

## SUMMARY

| Category | Count | Status |
|----------|-------|--------|
| Platform & infra | 8 | ✅ All built |
| Frontend components | 12 | ✅ All built |
| MCP server modules | 3 | ✅ All built |
| Key features | 24 | ✅ All built |
| Knowledge files | 11 | ✅ All built |
| Agents | 49 | ✅ All built |
| Bugs | 9 | 7 fixed, 2 open |
| Core features | 19 | All pending |
| BTP MCP | 7 | 3 done, 4 pending |
| RAG & Knowledge | 7 | All pending |
| SAP AI Stack | 5 | All pending |
| Multi-Provider AI | 3 | All pending |
| Premium features | 20 | All pending |
| UX improvements | 6 | All pending |

---

## ARCHITECTURE QUICK REFERENCE
- Ports: Frontend 3000 | Backend 3005 | MCP Server 3002
- Local path: C:\Users\vikram.f.sharma\DeliverAI-repo\
- Repos: rudrafsharma-arch/DeliverAI (public) | DeliverAI-data (private)
- Claude CLI: Accenture subscription, no API key needed
- File writes: Git Bash heredocs only — PowerShell corrupts JSX quotes
- Validate before push: babel parser on all JSX files
- Never kill Claude CLI without clear evidence it is blocking
- BTP MCP URL: https://effem-glb-is-sbx01-1b93e9be0bb349988640635ab8fd763f.a.integration.cloud.sap/mcp-server/iflow
- BTP Token URL: https://effem-glb-is-sbx01.authentication.us10.hana.ondemand.com/oauth/token
- CPI Trial POC only: fab78ad9trial AP21, scripts at C:\Users\vikram.f.sharma\cpi_iflows\

---

## AUTONOMOUS INCIDENT RESOLUTION (P6 — Enhanced)

### Vision
When a BTP iFlow fails or an S/4HANA issue occurs, DeliverAI automatically:
1. Receives the event via webhook
2. Fetches logs and error details from BTP MCP
3. Reads source data from S/4HANA OData
4. Spawns Architect + specialist subagents to correlate findings
5. Generates RCA report + proposed fix
6. (With approval) Deploys fix to BTP or raises Change Request in S/4HANA

### Architecture
```
BTP Integration Suite
  iFlow fails → webhook → DeliverAI /api/incident-event
  BTP MCP exposes: logs, error details, iFlow design

DeliverAI Incident Engine
  Architect spawns: Incident Analyser + RCA Agent + Interface Validator
  Correlates: BTP logs + S/4HANA source data
  Outputs: RCA report + proposed fix + optional auto-deploy

S/4HANA System
  Source data read via OData
  Fix applied via API or Change Request raised
```

### Backlog Items

| # | Feature | Priority | Prerequisite |
|---|---------|----------|-------------|
| A1 | Webhook endpoint in MCP server — receives BTP incident events | High | None |
| A2 | BTP Message Processing Logs reader — fetch error details via /api/v1/MessageProcessingLogs | High | B4 (platform team /api/v1/ access) |
| A3 | S/4HANA OData connector — read source master/transactional data for correlation | High | S/4HANA credentials |
| A4 | Auto-trigger Architect on incident event — spawns Incident Analyser + RCA + Interface Validator subagents | High | A1, A2 |
| A5 | Cross-system correlation engine — correlates BTP logs + S/4HANA data to pinpoint root cause | High | A2, A3 |
| A6 | Auto-fix generator — generates corrected iFlow or S/4HANA change request | High | A4, A5 |
| A7 | Approval gate before auto-deploy — Responsible AI, human must approve fix before deployment | High | A6 |
| A8 | Auto-deploy fixed iFlow to BTP via MCP (Zero-Touch) | High | A7, B6 |
| A9 | Auto-raise Change Request in S/4HANA if fix is on source side | Medium | A7 |
| A10 | Incident history dashboard — all past incidents, RCAs, fixes applied | Medium | A4 |
| A11 | Proactive monitoring — poll BTP every N mins, alert before failures escalate | Medium | A2 |
| A12 | Learning engine — learns from past incidents to predict future failures | Low | A10 |

### What Is Already Built
- Incident Analyser agent
- Root Cause Analysis agent  
- Architect orchestrator with subagent spawning
- BTP MCP server (OAuth working, tools/call working)
- Interface Design Validator agent
- iFlow Builder agent (can generate fixed iFlow)

### Immediate Blockers
- B4: Platform team /api/v1/ access (needed for A2)
- S/4HANA OData credentials (needed for A3)

### Once B4 is resolved, A1 + A4 can be built immediately with no new dependencies.

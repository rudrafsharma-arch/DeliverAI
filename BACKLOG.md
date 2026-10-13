# DeliverAI — Complete Backlog
Last Updated: 2026-10-13
Prepared by: Vikram Sharma, Accenture

---

## ✅ BUILT & WORKING

### From original PDF (31 items) — all confirmed built:
1. 12 SAP agents (Blueprint, FS, TS, Test Scripts, Config Doc, iFlow, ABAP, RICEFW, CAP, Incident Analyser, Architect, BTP-SBPA)
2. MCP server with SSE streaming — no timeouts
3. Backend with config manager, proxy, sync routes
4. React frontend — Agents, Activity, Documents, Review, Settings tabs
5. start.bat one-click launcher
6. SAP Knowledge Base — Activate, BTP, ABAP, RAP, AI Stack, S4HANA, BTP Interface Catalogue (175+ iFlows)
7. Responsible AI framework — DRAFT only, no pre-approvals
8. Settings page — auto-detect paths, validate, save to .env
9. Background generation — agents run without blocking navigation
10. Activity Dashboard — compact grouped view, versions numbered
11. Document Viewer — open any doc in app with iframe preview
12. AI Refinement — improve docs with prompts, quick suggestions, undo
13. Background refinement — refinement runs in background
14. Document Approval Workflow — DRAFT > IN REVIEW > APPROVED > LOCKED
15. Save & Sync — push projects to private GitHub repo
16. Restore — pull from private GitHub repo on any laptop
17. Dual repo architecture — public app code, private data repo
18. JobManager with localStorage persistence — survives refresh
19. Context section in agent form — upload docs, paste transcript
20. Agentic Assistant — detects intent, starts agents from chat
21. File upload in assistant — use docs as context
22. Floating assistant panel — opens over app, draggable
23. S/4HANA Public/Private/On-Premise support in agents
24. SETUP.md for team onboarding
25. Private data repo (DeliverAI-data) — auto-created
26. Agent chaining — context from previous docs pre-filled in form
27. isConfigured fix — claude always shows green OK
28. OUTPUT_DIR absolute path — projects load correctly
29. Approval state persisted to localStorage
30. Projects loaded into Activity on startup
31. ABAP Public Cloud support — ABAP Cloud model via BTP Steampunk

### Added AFTER the PDF (new features built this session):
32. Documents tab — full folder tree (Workstream/Process/File hierarchy)
33. Review tab — dedicated review queue separate from Documents
34. Inline document editor — Edit/Save/Cancel in browser
35. Agent prompt editor in Settings — edit any agent prompt from UI
36. Architect orchestration — full screen modal, multi-agent coordination
37. Regeneration queue — one Claude at a time, queued properly
38. Auto IN_REVIEW after regeneration — v2 goes straight to Review tab
39. Delete folder (per process folder, not workstream)
40. Full screen button on all document viewers
41. Kill stale processes button in Settings
42. Refresh button in Documents tab
43. Document status badges — DRAFT/IN REVIEW/APPROVED/CHANGES REQ.
44. Regenerate button on CHANGES_REQUESTED docs
45. Reviewer comments saved and shown in Review tab
46. TOC mandatory in all agent prompts
47. Depth instructions — 50KB+ documents, 20-year consultant quality
48. Rerun-agent endpoint with proper path extraction
49. Rerun-status polling — frontend polls for completion notification
50. Doc-saver — saves to correct workstream/process folder
51. BTP Interface Catalogue knowledge (175+ iFlows, Snck-Hnw client)
52. Offline first - agents always read local directory, no API calls during work (PDF B8)
53. Validate.js — pre-push syntax and CSS validation script

---

## ❌ BUGS (Known Issues)

| # | Bug | Priority |
|---|-----|----------|
| Bug-1 | Delete folder removes from project.json only, not disk | High |
| Bug-2 | Review tab shows v1 after regenerate instead of v2 | High |
| Bug-3 | Approve matches by fileName not filePath — wrong doc approved | High |
| Bug-4 | Documents tab no auto-refresh after regeneration completes | Medium |
| Bug-5 | Architect regenerate does not produce HTML consistently | Medium |
| Bug-6 | Old Other folder appears when regenerating docs | Medium |
| Bug-7 | Floating assistant — minimize/maximize button (from PDF I1) | Medium |
| Bug-8 | start.bat opens PowerShell instead of Git Bash windows (from PDF I2) | Low |
| Bug-9 | Refinement takes same 1-3 mins as full generation (from PDF I3) | Medium |

---

## ❌ CORE FEATURES (Not Built)

| # | Feature | Priority | Source |
|---|---------|----------|--------|
| C1 | Toast notifications — replace all alert() popups | High | New |
| C2 | Access control & admin panel — license keys, revoke access | High | PDF #32 |
| C3 | More agents — 25+ remaining across Discover, Deploy, Run phases | High | PDF #33 |
| C4 | Windows installer (.exe) — auto-installs Node, Git, Claude CLI | Medium | PDF #34 |
| C5 | UI improvements — better design, Accenture branding | Medium | PDF #35 |
| C6 | Section-level refinement — refine one section in 30 secs | Medium | PDF #36, B9 |
| C7 | Change tracking — diff between document versions | Medium | PDF #38 |
| C8 | Document Templates — upload Word/HTML template, Claude fills it | Medium | PDF #39 |
| C9 | Make GitHub repo private — before wider sharing | Medium | PDF #43 |
| C11 | Multi-tenant support | Low | PDF #46 |
| C12 | Cloud deployment — BTP or Azure | Low | PDF #42 |
| C13 | Expand knowledge base — FI, MM, SD, HR, Data Migration, Fiori, Security, AMS, Oracle, Workday, Salesforce | High | PDF B1 |
| C14 | Teams meeting transcript as agent input | Medium | PDF B2 |
| C15 | Refinement conflict handling — warn if already running | Low | PDF B3 |
| C16 | Test agent chaining end-to-end | Medium | PDF B4 |
| C17 | Assistant file generation — Word, PDF, Excel from chat | Medium | PDF B5 |
| C18 | Full Claude.ai parity for assistant — upload, generate, analyse | Medium | PDF B6 |
| C19 | Cross-laptop sync on login/logout | Medium | PDF B7 |
| C20 | Document search within project | Medium | New |
| C21 | Bulk approve all docs in a folder | Medium | New |
| C22 | Project archiving / lock completed projects | Medium | New |
| C23 | Knowledge base viewer in Settings | Low | New |
| C24 | Custom agent selection before orchestration starts | Medium | New |
| C25 | Stop individual agent without stopping orchestration | Medium | New |
| C26 | Orchestration history | Low | New |

---

## ❌ RAG & KNOWLEDGE

| # | Feature | Priority | Source |
|---|---------|----------|--------|
| R1 | Context grounding Phase 3 — Vector RAG with HANA Cloud | High | PDF #40 |
| R2 | Context grounding Phase 4 — live S/4HANA system integration | High | PDF #41 |
| R3 | Vector embeddings for knowledge base | High | New |
| R4 | Semantic search over BTP iFlow catalogue | High | New |
| R5 | Knowledge base chunking and indexing pipeline | High | New |
| R6 | RAG retrieval integrated into all agent prompts | High | New |
| R7 | Knowledge Capture from completed projects | Medium | New |

---

## ❌ SAP AI STACK INTEGRATION

| # | Feature | Priority | Source |
|---|---------|----------|--------|
| S1 | SAP Generative AI Hub — multi-model via AI Core | High | Session 1 |
| S2 | Joule Studio agent — generate custom Joule skills | High | Session 1 |
| S3 | SAP AI Services — Document Information Extraction | Medium | Session 1 |
| S4 | SAP Build Apps generation agent | Medium | Session 1 |
| S5 | Joule integration — DeliverAI actions from within Joule | High | Session 1 |
| S6 | SAP Integration Suite MCP server connection | High | New |
| S7 | Deploy iFlows directly to BTP via MCP | High | New |
| S8 | Auto-sync BTP catalogue from live tenant | High | New |

---

## ❌ MULTI-PROVIDER AI ENGINE

| # | Feature | Priority | Source |
|---|---------|----------|--------|
| M1 | Multi-provider AI engine — Claude CLI + SAP Gen AI Hub + Claude OAuth | High | Session 1 |
| M2 | Model selection per agent type | Medium | Session 1 |
| M3 | AI engine switcher in Settings | Medium | New |

---

## ❌ PREMIUM FEATURES (P1-P20)

| # | Feature | Source |
|---|---------|--------|
| P1 | Delivery DNA — agents learn from past generations, get smarter | PDF P1 |
| P2 | Auto-Correction Learning — learns from edits and refinements | PDF P2 |
| P3 | Cross-Project Pattern Recognition | PDF P3 |
| P4 | Risk Predictor — flags delivery risks | PDF P4 |
| P5 | Zero-Touch Integration — auto-deploy iFlows to BTP CPI | PDF P5 |
| P6 | Incident Auto-Resolution — P1/P2 auto-resolved with AI | PDF P6 |
| P7 | Smart Transport Manager — DEV > QAS > PRD auto-managed | PDF P7 |
| P8 | Continuous Compliance Monitor | PDF P8 |
| P9 | Live Co-Authoring — multiple consultants same document | PDF P9 |
| P10 | Client Portal — clients review and approve online | PDF P10 |
| P11 | Teams/Slack Integration — notifications, trigger agents | PDF P11 |
| P12 | Knowledge Marketplace — share and sell agent prompts | PDF P12 |
| P13 | Visual Process Designer — drag-and-drop process flow | PDF P13 |
| P14 | Screenshot to Config Doc | PDF P14 |
| P15 | Voice to Document — speak requirements | PDF P15 |
| P16 | Project Health Score — AI scores delivery health | PDF P16 |
| P17 | Estimation Engine — AI estimates effort | PDF P17 |
| P18 | SAP Release Analyser — flags impacts on project | PDF P18 |
| P19 | Overnight Build Mode — schedule agents overnight | PDF P19 |
| P20 | Fast AI Assistant — instant responses via direct API | PDF P20 |

---

## ❌ UX IMPROVEMENTS

| # | Feature | Priority |
|---|---------|----------|
| U1 | Dark mode | Low |
| U2 | Mobile responsive layout | Low |
| U3 | Keyboard shortcuts | Low |
| U4 | Loading skeletons instead of blank states | Medium |
| U5 | Document preview on hover | Low |
| U6 | Document version timeline view | Medium |

---

## SUMMARY

| Category | PDF Count | Current Count | Status |
|----------|-----------|---------------|--------|
| Built & Working | 31 | 52 | +21 since PDF |
| Bugs | 4 | 9 | 5 new bugs found |
| Core To Build | 15 | 26 | 11 new items added |
| RAG & Knowledge | 2 | 7 | 5 new items added |
| SAP AI Stack | 0 | 8 | All new |
| Multi-Provider AI | 0 | 3 | All new |
| Premium Features | 20 | 20 | Same |
| UX Improvements | 0 | 6 | All new |
| TOTAL | 72 | 131 | ~40% complete |

---

## NOTES
- Teams Bot (B71-B79) — removed, Azure free trial eligibility issues
- No separate API keys — CLI only approach for now
- Each team member runs on own laptop with own Claude subscription
- Learning/knowledge material always goes to private DeliverAI-data repo
- Responsible AI — documents always DRAFT, never pre-approved by AI
- iFlow naming: {System}_{Client}_{BusinessUnit}-{Process}_{Type}

---

## AGENTS — FULL LIST (47 Total, 12 Built, 35 Remaining)

### Built (12)
1. Architect (orchestrator)
2. Business Blueprint
3. Functional Specification
4. Technical Specification
5. Configuration Document
6. Test Scripts
7. iFlow Builder
8. RICEFW Builder
9. ABAP Generator
10. CAP Service Builder
11. Incident Analyser
12. BTP-SBPA Workflow Agent

### Phase 1 — Discover (5 to build)
13. Business Case Generator
14. RFP Response Agent
15. Proposal Writer / SOW Generator
16. Estimation Agent (effort & resource plan)
17. Landscape Assessment Agent

### Phase 2 — Prepare (5 to build)
18. Project Charter Agent
19. Governance Model & RACI Agent
20. Project Plan Agent
21. Risk Register Agent
22. Naming Convention & Standards Agent

### Phase 3 — Explore (7 to build)
23. Workshop Output Agent (fit-to-standard notes)
24. BPML Agent (Business Process Master List)
25. Solution Design Agent
26. Gap Analysis Agent (delta design)
27. Interface Inventory Agent
28. Data Migration Strategy Agent
29. Decision Log Agent

### Phase 4 — Realize (6 to build)
30. Data Migration Object Spec Agent
31. Unit Test Evidence Agent
32. Integration Test Plan Agent
33. UAT Script Agent
34. Defect Report Agent
35. Sprint Review Notes Agent

### Phase 5 — Deploy (6 to build)
36. Cutover Plan & Runbook Agent
37. Go-Live Readiness Checklist Agent
38. Training Material Agent
39. Hypercare Plan Agent
40. Transport Runbook Agent
41. Mock Cutover Results Agent

### Phase 6 — Run (6 to build)
42. AMS Governance & SLA Agent
43. Knowledge Transfer Agent
44. Monthly Service Review Agent
45. Change Request Agent
46. Root Cause Analysis Agent
47. Continuous Improvement Agent

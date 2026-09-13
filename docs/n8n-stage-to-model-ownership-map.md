# n8n Stage-to-Model Ownership and Orchestration Map

Status: Conceptual architecture, MVP V1

Canonical contract: `docs/research-report-data-model.md`

This document defines which workflow stage creates, enriches, validates, aggregates, or consumes each part of `ResearchReport`. It does not define n8n nodes, prompts, code, credentials, providers, or deployment configuration.

## n8n Architecture Overview

n8n is the orchestration layer. It carries explicit structured records between external retrieval, AI interpretation, deterministic processing, aggregation, validation, and the Next.js response. It is neither the AI model nor the long-term database.

The operational flow is:

`ResearchRequest` → validate → `StartupProfile` → research plan → retrieve external material → register `Source` records → extract and register `EvidenceItem` records → run parallel analyses → reconcile cross-branch references → build competitive intelligence → create strategy and risk records → prepare canonical `ScoreInput` records → calculate scores → aggregate confidence → plan validation → synthesize findings and actions → assemble and validate `ResearchReport` → respond.

The suggested stage list requires three adjustments:

1. Source and evidence registration are explicit deterministic gates. Parallel branches must not independently assign final shared-library IDs.
2. Validation planning runs after scoring and confidence because it uses weak, capped, or unavailable dimensions to prioritize learning.
3. ExecutiveSummary runs after scoring and confidence but before FinalRecommendation. It summarizes findings, while FinalRecommendation waits for the validation plan and answers what to do next.

## End-to-End Orchestration Diagram

```text
[D] Webhook intake
        ↓
[D] Validate and normalize ResearchRequest
        ↓
[AI] Idea understanding → StartupProfile + candidate Assumptions
        ↓
[AI+D] Research planning → internal research plan and branch tasks
        ↓
[E] Search and fetch external material
        ↓
[D+AI] Source normalization, classification, and deduplication
        ↓
      Source registry gate A
        ↓
[AI] Shared evidence extraction → observed EvidenceItem candidates
        ↓
[D] Evidence validation, deduplication, lineage checks, and final IDs
        ↓
      Evidence registry gate A
        ↓
        ├──────────────┬──────────────┬──────────────┐
        ↓              ↓              ↓              ↓
 [AI] Problem    [AI] Customer   [AI+D] Market  [AI+D] Competitor
    branch          branch           branch          branch
        └──────────────┴──────────────┴──────────────┘
                               ↓
                   [D+AI] Cross-branch reconciliation
                               ↓
                   Shared registry gate B
                   Sources / Evidence / Assumptions /
                   Limitations / resolved references
                               ↓
                   [AI+D] Canonical feature mapping
                               ↓
                   [D] CompetitorMatrix calculations
                               ↓
                   [AI] CompetitiveGap hypotheses
                               ↓
                   [AI] BusinessModel analysis
                               ↓
                   [AI] MVPRecommendation
                               ↓
                   [AI] Risk analysis + scoreDimensionKey
                               ↓
                   [AI+D] ScoreInput preparation and validation
                               ↓
                   [D] Deterministic scoring → ScoreDimensions /
                       OpportunityScore numeric fields
                               ↓
                   [D then AI] Confidence labels, checks,
                       consistency status, and explanations
                               ↓
                 ┌─────────────┴─────────────┐
                 ↓                           ↓
        [AI] ExecutiveSummary       [AI] ValidationExperiment plan
                 └─────────────┬─────────────┘
                               ↓
                   [AI] FinalRecommendation
                               ↓
                   [D] ResearchReport assembly
                               ↓
                   [D] Contract and reference validation
                               ↓
                   [D] Respond to Next.js webhook caller

Legend: [AI] interpretation or synthesis; [D] deterministic;
        [E] external retrieval; combined labels indicate bounded assistance.
```

## Stage-to-Model Ownership Table

Models created before confidence aggregation are workflow candidates. Their analytical content and references can be complete, but any local `confidence` and `confidenceReason` values become authoritative only when stage 22 applies the shared confidence rules. This avoids each AI branch inventing its own confidence standard.

| Stage | Receives | Creates or updates | Reads | Dominant responsibility | Can create Evidence? | Can create Assumptions? | Can create Limitations? | Failure behavior |
|---|---|---|---|---|---|---|---|---|
| 1. Webhook intake | HTTP request payload | Internal execution envelope and correlation data | Nothing upstream | Deterministic | No | No | No | Reject malformed transport requests; do not start research. |
| 2. Input validation | Candidate ResearchRequest | Sanitized `request`; `requestId`; `submittedAt` | Intake envelope | Deterministic | No | No | Only for a valid but constrained request; invalid required input is an error | Return a structured request error when the idea or allowed values are invalid. |
| 3. Idea understanding | Valid ResearchRequest | `StartupProfile`; candidate Assumptions | User-provided idea, market, and customer | AI with deterministic validation | No external observed evidence | Yes | Yes, when the idea is too ambiguous for a reliable interpretation | Repair invalid structure once; block research if no usable profile can be produced. |
| 4. Research planning | ResearchRequest and StartupProfile | Internal ResearchPlan, questions, query tasks, scope, and source priorities | Profile assumptions | AI with deterministic templates and validation | No | Yes, only when a planning boundary must be chosen | Yes, for scope restrictions | Fall back to bounded query templates; record reduced coverage when the plan remains incomplete. |
| 5. External collection | ResearchPlan and branch tasks | Internal search results, fetch results, raw documents, retrieval metadata | Source priorities and scope | External-data | No | No | Candidate retrieval limitations | Retry transient failures; continue with usable results and preserve inaccessible or partial retrieval states. |
| 6. Source normalization and registry A | Candidate search and fetch results | Canonical `Source` records with final `sourceId` values | Retrieval metadata and raw documents | Deterministic with bounded AI classification | No | No | Yes | Keep usable sources, mark partial/inaccessible retrieval, deduplicate, and record material coverage loss. |
| 7. Shared evidence extraction | Registered Sources, raw content, research questions | Observed EvidenceItem candidates with source references | StartupProfile and branch topic context | AI | Observed candidates only | No | Candidate extraction limitations | Repair structure or retry extraction; never infer a fact from an unreadable page. |
| 8. Evidence validation and registry A | Observed evidence candidates | Canonical observed `EvidenceItem` records with final IDs and topic tags | Source registry | Deterministic | Validates and registers observed evidence | No | Yes | Reject unsupported or non-atomic claims; continue with remaining evidence and document material gaps. |
| 9. Problem branch | StartupProfile, problem-tagged evidence, shared assumptions and limitations | `ProblemAnalysis`; candidate reusable inferred/derived evidence; candidate assumptions and limitations | Relevant Customer hypothesis from StartupProfile only | AI | Derived/inferred only when cross-section reuse justifies an EvidenceItem | Yes | Yes | Retry or structurally repair; otherwise return an unavailable/empty problem section plus Limitation. |
| 10. Customer branch | StartupProfile, customer-tagged evidence, shared assumptions and limitations | `CustomerAnalysis`; Segment, role, job, behavior, willingness-to-pay, and barrier records | Problem evidence, but not final ProblemAnalysis links | AI | Derived/inferred only when reusable | Yes | Yes | Continue with explicit unknown buyer or thin-demand limitations; never invent a payer. |
| 11. Market branch | StartupProfile, market-tagged evidence, shared assumptions and limitations | `MarketAnalysis`; deterministic metrics and size estimates where inputs permit | Initial research scope and relevant customer evidence | AI plus deterministic calculations | May create derived EvidenceItems through declared methods | Yes | Yes | Preserve conflicting figures; mark estimates Unavailable when required inputs are missing. |
| 12. Competitor branch | StartupProfile, competitor-tagged evidence, shared assumptions and limitations | Normalized `Competitor` records and pricing/feature records | Initial jobs, category, geography, and customer hypothesis | AI plus deterministic normalization | Derived/inferred only when reusable | Yes | Yes | Keep verified competitors, unknown fields, and coverage limits; never convert non-observation into absence. |
| 13. Cross-branch reconciliation | Four branch outputs and shared registries | Resolved segment/pain/job/entity links; reconciled candidates for shared libraries; consistency findings | All branch records | Deterministic with AI-assisted semantic matching | No new substantive evidence; may register already-produced candidates | May reconcile or deduplicate existing candidates | Yes | Remove or quarantine unresolved links, create Limitations, and preserve branch records that remain valid. |
| 14. Shared registry B | Reconciled EvidenceItem, Assumption, and Limitation candidates | Final Evidence, Assumption, and Limitation libraries plus temporary-to-final ID map | Registry A Sources and Evidence plus all branch candidates | Deterministic | Registers valid derived/inferred evidence; observed evidence already passed registry A | Registers assumptions | Registers limitations | Reject broken lineage; preserve valid records; mark affected analyses partial. |
| 15. Feature mapping and matrix | Reconciled Competitors, features, jobs, and coverage | `CompetitorMatrix`, canonical feature definitions, cells, metrics, and coverage | Competitor feature and pricing records | Deterministic; AI only maps wording to allowed capabilities | No; matrix metrics are owned records, not duplicate EvidenceItems | No | Yes | Use Unknown/Not confirmed cells, honest denominators, and a coverage Limitation. |
| 16. Competitive gap analysis | Problem pain points, customer jobs, Competitors, CompetitorMatrix, evidence, and limitations | `CompetitiveGap` records | Matrix metrics, coverage, counter-evidence | AI | No; the gap record carries the inference and its evidence links | Yes | Yes | Return no supported gaps rather than fabricate one; distinguish no gap from insufficient coverage. |
| 17. Business-model analysis | Customer roles and WTP signal IDs, competitor pricing IDs, market context, gaps | `BusinessModel` and candidates | Problem jobs/pain, assumptions, limitations | AI | No; candidate records carry the hypotheses and evidence links | Yes | Yes | Allow unknown payer and low confidence; return no recommended candidate if partial rules require Unavailable. |
| 18. MVP recommendation | Primary segment, jobs, pain points, gaps, BusinessModel, barriers | `MVPRecommendation` and MVP metric | Reconciled analysis and evidence | AI | Normally no; references existing evidence | Yes | Yes | Produce a narrower evidence-supported test or mark the recommendation unavailable. |
| 19. Risk analysis | All analyses plus MVPRecommendation | `Risk` records with at most one `scoreDimensionKey` each | Negative signals, barriers, assumptions, limitations, dependencies | AI with deterministic allowed-value checks | No; Risk is the reusable analytical record | Yes | Yes | Continue with fewer verified risks; mark unknown likelihood rather than Low. |
| 20. ScoreInput preparation | Analytical records, Risks, evidence, assumptions, limitations | Seven ScoreDimension candidates containing canonical `ScoreInput` records but no calculated score fields yet | Fixed V1 factor definitions and weights | AI classification plus deterministic validation | No | No; references existing assumptions | Yes, when a required scoring input is unavailable | Repair structure only; mark unsupported inputs Unavailable rather than assigning a rubric level. |
| 21. Deterministic scoring | Validated ScoreInputs | Numeric ScoreDimension fields and numeric/status fields of `OpportunityScore` | Fixed mappings, weights, caps, and scoring version | Deterministic | No | No | Yes, for calculation-blocking input gaps | Never retry with AI; unavailable dimensions make overall score Unavailable under canonical rules. |
| 22. Confidence aggregation | Sources, evidence, analyses, ScoreInputs, dimensions, risks, assumptions, limitations | Final local analysis confidence fields; confidence checks; dimension and overall confidence; consistency status; explanations after labels | Canonical confidence rules | Deterministic labels, then AI explanation | No | No | Yes | Default to Low when required checks cannot be established; never fabricate a percentage. |
| 23. Executive-summary synthesis | Completed analyses, OpportunityScore, confidence, risks, assumptions, limitations | `executiveSummary` | Existing report records only | AI | No | No | No new limitations; references existing ones | Use a deterministic fallback summary template if synthesis repeatedly fails. |
| 24. Validation planning | Analyses, score/coverage results, confidence, risks, BusinessModel, MVP, assumptions, limitations | `ValidationExperiment` recommendations | Weak, capped, or unavailable dimensions and critical uncertainties | AI | No | No; references existing assumptions | May identify a missing-research limitation for aggregation | Return a smaller valid experiment list; experiments never alter current evidence or scores. |
| 25. Final recommendation | OpportunityScore, confidence, Risks, ValidationExperiments, ExecutiveSummary, assumptions, limitations | `FinalRecommendation` | All authoritative upstream records | AI with deterministic guardrails | No | No | No new limitations; references existing ones | Repair structure; fall back to rule-bounded decision wording from existing score and uncertainty records. |
| 26. Report assembly | All canonical section outputs and shared libraries | `meta` and complete `ResearchReport` envelope | Temporary-to-final ID map and execution metadata | Deterministic | No | No | Aggregates only | Required sections remain present; unavailable values and empty lists carry linked Limitations. |
| 27. Output validation | Assembled ResearchReport | Validated report or structured validation failure | Canonical contract and reference rules | Deterministic; AI repair only for syntax/shape | No | No | Yes, if a recoverable partial record must be dropped | Repair only structure when meaning is unchanged; unresolved semantic errors keep the field unavailable or fail the response. |
| 28. Webhook response | Validated report or request-level error | HTTP response to Next.js | Execution status | Deterministic | No | No | No | Return the honest partial report when valid; return a structured error only when no contract-valid report can be assembled. |

## Top-Level ResearchReport Ownership Map

| ResearchReport field | Primary creation stage | Enrichment stages | Final aggregation | Is partial output valid? |
|---|---|---|---|---|
| `meta` | Report assembly | Scoring and confidence supply version metadata | Report assembly | Yes; status and available version metadata remain explicit. |
| `request` | Input validation | None after sanitization | Report assembly | No report is created without a valid request. |
| `startup` | Idea understanding | Assumption reconciliation and quality review | Report assembly | Only when enough meaning remains to research; otherwise request fails. |
| `executiveSummary` | Executive-summary synthesis | Output validation may remove unsupported references, not rewrite meaning | Report assembly | Yes; deterministic fallback may summarize available sections. |
| `opportunityScore` | ScoreInput preparation creates inputs; deterministic scoring creates numbers/status | Confidence aggregation adds confidence and consistency context | Report assembly | Yes; dimensions or overall score may be Unavailable. |
| `problem` | Problem branch | Cross-branch reconciliation adds segment links; confidence adds local reliability context | Report assembly | Yes, with empty lists/unavailable assessments and Limitations. |
| `customers` | Customer branch | Reconciliation connects ProblemAnalysis pain points; confidence reviews reliability | Report assembly | Yes; buyer and demand may remain Unknown or weakly covered. |
| `market` | Market branch | Reconciliation aligns the final segment/geography boundary; confidence reviews evidence | Report assembly | Yes; TAM/SAM/SOM or the full section may be Unavailable. |
| `competitors` | Competitor branch | Reconciliation maps jobs/segments and registry B resolves evidence IDs | Report assembly | Yes; only verified records are included and coverage limits are explicit. |
| `competitorMatrix` | Feature mapping and matrix stage | Confidence and coverage review | Report assembly | Yes; unknown cells and unavailable metrics remain explicit. |
| `competitiveGaps` | Competitive gap analysis | Risk, MVP, and scoring consume but do not rewrite them | Report assembly | Yes; an empty list may mean no supported gap or insufficient coverage, distinguished by Limitations. |
| `businessModel` | Business-model analysis | Risk and confidence review; score preparation references candidates | Report assembly | Yes; candidates or recommendation may be unavailable under partial-report rules. |
| `mvp` | MVP recommendation | Risk analysis may add related risks; validation references the metric and capabilities | Report assembly | Yes; unavailable when no credible testable value path exists. |
| `risks` | Risk analysis | Reconciliation validates one score owner; confidence and validation reference risks | Report assembly | Yes; fewer risks may reflect limited research and require a Limitation. |
| `validationExperiments` | Validation planning | FinalRecommendation selects priorities without modifying records | Report assembly | Yes; a smaller list is valid when uncertainty inputs are limited. |
| `recommendation` | Final recommendation | Output validation only | Report assembly | Yes; `Insufficient evidence` is the valid fallback verdict. |
| `evidence` | Evidence registry A | Branch candidate evidence and registry B; final reference validation | Report assembly | Yes; reduced evidence lowers coverage/confidence and may make dimensions unavailable. |
| `sources` | Source registry A | Reconciliation and registry B validate references but do not introduce Sources | Report assembly | Yes; source loss is represented through retrieval status and Limitations. |
| `assumptions` | Idea understanding or any analytical stage | Registry B deduplicates and resolves dependent sections | Report assembly | Yes; empty when no working choices were required. |
| `limitations` | Any collection, analysis, reconciliation, scoring, or validation stage | Registry B and report assembly deduplicate and attach affected sections | Report assembly | Yes; a partial report normally requires at least one explanatory Limitation. |

## Parallel Branch Design

Problem, Customer, Market, and Competitor analyses can run in parallel after the first Source and Evidence registry gates. They receive immutable snapshots of the same StartupProfile, shared source/evidence registries, research tasks, and existing assumptions/limitations.

### What branches may create independently

| Branch | May create | Must defer until reconciliation | Must not assume |
|---|---|---|---|
| Problem | Pain points, alternatives, workaround costs, signals, and provisional relationships | Final Customer segment IDs | That a proposed segment is verified merely because StartupProfile names it |
| Customer | Segments, roles, jobs, behavior, WTP signals, barriers, and signals | Final Problem pain-point links | That user, buyer, and beneficiary are identical or that pain implies payment |
| Market | Market boundary, trends, indicators, metrics, size states, and signals | Final alignment to the reconciled primary segment and geography | That a global or adjacent market statistic applies directly |
| Competitor | Verified competitors, classifications, pricing, features, and coverage candidates | Final mappings to canonical jobs/segments and all matrix calculations | That a feature is absent because it was not found |

Each branch uses temporary namespaced IDs for newly proposed records, such as `tmp_problem_pain_01`. It never mutates the central libraries concurrently. At the join, reconciliation receives all branch outputs and produces the only temporary-to-final ID map. A branch cannot create a new Source directly. If it identifies a missing research need, it records a workflow-internal follow-up request and a Limitation; any approved supplemental retrieval must loop through external collection and registry A before the branch is rerun.

The dependency order after the join is strict:

`Reconciled Customer jobs and Problem pain points` + `normalized Competitors` → `CompetitorMatrix` → `CompetitiveGap` → `BusinessModel` → `MVPRecommendation` → `Risk` → `ScoreInput preparation`.

MarketAnalysis can be created in parallel, but reconciliation must confirm that its boundary and metrics still match the final primary customer segment before scoring.

## Cross-Branch Reconciliation

Cross-branch reconciliation is a controlled join, not another research or synthesis stage. Its responsibilities are:

1. Resolve temporary branch IDs to final globally unique, type-prefixed IDs.
2. Link ProblemAnalysis pain points to CustomerAnalysis segments.
3. Create CustomerAnalysis segment-to-pain-point links without copying pain-point content.
4. Map competitor jobs and target-segment descriptions to canonical CustomerAnalysis IDs where the evidence supports a match.
5. Align MarketAnalysis geography and boundary with the finalized StartupProfile and primary customer segment.
6. Detect duplicate Source, EvidenceItem, Assumption, and Limitation candidates.
7. Detect incompatible claims across branches and create or attach Limitations.
8. Validate every cross-model reference before matrix, strategy, and scoring stages run.

AI may suggest that two labels are semantically equivalent, such as “final-year students” and “students approaching graduation.” Deterministic rules decide whether the suggested merge is allowed and preserve both records when confidence is insufficient. Reconciliation never creates factual evidence or silently resolves a source conflict.

## Shared Source / Evidence / Assumption / Limitation Aggregation

MVP V1 uses two central aggregation gates rather than one final-only merge or many concurrent branch writes. After gate B, stages run sequentially and may append new Assumptions or Limitations only through the same deterministic registry function. Sources are closed after gate A unless a controlled supplemental-collection loop returns there; Evidence is closed after gate B.

### Registry gate A: before analytical branches

- Normalize and deduplicate fetched Source candidates.
- Assign final Source IDs.
- Validate observed EvidenceItem candidates against readable Sources.
- Deduplicate atomic observed evidence.
- Assign final observed EvidenceItem IDs.
- Route evidence by topic tags without changing ownership.

### Registry gate B: after analytical branches

- Verify that every branch evidence reference resolves to a Source already registered at gate A.
- Validate derived and inferred EvidenceItem lineage.
- Deduplicate branch Assumptions and combine dependent-section references.
- Deduplicate Limitations when cause and impact are materially the same.
- Resolve every temporary reference through one ID map.
- Preserve incompatible evidence as separate records with conflict links and a Limitation.

Business-model, MVP, risk, scoring, confidence, and validation stages can discover new uncertainty after gate B. Their Assumption and Limitation candidates are immediately normalized and appended through the central registry before the next stage. They do not maintain private final lists. Report assembly performs one last reference and deduplication check but does not reinterpret these records.

### MVP deduplication rules

| Library | Primary deterministic key | Cautious secondary comparison | Never merge when |
|---|---|---|---|
| Source | Normalized canonical URL | Publisher + title + publication date for non-web material | Different pages support materially different claims or dates |
| EvidenceItem | Type + normalized atomic claim/metric + unit/timeframe + lineage set | AI-assisted semantic equivalence suggestion | Values, scopes, geographies, timeframes, or source interpretations conflict |
| Assumption | Normalized proposition + scope | Same reason and dependent sections | Different working values or materially different consequences exist |
| Limitation | Cause + affected scope + impact | Similar wording about the same failed coverage | Separate failures affect different sections or require different follow-up |

This two-gate design is incremental enough to prevent branch duplication and simple enough for one synchronous MVP workflow. It does not require a distributed event system or shared database writes.

## Workflow-Internal vs Report Data

| Workflow-internal object | Purpose | Included in ResearchReport? | Report counterpart, if any |
|---|---|---:|---|
| Execution envelope | Correlation ID, stage status, timing, and retry metadata | No | Selected version/timestamp fields become `meta` |
| ResearchPlan | Research questions, scope, source priorities, and branch tasks | No | StartupProfile and Assumptions preserve report-relevant scope |
| Search query | Provider-neutral retrieval request | No | None |
| Candidate search result | URL/title/snippet before verification | No | Becomes Source only after normalization |
| Fetch result | HTTP status, retrieved content, and access metadata | No | Retrieval status and Limitations where material |
| Raw document text | Input for evidence extraction | No | Atomic EvidenceItems preserve only relevant support |
| Branch task | Topic, questions, query set, and expected outputs | No | None |
| Temporary record ID | Branch-local identity before reconciliation | No | Replaced with canonical type-prefixed ID |
| Dedupe fingerprint | Deterministic comparison key | No | None |
| Temporary-to-final ID map | Resolves branch references at the join | No | Resolved canonical IDs |
| Retry/repair record | Attempt count and structural error information | No | Limitation only when the failure affects report quality |
| Stage validation result | Missing fields, broken references, or allowed-value errors | No | Limitation or unavailable field when materially unresolved |
| Source | Reusable source metadata | Yes | `sources` |
| EvidenceItem | Reusable observed, derived, or inferred support | Yes | `evidence` |
| Branch analysis models | Report findings | Yes | `problem`, `customers`, `market`, `competitors` |
| Strategy and action models | Gaps, monetization, MVP, risks, experiments, recommendation | Yes | Their named top-level fields |
| ScoreInput and scoring records | Auditable deterministic assessment | Yes | Nested under `opportunityScore.dimensions` |

No stage may rely on conversation memory, an earlier AI response that was not parsed into the execution payload, or prompt-only facts. Every child workflow receives the exact records and IDs it needs.

## Sub-Workflow Decomposition

The target MVP structure uses one main orchestrator and nine meaningful child workflows. Logical stages remain visible inside each child; they do not need one workflow per stage. These should be extracted progressively as each bounded capability is built, rather than scaffolded empty at the start.

| Sub-workflow | Purpose | Input | Output | Caller | Independently runnable? |
|---|---|---|---|---|---|
| Main Research Orchestrator | Coordinates order, parallel execution, joins, failure handling, and webhook response | Candidate ResearchRequest | Validated ResearchReport or request-level error | Webhook | Yes, as the entry workflow |
| Foundation and Planning | Validates input, creates StartupProfile, and produces internal ResearchPlan | Candidate ResearchRequest | Sanitized request, StartupProfile, plan, assumptions, limitations | Main orchestrator | Yes with a test request |
| Research Collection and Evidence Registry | Searches, fetches, normalizes Sources, extracts observed evidence, and runs registry gate A | StartupProfile and ResearchPlan | Sources, observed EvidenceItems, raw internal retrieval context, limitations | Main orchestrator | Yes with a plan fixture |
| Problem Analysis | Creates ProblemAnalysis candidates from scoped evidence | Profile, problem task, evidence, assumptions, limitations | ProblemAnalysis plus candidate shared records | Main orchestrator in parallel | Yes with evidence fixtures |
| Customer Analysis | Creates CustomerAnalysis candidates | Profile, customer task, evidence, assumptions, limitations | CustomerAnalysis plus candidate shared records | Main orchestrator in parallel | Yes with evidence fixtures |
| Market Analysis | Creates MarketAnalysis and deterministic market calculations | Profile, market task, evidence, assumptions, limitations | MarketAnalysis plus candidate shared records | Main orchestrator in parallel | Yes with evidence fixtures |
| Competitor Analysis | Verifies and normalizes Competitor records | Profile, competitor task, evidence, assumptions, limitations | Competitors plus candidate shared records and coverage | Main orchestrator in parallel | Yes with evidence fixtures |
| Strategy and Risk | Reconciles branches; runs registry B; builds matrix/gaps; creates BusinessModel, MVPRecommendation, and Risks | Four branch results and shared registries | Reconciled analysis, competitive intelligence, strategy, and risk records | Main orchestrator | Yes with complete branch fixtures |
| Assessment and Validation | Prepares ScoreInputs, calculates OpportunityScore, aggregates confidence, and creates ValidationExperiments | Reconciled analyses, strategy, Risks, and shared libraries | ScoreDimensions, OpportunityScore, final confidence fields, and ValidationExperiments | Main orchestrator | Yes with reconciled strategy fixtures |
| Report Synthesis and Assembly | Creates ExecutiveSummary and FinalRecommendation, assembles the report, and validates the contract | All finalized canonical records | Contract-valid ResearchReport | Main orchestrator | Yes with finalized record fixtures |

This decomposition avoids a single unmaintainable workflow while keeping related sequential logic together. If Strategy and Risk becomes difficult to inspect during implementation, its reconciliation/competitive-intelligence portion is the first candidate for a later split. That decision should follow implementation evidence rather than be made in advance.

## Stage Input / Output Contracts

| Contract boundary | Required conceptual input | Required conceptual output |
|---|---|---|
| Intake → Foundation | Raw request payload and execution metadata | Candidate ResearchRequest or structured request error |
| Foundation → Collection | Sanitized ResearchRequest, StartupProfile, Assumptions, internal ResearchPlan | Provider-neutral branch tasks and source priorities |
| Collection → Registry A | Search/fetch results and raw content | Canonical Sources, observed EvidenceItems, retrieval Limitations, internal raw-content handles |
| Registry A → each branch | Immutable Profile, relevant EvidenceItems and Sources, branch task, shared Assumptions/Limitations | Branch-owned analysis plus candidate shared records and temporary references |
| Branch join → reconciliation | Problem, Customer, Market, Competitor outputs and temporary ID namespaces | Resolved records, ID map, conflict findings, registry-B candidates |
| Reconciliation → matrix/gaps | Final Customer jobs/segments, Problem pain points, normalized Competitors, evidence, coverage | CompetitorMatrix and CompetitiveGaps |
| Gaps → BusinessModel | Customer roles/WTP signals, jobs/pain, competitor pricing, market context, gaps | BusinessModel candidates, recommendation-to-validate, assumptions, limitations |
| BusinessModel → MVP | Primary segment/job/pain, gaps, business candidate, barriers, evidence | MVPRecommendation and MVP metric |
| MVP → Risk | All analyses plus proposed MVP scope | Risks with related IDs, confidence, priority, and one scoreDimensionKey at most |
| Risk → ScoreInput preparation | All upstream analytical records and fixed factor definitions | Seven ScoreDimension candidates containing validated ScoreInputs grouped by dimension key |
| ScoreInput → scoring | Assessed/Unavailable inputs with fixed keys, evidence, and uncertainty links | ScoreDimensions and deterministic OpportunityScore values/status |
| Scoring → confidence | Dimensions, coverage, Sources/Evidence, conflicts, assumptions, limitations, Risks | Confidence checks, dimension confidence, overall confidence, consistency status |
| Confidence → summary and validation | Finalized analyses, score, confidence, Risks, uncertainty records | ExecutiveSummary and ValidationExperiments as separate outputs |
| Summary/validation → recommendation | OpportunityScore, confidence, Risks, ValidationExperiments, existing records | FinalRecommendation with selected signals, concerns, unknowns, and next steps |
| All canonical outputs → assembly | Every top-level section and shared library | Complete ResearchReport envelope and metadata |
| Assembly → output validation | ResearchReport candidate and canonical contract | Valid ResearchReport or structured unrecoverable validation error |

Every boundary passes actual structured records. A child receives no facts solely through natural-language instructions or hidden context.

## Failure and Partial-Report Behavior

The MVP uses bounded recovery rather than production-scale retry infrastructure.

| Failure | Retry or repair | Limitation? | Continue? | Downstream effect |
|---|---|---:|---:|---|
| Invalid required request field | No AI repair | No report limitation | No | Return request error. |
| Idea-understanding structure invalid | One structural repair or one repeat with the same input | Yes if ambiguity remains | Only with usable profile | Block all research if StartupProfile is unusable. |
| Research plan incomplete | Deterministic fallback templates; one AI retry if structurally invalid | Yes | Yes | Fewer queries and reduced branch coverage. |
| Search API timeout/rate error | Bounded retry; configured alternative retrieval route only if available | Yes when coverage changes | Yes | Relevant branch may become partial. |
| Webpage inaccessible | One retrieval retry when transient; no AI reconstruction | Yes | Yes | Source remains partial/inaccessible; no observed evidence from unread content. |
| Evidence extraction invalid JSON | Structural repair, then one re-extraction | Yes if useful content remains unprocessed | Yes | Drop invalid candidates and reduce evidence coverage. |
| No usable customer/problem/market/competitor evidence | No repeated AI guessing | Yes | Yes | Section is partial; relevant ScoreInputs become Unavailable and caps apply. |
| Credible market sources conflict | No retry merely to force agreement | Yes | Yes | Preserve separate evidence; lower confidence and possibly make sizing Unavailable. |
| One analytical branch fails | One same-input retry or structural repair | Yes | Yes | Required section remains present but partial; dependent stages use available records only. |
| Competitor coverage is sparse | Alternative query/fetch within the existing plan | Yes | Yes | Matrix uses Unknown/Not confirmed; gaps have low confidence or empty output. |
| Broken cross-model reference | Deterministic remap when uniquely resolvable | Yes if unresolved | Yes when invalid link can be removed safely | Affected child finding becomes unavailable or is omitted; parent remains. |
| ScoreInput lacks support | No AI retry to manufacture evidence | Yes | Yes | Mark input Unavailable; coverage/caps determine dimension status. |
| Any score dimension unavailable | No weight redistribution | Existing linked limitation | Yes | Overall numeric score is Unavailable. |
| Confidence inputs incomplete | No invented confidence percentage | Usually existing limitation | Yes | Deterministic confidence falls to the applicable lower label. |
| Synthesis JSON invalid | Structural repair only; deterministic fallback wording | No new substantive limitation unless section is lost | Yes | Preserve upstream score and facts exactly. |
| Final output fails contract validation | Repair unambiguous shape/reference defects only | Yes for dropped partial content | Sometimes | Return report if contract-valid after honest omission; otherwise return structured error. |

JSON repair may correct field names, list/object shape, allowed-value casing, or missing empty arrays when the intended meaning is already present. It may not change a claim, invent an ID, add evidence, choose a stronger rubric level, resolve a conflict, or alter a number.

## AI vs Deterministic vs External Responsibilities

| Responsibility | AI | Deterministic software/workflow | External service |
|---|---:|---:|---:|
| Interpret startup idea | Primary | Validate shape and allowed values | No |
| Create research questions and query wording | Primary | Apply scope, limits, and templates | No |
| Search or retrieve pages/data | No | Route requests and record status | Primary |
| Normalize URLs and deduplicate Sources | Assist classification only | Primary | Supplies metadata |
| Extract atomic observed evidence | Primary | Validate Source links and required fields | Supplies raw content |
| Calculate derived metrics | Explain only | Primary | Supplies inputs |
| Analyze problem/customer/market/competitors | Primary | Validate records and references | Supplies evidence |
| Map varied feature wording | Assist | Enforce canonical feature set and statuses | No |
| Build matrix denominators and metrics | No | Primary | No |
| Generate gap, business-model, MVP, risk, and experiment hypotheses | Primary | Enforce allowed fields and reference rules | No |
| Classify ScoreInput rubric levels | Propose with rationale | Validate allowed level, support, and fixed input key | No |
| Map rubric levels and calculate scores | No | Exclusive owner | No |
| Calculate confidence labels | Explain checks when useful | Exclusive owner of rules and final labels | No |
| Write score/confidence explanations | Primary after values are fixed | Supply authoritative values | No |
| Assemble and validate ResearchReport | No | Exclusive owner | No |
| Persist reports | No MVP responsibility | Future application/database responsibility | Future database |

## Architectural Review

1. Every canonical model has one primary creating or owning stage.
2. Source and Evidence libraries have central registry gates and cannot be independently mutated by parallel branches.
3. Parallel branches produce temporary records, so no circular dependency is required.
4. Cross-branch reconciliation explicitly links Problem pain points, Customer segments/jobs, Market boundaries, and Competitor mappings.
5. AI performs no rubric-to-number mapping, weighting, cap calculation, confidence aggregation, or score arithmetic.
6. Deterministic stages validate, calculate, and connect records; they do not invent qualitative conclusions.
7. ResearchPlan, raw documents, query tasks, retries, and ID maps remain workflow-internal.
8. FinalRecommendation runs only after OpportunityScore, confidence, Risks, ValidationExperiments, and ExecutiveSummary exist.
9. ExecutiveSummary reports findings and is generated separately from action-oriented FinalRecommendation.
10. ValidationExperiment creates recommendations only and produces no EvidenceItem or score change.
11. Partial branch results remain valid when required section structure, unavailable values, and Limitations are present.
12. Missing evidence remains Unknown or Unavailable and is never converted to Low, zero, false, or absent.
13. Material branch and retrieval failures create Limitations.
14. Temporary branch IDs resolve through one deterministic mapping before downstream analysis.
15. Canonical ScoreInputs exist only under ScoreDimension.
16. Each Risk has at most one scoreDimensionKey, and its underlying condition contributes only once.
17. Source URLs exist only in Source records.
18. Nine cohesive child workflows avoid a giant workflow without creating dozens of tiny workflows.
19. Each child has explicit inputs and outputs and can be tested with fixtures independently.
20. The stages can be implemented incrementally in the same order as their dependencies.

No orchestration blocker requires a change to the frozen ResearchReport models.

## Decisions Finalized

1. The workflow uses two shared-library registry gates: before branches and after branch reconciliation.
2. Problem, Customer, Market, and Competitor analyses run in parallel from immutable shared inputs.
3. Branches use temporary namespaced IDs; reconciliation assigns or resolves final report IDs.
4. The shared evidence extractor is reusable and context-aware, but raw extraction creates observed evidence only.
5. Derived evidence comes from declared deterministic calculations; reusable inferred evidence comes from analysis stages with input lineage.
6. Reconciliation may normalize links and expose conflicts but may not invent evidence.
7. CompetitorMatrix calculations are deterministic; AI may only assist canonical feature mapping.
8. BusinessModel runs after customer roles/WTP, market context, competitor pricing, and gaps exist.
9. MVPRecommendation precedes Risk so risk analysis can evaluate the proposed MVP.
10. Risks never directly subtract score points; ScoreInput preparation maps each score-relevant risk to one dimension.
11. ScoreInput is owned only by ScoreDimension and is not duplicated in analytical sections.
12. Validation planning runs after scoring and confidence and does not change either.
13. ExecutiveSummary runs after scoring/confidence and before FinalRecommendation; it remains a findings summary.
14. FinalRecommendation runs after validation planning and introduces no research facts.
15. Required report sections remain present in honest partial reports.
16. One main orchestrator plus nine progressively extracted child workflows is the recommended target decomposition.

## Decisions Still Open

These choices depend on implementation tests or service constraints rather than the conceptual report model:

1. Search and webpage-retrieval provider selection and fallback availability.
2. LLM selection, batching, context limits, and latency/cost trade-offs for each AI stage.
3. Exact retry counts, timeouts, concurrency limits, and n8n execution limits.
4. Whether large raw documents can remain in the n8n execution payload or need temporary external object storage.
5. Exact deterministic deduplication thresholds for semantically similar evidence and assumptions.
6. Exact mechanism for contract validation and structure-only JSON repair.
7. The synchronous request-duration threshold that would justify moving to the future asynchronous job architecture.
8. Whether implementation experience requires splitting reconciliation/competitive intelligence from Strategy and Risk.

## What I Should Understand

n8n coordinates work. It decides which stage runs next, what records the stage receives, which branches run in parallel, how failures are represented, and when outputs are safe to combine.

The AI performs bounded judgment: interpreting an idea, extracting atomic evidence, classifying qualitative inputs, and writing explanations. Deterministic workflow steps own IDs, validation, deduplication, arithmetic, coverage, score caps, confidence rules, and final contract checks. External services retrieve information. A future database will persist requests and reports.

The key engineering concept is explicit state. Each stage receives structured input and returns structured output. Nothing important exists only in an AI conversation or a hidden node. This makes the workflow inspectable, testable, and replaceable one stage at a time.

## Next Step

After this map is reviewed, define the frontend/dashboard information architecture and create one complete realistic mock ResearchReport before coding.

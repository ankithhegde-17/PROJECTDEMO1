# Frontend and Dashboard Information Architecture

Status: Conceptual architecture, MVP V1

Authoritative inputs:

- `docs/research-report-data-model.md`
- `docs/n8n-stage-to-model-ownership-map.md`

This document defines how the frozen ResearchReport becomes a professional research product. It specifies information hierarchy, navigation, states, component responsibilities, and visual direction without defining React, Next.js, TypeScript, Zod, Tailwind, or other implementation code.

## Frontend Information Architecture

### MVP routes and product states

MVP V1 needs three routes and four visible product states:

| Route | State | Purpose | Primary action |
|---|---|---|---|
| `/` | Landing | Explain the value of evidence-backed startup research and show a restrained report preview. | Analyze an idea |
| `/research/new` | New Research | Collect the startup idea, target market, optional target customer, and research depth. | Analyze opportunity |
| `/research/new` | Research Progress | Replace the submitted form with staged research progress while the synchronous request runs. | Wait; retry or edit input only after failure |
| `/research/result` | Results Dashboard | Render one complete or partial ResearchReport as a long-form decision workspace. | Jump to validation plan or analyze another idea |

Progress is a state of `/research/new`, not a separate route, because it has no durable job identity in the synchronous MVP. Results use one route with anchored sections. Detail routes would fragment the report and add routing/state complexity before history or persistence exists.

Authentication, billing, history, saved reports, teams, profile settings, export, and administration remain outside MVP V1.

### Results Dashboard hierarchy

The report is ordered around a founder's decision process rather than the order in which n8n produced data:

1. Report header and startup context
2. Decision snapshot: verdict, opportunity score, status, confidence, and immediate action
3. Executive summary: what the research found
4. Opportunity assessment: seven dimensions and expandable calculations
5. Problem analysis
6. Customer analysis
7. Market analysis
8. Competitive intelligence and gaps
9. Strategy: business model followed by MVP recommendation
10. Material risks
11. Validation plan
12. Final recommendation and numbered next steps
13. Research basis: Sources, Assumptions, and Limitations

The decision snapshot previews FinalRecommendation without reproducing its full reasoning. ExecutiveSummary reports findings. The final recommendation later presents concerns, critical unknowns, selected experiments, and an ordered action sequence.

### Above-the-fold design

The first viewport should contain three compact layers:

1. **Report identity:** concept name, normalized description, target market, target customer, generated date, and a small “Mock report” label when applicable.
2. **Assessment:** the overall score or intentional Unavailable state, score band, Complete/Provisional/Unavailable status, and overall confidence.
3. **Decision:** canonical verdict, one-sentence recommendation summary, one strongest signal, one largest uncertainty, and a jump link to the Validation Plan.

The seven dimension rows, full executive summary, evidence, and detailed next steps begin below this snapshot. This keeps the hero useful without turning it into a wall of badges.

### Opportunity Score interface

The score area uses progressive disclosure:

| Level | Initially visible | Revealed on expansion |
|---|---|---|
| Overall | Score, band, calculation status, confidence, and short calculation note | Coverage summary, consistency status, and full calculation explanation |
| Dimension | Label, score/band, confidence, coverage, and small weighted contribution | Applied caps, confidence reason, positive/negative factors, and ScoreInput list |
| ScoreInput | Hidden initially | Rubric level, fixed numeric mapping, internal weight, rationale, and evidence/counter-evidence links |
| Evidence detail | Hidden initially | Findings, Sources, Assumptions, and Limitations connected to the input |

The interface should state “Evidence-based assessment, not success probability.” A Provisional label appears beside the score, not in a distant footnote. When a cap applies, the row shows a restrained callout such as “Coverage cap applied: 50% of expected inputs assessed.”

Weighted contribution belongs in the expanded calculation view because it explains arithmetic but is not a primary founder decision signal.

### Evidence presentation

Use one reusable finding pattern:

```text
[DATA / DERIVED / AI INSIGHT / ASSUMPTION]  Confidence: Medium
Concise finding statement
Supported by 3 sources · View evidence
```

| Label | Canonical source | Visual treatment |
|---|---|---|
| DATA | Observed EvidenceItem or explicit user input | Neutral blue-gray badge |
| DERIVED | Derived EvidenceItem or deterministic metric | Teal badge with calculation affordance |
| AI INSIGHT | Inferred EvidenceItem or evidence-linked analytical interpretation | Muted indigo badge |
| ASSUMPTION | Assumption record | Amber outlined badge and callout treatment when material |

“View evidence” opens a compact drawer or popover containing the supporting source titles, publishers, dates, claim-specific quality context, relevant excerpts, and conflicts. Normal users never see raw IDs. The UI resolves IDs into readable labels internally.

Evidence badges appear on material findings and metrics rather than every sentence. Parent sections can show a combined source count and confidence when several sentences share the same evidence basis.

### Confidence presentation

Confidence appears at three levels:

- Overall confidence beside the overall score status.
- Dimension confidence on each score row.
- Finding-level confidence only for material claims, gaps, risks, estimates, and payment signals.

The labels are High, Medium, and Low. They use text plus a subtle icon or tone, never a circular percentage gauge. A score of 76 with Low confidence should render as:

> 76 · Promising  
> Low confidence — available findings are favorable, but evidence coverage or quality is weak.

Color cannot carry meaning alone. Every label remains visible as text, and tooltips explain that confidence describes research reliability rather than likelihood of startup success.

### Problem section

The Problem section begins with `problemSummary` and confidence, followed by:

1. Two or three priority pain-point rows showing severity, frequency, affected segment, and evidence count.
2. A paired “Current alternatives” and “Workaround burden” layout.
3. Positive and negative signals in a balanced two-column block.
4. Material limitations as a compact callout.

Pain points link to Customer segments by readable name. The section does not repeat the full segment descriptions or create another overall severity number.

### Customer section

The Customer section uses four layers:

1. Primary segment with secondary segment chips.
2. A role map for User, Buyer, Beneficiary, and Influencer. Unknown buyer receives an intentional unknown state.
3. Jobs-to-be-done and current behaviors, grouped by segment.
4. WTP signals and adoption barriers shown separately.

WTP cards use wording such as “Payment signal” and show transferability. They never display a recommended price. Segment-to-pain links explain relevance without repeating ProblemAnalysis severity or frequency.

### Market section

The Market section begins with its exact definition, included scope, excluded scope, geography, timeframe, and confidence. It then displays:

- Market-existence signals.
- Trends and growth indicators.
- A compact row of supported market metrics.
- Three market-size cards for TAM, SAM, and SOM.
- Positive/negative signals and material limitations.

Market-size cards have three explicit states:

| State | Display |
|---|---|
| Sourced | Value, unit/currency, geography, timeframe, source count, and evidence label |
| Derived | Value, unit/currency, geography, timeframe, method, inputs, assumptions, and calculation explanation |
| Unavailable | “Insufficient evidence,” missing inputs, and recommended research follow-up; no empty chart or zero value |

Charts appear only when several comparable time-series or category values exist. Three isolated TAM/SAM/SOM values should remain cards because they do not form a meaningful chart.

### Competitive intelligence

Competitor cards show name, Direct/Indirect/Substitute label, verified geography, neutral description, positioning, pricing status, key confirmed capabilities, record confidence, and evidence coverage. Marketing claims are visually identified as company claims.

The matrix uses only decision-relevant capabilities. Desktop shows competitors as rows and capabilities as columns, with a sticky first column. Tablet and mobile switch to a competitor selector or stacked per-competitor capability list.

| Matrix state | UI meaning |
|---|---|
| Confirmed | Verified capability |
| Partial | Limited or narrower capability |
| Not confirmed | Reviewed material did not verify it |
| Confirmed absent | Reliable evidence explicitly supports absence |
| Unknown | Insufficient usable material |

Unknown and Not confirmed use distinct neutral symbols and never reuse the “No” treatment for Confirmed absent. Matrix coverage and eligible denominators remain visible near every derived penetration metric.

A CompetitiveGap card follows this sequence:

`Customer need → competitor pattern → gap hypothesis → counterargument → confidence → validation need`

An attractive-looking but unsupported feature gap is shown as weakened or omitted, never promoted merely because matrix cells are unknown.

### Business Model section

Display two or three candidate cards in comparison order. Each shows:

- Model type and validation priority.
- Payer role and payer segment, including Unknown.
- Value exchange.
- Customer WTP signal links and additional comparable behavior.
- Competitor pricing or market context.
- Monetization barriers, confidence, and validation question.

The chosen candidate receives the label **Recommended to validate first**. The interface never uses “best model,” “optimal pricing,” or forecast language.

### MVP section

The MVP section is framed as a testable value hypothesis. It displays:

1. Primary segment, job, pain points, gap, and optional business-model candidate.
2. MVP value proposition and smallest core workflow.
3. Must-have capabilities.
4. Nice-to-have and deferred capabilities in collapsed secondary groups.
5. AI scope with the simpler manual fallback.
6. One metric to observe, explicitly separated from experiment-specific thresholds.

The section headline should reinforce “Smallest useful test of customer value,” not “Version one feature roadmap.”

### Risk section

Risks are sorted Critical → High → Medium → Low, then by validation priority. Each expandable risk row shows statement, category, why it matters, severity, likelihood, confidence, priority, counterargument, mitigation, and validation priority.

Unknown likelihood has its own label and explanation. Risks use no heatmap, probability percentage, expected-loss number, or universal red coloring. Critical and High receive stronger emphasis; Medium and Low remain neutral and readable.

### Validation Plan

Validation is a primary decision section, not an appendix. Three to five numbered experiment cards show:

- Uncertainty being reduced.
- Falsifiable hypothesis.
- Target participants and role.
- Method and artifact.
- Procedure summary.
- Metric.
- Supports-if, weakens-if, and inconclusive-if criteria.
- Expected learning and priority.

A small relationship line explains `Current finding → uncertainty → this experiment → founder decision`. Every card is labeled Recommended. No completion state, result, or evidence badge implies that the experiment has already run.

### Final Recommendation

The Final Recommendation is action-oriented and contains:

1. Verdict and concise summary.
2. Why the score and confidence lead to this action.
3. Strongest signals and biggest concerns in balanced columns.
4. Critical unknowns with their resolution paths.
5. Linked recommended experiments.
6. Three to five numbered next steps.

It does not repeat the ExecutiveSummary paragraph or rebuild the score breakdown. Links take the user back to the relevant dimension, risk, assumption, or experiment.

### Research basis: Sources, Assumptions, and Limitations

Use a single “Research basis” section with three tabs or segmented views:

| View | Default content | Expansion |
|---|---|---|
| Sources | Publisher, title, category, publication date, relevance, and default quality | URL, accessed date, retrieval status, and evidence supported |
| Assumptions | Statement, importance, validation-needed state, and affected sections | Reason, contextual evidence, and validation suggestion |
| Limitations | Statement, impact, and affected sections | Cause, related sources/evidence, and recommended follow-up |

High-importance assumptions and high-impact limitations also appear contextually in affected sections. The complete lists remain here to avoid cluttering the main report.

### Results navigation

Desktop uses a compact sticky left rail inside the report page. It contains:

`Overview · Score · Problem · Customers · Market · Competition · Strategy · Risks · Validation · Sources`

Strategy anchors to the Business Model and MVP group. Sources anchors to the Research Basis section. The active section updates while scrolling.

Tablet changes the rail to a sticky horizontal section scroller. Mobile uses a compact sticky “Jump to section” control that opens a bottom sheet or menu. The content remains one route and each section has a stable anchor.

### Research progress state

The progress screen uses phase labels rather than a fabricated percentage:

1. Understanding the idea
2. Planning research
3. Collecting and checking sources
4. Analyzing problem, customers, market, and competitors
5. Reconciling evidence
6. Building strategy and risk analysis
7. Calculating score and confidence
8. Preparing the report

For the mock frontend, stages can advance on a simulated timer but must be described as a preview. Once n8n exposes real stage status, the same UI can consume it. Completed, current, pending, partial, and failed states use icons plus text.

### Empty, unavailable, conflict, and partial states

| Situation | Intentional UI state |
|---|---|
| Market size unavailable | “Insufficient evidence” card with missing inputs and follow-up |
| Competitor coverage incomplete | Coverage banner with verified candidates, inaccessible candidates, and unknown cells |
| Buyer unknown | Unknown Buyer role card linked to the relevant Assumption and validation experiment |
| Overall score unavailable | No number; explain which dimensions lack minimum coverage and show available dimensions |
| Section partially researched | “Partial research” label, available findings, and linked Limitations |
| Low-confidence finding | Keep the finding visible with Low confidence and a plain-language reliability explanation |
| Conflicting sources | “Sources disagree” callout showing scopes/timeframes and no silent average |
| No supported competitive gap | Explain whether evidence suggests no meaningful gap or coverage was insufficient |
| Failed research branch | Preserve the section shell, state what failed, and show what downstream conclusions are unavailable |

Empty arrays do not automatically produce “None exists.” The renderer inspects Limitations and coverage to decide whether to say “No supported finding,” “Not researched sufficiently,” or “Unavailable.”

### Responsive behavior

- Desktop uses a centered reading canvas with a narrow navigation rail and a wider report column.
- Tablet stacks paired columns and turns the left rail into a horizontal section scroller.
- Mobile stacks all cards, keeps the score/verdict readable without horizontal scrolling, and moves secondary metadata into expandable rows.
- Wide tables use a sticky identity column on desktop and switch to record-by-record views on mobile.
- The competitor matrix never shrinks text into an unreadable spreadsheet.
- Source, evidence, and calculation details open in full-width mobile sheets.
- Visual order remains identical across screen sizes so anchored navigation and reading logic stay predictable.

## Dashboard Component Map

Components exist when they encode a repeated information pattern or meaningful behavior. Trivial layout wrappers do not need named component contracts yet.

| Component | Purpose | Canonical data consumed | Reusable? |
|---|---|---|---:|
| `AppShell` | Provides product header, report navigation region, and main reading canvas | Route state and report identity | Across screens |
| `ResearchForm` | Captures the canonical ResearchRequest inputs | ResearchRequest fields | New Research only |
| `ResearchProgress` | Displays meaningful workflow phases without fake percentages | Future workflow status; simulated stage list initially | Progress state |
| `ReportHeader` | Shows concept, description, target scope, and generation metadata | `startup`, `request`, `meta` | Report only |
| `DecisionSnapshot` | Combines score/status/confidence with verdict and immediate next action | `opportunityScore`, selected `recommendation` fields | Report only |
| `OpportunityScoreCard` | Presents overall assessment and calculation disclosure | `opportunityScore` | Report only |
| `DimensionScoreRow` | Shows and expands one ScoreDimension | One `ScoreDimension` including `inputs` | Repeated seven times |
| `ScoreInputDetail` | Explains rubric mapping, weight, rationale, and supporting records | One `ScoreInput`, resolved records | Repeated within dimensions |
| `ConfidenceBadge` | Displays High/Medium/Low with reliability language | Any canonical confidence field and reason | Global |
| `EvidenceBadge` | Displays DATA/DERIVED/AI INSIGHT/ASSUMPTION | Evidence classification or Assumption origin | Global |
| `FindingCard` | Presents a material statement with confidence and evidence disclosure | Analytical statement plus resolved evidence IDs | Global |
| `EvidenceDrawer` | Resolves a finding into evidence and readable source attribution | EvidenceItems and Sources | Global |
| `SectionHeader` | Gives each analytical section a title, summary, confidence, and partial state | Section-level summary/confidence/limitations | Global |
| `SignalColumns` | Balances positive and negative signals | Signal records | Problem, Customer, Market |
| `MetricCard` | Shows one supported metric with scope and evidence type | Market metric or comparison metric | Market and Competition |
| `MarketSizeCard` | Handles Sourced, Derived, and Unavailable sizing states | Market-size-estimate record | TAM/SAM/SOM |
| `CustomerRoleMap` | Clarifies user, buyer, beneficiary, and influencer | `customers.customerRoles` | Customer and Business Model context |
| `CompetitorCard` | Summarizes one normalized competitor | One Competitor | Repeated |
| `CompetitorMatrixView` | Renders capability states, coverage, and compact responsive alternatives | `competitorMatrix` plus competitor names | Competition only |
| `GapCard` | Shows need, competitive pattern, hypothesis, counterargument, and confidence | One CompetitiveGap | Repeated |
| `BusinessModelCard` | Compares one monetization hypothesis and validation priority | One BusinessModel candidate plus resolved roles/signals | Repeated |
| `MvpScopePanel` | Presents the target, workflow, capabilities, AI scope, and metric | `mvp` | Strategy only |
| `RiskRow` | Prioritizes and expands one material risk | One Risk | Repeated |
| `ValidationExperimentCard` | Presents a recommended experiment and its decision rules | One ValidationExperiment | Repeated |
| `FinalRecommendationPanel` | Presents verdict reasoning, unknowns, and numbered next steps | `recommendation` | Report only |
| `ResearchBasisPanel` | Provides Sources/Assumptions/Limitations tabs | `sources`, `assumptions`, `limitations` | Report only |
| `AssumptionCallout` | Elevates a material working assumption in context | One Assumption | Global |
| `LimitationCallout` | Explains missing, conflicting, or constrained research | One Limitation | Global |
| `UnavailableState` | Renders intentional Unknown/Unavailable/partial states with reason | Field status, coverage, and resolved Limitations | Global |

## Visual Design Direction

### Typography and hierarchy

- Use a neutral modern sans-serif for interface and report text.
- Use four primary levels: report title, section title, subsection/card title, and body/metadata.
- Scores and metrics use tabular numerals.
- Dense evidence metadata uses a smaller size but retains comfortable line height.
- Long analytical prose is constrained to readable line lengths rather than spanning the entire dashboard.

### Layout and rhythm

- Use a centered maximum-width report canvas with a narrow navigation rail on desktop.
- Give major analytical sections strong vertical separation.
- Use compact spacing inside related tables and lists, with larger spacing between distinct decisions.
- Keep above-the-fold assessment denser than the analytical body without turning it into an admin dashboard.

### Borders and cards

- Use a light neutral page background with white or near-white content surfaces.
- Prefer subtle borders and restrained shadows. Most sections can be bordered groups rather than independent floating cards.
- Use cards for distinct records such as competitors, business-model candidates, risks, and experiments.
- Avoid glass effects, glow, gradient-heavy heroes, and decorative AI imagery.

### Accent and status colors

- Use one restrained product accent for navigation, active controls, and primary actions.
- Use semantic colors sparingly: green for favorable support, amber for assumptions/caution, red for material adverse conditions, blue-gray for observed data, teal for derived values, and muted indigo for AI insight.
- Confidence uses intensity and text, not traffic-light colors that imply success/failure.
- Unknown, Not confirmed, and Unavailable remain visibly neutral and distinct.

### Score visualization

- Use a large numeric score only when calculation status permits it.
- Use horizontal dimension bars or restrained tracks with labels and numbers; avoid gauges that resemble probability meters.
- Show confidence and coverage beside, not inside, the score bar.
- Applied caps use a small annotated marker and textual explanation.

### Icons, tables, and charts

- Use a consistent outline icon family for navigation, status, evidence, expansion, and warnings.
- Icons supplement text and never replace status labels.
- Tables use sticky headers/identity columns only when comparison benefits justify them.
- Charts are allowed only for real comparisons or trends with enough data points. The score breakdown, isolated metrics, risks, and TAM/SAM/SOM do not require decorative charts.

## Mock ResearchReport Overview

The frontend fixture represents a fictional Indian student-internship platform named **InternPath AI**. Its available mock evidence suggests a recurring discovery and application-workflow problem, a plausible opportunity for more transparent matching, and a testable concierge MVP.

The report is intentionally imperfect. Market estimates conflict, competitor capability coverage is incomplete, direct payment evidence is weak, the buyer remains partly uncertain, and execution evidence lacks a verified long-term data-supply path. The resulting score is expected to be Provisional with varied dimension confidence and a validation-first recommendation.

All publishers, sources, competitor names, statistics, prices, and findings are explicitly illustrative. Source URLs use the reserved `.mock` pattern and source titles begin with `[MOCK]`.

Primary fixture: `mock-data/mock-research-report.json`

## Mock Coverage Checklist

The fixture must and does exercise:

- Observed EvidenceItems linked to Sources.
- Derived EvidenceItems with `inputEvidenceIds` and `analysisMethod`.
- Inferred EvidenceItems with preserved lineage.
- Separate Assumption records.
- Limitations covering access, coverage, conflicts, and missing inputs.
- Conflicting market evidence preserved rather than averaged.
- Sourced TAM, Derived SAM, and Unavailable SOM states.
- Direct, indirect, and substitute competitors.
- Confirmed, Partial, Not confirmed, Confirmed absent, and Unknown matrix states.
- A supported gap plus a weakened gap with counter-evidence.
- Three monetization candidates with uncertain payment evidence.
- A coverage-capped Execution Feasibility dimension.
- High, Medium, and Low dimension confidence labels.
- Five material risks, including one with Unknown likelihood.
- Five recommended validation experiments with decision rules.
- A Provisional overall score and validation-first FinalRecommendation.

## Decisions Finalized

1. MVP uses `/`, `/research/new`, and `/research/result`; progress is a state of the New Research route.
2. Results remain one anchored long-form route.
3. Desktop navigation uses a sticky left rail; tablet and mobile use compact adaptive navigation.
4. Above the fold contains identity, assessment, verdict, one strong signal, one major uncertainty, and a validation jump link.
5. ScoreInput details use progressive disclosure.
6. Evidence IDs are resolved into readable evidence/source interfaces and never shown directly to normal users.
7. Confidence is textual High/Medium/Low reliability, never a probability gauge.
8. Market-size and competitor-coverage uncertainty receive intentional states.
9. Validation is a primary report section and all experiments remain clearly Recommended.
10. Sources, Assumptions, and Limitations share one progressive-disclosure Research Basis section.
11. The fixture uses only fictional sources, competitors, values, and claims.

## Decisions Still Open

These choices require visual implementation testing:

1. Exact typeface and final neutral/accent palette.
2. Whether evidence details work better as a right-side drawer or anchored popover on desktop.
3. Whether dimension expansion allows several rows open simultaneously.
4. Whether the mobile competitor matrix uses a competitor selector or stacked accordion.
5. Exact density of source metadata shown before expansion.
6. Whether the sticky desktop navigation remains visible at narrower laptop widths.
7. Timing used by the simulated progress state before real n8n status exists.

## What I Should Understand

Building the dashboard against a realistic ResearchReport fixture separates interface problems from workflow problems. If a matrix renders incorrectly, a score explanation is confusing, or an unavailable market-size card looks broken, we can fix the frontend while the input remains stable. Later, n8n only needs to return the same contract.

This is contract-driven development: the data model defines meaning, the fixture exercises realistic states, and the frontend proves that the contract can communicate them. Connecting AI and external research comes afterward, when the interface already handles evidence, uncertainty, and partial results correctly.

## Next Step

Begin Phase 1 frontend implementation incrementally using the finalized dashboard information architecture and mock ResearchReport.

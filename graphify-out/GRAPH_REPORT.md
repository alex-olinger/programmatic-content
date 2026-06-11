# Graph Report - .  (2026-06-11)

## Corpus Check
- Large corpus: 229 files · ~57,078 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 180 nodes · 297 edges · 20 communities detected
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.79)
- Token cost: 137,000 input · 4,700 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Entity Graph & Data Loading|Entity Graph & Data Loading]]
- [[_COMMUNITY_Page Computation & Content Rules|Page Computation & Content Rules]]
- [[_COMMUNITY_Frontend Page Rendering|Frontend Page Rendering]]
- [[_COMMUNITY_Graph & Generation Pipeline|Graph & Generation Pipeline]]
- [[_COMMUNITY_Page Rules|Page Rules]]
- [[_COMMUNITY_LLM Narrative & Hardening|LLM Narrative & Hardening]]
- [[_COMMUNITY_Build Sequence & Page Builders|Build Sequence & Page Builders]]
- [[_COMMUNITY_Markdown Rendering|Markdown Rendering]]
- [[_COMMUNITY_Page Index & Validation|Page Index & Validation]]
- [[_COMMUNITY_Frontend Data Loading|Frontend Data Loading]]
- [[_COMMUNITY_Entity Graph Traversal (docs)|Entity Graph Traversal (docs)]]
- [[_COMMUNITY_Page Links|Page Links]]
- [[_COMMUNITY_AI Editing Rules|AI Editing Rules]]
- [[_COMMUNITY_Narrative Context|Narrative Context]]
- [[_COMMUNITY_Tool Entity|Tool Entity]]
- [[_COMMUNITY_Dataset|Dataset]]
- [[_COMMUNITY_Page Type|Page Type]]
- [[_COMMUNITY_Page Index Type|Page Index Type]]
- [[_COMMUNITY_Load All Slugs|Load All Slugs]]
- [[_COMMUNITY_Root Layout Component|Root Layout Component]]

## God Nodes (most connected - your core abstractions)
1. `compute-pages main` - 13 edges
2. `applyAllRules()` - 12 edges
3. `main()` - 11 edges
4. `applyAllRules` - 11 edges
5. `buildPageDefinition` - 11 edges
6. `loadData()` - 10 edges
7. `generateNarrative` - 9 edges
8. `renderMarkdown()` - 8 edges
9. `generateNarrative()` - 7 edges
10. `buildPageDefinition()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Pipeline Workflow Diagram` --references--> `applyAllRules`  [EXTRACTED]
  docs/architecture/workflow-diagram.md → src/lib/pageRules.ts
- `generateNarrative` --implements--> `LLM Boundary concept`  [INFERRED]
  src/lib/llm.ts → README.md
- `Project Map / Layer Responsibilities` --references--> `validateCandidates`  [EXTRACTED]
  docs/architecture/project-map.md → src/lib/pageIndex.ts
- `Pipeline Workflow Diagram` --references--> `validateCandidates`  [EXTRACTED]
  docs/architecture/workflow-diagram.md → src/lib/pageIndex.ts
- `MIN_TOOLS Thresholds` --references--> `validateCandidates`  [EXTRACTED]
  docs/rules/content-engine-rules.md → src/lib/pageIndex.ts

## Hyperedges (group relationships)
- **Deterministic Content Pipeline (compute → generate → qa)** — computepages_main, generatepages_main, qacheck_main, pagerules_applyallrules, markdown_rendermarkdown, validate_validateall [EXTRACTED 0.85]
- **Graph layer build (entity graph, page links, clusters)** — computegraph_main, entitygraph_buildentitygraph, pagelinks_computerelatedpages, topicalclusters_buildtopicalclusters [EXTRACTED 0.85]
- **Page validation via MIN_TOOLS thresholds** — pageindex_validatecandidates, validate_validateall, pagerules_min_tools, pagerules_min_overlap_score [INFERRED 0.85]
- **Hybrid Rendering Pipeline** — buildpriority_highprioritytypes, pages_loadhighpriorityslugs, slug_page_generatestaticparams [EXTRACTED 1.00]
- **PageDefinition to PageIndex Flow** — pagerules_applyallrules, pageindex_validatecandidates, pageindex_deduplicatecandidates, pageindex_buildpageindex [EXTRACTED 1.00]
- **Page Relatedness Strategies** — entity_graph_jaccard, entity_graph_2hop_traversal, entity_graph_entitygraphjson [INFERRED 0.75]

## Communities (26 total, 10 thin omitted)

### Community 0 - "Entity Graph & Data Loading"
Cohesion: 0.19
Nodes (17): addBidirectionalEdge(), buildEntityGraph(), loadData(), readJson(), loadPageIndex(), computeEntitySet(), computeRelatedPages(), jaccardSimilarity() (+9 more)

### Community 1 - "Page Computation & Content Rules"
Cohesion: 0.1
Nodes (21): compute-pages main, Content Engine Rules, Canonical Keys, MIN_TOOLS Thresholds, loadTopicalClusters, TopicalClustersIndex interface, groupByType, HomePage component (+13 more)

### Community 2 - "Frontend Page Rendering"
Cohesion: 0.18
Nodes (14): Hybrid Rendering Strategy, HIGH_PRIORITY_TYPES, loadAllPageMeta(), loadHighPrioritySlugs(), loadPageBySlug(), NotFound component, loadAllPageMeta, loadHighPrioritySlugs (+6 more)

### Community 3 - "Graph & Generation Pipeline"
Cohesion: 0.15
Nodes (17): compute-graph main, addBidirectionalEdge, buildEntityGraph, generate-pages main, loadData, readJson, loadPageIndex, computeEntitySet (+9 more)

### Community 4 - "Page Rules"
Cohesion: 0.27
Nodes (13): buildPageDefinition(), sectionsFor(), alternativesPages(), applyAllRules(), audienceCategoryPages(), audienceUseCasePages(), categoryPages(), comparisonPages() (+5 more)

### Community 5 - "LLM Narrative & Hardening"
Cohesion: 0.12
Nodes (16): Deterministic Content Factory architecture, buildPrompt, cacheKey, generateNarrative, Prompt-Aware Cache Key, LLM Production Hardening Plan, Retry with Exponential Backoff, readCache (+8 more)

### Community 6 - "Build Sequence & Page Builders"
Cohesion: 0.21
Nodes (15): Official Build Sequence, buildPageDefinition, sectionsFor, alternativesPages, applyAllRules, audienceCategoryPages, audienceUseCasePages, categoryPages (+7 more)

### Community 7 - "Markdown Rendering"
Cohesion: 0.29
Nodes (11): buildPrompt(), cacheKey(), generateNarrative(), readCache(), writeCache(), comparisonTableSection(), frontmatter(), relatedPagesSection() (+3 more)

### Community 8 - "Page Index & Validation"
Cohesion: 0.47
Nodes (9): buildPageIndex(), buildReport(), buildSitePlanSummary(), deduplicateCandidates(), validateCandidates(), writePageIndex(), writeReport(), writeSitePlanSummary() (+1 more)

### Community 10 - "Entity Graph Traversal (docs)"
Cohesion: 0.67
Nodes (4): 2-Hop Graph Traversal, entity-graph.json artifact, Jaccard Similarity (pageLinks), Entity Graph and Traversal

## Knowledge Gaps
- **43 isolated node(s):** `readJson`, `slugify`, `MIN_OVERLAP_SCORE`, `sectionsFor`, `buildPageIndex` (+38 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `compute-pages main` connect `Page Computation & Content Rules` to `Frontend Page Rendering`, `Graph & Generation Pipeline`, `Build Sequence & Page Builders`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Why does `loadAllPageMeta` connect `Frontend Page Rendering` to `Page Computation & Content Rules`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `generateNarrative` connect `LLM Narrative & Hardening` to `Page Computation & Content Rules`, `Build Sequence & Page Builders`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `compute-pages main` (e.g. with `PageDefinition` and `loadAllPageMeta`) actually correct?**
  _`compute-pages main` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `main()` (e.g. with `loadData()` and `applyAllRules()`) actually correct?**
  _`main()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `readJson`, `slugify`, `MIN_OVERLAP_SCORE` to the rest of the system?**
  _43 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Page Computation & Content Rules` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
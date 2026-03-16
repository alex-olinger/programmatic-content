# Entity Graph and Traversal

This document explains the entity graph artifact (`content/index/entity-graph.json`),
how it is structured, and how graph traversal extends what flat similarity scoring can do.

---

## What the Graph Represents

Every entity in the dataset becomes a **node**. Every cross-reference a tool declares
(its categories, audiences, use cases, features, price tiers, integrations, alternatives)
becomes an **edge**.

```
NODE TYPES
──────────
  tool:*          one per tool in tools.json
  category:*      one per entry in categories.json
  audience:*      one per entry in audiences.json
  use-case:*      one per entry in use-cases.json
  feature:*       one per entry in features.json
  price-tier:*    one per entry in price-tiers.json
  integration:*   one per entry in integrations.json

EDGE SOURCE
───────────
  Edges come exclusively from tool cross-references.
  Taxonomy nodes (category, audience, etc.) have no edges of their own —
  they gain edges only when a tool references them.
```

---

## Full Graph (Simplified — Writing + Video Subgraph)

```
                    category:writing
                   /    |    |    \
         tool:jasper  tool:copy-ai  tool:grammarly  tool:notion
                                                        |
                                                  use-case:note-taking
                                                        |
                                                   tool:otter-ai


                    category:video
                   /      |      \
          tool:descript  tool:runway  tool:synthesia
               |
          use-case:podcast-editing
               |
          tool:riverside-fm
```

Edges are **bidirectional** — following an edge from `tool:notion` to `category:writing`
is the same operation as following it from `category:writing` to `tool:notion`.

---

## Adjacency List Storage

The graph is stored as a flat map: each node lists only its **direct neighbors**.

```
entity-graph.json (excerpt)
─────────────────────────────────────────────────────

  "tool:notion": {
      edges: ["category:writing", "audience:creators",
              "use-case:note-taking", "price-tier:freemium",
              "tool:jasper"]          ← alternative tool edge
  }

  "category:writing": {
      edges: ["tool:notion", "tool:jasper", "tool:copy-ai",
              "tool:grammarly", "tool:chatgpt", "tool:beehiiv"]
  }

  "use-case:note-taking": {
      edges: ["tool:notion", "tool:otter-ai"]
  }
```

No tool-to-tool edges exist except via `alternatives[]` declarations.
All other tool-to-tool connections run through an intermediate taxonomy node.

---

## 1-Hop vs 2-Hop Traversal

### 1-Hop (direct neighbors only)

```
  START: tool:notion

  tool:notion
    ├── category:writing       (hop 1)
    ├── audience:creators      (hop 1)
    ├── use-case:note-taking   (hop 1)
    ├── price-tier:freemium    (hop 1)
    └── tool:jasper            (hop 1 — via alternatives[])

  Result: the taxonomy nodes and alternative tools Notion directly declares.
```

### 2-Hop (follow neighbors' neighbors)

```
  START: tool:notion

  tool:notion
    ├── category:writing ──────────────┬── tool:jasper        (hop 2)
    │                                  ├── tool:copy-ai       (hop 2)
    │                                  ├── tool:grammarly     (hop 2)
    │                                  ├── tool:chatgpt       (hop 2)
    │                                  └── tool:beehiiv       (hop 2)
    │
    ├── audience:creators ─────────────┬── tool:canva         (hop 2)
    │                                  ├── tool:buffer        (hop 2)
    │                                  └── tool:descript      (hop 2)
    │
    ├── use-case:note-taking ──────────└── tool:otter-ai      (hop 2)
    │
    └── price-tier:freemium ───────────┬── tool:grammarly     (hop 2)
                                       ├── tool:canva         (hop 2)
                                       └── tool:chatgpt       (hop 2)

  Result: every tool that shares at least one taxonomy node with Notion,
  even if no page directly pairs them.
```

---

## Why This Matters for Page Relatedness

The current `pageLinks.ts` uses **Jaccard similarity** on page entity sets.
It compares two pages' entity lists directly.

```
CURRENT APPROACH (Jaccard on page entity sets)
───────────────────────────────────────────────

  Page A: best-writing-tools
    entity set: { category:writing, tool:notion, tool:jasper, ... }

  Page B: notion (tool-detail)
    entity set: { tool:notion, category:writing, ... }

  Jaccard = |intersection| / |union|
          = high score  ✓  (they share tool:notion and category:writing)


  Page C: best-image-tools-for-creators
    entity set: { category:image, audience:creators, tool:canva, ... }

  Jaccard(notion vs C) = low score
    → notion is not on page C
    → only audience:creators overlaps (if notion declares it)
    → page C is not surfaced as related to notion   ✗
```

With 2-hop traversal, page C is reachable:

```
2-HOP TRAVERSAL APPROACH
─────────────────────────

  tool:notion
    └── audience:creators          (hop 1)
          └── tool:canva           (hop 2)
                └── best-image-tools-for-creators   ← page exists for canva

  Result: best-image-tools-for-creators is now reachable from notion
  because they share a common intermediate node (audience:creators),
  even though notion does not appear on that page.
```

---

## Comparison: Jaccard vs Graph Traversal

```
                        JACCARD              2-HOP TRAVERSAL
                        ───────────────────────────────────────
  Input                 two page entity sets  entity graph + start node
  Finds                 shared entities       shared intermediate nodes
  Notion → writing page HIGH score            also reachable
  Notion → image page   LOW / zero score      reachable via audience:creators
  Computation           O(n²) pairwise        O(degree²) per node
  Current status        implemented           not yet implemented
  Artifact used         page-definitions.json entity-graph.json
```

---

## Current Status in This Codebase

`entity-graph.json` is built and stored by `compute-graph.ts` but has no active
consumer yet. The related-pages feature uses Jaccard only.

The graph is ready for traversal — a future `computeRelatedByTraversal(slug, hops)`
function would:

1. Load `entity-graph.json`
2. Start at `tool:<slug>` (or whichever node type)
3. Walk N hops, collecting all reachable tool nodes
4. Look up which pages contain those tools via `page-definitions.json`
5. Rank by hop distance (closer = more related)

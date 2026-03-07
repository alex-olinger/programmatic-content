# Code Walkthrough: pageRules.ts — categoryPages()

## Overview

`categoryPages()` is the first rule function in `pageRules.ts`. Its job is to
produce a list of page definition **candidates** for category pages
(e.g. `best-writing-tools`). It does not decide if those candidates are strong
enough to publish — that happens later in `validateCandidates()` in `pageIndex.ts`.

```ts
export function categoryPages(dataset: Dataset): PageDefinition[] {
  return dataset.categories.flatMap((cat) => {
    const tools = dataset.tools.filter((t) => t.categories.includes(cat.id));
    if (tools.length < 1) return [];
    return [buildPageDefinition({
      slug: `best-${cat.slug}-tools`,
      pageType: 'category',
      title: `Best ${cat.name} AI Tools`,
      description: `The best AI ${cat.name.toLowerCase()} tools compared and reviewed.`,
      canonicalKey: `category|${cat.id}`,
      matchedToolIds: tools.map((t) => t.id),
      categories: [cat.id],
    })];
  });
}
```

---

## Execution Order

The code runs inside-out — deepest expressions first:

```ts
return dataset.categories.flatMap((cat) => {                    // runs 3rd — collects all iterations
  const tools = dataset.tools.filter((t) =>                     // runs 2nd — per category
    t.categories.includes(cat.id)                               // runs 1st — per tool
  );
  if (tools.length < 1) return [];                              // runs 2nd — after filter resolves
  return [buildPageDefinition({                                  // runs 2nd — after filter resolves
    slug: `best-${cat.slug}-tools`,
    pageType: 'category',
    title: `Best ${cat.name} AI Tools`,
    description: `The best AI ${cat.name.toLowerCase()} tools compared and reviewed.`,
    canonicalKey: `category|${cat.id}`,
    matchedToolIds: tools.map((t) => t.id),                     // runs 2nd — after filter resolves
    categories: [cat.id],
  })];
});
```

---

## Step-by-Step Breakdown

### 1. `t.categories.includes(cat.id)` — runs first, per tool

The innermost expression. For each tool `t`, checks whether the tool's
`categories` array contains the current category's ID. Returns `true` or `false`.

```
cat.id = "writing"

tool: notion      t.categories = ["productivity", "writing"]      → true  ✓
tool: jasper      t.categories = ["writing"]                       → true  ✓
tool: copy-ai     t.categories = ["writing"]                       → true  ✓
tool: descript    t.categories = ["video", "productivity"]         → false ✗
tool: synthesia   t.categories = ["video"]                         → false ✗
tool: otter-ai    t.categories = ["productivity", "transcription"] → false ✗
```

`.includes()` is the filter rule — it decides keep or drop for each tool.

---

### 2. `dataset.tools.filter((t) => ...)` — runs second, per category

`filter` iterates every tool in the dataset and collects those where the
condition returned `true`. The result is a new array containing only the
matching tools.

- `filter` handles the iteration — you don't write the loop
- `(t)` is just the name for the current tool on each pass — could be named anything
- With 6 tools and 4 categories, `filter` runs 24 total checks (6 × 4)

After `filter` resolves, the rest of the arrow function body executes with
the resulting `tools` array.

---

### 3. `if (tools.length < 1) return []` — candidacy gate

If no tools matched this category, skip it. Returning `[]` to `flatMap`
means nothing is added to the output for this iteration.

This is a **candidacy gate** (>= 1 tool), not the **validity threshold** (>= 3).
Categories with 1 or 2 tools still become candidates — they are rejected
later by `validateCandidates()` in `pageIndex.ts`, not here.

---

### 4. `return [buildPageDefinition({ ... })]` — build the candidate

Constructs the page definition for this category. Wrapped in `[...]` because
`flatMap` expects an array from each iteration.

Key fields:
- `slug` — URL-safe page identifier, e.g. `best-writing-tools`
- `canonicalKey` — semantic identity, e.g. `category|writing` — used by
  `deduplicateCandidates()` to prevent duplicate meaning
- `matchedToolIds` — the tool IDs found by `filter`, e.g. `['notion', 'jasper', 'copy-ai']`
- `categories` — which taxonomy entity this page is about

`buildPageDefinition` fills in the rest: `id`, `sourceRule`, `supportCount`,
`sections`, `isValid: true`, `warnings: []`.

---

### 5. `dataset.categories.flatMap(...)` — runs last, collects everything

`flatMap` is the outer loop — it runs once per category (4 iterations).
It collects every `[]` or `[def]` returned by the arrow function and
flattens them into one array:

```
iteration: writing       → [def]
iteration: video         → [def]
iteration: productivity  → [def]
iteration: transcription → [def]

flatMap result: [def, def, def, def]
```

If `.map()` were used instead, the result would be nested: `[[def], [def], ...]`.
`flatMap` unwraps those one level so the caller receives a flat `PageDefinition[]`.

---

## What Happens Next

The returned candidates flow into `applyAllRules()`, which merges candidates
from all 9 rule functions into one array. That array then goes to
`validateCandidates()` in `pageIndex.ts`, which applies the real threshold:

```ts
// MIN_TOOLS.category = 3
if (def.supportCount < minTools) {
  return { ...def, isValid: false, rejectionReason: `below minimum: ...` };
}
```

With the current dataset, `best-video-tools` (2 tools) and
`best-transcription-tools` (1 tool) are both rejected at this stage.
`categoryPages` itself never sees that — it only finds candidates.

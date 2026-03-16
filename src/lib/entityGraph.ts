import type { Dataset } from '../types/entities.js'; // full dataset shape for graph input

/** EntityNode represents one node in the adjacency-list graph */
export interface EntityNode {
  key: string; // composite key in "type:id" format, e.g. "tool:notion"
  entityType: string; // node category: "tool", "category", "audience", "use-case", "feature", "price-tier", "integration"
  entityId: string; // the bare entity id, e.g. "notion"
  name: string; // human-readable display name for this node
  edges: string[]; // keys of directly connected nodes (bidirectional)
}

/** EntityGraph is the full adjacency-list graph with metadata */
export interface EntityGraph {
  generatedAt: string; // ISO timestamp of when this graph was built
  nodeCount: number; // total number of nodes in the graph
  edgeCount: number; // total number of unique undirected edges
  nodes: Record<string, EntityNode>; // node key → node data
}

/** addBidirectionalEdge adds an edge between two nodes in both directions */
function addBidirectionalEdge(nodes: Record<string, EntityNode>, keyA: string, keyB: string): void {
  if (!nodes[keyA] || !nodes[keyB]) return; // skip if either node is missing (missing taxonomy entry)
  if (!nodes[keyA].edges.includes(keyB)) nodes[keyA].edges.push(keyB); // add A→B if not already present
  if (!nodes[keyB].edges.includes(keyA)) nodes[keyB].edges.push(keyA); // add B→A if not already present
}

/** buildEntityGraph constructs an adjacency-list graph from all entities in the dataset */
export function buildEntityGraph(dataset: Dataset): EntityGraph {
  const nodes: Record<string, EntityNode> = {}; // keyed node store, built incrementally

  // Register all taxonomy entity types as nodes before processing tool edges
  for (const cat of dataset.categories) {
    const key = `category:${cat.id}`; // composite key for categories
    nodes[key] = { key, entityType: 'category', entityId: cat.id, name: cat.name, edges: [] }; // create category node
  }
  for (const aud of dataset.audiences) {
    const key = `audience:${aud.id}`; // composite key for audiences
    nodes[key] = { key, entityType: 'audience', entityId: aud.id, name: aud.name, edges: [] }; // create audience node
  }
  for (const uc of dataset.useCases) {
    const key = `use-case:${uc.id}`; // composite key for use cases
    nodes[key] = { key, entityType: 'use-case', entityId: uc.id, name: uc.name, edges: [] }; // create use-case node
  }
  for (const feat of dataset.features) {
    const key = `feature:${feat.id}`; // composite key for features
    nodes[key] = { key, entityType: 'feature', entityId: feat.id, name: feat.name, edges: [] }; // create feature node
  }
  for (const pt of dataset.priceTiers) {
    const key = `price-tier:${pt.id}`; // composite key for price tiers
    nodes[key] = { key, entityType: 'price-tier', entityId: pt.id, name: pt.name, edges: [] }; // create price-tier node
  }
  for (const integ of dataset.integrations) {
    const key = `integration:${integ.id}`; // composite key for integrations
    nodes[key] = { key, entityType: 'integration', entityId: integ.id, name: integ.name, edges: [] }; // create integration node
  }

  // Register tool nodes and wire edges to all referenced taxonomy entities
  for (const tool of dataset.tools) {
    const toolKey = `tool:${tool.id}`; // composite key for this tool
    nodes[toolKey] = { key: toolKey, entityType: 'tool', entityId: tool.id, name: tool.name, edges: [] }; // create tool node

    // Connect tool to each of its taxonomy references via bidirectional edges
    for (const catId of tool.categories) addBidirectionalEdge(nodes, toolKey, `category:${catId}`); // tool ↔ category
    for (const audId of tool.audiences) addBidirectionalEdge(nodes, toolKey, `audience:${audId}`); // tool ↔ audience
    for (const ucId of tool.useCases) addBidirectionalEdge(nodes, toolKey, `use-case:${ucId}`); // tool ↔ use-case
    for (const featId of tool.features) addBidirectionalEdge(nodes, toolKey, `feature:${featId}`); // tool ↔ feature
    for (const ptId of tool.priceTiers) addBidirectionalEdge(nodes, toolKey, `price-tier:${ptId}`); // tool ↔ price-tier
    for (const integId of tool.integrations) addBidirectionalEdge(nodes, toolKey, `integration:${integId}`); // tool ↔ integration
    for (const altId of tool.alternatives) addBidirectionalEdge(nodes, toolKey, `tool:${altId}`); // tool ↔ alternative tool
  }

  // Count unique undirected edges: sum all edge lists then halve (each edge counted twice)
  const totalDirected = Object.values(nodes).reduce((sum, node) => sum + node.edges.length, 0); // sum of all directed adjacencies
  const edgeCount = Math.floor(totalDirected / 2); // divide by 2 to get unique undirected edges

  return {
    generatedAt: new Date().toISOString(), // timestamp for cache-busting and audit trail
    nodeCount: Object.keys(nodes).length, // total nodes across all entity types
    edgeCount, // unique undirected edge count
    nodes, // full adjacency list keyed by composite key
  };
}

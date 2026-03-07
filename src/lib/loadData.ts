import fs from 'fs';
import path from 'path';
import type { Dataset, Tool, Category, Audience, UseCase, Feature, PriceTier, Integration } from '../types/entities.js';

function readJson<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

export function loadData(contentRoot: string): Dataset {
  const dataDir = path.join(contentRoot, 'data');
  const taxDir = path.join(dataDir, 'taxonomy');

  return {
    tools: readJson<Tool[]>(path.join(dataDir, 'tools', 'tools.json')),
    categories: readJson<Category[]>(path.join(taxDir, 'categories.json')),
    audiences: readJson<Audience[]>(path.join(taxDir, 'audiences.json')),
    useCases: readJson<UseCase[]>(path.join(taxDir, 'use-cases.json')),
    features: readJson<Feature[]>(path.join(taxDir, 'features.json')),
    priceTiers: readJson<PriceTier[]>(path.join(taxDir, 'price-tiers.json')),
    integrations: readJson<Integration[]>(path.join(taxDir, 'integrations.json')),
  };
}

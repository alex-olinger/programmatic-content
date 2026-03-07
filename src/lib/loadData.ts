import fs from 'fs';
import path from 'path';
import type { Dataset, Tool, Category, Audience, UseCase, Feature, PriceTier, Integration } from '../types/entities.js';

function readJson<T>(filePath: string): T {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf-8');
  } catch {
    throw new Error(`loadData: file not found or unreadable: ${filePath}`);
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`loadData: invalid JSON in file: ${filePath}`);
  }
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

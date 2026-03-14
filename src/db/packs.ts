import { getDB } from './schema.js';
import type { ContentPack } from '../types/content.js';

let seeded = false;

export async function seedDefaultPack(): Promise<void> {
  if (seeded) return;
  seeded = true;

  const db = await getDB();
  const existingPacks = await db.getAll('packs');
  if (existingPacks.length > 0) return;

  try {
    const resp = await fetch('/data/default-pack.json');
    if (!resp.ok) return;
    const pack: ContentPack = await resp.json();
    await db.put('packs', pack);
  } catch {
    // Offline or file not found — will seed on next launch
  }
}

export async function getAllPacks(): Promise<ContentPack[]> {
  const db = await getDB();
  return db.getAll('packs');
}

export async function getPack(id: string): Promise<ContentPack | undefined> {
  const db = await getDB();
  return db.get('packs', id);
}

export async function savePack(pack: ContentPack): Promise<void> {
  const db = await getDB();
  pack.updatedAt = Date.now();
  pack.version += 1;
  await db.put('packs', pack);
}

export async function deletePack(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('packs', id);
}

export async function createPack(name: string, author: string): Promise<ContentPack> {
  const pack: ContentPack = {
    id: crypto.randomUUID(),
    name,
    description: '',
    author,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    language: 'en-US',
    words: [],
    wordGroups: [],
    difficultyConfig: {
      correctStreakToLevelUp: 3,
      wrongStreakToLevelDown: 2,
      maxDifficulty: 10,
      minDifficulty: 1,
      targetSuccessRate: 0.7,
      itemsPerSession: 10,
      sessionTimeLimitSeconds: 600,
    },
    enabledActivities: ['sound-tap', 'word-flash', 'blend-builder'],
  };
  const db = await getDB();
  await db.put('packs', pack);
  return pack;
}

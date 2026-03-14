import { getDB } from './schema.js';
import type { Attempt, WordProgress, SessionRecord } from '../types/progress.js';

export async function saveAttempt(attempt: Attempt): Promise<void> {
  const db = await getDB();
  await db.put('attempts', attempt);
}

export async function getWordProgress(packId: string, wordId: string): Promise<WordProgress | undefined> {
  const db = await getDB();
  return db.get('progress', [packId, wordId]);
}

export async function getPackProgress(packId: string): Promise<WordProgress[]> {
  const db = await getDB();
  return db.getAllFromIndex('progress', 'by-pack', packId);
}

export async function saveWordProgress(progress: WordProgress): Promise<void> {
  const db = await getDB();
  await db.put('progress', progress);
}

export async function saveSession(session: SessionRecord): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

export async function getRecentSessions(limit: number = 10): Promise<SessionRecord[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('sessions', 'by-time');
  return all.slice(-limit).reverse();
}

export async function getPackSessions(packId: string): Promise<SessionRecord[]> {
  const db = await getDB();
  const all = await db.getAll('sessions');
  return all.filter(s => s.packId === packId);
}

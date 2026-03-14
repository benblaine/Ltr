import type { Word, ContentPack } from '../types/content.js';
import { getDB } from '../db/schema.js';

/**
 * Selects the next word for an activity session.
 * Priority: 1) due for review, 2) never seen, 3) low mastery
 * All filtered to difficulty ≤ currentDifficulty + 1
 */
export async function selectSessionWords(
  pack: ContentPack,
  currentDifficulty: number,
  count: number,
): Promise<Word[]> {
  const db = await getDB();
  const now = Date.now();
  const allProgress = await db.getAllFromIndex('progress', 'by-pack', pack.id);
  const progressMap = new Map(
    allProgress.map((p) => [`${p.packId}:${p.wordId}`, p]),
  );

  const eligible = pack.words.filter(
    (w) => w.difficulty <= currentDifficulty + 1,
  );

  const dueForReview: Word[] = [];
  const neverSeen: Word[] = [];
  const lowMastery: Word[] = [];

  for (const word of eligible) {
    const prog = progressMap.get(`${pack.id}:${word.id}`);
    if (!prog) {
      neverSeen.push(word);
    } else if (prog.nextReviewAt <= now && prog.masteryLevel < 5) {
      dueForReview.push(word);
    } else if (prog.masteryLevel < 3) {
      lowMastery.push(word);
    }
  }

  const session: Word[] = [];
  for (const bucket of [
    shuffle(dueForReview),
    shuffle(neverSeen),
    shuffle(lowMastery),
  ]) {
    for (const word of bucket) {
      if (session.length >= count) break;
      session.push(word);
    }
  }

  // Backfill if needed
  if (session.length < count) {
    const remaining = eligible.filter((w) => !session.includes(w));
    session.push(...shuffle(remaining).slice(0, count - session.length));
  }

  return shuffle(session);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

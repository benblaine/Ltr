import type { WordProgress, AttemptResult } from '../types/progress.js';
import { getDB } from '../db/schema.js';

/**
 * Mastery levels:
 * 0 — Never seen
 * 1 — Seen, not yet correct
 * 2 — Correct once
 * 3 — Correct in 2+ sessions
 * 4 — Correct after 3+ day gap
 * 5 — Mastered (long-term review only)
 */

const REVIEW_INTERVALS_MS: Record<number, number> = {
  0: 0,
  1: 1 * 60 * 60 * 1000,
  2: 24 * 60 * 60 * 1000,
  3: 3 * 24 * 60 * 60 * 1000,
  4: 7 * 24 * 60 * 60 * 1000,
  5: 30 * 24 * 60 * 60 * 1000,
};

export async function updateMastery(
  packId: string,
  wordId: string,
  result: AttemptResult,
): Promise<WordProgress> {
  const db = await getDB();
  const isCorrect = result === 'correct' || result === 'self-correct';
  const now = Date.now();

  let progress = await db.get('progress', [packId, wordId]);

  if (!progress) {
    progress = {
      packId,
      wordId,
      masteryLevel: 0,
      lastAttempted: now,
      lastCorrect: 0,
      totalAttempts: 0,
      totalCorrect: 0,
      correctStreak: 0,
      nextReviewAt: now,
    };
  }

  progress.lastAttempted = now;
  progress.totalAttempts += 1;

  if (isCorrect) {
    progress.totalCorrect += 1;
    progress.correctStreak += 1;
    progress.lastCorrect = now;

    if (progress.masteryLevel === 0) {
      progress.masteryLevel = 2;
    } else if (progress.masteryLevel < 5) {
      const daysSince =
        progress.lastCorrect > 0
          ? (now - progress.lastCorrect) / (24 * 60 * 60 * 1000)
          : 0;
      if (progress.masteryLevel === 2 && progress.correctStreak >= 2)
        progress.masteryLevel = 3;
      else if (progress.masteryLevel === 3 && daysSince >= 3)
        progress.masteryLevel = 4;
      else if (progress.masteryLevel === 4 && daysSince >= 7)
        progress.masteryLevel = 5;
    }
  } else {
    progress.correctStreak = 0;
    if (progress.masteryLevel > 1) progress.masteryLevel -= 1;
    else if (progress.masteryLevel === 0) progress.masteryLevel = 1;
  }

  progress.nextReviewAt =
    now + (REVIEW_INTERVALS_MS[progress.masteryLevel] || 0);
  await db.put('progress', progress);
  return progress;
}

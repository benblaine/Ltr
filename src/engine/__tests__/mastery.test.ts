import { describe, it, expect, vi, beforeEach } from 'vitest';

const store = new Map<string, unknown>();

vi.mock('../../db/schema.js', () => ({
  getDB: vi.fn().mockResolvedValue({
    get: vi.fn((_storeName: string, key: [string, string]) => {
      return Promise.resolve(store.get(key.join(':')));
    }),
    put: vi.fn((_storeName: string, value: { packId: string; wordId: string }) => {
      store.set(`${value.packId}:${value.wordId}`, structuredClone(value));
      return Promise.resolve();
    }),
  }),
}));

import { updateMastery } from '../mastery.js';

beforeEach(() => {
  store.clear();
});

describe('updateMastery', () => {
  it('creates new progress record on first attempt (correct)', async () => {
    const progress = await updateMastery('pack1', 'word1', 'correct');
    expect(progress.packId).toBe('pack1');
    expect(progress.wordId).toBe('word1');
    expect(progress.masteryLevel).toBe(2);
    expect(progress.totalAttempts).toBe(1);
    expect(progress.totalCorrect).toBe(1);
    expect(progress.correctStreak).toBe(1);
  });

  it('creates new progress record on first attempt (incorrect)', async () => {
    const progress = await updateMastery('pack1', 'word1', 'incorrect');
    expect(progress.masteryLevel).toBe(1);
    expect(progress.totalAttempts).toBe(1);
    expect(progress.totalCorrect).toBe(0);
    expect(progress.correctStreak).toBe(0);
  });

  it('treats self-correct as correct', async () => {
    const progress = await updateMastery('pack1', 'word1', 'self-correct');
    expect(progress.masteryLevel).toBe(2);
    expect(progress.totalCorrect).toBe(1);
  });

  it('treats self-incorrect as incorrect', async () => {
    const progress = await updateMastery('pack1', 'word1', 'self-incorrect');
    expect(progress.masteryLevel).toBe(1);
    expect(progress.totalCorrect).toBe(0);
  });

  it('resets correctStreak on incorrect answer', async () => {
    await updateMastery('pack1', 'word1', 'correct');
    const progress = await updateMastery('pack1', 'word1', 'incorrect');
    expect(progress.correctStreak).toBe(0);
  });

  it('decreases mastery on incorrect (but not below 1 if already seen)', async () => {
    await updateMastery('pack1', 'word1', 'correct');
    const progress = await updateMastery('pack1', 'word1', 'incorrect');
    expect(progress.masteryLevel).toBe(1);
  });

  it('sets nextReviewAt based on mastery level', async () => {
    const before = Date.now();
    const progress = await updateMastery('pack1', 'word1', 'correct');
    // Mastery 2 → 24h review interval
    expect(progress.nextReviewAt).toBeGreaterThanOrEqual(before + 24 * 60 * 60 * 1000 - 100);
  });
});

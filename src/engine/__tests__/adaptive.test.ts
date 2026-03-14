import { describe, it, expect } from 'vitest';
import { adjustDifficulty, type AdaptiveState } from '../adaptive.js';

function makeState(overrides: Partial<AdaptiveState> = {}): AdaptiveState {
  return {
    difficultyLevel: 3,
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    ...overrides,
  };
}

describe('adjustDifficulty', () => {
  it('increments consecutiveCorrect on correct answer', () => {
    const result = adjustDifficulty(makeState(), true);
    expect(result.consecutiveCorrect).toBe(1);
    expect(result.consecutiveWrong).toBe(0);
  });

  it('increments consecutiveWrong on wrong answer', () => {
    const result = adjustDifficulty(makeState(), false);
    expect(result.consecutiveWrong).toBe(1);
    expect(result.consecutiveCorrect).toBe(0);
  });

  it('levels up after 3 consecutive correct (default config)', () => {
    const state = makeState({ consecutiveCorrect: 2 });
    const result = adjustDifficulty(state, true);
    expect(result.difficultyLevel).toBe(4);
    expect(result.consecutiveCorrect).toBe(0);
  });

  it('levels down after 2 consecutive wrong (default config)', () => {
    const state = makeState({ consecutiveWrong: 1 });
    const result = adjustDifficulty(state, false);
    expect(result.difficultyLevel).toBe(2);
    expect(result.consecutiveWrong).toBe(0);
  });

  it('does not exceed maxDifficulty', () => {
    const state = makeState({ difficultyLevel: 10, consecutiveCorrect: 2 });
    const result = adjustDifficulty(state, true);
    expect(result.difficultyLevel).toBe(10);
    expect(result.consecutiveCorrect).toBe(3);
  });

  it('does not go below minDifficulty', () => {
    const state = makeState({ difficultyLevel: 1, consecutiveWrong: 1 });
    const result = adjustDifficulty(state, false);
    expect(result.difficultyLevel).toBe(1);
    expect(result.consecutiveWrong).toBe(2);
  });

  it('resets consecutiveWrong on correct answer', () => {
    const state = makeState({ consecutiveWrong: 1 });
    const result = adjustDifficulty(state, true);
    expect(result.consecutiveWrong).toBe(0);
    expect(result.consecutiveCorrect).toBe(1);
  });

  it('resets consecutiveCorrect on wrong answer', () => {
    const state = makeState({ consecutiveCorrect: 2 });
    const result = adjustDifficulty(state, false);
    expect(result.consecutiveCorrect).toBe(0);
    expect(result.consecutiveWrong).toBe(1);
  });

  it('respects custom config thresholds', () => {
    const config = {
      correctStreakToLevelUp: 5,
      wrongStreakToLevelDown: 3,
      maxDifficulty: 10,
      minDifficulty: 1,
      targetSuccessRate: 0.7,
      itemsPerSession: 10,
      sessionTimeLimitSeconds: 600,
    };
    const state = makeState({ consecutiveCorrect: 4 });
    const result = adjustDifficulty(state, true, config);
    expect(result.difficultyLevel).toBe(4);
    expect(result.consecutiveCorrect).toBe(0);
  });
});

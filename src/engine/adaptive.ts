import type { DifficultyConfig } from '../types/content.js';

const DEFAULT_CONFIG: DifficultyConfig = {
  correctStreakToLevelUp: 3,
  wrongStreakToLevelDown: 2,
  maxDifficulty: 10,
  minDifficulty: 1,
  targetSuccessRate: 0.7,
  itemsPerSession: 10,
  sessionTimeLimitSeconds: 600,
};

export interface AdaptiveState {
  difficultyLevel: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
}

export function adjustDifficulty(
  state: AdaptiveState,
  wasCorrect: boolean,
  config: DifficultyConfig = DEFAULT_CONFIG,
): AdaptiveState {
  let { difficultyLevel, consecutiveCorrect, consecutiveWrong } = state;

  if (wasCorrect) {
    consecutiveCorrect += 1;
    consecutiveWrong = 0;
    if (
      consecutiveCorrect >= config.correctStreakToLevelUp &&
      difficultyLevel < config.maxDifficulty
    ) {
      difficultyLevel += 1;
      consecutiveCorrect = 0;
    }
  } else {
    consecutiveWrong += 1;
    consecutiveCorrect = 0;
    if (
      consecutiveWrong >= config.wrongStreakToLevelDown &&
      difficultyLevel > config.minDifficulty
    ) {
      difficultyLevel -= 1;
      consecutiveWrong = 0;
    }
  }

  return { difficultyLevel, consecutiveCorrect, consecutiveWrong };
}

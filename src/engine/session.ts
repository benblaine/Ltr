import type { ActivityType, DifficultyConfig } from '../types/content.js';
import type { SessionRecord, Attempt, AttemptResult } from '../types/progress.js';
import { saveAttempt } from '../db/progress.js';
import { saveSession } from '../db/progress.js';
import { updateMastery } from './mastery.js';
import { adjustDifficulty, type AdaptiveState } from './adaptive.js';

const DEFAULT_CONFIG: DifficultyConfig = {
  correctStreakToLevelUp: 3,
  wrongStreakToLevelDown: 2,
  maxDifficulty: 10,
  minDifficulty: 1,
  targetSuccessRate: 0.7,
  itemsPerSession: 10,
  sessionTimeLimitSeconds: 600,
};

export interface SessionState {
  id: string;
  packId: string;
  activityType: ActivityType;
  startTime: number;
  wordsAttempted: number;
  wordsCorrect: number;
  adaptive: AdaptiveState;
  config: DifficultyConfig;
  isComplete: boolean;
}

export function startSession(
  packId: string,
  activityType: ActivityType,
  currentDifficulty: number,
  config?: DifficultyConfig,
): SessionState {
  return {
    id: crypto.randomUUID(),
    packId,
    activityType,
    startTime: Date.now(),
    wordsAttempted: 0,
    wordsCorrect: 0,
    adaptive: {
      difficultyLevel: currentDifficulty,
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
    },
    config: config ?? DEFAULT_CONFIG,
    isComplete: false,
  };
}

export async function recordAttempt(
  session: SessionState,
  wordId: string,
  result: AttemptResult,
  confidence: number,
  durationMs: number,
  audioBlob?: Blob,
): Promise<SessionState> {
  const isCorrect = result === 'correct' || result === 'self-correct';

  const attempt: Attempt = {
    id: crypto.randomUUID(),
    packId: session.packId,
    wordId,
    activityType: session.activityType,
    result,
    confidence,
    timestamp: Date.now(),
    durationMs,
    audioBlob,
    synced: false,
  };

  await saveAttempt(attempt);
  await updateMastery(session.packId, wordId, result);

  const updated = { ...session };
  updated.wordsAttempted += 1;
  if (isCorrect) updated.wordsCorrect += 1;

  updated.adaptive = adjustDifficulty(
    updated.adaptive,
    isCorrect,
    updated.config,
  );

  const elapsed = (Date.now() - session.startTime) / 1000;
  if (
    updated.wordsAttempted >= updated.config.itemsPerSession ||
    elapsed >= updated.config.sessionTimeLimitSeconds
  ) {
    updated.isComplete = true;
  }

  return updated;
}

export function computeStars(session: SessionState): number {
  if (session.wordsAttempted === 0) return 0;
  const rate = session.wordsCorrect / session.wordsAttempted;
  if (rate >= 0.9) return 3;
  if (rate >= 0.7) return 2;
  if (rate >= 0.5) return 1;
  return 0;
}

export async function endSession(session: SessionState): Promise<SessionRecord> {
  const record: SessionRecord = {
    id: session.id,
    packId: session.packId,
    activityType: session.activityType,
    startTime: session.startTime,
    endTime: Date.now(),
    wordsAttempted: session.wordsAttempted,
    wordsCorrect: session.wordsCorrect,
    starsEarned: computeStars(session),
    difficultyStart: session.adaptive.difficultyLevel,
    difficultyEnd: session.adaptive.difficultyLevel,
  };

  await saveSession(record);
  return record;
}

export function shouldSuggestBreak(session: SessionState): boolean {
  const elapsed = (Date.now() - session.startTime) / 1000;
  return (
    session.wordsAttempted >= session.config.itemsPerSession ||
    elapsed >= session.config.sessionTimeLimitSeconds
  );
}

import type { ActivityType } from './content.js';

export type AttemptResult =
  | 'correct'
  | 'incorrect'
  | 'self-correct'
  | 'self-incorrect';

export interface Attempt {
  id: string;
  packId: string;
  wordId: string;
  activityType: ActivityType;
  result: AttemptResult;
  confidence: number;
  timestamp: number;
  durationMs: number;
  audioBlob?: Blob;
  synced: boolean;
}

export interface WordProgress {
  packId: string;
  wordId: string;
  masteryLevel: number;
  lastAttempted: number;
  lastCorrect: number;
  totalAttempts: number;
  totalCorrect: number;
  correctStreak: number;
  nextReviewAt: number;
}

export interface SessionRecord {
  id: string;
  packId: string;
  activityType: ActivityType;
  startTime: number;
  endTime: number;
  wordsAttempted: number;
  wordsCorrect: number;
  starsEarned: number;
  difficultyStart: number;
  difficultyEnd: number;
}

export interface PlayerProfile {
  id: string;
  name: string;
  avatarEmoji: string;
  activePackId: string;
  currentDifficulty: number;
  placementComplete: boolean;
  placementBand: number;
  totalStars: number;
  createdAt: number;
}

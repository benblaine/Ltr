import type { Word } from './content.js';

export type Phase = 'intro' | 'demonstrate' | 'guided' | 'independent' | 'celebrate';

export interface ActivityState {
  phase: Phase;
  currentItemIndex: number;
  items: ActivityItem[];
  difficultyLevel: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  totalAttempts: number;
  totalCorrect: number;
  starsEarned: number;
  isListening: boolean;
  showHint: boolean;
  showCelebration: boolean;
  feedbackType: 'none' | 'correct' | 'incorrect' | 'hint';
}

export interface ActivityItem {
  word: Word;
  distractors?: Word[];
  hints: string[];
  maxAttempts: number;
  attemptCount: number;
}

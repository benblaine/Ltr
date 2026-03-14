export type WordCategory =
  | 'letter'
  | 'cvc'
  | 'ccvc'
  | 'cvcc'
  | 'digraph'
  | 'blend'
  | 'long-vowel'
  | 'vowel-team'
  | 'r-controlled'
  | 'sight-word'
  | 'multisyllable';

export type ActivityType =
  | 'sound-tap'
  | 'word-flash'
  | 'blend-builder'
  | 'story-read'
  | 'sight-sprint';

export interface Word {
  id: string;
  text: string;
  phonemes: string[];
  displayPhonemes: string[];
  category: WordCategory;
  difficulty: number;
  imageEmoji: string;
  imageUrl?: string;
  audioHint?: string;
  tags: string[];
  sightWord: boolean;
  notes?: string;
}

export interface WordGroup {
  id: string;
  name: string;
  description?: string;
  wordIds: string[];
  order: number;
}

export interface DifficultyConfig {
  correctStreakToLevelUp: number;
  wrongStreakToLevelDown: number;
  maxDifficulty: number;
  minDifficulty: number;
  targetSuccessRate: number;
  itemsPerSession: number;
  sessionTimeLimitSeconds: number;
}

export interface ContentPack {
  id: string;
  name: string;
  description: string;
  author: string;
  createdAt: number;
  updatedAt: number;
  version: number;
  language: string;

  words: Word[];
  wordGroups: WordGroup[];
  difficultyConfig: DifficultyConfig;
  enabledActivities: ActivityType[];
}

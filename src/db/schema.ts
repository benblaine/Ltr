import { openDB, type DBSchema } from 'idb';
import type { ContentPack } from '../types/content.js';
import type { Attempt, WordProgress, SessionRecord, PlayerProfile } from '../types/progress.js';

interface ReadVoiceDB extends DBSchema {
  packs: {
    key: string;
    value: ContentPack;
    indexes: { 'by-updated': number };
  };
  progress: {
    key: [string, string];
    value: WordProgress;
    indexes: {
      'by-mastery': number;
      'by-next-review': number;
      'by-pack': string;
    };
  };
  attempts: {
    key: string;
    value: Attempt;
    indexes: {
      'by-word': [string, string];
      'by-timestamp': number;
      'by-synced': number;
    };
  };
  sessions: {
    key: string;
    value: SessionRecord;
    indexes: { 'by-time': number };
  };
  profiles: {
    key: string;
    value: PlayerProfile;
  };
}

export type { ReadVoiceDB };

export async function getDB() {
  return openDB<ReadVoiceDB>('readvoice', 1, {
    upgrade(db) {
      const packs = db.createObjectStore('packs', { keyPath: 'id' });
      packs.createIndex('by-updated', 'updatedAt');

      const progress = db.createObjectStore('progress', {
        keyPath: ['packId', 'wordId'],
      });
      progress.createIndex('by-mastery', 'masteryLevel');
      progress.createIndex('by-next-review', 'nextReviewAt');
      progress.createIndex('by-pack', 'packId');

      const attempts = db.createObjectStore('attempts', { keyPath: 'id' });
      attempts.createIndex('by-word', ['packId', 'wordId']);
      attempts.createIndex('by-timestamp', 'timestamp');
      attempts.createIndex('by-synced', 'synced');

      const sessions = db.createObjectStore('sessions', { keyPath: 'id' });
      sessions.createIndex('by-time', 'startTime');

      db.createObjectStore('profiles', { keyPath: 'id' });
    },
  });
}

import { describe, it, expect } from 'vitest';
import { validatePack } from '../PackValidator.js';
import type { ContentPack, Word } from '../../types/content.js';

function makeWord(overrides: Partial<Word> = {}): Word {
  return {
    id: 'w1',
    text: 'cat',
    phonemes: ['k', 'æ', 't'],
    displayPhonemes: ['c', 'a', 't'],
    category: 'cvc',
    difficulty: 2,
    imageEmoji: '🐱',
    tags: ['animals'],
    sightWord: false,
    ...overrides,
  };
}

function makePack(overrides: Partial<ContentPack> = {}): ContentPack {
  return {
    id: 'p1',
    name: 'Test Pack',
    description: 'A test pack',
    author: 'Tester',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    language: 'en-US',
    words: [makeWord()],
    wordGroups: [],
    difficultyConfig: {
      correctStreakToLevelUp: 3,
      wrongStreakToLevelDown: 2,
      maxDifficulty: 10,
      minDifficulty: 1,
      targetSuccessRate: 0.7,
      itemsPerSession: 10,
      sessionTimeLimitSeconds: 600,
    },
    enabledActivities: ['sound-tap', 'word-flash'],
    ...overrides,
  };
}

describe('validatePack', () => {
  it('returns no issues for a valid pack', () => {
    const issues = validatePack(makePack());
    expect(issues.filter(i => i.severity === 'error')).toHaveLength(0);
  });

  it('errors when pack name is empty', () => {
    const issues = validatePack(makePack({ name: '' }));
    const nameErrors = issues.filter(i => i.field === 'name' && i.severity === 'error');
    expect(nameErrors).toHaveLength(1);
  });

  it('errors when pack has no words', () => {
    const issues = validatePack(makePack({ words: [] }));
    const wordErrors = issues.filter(i => i.field === 'words' && i.severity === 'error');
    expect(wordErrors).toHaveLength(1);
  });

  it('errors when word text is empty', () => {
    const issues = validatePack(makePack({
      words: [makeWord({ text: '' })],
    }));
    const textErrors = issues.filter(i => i.field === 'text' && i.severity === 'error');
    expect(textErrors).toHaveLength(1);
  });

  it('warns on duplicate words', () => {
    const issues = validatePack(makePack({
      words: [
        makeWord({ id: 'w1', text: 'cat' }),
        makeWord({ id: 'w2', text: 'cat' }),
      ],
    }));
    const dupeWarnings = issues.filter(i => i.severity === 'warning' && i.message.includes('Duplicate'));
    expect(dupeWarnings).toHaveLength(1);
  });

  it('errors when displayPhonemes is empty', () => {
    const issues = validatePack(makePack({
      words: [makeWord({ displayPhonemes: [] })],
    }));
    const phonemeErrors = issues.filter(i => i.field === 'displayPhonemes' && i.severity === 'error');
    expect(phonemeErrors).toHaveLength(1);
  });

  it('warns when displayPhonemes don\'t match text', () => {
    const issues = validatePack(makePack({
      words: [makeWord({ text: 'cat', displayPhonemes: ['c', 'a'] })],
    }));
    const phonemeWarnings = issues.filter(i => i.field === 'displayPhonemes' && i.severity === 'warning');
    expect(phonemeWarnings).toHaveLength(1);
  });

  it('errors when difficulty is out of range', () => {
    const issues = validatePack(makePack({
      words: [makeWord({ difficulty: 0 })],
    }));
    const diffErrors = issues.filter(i => i.field === 'difficulty' && i.severity === 'error');
    expect(diffErrors).toHaveLength(1);
  });

  it('warns when no easy words exist', () => {
    const issues = validatePack(makePack({
      words: [makeWord({ difficulty: 5 })],
    }));
    const diffWarnings = issues.filter(i => i.field === 'difficulty' && i.severity === 'warning' && i.message.includes('easy'));
    expect(diffWarnings).toHaveLength(1);
  });

  it('errors when group references unknown word', () => {
    const issues = validatePack(makePack({
      wordGroups: [{
        id: 'g1',
        name: 'Test Group',
        wordIds: ['unknown-id'],
        order: 1,
      }],
    }));
    const groupErrors = issues.filter(i => i.field === 'wordGroups' && i.severity === 'error');
    expect(groupErrors).toHaveLength(1);
  });

  it('warns when word has no emoji', () => {
    const issues = validatePack(makePack({
      words: [makeWord({ imageEmoji: '' })],
    }));
    const emojiWarnings = issues.filter(i => i.field === 'imageEmoji' && i.severity === 'warning');
    expect(emojiWarnings).toHaveLength(1);
  });
});

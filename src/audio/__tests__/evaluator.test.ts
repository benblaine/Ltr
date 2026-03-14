import { describe, it, expect } from 'vitest';
import { SpeechEvaluator } from '../evaluator.js';

describe('SpeechEvaluator', () => {
  describe('levenshtein', () => {
    // Access the method for testing (it's public in our implementation)
    const evaluator = new SpeechEvaluator();

    it('returns 0 for identical strings', () => {
      expect(evaluator.levenshtein('cat', 'cat')).toBe(0);
    });

    it('returns string length for empty comparison', () => {
      expect(evaluator.levenshtein('', 'cat')).toBe(3);
      expect(evaluator.levenshtein('cat', '')).toBe(3);
    });

    it('returns 1 for single character difference', () => {
      expect(evaluator.levenshtein('cat', 'bat')).toBe(1);
      expect(evaluator.levenshtein('cat', 'car')).toBe(1);
      expect(evaluator.levenshtein('cat', 'cats')).toBe(1);
    });

    it('returns 2 for two character differences', () => {
      expect(evaluator.levenshtein('cat', 'bar')).toBe(2);
    });

    it('handles completely different strings', () => {
      expect(evaluator.levenshtein('abc', 'xyz')).toBe(3);
    });
  });

  describe('isSupported', () => {
    it('returns false when SpeechRecognition is not available', () => {
      const evaluator = new SpeechEvaluator();
      expect(evaluator.isSupported).toBe(false);
    });
  });

  describe('canDoASR', () => {
    it('returns false when not supported', () => {
      const evaluator = new SpeechEvaluator();
      expect(evaluator.canDoASR).toBe(false);
    });
  });

  describe('evaluate', () => {
    it('returns null when ASR is not available', async () => {
      const evaluator = new SpeechEvaluator();
      const result = await evaluator.evaluate('cat');
      expect(result).toBeNull();
    });
  });
});

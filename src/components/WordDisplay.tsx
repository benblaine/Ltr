import type { Word } from '../types/content.js';

interface WordDisplayProps {
  word: Word;
  showPhonemes?: boolean;
  highlightIndex?: number;
}

export function WordDisplay({ word, showPhonemes, highlightIndex }: WordDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {word.imageEmoji && (
        <span className="text-5xl">{word.imageEmoji}</span>
      )}
      <p
        className="text-[var(--text-learning)] font-bold"
        style={{ fontFamily: 'var(--font-learning)' }}
      >
        {word.text}
      </p>
      {showPhonemes && word.displayPhonemes.length > 0 && (
        <div className="flex gap-2">
          {word.displayPhonemes.map((p, i) => (
            <span
              key={i}
              className={`px-3 py-1 rounded-[var(--radius-sm)] text-[var(--text-ui-large)] font-bold ${
                highlightIndex === i
                  ? 'bg-[var(--accent-highlight)] text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
              }`}
              style={{ fontFamily: 'var(--font-learning)' }}
            >
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

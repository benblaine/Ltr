interface LetterTileProps {
  letter: string;
  selected?: boolean;
  placed?: boolean;
  correct?: boolean;
  onClick?: () => void;
}

export function LetterTile({ letter, selected, placed, correct, onClick }: LetterTileProps) {
  let bgColor = 'var(--bg-surface)';
  let borderColor = 'var(--bg-secondary)';

  if (correct) {
    bgColor = 'var(--accent-correct)';
    borderColor = 'var(--accent-correct)';
  } else if (selected) {
    bgColor = 'var(--interactive)';
    borderColor = 'var(--interactive)';
  } else if (placed) {
    bgColor = 'var(--accent-highlight)';
    borderColor = 'var(--accent-highlight)';
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center rounded-[var(--radius-md)] border-2 cursor-pointer transition-all active:scale-90 font-bold"
      style={{
        width: 'var(--tap-target-child)',
        height: 'var(--tap-target-child)',
        backgroundColor: bgColor,
        borderColor,
        color: selected || placed || correct ? 'white' : 'var(--text-primary)',
        fontFamily: 'var(--font-learning)',
        fontSize: 'var(--text-ui-large)',
      }}
    >
      {letter}
    </button>
  );
}

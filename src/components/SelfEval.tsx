interface SelfEvalProps {
  onResult: (correct: boolean) => void;
}

export function SelfEval({ onResult }: SelfEvalProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-[var(--text-ui)] text-[var(--text-secondary)] text-center" style={{ fontFamily: 'var(--font-ui)' }}>
        Did you read it right?
      </p>
      <div className="flex gap-6">
        <button
          onClick={() => onResult(true)}
          className="flex flex-col items-center gap-1 px-6 py-4 rounded-[var(--radius-lg)] bg-[var(--accent-correct)] text-white font-bold border-none cursor-pointer transition-transform active:scale-95"
          style={{ minWidth: 'var(--tap-target-child)', minHeight: 'var(--tap-target-child)', fontFamily: 'var(--font-ui)' }}
        >
          <span className="text-3xl">👍</span>
          <span className="text-[var(--text-ui-small)]">Yes!</span>
        </button>
        <button
          onClick={() => onResult(false)}
          className="flex flex-col items-center gap-1 px-6 py-4 rounded-[var(--radius-lg)] bg-[var(--accent-encourage)] text-white font-bold border-none cursor-pointer transition-transform active:scale-95"
          style={{ minWidth: 'var(--tap-target-child)', minHeight: 'var(--tap-target-child)', fontFamily: 'var(--font-ui)' }}
        >
          <span className="text-3xl">👎</span>
          <span className="text-[var(--text-ui-small)]">Not yet</span>
        </button>
      </div>
    </div>
  );
}

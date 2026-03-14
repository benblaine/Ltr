import { useState, useMemo } from 'react';

interface ParentGateProps {
  onPass: () => void;
  onBack: () => void;
}

export function ParentGate({ onPass, onBack }: ParentGateProps) {
  const problem = useMemo(() => {
    const a = Math.floor(Math.random() * 8) + 3;
    const b = Math.floor(Math.random() * 8) + 3;
    return { a, b, answer: a * b };
  }, []);

  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (parseInt(input, 10) === problem.answer) {
      onPass();
    } else {
      setError(true);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-6">
      <h2 className="text-[var(--text-ui-large)] font-bold" style={{ fontFamily: 'var(--font-ui)' }}>
        Grown-ups Only
      </h2>
      <p className="text-[var(--text-ui)] text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-ui)' }}>
        Solve this to continue:
      </p>
      <p className="text-[var(--text-learning)] font-bold" style={{ fontFamily: 'var(--font-learning)' }}>
        {problem.a} × {problem.b} = ?
      </p>

      <input
        type="number"
        inputMode="numeric"
        value={input}
        onChange={(e) => { setInput(e.target.value); setError(false); }}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        className={`text-center text-[var(--text-ui-large)] p-3 rounded-[var(--radius-md)] border-2 w-32 outline-none ${
          error ? 'border-[var(--danger)]' : 'border-[var(--bg-secondary)]'
        } bg-[var(--bg-surface)]`}
        style={{ fontFamily: 'var(--font-ui)' }}
        autoFocus
      />

      {error && (
        <p className="text-[var(--danger)] text-[var(--text-ui-small)]">
          Not quite — try again!
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-6 py-2 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border-none cursor-pointer text-[var(--text-secondary)] text-[var(--text-ui-small)]"
          style={{ minHeight: 'var(--tap-target-min)' }}
        >
          Go Back
        </button>
        <button
          onClick={handleSubmit}
          className="px-6 py-2 rounded-[var(--radius-md)] bg-[var(--interactive)] text-white border-none cursor-pointer font-bold text-[var(--text-ui)]"
          style={{ minHeight: 'var(--tap-target-min)' }}
        >
          Check
        </button>
      </div>
    </div>
  );
}

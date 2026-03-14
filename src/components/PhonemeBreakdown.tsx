import { speak } from '../audio/speaker.js';

interface PhonemeBreakdownProps {
  phonemes: string[];
  fullWord: string;
}

export function PhonemeBreakdown({ phonemes, fullWord }: PhonemeBreakdownProps) {
  const handleTapPhoneme = (p: string) => {
    speak(p, { rate: 0.7 });
  };

  const handleTapWord = () => {
    speak(fullWord, { rate: 0.8 });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2">
        {phonemes.map((p, i) => (
          <button
            key={i}
            onClick={() => handleTapPhoneme(p)}
            className="px-4 py-3 rounded-[var(--radius-md)] bg-[var(--accent-highlight)] text-white font-bold text-[var(--text-ui-large)] border-none cursor-pointer transition-transform active:scale-90"
            style={{ fontFamily: 'var(--font-learning)', minWidth: 'var(--tap-target-min)' }}
          >
            {p}
          </button>
        ))}
      </div>
      <button
        onClick={handleTapWord}
        className="px-6 py-2 rounded-[var(--radius-full)] bg-[var(--interactive)] text-white font-bold border-none cursor-pointer text-[var(--text-ui)]"
        style={{ fontFamily: 'var(--font-ui)' }}
      >
        Hear the whole word
      </button>
    </div>
  );
}

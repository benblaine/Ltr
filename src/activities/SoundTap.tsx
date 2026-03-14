import { useState, useEffect, useCallback, useRef } from 'react';
import { ActivityShell, type ActivityRenderProps } from './ActivityShell.js';
import { WordDisplay } from '../components/WordDisplay.js';
import { AudioButton } from '../components/AudioButton.js';
import { speak } from '../audio/speaker.js';

export function SoundTap() {
  return (
    <ActivityShell activityType="sound-tap">
      {(props) => <SoundTapActivity {...props} />}
    </ActivityShell>
  );
}

function SoundTapActivity({ currentWord, onResult, showingFeedback }: ActivityRenderProps) {
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    // Generate letter options: correct letter + distractors
    const targetLetter = currentWord.displayPhonemes[0]?.toLowerCase() ?? currentWord.text[0].toLowerCase();
    const allLetters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const distractors = allLetters
      .filter(l => l !== targetLetter)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const shuffled = [targetLetter, ...distractors].sort(() => Math.random() - 0.5);
    setOptions(shuffled);
    setSelected(null);
    startTime.current = Date.now();

    // Speak the word
    speak(`Which letter does "${currentWord.text}" start with?`, { rate: 0.85 });
  }, [currentWord]);

  const handleTap = useCallback((letter: string) => {
    if (selected || showingFeedback !== 'none') return;

    setSelected(letter);
    const targetLetter = currentWord.displayPhonemes[0]?.toLowerCase() ?? currentWord.text[0].toLowerCase();
    const isCorrect = letter === targetLetter;
    const duration = Date.now() - startTime.current;

    // Play the tapped letter sound
    speak(letter, { rate: 0.7 });

    setTimeout(() => {
      onResult(
        isCorrect ? 'correct' : 'incorrect',
        1.0,
        duration,
      );
    }, 500);
  }, [selected, showingFeedback, currentWord, onResult]);

  const targetLetter = currentWord.displayPhonemes[0]?.toLowerCase() ?? currentWord.text[0].toLowerCase();

  return (
    <div className="flex flex-col items-center gap-8">
      <WordDisplay word={currentWord} />
      <AudioButton text={currentWord.text} />

      <p className="text-[var(--text-ui)] text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-ui)' }}>
        Tap the first letter sound
      </p>

      <div className="grid grid-cols-2 gap-4">
        {options.map((letter) => {
          let bg = 'var(--bg-surface)';
          let border = 'var(--bg-secondary)';
          let textColor = 'var(--text-primary)';

          if (selected === letter) {
            if (letter === targetLetter) {
              bg = 'var(--accent-correct)';
              border = 'var(--accent-correct)';
              textColor = 'white';
            } else {
              bg = 'var(--danger)';
              border = 'var(--danger)';
              textColor = 'white';
            }
          }

          return (
            <button
              key={letter}
              onClick={() => handleTap(letter)}
              disabled={selected !== null}
              className="flex items-center justify-center rounded-[var(--radius-lg)] border-2 cursor-pointer transition-all active:scale-95 font-bold shadow-[var(--shadow-sm)]"
              style={{
                width: '80px',
                height: '80px',
                backgroundColor: bg,
                borderColor: border,
                color: textColor,
                fontFamily: 'var(--font-learning)',
                fontSize: 'var(--text-learning)',
              }}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}

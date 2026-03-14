import { useState, useEffect, useCallback, useRef } from 'react';
import { ActivityShell, type ActivityRenderProps } from './ActivityShell.js';
import { AudioButton } from '../components/AudioButton.js';
import { LetterTile } from '../components/LetterTile.js';
import { speak } from '../audio/speaker.js';

export function BlendBuilder() {
  return (
    <ActivityShell activityType="blend-builder">
      {(props) => <BlendBuilderActivity {...props} />}
    </ActivityShell>
  );
}

function BlendBuilderActivity({ currentWord, onResult, showingFeedback }: ActivityRenderProps) {
  const [scrambled, setScrambled] = useState<string[]>([]);
  const [placed, setPlaced] = useState<string[]>([]);
  const [correct, setCorrect] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const letters = currentWord.displayPhonemes.length > 0
      ? [...currentWord.displayPhonemes]
      : currentWord.text.toLowerCase().split('');

    // Shuffle
    const shuffled = [...letters];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setScrambled(shuffled);
    setPlaced([]);
    setCorrect(false);
    startTime.current = Date.now();

    speak(`Build the word: ${currentWord.text}`, { rate: 0.85 });
  }, [currentWord]);

  const targetLetters = currentWord.displayPhonemes.length > 0
    ? currentWord.displayPhonemes
    : currentWord.text.toLowerCase().split('');

  const handleTapScrambled = useCallback((index: number) => {
    if (correct || showingFeedback !== 'none') return;

    const letter = scrambled[index];
    speak(letter, { rate: 0.7 });

    const newPlaced = [...placed, letter];
    const newScrambled = [...scrambled];
    newScrambled.splice(index, 1);

    setPlaced(newPlaced);
    setScrambled(newScrambled);

    // Check if complete
    if (newPlaced.length === targetLetters.length) {
      const isCorrect = newPlaced.join('') === targetLetters.join('');
      const duration = Date.now() - startTime.current;

      if (isCorrect) {
        setCorrect(true);
        speak(currentWord.text, { rate: 0.85 });
        setTimeout(() => onResult('correct', 1.0, duration), 800);
      } else {
        // Reset after brief pause
        setTimeout(() => {
          setPlaced([]);
          const reshuffled = [...targetLetters].sort(() => Math.random() - 0.5);
          setScrambled(reshuffled);
          onResult('incorrect', 1.0, duration);
        }, 1000);
      }
    }
  }, [scrambled, placed, correct, showingFeedback, targetLetters, currentWord, onResult]);

  const handleTapPlaced = useCallback((index: number) => {
    if (correct || showingFeedback !== 'none') return;

    const letter = placed[index];
    const newPlaced = [...placed];
    newPlaced.splice(index, 1);
    setPlaced(newPlaced);
    setScrambled([...scrambled, letter]);
  }, [placed, scrambled, correct, showingFeedback]);

  return (
    <div className="flex flex-col items-center gap-6">
      {currentWord.imageEmoji && (
        <span className="text-5xl">{currentWord.imageEmoji}</span>
      )}

      <AudioButton text={currentWord.text} />

      <p className="text-[var(--text-ui)] text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-ui)' }}>
        Build the word!
      </p>

      {/* Placed letters (answer area) */}
      <div className="flex gap-2 min-h-[72px] px-4 py-2 rounded-[var(--radius-lg)] bg-[var(--bg-secondary)] items-center justify-center">
        {targetLetters.map((_, i) => (
          <div key={i} className="flex items-center justify-center" style={{ width: 'var(--tap-target-child)', height: 'var(--tap-target-child)' }}>
            {placed[i] ? (
              <LetterTile
                letter={placed[i]}
                placed
                correct={correct}
                onClick={() => handleTapPlaced(i)}
              />
            ) : (
              <div
                className="border-2 border-dashed border-[var(--text-secondary)] rounded-[var(--radius-md)] opacity-30"
                style={{ width: 'var(--tap-target-child)', height: 'var(--tap-target-child)' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Scrambled letters (source area) */}
      <div className="flex gap-2 flex-wrap justify-center">
        {scrambled.map((letter, i) => (
          <LetterTile
            key={`${letter}-${i}`}
            letter={letter}
            onClick={() => handleTapScrambled(i)}
          />
        ))}
      </div>
    </div>
  );
}

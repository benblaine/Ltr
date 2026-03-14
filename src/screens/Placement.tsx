import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext.js';
import { speak } from '../audio/speaker.js';
import type { Word } from '../types/content.js';

export function Placement() {
  const { activePack, updateProfile } = useProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [showWord, setShowWord] = useState(true);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);

  const difficultyLevels = [1, 2, 3, 4, 5];

  const getWordForDifficulty = useCallback((difficulty: number): Word | null => {
    if (!activePack) return null;
    const matches = activePack.words.filter(w => w.difficulty === difficulty);
    if (matches.length === 0) {
      const nearby = activePack.words.filter(w => Math.abs(w.difficulty - difficulty) <= 1);
      return nearby[Math.floor(Math.random() * nearby.length)] ?? null;
    }
    return matches[Math.floor(Math.random() * matches.length)];
  }, [activePack]);

  const startStep = useCallback(() => {
    if (step >= difficultyLevels.length) return;
    const word = getWordForDifficulty(difficultyLevels[step]);
    setCurrentWord(word);
    setShowWord(true);
    if (word) {
      speak(word.text, { rate: 0.8 });
    }
  }, [step, getWordForDifficulty]);

  // Initialize first word
  if (step === 0 && !currentWord && activePack) {
    startStep();
  }

  const handleAnswer = async (correct: boolean) => {
    const newResults = [...results, correct];
    setResults(newResults);

    const nextStep = step + 1;

    // Stop if 2 consecutive wrong or all done
    const consecutiveWrong = !correct && newResults.length >= 2 && !newResults[newResults.length - 2];

    if (consecutiveWrong || nextStep >= difficultyLevels.length) {
      // Calculate placement band
      const lastCorrectIdx = newResults.lastIndexOf(true);
      const band = lastCorrectIdx >= 0 ? difficultyLevels[lastCorrectIdx] : 1;

      await updateProfile({
        placementComplete: true,
        placementBand: band,
        currentDifficulty: band,
      });

      navigate('/');
      return;
    }

    setStep(nextStep);
    setShowWord(false);
    // Small delay before next word
    setTimeout(() => {
      const word = getWordForDifficulty(difficultyLevels[nextStep]);
      setCurrentWord(word);
      setShowWord(true);
      if (word) speak(word.text, { rate: 0.8 });
    }, 500);
  };

  if (!activePack || !currentWord) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[var(--text-secondary)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-8">
      <div className="text-center">
        <p className="text-[var(--text-ui-small)] text-[var(--text-secondary)] mb-2" style={{ fontFamily: 'var(--font-ui)' }}>
          Let's see what you know! ({step + 1}/{difficultyLevels.length})
        </p>
        <div className="flex gap-1 justify-center">
          {difficultyLevels.map((_, i) => (
            <div
              key={i}
              className={`w-8 h-2 rounded-full ${
                i < step ? (results[i] ? 'bg-[var(--accent-correct)]' : 'bg-[var(--danger)]')
                  : i === step ? 'bg-[var(--interactive)]' : 'bg-[var(--bg-secondary)]'
              }`}
            />
          ))}
        </div>
      </div>

      {showWord && (
        <div className="text-center">
          <p className="text-6xl mb-4">{currentWord.imageEmoji}</p>
          <p
            className="text-[var(--text-learning)] font-bold"
            style={{ fontFamily: 'var(--font-learning)' }}
          >
            {currentWord.text}
          </p>
        </div>
      )}

      <p className="text-[var(--text-ui)] text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-ui)' }}>
        Can you read this word?
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => handleAnswer(true)}
          className="px-8 py-4 rounded-[var(--radius-lg)] bg-[var(--accent-correct)] text-white font-bold text-[var(--text-ui-large)] border-none cursor-pointer transition-transform active:scale-95"
          style={{ fontFamily: 'var(--font-ui)', minHeight: 'var(--tap-target-child)' }}
        >
          👍 Yes!
        </button>
        <button
          onClick={() => handleAnswer(false)}
          className="px-8 py-4 rounded-[var(--radius-lg)] bg-[var(--accent-encourage)] text-white font-bold text-[var(--text-ui-large)] border-none cursor-pointer transition-transform active:scale-95"
          style={{ fontFamily: 'var(--font-ui)', minHeight: 'var(--tap-target-child)' }}
        >
          👎 Not yet
        </button>
      </div>
    </div>
  );
}

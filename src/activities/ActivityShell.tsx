import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext.js';
import { selectSessionWords } from '../engine/selector.js';
import { startSession, recordAttempt, endSession, computeStars, type SessionState } from '../engine/session.js';
import { ProgressBar } from '../components/ProgressBar.js';
import { Celebration } from '../components/Celebration.js';
import type { Word, ActivityType } from '../types/content.js';
import type { AttemptResult } from '../types/progress.js';

interface ActivityShellProps {
  activityType: ActivityType;
  children: (props: ActivityRenderProps) => React.ReactNode;
}

export interface ActivityRenderProps {
  currentWord: Word;
  words: Word[];
  currentIndex: number;
  onResult: (result: AttemptResult, confidence: number, durationMs: number) => void;
  showingFeedback: 'none' | 'correct' | 'incorrect';
}

export function ActivityShell({ activityType, children }: ActivityShellProps) {
  const { profile, activePack, updateProfile } = useProfile();
  const navigate = useNavigate();

  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [session, setSession] = useState<SessionState | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');
  const [loading, setLoading] = useState(true);
  const wordStartTime = useRef(Date.now());

  useEffect(() => {
    async function init() {
      if (!activePack || !profile) return;
      const count = activePack.difficultyConfig.itemsPerSession;
      const selected = await selectSessionWords(activePack, profile.currentDifficulty, count);
      setWords(selected);
      setSession(startSession(activePack.id, activityType, profile.currentDifficulty, activePack.difficultyConfig));
      setLoading(false);
      wordStartTime.current = Date.now();
    }
    init();
  }, [activePack, profile, activityType]);

  const handleResult = useCallback(async (result: AttemptResult, confidence: number, durationMs: number) => {
    if (!session || !words[currentIndex]) return;

    const isCorrect = result === 'correct' || result === 'self-correct';
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    const updated = await recordAttempt(session, words[currentIndex].id, result, confidence, durationMs);
    setSession(updated);

    // Show feedback briefly, then advance
    setTimeout(() => {
      setFeedback('none');
      if (updated.isComplete || currentIndex + 1 >= words.length) {
        setShowCelebration(true);
      } else {
        setCurrentIndex(i => i + 1);
        wordStartTime.current = Date.now();
      }
    }, isCorrect ? 1000 : 2000);
  }, [session, words, currentIndex]);

  const handleCelebrationComplete = useCallback(async () => {
    if (!session || !profile) return;
    const record = await endSession(session);
    await updateProfile({
      totalStars: profile.totalStars + record.starsEarned,
      currentDifficulty: session.adaptive.difficultyLevel,
    });
    navigate('/');
  }, [session, profile, updateProfile, navigate]);

  const handleExit = useCallback(async () => {
    if (session) {
      await endSession(session);
    }
    navigate('/');
  }, [session, navigate]);

  if (loading || !activePack || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-ui)' }}>
          Preparing activity...
        </p>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
        <p className="text-4xl">🎉</p>
        <p className="text-[var(--text-ui)] text-center" style={{ fontFamily: 'var(--font-ui)' }}>
          You've mastered everything in this pack!
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-[var(--radius-full)] bg-[var(--interactive)] text-white font-bold border-none cursor-pointer"
          style={{ fontFamily: 'var(--font-ui)' }}
        >
          Back to Hub
        </button>
      </div>
    );
  }

  if (showCelebration && session) {
    return <Celebration stars={computeStars(session)} onComplete={handleCelebrationComplete} />;
  }

  const currentWord = words[currentIndex];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={handleExit}
          className="px-3 py-1 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border-none cursor-pointer text-[var(--text-secondary)] text-[var(--text-ui-small)]"
        >
          ✕
        </button>
        <div className="flex-1">
          <ProgressBar current={currentIndex} total={words.length} />
        </div>
      </div>

      {/* Feedback overlay */}
      {feedback !== 'none' && (
        <div className={`text-center py-2 text-white font-bold text-[var(--text-ui)] ${
          feedback === 'correct' ? 'bg-[var(--accent-correct)]' : 'bg-[var(--accent-encourage)]'
        }`} style={{ fontFamily: 'var(--font-ui)' }}>
          {feedback === 'correct' ? '✓ Correct!' : 'Try again next time!'}
        </div>
      )}

      {/* Activity content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        {currentWord && children({
          currentWord,
          words,
          currentIndex,
          onResult: handleResult,
          showingFeedback: feedback,
        })}
      </div>
    </div>
  );
}

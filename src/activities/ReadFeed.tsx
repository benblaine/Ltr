import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext.js';
import { selectSessionWords } from '../engine/selector.js';
import { startSession, recordAttempt, endSession, computeStars, type SessionState } from '../engine/session.js';
import { AudioRecorder } from '../audio/recorder.js';
import { SpeechEvaluator } from '../audio/evaluator.js';
import { speak } from '../audio/speaker.js';
import { Celebration } from '../components/Celebration.js';
import { DiagnosticPanel } from '../components/DiagnosticPanel.js';
import type { Word } from '../types/content.js';

type CardPhase = 'ready' | 'recording' | 'result' | 'self-eval';

export function ReadFeed() {
  const { profile, activePack, updateProfile } = useProfile();
  const navigate = useNavigate();

  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [session, setSession] = useState<SessionState | null>(null);
  const [phase, setPhase] = useState<CardPhase>('ready');
  const [transcript, setTranscript] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [loading, setLoading] = useState(true);
  const [slideDirection, setSlideDirection] = useState<'in' | 'out' | null>(null);

  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const evaluatorRef = useRef<SpeechEvaluator | null>(null);
  const startTimeRef = useRef(Date.now());
  const touchStartRef = useRef<{ y: number; time: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Init session
  useEffect(() => {
    async function init() {
      if (!activePack || !profile) return;
      const count = activePack.difficultyConfig.itemsPerSession;
      const selected = await selectSessionWords(activePack, profile.currentDifficulty, count);
      setWords(selected);
      setSession(startSession(activePack.id, 'word-flash', profile.currentDifficulty, activePack.difficultyConfig));
      setLoading(false);
    }
    init();
  }, [activePack, profile]);

  // Init audio
  useEffect(() => {
    recorderRef.current = new AudioRecorder();
    evaluatorRef.current = new SpeechEvaluator();
    return () => {
      recorderRef.current?.cleanup();
      evaluatorRef.current?.abort();
    };
  }, []);

  // Speak word on new card
  useEffect(() => {
    if (words[currentIndex] && phase === 'ready') {
      startTimeRef.current = Date.now();
      speak(words[currentIndex].text, { rate: 0.8 });
    }
  }, [currentIndex, words, phase]);

  // Slide-in animation on word change
  useEffect(() => {
    if (slideDirection === 'in') {
      const timer = setTimeout(() => setSlideDirection(null), 300);
      return () => clearTimeout(timer);
    }
  }, [slideDirection]);

  const handleStartRecording = useCallback(async () => {
    if (phase !== 'ready') return;
    const recorder = recorderRef.current;
    const evaluator = evaluatorRef.current;
    if (!recorder) return;

    setPhase('recording');

    try {
      const currentWord = words[currentIndex];
      const recordingPromise = recorder.start();
      const asrPromise = evaluator?.canDoASR
        ? evaluator.evaluate(currentWord.text)
        : Promise.resolve(null);

      const [_recording, asrResult] = await Promise.all([recordingPromise, asrPromise]);

      if (asrResult) {
        setTranscript(asrResult.transcript ?? '');

        if (asrResult.mode === 'asr') {
          setIsCorrect(asrResult.isCorrect);
          setPhase('result');

          if (session) {
            const duration = Date.now() - startTimeRef.current;
            const updated = await recordAttempt(
              session,
              currentWord.id,
              asrResult.isCorrect ? 'correct' : 'incorrect',
              asrResult.confidence,
              duration,
            );
            setSession(updated);
          }
        } else {
          setPhase('self-eval');
        }
      } else {
        setTranscript('');
        setPhase('self-eval');
      }
    } catch {
      setTranscript('');
      setPhase('self-eval');
    }
  }, [phase, words, currentIndex, session]);

  const handleStopRecording = useCallback(() => {
    if (phase !== 'recording') return;
    recorderRef.current?.stop();
    evaluatorRef.current?.stop();
  }, [phase]);

  const handleSelfEval = useCallback(async (correct: boolean) => {
    setIsCorrect(correct);
    setPhase('result');

    if (session && words[currentIndex]) {
      const duration = Date.now() - startTimeRef.current;
      const updated = await recordAttempt(
        session,
        words[currentIndex].id,
        correct ? 'self-correct' : 'self-incorrect',
        1.0,
        duration,
      );
      setSession(updated);
    }
  }, [session, words, currentIndex]);

  const advanceToNext = useCallback(() => {
    if (phase !== 'result') return;

    if (!session) return;

    if (session.isComplete || currentIndex + 1 >= words.length) {
      setShowCelebration(true);
      return;
    }

    setSlideDirection('out');
    setTimeout(() => {
      setCurrentIndex(i => i + 1);
      setPhase('ready');
      setTranscript('');
      setIsCorrect(null);
      setSlideDirection('in');
    }, 200);
  }, [phase, session, currentIndex, words.length]);

  // Swipe up detection
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { y: e.touches[0].clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dy = touchStartRef.current.y - e.changedTouches[0].clientY;
    const dt = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Swipe up: distance > 50px and speed > 0.3px/ms
    if (dy > 50 && dy / dt > 0.3) {
      advanceToNext();
    }
  }, [advanceToNext]);

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
    if (session) await endSession(session);
    navigate('/');
  }, [session, navigate]);

  if (loading || !activePack || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
        <p className="text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-ui)' }}>
          Loading...
        </p>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 bg-[var(--bg-primary)]">
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

  const word = words[currentIndex];
  const progress = words.length > 0 ? `${currentIndex + 1} / ${words.length}` : '';

  return (
    <div
      ref={containerRef}
      className="flex flex-col min-h-screen bg-[var(--bg-primary)] select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 z-10">
        <button
          onClick={handleExit}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--bg-secondary)] border-none cursor-pointer text-[var(--text-secondary)] text-lg"
        >
          ✕
        </button>
        <span className="text-[var(--text-ui-small)] text-[var(--text-secondary)] font-semibold" style={{ fontFamily: 'var(--font-ui)' }}>
          {progress}
        </span>
        <button
          onClick={() => setShowDiagnostics(d => !d)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--bg-secondary)] border-none cursor-pointer text-[var(--text-secondary)] text-xs"
          style={{ fontFamily: 'var(--font-ui)' }}
          aria-label="Diagnostics"
        >
          diag
        </button>
      </div>

      {showDiagnostics && (
        <DiagnosticPanel
          recorder={recorderRef.current}
          evaluator={evaluatorRef.current}
          phase={phase}
          onClose={() => setShowDiagnostics(false)}
        />
      )}

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 px-6">
        {words.map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full flex-1 max-w-8 transition-colors"
            style={{
              backgroundColor: i < currentIndex
                ? 'var(--accent-correct)'
                : i === currentIndex
                  ? 'var(--interactive)'
                  : 'var(--bg-secondary)',
            }}
          />
        ))}
      </div>

      {/* Main card area */}
      <div
        className={`flex-1 flex flex-col items-center justify-center px-6 gap-6 transition-all duration-200 ${
          slideDirection === 'out' ? '-translate-y-full opacity-0' : ''
        } ${slideDirection === 'in' ? 'animate-[slide-up_0.3s_ease-out]' : ''}`}
      >
        {/* Emoji */}
        {word.imageEmoji && (
          <span className="text-6xl">{word.imageEmoji}</span>
        )}

        {/* Word */}
        <p
          className="text-center font-bold m-0 leading-tight"
          style={{
            fontFamily: 'var(--font-learning)',
            fontSize: 'clamp(48px, 12vw, 80px)',
          }}
        >
          {word.text}
        </p>

        {/* Phase-specific UI */}
        {phase === 'ready' && (
          <div className="flex flex-col items-center gap-4 mt-4">
            <button
              type="button"
              onClick={handleStartRecording}
              className="w-20 h-20 rounded-full flex items-center justify-center bg-[var(--interactive)] shadow-[var(--shadow-md)] cursor-pointer transition-transform active:scale-90 border-none"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
            <p className="text-[var(--text-ui)] text-[var(--text-secondary)] m-0" style={{ fontFamily: 'var(--font-ui)' }}>
              Tap to say the word
            </p>
          </div>
        )}

        {phase === 'recording' && (
          <div className="flex flex-col items-center gap-4 mt-4">
            <button
              type="button"
              onClick={handleStopRecording}
              className="w-20 h-20 rounded-full flex items-center justify-center bg-[var(--danger)] shadow-[var(--shadow-md)] animate-pulse cursor-pointer border-none"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="none">
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
            </button>
            <p className="text-[var(--text-ui)] text-[var(--danger)] font-bold m-0 animate-pulse" style={{ fontFamily: 'var(--font-ui)' }}>
              Listening... tap to stop
            </p>
          </div>
        )}

        {phase === 'self-eval' && (
          <div className="flex flex-col items-center gap-4 mt-4">
            {transcript ? (
              <div className="flex flex-col items-center gap-2">
                <p className="text-[var(--text-ui-small)] text-[var(--text-secondary)] m-0" style={{ fontFamily: 'var(--font-ui)' }}>
                  We heard you say:
                </p>
                <p className="text-[var(--text-ui-large)] font-bold text-[var(--text-primary)] m-0 px-5 py-2 rounded-[var(--radius-md)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]" style={{ fontFamily: 'var(--font-learning)' }}>
                  "{transcript}"
                </p>
              </div>
            ) : (
              <p className="text-[var(--text-ui)] text-[var(--text-secondary)] m-0" style={{ fontFamily: 'var(--font-ui)' }}>
                We couldn't quite hear that.
              </p>
            )}
            <p className="text-[var(--text-ui)] text-[var(--text-secondary)] m-0" style={{ fontFamily: 'var(--font-ui)' }}>
              Did you say it correctly?
            </p>
            <div className="flex gap-6">
              <button
                onClick={(e) => { e.stopPropagation(); handleSelfEval(true); }}
                className="flex flex-col items-center gap-1 px-8 py-4 rounded-[var(--radius-lg)] bg-[var(--accent-correct)] text-white font-bold border-none cursor-pointer transition-transform active:scale-95"
              >
                <span className="text-2xl">👍</span>
                <span className="text-[var(--text-ui-small)]">Yes!</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleSelfEval(false); }}
                className="flex flex-col items-center gap-1 px-8 py-4 rounded-[var(--radius-lg)] bg-[var(--accent-encourage)] text-white font-bold border-none cursor-pointer transition-transform active:scale-95"
              >
                <span className="text-2xl">👎</span>
                <span className="text-[var(--text-ui-small)]">Nope</span>
              </button>
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div className="flex flex-col items-center gap-3 mt-4">
            {/* Result badge */}
            <div
              className={`px-6 py-3 rounded-[var(--radius-full)] text-white font-bold text-[var(--text-ui-large)] ${
                isCorrect ? 'bg-[var(--accent-correct)]' : 'bg-[var(--accent-encourage)]'
              }`}
              style={{ fontFamily: 'var(--font-ui)' }}
            >
              {isCorrect ? '✓ Correct!' : '✗ Not quite'}
            </div>

            {/* Transcript */}
            {transcript && (
              <p className="text-[var(--text-ui)] text-[var(--text-secondary)] m-0" style={{ fontFamily: 'var(--font-ui)' }}>
                You said: "<span className="font-bold">{transcript}</span>"
              </p>
            )}

            {/* Phonemes on incorrect */}
            {!isCorrect && word.displayPhonemes.length > 0 && (
              <div className="flex gap-2 mt-2">
                {word.displayPhonemes.map((p, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[var(--text-ui-large)] font-bold"
                    style={{ fontFamily: 'var(--font-learning)' }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom hint */}
      {phase === 'result' && (
        <div className="flex flex-col items-center gap-2 pb-8 animate-[fade-in_0.5s_ease-out_0.5s_both]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" className="animate-bounce">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          <p className="text-[var(--text-ui-small)] text-[var(--text-secondary)] m-0" style={{ fontFamily: 'var(--font-ui)' }}>
            Swipe up for next word
          </p>
          {/* Also allow tap to advance on desktop */}
          <button
            onClick={advanceToNext}
            className="mt-2 px-6 py-2 rounded-[var(--radius-full)] bg-[var(--interactive)] text-white font-bold text-[var(--text-ui-small)] border-none cursor-pointer transition-transform active:scale-95"
            style={{ fontFamily: 'var(--font-ui)' }}
          >
            Next →
          </button>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

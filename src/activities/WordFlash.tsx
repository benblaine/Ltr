import { useState, useEffect, useCallback, useRef } from 'react';
import { ActivityShell, type ActivityRenderProps } from './ActivityShell.js';
import { WordDisplay } from '../components/WordDisplay.js';
import { MicIndicator } from '../components/MicIndicator.js';
import { SelfEval } from '../components/SelfEval.js';
import { PhonemeBreakdown } from '../components/PhonemeBreakdown.js';
import { AudioButton } from '../components/AudioButton.js';
import { AudioRecorder } from '../audio/recorder.js';
import { SpeechEvaluator } from '../audio/evaluator.js';
import { speak } from '../audio/speaker.js';

export function WordFlash() {
  return (
    <ActivityShell activityType="word-flash">
      {(props) => <WordFlashActivity {...props} />}
    </ActivityShell>
  );
}

type FlashPhase = 'show' | 'recording' | 'evaluating' | 'self-eval' | 'feedback';

function WordFlashActivity({ currentWord, onResult, showingFeedback }: ActivityRenderProps) {
  const [phase, setPhase] = useState<FlashPhase>('show');
  const [showPhonemes, setShowPhonemes] = useState(false);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const evaluatorRef = useRef<SpeechEvaluator | null>(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    recorderRef.current = new AudioRecorder();
    evaluatorRef.current = new SpeechEvaluator();
    return () => {
      recorderRef.current?.cleanup();
      evaluatorRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    setPhase('show');
    setShowPhonemes(false);
    startTime.current = Date.now();
    speak(currentWord.text, { rate: 0.8 });
  }, [currentWord]);

  const handleRecord = useCallback(async () => {
    if (phase !== 'show' || showingFeedback !== 'none') return;

    const recorder = recorderRef.current;
    const evaluator = evaluatorRef.current;
    if (!recorder) return;

    setPhase('recording');

    try {
      // Start recording and ASR in parallel
      const recordingPromise = recorder.start();
      const asrPromise = evaluator?.canDoASR ? evaluator.evaluate(currentWord.text) : Promise.resolve(null);

      const [_recording, asrResult] = await Promise.all([recordingPromise, asrPromise]);
      const duration = Date.now() - startTime.current;

      if (asrResult) {
        // ASR gave a confident result
        setPhase('feedback');
        onResult(
          asrResult.isCorrect ? 'correct' : 'incorrect',
          asrResult.confidence,
          duration,
        );
      } else {
        // Fall back to self-evaluation
        setPhase('self-eval');
      }
    } catch {
      // Recording or ASR failed — use self-eval
      setPhase('self-eval');
    }
  }, [phase, showingFeedback, currentWord, onResult]);

  const handleSelfEval = useCallback((correct: boolean) => {
    const duration = Date.now() - startTime.current;
    setPhase('feedback');
    onResult(
      correct ? 'self-correct' : 'self-incorrect',
      1.0,
      duration,
    );
  }, [onResult]);

  return (
    <div className="flex flex-col items-center gap-6">
      <WordDisplay word={currentWord} showPhonemes={showPhonemes} />

      <AudioButton text={currentWord.text} />

      {phase === 'show' && (
        <>
          <p className="text-[var(--text-ui)] text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-ui)' }}>
            Read this word aloud!
          </p>
          <MicIndicator
            state="idle"
            onClick={handleRecord}
          />
          <button
            onClick={() => setShowPhonemes(true)}
            className="text-[var(--text-ui-small)] text-[var(--accent-highlight)] bg-transparent border-none cursor-pointer underline"
          >
            Need a hint?
          </button>
        </>
      )}

      {phase === 'recording' && (
        <>
          <p className="text-[var(--text-ui)] text-[var(--accent-highlight)]" style={{ fontFamily: 'var(--font-ui)' }}>
            Listening...
          </p>
          <MicIndicator state="listening" />
        </>
      )}

      {phase === 'evaluating' && (
        <p className="text-[var(--text-ui)] text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-ui)' }}>
          Checking...
        </p>
      )}

      {phase === 'self-eval' && (
        <SelfEval onResult={handleSelfEval} />
      )}

      {phase === 'feedback' && showingFeedback === 'incorrect' && (
        <PhonemeBreakdown phonemes={currentWord.displayPhonemes} fullWord={currentWord.text} />
      )}
    </div>
  );
}

export type EvalMode = 'asr' | 'self-eval' | 'skip';

export interface EvalResult {
  mode: EvalMode;
  isCorrect: boolean;
  confidence: number;
  transcript?: string;
}

// Augment window for webkit prefix and SpeechRecognition types
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  start(): void;
  abort(): void;
  stop(): void;
}

interface SpeechRecognitionResultEvent {
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionResultListLike {
  readonly 0: SpeechRecognitionResultLike;
  readonly length: number;
}

interface SpeechRecognitionResultLike {
  readonly length: number;
  readonly [index: number]: { transcript: string; confidence: number };
}

export class SpeechEvaluator {
  private recognition: SpeechRecognitionInstance | null = null;
  private confidenceThreshold = 0.6;
  readonly isSupported: boolean;

  constructor(language: string = 'en-US') {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    this.isSupported = !!SR;
    if (this.isSupported && SR) {
      this.recognition = new SR();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = language;
      this.recognition.maxAlternatives = 3;
    }
  }

  get canDoASR(): boolean {
    return this.isSupported && navigator.onLine;
  }

  /** Returns null when ASR unavailable/uncertain — caller shows self-eval UI */
  evaluate(targetWord: string): Promise<EvalResult | null> {
    if (!this.canDoASR || !this.recognition) return Promise.resolve(null);

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.recognition!.abort();
        resolve(null);
      }, 5000);

      this.recognition!.onresult = (event: SpeechRecognitionResultEvent) => {
        clearTimeout(timeout);
        const result = event.results[0];
        const confidence = result[0].confidence;
        let matched = false;
        let bestTranscript = '';
        for (let i = 0; i < result.length; i++) {
          const t = result[i].transcript.toLowerCase().trim();
          if (!bestTranscript) bestTranscript = t;
          if (this.wordsMatch(t, targetWord)) {
            matched = true;
            bestTranscript = t;
            break;
          }
        }
        resolve({
          mode: confidence >= this.confidenceThreshold ? 'asr' : 'self-eval',
          isCorrect: matched,
          confidence,
          transcript: bestTranscript,
        });
      };

      this.recognition!.onerror = () => {
        clearTimeout(timeout);
        resolve(null);
      };
      this.recognition!.start();
    });
  }

  private wordsMatch(spoken: string, target: string): boolean {
    const clean = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
    const a = clean(spoken);
    const b = clean(target);
    if (a === b) return true;
    // Strict for short words — "sat" vs "set" is a real mistake
    if (b.length <= 3) return false;
    const maxDist = b.length <= 5 ? 1 : 2;
    return this.levenshtein(a, b) <= maxDist;
  }

  levenshtein(a: string, b: string): number {
    const m: number[][] = [];
    for (let i = 0; i <= a.length; i++) m[i] = [i];
    for (let j = 0; j <= b.length; j++) m[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        m[i][j] = Math.min(
          m[i - 1][j] + 1,
          m[i][j - 1] + 1,
          m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
        );
    return m[a.length][b.length];
  }

  /** Stop recognition gracefully — triggers onresult with whatever was captured */
  stop() {
    try {
      this.recognition?.stop();
    } catch {
      // ignore — may not be running
    }
  }

  /** Abort recognition immediately — discards any pending result */
  abort() {
    try {
      this.recognition?.abort();
    } catch {
      // ignore
    }
  }
}

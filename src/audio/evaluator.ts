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
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
  stop(): void;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
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

export interface DiagnosticEntry {
  timestamp: number;
  event: string;
  detail?: string;
}

export class SpeechEvaluator {
  private recognition: SpeechRecognitionInstance | null = null;
  private confidenceThreshold = 0.6;
  readonly isSupported: boolean;
  private _log: DiagnosticEntry[] = [];

  constructor(language: string = 'en-US') {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    this.isSupported = !!SR;
    this.log('init', `supported=${!!SR}, lang=${language}`);
    if (this.isSupported && SR) {
      this.recognition = new SR();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = language;
      this.recognition.maxAlternatives = 3;
    }
  }

  private log(event: string, detail?: string) {
    this._log.push({ timestamp: Date.now(), event, detail });
    // Keep last 50 entries
    if (this._log.length > 50) this._log.shift();
  }

  get diagnosticLog(): DiagnosticEntry[] {
    return [...this._log];
  }

  get canDoASR(): boolean {
    return this.isSupported && navigator.onLine;
  }

  /** Returns null when ASR unavailable/uncertain — caller shows self-eval UI */
  evaluate(targetWord: string): Promise<EvalResult | null> {
    this.log('evaluate', `target="${targetWord}" canASR=${this.canDoASR}`);
    if (!this.canDoASR || !this.recognition) {
      this.log('evaluate:skip', `supported=${this.isSupported} online=${navigator.onLine}`);
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      let resolved = false;
      const done = (result: EvalResult | null, reason: string) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        this.log(`resolve:${reason}`, result ? `transcript="${result.transcript}" correct=${result.isCorrect} conf=${result.confidence.toFixed(2)}` : 'null');
        resolve(result);
      };

      const timeout = setTimeout(() => {
        this.log('timeout', '5s elapsed');
        this.recognition!.abort();
        done(null, 'timeout');
      }, 5000);

      this.recognition!.onresult = (event: SpeechRecognitionResultEvent) => {
        const result = event.results[0];
        const confidence = result[0].confidence;
        let matched = false;
        let bestTranscript = '';
        const alts: string[] = [];
        for (let i = 0; i < result.length; i++) {
          const t = result[i].transcript.toLowerCase().trim();
          alts.push(t);
          if (!bestTranscript) bestTranscript = t;
          if (this.wordsMatch(t, targetWord)) {
            matched = true;
            bestTranscript = t;
            break;
          }
        }
        this.log('onresult', `alts=[${alts.join(', ')}] conf=${confidence.toFixed(2)} matched=${matched}`);
        done({
          mode: confidence >= this.confidenceThreshold ? 'asr' : 'self-eval',
          isCorrect: matched,
          confidence,
          transcript: bestTranscript,
        }, 'result');
      };

      this.recognition!.onerror = (event: SpeechRecognitionErrorEvent) => {
        this.log('onerror', event.error);
        done(null, 'error');
      };

      // Safety net: onend fires after stop()/abort() even if no result/error
      this.recognition!.onend = () => {
        this.log('onend', resolved ? 'already-resolved' : 'unresolved');
        done(null, 'end');
      };

      try {
        this.recognition!.start();
        this.log('started');
      } catch (e) {
        this.log('start:error', String(e));
        done(null, 'start-error');
      }
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

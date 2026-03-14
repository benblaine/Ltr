export interface RecordingResult {
  blob: Blob;
  durationMs: number;
}

export interface RecorderDiagnosticEntry {
  timestamp: number;
  event: string;
  detail?: string;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private maxTimeout: ReturnType<typeof setTimeout> | null = null;

  private _log: RecorderDiagnosticEntry[] = [];

  private log(event: string, detail?: string) {
    this._log.push({ timestamp: Date.now(), event, detail });
    if (this._log.length > 50) this._log.shift();
  }

  get diagnosticLog(): RecorderDiagnosticEntry[] {
    return [...this._log];
  }

  async requestPermission(): Promise<boolean> {
    try {
      this.log('requestPermission', 'requesting');
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      this.log('requestPermission', `granted, tracks=${this.stream.getTracks().length}`);
      return true;
    } catch (e) {
      this.log('requestPermission', `denied: ${e}`);
      return false;
    }
  }

  async start(): Promise<RecordingResult> {
    if (!this.stream) {
      const granted = await this.requestPermission();
      if (!granted) throw new Error('Microphone permission denied');
    }

    this.log('start', `stream active=${this.stream!.active}`);

    return new Promise((resolve, reject) => {
      const chunks: Blob[] = [];
      const startTime = Date.now();
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4';

      this.mediaRecorder = new MediaRecorder(this.stream!, { mimeType });
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => {
        if (this.maxTimeout) {
          clearTimeout(this.maxTimeout);
          this.maxTimeout = null;
        }
        const duration = Date.now() - startTime;
        this.log('stopped', `duration=${duration}ms chunks=${chunks.length}`);
        resolve({
          blob: new Blob(chunks, { type: mimeType }),
          durationMs: duration,
        });
      };
      this.mediaRecorder.onerror = () => {
        this.log('error');
        reject(new Error('Recording failed'));
      };

      this.mediaRecorder.start(100);
      this.log('recording');

      // Safety max — 10 seconds to prevent runaway recording
      this.maxTimeout = setTimeout(() => {
        this.log('max-timeout', '10s');
        this.stop();
      }, 10000);
    });
  }

  stop() {
    this.log('stop', `state=${this.mediaRecorder?.state ?? 'none'}`);
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }

  cleanup() {
    this.stop();
    if (this.maxTimeout) {
      clearTimeout(this.maxTimeout);
      this.maxTimeout = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }
}

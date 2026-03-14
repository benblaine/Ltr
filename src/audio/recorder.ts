export interface RecordingResult {
  blob: Blob;
  durationMs: number;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;

  private silenceThreshold = 0.01;
  private silenceMs = 800;
  private maxDurationMs = 5000;

  async requestPermission(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  async start(): Promise<RecordingResult> {
    if (!this.stream) {
      const granted = await this.requestPermission();
      if (!granted) throw new Error('Microphone permission denied');
    }

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
        resolve({
          blob: new Blob(chunks, { type: mimeType }),
          durationMs: Date.now() - startTime,
        });
      };
      this.mediaRecorder.onerror = () => reject(new Error('Recording failed'));

      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.stream!);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      this.mediaRecorder.start(100);
      this.monitorSilence();
      setTimeout(() => this.stop(), this.maxDurationMs);
    });
  }

  private monitorSilence() {
    const dataArray = new Uint8Array(this.analyser!.frequencyBinCount);
    let silenceStart: number | null = null;

    const check = () => {
      if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') return;
      this.analyser!.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const n = (dataArray[i] - 128) / 128;
        sum += n * n;
      }
      const rms = Math.sqrt(sum / dataArray.length);

      if (rms < this.silenceThreshold) {
        if (!silenceStart) silenceStart = Date.now();
        if (Date.now() - silenceStart > this.silenceMs) {
          this.stop();
          return;
        }
      } else {
        silenceStart = null;
      }
      requestAnimationFrame(check);
    };
    setTimeout(() => requestAnimationFrame(check), 300);
  }

  stop() {
    if (this.mediaRecorder?.state === 'recording') this.mediaRecorder.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  cleanup() {
    this.stop();
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }
}

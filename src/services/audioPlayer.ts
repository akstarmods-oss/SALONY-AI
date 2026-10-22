/**
 * AudioPlayer: Receives 24kHz PCM16 chunks from Gemini Live,
 * schedules gapless playback with Web Audio API, supports real-time interruption,
 * and provides frequency analysis for the animated AI Orb.
 */

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isPlaying = false;
  private animFrameId: number | null = null;
  private finishTimeout: any = null;

  public onVolumeChange: ((volume: number) => void) | null = null;
  public onPlaybackStateChange: ((isPlaying: boolean) => void) | null = null;

  private initAudioContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      // Output sample rate for Gemini Live is 24kHz
      this.audioContext = new AudioCtx({ sampleRate: 24000 });
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.8;
      this.analyserNode.connect(this.audioContext.destination);
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  /**
   * Queue and schedule a base64 PCM16 24kHz chunk.
   */
  queueAudioChunk(base64Data: string): void {
    clearTimeout(this.finishTimeout);
    const ctx = this.initAudioContext();
    const pcmData = this.base64ToInt16(base64Data);
    const audioBuffer = this.int16ToAudioBuffer(pcmData, ctx, 24000);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    if (this.analyserNode) {
      source.connect(this.analyserNode);
    } else {
      source.connect(ctx.destination);
    }

    const currentTime = ctx.currentTime;
    // If nextStartTime is in the past, reset to currentTime
    const startTime = Math.max(currentTime, this.nextStartTime);
    source.start(startTime);
    this.nextStartTime = startTime + audioBuffer.duration;

    this.activeSources.push(source);

    if (!this.isPlaying) {
      this.isPlaying = true;
      if (this.onPlaybackStateChange) {
        this.onPlaybackStateChange(true);
      }
      this.startAnalyserLoop();
    }

    source.onended = () => {
      const idx = this.activeSources.indexOf(source);
      if (idx !== -1) {
        this.activeSources.splice(idx, 1);
      }

      // Check if all active sources have completed
      if (this.activeSources.length === 0) {
        const remainingTime = Math.max(0, (this.nextStartTime - ctx.currentTime) * 1000);
        clearTimeout(this.finishTimeout);
        this.finishTimeout = setTimeout(() => {
          if (this.activeSources.length === 0) {
            this.markPlaybackFinished();
          }
        }, remainingTime + 60);
      }
    };
  }

  /**
   * Marks playback as completely finished and transitions state back to listening
   */
  private markPlaybackFinished(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.nextStartTime = 0;
    this.stopAnalyserLoop();

    if (this.onPlaybackStateChange) {
      this.onPlaybackStateChange(false);
    }
    if (this.onVolumeChange) {
      this.onVolumeChange(0);
    }
  }

  /**
   * Signals that model turn generation is complete.
   */
  notifyTurnComplete(): void {
    if (this.activeSources.length === 0) {
      this.markPlaybackFinished();
    }
  }

  /**
   * Immediately stops all playing and scheduled audio chunks (Interruption).
   */
  stop(): void {
    clearTimeout(this.finishTimeout);
    for (const src of this.activeSources) {
      try {
        src.stop();
        src.disconnect();
      } catch (e) {
        // already stopped
      }
    }
    this.activeSources = [];
    this.nextStartTime = 0;
    this.isPlaying = false;
    this.stopAnalyserLoop();

    if (this.onPlaybackStateChange) {
      this.onPlaybackStateChange(false);
    }
    if (this.onVolumeChange) {
      this.onVolumeChange(0);
    }
  }

  get playing(): boolean {
    return this.isPlaying;
  }

  private startAnalyserLoop(): void {
    if (this.animFrameId !== null) return;

    const dataArray = new Uint8Array(this.analyserNode?.frequencyBinCount || 128);

    const update = () => {
      if (!this.isPlaying || !this.analyserNode) {
        this.animFrameId = null;
        return;
      }

      this.analyserNode.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalized = Math.min(1, avg / 128); // 0.0 to 1.0

      if (this.onVolumeChange) {
        this.onVolumeChange(normalized);
      }

      this.animFrameId = requestAnimationFrame(update);
    };

    this.animFrameId = requestAnimationFrame(update);
  }

  private stopAnalyserLoop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  /**
   * Convert base64 string to Int16Array.
   */
  private base64ToInt16(base64: string): Int16Array {
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Int16Array(bytes.buffer);
  }

  /**
   * Convert Int16Array to AudioBuffer at specified sample rate.
   */
  private int16ToAudioBuffer(
    pcm16: Int16Array,
    ctx: AudioContext,
    sampleRate: number
  ): AudioBuffer {
    const audioBuffer = ctx.createBuffer(1, pcm16.length, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    const l = pcm16.length;
    for (let i = 0; i < l; i++) {
      channelData[i] = pcm16[i] / 32768.0;
    }
    return audioBuffer;
  }
}

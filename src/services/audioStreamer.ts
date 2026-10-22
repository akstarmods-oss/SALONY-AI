/**
 * AudioStreamer: Captures microphone input, resamples to 16kHz PCM16 mono,
 * and streams base64 chunks to the server for Gemini Live API.
 */

export class AudioStreamer {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private isStreaming = false;

  public onAudioData: ((base64Chunk: string) => void) | null = null;
  public onVolumeChange: ((volume: number) => void) | null = null;

  async start(): Promise<void> {
    if (this.isStreaming) return;

    // Request microphone access
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    // Attempt 16kHz, though some browsers will default to hardware sample rate (e.g. 44100 or 48000)
    try {
      this.audioContext = new AudioContextClass({ sampleRate: 16000 });
    } catch (e) {
      this.audioContext = new AudioContextClass();
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    // 4096 buffer length gives responsive streaming (~85ms - 250ms chunks depending on sample rate)
    this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);

    const targetSampleRate = 16000;
    const currentSampleRate = this.audioContext.sampleRate;

    this.processorNode.onaudioprocess = (event) => {
      if (!this.isStreaming) return;

      const inputBuffer = event.inputBuffer.getChannelData(0);

      // Calculate audio volume RMS
      let sum = 0;
      for (let i = 0; i < inputBuffer.length; i++) {
        sum += inputBuffer[i] * inputBuffer[i];
      }
      const rms = Math.sqrt(sum / inputBuffer.length);
      const normalizedVolume = Math.min(1, Math.max(0, rms * 5)); // amplify for visualizer
      if (this.onVolumeChange) {
        this.onVolumeChange(normalizedVolume);
      }

      // Resample to 16kHz if necessary
      let resampledData: Float32Array;
      if (currentSampleRate === targetSampleRate) {
        resampledData = inputBuffer;
      } else {
        resampledData = this.resampleAudio(inputBuffer, currentSampleRate, targetSampleRate);
      }

      // Convert Float32Array to Int16 PCM
      const pcm16 = this.floatToInt16(resampledData);
      const base64 = this.arrayBufferToBase64(pcm16.buffer);

      if (this.onAudioData) {
        this.onAudioData(base64);
      }
    };

    this.sourceNode.connect(this.processorNode);
    // Connect to destination to keep audio processing active (some browsers require this)
    const silentGain = this.audioContext.createGain();
    silentGain.gain.value = 0;
    this.processorNode.connect(silentGain);
    silentGain.connect(this.audioContext.destination);

    this.isStreaming = true;
  }

  stop(): void {
    this.isStreaming = false;

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.onVolumeChange) {
      this.onVolumeChange(0);
    }
  }

  get active(): boolean {
    return this.isStreaming;
  }

  /**
   * Resamples an audio buffer from source sample rate to target sample rate using linear interpolation.
   */
  private resampleAudio(
    sourceBuffer: Float32Array,
    sourceSampleRate: number,
    targetSampleRate: number
  ): Float32Array {
    if (sourceSampleRate === targetSampleRate) {
      return sourceBuffer;
    }
    const ratio = sourceSampleRate / targetSampleRate;
    const targetLength = Math.round(sourceBuffer.length / ratio);
    const result = new Float32Array(targetLength);

    for (let i = 0; i < targetLength; i++) {
      const position = i * ratio;
      const index = Math.floor(position);
      const fraction = position - index;

      if (index + 1 < sourceBuffer.length) {
        result[i] = sourceBuffer[index] * (1 - fraction) + sourceBuffer[index + 1] * fraction;
      } else {
        result[i] = sourceBuffer[index] || 0;
      }
    }
    return result;
  }

  /**
   * Converts Float32 audio samples (-1.0 to 1.0) into 16-bit signed PCM integers (-32768 to 32767).
   */
  private floatToInt16(buffer: Float32Array): Int16Array {
    const l = buffer.length;
    const pcm = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return pcm;
  }

  /**
   * Converts ArrayBuffer or ArrayBufferLike to Base64 string.
   */
  private arrayBufferToBase64(buffer: ArrayBufferLike): string {
    let binary = '';
    const bytes = new Uint8Array(buffer as ArrayBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

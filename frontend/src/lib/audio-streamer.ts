/**
 * Handles recording mic audio as PCM16 at 16kHz and playing back Gemini's audio responses.
 * Uses a single shared AudioContext with scheduled sequential playback for smooth streaming.
 */
export class AudioStreamer {
  private recordingContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private onAudioData: ((base64: string) => void) | null = null;

  // Playback — single shared context, schedule chunks back-to-back
  private playbackContext: AudioContext | null = null;
  private nextPlayTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];

  async startRecording(onAudioData: (base64: string) => void) {
    this.onAudioData = onAudioData;

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    this.recordingContext = new AudioContext({ sampleRate: 16000 });
    this.source = this.recordingContext.createMediaStreamSource(this.mediaStream);

    // ScriptProcessor for raw PCM access (deprecated but widely supported)
    // 2048 samples = ~128ms at 16kHz (lower = less mic latency)
    this.processor = this.recordingContext.createScriptProcessor(2048, 1, 1);
    this.processor.onaudioprocess = (e) => {
      const float32 = e.inputBuffer.getChannelData(0);
      const pcm16 = this.float32ToPcm16(float32);
      const base64 = this.arrayBufferToBase64(pcm16.buffer as ArrayBuffer);
      this.onAudioData?.(base64);
    };

    this.source.connect(this.processor);
    this.processor.connect(this.recordingContext.destination);
  }

  stopRecording() {
    this.processor?.disconnect();
    this.source?.disconnect();
    this.mediaStream?.getTracks().forEach((t) => t.stop());
    this.processor = null;
    this.source = null;
    this.mediaStream = null;
    this.onAudioData = null;
  }

  playAudio(audioData: ArrayBuffer) {
    try {
      // Lazily create a single playback context
      if (!this.playbackContext || this.playbackContext.state === "closed") {
        this.playbackContext = new AudioContext({ sampleRate: 24000 });
        this.nextPlayTime = 0;
      }

      const ctx = this.playbackContext;

      // Gemini returns PCM16 at 24kHz
      const pcm16 = new Int16Array(audioData);
      const float32 = this.pcm16ToFloat32(pcm16);
      const buffer = ctx.createBuffer(1, float32.length, 24000);
      buffer.copyToChannel(new Float32Array(float32), 0);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      // Schedule this chunk right after the previous one ends
      const now = ctx.currentTime;
      if (this.nextPlayTime < now) {
        this.nextPlayTime = now;
      }
      source.start(this.nextPlayTime);
      this.nextPlayTime += buffer.duration;

      // Track active sources for interruption
      this.activeSources.push(source);
      source.onended = () => {
        this.activeSources = this.activeSources.filter((s) => s !== source);
      };
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  }

  /** Stop all queued and playing audio immediately (for user interruption) */
  stopPlayback() {
    // Kill all active sources
    for (const src of this.activeSources) {
      try { src.stop(); } catch (_) {}
    }
    this.activeSources = [];
    // Close and destroy the entire playback context — instant silence
    try { this.playbackContext?.close(); } catch (_) {}
    this.playbackContext = null;
    this.nextPlayTime = 0;
  }

  private float32ToPcm16(float32: Float32Array): Int16Array {
    const pcm16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return pcm16;
  }

  private pcm16ToFloat32(pcm16: Int16Array): Float32Array {
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7fff);
    }
    return float32;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  destroy() {
    this.stopRecording();
    try {
      this.playbackContext?.close();
    } catch (_) {}
    this.playbackContext = null;
    this.nextPlayTime = 0;
  }
}

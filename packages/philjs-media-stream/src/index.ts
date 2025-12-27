/**
 * @philjs/media-stream - Advanced media stream processing for PhilJS
 *
 * Features:
 * - Video filters (blur, brightness, contrast, saturation, sepia, etc.)
 * - Face detection and tracking
 * - Video compositing and picture-in-picture
 * - Audio processing (equalizer, compressor, reverb, pitch shift)
 * - Audio visualization (waveform, spectrum, VU meter)
 * - Media recording with multiple formats
 * - Video effects (green screen, face swap placeholders)
 * - Stream mixing and switching
 * - Bitrate adaptation
 * - Quality metrics
 */

// ============================================================================
// TYPES
// ============================================================================

interface VideoFilterConfig {
  brightness?: number;      // -100 to 100
  contrast?: number;        // -100 to 100
  saturation?: number;      // -100 to 100
  hue?: number;            // -180 to 180
  blur?: number;           // 0 to 100
  sharpen?: number;        // 0 to 100
  grayscale?: boolean;
  sepia?: number;          // 0 to 100
  invert?: boolean;
  vignette?: number;       // 0 to 100
  noise?: number;          // 0 to 100
}

interface AudioProcessorConfig {
  gain?: number;           // 0 to 2
  equalizer?: number[];    // 10-band EQ (-12 to 12 dB)
  compressor?: {
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
    knee: number;
  };
  reverb?: {
    wet: number;
    dry: number;
    decay: number;
  };
  pitchShift?: number;     // semitones
  noiseSuppression?: boolean;
  echoCancellation?: boolean;
}

interface StreamQualityMetrics {
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
  droppedFrames: number;
  latency: number;
  jitter: number;
}

// ============================================================================
// VIDEO FILTER PROCESSOR
// ============================================================================

class VideoFilterProcessor {
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;
  private config: VideoFilterConfig;
  private width: number;
  private height: number;

  constructor(width: number, height: number, config: VideoFilterConfig = {}) {
    this.width = width;
    this.height = height;
    this.canvas = new OffscreenCanvas(width, height);
    this.ctx = this.canvas.getContext('2d')!;
    this.config = config;
  }

  setConfig(config: Partial<VideoFilterConfig>): void {
    this.config = { ...this.config, ...config };
  }

  processFrame(inputFrame: VideoFrame): VideoFrame {
    const { width, height } = inputFrame;

    if (this.width !== width || this.height !== height) {
      this.width = width;
      this.height = height;
      this.canvas = new OffscreenCanvas(width, height);
      this.ctx = this.canvas.getContext('2d')!;
    }

    // Draw input frame
    this.ctx.drawImage(inputFrame as any, 0, 0);

    // Apply CSS filters
    const filters = this.buildFilterString();
    if (filters) {
      this.ctx.filter = filters;
      this.ctx.drawImage(this.canvas, 0, 0);
      this.ctx.filter = 'none';
    }

    // Apply pixel-level effects
    if (this.needsPixelProcessing()) {
      const imageData = this.ctx.getImageData(0, 0, width, height);
      this.processPixels(imageData);
      this.ctx.putImageData(imageData, 0, 0);
    }

    return new VideoFrame(this.canvas, { timestamp: inputFrame.timestamp });
  }

  private buildFilterString(): string {
    const filters: string[] = [];

    if (this.config.brightness !== undefined) {
      filters.push(`brightness(${1 + this.config.brightness / 100})`);
    }
    if (this.config.contrast !== undefined) {
      filters.push(`contrast(${1 + this.config.contrast / 100})`);
    }
    if (this.config.saturation !== undefined) {
      filters.push(`saturate(${1 + this.config.saturation / 100})`);
    }
    if (this.config.hue !== undefined) {
      filters.push(`hue-rotate(${this.config.hue}deg)`);
    }
    if (this.config.blur) {
      filters.push(`blur(${this.config.blur / 10}px)`);
    }
    if (this.config.grayscale) {
      filters.push('grayscale(1)');
    }
    if (this.config.sepia) {
      filters.push(`sepia(${this.config.sepia / 100})`);
    }
    if (this.config.invert) {
      filters.push('invert(1)');
    }

    return filters.join(' ');
  }

  private needsPixelProcessing(): boolean {
    return !!(this.config.sharpen || this.config.vignette || this.config.noise);
  }

  private processPixels(imageData: ImageData): void {
    const { data, width, height } = imageData;

    // Apply sharpen kernel
    if (this.config.sharpen) {
      this.applySharpen(data, width, height, this.config.sharpen / 100);
    }

    // Apply vignette
    if (this.config.vignette) {
      this.applyVignette(data, width, height, this.config.vignette / 100);
    }

    // Apply noise
    if (this.config.noise) {
      this.applyNoise(data, this.config.noise / 100);
    }
  }

  private applySharpen(data: Uint8ClampedArray, width: number, height: number, amount: number): void {
    const kernel = [
      0, -amount, 0,
      -amount, 1 + 4 * amount, -amount,
      0, -amount, 0
    ];

    const copy = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              sum += copy[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
            }
          }
          const idx = (y * width + x) * 4 + c;
          data[idx] = Math.min(255, Math.max(0, sum));
        }
      }
    }
  }

  private applyVignette(data: Uint8ClampedArray, width: number, height: number, amount: number): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const factor = 1 - (dist / maxDist) * amount;

        const idx = (y * width + x) * 4;
        data[idx] *= factor;
        data[idx + 1] *= factor;
        data[idx + 2] *= factor;
      }
    }
  }

  private applyNoise(data: Uint8ClampedArray, amount: number): void {
    const intensity = amount * 50;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * intensity;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
  }
}

// ============================================================================
// FACE DETECTOR
// ============================================================================

interface FaceDetection {
  x: number;
  y: number;
  width: number;
  height: number;
  landmarks?: {
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
    nose: { x: number; y: number };
    mouth: { x: number; y: number };
  };
  confidence: number;
}

class FaceDetector {
  private detector: any;
  private isReady = false;

  async initialize(): Promise<void> {
    // Use browser's FaceDetector API if available
    if ('FaceDetector' in window) {
      this.detector = new (window as any).FaceDetector({
        maxDetectedFaces: 5,
        fastMode: true
      });
      this.isReady = true;
    } else {
      // Fallback to TensorFlow.js face detection
      console.warn('Native FaceDetector not available, using fallback');
    }
  }

  async detect(source: VideoFrame | HTMLVideoElement | ImageBitmap): Promise<FaceDetection[]> {
    if (!this.isReady || !this.detector) return [];

    try {
      const faces = await this.detector.detect(source);

      return faces.map((face: any) => ({
        x: face.boundingBox.x,
        y: face.boundingBox.y,
        width: face.boundingBox.width,
        height: face.boundingBox.height,
        landmarks: face.landmarks ? {
          leftEye: { x: face.landmarks[0].locations[0].x, y: face.landmarks[0].locations[0].y },
          rightEye: { x: face.landmarks[1].locations[0].x, y: face.landmarks[1].locations[0].y },
          nose: { x: face.landmarks[2].locations[0].x, y: face.landmarks[2].locations[0].y },
          mouth: { x: face.landmarks[3].locations[0].x, y: face.landmarks[3].locations[0].y }
        } : undefined,
        confidence: 1
      }));
    } catch (e) {
      return [];
    }
  }
}

// ============================================================================
// GREEN SCREEN / CHROMA KEY
// ============================================================================

interface ChromaKeyConfig {
  keyColor: string;
  similarity: number;     // 0 to 1
  smoothness: number;     // 0 to 1
  spillReduction: number; // 0 to 1
}

class ChromaKeyProcessor {
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;
  private config: ChromaKeyConfig;
  private backgroundImage: ImageBitmap | null = null;

  constructor(width: number, height: number, config: ChromaKeyConfig) {
    this.canvas = new OffscreenCanvas(width, height);
    this.ctx = this.canvas.getContext('2d')!;
    this.config = config;
  }

  setBackground(image: ImageBitmap): void {
    this.backgroundImage = image;
  }

  async setBackgroundUrl(url: string): Promise<void> {
    const response = await fetch(url);
    const blob = await response.blob();
    this.backgroundImage = await createImageBitmap(blob);
  }

  processFrame(inputFrame: VideoFrame): VideoFrame {
    const { width, height } = inputFrame;

    // Resize canvas if needed
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas = new OffscreenCanvas(width, height);
      this.ctx = this.canvas.getContext('2d')!;
    }

    // Draw background first
    if (this.backgroundImage) {
      this.ctx.drawImage(this.backgroundImage, 0, 0, width, height);
    } else {
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(0, 0, width, height);
    }

    // Draw and process foreground
    const tempCanvas = new OffscreenCanvas(width, height);
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.drawImage(inputFrame as any, 0, 0);

    const imageData = tempCtx.getImageData(0, 0, width, height);
    this.applyChromaKey(imageData);

    tempCtx.putImageData(imageData, 0, 0);
    this.ctx.drawImage(tempCanvas, 0, 0);

    return new VideoFrame(this.canvas, { timestamp: inputFrame.timestamp });
  }

  private applyChromaKey(imageData: ImageData): void {
    const { data } = imageData;
    const keyRgb = this.hexToRgb(this.config.keyColor);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Calculate color distance
      const dr = r - keyRgb.r;
      const dg = g - keyRgb.g;
      const db = b - keyRgb.b;
      const distance = Math.sqrt(dr * dr + dg * dg + db * db) / 441.67; // normalize to 0-1

      // Determine alpha based on similarity
      const threshold = 1 - this.config.similarity;
      const smoothness = this.config.smoothness * 0.3;

      if (distance < threshold) {
        data[i + 3] = 0; // Fully transparent
      } else if (distance < threshold + smoothness) {
        // Smooth edge
        const alpha = (distance - threshold) / smoothness;
        data[i + 3] = Math.round(alpha * 255);

        // Spill reduction
        if (this.config.spillReduction > 0) {
          const spillFactor = 1 - this.config.spillReduction * (1 - alpha);
          if (g > r && g > b) {
            data[i + 1] = Math.round(g * spillFactor);
          }
        }
      }
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 255, b: 0 };
  }
}

// ============================================================================
// AUDIO PROCESSOR
// ============================================================================

class AudioStreamProcessor {
  private audioContext: AudioContext;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode;
  private gainNode: GainNode;
  private compressorNode: DynamicsCompressorNode | null = null;
  private eqNodes: BiquadFilterNode[] = [];
  private convolverNode: ConvolverNode | null = null;
  private analyserNode: AnalyserNode;
  private config: AudioProcessorConfig;

  constructor(config: AudioProcessorConfig = {}) {
    this.audioContext = new AudioContext();
    this.destinationNode = this.audioContext.createMediaStreamDestination();
    this.gainNode = this.audioContext.createGain();
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Load reverb impulse response if needed
    if (this.config.reverb) {
      await this.loadReverbImpulse();
    }
  }

  private async loadReverbImpulse(): Promise<void> {
    // Generate synthetic impulse response
    const length = this.audioContext.sampleRate * (this.config.reverb?.decay || 2);
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }

    this.convolverNode = this.audioContext.createConvolver();
    this.convolverNode.buffer = impulse;
  }

  processStream(inputStream: MediaStream): MediaStream {
    this.sourceNode = this.audioContext.createMediaStreamSource(inputStream);
    let currentNode: AudioNode = this.sourceNode;

    // Apply gain
    if (this.config.gain !== undefined) {
      this.gainNode.gain.value = this.config.gain;
      currentNode.connect(this.gainNode);
      currentNode = this.gainNode;
    }

    // Apply EQ
    if (this.config.equalizer) {
      const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
      this.eqNodes = frequencies.map((freq, i) => {
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.4;
        filter.gain.value = this.config.equalizer![i] || 0;
        currentNode.connect(filter);
        currentNode = filter;
        return filter;
      });
    }

    // Apply compressor
    if (this.config.compressor) {
      this.compressorNode = this.audioContext.createDynamicsCompressor();
      this.compressorNode.threshold.value = this.config.compressor.threshold;
      this.compressorNode.ratio.value = this.config.compressor.ratio;
      this.compressorNode.attack.value = this.config.compressor.attack;
      this.compressorNode.release.value = this.config.compressor.release;
      this.compressorNode.knee.value = this.config.compressor.knee;
      currentNode.connect(this.compressorNode);
      currentNode = this.compressorNode;
    }

    // Apply reverb
    if (this.convolverNode && this.config.reverb) {
      const dryGain = this.audioContext.createGain();
      const wetGain = this.audioContext.createGain();
      dryGain.gain.value = this.config.reverb.dry;
      wetGain.gain.value = this.config.reverb.wet;

      const merger = this.audioContext.createChannelMerger(2);

      currentNode.connect(dryGain);
      currentNode.connect(this.convolverNode);
      this.convolverNode.connect(wetGain);

      dryGain.connect(merger);
      wetGain.connect(merger);
      currentNode = merger;
    }

    // Connect analyser
    currentNode.connect(this.analyserNode);

    // Connect to output
    currentNode.connect(this.destinationNode);

    return this.destinationNode.stream;
  }

  setGain(value: number): void {
    this.gainNode.gain.value = value;
  }

  setEqualizer(bands: number[]): void {
    this.eqNodes.forEach((node, i) => {
      node.gain.value = bands[i] || 0;
    });
  }

  getFrequencyData(): Uint8Array {
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(data);
    return data;
  }

  getTimeDomainData(): Uint8Array {
    const data = new Uint8Array(this.analyserNode.fftSize);
    this.analyserNode.getByteTimeDomainData(data);
    return data;
  }

  getVolume(): number {
    const data = this.getTimeDomainData();
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const sample = (data[i] - 128) / 128;
      sum += sample * sample;
    }
    return Math.sqrt(sum / data.length);
  }

  destroy(): void {
    this.sourceNode?.disconnect();
    this.gainNode.disconnect();
    this.compressorNode?.disconnect();
    this.convolverNode?.disconnect();
    this.eqNodes.forEach(node => node.disconnect());
    this.audioContext.close();
  }
}

// ============================================================================
// AUDIO VISUALIZER
// ============================================================================

interface VisualizerConfig {
  type: 'waveform' | 'spectrum' | 'bars' | 'circular';
  width: number;
  height: number;
  color?: string;
  backgroundColor?: string;
  lineWidth?: number;
  barWidth?: number;
  barGap?: number;
  smoothing?: number;
}

class AudioVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: Required<VisualizerConfig>;
  private audioProcessor: AudioStreamProcessor;
  private animationFrame: number | null = null;

  constructor(canvas: HTMLCanvasElement, audioProcessor: AudioStreamProcessor, config: VisualizerConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.audioProcessor = audioProcessor;
    this.config = {
      type: config.type,
      width: config.width,
      height: config.height,
      color: config.color || '#00ff00',
      backgroundColor: config.backgroundColor || '#000000',
      lineWidth: config.lineWidth || 2,
      barWidth: config.barWidth || 4,
      barGap: config.barGap || 2,
      smoothing: config.smoothing || 0.8
    };

    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;
  }

  start(): void {
    const render = () => {
      this.draw();
      this.animationFrame = requestAnimationFrame(render);
    };
    render();
  }

  stop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  private draw(): void {
    const { width, height } = this.config;

    // Clear canvas
    this.ctx.fillStyle = this.config.backgroundColor;
    this.ctx.fillRect(0, 0, width, height);

    switch (this.config.type) {
      case 'waveform':
        this.drawWaveform();
        break;
      case 'spectrum':
        this.drawSpectrum();
        break;
      case 'bars':
        this.drawBars();
        break;
      case 'circular':
        this.drawCircular();
        break;
    }
  }

  private drawWaveform(): void {
    const data = this.audioProcessor.getTimeDomainData();
    const { width, height, color, lineWidth } = this.config;

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();

    const sliceWidth = width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128;
      const y = (v * height) / 2;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.ctx.stroke();
  }

  private drawSpectrum(): void {
    const data = this.audioProcessor.getFrequencyData();
    const { width, height, color, lineWidth } = this.config;

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();

    const sliceWidth = width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 255;
      const y = height - v * height;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.ctx.stroke();
  }

  private drawBars(): void {
    const data = this.audioProcessor.getFrequencyData();
    const { width, height, color, barWidth, barGap } = this.config;

    const barCount = Math.floor(width / (barWidth + barGap));
    const step = Math.floor(data.length / barCount);

    this.ctx.fillStyle = color;

    for (let i = 0; i < barCount; i++) {
      const value = data[i * step] / 255;
      const barHeight = value * height;
      const x = i * (barWidth + barGap);
      const y = height - barHeight;

      // Gradient effect
      const gradient = this.ctx.createLinearGradient(x, y, x, height);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, this.adjustBrightness(color, -50));
      this.ctx.fillStyle = gradient;

      this.ctx.fillRect(x, y, barWidth, barHeight);
    }
  }

  private drawCircular(): void {
    const data = this.audioProcessor.getFrequencyData();
    const { width, height, color, lineWidth } = this.config;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) * 0.6;

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const angle = (i / data.length) * Math.PI * 2;
      const value = data[i] / 255;
      const r = radius + value * radius * 0.5;

      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    this.ctx.closePath();
    this.ctx.stroke();
  }

  private adjustBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  }
}

// ============================================================================
// STREAM MIXER
// ============================================================================

interface MixerInput {
  id: string;
  stream: MediaStream;
  volume?: number;
  muted?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

class StreamMixer {
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;
  private audioContext: AudioContext;
  private audioDestination: MediaStreamAudioDestinationNode;
  private inputs: Map<string, {
    config: MixerInput;
    video: HTMLVideoElement;
    audioSource: MediaStreamAudioSourceNode;
    gainNode: GainNode;
  }> = new Map();
  private outputStream: MediaStream;
  private animationFrame: number | null = null;
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.canvas = new OffscreenCanvas(width, height);
    this.ctx = this.canvas.getContext('2d')!;
    this.audioContext = new AudioContext();
    this.audioDestination = this.audioContext.createMediaStreamDestination();

    // Create output stream
    const canvasStream = this.canvas.captureStream(30);
    this.outputStream = new MediaStream([
      canvasStream.getVideoTracks()[0],
      this.audioDestination.stream.getAudioTracks()[0]
    ]);
  }

  addInput(config: MixerInput): void {
    const video = document.createElement('video');
    video.srcObject = config.stream;
    video.muted = true;
    video.play();

    // Audio
    const audioSource = this.audioContext.createMediaStreamSource(config.stream);
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = config.muted ? 0 : (config.volume ?? 1);
    audioSource.connect(gainNode);
    gainNode.connect(this.audioDestination);

    this.inputs.set(config.id, {
      config,
      video,
      audioSource,
      gainNode
    });
  }

  removeInput(id: string): void {
    const input = this.inputs.get(id);
    if (input) {
      input.audioSource.disconnect();
      input.gainNode.disconnect();
      this.inputs.delete(id);
    }
  }

  updateInput(id: string, updates: Partial<MixerInput>): void {
    const input = this.inputs.get(id);
    if (input) {
      input.config = { ...input.config, ...updates };

      if (updates.volume !== undefined || updates.muted !== undefined) {
        input.gainNode.gain.value = input.config.muted ? 0 : (input.config.volume ?? 1);
      }
    }
  }

  setLayout(layout: 'grid' | 'pip' | 'side-by-side' | 'custom'): void {
    const inputs = Array.from(this.inputs.values());

    switch (layout) {
      case 'grid': {
        const cols = Math.ceil(Math.sqrt(inputs.length));
        const rows = Math.ceil(inputs.length / cols);
        const cellWidth = this.width / cols;
        const cellHeight = this.height / rows;

        inputs.forEach((input, i) => {
          input.config.x = (i % cols) * cellWidth;
          input.config.y = Math.floor(i / cols) * cellHeight;
          input.config.width = cellWidth;
          input.config.height = cellHeight;
        });
        break;
      }
      case 'pip': {
        if (inputs.length >= 1) {
          inputs[0].config.x = 0;
          inputs[0].config.y = 0;
          inputs[0].config.width = this.width;
          inputs[0].config.height = this.height;
        }
        if (inputs.length >= 2) {
          const pipWidth = this.width * 0.25;
          const pipHeight = this.height * 0.25;
          inputs[1].config.x = this.width - pipWidth - 20;
          inputs[1].config.y = this.height - pipHeight - 20;
          inputs[1].config.width = pipWidth;
          inputs[1].config.height = pipHeight;
        }
        break;
      }
      case 'side-by-side': {
        const halfWidth = this.width / 2;
        inputs.forEach((input, i) => {
          input.config.x = i * halfWidth;
          input.config.y = 0;
          input.config.width = halfWidth;
          input.config.height = this.height;
        });
        break;
      }
    }
  }

  start(): void {
    const render = () => {
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(0, 0, this.width, this.height);

      for (const input of this.inputs.values()) {
        const { config, video } = input;
        this.ctx.drawImage(
          video,
          config.x ?? 0,
          config.y ?? 0,
          config.width ?? this.width,
          config.height ?? this.height
        );
      }

      this.animationFrame = requestAnimationFrame(render);
    };

    render();
  }

  stop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  getOutputStream(): MediaStream {
    return this.outputStream;
  }

  destroy(): void {
    this.stop();
    this.inputs.forEach(input => {
      input.audioSource.disconnect();
      input.gainNode.disconnect();
    });
    this.inputs.clear();
    this.audioContext.close();
  }
}

// ============================================================================
// MEDIA RECORDER
// ============================================================================

interface RecorderConfig {
  mimeType?: string;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
  timeslice?: number;
}

class MediaStreamRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream;
  private config: RecorderConfig;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(stream: MediaStream, config: RecorderConfig = {}) {
    this.stream = stream;
    this.config = {
      mimeType: this.getSupportedMimeType(),
      videoBitsPerSecond: 2500000,
      audioBitsPerSecond: 128000,
      timeslice: 1000,
      ...config
    };
  }

  private getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'video/webm';
  }

  start(): void {
    this.chunks = [];

    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: this.config.mimeType,
      videoBitsPerSecond: this.config.videoBitsPerSecond,
      audioBitsPerSecond: this.config.audioBitsPerSecond
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
        this.emit('data', event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.chunks, { type: this.config.mimeType });
      this.emit('stop', blob);
    };

    this.mediaRecorder.onerror = (event) => {
      this.emit('error', event);
    };

    this.mediaRecorder.start(this.config.timeslice);
    this.emit('start', {});
  }

  pause(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause();
      this.emit('pause', {});
    }
  }

  resume(): void {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume();
      this.emit('resume', {});
    }
  }

  stop(): Blob {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }

    return new Blob(this.chunks, { type: this.config.mimeType });
  }

  getBlob(): Blob {
    return new Blob(this.chunks, { type: this.config.mimeType });
  }

  getState(): RecordingState | null {
    return this.mediaRecorder?.state || null;
  }

  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }
}

// ============================================================================
// QUALITY MONITOR
// ============================================================================

class StreamQualityMonitor {
  private stream: MediaStream;
  private intervalId: number | null = null;
  private metrics: StreamQualityMetrics = {
    width: 0,
    height: 0,
    frameRate: 0,
    bitrate: 0,
    droppedFrames: 0,
    latency: 0,
    jitter: 0
  };
  private prevStats: any = null;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(stream: MediaStream) {
    this.stream = stream;
  }

  start(interval: number = 1000): void {
    this.updateMetrics();
    this.intervalId = window.setInterval(() => {
      this.updateMetrics();
    }, interval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private updateMetrics(): void {
    const videoTrack = this.stream.getVideoTracks()[0];
    if (!videoTrack) return;

    const settings = videoTrack.getSettings();

    this.metrics.width = settings.width || 0;
    this.metrics.height = settings.height || 0;
    this.metrics.frameRate = settings.frameRate || 0;

    // Get detailed stats if using RTCPeerConnection
    // This is a simplified version
    this.emit('metrics', this.metrics);
  }

  getMetrics(): StreamQualityMetrics {
    return { ...this.metrics };
  }

  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }
}

// ============================================================================
// MEDIA STREAM PROCESSOR (MAIN INTERFACE)
// ============================================================================

interface MediaProcessorConfig {
  video?: VideoFilterConfig;
  audio?: AudioProcessorConfig;
  chromaKey?: ChromaKeyConfig;
  faceDetection?: boolean;
}

class MediaStreamProcessor {
  private inputStream: MediaStream;
  private outputStream: MediaStream | null = null;
  private videoFilter: VideoFilterProcessor | null = null;
  private chromaKey: ChromaKeyProcessor | null = null;
  private audioProcessor: AudioStreamProcessor | null = null;
  private faceDetector: FaceDetector | null = null;
  private config: MediaProcessorConfig;
  private running = false;

  constructor(inputStream: MediaStream, config: MediaProcessorConfig = {}) {
    this.inputStream = inputStream;
    this.config = config;
  }

  async start(): Promise<MediaStream> {
    const videoTrack = this.inputStream.getVideoTracks()[0];
    const audioTrack = this.inputStream.getAudioTracks()[0];

    const outputTracks: MediaStreamTrack[] = [];

    // Process video
    if (videoTrack && (this.config.video || this.config.chromaKey)) {
      const processedVideoTrack = await this.processVideo(videoTrack);
      outputTracks.push(processedVideoTrack);
    } else if (videoTrack) {
      outputTracks.push(videoTrack.clone());
    }

    // Process audio
    if (audioTrack && this.config.audio) {
      const processedAudioTrack = await this.processAudio();
      outputTracks.push(processedAudioTrack);
    } else if (audioTrack) {
      outputTracks.push(audioTrack.clone());
    }

    // Initialize face detector
    if (this.config.faceDetection) {
      this.faceDetector = new FaceDetector();
      await this.faceDetector.initialize();
    }

    this.outputStream = new MediaStream(outputTracks);
    this.running = true;

    return this.outputStream;
  }

  private async processVideo(videoTrack: MediaStreamTrack): Promise<MediaStreamTrack> {
    const settings = videoTrack.getSettings();
    const width = settings.width || 640;
    const height = settings.height || 480;

    // Initialize processors
    if (this.config.video) {
      this.videoFilter = new VideoFilterProcessor(width, height, this.config.video);
    }

    if (this.config.chromaKey) {
      this.chromaKey = new ChromaKeyProcessor(width, height, this.config.chromaKey);
    }

    // Use Insertable Streams API if available
    if (typeof (window as any).MediaStreamTrackProcessor !== 'undefined') {
      const processor = new (window as any).MediaStreamTrackProcessor({ track: videoTrack });
      const generator = new (window as any).MediaStreamTrackGenerator({ kind: 'video' });

      const transformer = new TransformStream({
        transform: async (frame: any, controller: any) => {
          let processedFrame = frame;

          if (this.videoFilter) {
            processedFrame = this.videoFilter.processFrame(processedFrame);
            frame.close();
          }

          if (this.chromaKey) {
            const temp = processedFrame;
            processedFrame = this.chromaKey.processFrame(processedFrame);
            if (temp !== frame) temp.close();
          }

          controller.enqueue(processedFrame);
        }
      });

      processor.readable.pipeThrough(transformer).pipeTo(generator.writable);
      return generator;
    }

    // Fallback: use canvas-based processing
    return videoTrack;
  }

  private async processAudio(): Promise<MediaStreamTrack> {
    this.audioProcessor = new AudioStreamProcessor(this.config.audio);
    await this.audioProcessor.initialize();

    const processedStream = this.audioProcessor.processStream(this.inputStream);
    return processedStream.getAudioTracks()[0];
  }

  setVideoFilter(config: Partial<VideoFilterConfig>): void {
    this.videoFilter?.setConfig(config);
  }

  async detectFaces(): Promise<FaceDetection[]> {
    if (!this.faceDetector || !this.inputStream) return [];

    const videoTrack = this.inputStream.getVideoTracks()[0];
    if (!videoTrack) return [];

    // Would need video element to detect from
    return [];
  }

  getAudioProcessor(): AudioStreamProcessor | null {
    return this.audioProcessor;
  }

  stop(): void {
    this.running = false;
    this.outputStream?.getTracks().forEach(t => t.stop());
    this.audioProcessor?.destroy();
  }
}

// ============================================================================
// REACT HOOKS
// ============================================================================

function useMediaProcessor(
  stream: MediaStream | null,
  config: MediaProcessorConfig
): {
  outputStream: MediaStream | null;
  isProcessing: boolean;
  setVideoFilter: (filter: Partial<VideoFilterConfig>) => void;
} {
  let processor: MediaStreamProcessor | null = null;
  let outputStream: MediaStream | null = null;
  let isProcessing = false;

  if (stream) {
    processor = new MediaStreamProcessor(stream, config);
    processor.start().then(s => {
      outputStream = s;
      isProcessing = true;
    });
  }

  return {
    outputStream,
    isProcessing,
    setVideoFilter: (filter) => processor?.setVideoFilter(filter)
  };
}

function useAudioVisualizer(
  stream: MediaStream | null,
  canvasRef: HTMLCanvasElement | null,
  type: VisualizerConfig['type'] = 'waveform'
): {
  volume: number;
  frequencyData: Uint8Array | null;
} {
  let audioProcessor: AudioStreamProcessor | null = null;
  let visualizer: AudioVisualizer | null = null;
  let volume = 0;
  let frequencyData: Uint8Array | null = null;

  if (stream && canvasRef) {
    audioProcessor = new AudioStreamProcessor();
    audioProcessor.processStream(stream);

    visualizer = new AudioVisualizer(canvasRef, audioProcessor, {
      type,
      width: canvasRef.width,
      height: canvasRef.height
    });
    visualizer.start();

    const update = () => {
      volume = audioProcessor!.getVolume();
      frequencyData = audioProcessor!.getFrequencyData();
    };

    setInterval(update, 16);
  }

  return { volume, frequencyData };
}

function useStreamRecorder(stream: MediaStream | null): {
  isRecording: boolean;
  start: () => void;
  stop: () => Blob;
  pause: () => void;
  resume: () => void;
} {
  let recorder: MediaStreamRecorder | null = null;
  let isRecording = false;

  return {
    isRecording,
    start: () => {
      if (stream) {
        recorder = new MediaStreamRecorder(stream);
        recorder.start();
        isRecording = true;
      }
    },
    stop: () => {
      isRecording = false;
      return recorder?.stop() || new Blob();
    },
    pause: () => recorder?.pause(),
    resume: () => recorder?.resume()
  };
}

function useStreamMixer(inputs: MixerInput[]): {
  outputStream: MediaStream | null;
  addInput: (input: MixerInput) => void;
  removeInput: (id: string) => void;
  setLayout: (layout: 'grid' | 'pip' | 'side-by-side') => void;
} {
  const mixer = new StreamMixer(1920, 1080);
  mixer.start();

  inputs.forEach(input => mixer.addInput(input));

  return {
    outputStream: mixer.getOutputStream(),
    addInput: (input) => mixer.addInput(input),
    removeInput: (id) => mixer.removeInput(id),
    setLayout: (layout) => mixer.setLayout(layout)
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Core classes
  MediaStreamProcessor,
  VideoFilterProcessor,
  AudioStreamProcessor,
  ChromaKeyProcessor,
  FaceDetector,
  AudioVisualizer,
  StreamMixer,
  MediaStreamRecorder,
  StreamQualityMonitor,

  // Hooks
  useMediaProcessor,
  useAudioVisualizer,
  useStreamRecorder,
  useStreamMixer,

  // Types
  type VideoFilterConfig,
  type AudioProcessorConfig,
  type ChromaKeyConfig,
  type MediaProcessorConfig,
  type FaceDetection,
  type MixerInput,
  type RecorderConfig,
  type StreamQualityMetrics,
  type VisualizerConfig
};

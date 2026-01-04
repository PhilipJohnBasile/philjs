# @philjs/media-stream

Video filters, audio processing, chroma key, face detection, stream mixing, and visualization for media streams.

## Installation

```bash
npm install @philjs/media-stream
```

## Features

- **Video Filters** - Brightness, contrast, blur, sharpen, vignette
- **Face Detection** - Real-time face tracking and effects
- **Chroma Key** - Green screen / background removal
- **Audio Processing** - EQ, compression, reverb, noise gate
- **Audio Visualization** - Waveform, spectrum, bars
- **Stream Mixing** - Combine multiple video/audio sources
- **Recording** - Record processed streams
- **Quality Monitoring** - Bitrate, framerate, resolution stats

## Quick Start

```typescript
import { MediaStreamProcessor, useMediaProcessor } from '@philjs/media-stream';

// Create processor
const processor = new MediaStreamProcessor();

// Get camera stream
const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
});

// Process stream
const processedStream = await processor.process(stream, {
  video: {
    filters: [
      { type: 'brightness', value: 1.2 },
      { type: 'contrast', value: 1.1 },
    ],
  },
  audio: {
    effects: [
      { type: 'noiseSuppression', threshold: -50 },
    ],
  },
});

// Use processed stream
videoElement.srcObject = processedStream;
```

## MediaStreamProcessor

### Configuration

```typescript
import { MediaStreamProcessor } from '@philjs/media-stream';

const processor = new MediaStreamProcessor({
  // Video processing
  video: {
    width: 1280,
    height: 720,
    frameRate: 30,
  },

  // Audio processing
  audio: {
    sampleRate: 48000,
    channelCount: 2,
  },

  // Performance
  useOffscreenCanvas: true,
  useWebGL: true,
  useWasm: true,
});
```

### Processing Streams

```typescript
// Process with options
const processed = await processor.process(inputStream, {
  video: {
    filters: [
      { type: 'brightness', value: 1.1 },
      { type: 'saturation', value: 1.2 },
    ],
  },
  audio: {
    effects: [
      { type: 'compressor', threshold: -24, ratio: 4 },
    ],
  },
});

// Get individual tracks
const videoTrack = processed.getVideoTracks()[0];
const audioTrack = processed.getAudioTracks()[0];

// Stop processing
processor.stop();
```

## VideoFilterProcessor

### Available Filters

```typescript
import { VideoFilterProcessor } from '@philjs/media-stream';

const videoProcessor = new VideoFilterProcessor();

// Brightness (0-2, 1 = normal)
videoProcessor.addFilter({ type: 'brightness', value: 1.2 });

// Contrast (0-2, 1 = normal)
videoProcessor.addFilter({ type: 'contrast', value: 1.1 });

// Saturation (0-2, 1 = normal)
videoProcessor.addFilter({ type: 'saturation', value: 1.3 });

// Hue rotation (0-360 degrees)
videoProcessor.addFilter({ type: 'hue', value: 45 });

// Blur (0-10 pixels)
videoProcessor.addFilter({ type: 'blur', value: 2 });

// Sharpen (0-5)
videoProcessor.addFilter({ type: 'sharpen', value: 1.5 });

// Vignette (0-1 intensity)
videoProcessor.addFilter({ type: 'vignette', value: 0.3 });

// Grayscale (0-1)
videoProcessor.addFilter({ type: 'grayscale', value: 1 });

// Sepia (0-1)
videoProcessor.addFilter({ type: 'sepia', value: 0.5 });

// Invert
videoProcessor.addFilter({ type: 'invert', value: 1 });

// Apply to stream
const filteredStream = await videoProcessor.process(inputStream);
```

### Filter Presets

```typescript
// Apply preset
videoProcessor.applyPreset('cinematic');

// Available presets
const presets = {
  natural: [
    { type: 'brightness', value: 1.05 },
    { type: 'contrast', value: 1.05 },
    { type: 'saturation', value: 1.1 },
  ],
  cinematic: [
    { type: 'contrast', value: 1.2 },
    { type: 'saturation', value: 0.9 },
    { type: 'vignette', value: 0.3 },
  ],
  vintage: [
    { type: 'sepia', value: 0.3 },
    { type: 'contrast', value: 1.1 },
    { type: 'vignette', value: 0.4 },
  ],
  blackAndWhite: [
    { type: 'grayscale', value: 1 },
    { type: 'contrast', value: 1.2 },
  ],
  vivid: [
    { type: 'saturation', value: 1.5 },
    { type: 'contrast', value: 1.15 },
  ],
};

// Custom preset
videoProcessor.registerPreset('myPreset', [
  { type: 'brightness', value: 1.1 },
  { type: 'sharpen', value: 0.5 },
]);
```

### Dynamic Filter Updates

```typescript
// Update filter in real-time
videoProcessor.updateFilter('brightness', 1.3);

// Remove filter
videoProcessor.removeFilter('blur');

// Clear all filters
videoProcessor.clearFilters();

// Get current filters
const filters = videoProcessor.getFilters();
```

## FaceDetector

### Basic Usage

```typescript
import { FaceDetector } from '@philjs/media-stream';

const detector = new FaceDetector({
  maxFaces: 5,
  minConfidence: 0.8,
  modelPath: '/models/face-detection',
});

await detector.initialize();

// Start detection
detector.start(videoElement);

// Get faces
detector.on('faces', (faces) => {
  faces.forEach(face => {
    console.log('Face bounds:', face.bounds);
    console.log('Landmarks:', face.landmarks);
    console.log('Confidence:', face.confidence);
  });
});

// Stop detection
detector.stop();
```

### Face Tracking

```typescript
const detector = new FaceDetector({
  enableTracking: true,
  trackingSmoothing: 0.5,
});

detector.on('faceEnter', (face) => {
  console.log('New face detected:', face.id);
});

detector.on('faceMove', (face) => {
  console.log('Face moved:', face.id, face.bounds);
});

detector.on('faceLeave', (face) => {
  console.log('Face left:', face.id);
});
```

### Face Effects

```typescript
// Apply effects to detected faces
const faceEffects = new FaceEffects(detector);

// Blur faces
faceEffects.addEffect('blur', { intensity: 10 });

// Box around faces
faceEffects.addEffect('box', { color: '#00ff00', width: 2 });

// Face mask/overlay
faceEffects.addEffect('mask', { image: '/masks/sunglasses.png' });

// Beauty filter
faceEffects.addEffect('beauty', { smooth: 0.5, brighten: 0.2 });
```

## ChromaKeyProcessor

### Basic Green Screen

```typescript
import { ChromaKeyProcessor } from '@philjs/media-stream';

const chromaKey = new ChromaKeyProcessor({
  color: '#00ff00',        // Key color (green)
  similarity: 0.4,         // Color match threshold
  smoothness: 0.1,         // Edge smoothing
  spill: 0.1,              // Color spill reduction
});

// Apply to stream
const keyed = await chromaKey.process(inputStream);

// With background replacement
const backgroundImage = await loadImage('/backgrounds/office.jpg');
chromaKey.setBackground(backgroundImage);

// Or video background
const backgroundVideo = document.getElementById('bg-video');
chromaKey.setBackground(backgroundVideo);

// Virtual background blur
chromaKey.setBackgroundBlur(10);
```

### Background Options

```typescript
// Solid color background
chromaKey.setBackground({ type: 'color', value: '#ffffff' });

// Image background
chromaKey.setBackground({ type: 'image', src: '/bg.jpg' });

// Video background
chromaKey.setBackground({ type: 'video', src: '/bg.mp4' });

// Blur original background
chromaKey.setBackground({ type: 'blur', intensity: 15 });

// Transparent (for compositing)
chromaKey.setBackground({ type: 'transparent' });

// Dynamic background from stream
chromaKey.setBackground({ type: 'stream', stream: desktopStream });
```

### Color Picker

```typescript
// Enable color picking from video
chromaKey.enableColorPicker((color) => {
  console.log('Selected color:', color);
  chromaKey.setKeyColor(color);
});

// Click on video to pick color
videoElement.addEventListener('click', (e) => {
  chromaKey.pickColorAt(e.offsetX, e.offsetY);
});
```

## AudioStreamProcessor

### Audio Effects

```typescript
import { AudioStreamProcessor } from '@philjs/media-stream';

const audioProcessor = new AudioStreamProcessor();

// Equalizer
audioProcessor.addEffect({
  type: 'equalizer',
  bands: [
    { frequency: 60, gain: 3 },      // Bass boost
    { frequency: 250, gain: 0 },
    { frequency: 1000, gain: 2 },    // Mid presence
    { frequency: 4000, gain: 1 },
    { frequency: 12000, gain: 2 },   // Treble boost
  ],
});

// Compressor
audioProcessor.addEffect({
  type: 'compressor',
  threshold: -24,    // dB
  ratio: 4,          // 4:1 compression
  attack: 0.003,     // seconds
  release: 0.25,     // seconds
  knee: 10,          // dB
});

// Reverb
audioProcessor.addEffect({
  type: 'reverb',
  decay: 2,          // seconds
  wet: 0.3,          // mix (0-1)
  preDelay: 0.01,
});

// Noise gate
audioProcessor.addEffect({
  type: 'noiseGate',
  threshold: -50,    // dB
  attack: 0.001,
  release: 0.1,
});

// Apply to stream
const processedStream = await audioProcessor.process(inputStream);
```

### Voice Effects

```typescript
// Voice preset effects
audioProcessor.applyPreset('podcast'); // Compression + EQ
audioProcessor.applyPreset('broadcast'); // Heavy compression
audioProcessor.applyPreset('telephone'); // Bandpass filter
audioProcessor.applyPreset('robot'); // Vocoder effect
audioProcessor.applyPreset('chipmunk'); // Pitch up
audioProcessor.applyPreset('deep'); // Pitch down

// Pitch shift
audioProcessor.addEffect({
  type: 'pitch',
  semitones: 5,  // Positive = higher, negative = lower
});

// Echo
audioProcessor.addEffect({
  type: 'echo',
  delay: 0.3,    // seconds
  feedback: 0.4, // 0-1
  wet: 0.3,
});
```

### Real-time Control

```typescript
// Get current levels
audioProcessor.on('levels', (levels) => {
  console.log('Input level:', levels.input);  // -60 to 0 dB
  console.log('Output level:', levels.output);
});

// Mute/unmute
audioProcessor.setMuted(true);
audioProcessor.setMuted(false);

// Volume control
audioProcessor.setVolume(0.8);  // 0-1

// Bypass all effects
audioProcessor.setBypass(true);
```

## AudioVisualizer

### Visualization Types

```typescript
import { AudioVisualizer } from '@philjs/media-stream';

const visualizer = new AudioVisualizer({
  canvas: document.getElementById('visualizer'),
  fftSize: 2048,
});

// Connect to audio
visualizer.connect(audioStream);

// Waveform
visualizer.setType('waveform');
visualizer.setOptions({
  color: '#00ff00',
  lineWidth: 2,
  backgroundColor: '#000000',
});

// Frequency bars
visualizer.setType('bars');
visualizer.setOptions({
  barWidth: 4,
  barSpacing: 2,
  barColor: '#ff0000',
  gradient: ['#ff0000', '#ffff00', '#00ff00'],
});

// Spectrum
visualizer.setType('spectrum');
visualizer.setOptions({
  fillColor: 'rgba(0, 255, 0, 0.5)',
  strokeColor: '#00ff00',
});

// Circular
visualizer.setType('circular');
visualizer.setOptions({
  radius: 100,
  color: '#00ffff',
  mirrorMode: true,
});

// Start visualization
visualizer.start();

// Stop
visualizer.stop();
```

### Custom Visualization

```typescript
visualizer.setCustomRenderer((ctx, frequencyData, timeData) => {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  ctx.clearRect(0, 0, width, height);

  // Custom drawing using frequencyData (Uint8Array)
  for (let i = 0; i < frequencyData.length; i++) {
    const value = frequencyData[i] / 255;
    const x = (i / frequencyData.length) * width;
    const barHeight = value * height;

    ctx.fillStyle = `hsl(${i}, 100%, 50%)`;
    ctx.fillRect(x, height - barHeight, 2, barHeight);
  }
});
```

## StreamMixer

### Mixing Streams

```typescript
import { StreamMixer } from '@philjs/media-stream';

const mixer = new StreamMixer({
  width: 1920,
  height: 1080,
  frameRate: 30,
});

// Add video sources
mixer.addSource('camera', cameraStream, {
  x: 0,
  y: 0,
  width: 1920,
  height: 1080,
  zIndex: 0,
});

mixer.addSource('screen', screenStream, {
  x: 0,
  y: 0,
  width: 1920,
  height: 1080,
  zIndex: 1,
});

// Picture-in-picture
mixer.addSource('pip-camera', cameraStream, {
  x: 1620,
  y: 780,
  width: 280,
  height: 210,
  zIndex: 2,
  borderRadius: 10,
  border: { width: 2, color: '#ffffff' },
});

// Get mixed output
const mixedStream = mixer.getOutputStream();
```

### Audio Mixing

```typescript
// Add audio sources with volume
mixer.addAudioSource('mic', micStream, { volume: 1.0 });
mixer.addAudioSource('desktop', desktopAudio, { volume: 0.5 });
mixer.addAudioSource('music', musicStream, { volume: 0.3 });

// Adjust volumes
mixer.setAudioVolume('music', 0.2);

// Mute source
mixer.muteAudio('desktop');
mixer.unmuteAudio('desktop');
```

### Layout Presets

```typescript
// Side by side
mixer.applyLayout('side-by-side', ['camera1', 'camera2']);

// Grid (2x2)
mixer.applyLayout('grid', ['cam1', 'cam2', 'cam3', 'cam4']);

// Speaker + gallery
mixer.applyLayout('speaker', {
  speaker: 'main-camera',
  gallery: ['cam1', 'cam2', 'cam3'],
});

// Picture in picture
mixer.applyLayout('pip', {
  main: 'screen',
  pip: 'camera',
  position: 'bottom-right',
});
```

### Transitions

```typescript
// Fade between sources
await mixer.transition('camera1', 'camera2', {
  type: 'fade',
  duration: 500,
});

// Slide
await mixer.transition('scene1', 'scene2', {
  type: 'slide',
  direction: 'left',
  duration: 300,
});

// Zoom
await mixer.transition('wide', 'closeup', {
  type: 'zoom',
  duration: 400,
});
```

## MediaStreamRecorder

### Recording

```typescript
import { MediaStreamRecorder } from '@philjs/media-stream';

const recorder = new MediaStreamRecorder(processedStream, {
  mimeType: 'video/webm;codecs=vp9,opus',
  videoBitsPerSecond: 5000000,
  audioBitsPerSecond: 128000,
});

// Start recording
recorder.start();

// Pause/resume
recorder.pause();
recorder.resume();

// Stop and get blob
const blob = await recorder.stop();

// Download
recorder.download('recording.webm');

// Get data URL
const dataUrl = await recorder.toDataURL();
```

### Chunked Recording

```typescript
const recorder = new MediaStreamRecorder(stream, {
  timeslice: 1000,  // Chunk every 1 second
});

recorder.on('dataavailable', (chunk) => {
  // Send chunk to server
  uploadChunk(chunk);
});

recorder.start();
```

## StreamQualityMonitor

### Monitoring

```typescript
import { StreamQualityMonitor } from '@philjs/media-stream';

const monitor = new StreamQualityMonitor(stream);

monitor.on('stats', (stats) => {
  console.log({
    // Video stats
    videoWidth: stats.video.width,
    videoHeight: stats.video.height,
    frameRate: stats.video.frameRate,
    droppedFrames: stats.video.droppedFrames,
    bitrate: stats.video.bitrate,

    // Audio stats
    audioLevel: stats.audio.level,
    audioChannels: stats.audio.channels,
    sampleRate: stats.audio.sampleRate,
  });
});

monitor.on('qualityChange', (quality) => {
  console.log('Quality changed:', quality); // 'excellent' | 'good' | 'fair' | 'poor'
});

monitor.on('warning', (warning) => {
  console.warn('Quality warning:', warning);
});

// Start monitoring
monitor.start();

// Get current stats
const currentStats = monitor.getStats();

// Stop
monitor.stop();
```

## React-style Hooks

### useMediaProcessor

```typescript
import { useMediaProcessor } from '@philjs/media-stream';

function VideoProcessor() {
  const {
    inputStream,
    outputStream,
    isProcessing,
    setInput,
    addVideoFilter,
    removeVideoFilter,
    addAudioEffect,
    removeAudioEffect,
  } = useMediaProcessor();

  const handleStart = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    setInput(stream);
    addVideoFilter({ type: 'brightness', value: 1.2 });
  };

  return (
    <div>
      <video srcObject={outputStream} autoPlay />
      <button onClick={handleStart}>Start</button>
      <input
        type="range"
        onChange={(e) => addVideoFilter({ type: 'brightness', value: e.target.value })}
      />
    </div>
  );
}
```

### useAudioVisualizer

```typescript
import { useAudioVisualizer } from '@philjs/media-stream';

function Visualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    isRunning,
    type,
    setType,
    start,
    stop,
    connect,
  } = useAudioVisualizer(canvasRef, {
    fftSize: 2048,
  });

  useEffect(() => {
    if (audioStream) {
      connect(audioStream);
      start();
    }
  }, [audioStream]);

  return (
    <div>
      <canvas ref={canvasRef} width={800} height={200} />
      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="waveform">Waveform</option>
        <option value="bars">Bars</option>
        <option value="spectrum">Spectrum</option>
        <option value="circular">Circular</option>
      </select>
    </div>
  );
}
```

### useStreamRecorder

```typescript
import { useStreamRecorder } from '@philjs/media-stream';

function RecordingControls() {
  const {
    isRecording,
    isPaused,
    duration,
    start,
    stop,
    pause,
    resume,
    download,
  } = useStreamRecorder(stream);

  return (
    <div>
      <span>Duration: {formatDuration(duration)}</span>

      {!isRecording ? (
        <button onClick={start}>Record</button>
      ) : (
        <>
          <button onClick={isPaused ? resume : pause}>
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button onClick={() => stop().then(download)}>
            Stop & Download
          </button>
        </>
      )}
    </div>
  );
}
```

### useStreamMixer

```typescript
import { useStreamMixer } from '@philjs/media-stream';

function MultiSourceMixer() {
  const {
    outputStream,
    addSource,
    removeSource,
    setLayout,
    sources,
  } = useStreamMixer({ width: 1920, height: 1080 });

  const handleAddCamera = async () => {
    const cam = await navigator.mediaDevices.getUserMedia({ video: true });
    addSource(`cam-${Date.now()}`, cam);
  };

  return (
    <div>
      <video srcObject={outputStream} autoPlay />

      <button onClick={handleAddCamera}>Add Camera</button>

      <select onChange={(e) => setLayout(e.target.value)}>
        <option value="grid">Grid</option>
        <option value="side-by-side">Side by Side</option>
        <option value="pip">Picture in Picture</option>
      </select>

      {sources.map(source => (
        <button key={source.id} onClick={() => removeSource(source.id)}>
          Remove {source.id}
        </button>
      ))}
    </div>
  );
}
```

## Types Reference

```typescript
// Video filter
interface VideoFilter {
  type: 'brightness' | 'contrast' | 'saturation' | 'hue' | 'blur' | 'sharpen' | 'vignette' | 'grayscale' | 'sepia' | 'invert';
  value: number;
}

// Audio effect
interface AudioEffect {
  type: 'equalizer' | 'compressor' | 'reverb' | 'noiseGate' | 'pitch' | 'echo';
  [key: string]: any;
}

// Face detection result
interface Face {
  id: string;
  bounds: { x: number; y: number; width: number; height: number };
  landmarks?: FaceLandmarks;
  confidence: number;
}

// Mixer source
interface MixerSource {
  id: string;
  stream: MediaStream;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  opacity?: number;
  borderRadius?: number;
  border?: { width: number; color: string };
}

// Stream quality stats
interface StreamStats {
  video: {
    width: number;
    height: number;
    frameRate: number;
    droppedFrames: number;
    bitrate: number;
  };
  audio: {
    level: number;
    channels: number;
    sampleRate: number;
  };
}
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `MediaStreamProcessor` | Main stream processor |
| `VideoFilterProcessor` | Video filter effects |
| `AudioStreamProcessor` | Audio effects processing |
| `FaceDetector` | Face detection and tracking |
| `ChromaKeyProcessor` | Green screen / background |
| `AudioVisualizer` | Audio visualization |
| `StreamMixer` | Multi-source mixing |
| `MediaStreamRecorder` | Stream recording |
| `StreamQualityMonitor` | Quality monitoring |

### Hooks

| Hook | Description |
|------|-------------|
| `useMediaProcessor()` | Stream processing |
| `useVideoFilters()` | Video filter controls |
| `useAudioEffects()` | Audio effect controls |
| `useAudioVisualizer(ref, config)` | Visualization |
| `useStreamRecorder(stream)` | Recording controls |
| `useStreamMixer(config)` | Multi-source mixing |
| `useFaceDetection(video)` | Face detection |
| `useChromaKey(stream)` | Background removal |

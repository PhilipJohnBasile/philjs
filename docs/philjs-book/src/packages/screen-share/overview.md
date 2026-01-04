# @philjs/screen-share

Screen sharing with real-time annotations, presenter mode, cursor highlighting, region selection, and recording capabilities.

## Installation

```bash
npm install @philjs/screen-share
```

## Features

- **Multi-Source Capture** - Screen, window, or tab selection
- **Real-Time Annotations** - Draw, highlight, and annotate live
- **Presenter Mode** - Picture-in-picture webcam overlay
- **Cursor Highlighting** - Visual cursor enhancement
- **Region Selection** - Share specific screen regions
- **Recording** - Record screen with annotations
- **Remote Viewing** - WebRTC-based screen sharing

## Quick Start

```typescript
import { ScreenShareManager, useScreenShare } from '@philjs/screen-share';

// Create manager
const manager = new ScreenShareManager({
  enableAnnotations: true,
  enableCursorHighlight: true,
});

// Start sharing
const stream = await manager.startCapture({
  video: {
    displaySurface: 'monitor', // 'monitor' | 'window' | 'browser'
  },
  audio: true,
});

// Enable annotations
manager.enableAnnotations();

// Add to video element
const video = document.getElementById('preview') as HTMLVideoElement;
video.srcObject = stream;
```

## ScreenShareManager

### Configuration

```typescript
import { ScreenShareManager } from '@philjs/screen-share';

const manager = new ScreenShareManager({
  // Capture settings
  video: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 },
  },
  audio: true,
  systemAudio: 'include',      // 'include' | 'exclude'

  // Features
  enableAnnotations: true,
  enableCursorHighlight: true,
  enablePresenterMode: true,
  enableRecording: true,

  // Annotation defaults
  annotationColor: '#ff0000',
  annotationLineWidth: 3,

  // Cursor highlight
  cursorHighlightColor: 'rgba(255, 255, 0, 0.5)',
  cursorHighlightRadius: 30,

  // Recording
  recordingFormat: 'webm',
  recordingCodec: 'vp9',
});
```

### Starting Capture

```typescript
// Basic capture
const stream = await manager.startCapture();

// With display surface preference
const stream = await manager.startCapture({
  video: {
    displaySurface: 'monitor',  // Full screen
  },
});

// Window capture
const stream = await manager.startCapture({
  video: {
    displaySurface: 'window',
  },
});

// Browser tab
const stream = await manager.startCapture({
  video: {
    displaySurface: 'browser',
  },
  audio: true,  // Tab audio
});

// With audio
const stream = await manager.startCapture({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
  },
  systemAudio: 'include',
});
```

### Region Selection

```typescript
// Enable region selection UI
const region = await manager.selectRegion();
console.log(region);
// { x: 100, y: 100, width: 800, height: 600 }

// Capture specific region
const stream = await manager.startCapture({
  region: {
    x: 100,
    y: 100,
    width: 800,
    height: 600,
  },
});

// Interactive region selector
manager.showRegionSelector({
  overlayColor: 'rgba(0, 0, 0, 0.5)',
  borderColor: '#00ff00',
  minWidth: 200,
  minHeight: 150,
});
```

### Stop Capture

```typescript
// Stop sharing
manager.stopCapture();

// Check if sharing
const isSharing = manager.isCapturing();

// Get current stream
const stream = manager.getStream();
```

## AnnotationLayer

### Basic Usage

```typescript
import { AnnotationLayer } from '@philjs/screen-share';

const annotations = new AnnotationLayer({
  canvas: document.getElementById('annotations-canvas'),
  color: '#ff0000',
  lineWidth: 3,
});

// Enable drawing
annotations.enable();

// Set tool
annotations.setTool('pen');

// Disable
annotations.disable();
```

### Annotation Tools

```typescript
// Pen - freehand drawing
annotations.setTool('pen');
annotations.setColor('#ff0000');
annotations.setLineWidth(3);

// Highlighter - semi-transparent
annotations.setTool('highlighter');
annotations.setColor('rgba(255, 255, 0, 0.4)');
annotations.setLineWidth(20);

// Arrow - directional pointer
annotations.setTool('arrow');
annotations.setColor('#0000ff');

// Rectangle
annotations.setTool('rectangle');
annotations.setFill(false);  // Outline only

// Filled rectangle
annotations.setTool('rectangle');
annotations.setFill(true);
annotations.setFillColor('rgba(0, 255, 0, 0.3)');

// Ellipse
annotations.setTool('ellipse');

// Text
annotations.setTool('text');
annotations.setFontSize(24);
annotations.setFontFamily('Arial');

// Spotlight - dim everything except area
annotations.setTool('spotlight');
annotations.setSpotlightRadius(100);

// Laser pointer - temporary pointer
annotations.setTool('laser');
annotations.setLaserColor('#ff0000');
annotations.setLaserDuration(500);  // Fade after 500ms
```

### Managing Annotations

```typescript
// Undo last annotation
annotations.undo();

// Redo
annotations.redo();

// Clear all
annotations.clear();

// Get all annotations
const allAnnotations = annotations.getAnnotations();

// Remove specific annotation
annotations.removeAnnotation(annotationId);

// Export as image
const dataUrl = annotations.toDataURL();

// Export as JSON
const json = annotations.toJSON();

// Import from JSON
annotations.fromJSON(json);
```

### Events

```typescript
annotations.on('annotationStart', (annotation) => {
  console.log('Started:', annotation);
});

annotations.on('annotationEnd', (annotation) => {
  console.log('Finished:', annotation);
});

annotations.on('annotationRemoved', (id) => {
  console.log('Removed:', id);
});

annotations.on('clear', () => {
  console.log('All cleared');
});
```

## CursorHighlighter

### Basic Usage

```typescript
import { CursorHighlighter } from '@philjs/screen-share';

const highlighter = new CursorHighlighter({
  container: document.getElementById('share-container'),
  color: 'rgba(255, 255, 0, 0.5)',
  radius: 30,
  showOnClick: true,
  clickColor: 'rgba(255, 0, 0, 0.5)',
  clickDuration: 300,
});

// Enable
highlighter.enable();

// Disable
highlighter.disable();

// Update position manually (for remote cursors)
highlighter.setPosition(x, y);
```

### Click Effects

```typescript
const highlighter = new CursorHighlighter({
  container,

  // Click ripple effect
  showOnClick: true,
  clickColor: 'rgba(255, 0, 0, 0.5)',
  clickDuration: 300,
  clickRipple: true,
  clickRippleCount: 3,

  // Different effects for click types
  leftClickColor: 'rgba(0, 255, 0, 0.5)',
  rightClickColor: 'rgba(0, 0, 255, 0.5)',
  doubleClickColor: 'rgba(255, 255, 0, 0.5)',
});
```

## PresenterMode

### Basic Usage

```typescript
import { PresenterMode } from '@philjs/screen-share';

const presenter = new PresenterMode({
  container: document.getElementById('share-container'),
  webcamPosition: 'bottom-right',  // Position
  webcamSize: { width: 200, height: 150 },
  webcamBorder: true,
  webcamBorderRadius: 10,
  webcamDraggable: true,
});

// Enable with webcam stream
await presenter.enable();

// Or use existing stream
presenter.enable(webcamStream);

// Disable
presenter.disable();

// Toggle
presenter.toggle();
```

### Position and Size

```typescript
// Set position
presenter.setPosition('top-left');     // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

// Custom position
presenter.setPosition({ x: 50, y: 50 });

// Resize
presenter.setSize({ width: 300, height: 225 });

// Toggle visibility
presenter.setVisible(false);
presenter.setVisible(true);
```

### Picture-in-Picture

```typescript
// Enter PiP mode
await presenter.enterPictureInPicture();

// Exit PiP
await presenter.exitPictureInPicture();

// Check PiP support
if (presenter.isPictureInPictureSupported()) {
  await presenter.enterPictureInPicture();
}
```

## RegionSelector

### Interactive Selection

```typescript
import { RegionSelector } from '@philjs/screen-share';

const selector = new RegionSelector({
  container: document.body,
  overlayColor: 'rgba(0, 0, 0, 0.5)',
  borderColor: '#00ff00',
  borderWidth: 2,
  handleSize: 10,
  minWidth: 100,
  minHeight: 100,
  aspectRatio: null,  // Free aspect ratio
});

// Show selector and get region
const region = await selector.select();
console.log(region);
// { x: 100, y: 100, width: 800, height: 600 }

// With aspect ratio constraint
const selector169 = new RegionSelector({
  container: document.body,
  aspectRatio: 16 / 9,
});
```

### Preset Regions

```typescript
// Preset regions
selector.setPresets([
  { name: 'Full Screen', region: { x: 0, y: 0, width: 1920, height: 1080 } },
  { name: 'Left Half', region: { x: 0, y: 0, width: 960, height: 1080 } },
  { name: 'Right Half', region: { x: 960, y: 0, width: 960, height: 1080 } },
  { name: '720p Center', region: { x: 240, y: 180, width: 1280, height: 720 } },
]);

// Show with presets
const region = await selector.selectWithPresets();
```

## Recording

### Basic Recording

```typescript
// Start recording
await manager.startRecording();

// Stop and get blob
const blob = await manager.stopRecording();

// Download
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'screen-recording.webm';
a.click();
```

### Recording Options

```typescript
await manager.startRecording({
  mimeType: 'video/webm;codecs=vp9',
  videoBitsPerSecond: 5000000,  // 5 Mbps
  audioBitsPerSecond: 128000,   // 128 kbps

  // Include annotations
  includeAnnotations: true,

  // Include cursor highlight
  includeCursor: true,

  // Include presenter webcam
  includeWebcam: true,
});
```

### Recording Events

```typescript
manager.on('recordingStarted', () => {
  console.log('Recording started');
});

manager.on('recordingPaused', () => {
  console.log('Recording paused');
});

manager.on('recordingResumed', () => {
  console.log('Recording resumed');
});

manager.on('recordingStopped', (blob) => {
  console.log('Recording stopped, size:', blob.size);
});

manager.on('recordingError', (error) => {
  console.error('Recording error:', error);
});
```

### Recording Controls

```typescript
// Pause recording
manager.pauseRecording();

// Resume recording
manager.resumeRecording();

// Check state
const isRecording = manager.isRecording();
const isPaused = manager.isRecordingPaused();

// Get current duration
const duration = manager.getRecordingDuration();
```

## Remote Sharing

### WebRTC Integration

```typescript
import { ScreenShareManager, RemoteViewer } from '@philjs/screen-share';

// Presenter side
const manager = new ScreenShareManager();
const stream = await manager.startCapture();

// Send via WebRTC
peerConnection.addTrack(stream.getVideoTracks()[0], stream);
if (stream.getAudioTracks().length > 0) {
  peerConnection.addTrack(stream.getAudioTracks()[0], stream);
}

// Viewer side
const viewer = new RemoteViewer({
  container: document.getElementById('remote-view'),
  enableControls: true,
});

peerConnection.ontrack = (event) => {
  viewer.setStream(event.streams[0]);
};
```

### Annotation Sync

```typescript
// Presenter: broadcast annotations
manager.annotations.on('annotationEnd', (annotation) => {
  webSocket.send(JSON.stringify({
    type: 'annotation',
    data: annotation,
  }));
});

// Viewer: receive and display
webSocket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'annotation') {
    viewer.addAnnotation(message.data);
  }
};
```

## React-style Hooks

### useScreenShare

```typescript
import { useScreenShare } from '@philjs/screen-share';

function ScreenShareComponent() {
  const {
    isSharing,
    stream,
    error,
    startCapture,
    stopCapture,
    enableAnnotations,
    disableAnnotations,
  } = useScreenShare({
    enableAnnotations: true,
    enableCursorHighlight: true,
  });

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline />

      {!isSharing ? (
        <button onClick={() => startCapture()}>Start Sharing</button>
      ) : (
        <button onClick={stopCapture}>Stop Sharing</button>
      )}

      {error && <p className="error">{error.message}</p>}
    </div>
  );
}
```

### useAnnotationTools

```typescript
import { useAnnotationTools } from '@philjs/screen-share';

function AnnotationToolbar() {
  const {
    tool,
    color,
    lineWidth,
    setTool,
    setColor,
    setLineWidth,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
  } = useAnnotationTools();

  return (
    <div className="toolbar">
      <button
        className={tool === 'pen' ? 'active' : ''}
        onClick={() => setTool('pen')}
      >
        Pen
      </button>
      <button
        className={tool === 'highlighter' ? 'active' : ''}
        onClick={() => setTool('highlighter')}
      >
        Highlighter
      </button>
      <button
        className={tool === 'arrow' ? 'active' : ''}
        onClick={() => setTool('arrow')}
      >
        Arrow
      </button>
      <button
        className={tool === 'text' ? 'active' : ''}
        onClick={() => setTool('text')}
      >
        Text
      </button>

      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
      />

      <input
        type="range"
        min={1}
        max={20}
        value={lineWidth}
        onChange={(e) => setLineWidth(Number(e.target.value))}
      />

      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
      <button onClick={clear}>Clear</button>
    </div>
  );
}
```

### usePresenterMode

```typescript
import { usePresenterMode } from '@philjs/screen-share';

function PresenterControls() {
  const {
    isEnabled,
    position,
    size,
    isVisible,
    enable,
    disable,
    toggle,
    setPosition,
    setSize,
    setVisible,
    enterPiP,
    exitPiP,
    isPiPActive,
  } = usePresenterMode();

  return (
    <div className="presenter-controls">
      <button onClick={toggle}>
        {isEnabled ? 'Disable Webcam' : 'Enable Webcam'}
      </button>

      {isEnabled && (
        <>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          >
            <option value="top-left">Top Left</option>
            <option value="top-right">Top Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-right">Bottom Right</option>
          </select>

          <button onClick={isPiPActive ? exitPiP : enterPiP}>
            {isPiPActive ? 'Exit PiP' : 'Enter PiP'}
          </button>
        </>
      )}
    </div>
  );
}
```

## Types Reference

```typescript
// Capture options
interface CaptureOptions {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
  systemAudio?: 'include' | 'exclude';
  region?: Region;
}

// Region
interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Annotation
interface Annotation {
  id: string;
  type: 'pen' | 'highlighter' | 'arrow' | 'rectangle' | 'ellipse' | 'text' | 'spotlight' | 'laser';
  points: Point[];
  color: string;
  lineWidth: number;
  text?: string;
  fontSize?: number;
  fill?: boolean;
  fillColor?: string;
  timestamp: number;
}

// Presenter position
type PresenterPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | { x: number; y: number };

// Recording options
interface RecordingOptions {
  mimeType?: string;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
  includeAnnotations?: boolean;
  includeCursor?: boolean;
  includeWebcam?: boolean;
}
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `ScreenShareManager` | Main screen sharing controller |
| `AnnotationLayer` | Drawing and annotation overlay |
| `CursorHighlighter` | Cursor visibility enhancement |
| `PresenterMode` | Webcam picture-in-picture |
| `RegionSelector` | Interactive region selection |
| `RemoteViewer` | Remote screen viewer |

### Hooks

| Hook | Description |
|------|-------------|
| `useScreenShare(config)` | Screen sharing controls |
| `useAnnotationTools()` | Annotation tool state |
| `usePresenterMode()` | Presenter mode controls |
| `useRecording()` | Recording controls |

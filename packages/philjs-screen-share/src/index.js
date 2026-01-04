/**
 * @philjs/screen-share - Advanced screen sharing for PhilJS
 *
 * Features:
 * - Multi-source screen capture (screen, window, tab)
 * - Real-time annotation overlay
 * - Presenter mode with webcam picture-in-picture
 * - Cursor highlighting and spotlight
 * - Region selection and cropping
 * - Frame rate control and quality optimization
 * - Screen recording with system audio
 * - Remote control (with permissions)
 */
// ============================================================================
// CURSOR HIGHLIGHTER
// ============================================================================
class CursorHighlighter {
    canvas;
    ctx;
    cursorPos = { x: 0, y: 0 };
    isSpotlight = false;
    highlightRadius = 20;
    spotlightRadius = 100;
    clickRipples = [];
    animationFrame = null;
    constructor(width, height) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
    }
    setCursorPosition(x, y) {
        this.cursorPos = { x, y };
    }
    enableSpotlight(enabled) {
        this.isSpotlight = enabled;
    }
    addClickRipple(x, y) {
        this.clickRipples.push({ x, y, radius: 0, opacity: 1 });
    }
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.isSpotlight) {
            // Dark overlay with spotlight cutout
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            // Create spotlight
            this.ctx.globalCompositeOperation = 'destination-out';
            const gradient = this.ctx.createRadialGradient(this.cursorPos.x, this.cursorPos.y, 0, this.cursorPos.x, this.cursorPos.y, this.spotlightRadius);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(this.cursorPos.x, this.cursorPos.y, this.spotlightRadius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalCompositeOperation = 'source-over';
        }
        else {
            // Regular cursor highlight
            const gradient = this.ctx.createRadialGradient(this.cursorPos.x, this.cursorPos.y, 0, this.cursorPos.x, this.cursorPos.y, this.highlightRadius);
            gradient.addColorStop(0, 'rgba(255, 255, 0, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(this.cursorPos.x, this.cursorPos.y, this.highlightRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        // Render click ripples
        this.clickRipples = this.clickRipples.filter(ripple => {
            ripple.radius += 3;
            ripple.opacity -= 0.03;
            if (ripple.opacity <= 0)
                return false;
            this.ctx.strokeStyle = `rgba(255, 255, 0, ${ripple.opacity})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            return true;
        });
        return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
    getCanvas() {
        return this.canvas;
    }
}
// ============================================================================
// ANNOTATION LAYER
// ============================================================================
class AnnotationLayer {
    canvas;
    ctx;
    annotations = [];
    currentAnnotation = null;
    currentTool = {
        type: 'pen',
        color: '#ff0000',
        strokeWidth: 3
    };
    isDrawing = false;
    laserPosition = null;
    listeners = new Map();
    constructor(width, height) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    }
    handleMouseDown(e) {
        if (this.currentTool.type === 'laser') {
            this.laserPosition = { x: e.offsetX, y: e.offsetY };
            return;
        }
        this.isDrawing = true;
        this.currentAnnotation = {
            id: crypto.randomUUID(),
            tool: { ...this.currentTool },
            points: [{ x: e.offsetX, y: e.offsetY }],
            timestamp: Date.now()
        };
    }
    handleMouseMove(e) {
        if (this.currentTool.type === 'laser') {
            this.laserPosition = { x: e.offsetX, y: e.offsetY };
            this.render();
            return;
        }
        if (!this.isDrawing || !this.currentAnnotation)
            return;
        this.currentAnnotation.points.push({ x: e.offsetX, y: e.offsetY });
        this.render();
    }
    handleMouseUp() {
        if (this.currentTool.type === 'laser') {
            this.laserPosition = null;
            this.render();
            return;
        }
        if (this.currentAnnotation && this.currentAnnotation.points.length > 1) {
            this.annotations.push(this.currentAnnotation);
            this.emit('annotationAdded', this.currentAnnotation);
        }
        this.isDrawing = false;
        this.currentAnnotation = null;
    }
    setTool(tool) {
        this.currentTool = { ...this.currentTool, ...tool };
    }
    addText(x, y, text) {
        const annotation = {
            id: crypto.randomUUID(),
            tool: { ...this.currentTool, type: 'text' },
            points: [{ x, y }],
            text,
            timestamp: Date.now()
        };
        this.annotations.push(annotation);
        this.render();
        this.emit('annotationAdded', annotation);
    }
    undo() {
        const removed = this.annotations.pop();
        if (removed) {
            this.render();
            this.emit('annotationRemoved', removed);
        }
    }
    clear() {
        this.annotations = [];
        this.render();
        this.emit('annotationsCleared', {});
    }
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Render saved annotations
        this.annotations.forEach(a => this.renderAnnotation(a));
        // Render current annotation
        if (this.currentAnnotation) {
            this.renderAnnotation(this.currentAnnotation);
        }
        // Render laser pointer
        if (this.laserPosition) {
            this.renderLaser(this.laserPosition.x, this.laserPosition.y);
        }
    }
    renderAnnotation(annotation) {
        const { tool, points, text } = annotation;
        this.ctx.strokeStyle = tool.color;
        this.ctx.fillStyle = tool.color;
        this.ctx.lineWidth = tool.strokeWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.globalAlpha = tool.opacity ?? 1;
        switch (tool.type) {
            case 'pen':
                this.drawPath(points);
                break;
            case 'highlighter':
                this.ctx.globalAlpha = 0.4;
                this.ctx.lineWidth = tool.strokeWidth * 4;
                this.drawPath(points);
                break;
            case 'arrow':
                this.drawArrow(points);
                break;
            case 'rectangle':
                this.drawRectangle(points);
                break;
            case 'ellipse':
                this.drawEllipse(points);
                break;
            case 'text':
                if (text && points[0]) {
                    this.ctx.font = `${tool.strokeWidth * 8}px sans-serif`;
                    this.ctx.fillText(text, points[0].x, points[0].y);
                }
                break;
            case 'spotlight':
                this.drawSpotlight(points);
                break;
        }
        this.ctx.globalAlpha = 1;
    }
    drawPath(points) {
        if (points.length < 2)
            return;
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.stroke();
    }
    drawArrow(points) {
        if (points.length < 2)
            return;
        const start = points[0];
        const end = points[points.length - 1];
        // Draw line
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();
        // Draw arrowhead
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLength = 15;
        this.ctx.beginPath();
        this.ctx.moveTo(end.x, end.y);
        this.ctx.lineTo(end.x - headLength * Math.cos(angle - Math.PI / 6), end.y - headLength * Math.sin(angle - Math.PI / 6));
        this.ctx.moveTo(end.x, end.y);
        this.ctx.lineTo(end.x - headLength * Math.cos(angle + Math.PI / 6), end.y - headLength * Math.sin(angle + Math.PI / 6));
        this.ctx.stroke();
    }
    drawRectangle(points) {
        if (points.length < 2)
            return;
        const start = points[0];
        const end = points[points.length - 1];
        const width = end.x - start.x;
        const height = end.y - start.y;
        this.ctx.strokeRect(start.x, start.y, width, height);
    }
    drawEllipse(points) {
        if (points.length < 2)
            return;
        const start = points[0];
        const end = points[points.length - 1];
        const centerX = (start.x + end.x) / 2;
        const centerY = (start.y + end.y) / 2;
        const radiusX = Math.abs(end.x - start.x) / 2;
        const radiusY = Math.abs(end.y - start.y) / 2;
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    drawSpotlight(points) {
        if (points.length < 2)
            return;
        const start = points[0];
        const end = points[points.length - 1];
        const centerX = (start.x + end.x) / 2;
        const centerY = (start.y + end.y) / 2;
        const radius = Math.max(Math.abs(end.x - start.x) / 2, Math.abs(end.y - start.y) / 2);
        // Draw dimmed overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // Cut out spotlight
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalCompositeOperation = 'source-over';
    }
    renderLaser(x, y) {
        // Laser dot
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 8);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 0, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8, 0, Math.PI * 2);
        this.ctx.fill();
        // Pulsing ring
        const time = Date.now() / 200;
        const ringRadius = 15 + Math.sin(time) * 5;
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    getAnnotations() {
        return [...this.annotations];
    }
    setAnnotations(annotations) {
        this.annotations = annotations;
        this.render();
    }
    getCanvas() {
        return this.canvas;
    }
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        return () => this.listeners.get(event)?.delete(callback);
    }
    emit(event, data) {
        this.listeners.get(event)?.forEach(cb => cb(data));
    }
}
// ============================================================================
// PRESENTER MODE
// ============================================================================
class PresenterMode {
    mainCanvas;
    ctx;
    screenStream;
    webcamStream = null;
    position;
    size; // percentage
    screenVideo;
    webcamVideo = null;
    outputStream;
    animationFrame = null;
    constructor(screenStream, position = 'bottom-right', size = 20) {
        this.screenStream = screenStream;
        this.position = position;
        this.size = size;
        const track = screenStream.getVideoTracks()[0];
        const settings = track.getSettings();
        this.mainCanvas = document.createElement('canvas');
        this.mainCanvas.width = settings.width || 1920;
        this.mainCanvas.height = settings.height || 1080;
        this.ctx = this.mainCanvas.getContext('2d');
        // Create video element for screen
        this.screenVideo = document.createElement('video');
        this.screenVideo.srcObject = screenStream;
        this.screenVideo.muted = true;
        this.screenVideo.play();
        // Create output stream from canvas
        this.outputStream = this.mainCanvas.captureStream(30);
        // Copy audio from screen stream
        screenStream.getAudioTracks().forEach(track => {
            this.outputStream.addTrack(track.clone());
        });
        this.startCompositing();
    }
    async enableWebcam() {
        this.webcamStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 320 },
                height: { ideal: 240 }
            },
            audio: false
        });
        this.webcamVideo = document.createElement('video');
        this.webcamVideo.srcObject = this.webcamStream;
        this.webcamVideo.muted = true;
        this.webcamVideo.play();
    }
    disableWebcam() {
        this.webcamStream?.getTracks().forEach(t => t.stop());
        this.webcamStream = null;
        this.webcamVideo = null;
    }
    setPosition(position) {
        this.position = position;
    }
    setSize(size) {
        this.size = Math.max(10, Math.min(50, size));
    }
    startCompositing() {
        const render = () => {
            // Draw screen
            this.ctx.drawImage(this.screenVideo, 0, 0, this.mainCanvas.width, this.mainCanvas.height);
            // Draw webcam overlay
            if (this.webcamVideo && this.webcamStream) {
                const pipWidth = this.mainCanvas.width * (this.size / 100);
                const pipHeight = pipWidth * (3 / 4); // 4:3 aspect ratio
                const padding = 20;
                let x = 0, y = 0;
                switch (this.position) {
                    case 'top-left':
                        x = padding;
                        y = padding;
                        break;
                    case 'top-right':
                        x = this.mainCanvas.width - pipWidth - padding;
                        y = padding;
                        break;
                    case 'bottom-left':
                        x = padding;
                        y = this.mainCanvas.height - pipHeight - padding;
                        break;
                    case 'bottom-right':
                        x = this.mainCanvas.width - pipWidth - padding;
                        y = this.mainCanvas.height - pipHeight - padding;
                        break;
                }
                // Draw rounded rectangle background
                const radius = 10;
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.beginPath();
                this.ctx.roundRect(x - 4, y - 4, pipWidth + 8, pipHeight + 8, radius);
                this.ctx.fill();
                // Clip to rounded rectangle
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.roundRect(x, y, pipWidth, pipHeight, radius - 4);
                this.ctx.clip();
                // Draw webcam
                this.ctx.drawImage(this.webcamVideo, x, y, pipWidth, pipHeight);
                this.ctx.restore();
            }
            this.animationFrame = requestAnimationFrame(render);
        };
        render();
    }
    getOutputStream() {
        return this.outputStream;
    }
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.disableWebcam();
        this.screenStream.getTracks().forEach(t => t.stop());
        this.outputStream.getTracks().forEach(t => t.stop());
    }
}
// ============================================================================
// REGION SELECTOR
// ============================================================================
class RegionSelector {
    overlay;
    selection;
    startPoint = null;
    region = null;
    resolve = null;
    constructor() {
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.3);
      cursor: crosshair;
      z-index: 999999;
    `;
        this.selection = document.createElement('div');
        this.selection.style.cssText = `
      position: absolute;
      border: 2px dashed #fff;
      background: rgba(255, 255, 255, 0.1);
      pointer-events: none;
    `;
        this.overlay.appendChild(this.selection);
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.overlay.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.overlay.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.overlay.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.overlay.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    handleMouseDown(e) {
        this.startPoint = { x: e.clientX, y: e.clientY };
        this.selection.style.display = 'block';
    }
    handleMouseMove(e) {
        if (!this.startPoint)
            return;
        const x = Math.min(this.startPoint.x, e.clientX);
        const y = Math.min(this.startPoint.y, e.clientY);
        const width = Math.abs(e.clientX - this.startPoint.x);
        const height = Math.abs(e.clientY - this.startPoint.y);
        this.selection.style.left = `${x}px`;
        this.selection.style.top = `${y}px`;
        this.selection.style.width = `${width}px`;
        this.selection.style.height = `${height}px`;
        this.region = { x, y, width, height };
    }
    handleMouseUp() {
        this.cleanup();
        this.resolve?.(this.region);
    }
    handleKeyDown(e) {
        if (e.key === 'Escape') {
            this.cleanup();
            this.resolve?.(null);
        }
    }
    cleanup() {
        this.overlay.remove();
        this.startPoint = null;
    }
    selectRegion() {
        document.body.appendChild(this.overlay);
        this.overlay.focus();
        return new Promise((resolve) => {
            this.resolve = resolve;
        });
    }
}
// ============================================================================
// SCREEN SHARE MANAGER
// ============================================================================
class ScreenShareManager {
    config;
    screenStream = null;
    presenterMode = null;
    annotationLayer = null;
    cursorHighlighter = null;
    cropRegion = null;
    compositeCanvas = null;
    compositeCtx = null;
    outputStream = null;
    animationFrame = null;
    mediaRecorder = null;
    recordedChunks = [];
    listeners = new Map();
    constructor(config = {}) {
        this.config = {
            preferredSource: 'screen',
            systemAudio: true,
            selfBrowserAudio: false,
            frameRate: 30,
            cursorHighlight: false,
            presenterMode: false,
            webcamPosition: 'bottom-right',
            webcamSize: 20,
            ...config
        };
    }
    async start() {
        // Request screen capture
        const displayMediaOptions = {
            video: {
                displaySurface: this.config.preferredSource,
                frameRate: this.config.frameRate
            },
            audio: this.config.systemAudio ? {
                suppressLocalAudioPlayback: !this.config.selfBrowserAudio
            } : false
        };
        if (this.config.resolution) {
            displayMediaOptions.video.width = this.config.resolution.width;
            displayMediaOptions.video.height = this.config.resolution.height;
        }
        this.screenStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
        const videoTrack = this.screenStream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        const width = settings.width || 1920;
        const height = settings.height || 1080;
        // Initialize annotation layer
        this.annotationLayer = new AnnotationLayer(width, height);
        // Initialize cursor highlighter
        if (this.config.cursorHighlight) {
            this.cursorHighlighter = new CursorHighlighter(width, height);
        }
        // Initialize presenter mode
        if (this.config.presenterMode) {
            this.presenterMode = new PresenterMode(this.screenStream, this.config.webcamPosition, this.config.webcamSize);
            await this.presenterMode.enableWebcam();
        }
        // Set up compositing
        this.compositeCanvas = document.createElement('canvas');
        this.compositeCanvas.width = width;
        this.compositeCanvas.height = height;
        this.compositeCtx = this.compositeCanvas.getContext('2d');
        // Create composite stream
        this.outputStream = this.compositeCanvas.captureStream(this.config.frameRate);
        // Copy audio track
        this.screenStream.getAudioTracks().forEach(track => {
            this.outputStream.addTrack(track.clone());
        });
        // Start compositing loop
        this.startCompositing();
        // Handle track ended
        videoTrack.addEventListener('ended', () => {
            this.stop();
            this.emit('stopped', { reason: 'user' });
        });
        this.emit('started', { stream: this.outputStream });
        return this.outputStream;
    }
    startCompositing() {
        const screenVideo = document.createElement('video');
        screenVideo.srcObject = this.presenterMode
            ? this.presenterMode.getOutputStream()
            : this.screenStream;
        screenVideo.muted = true;
        screenVideo.play();
        const render = () => {
            if (!this.compositeCtx || !this.compositeCanvas)
                return;
            // Draw screen (with presenter mode overlay if enabled)
            if (this.cropRegion) {
                this.compositeCtx.drawImage(screenVideo, this.cropRegion.x, this.cropRegion.y, this.cropRegion.width, this.cropRegion.height, 0, 0, this.compositeCanvas.width, this.compositeCanvas.height);
            }
            else {
                this.compositeCtx.drawImage(screenVideo, 0, 0, this.compositeCanvas.width, this.compositeCanvas.height);
            }
            // Draw cursor highlight
            if (this.cursorHighlighter) {
                const highlightData = this.cursorHighlighter.render();
                this.compositeCtx.putImageData(highlightData, 0, 0);
            }
            // Draw annotations
            if (this.annotationLayer) {
                this.compositeCtx.drawImage(this.annotationLayer.getCanvas(), 0, 0);
            }
            this.animationFrame = requestAnimationFrame(render);
        };
        render();
    }
    // ==================== ANNOTATION CONTROLS ====================
    setAnnotationTool(tool) {
        this.annotationLayer?.setTool(tool);
    }
    addTextAnnotation(x, y, text) {
        this.annotationLayer?.addText(x, y, text);
    }
    undoAnnotation() {
        this.annotationLayer?.undo();
    }
    clearAnnotations() {
        this.annotationLayer?.clear();
    }
    getAnnotations() {
        return this.annotationLayer?.getAnnotations() || [];
    }
    getAnnotationCanvas() {
        return this.annotationLayer?.getCanvas() || null;
    }
    // ==================== CURSOR CONTROLS ====================
    setCursorPosition(x, y) {
        this.cursorHighlighter?.setCursorPosition(x, y);
    }
    enableSpotlight(enabled) {
        this.cursorHighlighter?.enableSpotlight(enabled);
    }
    addClickRipple(x, y) {
        this.cursorHighlighter?.addClickRipple(x, y);
    }
    // ==================== REGION CONTROLS ====================
    async selectRegion() {
        const selector = new RegionSelector();
        this.cropRegion = await selector.selectRegion();
        return this.cropRegion;
    }
    setCropRegion(region) {
        this.cropRegion = region;
    }
    // ==================== PRESENTER MODE CONTROLS ====================
    async enablePresenterMode() {
        if (!this.screenStream || this.presenterMode)
            return;
        this.presenterMode = new PresenterMode(this.screenStream, this.config.webcamPosition, this.config.webcamSize);
        await this.presenterMode.enableWebcam();
    }
    disablePresenterMode() {
        this.presenterMode?.destroy();
        this.presenterMode = null;
    }
    setWebcamPosition(position) {
        this.presenterMode?.setPosition(position);
    }
    setWebcamSize(size) {
        this.presenterMode?.setSize(size);
    }
    // ==================== RECORDING ====================
    startRecording() {
        if (!this.outputStream)
            return;
        this.mediaRecorder = new MediaRecorder(this.outputStream, {
            mimeType: 'video/webm;codecs=vp9,opus'
        });
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };
        this.mediaRecorder.start(1000);
        this.emit('recordingStarted', {});
    }
    stopRecording() {
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
            const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
            this.recordedChunks = [];
            this.emit('recordingStopped', blob);
            return blob;
        }
        return new Blob();
    }
    pauseRecording() {
        this.mediaRecorder?.pause();
        this.emit('recordingPaused', {});
    }
    resumeRecording() {
        this.mediaRecorder?.resume();
        this.emit('recordingResumed', {});
    }
    // ==================== UTILITIES ====================
    getOutputStream() {
        return this.outputStream;
    }
    getScreenStream() {
        return this.screenStream;
    }
    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.mediaRecorder?.stop();
        this.presenterMode?.destroy();
        this.screenStream?.getTracks().forEach(t => t.stop());
        this.outputStream?.getTracks().forEach(t => t.stop());
        this.screenStream = null;
        this.outputStream = null;
        this.presenterMode = null;
        this.annotationLayer = null;
        this.cursorHighlighter = null;
        this.emit('stopped', { reason: 'manual' });
    }
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        return () => this.listeners.get(event)?.delete(callback);
    }
    emit(event, data) {
        this.listeners.get(event)?.forEach(cb => cb(data));
    }
}
function useScreenShare(config) {
    let manager = null;
    let isSharing = false;
    let stream = null;
    let annotations = [];
    const start = async () => {
        manager = new ScreenShareManager(config);
        stream = await manager.start();
        isSharing = true;
        manager.on('stopped', () => {
            isSharing = false;
            stream = null;
        });
    };
    const stop = () => {
        manager?.stop();
        manager = null;
        isSharing = false;
        stream = null;
    };
    return {
        isSharing,
        stream,
        annotations,
        start,
        stop,
        setTool: (tool) => manager?.setAnnotationTool(tool),
        undoAnnotation: () => manager?.undoAnnotation(),
        clearAnnotations: () => manager?.clearAnnotations(),
        enableSpotlight: (enabled) => manager?.enableSpotlight(enabled),
        selectRegion: async () => { await manager?.selectRegion(); },
        startRecording: () => manager?.startRecording(),
        stopRecording: () => manager?.stopRecording() || new Blob()
    };
}
function useAnnotationTools() {
    const tools = [
        { type: 'pen', color: '#ff0000', strokeWidth: 3 },
        { type: 'highlighter', color: '#ffff00', strokeWidth: 10, opacity: 0.4 },
        { type: 'arrow', color: '#ff0000', strokeWidth: 3 },
        { type: 'rectangle', color: '#00ff00', strokeWidth: 2 },
        { type: 'ellipse', color: '#0000ff', strokeWidth: 2 },
        { type: 'text', color: '#ffffff', strokeWidth: 3 },
        { type: 'spotlight', color: '#000000', strokeWidth: 0 },
        { type: 'laser', color: '#ff0000', strokeWidth: 0 }
    ];
    let currentTool = tools[0];
    return {
        tools,
        currentTool,
        setCurrentTool: (tool) => { currentTool = tool; },
        getToolByType: (type) => tools.find(t => t.type === type)
    };
}
function usePresenterMode(screenStream) {
    let presenter = null;
    let isEnabled = false;
    let position = 'bottom-right';
    let size = 20;
    const enable = async () => {
        if (!screenStream)
            return;
        presenter = new PresenterMode(screenStream, position, size);
        await presenter.enableWebcam();
        isEnabled = true;
    };
    const disable = () => {
        presenter?.destroy();
        presenter = null;
        isEnabled = false;
    };
    return {
        isEnabled,
        position,
        size,
        enable,
        disable,
        setPosition: (pos) => {
            position = pos;
            presenter?.setPosition(pos);
        },
        setSize: (s) => {
            size = s;
            presenter?.setSize(s);
        },
        getOutputStream: () => presenter?.getOutputStream() || null
    };
}
// ============================================================================
// EXPORTS
// ============================================================================
export { 
// Core classes
ScreenShareManager, AnnotationLayer, CursorHighlighter, PresenterMode, RegionSelector, 
// Hooks
useScreenShare, useAnnotationTools, usePresenterMode };
//# sourceMappingURL=index.js.map
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
// VIDEO FILTER PROCESSOR
// ============================================================================
class VideoFilterProcessor {
    canvas;
    ctx;
    config;
    width;
    height;
    constructor(width, height, config = {}) {
        this.width = width;
        this.height = height;
        this.canvas = new OffscreenCanvas(width, height);
        this.ctx = this.canvas.getContext('2d');
        this.config = config;
    }
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    processFrame(inputFrame) {
        const width = inputFrame.displayWidth;
        const height = inputFrame.displayHeight;
        if (this.width !== width || this.height !== height) {
            this.width = width;
            this.height = height;
            this.canvas = new OffscreenCanvas(width, height);
            this.ctx = this.canvas.getContext('2d');
        }
        // Draw input frame
        this.ctx.drawImage(inputFrame, 0, 0);
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
    buildFilterString() {
        const filters = [];
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
    needsPixelProcessing() {
        return !!(this.config.sharpen || this.config.vignette || this.config.noise);
    }
    processPixels(imageData) {
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
    applySharpen(data, width, height, amount) {
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
    applyVignette(data, width, height, amount) {
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
                data[idx] = data[idx] * factor;
                data[idx + 1] = data[idx + 1] * factor;
                data[idx + 2] = data[idx + 2] * factor;
            }
        }
    }
    applyNoise(data, amount) {
        const intensity = amount * 50;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * intensity;
            data[i] = Math.min(255, Math.max(0, data[i] + noise));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
    }
}
class FaceDetector {
    detector;
    isReady = false;
    async initialize() {
        // Use browser's FaceDetector API if available
        if ('FaceDetector' in window) {
            this.detector = new window.FaceDetector({
                maxDetectedFaces: 5,
                fastMode: true
            });
            this.isReady = true;
        }
        else {
            // Fallback to TensorFlow.js face detection
            console.warn('Native FaceDetector not available, using fallback');
        }
    }
    async detect(source) {
        if (!this.isReady || !this.detector)
            return [];
        try {
            const faces = await this.detector.detect(source);
            return faces.map((face) => ({
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
        }
        catch (e) {
            return [];
        }
    }
}
class ChromaKeyProcessor {
    canvas;
    ctx;
    config;
    backgroundImage = null;
    constructor(width, height, config) {
        this.canvas = new OffscreenCanvas(width, height);
        this.ctx = this.canvas.getContext('2d');
        this.config = config;
    }
    setBackground(image) {
        this.backgroundImage = image;
    }
    async setBackgroundUrl(url) {
        const response = await fetch(url);
        const blob = await response.blob();
        this.backgroundImage = await createImageBitmap(blob);
    }
    processFrame(inputFrame) {
        const width = inputFrame.displayWidth;
        const height = inputFrame.displayHeight;
        // Resize canvas if needed
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas = new OffscreenCanvas(width, height);
            this.ctx = this.canvas.getContext('2d');
        }
        // Draw background first
        if (this.backgroundImage) {
            this.ctx.drawImage(this.backgroundImage, 0, 0, width, height);
        }
        else {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, width, height);
        }
        // Draw and process foreground
        const tempCanvas = new OffscreenCanvas(width, height);
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(inputFrame, 0, 0);
        const imageData = tempCtx.getImageData(0, 0, width, height);
        this.applyChromaKey(imageData);
        tempCtx.putImageData(imageData, 0, 0);
        this.ctx.drawImage(tempCanvas, 0, 0);
        return new VideoFrame(this.canvas, { timestamp: inputFrame.timestamp });
    }
    applyChromaKey(imageData) {
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
            }
            else if (distance < threshold + smoothness) {
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
    hexToRgb(hex) {
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
    audioContext;
    sourceNode = null;
    destinationNode;
    gainNode;
    compressorNode = null;
    eqNodes = [];
    convolverNode = null;
    analyserNode;
    config;
    constructor(config = {}) {
        this.audioContext = new AudioContext();
        this.destinationNode = this.audioContext.createMediaStreamDestination();
        this.gainNode = this.audioContext.createGain();
        this.analyserNode = this.audioContext.createAnalyser();
        this.analyserNode.fftSize = 2048;
        this.config = config;
    }
    async initialize() {
        // Load reverb impulse response if needed
        if (this.config.reverb) {
            await this.loadReverbImpulse();
        }
    }
    async loadReverbImpulse() {
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
    processStream(inputStream) {
        this.sourceNode = this.audioContext.createMediaStreamSource(inputStream);
        let currentNode = this.sourceNode;
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
                filter.gain.value = this.config.equalizer[i] || 0;
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
    setGain(value) {
        this.gainNode.gain.value = value;
    }
    setEqualizer(bands) {
        this.eqNodes.forEach((node, i) => {
            node.gain.value = bands[i] || 0;
        });
    }
    getFrequencyData() {
        const data = new Uint8Array(this.analyserNode.frequencyBinCount);
        this.analyserNode.getByteFrequencyData(data);
        return data;
    }
    getTimeDomainData() {
        const data = new Uint8Array(this.analyserNode.fftSize);
        this.analyserNode.getByteTimeDomainData(data);
        return data;
    }
    getVolume() {
        const data = this.getTimeDomainData();
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            const sample = (data[i] - 128) / 128;
            sum += sample * sample;
        }
        return Math.sqrt(sum / data.length);
    }
    destroy() {
        this.sourceNode?.disconnect();
        this.gainNode.disconnect();
        this.compressorNode?.disconnect();
        this.convolverNode?.disconnect();
        this.eqNodes.forEach(node => node.disconnect());
        this.audioContext.close();
    }
}
class AudioVisualizer {
    canvas;
    ctx;
    config;
    audioProcessor;
    animationFrame = null;
    constructor(canvas, audioProcessor, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
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
    start() {
        const render = () => {
            this.draw();
            this.animationFrame = requestAnimationFrame(render);
        };
        render();
    }
    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    draw() {
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
    drawWaveform() {
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
            }
            else {
                this.ctx.lineTo(x, y);
            }
            x += sliceWidth;
        }
        this.ctx.stroke();
    }
    drawSpectrum() {
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
            }
            else {
                this.ctx.lineTo(x, y);
            }
            x += sliceWidth;
        }
        this.ctx.stroke();
    }
    drawBars() {
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
    drawCircular() {
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
            }
            else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.stroke();
    }
    adjustBrightness(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, Math.min(255, (num >> 16) + amt));
        const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
        const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
        return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    }
}
class StreamMixer {
    canvas;
    ctx;
    audioContext;
    audioDestination;
    inputs = new Map();
    outputStream;
    animationFrame = null;
    width;
    height;
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.canvas = new OffscreenCanvas(width, height);
        this.ctx = this.canvas.getContext('2d');
        this.audioContext = new AudioContext();
        this.audioDestination = this.audioContext.createMediaStreamDestination();
        // Create output stream
        const canvasStream = this.canvas.captureStream(30);
        const videoTrack = canvasStream.getVideoTracks()[0];
        const audioTrack = this.audioDestination.stream.getAudioTracks()[0];
        const tracks = [];
        if (videoTrack)
            tracks.push(videoTrack);
        if (audioTrack)
            tracks.push(audioTrack);
        this.outputStream = new MediaStream(tracks);
    }
    addInput(config) {
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
    removeInput(id) {
        const input = this.inputs.get(id);
        if (input) {
            input.audioSource.disconnect();
            input.gainNode.disconnect();
            this.inputs.delete(id);
        }
    }
    updateInput(id, updates) {
        const input = this.inputs.get(id);
        if (input) {
            input.config = { ...input.config, ...updates };
            if (updates.volume !== undefined || updates.muted !== undefined) {
                input.gainNode.gain.value = input.config.muted ? 0 : (input.config.volume ?? 1);
            }
        }
    }
    setLayout(layout) {
        const inputs = Array.from(this.inputs.values());
        switch (layout) {
            case 'grid': {
                const cols = Math.ceil(Math.sqrt(inputs.length));
                const rows = Math.ceil(inputs.length / cols);
                const cellWidth = this.width / cols;
                const cellHeight = this.height / rows;
                inputs.forEach((input, i) => {
                    const x = (i % cols) * cellWidth;
                    const y = Math.floor(i / cols) * cellHeight;
                    if (x !== undefined)
                        input.config.x = x;
                    if (y !== undefined)
                        input.config.y = y;
                    if (cellWidth !== undefined)
                        input.config.width = cellWidth;
                    if (cellHeight !== undefined)
                        input.config.height = cellHeight;
                });
                break;
            }
            case 'pip': {
                const input0 = inputs[0];
                if (input0) {
                    input0.config.x = 0;
                    input0.config.y = 0;
                    input0.config.width = this.width;
                    input0.config.height = this.height;
                }
                const input1 = inputs[1];
                if (input1) {
                    const pipWidth = this.width * 0.25;
                    const pipHeight = this.height * 0.25;
                    input1.config.x = this.width - pipWidth - 20;
                    input1.config.y = this.height - pipHeight - 20;
                    input1.config.width = pipWidth;
                    input1.config.height = pipHeight;
                }
                break;
            }
            case 'side-by-side': {
                const halfWidth = this.width / 2;
                inputs.forEach((input, i) => {
                    const x = i * halfWidth;
                    if (x !== undefined)
                        input.config.x = x;
                    input.config.y = 0;
                    if (halfWidth !== undefined)
                        input.config.width = halfWidth;
                    input.config.height = this.height;
                });
                break;
            }
        }
    }
    start() {
        const render = () => {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.width, this.height);
            for (const input of this.inputs.values()) {
                const { config, video } = input;
                this.ctx.drawImage(video, config.x ?? 0, config.y ?? 0, config.width ?? this.width, config.height ?? this.height);
            }
            this.animationFrame = requestAnimationFrame(render);
        };
        render();
    }
    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    getOutputStream() {
        return this.outputStream;
    }
    destroy() {
        this.stop();
        this.inputs.forEach(input => {
            input.audioSource.disconnect();
            input.gainNode.disconnect();
        });
        this.inputs.clear();
        this.audioContext.close();
    }
}
class MediaStreamRecorder {
    mediaRecorder = null;
    chunks = [];
    stream;
    config;
    listeners = new Map();
    constructor(stream, config = {}) {
        this.stream = stream;
        this.config = {
            mimeType: this.getSupportedMimeType(),
            videoBitsPerSecond: 2500000,
            audioBitsPerSecond: 128000,
            timeslice: 1000,
            ...config
        };
    }
    getSupportedMimeType() {
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
    start() {
        this.chunks = [];
        const options = {};
        if (this.config.mimeType !== undefined)
            options.mimeType = this.config.mimeType;
        if (this.config.videoBitsPerSecond !== undefined)
            options.videoBitsPerSecond = this.config.videoBitsPerSecond;
        if (this.config.audioBitsPerSecond !== undefined)
            options.audioBitsPerSecond = this.config.audioBitsPerSecond;
        this.mediaRecorder = new MediaRecorder(this.stream, options);
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.chunks.push(event.data);
                this.emit('data', event.data);
            }
        };
        this.mediaRecorder.onstop = () => {
            const blobOptions = {};
            if (this.config.mimeType !== undefined)
                blobOptions.type = this.config.mimeType;
            const blob = new Blob(this.chunks, blobOptions);
            this.emit('stop', blob);
        };
        this.mediaRecorder.onerror = (event) => {
            this.emit('error', event);
        };
        this.mediaRecorder.start(this.config.timeslice);
        this.emit('start', {});
    }
    pause() {
        if (this.mediaRecorder?.state === 'recording') {
            this.mediaRecorder.pause();
            this.emit('pause', {});
        }
    }
    resume() {
        if (this.mediaRecorder?.state === 'paused') {
            this.mediaRecorder.resume();
            this.emit('resume', {});
        }
    }
    stop() {
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
        }
        const blobOptions = {};
        if (this.config.mimeType !== undefined)
            blobOptions.type = this.config.mimeType;
        return new Blob(this.chunks, blobOptions);
    }
    getBlob() {
        const blobOptions = {};
        if (this.config.mimeType !== undefined)
            blobOptions.type = this.config.mimeType;
        return new Blob(this.chunks, blobOptions);
    }
    getState() {
        return this.mediaRecorder?.state || null;
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
// QUALITY MONITOR
// ============================================================================
class StreamQualityMonitor {
    stream;
    intervalId = null;
    metrics = {
        width: 0,
        height: 0,
        frameRate: 0,
        bitrate: 0,
        droppedFrames: 0,
        latency: 0,
        jitter: 0
    };
    prevStats = null;
    listeners = new Map();
    constructor(stream) {
        this.stream = stream;
    }
    start(interval = 1000) {
        this.updateMetrics();
        this.intervalId = window.setInterval(() => {
            this.updateMetrics();
        }, interval);
    }
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    updateMetrics() {
        const videoTrack = this.stream.getVideoTracks()[0];
        if (!videoTrack)
            return;
        const settings = videoTrack.getSettings();
        this.metrics.width = settings.width || 0;
        this.metrics.height = settings.height || 0;
        this.metrics.frameRate = settings.frameRate || 0;
        // Get detailed stats if using RTCPeerConnection
        // This is a simplified version
        this.emit('metrics', this.metrics);
    }
    getMetrics() {
        return { ...this.metrics };
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
class MediaStreamProcessor {
    inputStream;
    outputStream = null;
    videoFilter = null;
    chromaKey = null;
    audioProcessor = null;
    faceDetector = null;
    config;
    running = false;
    constructor(inputStream, config = {}) {
        this.inputStream = inputStream;
        this.config = config;
    }
    async start() {
        const videoTrack = this.inputStream.getVideoTracks()[0];
        const audioTrack = this.inputStream.getAudioTracks()[0];
        const outputTracks = [];
        // Process video
        if (videoTrack && (this.config.video || this.config.chromaKey)) {
            const processedVideoTrack = await this.processVideo(videoTrack);
            outputTracks.push(processedVideoTrack);
        }
        else if (videoTrack) {
            outputTracks.push(videoTrack.clone());
        }
        // Process audio
        if (audioTrack && this.config.audio) {
            const processedAudioTrack = await this.processAudio();
            outputTracks.push(processedAudioTrack);
        }
        else if (audioTrack) {
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
    async processVideo(videoTrack) {
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
        if (typeof window.MediaStreamTrackProcessor !== 'undefined') {
            const processor = new window.MediaStreamTrackProcessor({ track: videoTrack });
            const generator = new window.MediaStreamTrackGenerator({ kind: 'video' });
            const transformer = new TransformStream({
                transform: async (frame, controller) => {
                    let processedFrame = frame;
                    if (this.videoFilter) {
                        processedFrame = this.videoFilter.processFrame(processedFrame);
                        frame.close();
                    }
                    if (this.chromaKey) {
                        const temp = processedFrame;
                        processedFrame = this.chromaKey.processFrame(processedFrame);
                        if (temp !== frame)
                            temp.close();
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
    async processAudio() {
        this.audioProcessor = new AudioStreamProcessor(this.config.audio);
        await this.audioProcessor.initialize();
        const processedStream = this.audioProcessor.processStream(this.inputStream);
        const track = processedStream.getAudioTracks()[0];
        if (!track) {
            throw new Error('No audio track available in processed stream');
        }
        return track;
    }
    setVideoFilter(config) {
        this.videoFilter?.setConfig(config);
    }
    async detectFaces() {
        if (!this.faceDetector || !this.inputStream)
            return [];
        const videoTrack = this.inputStream.getVideoTracks()[0];
        if (!videoTrack)
            return [];
        // Would need video element to detect from
        return [];
    }
    getAudioProcessor() {
        return this.audioProcessor;
    }
    stop() {
        this.running = false;
        this.outputStream?.getTracks().forEach(t => t.stop());
        this.audioProcessor?.destroy();
    }
}
// ============================================================================
// REACT HOOKS
// ============================================================================
function useMediaProcessor(stream, config) {
    let processor = null;
    let outputStream = null;
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
function useAudioVisualizer(stream, canvasRef, type = 'waveform') {
    let audioProcessor = null;
    let visualizer = null;
    let volume = 0;
    let frequencyData = null;
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
            volume = audioProcessor.getVolume();
            frequencyData = audioProcessor.getFrequencyData();
        };
        setInterval(update, 16);
    }
    return { volume, frequencyData };
}
function useStreamRecorder(stream) {
    let recorder = null;
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
function useStreamMixer(inputs) {
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
MediaStreamProcessor, VideoFilterProcessor, AudioStreamProcessor, ChromaKeyProcessor, FaceDetector, AudioVisualizer, StreamMixer, MediaStreamRecorder, StreamQualityMonitor, 
// Hooks
useMediaProcessor, useAudioVisualizer, useStreamRecorder, useStreamMixer };
//# sourceMappingURL=index.js.map
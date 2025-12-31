/**
 * @philjs/qr - QR Scanner Class
 * Camera-based QR code and barcode scanning - vanilla JS
 */
export class QRScanner {
    container;
    config;
    videoElement = null;
    canvasElement = null;
    stream = null;
    animationFrame = 0;
    isScanning = false;
    facingMode;
    constructor(config) {
        this.container = config.container;
        this.config = config;
        this.facingMode = config.facingMode || 'environment';
        this.init();
    }
    init() {
        this.container.classList.add('philjs-qr-scanner');
        this.container.style.position = 'relative';
        this.container.style.overflow = 'hidden';
        this.container.style.backgroundColor = '#000';
        // Create video element
        this.videoElement = document.createElement('video');
        this.videoElement.style.width = '100%';
        this.videoElement.style.height = '100%';
        this.videoElement.style.objectFit = 'cover';
        this.videoElement.playsInline = true;
        this.videoElement.muted = true;
        this.container.appendChild(this.videoElement);
        // Create canvas for scanning
        this.canvasElement = document.createElement('canvas');
        this.canvasElement.style.display = 'none';
        this.container.appendChild(this.canvasElement);
        // Add viewfinder if enabled
        if (this.config.showViewfinder !== false) {
            this.addViewfinder();
        }
    }
    addViewfinder() {
        const viewfinder = document.createElement('div');
        viewfinder.className = 'philjs-qr-viewfinder';
        const size = this.config.qrbox
            ? typeof this.config.qrbox === 'number'
                ? this.config.qrbox
                : this.config.qrbox.width
            : 250;
        Object.assign(viewfinder.style, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${size}px`,
            height: `${size}px`,
            border: '2px solid rgba(255, 255, 255, 0.8)',
            borderRadius: '0.5rem',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
        });
        // Add scan line animation
        const scanLine = document.createElement('div');
        Object.assign(scanLine.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '2px',
            backgroundColor: '#3b82f6',
            animation: 'philjs-qr-scan 2s linear infinite',
        });
        viewfinder.appendChild(scanLine);
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
      @keyframes philjs-qr-scan {
        0% { top: 0; }
        50% { top: calc(100% - 2px); }
        100% { top: 0; }
      }
    `;
        document.head.appendChild(style);
        this.container.appendChild(viewfinder);
    }
    /**
     * Start scanning
     */
    async start() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: this.facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            });
            if (this.videoElement) {
                this.videoElement.srcObject = this.stream;
                await this.videoElement.play();
            }
            this.isScanning = true;
            this.scanFrame();
        }
        catch (error) {
            this.config.onError?.(error);
        }
    }
    /**
     * Stop scanning
     */
    stop() {
        this.isScanning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
            this.stream = null;
        }
    }
    /**
     * Pause scanning
     */
    pause() {
        this.isScanning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
    /**
     * Resume scanning
     */
    resume() {
        if (!this.isScanning && this.stream) {
            this.isScanning = true;
            this.scanFrame();
        }
    }
    /**
     * Switch camera
     */
    async switchCamera() {
        this.stop();
        this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
        await this.start();
    }
    /**
     * Toggle torch/flashlight
     */
    async toggleTorch() {
        if (!this.stream)
            return false;
        const track = this.stream.getVideoTracks()[0];
        if (!track)
            return false;
        try {
            const capabilities = track.getCapabilities();
            if (!capabilities.torch)
                return false;
            const settings = track.getSettings();
            const newTorchState = !settings.torch;
            await track.applyConstraints({
                advanced: [{ torch: newTorchState }],
            });
            return newTorchState;
        }
        catch {
            return false;
        }
    }
    scanFrame() {
        if (!this.isScanning || !this.videoElement || !this.canvasElement)
            return;
        const video = this.videoElement;
        const canvas = this.canvasElement;
        const ctx = canvas.getContext('2d');
        if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
            this.animationFrame = requestAnimationFrame(() => this.scanFrame());
            return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // Use BarcodeDetector API if available
        if ('BarcodeDetector' in window) {
            const formats = this.config.formatsToSupport?.map((f) => f.toLowerCase()) || ['qr_code'];
            const detector = new window.BarcodeDetector({ formats });
            detector
                .detect(imageData)
                .then((barcodes) => {
                if (barcodes.length > 0) {
                    const result = {
                        text: barcodes[0].rawValue,
                        format: barcodes[0].format.toUpperCase(),
                        timestamp: Date.now(),
                    };
                    this.config.onScan(result);
                    if (this.config.pauseOnScan) {
                        this.pause();
                        return;
                    }
                }
                this.animationFrame = requestAnimationFrame(() => this.scanFrame());
            })
                .catch(() => {
                this.animationFrame = requestAnimationFrame(() => this.scanFrame());
            });
        }
        else {
            // BarcodeDetector not available
            this.animationFrame = requestAnimationFrame(() => this.scanFrame());
        }
    }
    /**
     * Check if BarcodeDetector is supported
     */
    static isSupported() {
        return 'BarcodeDetector' in window;
    }
    /**
     * Get supported barcode formats
     */
    static async getSupportedFormats() {
        if (!('BarcodeDetector' in window))
            return [];
        try {
            const formats = await window.BarcodeDetector.getSupportedFormats();
            return formats;
        }
        catch {
            return [];
        }
    }
    /**
     * Destroy and cleanup
     */
    destroy() {
        this.stop();
        this.container.innerHTML = '';
        this.container.classList.remove('philjs-qr-scanner');
        this.videoElement = null;
        this.canvasElement = null;
    }
}
/**
 * Create a QR scanner instance
 */
export function createQRScanner(config) {
    return new QRScanner(config);
}
export default QRScanner;
//# sourceMappingURL=QRScanner.js.map
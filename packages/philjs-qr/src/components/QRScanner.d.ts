/**
 * @philjs/qr - QR Scanner Class
 * Camera-based QR code and barcode scanning - vanilla JS
 */
import type { ScannerConfig, ScanResult } from '../types.js';
export interface QRScannerConfig extends ScannerConfig {
    container: HTMLElement;
    onScan: (result: ScanResult) => void;
    onError?: (error: Error) => void;
    showViewfinder?: boolean;
    pauseOnScan?: boolean;
}
export declare class QRScanner {
    private container;
    private config;
    private videoElement;
    private canvasElement;
    private stream;
    private animationFrame;
    private isScanning;
    private facingMode;
    constructor(config: QRScannerConfig);
    private init;
    private addViewfinder;
    /**
     * Start scanning
     */
    start(): Promise<void>;
    /**
     * Stop scanning
     */
    stop(): void;
    /**
     * Pause scanning
     */
    pause(): void;
    /**
     * Resume scanning
     */
    resume(): void;
    /**
     * Switch camera
     */
    switchCamera(): Promise<void>;
    /**
     * Toggle torch/flashlight
     */
    toggleTorch(): Promise<boolean>;
    private scanFrame;
    /**
     * Check if BarcodeDetector is supported
     */
    static isSupported(): boolean;
    /**
     * Get supported barcode formats
     */
    static getSupportedFormats(): Promise<string[]>;
    /**
     * Destroy and cleanup
     */
    destroy(): void;
}
/**
 * Create a QR scanner instance
 */
export declare function createQRScanner(config: QRScannerConfig): QRScanner;
export default QRScanner;
//# sourceMappingURL=QRScanner.d.ts.map
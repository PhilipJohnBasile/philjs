/**
 * @philjs/qr - Type definitions
 * QR code generation and scanning types
 */
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';
export interface QRStyle {
    width?: number;
    height?: number;
    margin?: number;
    backgroundColor?: string;
    foregroundColor?: string;
    cornerRadius?: number;
    dotStyle?: 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded';
    cornerStyle?: 'square' | 'rounded' | 'extra-rounded';
    cornerDotStyle?: 'square' | 'dot';
}
export interface QRLogo {
    src: string;
    width?: number;
    height?: number;
    margin?: number;
    borderRadius?: number;
    removeBackground?: boolean;
}
export interface QRGradient {
    type: 'linear' | 'radial';
    rotation?: number;
    colorStops: Array<{
        offset: number;
        color: string;
    }>;
}
export interface QRCodeOptions {
    data: string;
    style?: QRStyle;
    logo?: QRLogo;
    errorCorrectionLevel?: ErrorCorrectionLevel;
    gradient?: QRGradient;
    image?: string;
}
export type QROutputFormat = 'svg' | 'png' | 'jpeg' | 'webp' | 'canvas' | 'dataURL';
export interface QRExportOptions {
    format: QROutputFormat;
    quality?: number;
    scale?: number;
}
export interface ScannerConfig {
    facingMode?: 'user' | 'environment';
    fps?: number;
    qrbox?: {
        width: number;
        height: number;
    } | number;
    aspectRatio?: number;
    disableFlip?: boolean;
    formatsToSupport?: BarcodeFormat[];
}
export type BarcodeFormat = 'QR_CODE' | 'AZTEC' | 'CODABAR' | 'CODE_39' | 'CODE_93' | 'CODE_128' | 'DATA_MATRIX' | 'EAN_8' | 'EAN_13' | 'ITF' | 'PDF_417' | 'RSS_14' | 'RSS_EXPANDED' | 'UPC_A' | 'UPC_E' | 'UPC_EAN_EXTENSION';
export interface ScanResult {
    text: string;
    format: BarcodeFormat;
    rawBytes?: Uint8Array;
    timestamp: number;
}
export interface ScannerCallbacks {
    onScan: (result: ScanResult) => void;
    onError?: (error: Error) => void;
    onStart?: () => void;
    onStop?: () => void;
}
export interface CameraPermission {
    status: 'granted' | 'denied' | 'prompt';
    request: () => Promise<boolean>;
}
export interface QRCodeProps extends Omit<QRCodeOptions, 'style'> {
    className?: string;
    qrStyle?: QRStyle;
    style?: React.CSSProperties;
    onLoad?: () => void;
    onError?: (error: Error) => void;
}
export interface QRScannerProps {
    config?: ScannerConfig;
    onScan: (result: ScanResult) => void;
    onError?: (error: Error) => void;
    className?: string;
    style?: React.CSSProperties;
    showViewfinder?: boolean;
    showTorchButton?: boolean;
    showSwitchCameraButton?: boolean;
    pauseOnScan?: boolean;
    children?: React.ReactNode;
}
export interface BatchQROptions {
    items: Array<{
        id: string;
        data: string;
        options?: Partial<QRCodeOptions>;
    }>;
    defaultOptions?: QRCodeOptions;
    format?: QROutputFormat;
}
export interface BatchQRResult {
    id: string;
    data: string;
    output: string | Blob | HTMLCanvasElement;
}
export interface QRAnalytics {
    scans: number;
    uniqueScans: number;
    scansByDate: Record<string, number>;
    scansByLocation?: Record<string, number>;
    scansByDevice?: Record<string, number>;
}
export interface DynamicQRConfig {
    baseUrl: string;
    trackingId: string;
    redirectUrl: string;
    analytics?: boolean;
}
//# sourceMappingURL=types.d.ts.map
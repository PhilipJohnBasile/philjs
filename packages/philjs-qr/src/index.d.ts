/**
 * @philjs/qr
 * QR code generation and scanning for PhilJS
 *
 * Features:
 * - Customizable QR code generation
 * - Multiple dot styles (square, rounded, dots)
 * - Logo/image embedding
 * - Gradient colors
 * - Camera-based QR scanning
 * - Barcode format support
 * - Batch generation
 * - Download as SVG/PNG
 */
export type { ErrorCorrectionLevel, QRStyle, QRLogo, QRGradient, QRCodeOptions, QROutputFormat, QRExportOptions, ScannerConfig, BarcodeFormat, ScanResult, ScannerCallbacks, BatchQROptions, BatchQRResult, QRAnalytics, DynamicQRConfig, } from './types.js';
export { QRCode, createQRCode, type QRCodeConfig } from './components/QRCode.js';
export { QRScanner, createQRScanner, type QRScannerConfig } from './components/QRScanner.js';
import { generateQRCode, generateQRCodeDataURL, generateQRCodeCanvas } from './generator.js';
export { generateQRCode, generateQRCodeDataURL, generateQRCodeCanvas };
/**
 * Validate QR code data
 */
export declare function validateQRData(data: string): {
    valid: boolean;
    type: 'url' | 'text' | 'email' | 'phone' | 'wifi' | 'vcard' | 'unknown';
    length: number;
    maxCapacity: number;
};
/**
 * Create WiFi QR code data
 */
export declare function createWiFiQR(options: {
    ssid: string;
    password?: string;
    encryption?: 'WPA' | 'WEP' | 'nopass';
    hidden?: boolean;
}): string;
/**
 * Create vCard QR code data
 */
export declare function createVCardQR(options: {
    firstName: string;
    lastName?: string;
    organization?: string;
    title?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    };
}): string;
/**
 * Create email QR code data
 */
export declare function createEmailQR(options: {
    to: string;
    subject?: string;
    body?: string;
}): string;
/**
 * Create SMS QR code data
 */
export declare function createSMSQR(options: {
    phone: string;
    message?: string;
}): string;
/**
 * Create geo location QR code data
 */
export declare function createGeoQR(latitude: number, longitude: number): string;
/**
 * Create calendar event QR code data
 */
export declare function createEventQR(options: {
    title: string;
    startDate: Date;
    endDate?: Date;
    location?: string;
    description?: string;
}): string;
/**
 * Batch generate QR codes
 */
export declare function batchGenerateQR(items: Array<{
    id: string;
    data: string;
    options?: Partial<import('./types.js').QRCodeOptions>;
}>, defaultOptions?: Partial<import('./types.js').QRCodeOptions>): Promise<Map<string, string>>;
//# sourceMappingURL=index.d.ts.map
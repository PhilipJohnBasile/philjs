/**
 * @philjs/qr - QR Code Generator
 * Pure TypeScript QR code generation
 */
import type { QRCodeOptions } from './types.js';
/**
 * Generate QR code as SVG string
 */
export declare function generateQRCode(options: QRCodeOptions): string;
/**
 * Generate QR code as data URL
 */
export declare function generateQRCodeDataURL(options: QRCodeOptions): string;
/**
 * Generate QR code as canvas
 */
export declare function generateQRCodeCanvas(options: QRCodeOptions): Promise<HTMLCanvasElement>;
//# sourceMappingURL=generator.d.ts.map
/**
 * @philjs/qr - QR Code Class
 * Customizable QR code generation - vanilla JS
 */
import type { QRCodeOptions, QRStyle } from '../types.js';
export interface QRCodeConfig extends QRCodeOptions {
    container?: HTMLElement;
}
export declare class QRCode {
    private container;
    private options;
    private svgContent;
    constructor(config: QRCodeConfig);
    /**
     * Render QR code to container
     */
    render(): void;
    /**
     * Update QR code data
     */
    setData(data: string): void;
    /**
     * Update QR code style
     */
    setStyle(style: Partial<QRStyle>): void;
    /**
     * Get SVG string
     */
    getSVG(): string;
    /**
     * Get data URL
     */
    getDataURL(): string;
    /**
     * Get canvas element
     */
    getCanvas(): Promise<HTMLCanvasElement>;
    /**
     * Download QR code
     */
    download(filename?: string, format?: 'svg' | 'png' | 'jpeg'): Promise<void>;
    private downloadBlob;
    /**
     * Destroy and cleanup
     */
    destroy(): void;
}
/**
 * Create a QR code instance
 */
export declare function createQRCode(config: QRCodeConfig): QRCode;
export default QRCode;
//# sourceMappingURL=QRCode.d.ts.map
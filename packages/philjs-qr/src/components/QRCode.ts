/**
 * @philjs/qr - QR Code Class
 * Customizable QR code generation - vanilla JS
 */

import type { QRCodeOptions, QRStyle } from '../types.js';
import { generateQRCode, generateQRCodeDataURL, generateQRCodeCanvas } from '../generator.js';

export interface QRCodeConfig extends QRCodeOptions {
  container?: HTMLElement;
}

export class QRCode {
  private container: HTMLElement | null;
  private options: QRCodeOptions;
  private svgContent: string = '';

  constructor(config: QRCodeConfig) {
    this.container = config.container || null;
    this.options = {
      data: config['data'],
      ...(config['style'] !== undefined && { style: config['style'] }),
      ...(config['logo'] !== undefined && { logo: config['logo'] }),
      ...(config['errorCorrectionLevel'] !== undefined && { errorCorrectionLevel: config['errorCorrectionLevel'] }),
      ...(config['gradient'] !== undefined && { gradient: config['gradient'] }),
    };

    if (this.container) {
      this.render();
    }
  }

  /**
   * Render QR code to container
   */
  render(): void {
    if (!this.container) return;

    try {
      this.svgContent = generateQRCode(this.options);
      this.container.innerHTML = this.svgContent;
      this.container.classList.add('philjs-qr');
    } catch (error) {
      console.error('Failed to render QR code:', error);
    }
  }

  /**
   * Update QR code data
   */
  setData(data: string): void {
    this.options.data = data;
    this.render();
  }

  /**
   * Update QR code style
   */
  setStyle(style: Partial<QRStyle>): void {
    this.options.style = { ...this.options.style, ...style };
    this.render();
  }

  /**
   * Get SVG string
   */
  getSVG(): string {
    if (!this.svgContent) {
      this.svgContent = generateQRCode(this.options);
    }
    return this.svgContent;
  }

  /**
   * Get data URL
   */
  getDataURL(): string {
    return generateQRCodeDataURL(this.options);
  }

  /**
   * Get canvas element
   */
  async getCanvas(): Promise<HTMLCanvasElement> {
    return generateQRCodeCanvas(this.options);
  }

  /**
   * Download QR code
   */
  async download(filename = 'qrcode', format: 'svg' | 'png' | 'jpeg' = 'png'): Promise<void> {
    if (format === 'svg') {
      const svg = this.getSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      this.downloadBlob(blob, `${filename}.svg`);
      return;
    }

    const canvas = await this.getCanvas();
    canvas.toBlob(
      (blob) => {
        if (blob) {
          this.downloadBlob(blob, `${filename}.${format}`);
        }
      },
      `image/${format}`,
      0.95
    );
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    if (this.container) {
      this.container.innerHTML = '';
      this.container.classList.remove('philjs-qr');
    }
    this.svgContent = '';
  }
}

/**
 * Create a QR code instance
 */
export function createQRCode(config: QRCodeConfig): QRCode {
  return new QRCode(config);
}

export default QRCode;

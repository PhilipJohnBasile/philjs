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

// Types
export type {
  ErrorCorrectionLevel,
  QRStyle,
  QRLogo,
  QRGradient,
  QRCodeOptions,
  QROutputFormat,
  QRExportOptions,
  ScannerConfig,
  BarcodeFormat,
  ScanResult,
  ScannerCallbacks,
  BatchQROptions,
  BatchQRResult,
  QRAnalytics,
  DynamicQRConfig,
} from './types';

// Components
export { QRCode, createQRCode, type QRCodeConfig } from './components/QRCode';
export { QRScanner, createQRScanner, type QRScannerConfig } from './components/QRScanner';

// Generator functions
export {
  generateQRCode,
  generateQRCodeDataURL,
  generateQRCodeCanvas,
} from './generator';

// Utility functions

/**
 * Validate QR code data
 */
export function validateQRData(data: string): {
  valid: boolean;
  type: 'url' | 'text' | 'email' | 'phone' | 'wifi' | 'vcard' | 'unknown';
  length: number;
  maxCapacity: number;
} {
  const length = data.length;
  const maxCapacity = 2953; // Max for version 40, L error correction

  let type: 'url' | 'text' | 'email' | 'phone' | 'wifi' | 'vcard' | 'unknown' = 'text';

  if (/^https?:\/\//i.test(data)) {
    type = 'url';
  } else if (/^mailto:/i.test(data) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
    type = 'email';
  } else if (/^tel:/i.test(data) || /^\+?[\d\s-()]+$/.test(data)) {
    type = 'phone';
  } else if (/^WIFI:/i.test(data)) {
    type = 'wifi';
  } else if (/^BEGIN:VCARD/i.test(data)) {
    type = 'vcard';
  }

  return {
    valid: length > 0 && length <= maxCapacity,
    type,
    length,
    maxCapacity,
  };
}

/**
 * Create WiFi QR code data
 */
export function createWiFiQR(options: {
  ssid: string;
  password?: string;
  encryption?: 'WPA' | 'WEP' | 'nopass';
  hidden?: boolean;
}): string {
  const { ssid, password = '', encryption = 'WPA', hidden = false } = options;
  return `WIFI:T:${encryption};S:${ssid};P:${password};H:${hidden};;`;
}

/**
 * Create vCard QR code data
 */
export function createVCardQR(options: {
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
}): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${options.lastName || ''};${options.firstName};;;`,
    `FN:${options.firstName}${options.lastName ? ' ' + options.lastName : ''}`,
  ];

  if (options.organization) lines.push(`ORG:${options.organization}`);
  if (options.title) lines.push(`TITLE:${options.title}`);
  if (options.email) lines.push(`EMAIL:${options.email}`);
  if (options.phone) lines.push(`TEL:${options.phone}`);
  if (options.website) lines.push(`URL:${options.website}`);

  if (options.address) {
    const { street, city, state, zip, country } = options.address;
    lines.push(`ADR:;;${street || ''};${city || ''};${state || ''};${zip || ''};${country || ''}`);
  }

  lines.push('END:VCARD');
  return lines.join('\n');
}

/**
 * Create email QR code data
 */
export function createEmailQR(options: {
  to: string;
  subject?: string;
  body?: string;
}): string {
  const params = new URLSearchParams();
  if (options.subject) params.set('subject', options.subject);
  if (options.body) params.set('body', options.body);

  const queryString = params.toString();
  return `mailto:${options.to}${queryString ? '?' + queryString : ''}`;
}

/**
 * Create SMS QR code data
 */
export function createSMSQR(options: {
  phone: string;
  message?: string;
}): string {
  return `sms:${options.phone}${options.message ? '?body=' + encodeURIComponent(options.message) : ''}`;
}

/**
 * Create geo location QR code data
 */
export function createGeoQR(latitude: number, longitude: number): string {
  return `geo:${latitude},${longitude}`;
}

/**
 * Create calendar event QR code data
 */
export function createEventQR(options: {
  title: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  description?: string;
}): string {
  const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const lines = [
    'BEGIN:VEVENT',
    `SUMMARY:${options.title}`,
    `DTSTART:${formatDate(options.startDate)}`,
  ];

  if (options.endDate) lines.push(`DTEND:${formatDate(options.endDate)}`);
  if (options.location) lines.push(`LOCATION:${options.location}`);
  if (options.description) lines.push(`DESCRIPTION:${options.description}`);

  lines.push('END:VEVENT');
  return lines.join('\n');
}

/**
 * Batch generate QR codes
 */
export async function batchGenerateQR(
  items: Array<{ id: string; data: string; options?: Partial<import('./types').QRCodeOptions> }>,
  defaultOptions?: Partial<import('./types').QRCodeOptions>
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  for (const item of items) {
    try {
      const options: import('./types').QRCodeOptions = {
        data: item.data,
        ...defaultOptions,
        ...item.options,
      };
      const svg = generateQRCode(options);
      results.set(item.id, svg);
    } catch {
      results.set(item.id, '');
    }
  }

  return results;
}

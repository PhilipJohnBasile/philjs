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
// Components
export { QRCode, createQRCode } from './components/QRCode.js';
export { QRScanner, createQRScanner } from './components/QRScanner.js';
// Generator functions
import { generateQRCode, generateQRCodeDataURL, generateQRCodeCanvas } from './generator.js';
export { generateQRCode, generateQRCodeDataURL, generateQRCodeCanvas };
// Utility functions
/**
 * Validate QR code data
 */
export function validateQRData(data) {
    const length = data.length;
    const maxCapacity = 2953; // Max for version 40, L error correction
    let type = 'text';
    if (/^https?:\/\//i.test(data)) {
        type = 'url';
    }
    else if (/^mailto:/i.test(data) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
        type = 'email';
    }
    else if (/^tel:/i.test(data) || /^\+?[\d\s-()]+$/.test(data)) {
        type = 'phone';
    }
    else if (/^WIFI:/i.test(data)) {
        type = 'wifi';
    }
    else if (/^BEGIN:VCARD/i.test(data)) {
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
export function createWiFiQR(options) {
    const { ssid, password = '', encryption = 'WPA', hidden = false } = options;
    return `WIFI:T:${encryption};S:${ssid};P:${password};H:${hidden};;`;
}
/**
 * Create vCard QR code data
 */
export function createVCardQR(options) {
    const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${options.lastName || ''};${options.firstName};;;`,
        `FN:${options.firstName}${options.lastName ? ' ' + options.lastName : ''}`,
    ];
    if (options.organization)
        lines.push(`ORG:${options.organization}`);
    if (options.title)
        lines.push(`TITLE:${options.title}`);
    if (options.email)
        lines.push(`EMAIL:${options.email}`);
    if (options.phone)
        lines.push(`TEL:${options.phone}`);
    if (options.website)
        lines.push(`URL:${options.website}`);
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
export function createEmailQR(options) {
    const params = new URLSearchParams();
    if (options.subject)
        params.set('subject', options.subject);
    if (options.body)
        params.set('body', options.body);
    const queryString = params.toString();
    return `mailto:${options.to}${queryString ? '?' + queryString : ''}`;
}
/**
 * Create SMS QR code data
 */
export function createSMSQR(options) {
    return `sms:${options.phone}${options.message ? '?body=' + encodeURIComponent(options.message) : ''}`;
}
/**
 * Create geo location QR code data
 */
export function createGeoQR(latitude, longitude) {
    return `geo:${latitude},${longitude}`;
}
/**
 * Create calendar event QR code data
 */
export function createEventQR(options) {
    const formatDate = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const lines = [
        'BEGIN:VEVENT',
        `SUMMARY:${options.title}`,
        `DTSTART:${formatDate(options.startDate)}`,
    ];
    if (options.endDate)
        lines.push(`DTEND:${formatDate(options.endDate)}`);
    if (options.location)
        lines.push(`LOCATION:${options.location}`);
    if (options.description)
        lines.push(`DESCRIPTION:${options.description}`);
    lines.push('END:VEVENT');
    return lines.join('\n');
}
/**
 * Batch generate QR codes
 */
export async function batchGenerateQR(items, defaultOptions) {
    const results = new Map();
    for (const item of items) {
        try {
            const options = {
                data: item.data,
                ...defaultOptions,
                ...item.options,
            };
            const svg = generateQRCode(options);
            results.set(item.id, svg);
        }
        catch {
            results.set(item.id, '');
        }
    }
    return results;
}
//# sourceMappingURL=index.js.map
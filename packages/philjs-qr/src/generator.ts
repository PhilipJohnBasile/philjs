/**
 * @philjs/qr - QR Code Generator
 * Pure TypeScript QR code generation
 */

import type { QRCodeOptions, QRStyle, QRLogo, QRGradient, ErrorCorrectionLevel } from './types';

// QR code generation constants
const EC_LEVELS: Record<ErrorCorrectionLevel, number> = {
  L: 1,
  M: 0,
  Q: 3,
  H: 2,
};

/**
 * Generate QR code as SVG string
 */
export function generateQRCode(options: QRCodeOptions): string {
  const {
    data,
    style = {},
    logo,
    errorCorrectionLevel = 'M',
    gradient,
  } = options;

  const {
    width = 200,
    height = 200,
    margin = 4,
    backgroundColor = '#ffffff',
    foregroundColor = '#000000',
    cornerRadius = 0,
    dotStyle = 'square',
    cornerStyle = 'square',
  } = style;

  // Generate QR code matrix
  const matrix = generateMatrix(data, EC_LEVELS[errorCorrectionLevel]);
  const moduleCount = matrix.length;
  const moduleSize = (width - margin * 2) / moduleCount;

  // Build SVG
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;

  // Background
  svg += `<rect width="${width}" height="${height}" fill="${backgroundColor}" />`;

  // Add gradient definition if provided
  if (gradient) {
    svg += generateGradientDef(gradient, 'qr-gradient');
  }

  const fillColor = gradient ? 'url(#qr-gradient)' : foregroundColor;

  // Draw modules
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (matrix[row][col]) {
        const x = margin + col * moduleSize;
        const y = margin + row * moduleSize;

        // Check if this is a finder pattern (corner)
        const isFinderPattern = isInFinderPattern(row, col, moduleCount);

        if (isFinderPattern) {
          // Draw finder pattern with special styling
          svg += drawFinderModule(x, y, moduleSize, fillColor, cornerStyle, cornerRadius);
        } else {
          // Draw regular module
          svg += drawModule(x, y, moduleSize, fillColor, dotStyle, cornerRadius);
        }
      }
    }
  }

  // Draw logo if provided
  if (logo) {
    svg += drawLogo(logo, width, height);
  }

  svg += '</svg>';

  return svg;
}

/**
 * Generate QR code data matrix
 */
function generateMatrix(data: string, ecLevel: number): boolean[][] {
  // Simplified QR code generation
  // In production, use a proper QR code library

  // Calculate version based on data length
  const version = calculateVersion(data.length, ecLevel);
  const size = version * 4 + 17;

  // Initialize matrix
  const matrix: boolean[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(false));

  // Add finder patterns
  addFinderPattern(matrix, 0, 0);
  addFinderPattern(matrix, size - 7, 0);
  addFinderPattern(matrix, 0, size - 7);

  // Add timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Add alignment patterns for version >= 2
  if (version >= 2) {
    const alignmentPositions = getAlignmentPositions(version);
    for (const row of alignmentPositions) {
      for (const col of alignmentPositions) {
        if (!isOverlappingFinderPattern(row, col, size)) {
          addAlignmentPattern(matrix, row, col);
        }
      }
    }
  }

  // Encode data (simplified - just fills remaining space with pattern)
  const encoded = encodeData(data);
  let bitIndex = 0;

  for (let col = size - 1; col >= 0; col -= 2) {
    if (col === 6) col--;
    for (let row = 0; row < size; row++) {
      for (let c = 0; c < 2; c++) {
        const currentCol = col - c;
        if (!isReserved(matrix, row, currentCol, size)) {
          if (bitIndex < encoded.length) {
            matrix[row][currentCol] = encoded[bitIndex] === '1';
            bitIndex++;
          }
        }
      }
    }
  }

  // Apply mask pattern
  applyMask(matrix);

  return matrix;
}

function calculateVersion(dataLength: number, ecLevel: number): number {
  // Simplified version calculation
  if (dataLength <= 25) return 1;
  if (dataLength <= 47) return 2;
  if (dataLength <= 77) return 3;
  if (dataLength <= 114) return 4;
  if (dataLength <= 154) return 5;
  if (dataLength <= 195) return 6;
  if (dataLength <= 224) return 7;
  return Math.min(40, Math.ceil(dataLength / 30));
}

function addFinderPattern(matrix: boolean[][], row: number, col: number): void {
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
      const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      matrix[row + r][col + c] = isOuter || isInner;
    }
  }
}

function addAlignmentPattern(matrix: boolean[][], row: number, col: number): void {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const isOuter = r === -2 || r === 2 || c === -2 || c === 2;
      const isCenter = r === 0 && c === 0;
      matrix[row + r][col + c] = isOuter || isCenter;
    }
  }
}

function getAlignmentPositions(version: number): number[] {
  if (version === 1) return [];
  const positions = [6];
  const step = Math.floor((version * 4 + 10) / (Math.floor(version / 7) + 1));
  let pos = version * 4 + 10;
  while (pos > 6 + step) {
    positions.unshift(pos);
    pos -= step;
  }
  positions.unshift(6);
  return [...new Set(positions)];
}

function isOverlappingFinderPattern(row: number, col: number, size: number): boolean {
  return (row < 9 && col < 9) ||
         (row < 9 && col >= size - 8) ||
         (row >= size - 8 && col < 9);
}

function isReserved(matrix: boolean[][], row: number, col: number, size: number): boolean {
  // Finder patterns + separators
  if (row < 9 && col < 9) return true;
  if (row < 9 && col >= size - 8) return true;
  if (row >= size - 8 && col < 9) return true;
  // Timing patterns
  if (row === 6 || col === 6) return true;
  return false;
}

function encodeData(data: string): string {
  // Simplified encoding - just convert to binary
  let binary = '';
  for (const char of data) {
    binary += char.charCodeAt(0).toString(2).padStart(8, '0');
  }
  return binary;
}

function applyMask(matrix: boolean[][]): void {
  const size = matrix.length;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!isReserved(matrix, row, col, size)) {
        // Mask pattern 0: (row + col) % 2 === 0
        if ((row + col) % 2 === 0) {
          matrix[row][col] = !matrix[row][col];
        }
      }
    }
  }
}

function isInFinderPattern(row: number, col: number, size: number): boolean {
  return (row < 7 && col < 7) ||
         (row < 7 && col >= size - 7) ||
         (row >= size - 7 && col < 7);
}

function generateGradientDef(gradient: QRGradient, id: string): string {
  if (gradient.type === 'linear') {
    const rotation = gradient.rotation || 0;
    const x1 = Math.cos((rotation - 90) * Math.PI / 180) * 50 + 50;
    const y1 = Math.sin((rotation - 90) * Math.PI / 180) * 50 + 50;
    const x2 = Math.cos((rotation + 90) * Math.PI / 180) * 50 + 50;
    const y2 = Math.sin((rotation + 90) * Math.PI / 180) * 50 + 50;

    let def = `<defs><linearGradient id="${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">`;
    for (const stop of gradient.colorStops) {
      def += `<stop offset="${stop.offset * 100}%" stop-color="${stop.color}" />`;
    }
    def += '</linearGradient></defs>';
    return def;
  } else {
    let def = `<defs><radialGradient id="${id}">`;
    for (const stop of gradient.colorStops) {
      def += `<stop offset="${stop.offset * 100}%" stop-color="${stop.color}" />`;
    }
    def += '</radialGradient></defs>';
    return def;
  }
}

function drawModule(
  x: number,
  y: number,
  size: number,
  fill: string,
  style: QRStyle['dotStyle'],
  radius: number
): string {
  const padding = size * 0.1;
  const innerSize = size - padding * 2;

  switch (style) {
    case 'dots':
      const r = innerSize / 2;
      return `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${r}" fill="${fill}" />`;
    case 'rounded':
      return `<rect x="${x + padding}" y="${y + padding}" width="${innerSize}" height="${innerSize}" rx="${innerSize / 4}" fill="${fill}" />`;
    case 'classy':
      return `<path d="M${x + padding} ${y + padding}h${innerSize}v${innerSize}h${-innerSize}z" fill="${fill}" />`;
    case 'classy-rounded':
      return `<rect x="${x + padding}" y="${y + padding}" width="${innerSize}" height="${innerSize}" rx="${innerSize / 3}" fill="${fill}" />`;
    default:
      return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" fill="${fill}" />`;
  }
}

function drawFinderModule(
  x: number,
  y: number,
  size: number,
  fill: string,
  style: QRStyle['cornerStyle'],
  radius: number
): string {
  const r = style === 'rounded' ? size / 4 : style === 'extra-rounded' ? size / 2 : radius;
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}" fill="${fill}" />`;
}

function drawLogo(logo: QRLogo, width: number, height: number): string {
  const logoWidth = logo.width || width * 0.25;
  const logoHeight = logo.height || height * 0.25;
  const x = (width - logoWidth) / 2;
  const y = (height - logoHeight) / 2;
  const margin = logo.margin || 4;
  const borderRadius = logo.borderRadius || 0;

  let svg = '';

  // White background for logo
  svg += `<rect x="${x - margin}" y="${y - margin}" width="${logoWidth + margin * 2}" height="${logoHeight + margin * 2}" fill="white" rx="${borderRadius}" />`;

  // Logo image
  svg += `<image href="${logo.src}" x="${x}" y="${y}" width="${logoWidth}" height="${logoHeight}" />`;

  return svg;
}

/**
 * Generate QR code as data URL
 */
export function generateQRCodeDataURL(options: QRCodeOptions): string {
  const svg = generateQRCode(options);
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml,${encoded}`;
}

/**
 * Generate QR code as canvas
 */
export async function generateQRCodeCanvas(
  options: QRCodeOptions
): Promise<HTMLCanvasElement> {
  const svg = generateQRCode(options);
  const { width = 200, height = 200 } = options.style || {};

  const canvas = document.createElement('canvas');
  canvas.width = width * 2;
  canvas.height = height * 2;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  const img = new Image();
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load QR code image'));
    };
    img.src = url;
  });
}

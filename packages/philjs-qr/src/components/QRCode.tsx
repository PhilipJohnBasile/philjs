/**
 * @philjs/qr - QR Code Component
 * Customizable QR code generation with React
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { QRCodeProps, QRStyle, QRLogo, QRGradient } from '../types';
import { generateQRCode } from '../generator';

export function QRCode({
  data,
  style = {},
  logo,
  errorCorrectionLevel = 'M',
  gradient,
  className,
  style: cssStyle,
  onLoad,
  onError,
}: QRCodeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Memoize options to prevent unnecessary regeneration
  const options = useMemo(() => ({
    data,
    style,
    logo,
    errorCorrectionLevel,
    gradient,
  }), [data, style, logo, errorCorrectionLevel, gradient]);

  // Generate QR code
  useEffect(() => {
    if (!data) return;

    setIsLoading(true);

    try {
      const svg = generateQRCode(options);
      setSvgContent(svg);
      setIsLoading(false);
      onLoad?.();
    } catch (error) {
      setIsLoading(false);
      onError?.(error as Error);
    }
  }, [options, onLoad, onError]);

  // Handle logo loading if provided
  useEffect(() => {
    if (!logo?.src || !containerRef.current) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = logo.src;

    img.onload = () => {
      // Re-render with loaded logo
      try {
        const svg = generateQRCode({ ...options, logo: { ...logo, loaded: true } as QRLogo });
        setSvgContent(svg);
      } catch (error) {
        onError?.(error as Error);
      }
    };

    img.onerror = () => {
      onError?.(new Error('Failed to load logo image'));
    };
  }, [logo?.src, options, onError]);

  const containerStyle: React.CSSProperties = {
    display: 'inline-block',
    width: style.width || 200,
    height: style.height || 200,
    ...cssStyle,
  };

  if (isLoading) {
    return (
      <div
        ref={containerRef}
        className={`philjs-qr-loading ${className || ''}`}
        style={{
          ...containerStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f3f4f6',
        }}
      >
        <div className="philjs-qr-spinner" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`philjs-qr ${className || ''}`}
      style={containerStyle}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

/**
 * QR Code with download button
 */
export function QRCodeWithDownload({
  filename = 'qrcode',
  downloadFormat = 'png',
  ...props
}: QRCodeProps & {
  filename?: string;
  downloadFormat?: 'png' | 'svg' | 'jpeg';
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(async () => {
    if (!containerRef.current) return;

    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    if (downloadFormat === 'svg') {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      downloadBlob(blob, `${filename}.svg`);
      return;
    }

    // Convert to canvas for PNG/JPEG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            downloadBlob(blob, `${filename}.${downloadFormat}`);
          }
        },
        `image/${downloadFormat}`,
        0.95
      );

      URL.revokeObjectURL(url);
    };

    img.src = url;
  }, [filename, downloadFormat]);

  return (
    <div className="philjs-qr-downloadable">
      <div ref={containerRef}>
        <QRCode {...props} />
      </div>
      <button
        onClick={handleDownload}
        className="philjs-qr-download-btn"
        style={{
          marginTop: '0.5rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          fontSize: '0.875rem',
        }}
      >
        Download {downloadFormat.toUpperCase()}
      </button>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default QRCode;

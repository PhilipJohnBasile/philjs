/**
 * @philjs/qr - QR Scanner Component
 * Camera-based QR code and barcode scanning
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { QRScannerProps, ScanResult, ScannerConfig } from '../types';

export function QRScanner({
  config = {},
  onScan,
  onError,
  className,
  style,
  showViewfinder = true,
  showTorchButton = false,
  showSwitchCameraButton = false,
  pauseOnScan = false,
  children,
}: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>(0);

  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    config.facingMode || 'environment'
  );

  // Request camera permission and start stream
  const startCamera = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setHasPermission(true);
      setIsScanning(true);
    } catch (error) {
      setHasPermission(false);
      onError?.(error as Error);
    }
  }, [facingMode, onError]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsScanning(false);
  }, []);

  // Toggle torch/flashlight
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;

    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      await track.applyConstraints({
        // @ts-ignore - torch is a valid constraint but not in types
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn(!torchOn);
    } catch (error) {
      console.warn('Torch not supported on this device');
    }
  }, [torchOn]);

  // Switch between front and back camera
  const switchCamera = useCallback(() => {
    stopCamera();
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, [stopCamera]);

  // Scan for QR codes in video frames
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Use BarcodeDetector API if available
    if ('BarcodeDetector' in window) {
      const detector = new (window as unknown as { BarcodeDetector: new (opts?: { formats: string[] }) => {
        detect: (image: ImageData) => Promise<Array<{ rawValue: string; format: string }>>;
      } }).BarcodeDetector({
        formats: config.formatsToSupport?.map((f) => f.toLowerCase()) || ['qr_code'],
      });

      detector
        .detect(imageData)
        .then((barcodes) => {
          if (barcodes.length > 0) {
            const result: ScanResult = {
              text: barcodes[0].rawValue,
              format: barcodes[0].format.toUpperCase() as ScanResult['format'],
              timestamp: Date.now(),
            };

            onScan(result);

            if (pauseOnScan) {
              setIsScanning(false);
              return;
            }
          }

          animationRef.current = requestAnimationFrame(scanFrame);
        })
        .catch(() => {
          animationRef.current = requestAnimationFrame(scanFrame);
        });
    } else {
      // Fallback: use a JavaScript-based decoder (would need external library)
      animationRef.current = requestAnimationFrame(scanFrame);
    }
  }, [isScanning, onScan, pauseOnScan, config.formatsToSupport]);

  // Start scanning when video is ready
  useEffect(() => {
    if (isScanning && videoRef.current) {
      animationRef.current = requestAnimationFrame(scanFrame);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isScanning, scanFrame]);

  // Initialize camera on mount
  useEffect(() => {
    startCamera();
    return stopCamera;
  }, [facingMode]);

  // Render permission request
  if (hasPermission === false) {
    return (
      <div
        className={`philjs-qr-scanner-error ${className || ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          backgroundColor: '#fef2f2',
          borderRadius: '0.5rem',
          ...style,
        }}
      >
        <p style={{ color: '#dc2626', marginBottom: '1rem' }}>
          Camera access denied. Please grant permission to scan QR codes.
        </p>
        <button
          onClick={startCamera}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
          }}
        >
          Request Permission
        </button>
      </div>
    );
  }

  return (
    <div
      className={`philjs-qr-scanner ${className || ''}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#000',
        ...style,
      }}
    >
      <video
        ref={videoRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        playsInline
        muted
      />

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {showViewfinder && (
        <div
          className="philjs-qr-viewfinder"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: config.qrbox
              ? typeof config.qrbox === 'number'
                ? config.qrbox
                : config.qrbox.width
              : 250,
            height: config.qrbox
              ? typeof config.qrbox === 'number'
                ? config.qrbox
                : config.qrbox.height
              : 250,
            border: '2px solid rgba(255, 255, 255, 0.8)',
            borderRadius: '0.5rem',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              backgroundColor: '#3b82f6',
              animation: 'philjs-qr-scan-line 2s linear infinite',
            }}
          />
        </div>
      )}

      <div
        className="philjs-qr-controls"
        style={{
          position: 'absolute',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '0.5rem',
        }}
      >
        {showTorchButton && (
          <button
            onClick={toggleTorch}
            style={{
              padding: '0.5rem',
              backgroundColor: torchOn ? '#fbbf24' : 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '1.25rem',
            }}
            title={torchOn ? 'Turn off flash' : 'Turn on flash'}
          >
            🔦
          </button>
        )}

        {showSwitchCameraButton && (
          <button
            onClick={switchCamera}
            style={{
              padding: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '1.25rem',
            }}
            title="Switch camera"
          >
            🔄
          </button>
        )}
      </div>

      {children}

      <style>{`
        @keyframes philjs-qr-scan-line {
          0% { top: 0; }
          50% { top: calc(100% - 2px); }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
}

export default QRScanner;

# @philjs/qr

QR code generation and camera-based scanning for PhilJS with customizable styles, logos, gradients, and barcode format support.

## Installation

```bash
npm install @philjs/qr
```

## Features

- **Customizable Generation** - Multiple dot styles, corner styles, colors
- **Logo Embedding** - Add images to QR code center
- **Gradient Colors** - Linear and radial gradient support
- **Camera Scanning** - Built-in QR/barcode scanner using BarcodeDetector API
- **Multiple Formats** - Export as SVG, PNG, JPEG, data URL
- **Data Helpers** - Create WiFi, vCard, email, SMS, geo, event QR codes
- **Batch Generation** - Generate multiple QR codes at once
- **Barcode Support** - Scan QR codes and various barcode formats

## Quick Start

```typescript
import { createQRCode, createQRScanner } from '@philjs/qr';

// Generate a QR code
const qr = createQRCode({
  container: document.getElementById('qr'),
  data: 'https://example.com',
  style: {
    width: 200,
    height: 200,
    dotStyle: 'rounded',
  },
});

// Scan QR codes
const scanner = createQRScanner({
  container: document.getElementById('scanner'),
  onScan: (result) => {
    console.log('Scanned:', result.text);
  },
});

await scanner.start();
```

## QR Code Generation

### Basic Usage

```typescript
import { generateQRCode, generateQRCodeDataURL } from '@philjs/qr';

// Generate SVG string
const svg = generateQRCode({
  data: 'Hello, World!',
  style: {
    width: 256,
    height: 256,
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
  },
});

// Generate data URL for images
const dataUrl = generateQRCodeDataURL({
  data: 'https://example.com',
});

// Use in an image
const img = document.createElement('img');
img.src = dataUrl;
```

### QR Code Options

```typescript
interface QRCodeOptions {
  data: string;
  style?: QRStyle;
  logo?: QRLogo;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  gradient?: QRGradient;
}

interface QRStyle {
  width?: number;          // Default: 200
  height?: number;         // Default: 200
  margin?: number;         // Default: 4
  backgroundColor?: string; // Default: '#ffffff'
  foregroundColor?: string; // Default: '#000000'
  cornerRadius?: number;   // Default: 0
  dotStyle?: 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded';
  cornerStyle?: 'square' | 'rounded' | 'extra-rounded';
  cornerDotStyle?: 'square' | 'dot';
}
```

### Dot Styles

```typescript
// Square dots (default)
generateQRCode({
  data: 'https://example.com',
  style: { dotStyle: 'square' },
});

// Rounded dots
generateQRCode({
  data: 'https://example.com',
  style: { dotStyle: 'rounded' },
});

// Circular dots
generateQRCode({
  data: 'https://example.com',
  style: { dotStyle: 'dots' },
});

// Classy style
generateQRCode({
  data: 'https://example.com',
  style: { dotStyle: 'classy' },
});

// Classy rounded
generateQRCode({
  data: 'https://example.com',
  style: { dotStyle: 'classy-rounded' },
});
```

### Error Correction Levels

```typescript
// L - Low (7% recovery)
generateQRCode({ data: '...', errorCorrectionLevel: 'L' });

// M - Medium (15% recovery) - Default
generateQRCode({ data: '...', errorCorrectionLevel: 'M' });

// Q - Quartile (25% recovery)
generateQRCode({ data: '...', errorCorrectionLevel: 'Q' });

// H - High (30% recovery) - Best for logos
generateQRCode({ data: '...', errorCorrectionLevel: 'H' });
```

### Adding a Logo

```typescript
generateQRCode({
  data: 'https://example.com',
  errorCorrectionLevel: 'H', // Use high error correction with logos
  logo: {
    src: '/logo.png',
    width: 50,
    height: 50,
    margin: 4,
    borderRadius: 8,
    removeBackground: true,
  },
});
```

### Gradient Colors

```typescript
// Linear gradient
generateQRCode({
  data: 'https://example.com',
  gradient: {
    type: 'linear',
    rotation: 45,
    colorStops: [
      { offset: 0, color: '#6366f1' },
      { offset: 1, color: '#ec4899' },
    ],
  },
});

// Radial gradient
generateQRCode({
  data: 'https://example.com',
  gradient: {
    type: 'radial',
    colorStops: [
      { offset: 0, color: '#fbbf24' },
      { offset: 1, color: '#f97316' },
    ],
  },
});
```

## QRCode Class

### Creating Instances

```typescript
import { QRCode, createQRCode } from '@philjs/qr';

// Using the class directly
const qr = new QRCode({
  container: document.getElementById('qr-container'),
  data: 'https://example.com',
  style: {
    width: 256,
    height: 256,
    dotStyle: 'rounded',
    foregroundColor: '#3b82f6',
  },
});

// Using the factory function
const qr2 = createQRCode({
  container: document.getElementById('qr-container'),
  data: 'https://example.com',
});
```

### Instance Methods

```typescript
// Update data
qr.setData('https://new-url.com');

// Update style
qr.setStyle({
  foregroundColor: '#ef4444',
  dotStyle: 'dots',
});

// Get SVG string
const svg = qr.getSVG();

// Get data URL
const dataUrl = qr.getDataURL();

// Get canvas element
const canvas = await qr.getCanvas();

// Download as file
await qr.download('my-qr-code', 'png'); // or 'svg', 'jpeg'

// Cleanup
qr.destroy();
```

## Data Type Helpers

### WiFi QR Code

```typescript
import { createWiFiQR } from '@philjs/qr';

const wifiData = createWiFiQR({
  ssid: 'MyNetwork',
  password: 'secret123',
  encryption: 'WPA', // 'WPA' | 'WEP' | 'nopass'
  hidden: false,
});

generateQRCode({ data: wifiData });
// Output: WIFI:T:WPA;S:MyNetwork;P:secret123;H:false;;
```

### vCard (Contact)

```typescript
import { createVCardQR } from '@philjs/qr';

const vcard = createVCardQR({
  firstName: 'John',
  lastName: 'Doe',
  organization: 'Acme Inc',
  title: 'Developer',
  email: 'john@example.com',
  phone: '+1234567890',
  website: 'https://johndoe.com',
  address: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    country: 'USA',
  },
});

generateQRCode({ data: vcard });
```

### Email

```typescript
import { createEmailQR } from '@philjs/qr';

const emailData = createEmailQR({
  to: 'support@example.com',
  subject: 'Hello',
  body: 'I have a question...',
});

generateQRCode({ data: emailData });
// Output: mailto:support@example.com?subject=Hello&body=I%20have%20a%20question...
```

### SMS

```typescript
import { createSMSQR } from '@philjs/qr';

const smsData = createSMSQR({
  phone: '+1234567890',
  message: 'Hello from QR!',
});

generateQRCode({ data: smsData });
// Output: sms:+1234567890?body=Hello%20from%20QR!
```

### Geo Location

```typescript
import { createGeoQR } from '@philjs/qr';

const geoData = createGeoQR(40.7128, -74.0060); // NYC coordinates
generateQRCode({ data: geoData });
// Output: geo:40.7128,-74.0060
```

### Calendar Event

```typescript
import { createEventQR } from '@philjs/qr';

const eventData = createEventQR({
  title: 'Team Meeting',
  startDate: new Date('2024-12-15T10:00:00'),
  endDate: new Date('2024-12-15T11:00:00'),
  location: 'Conference Room A',
  description: 'Weekly sync meeting',
});

generateQRCode({ data: eventData });
```

## Data Validation

```typescript
import { validateQRData } from '@philjs/qr';

const result = validateQRData('https://example.com/long/path...');

console.log(result);
// {
//   valid: true,
//   type: 'url',      // 'url' | 'text' | 'email' | 'phone' | 'wifi' | 'vcard' | 'unknown'
//   length: 42,
//   maxCapacity: 2953 // Max characters for QR version 40
// }
```

## Batch Generation

```typescript
import { batchGenerateQR } from '@philjs/qr';

const items = [
  { id: 'qr-1', data: 'https://product1.example.com' },
  { id: 'qr-2', data: 'https://product2.example.com' },
  { id: 'qr-3', data: 'https://product3.example.com', options: { style: { dotStyle: 'dots' } } },
];

const defaultOptions = {
  style: {
    width: 200,
    height: 200,
    foregroundColor: '#1e40af',
  },
};

const results = await batchGenerateQR(items, defaultOptions);

// Results is a Map<string, string>
results.forEach((svg, id) => {
  document.getElementById(id).innerHTML = svg;
});
```

## QR Scanner

### Basic Scanning

```typescript
import { QRScanner, createQRScanner } from '@philjs/qr';

const scanner = createQRScanner({
  container: document.getElementById('scanner-container'),
  onScan: (result) => {
    console.log('Scanned:', result.text);
    console.log('Format:', result.format);
    console.log('Timestamp:', result.timestamp);
  },
  onError: (error) => {
    console.error('Scanner error:', error);
  },
});

// Start scanning
await scanner.start();
```

### Scanner Configuration

```typescript
interface ScannerConfig {
  facingMode?: 'user' | 'environment'; // Default: 'environment'
  fps?: number;                        // Scanning frame rate
  qrbox?: { width: number; height: number } | number; // Scanning area
  aspectRatio?: number;
  disableFlip?: boolean;
  formatsToSupport?: BarcodeFormat[];  // Formats to detect
}

const scanner = createQRScanner({
  container,
  config: {
    facingMode: 'environment', // Back camera
    qrbox: 250,               // 250x250 scanning area
    formatsToSupport: ['QR_CODE', 'EAN_13', 'CODE_128'],
  },
  onScan: handleScan,
  showViewfinder: true,     // Show scanning overlay
  pauseOnScan: true,        // Pause after successful scan
});
```

### Supported Barcode Formats

```typescript
type BarcodeFormat =
  | 'QR_CODE'
  | 'AZTEC'
  | 'CODABAR'
  | 'CODE_39'
  | 'CODE_93'
  | 'CODE_128'
  | 'DATA_MATRIX'
  | 'EAN_8'
  | 'EAN_13'
  | 'ITF'
  | 'PDF_417'
  | 'RSS_14'
  | 'RSS_EXPANDED'
  | 'UPC_A'
  | 'UPC_E'
  | 'UPC_EAN_EXTENSION';
```

### Scanner Controls

```typescript
// Start/stop scanning
await scanner.start();
scanner.stop();

// Pause/resume
scanner.pause();
scanner.resume();

// Switch camera (front/back)
await scanner.switchCamera();

// Toggle flashlight/torch
const torchEnabled = await scanner.toggleTorch();
```

### Check Scanner Support

```typescript
// Check if BarcodeDetector API is available
const isSupported = QRScanner.isSupported();

// Get supported formats
const formats = await QRScanner.getSupportedFormats();
console.log('Supported formats:', formats);
```

### Scan Result

```typescript
interface ScanResult {
  text: string;           // Decoded content
  format: BarcodeFormat;  // Detected format
  rawBytes?: Uint8Array;  // Raw byte data
  timestamp: number;      // Scan timestamp
}
```

## Export Formats

```typescript
import { generateQRCodeCanvas } from '@philjs/qr';

// Get canvas for custom processing
const canvas = await generateQRCodeCanvas({
  data: 'https://example.com',
  style: { width: 400, height: 400 },
});

// Export as PNG
canvas.toBlob((blob) => {
  const url = URL.createObjectURL(blob);
  // Use blob URL
}, 'image/png');

// Export as JPEG with quality
canvas.toBlob((blob) => {
  // Use blob
}, 'image/jpeg', 0.9);
```

## Types Reference

```typescript
// Error correction levels
type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

// QR style options
interface QRStyle {
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

// Logo configuration
interface QRLogo {
  src: string;
  width?: number;
  height?: number;
  margin?: number;
  borderRadius?: number;
  removeBackground?: boolean;
}

// Gradient configuration
interface QRGradient {
  type: 'linear' | 'radial';
  rotation?: number;
  colorStops: Array<{
    offset: number;
    color: string;
  }>;
}

// Full QR code options
interface QRCodeOptions {
  data: string;
  style?: QRStyle;
  logo?: QRLogo;
  errorCorrectionLevel?: ErrorCorrectionLevel;
  gradient?: QRGradient;
}

// Output formats
type QROutputFormat = 'svg' | 'png' | 'jpeg' | 'webp' | 'canvas' | 'dataURL';
```

## API Reference

### Functions

| Function | Description |
|----------|-------------|
| `generateQRCode(options)` | Generate QR code as SVG string |
| `generateQRCodeDataURL(options)` | Generate QR code as data URL |
| `generateQRCodeCanvas(options)` | Generate QR code as canvas element |
| `createQRCode(config)` | Create QRCode instance |
| `createQRScanner(config)` | Create QRScanner instance |
| `validateQRData(data)` | Validate QR code data |
| `batchGenerateQR(items, options?)` | Generate multiple QR codes |
| `createWiFiQR(options)` | Create WiFi QR data string |
| `createVCardQR(options)` | Create vCard QR data string |
| `createEmailQR(options)` | Create email QR data string |
| `createSMSQR(options)` | Create SMS QR data string |
| `createGeoQR(lat, lng)` | Create geo location QR data |
| `createEventQR(options)` | Create calendar event QR data |

### Classes

| Class | Description |
|-------|-------------|
| `QRCode` | QR code generator with DOM integration |
| `QRScanner` | Camera-based QR/barcode scanner |

## Examples

### Product Label Generator

```typescript
import { createQRCode, createVCardQR } from '@philjs/qr';

function ProductLabel({ product }) {
  const qrRef = useRef(null);

  useEffect(() => {
    const qr = createQRCode({
      container: qrRef.current,
      data: `https://store.example.com/products/${product.sku}`,
      style: {
        width: 100,
        height: 100,
        dotStyle: 'rounded',
      },
      logo: {
        src: product.brandLogo,
        width: 25,
        height: 25,
      },
      errorCorrectionLevel: 'H',
    });

    return () => qr.destroy();
  }, [product]);

  return (
    <div class="product-label">
      <h3>{product.name}</h3>
      <div ref={qrRef} />
      <p>Scan for details</p>
    </div>
  );
}
```

### Ticket Scanner

```typescript
import { createQRScanner } from '@philjs/qr';

function TicketScanner({ onTicketScanned }) {
  const scannerRef = useRef(null);
  const scannerInstance = useRef(null);

  useEffect(() => {
    scannerInstance.current = createQRScanner({
      container: scannerRef.current,
      config: {
        facingMode: 'environment',
        qrbox: 200,
      },
      onScan: async (result) => {
        // Validate ticket
        const ticket = await validateTicket(result.text);
        onTicketScanned(ticket);
      },
      showViewfinder: true,
      pauseOnScan: true,
    });

    scannerInstance.current.start();

    return () => scannerInstance.current.destroy();
  }, []);

  const resumeScan = () => {
    scannerInstance.current.resume();
  };

  return (
    <div class="ticket-scanner">
      <div ref={scannerRef} style={{ width: 300, height: 300 }} />
      <button onClick={resumeScan}>Scan Next</button>
    </div>
  );
}
```

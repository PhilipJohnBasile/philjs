/**
 * Responsive Preview - Preview designs on different device sizes
 */

// ============================================================================
// Types
// ============================================================================

export interface DevicePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  category: 'mobile' | 'tablet' | 'desktop' | 'tv';
  userAgent?: string;
  pixelRatio?: number;
}

export interface ResponsivePreviewProps {
  /**
   * Content to preview
   */
  children?: unknown;

  /**
   * Current device preset ID
   */
  deviceId?: string;

  /**
   * Custom width (for custom device)
   */
  customWidth?: number;

  /**
   * Custom height (for custom device)
   */
  customHeight?: number;

  /**
   * Callback when device changes
   */
  onDeviceChange?: (device: DevicePreset) => void;

  /**
   * Whether to show the device frame
   */
  showFrame?: boolean;

  /**
   * Whether to show device selector toolbar
   */
  showToolbar?: boolean;

  /**
   * Scale factor for preview
   */
  scale?: number;

  /**
   * Custom class name
   */
  className?: string;
}

export interface DeviceSelectorProps {
  /**
   * List of available devices
   */
  devices?: DevicePreset[];

  /**
   * Currently selected device ID
   */
  selectedId?: string;

  /**
   * Callback when device is selected
   */
  onSelect?: (device: DevicePreset) => void;

  /**
   * Whether to group devices by category
   */
  grouped?: boolean;

  /**
   * Custom class name
   */
  className?: string;
}

export interface PreviewFrameProps {
  /**
   * Frame width
   */
  width: number;

  /**
   * Frame height
   */
  height: number;

  /**
   * Device name for aria-label
   */
  deviceName?: string;

  /**
   * Content to display
   */
  children?: unknown;

  /**
   * Custom class name
   */
  className?: string;
}

export interface DeviceFrameProps {
  /**
   * Device preset to display
   */
  device: DevicePreset;

  /**
   * Content to display
   */
  children?: unknown;

  /**
   * Whether to show device chrome (bezels, etc.)
   */
  showChrome?: boolean;

  /**
   * Custom class name
   */
  className?: string;
}

export interface PreviewToolbarProps {
  /**
   * Current device
   */
  currentDevice?: DevicePreset;

  /**
   * Available devices
   */
  devices?: DevicePreset[];

  /**
   * Callback when device changes
   */
  onDeviceChange?: (device: DevicePreset) => void;

  /**
   * Current zoom level
   */
  zoom?: number;

  /**
   * Callback when zoom changes
   */
  onZoomChange?: (zoom: number) => void;

  /**
   * Callback when rotation is requested
   */
  onRotate?: () => void;

  /**
   * Custom class name
   */
  className?: string;
}

export interface ResponsiveController {
  /**
   * Set the current device
   */
  setDevice: (deviceId: string) => void;

  /**
   * Set custom dimensions
   */
  setCustomDimensions: (width: number, height: number) => void;

  /**
   * Rotate the current device
   */
  rotate: () => void;

  /**
   * Set zoom level
   */
  setZoom: (zoom: number) => void;

  /**
   * Get current device
   */
  getDevice: () => DevicePreset | undefined;

  /**
   * Get current dimensions
   */
  getDimensions: () => { width: number; height: number };
}

// ============================================================================
// Device Presets
// ============================================================================

/**
 * Common device presets for responsive preview
 */
export const devicePresets: DevicePreset[] = [
  // Mobile devices
  { id: 'iphone-se', name: 'iPhone SE', width: 375, height: 667, category: 'mobile', pixelRatio: 2 },
  { id: 'iphone-14', name: 'iPhone 14', width: 390, height: 844, category: 'mobile', pixelRatio: 3 },
  { id: 'iphone-14-pro-max', name: 'iPhone 14 Pro Max', width: 430, height: 932, category: 'mobile', pixelRatio: 3 },
  { id: 'pixel-7', name: 'Pixel 7', width: 412, height: 915, category: 'mobile', pixelRatio: 2.625 },
  { id: 'samsung-galaxy-s23', name: 'Samsung Galaxy S23', width: 360, height: 780, category: 'mobile', pixelRatio: 3 },

  // Tablets
  { id: 'ipad-mini', name: 'iPad Mini', width: 768, height: 1024, category: 'tablet', pixelRatio: 2 },
  { id: 'ipad-air', name: 'iPad Air', width: 820, height: 1180, category: 'tablet', pixelRatio: 2 },
  { id: 'ipad-pro-11', name: 'iPad Pro 11"', width: 834, height: 1194, category: 'tablet', pixelRatio: 2 },
  { id: 'ipad-pro-12', name: 'iPad Pro 12.9"', width: 1024, height: 1366, category: 'tablet', pixelRatio: 2 },
  { id: 'surface-pro', name: 'Surface Pro', width: 912, height: 1368, category: 'tablet', pixelRatio: 2 },

  // Desktop
  { id: 'laptop', name: 'Laptop', width: 1366, height: 768, category: 'desktop', pixelRatio: 1 },
  { id: 'desktop-hd', name: 'Desktop HD', width: 1920, height: 1080, category: 'desktop', pixelRatio: 1 },
  { id: 'desktop-2k', name: 'Desktop 2K', width: 2560, height: 1440, category: 'desktop', pixelRatio: 1 },
  { id: 'desktop-4k', name: 'Desktop 4K', width: 3840, height: 2160, category: 'desktop', pixelRatio: 2 },

  // TV
  { id: 'tv-1080p', name: 'TV 1080p', width: 1920, height: 1080, category: 'tv', pixelRatio: 1 },
  { id: 'tv-4k', name: 'TV 4K', width: 3840, height: 2160, category: 'tv', pixelRatio: 1 },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get devices by category
 */
export function getDevicesByCategory(category: DevicePreset['category']): DevicePreset[] {
  return devicePresets.filter(d => d.category === category);
}

/**
 * Get a device by ID
 */
export function getDeviceById(id: string): DevicePreset | undefined {
  return devicePresets.find(d => d.id === id);
}

/**
 * Create a responsive controller
 */
export function createResponsiveController(): ResponsiveController {
  let currentDevice: DevicePreset | undefined = devicePresets[0];
  let customWidth = 1920;
  let customHeight = 1080;
  let zoom = 1;
  let isRotated = false;

  return {
    setDevice(deviceId: string) {
      currentDevice = getDeviceById(deviceId);
      isRotated = false;
    },

    setCustomDimensions(width: number, height: number) {
      customWidth = width;
      customHeight = height;
      currentDevice = undefined;
    },

    rotate() {
      isRotated = !isRotated;
    },

    setZoom(newZoom: number) {
      zoom = Math.max(0.1, Math.min(2, newZoom));
    },

    getDevice() {
      return currentDevice;
    },

    getDimensions() {
      if (currentDevice) {
        return isRotated
          ? { width: currentDevice.height, height: currentDevice.width }
          : { width: currentDevice.width, height: currentDevice.height };
      }
      return { width: customWidth, height: customHeight };
    },
  };
}

// ============================================================================
// Components
// ============================================================================

/**
 * Responsive Preview component
 */
export function ResponsivePreview(props: ResponsivePreviewProps): HTMLElement {
  const {
    className = '',
    showFrame = true,
    showToolbar = true,
    scale = 1,
  } = props;

  const container = document.createElement('div');
  container.className = `philjs-responsive-preview ${className}`.trim();

  if (showToolbar) {
    const toolbar = document.createElement('div');
    toolbar.className = 'philjs-preview-toolbar';
    container.appendChild(toolbar);
  }

  const previewArea = document.createElement('div');
  previewArea.className = 'philjs-preview-area';
  previewArea.style.transform = `scale(${scale})`;

  if (showFrame) {
    const frame = document.createElement('div');
    frame.className = 'philjs-preview-frame';
    previewArea.appendChild(frame);
  }

  container.appendChild(previewArea);

  return container;
}

/**
 * Device Frame component - displays device chrome/bezel
 */
export function DeviceFrame(props: DeviceFrameProps): HTMLElement {
  const { device, showChrome = true, className = '' } = props;

  const container = document.createElement('div');
  container.className = `philjs-device-frame philjs-device-${device.category} ${className}`.trim();
  container.style.width = `${device.width}px`;
  container.style.height = `${device.height}px`;

  if (showChrome) {
    container.classList.add('philjs-device-chrome');
  }

  return container;
}

/**
 * Device Selector component
 */
export function DeviceSelector(props: DeviceSelectorProps): HTMLElement {
  const {
    devices = devicePresets,
    grouped = true,
    className = '',
  } = props;

  const container = document.createElement('div');
  container.className = `philjs-device-selector ${className}`.trim();

  if (grouped) {
    const categories = ['mobile', 'tablet', 'desktop', 'tv'] as const;
    for (const category of categories) {
      const categoryDevices = devices.filter(d => d.category === category);
      if (categoryDevices.length > 0) {
        const group = document.createElement('div');
        group.className = 'philjs-device-group';
        group.dataset['category'] = category;
        container.appendChild(group);
      }
    }
  } else {
    for (const device of devices) {
      const option = document.createElement('button');
      option.className = 'philjs-device-option';
      option.textContent = device.name;
      option.dataset['deviceId'] = device.id;
      container.appendChild(option);
    }
  }

  return container;
}

/**
 * Preview Toolbar component
 */
export function PreviewToolbar(props: PreviewToolbarProps): HTMLElement {
  const { className = '' } = props;

  const container = document.createElement('div');
  container.className = `philjs-preview-toolbar ${className}`.trim();

  // Device selector area
  const deviceArea = document.createElement('div');
  deviceArea.className = 'philjs-toolbar-section philjs-toolbar-devices';
  container.appendChild(deviceArea);

  // Zoom controls
  const zoomArea = document.createElement('div');
  zoomArea.className = 'philjs-toolbar-section philjs-toolbar-zoom';
  container.appendChild(zoomArea);

  // Rotate button
  const rotateBtn = document.createElement('button');
  rotateBtn.className = 'philjs-toolbar-btn philjs-toolbar-rotate';
  rotateBtn.title = 'Rotate device';
  container.appendChild(rotateBtn);

  return container;
}

export default {
  ResponsivePreview,
  DeviceFrame,
  DeviceSelector,
  PreviewToolbar,
  createResponsiveController,
  devicePresets,
  getDevicesByCategory,
  getDeviceById,
};

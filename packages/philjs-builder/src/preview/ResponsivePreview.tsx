/**
 * Responsive Preview - Desktop/Tablet/Mobile preview modes
 */

import { signal, memo, effect } from 'philjs-core';
import type { BuilderStore } from '../state/store.js';
import type { NodeId, ComponentNode, ViewportMode } from '../types.js';

// ============================================================================
// Types
// ============================================================================

export interface DevicePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  devicePixelRatio?: number;
  category: 'mobile' | 'tablet' | 'desktop';
  icon?: string;
}

export interface ResponsivePreviewProps {
  store: BuilderStore;
  children: any;
  className?: string;
  style?: Record<string, string | number>;
}

export interface DeviceSelectorProps {
  devices: DevicePreset[];
  selectedDevice: DevicePreset | null;
  onSelectDevice: (device: DevicePreset | null) => void;
  customWidth?: number;
  customHeight?: number;
  onCustomSizeChange?: (width: number, height: number) => void;
}

export interface PreviewFrameProps {
  device: DevicePreset | null;
  customWidth?: number;
  customHeight?: number;
  zoom: number;
  children: any;
}

export interface ResponsiveController {
  currentDevice: ReturnType<typeof signal<DevicePreset | null>>;
  customWidth: ReturnType<typeof signal<number>>;
  customHeight: ReturnType<typeof signal<number>>;
  zoom: ReturnType<typeof signal<number>>;
  orientation: ReturnType<typeof signal<'portrait' | 'landscape'>>;
  setDevice: (device: DevicePreset | null) => void;
  setCustomSize: (width: number, height: number) => void;
  setZoom: (zoom: number) => void;
  toggleOrientation: () => void;
  resetToDesktop: () => void;
  getCurrentWidth: () => number;
  getCurrentHeight: () => number;
}

// ============================================================================
// Device Presets
// ============================================================================

export const devicePresets: DevicePreset[] = [
  // Mobile devices
  { id: 'iphone-se', name: 'iPhone SE', width: 375, height: 667, devicePixelRatio: 2, category: 'mobile', icon: 'smartphone' },
  { id: 'iphone-12', name: 'iPhone 12/13', width: 390, height: 844, devicePixelRatio: 3, category: 'mobile', icon: 'smartphone' },
  { id: 'iphone-12-pro-max', name: 'iPhone 12/13 Pro Max', width: 428, height: 926, devicePixelRatio: 3, category: 'mobile', icon: 'smartphone' },
  { id: 'iphone-14-pro', name: 'iPhone 14 Pro', width: 393, height: 852, devicePixelRatio: 3, category: 'mobile', icon: 'smartphone' },
  { id: 'pixel-5', name: 'Pixel 5', width: 393, height: 851, devicePixelRatio: 2.75, category: 'mobile', icon: 'smartphone' },
  { id: 'samsung-s21', name: 'Samsung S21', width: 360, height: 800, devicePixelRatio: 3, category: 'mobile', icon: 'smartphone' },
  { id: 'android-small', name: 'Android Small', width: 320, height: 568, devicePixelRatio: 2, category: 'mobile', icon: 'smartphone' },

  // Tablet devices
  { id: 'ipad-mini', name: 'iPad Mini', width: 768, height: 1024, devicePixelRatio: 2, category: 'tablet', icon: 'tablet' },
  { id: 'ipad', name: 'iPad', width: 810, height: 1080, devicePixelRatio: 2, category: 'tablet', icon: 'tablet' },
  { id: 'ipad-air', name: 'iPad Air', width: 820, height: 1180, devicePixelRatio: 2, category: 'tablet', icon: 'tablet' },
  { id: 'ipad-pro-11', name: 'iPad Pro 11"', width: 834, height: 1194, devicePixelRatio: 2, category: 'tablet', icon: 'tablet' },
  { id: 'ipad-pro-12', name: 'iPad Pro 12.9"', width: 1024, height: 1366, devicePixelRatio: 2, category: 'tablet', icon: 'tablet' },
  { id: 'surface-pro', name: 'Surface Pro', width: 912, height: 1368, devicePixelRatio: 2, category: 'tablet', icon: 'tablet' },
  { id: 'android-tablet', name: 'Android Tablet', width: 800, height: 1280, devicePixelRatio: 2, category: 'tablet', icon: 'tablet' },

  // Desktop devices
  { id: 'laptop-sm', name: 'Laptop (Small)', width: 1280, height: 800, devicePixelRatio: 1, category: 'desktop', icon: 'laptop' },
  { id: 'laptop-md', name: 'Laptop', width: 1366, height: 768, devicePixelRatio: 1, category: 'desktop', icon: 'laptop' },
  { id: 'laptop-lg', name: 'Laptop (Large)', width: 1440, height: 900, devicePixelRatio: 1, category: 'desktop', icon: 'laptop' },
  { id: 'desktop-hd', name: 'Desktop HD', width: 1920, height: 1080, devicePixelRatio: 1, category: 'desktop', icon: 'monitor' },
  { id: 'desktop-2k', name: 'Desktop 2K', width: 2560, height: 1440, devicePixelRatio: 1, category: 'desktop', icon: 'monitor' },
  { id: 'desktop-4k', name: 'Desktop 4K', width: 3840, height: 2160, devicePixelRatio: 1, category: 'desktop', icon: 'monitor' },
];

/**
 * Get devices by category
 */
export function getDevicesByCategory(category: 'mobile' | 'tablet' | 'desktop'): DevicePreset[] {
  return devicePresets.filter(d => d.category === category);
}

/**
 * Get device by ID
 */
export function getDeviceById(id: string): DevicePreset | undefined {
  return devicePresets.find(d => d.id === id);
}

// ============================================================================
// Responsive Controller
// ============================================================================

/**
 * Create a responsive preview controller
 */
export function createResponsiveController(
  store?: BuilderStore,
  initialDevice?: DevicePreset | null
): ResponsiveController {
  const currentDevice = signal<DevicePreset | null>(initialDevice || null);
  const customWidth = signal<number>(1280);
  const customHeight = signal<number>(800);
  const zoom = signal<number>(1);
  const orientation = signal<'portrait' | 'landscape'>('portrait');

  const setDevice = (device: DevicePreset | null) => {
    currentDevice.set(device);
    if (store) {
      store.dispatch({
        type: 'SET_VIEWPORT_MODE',
        payload: device
          ? (device.category === 'mobile' ? 'mobile' : device.category === 'tablet' ? 'tablet' : 'desktop')
          : 'desktop',
      });
    }
  };

  const setCustomSize = (width: number, height: number) => {
    customWidth.set(width);
    customHeight.set(height);
    currentDevice.set(null);
  };

  const setZoom = (newZoom: number) => {
    zoom.set(Math.max(0.1, Math.min(2, newZoom)));
  };

  const toggleOrientation = () => {
    orientation.set(orientation() === 'portrait' ? 'landscape' : 'portrait');
  };

  const resetToDesktop = () => {
    currentDevice.set(null);
    customWidth.set(1280);
    customHeight.set(800);
    zoom.set(1);
    orientation.set('portrait');
    if (store) {
      store.dispatch({ type: 'SET_VIEWPORT_MODE', payload: 'desktop' });
    }
  };

  const getCurrentWidth = () => {
    const device = currentDevice();
    if (!device) return customWidth();
    const isLandscape = orientation() === 'landscape' && device.category !== 'desktop';
    return isLandscape ? device.height : device.width;
  };

  const getCurrentHeight = () => {
    const device = currentDevice();
    if (!device) return customHeight();
    const isLandscape = orientation() === 'landscape' && device.category !== 'desktop';
    return isLandscape ? device.width : device.height;
  };

  return {
    currentDevice,
    customWidth,
    customHeight,
    zoom,
    orientation,
    setDevice,
    setCustomSize,
    setZoom,
    toggleOrientation,
    resetToDesktop,
    getCurrentWidth,
    getCurrentHeight,
  };
}

// ============================================================================
// Device Frame Component
// ============================================================================

export interface DeviceFrameProps {
  device: DevicePreset | null;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  zoom: number;
  children: any;
  showFrame?: boolean;
}

export function DeviceFrame({
  device,
  width,
  height,
  orientation,
  zoom,
  children,
  showFrame = true,
}: DeviceFrameProps) {
  const isLandscape = orientation === 'landscape' && device?.category !== 'desktop';
  const frameWidth = isLandscape ? height : width;
  const frameHeight = isLandscape ? width : height;
  const scaledWidth = frameWidth * zoom;
  const scaledHeight = frameHeight * zoom;

  const isMobile = device?.category === 'mobile';
  const isTablet = device?.category === 'tablet';

  // Device frame styles
  const frameStyle: Record<string, any> = {
    position: 'relative',
    width: scaledWidth,
    height: scaledHeight,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
  };

  if (showFrame && (isMobile || isTablet)) {
    Object.assign(frameStyle, {
      borderRadius: isMobile ? '36px' : '24px',
      boxShadow: '0 0 0 12px #1a1a1a, 0 0 0 14px #333, 0 25px 50px rgba(0,0,0,0.3)',
      padding: isMobile ? '60px 12px' : '40px 12px',
    });
  } else if (showFrame) {
    Object.assign(frameStyle, {
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    });
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        backgroundColor: '#f5f5f5',
        minHeight: '100%',
      }}
    >
      <div style={frameStyle}>
        {/* Device notch for mobile */}
        {showFrame && isMobile && (
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: isLandscape ? '100px' : '130px',
              height: isLandscape ? '20px' : '30px',
              backgroundColor: '#1a1a1a',
              borderRadius: '15px',
              zIndex: 10,
            }}
          />
        )}

        {/* Content area */}
        <div
          style={{
            width: '100%',
            height: '100%',
            overflow: 'auto',
            backgroundColor: '#ffffff',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>

        {/* Home indicator for mobile */}
        {showFrame && isMobile && (
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100px',
              height: '4px',
              backgroundColor: '#1a1a1a',
              borderRadius: '2px',
            }}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Device Selector Component
// ============================================================================

export function DeviceSelector({
  devices,
  selectedDevice,
  onSelectDevice,
  customWidth = 1280,
  customHeight = 800,
  onCustomSizeChange,
}: DeviceSelectorProps) {
  const mobileDevices = devices.filter(d => d.category === 'mobile');
  const tabletDevices = devices.filter(d => d.category === 'tablet');
  const desktopDevices = devices.filter(d => d.category === 'desktop');

  const buttonStyle = (isSelected: boolean) => ({
    padding: '8px 12px',
    border: isSelected ? '2px solid #0066ff' : '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: isSelected ? '#e6f0ff' : '#fff',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: isSelected ? 600 : 400,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    minWidth: '80px',
  });

  const sectionStyle = {
    marginBottom: '16px',
  };

  const sectionTitleStyle = {
    fontSize: '11px',
    fontWeight: 600,
    color: '#666',
    textTransform: 'uppercase' as const,
    marginBottom: '8px',
    letterSpacing: '0.5px',
  };

  const deviceGridStyle = {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Quick access buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          style={buttonStyle(!selectedDevice)}
          onClick={() => onSelectDevice(null)}
        >
          <span style={{ fontSize: '16px' }}>100%</span>
          <span style={{ fontSize: '10px', color: '#999' }}>Responsive</span>
        </button>
        <button
          style={buttonStyle(selectedDevice?.category === 'mobile')}
          onClick={() => onSelectDevice(mobileDevices[1] || mobileDevices[0])}
        >
          <span style={{ fontSize: '16px' }}>M</span>
          <span style={{ fontSize: '10px', color: '#999' }}>Mobile</span>
        </button>
        <button
          style={buttonStyle(selectedDevice?.category === 'tablet')}
          onClick={() => onSelectDevice(tabletDevices[0])}
        >
          <span style={{ fontSize: '16px' }}>T</span>
          <span style={{ fontSize: '10px', color: '#999' }}>Tablet</span>
        </button>
        <button
          style={buttonStyle(selectedDevice?.category === 'desktop')}
          onClick={() => onSelectDevice(desktopDevices[1] || desktopDevices[0])}
        >
          <span style={{ fontSize: '16px' }}>D</span>
          <span style={{ fontSize: '10px', color: '#999' }}>Desktop</span>
        </button>
      </div>

      {/* Mobile devices */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Mobile</div>
        <div style={deviceGridStyle}>
          {mobileDevices.map(device => (
            <button
              key={device.id}
              style={buttonStyle(selectedDevice?.id === device.id)}
              onClick={() => onSelectDevice(device)}
            >
              <span style={{ fontSize: '10px', fontWeight: 600 }}>{device.name}</span>
              <span style={{ fontSize: '9px', color: '#999' }}>{device.width}x{device.height}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tablet devices */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Tablet</div>
        <div style={deviceGridStyle}>
          {tabletDevices.map(device => (
            <button
              key={device.id}
              style={buttonStyle(selectedDevice?.id === device.id)}
              onClick={() => onSelectDevice(device)}
            >
              <span style={{ fontSize: '10px', fontWeight: 600 }}>{device.name}</span>
              <span style={{ fontSize: '9px', color: '#999' }}>{device.width}x{device.height}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop devices */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Desktop</div>
        <div style={deviceGridStyle}>
          {desktopDevices.map(device => (
            <button
              key={device.id}
              style={buttonStyle(selectedDevice?.id === device.id)}
              onClick={() => onSelectDevice(device)}
            >
              <span style={{ fontSize: '10px', fontWeight: 600 }}>{device.name}</span>
              <span style={{ fontSize: '9px', color: '#999' }}>{device.width}x{device.height}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom size */}
      {onCustomSizeChange && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Custom Size</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="number"
              value={customWidth}
              onChange={(e) => onCustomSizeChange(parseInt((e.target as HTMLInputElement).value) || 0, customHeight)}
              style={{
                width: '80px',
                padding: '6px 8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            />
            <span style={{ color: '#999' }}>x</span>
            <input
              type="number"
              value={customHeight}
              onChange={(e) => onCustomSizeChange(customWidth, parseInt((e.target as HTMLInputElement).value) || 0)}
              style={{
                width: '80px',
                padding: '6px 8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            />
            <button
              onClick={() => onSelectDevice(null)}
              style={{
                padding: '6px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Preview Toolbar Component
// ============================================================================

export interface PreviewToolbarProps {
  controller: ResponsiveController;
  devices?: DevicePreset[];
  showZoomControls?: boolean;
  showOrientationToggle?: boolean;
}

export function PreviewToolbar({
  controller,
  devices = devicePresets,
  showZoomControls = true,
  showOrientationToggle = true,
}: PreviewToolbarProps) {
  const device = controller.currentDevice();
  const currentZoom = controller.zoom();
  const currentOrientation = controller.orientation();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 16px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
      }}
    >
      {/* Device info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: '#666' }}>
          {device ? device.name : 'Responsive'}
        </span>
        <span style={{ fontSize: '11px', color: '#999', fontFamily: 'monospace' }}>
          {controller.getCurrentWidth()}x{controller.getCurrentHeight()}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Orientation toggle */}
      {showOrientationToggle && device && device.category !== 'desktop' && (
        <button
          onClick={() => controller.toggleOrientation()}
          style={{
            padding: '6px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title="Toggle orientation"
        >
          <span style={{ transform: currentOrientation === 'landscape' ? 'rotate(90deg)' : 'none' }}>
            []
          </span>
          {currentOrientation === 'portrait' ? 'Portrait' : 'Landscape'}
        </button>
      )}

      {/* Zoom controls */}
      {showZoomControls && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => controller.setZoom(currentZoom - 0.1)}
            disabled={currentZoom <= 0.25}
            style={{
              padding: '4px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: currentZoom <= 0.25 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: currentZoom <= 0.25 ? 0.5 : 1,
            }}
          >
            -
          </button>
          <span style={{ fontSize: '11px', color: '#666', minWidth: '40px', textAlign: 'center' }}>
            {Math.round(currentZoom * 100)}%
          </span>
          <button
            onClick={() => controller.setZoom(currentZoom + 0.1)}
            disabled={currentZoom >= 2}
            style={{
              padding: '4px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: currentZoom >= 2 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: currentZoom >= 2 ? 0.5 : 1,
            }}
          >
            +
          </button>
          <button
            onClick={() => controller.setZoom(1)}
            style={{
              padding: '4px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '11px',
              marginLeft: '4px',
            }}
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Responsive Preview Component
// ============================================================================

export function ResponsivePreview({
  store,
  children,
  className,
  style,
}: ResponsivePreviewProps) {
  const controller = createResponsiveController(store);

  return (
    <div
      class={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#f5f5f5',
        ...style,
      }}
    >
      <PreviewToolbar controller={controller} />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <DeviceFrame
          device={controller.currentDevice()}
          width={controller.getCurrentWidth()}
          height={controller.getCurrentHeight()}
          orientation={controller.orientation()}
          zoom={controller.zoom()}
        >
          {children}
        </DeviceFrame>
      </div>
    </div>
  );
}

export default ResponsivePreview;

/**
 * Responsive Preview - Preview designs on different device sizes
 */
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
    getDimensions: () => {
        width: number;
        height: number;
    };
}
/**
 * Common device presets for responsive preview
 */
export declare const devicePresets: DevicePreset[];
/**
 * Get devices by category
 */
export declare function getDevicesByCategory(category: DevicePreset['category']): DevicePreset[];
/**
 * Get a device by ID
 */
export declare function getDeviceById(id: string): DevicePreset | undefined;
/**
 * Create a responsive controller
 */
export declare function createResponsiveController(): ResponsiveController;
/**
 * Responsive Preview component
 */
export declare function ResponsivePreview(props: ResponsivePreviewProps): HTMLElement;
/**
 * Device Frame component - displays device chrome/bezel
 */
export declare function DeviceFrame(props: DeviceFrameProps): HTMLElement;
/**
 * Device Selector component
 */
export declare function DeviceSelector(props: DeviceSelectorProps): HTMLElement;
/**
 * Preview Toolbar component
 */
export declare function PreviewToolbar(props: PreviewToolbarProps): HTMLElement;
declare const _default: {
    ResponsivePreview: typeof ResponsivePreview;
    DeviceFrame: typeof DeviceFrame;
    DeviceSelector: typeof DeviceSelector;
    PreviewToolbar: typeof PreviewToolbar;
    createResponsiveController: typeof createResponsiveController;
    devicePresets: DevicePreset[];
    getDevicesByCategory: typeof getDevicesByCategory;
    getDeviceById: typeof getDeviceById;
};
export default _default;
//# sourceMappingURL=ResponsivePreview.d.ts.map
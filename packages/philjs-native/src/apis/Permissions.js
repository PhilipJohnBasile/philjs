/**
 * PhilJS Native - Permissions API
 *
 * Unified permissions handling for camera, location, notifications,
 * microphone, contacts, calendar, and other native permissions.
 */
import { signal, effect, batch } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';
// ============================================================================
// State
// ============================================================================
/**
 * Permission status cache
 */
const permissionCache = new Map();
/**
 * Get or create permission signal
 */
function getPermissionSignal(type) {
    if (!permissionCache.has(type)) {
        permissionCache.set(type, signal({
            status: 'undetermined',
            canAskAgain: true,
        }));
    }
    return permissionCache.get(type);
}
// ============================================================================
// Web Permission Mapping
// ============================================================================
/**
 * Map our permission types to Web Permissions API names
 */
const webPermissionMap = {
    camera: 'camera',
    microphone: 'microphone',
    location: 'geolocation',
    locationWhenInUse: 'geolocation',
    locationAlways: 'geolocation',
    notifications: 'notifications',
};
/**
 * Check if Web Permissions API supports a permission
 */
function isWebPermissionSupported(type) {
    return webPermissionMap[type] !== undefined;
}
// ============================================================================
// Permission Checking
// ============================================================================
/**
 * Check a single permission status
 */
export async function check(type) {
    const platform = detectPlatform();
    const permissionSignal = getPermissionSignal(type);
    if (platform === 'web') {
        return checkWebPermission(type);
    }
    try {
        const result = await nativeBridge.call('Permissions', 'check', type);
        permissionSignal.set(result);
        return result;
    }
    catch (error) {
        console.error(`Failed to check permission ${type}:`, error);
        return { status: 'unavailable', canAskAgain: false };
    }
}
/**
 * Check permission on web
 */
async function checkWebPermission(type) {
    const permissionSignal = getPermissionSignal(type);
    // Check if permission type is supported on web
    if (!isWebPermissionSupported(type)) {
        const result = { status: 'unavailable', canAskAgain: false };
        permissionSignal.set(result);
        return result;
    }
    try {
        const webPermission = webPermissionMap[type];
        const permissionStatus = await navigator.permissions.query({ name: webPermission });
        let status;
        switch (permissionStatus.state) {
            case 'granted':
                status = 'granted';
                break;
            case 'denied':
                status = 'blocked';
                break;
            default:
                status = 'undetermined';
        }
        const result = {
            status,
            canAskAgain: permissionStatus.state === 'prompt',
        };
        permissionSignal.set(result);
        return result;
    }
    catch (error) {
        // Fallback for unsupported permissions
        const result = { status: 'undetermined', canAskAgain: true };
        permissionSignal.set(result);
        return result;
    }
}
/**
 * Check multiple permissions
 */
export async function checkMultiple(types) {
    const results = await Promise.all(types.map(type => check(type)));
    const permissionsResult = {};
    types.forEach((type, index) => {
        const result = results[index];
        if (result !== undefined) {
            permissionsResult[type] = result;
        }
    });
    return permissionsResult;
}
// ============================================================================
// Permission Requesting
// ============================================================================
/**
 * Request a single permission
 */
export async function request(type, rationale) {
    const platform = detectPlatform();
    const permissionSignal = getPermissionSignal(type);
    if (platform === 'web') {
        return requestWebPermission(type);
    }
    try {
        const result = await nativeBridge.call('Permissions', 'request', type, rationale);
        permissionSignal.set(result);
        return result;
    }
    catch (error) {
        console.error(`Failed to request permission ${type}:`, error);
        return { status: 'denied', canAskAgain: false };
    }
}
/**
 * Request permission on web
 */
async function requestWebPermission(type) {
    const permissionSignal = getPermissionSignal(type);
    // Handle specific web permission requests
    switch (type) {
        case 'camera':
            return requestMediaPermission('video', permissionSignal);
        case 'microphone':
            return requestMediaPermission('audio', permissionSignal);
        case 'location':
        case 'locationWhenInUse':
        case 'locationAlways':
            return requestLocationPermission(permissionSignal);
        case 'notifications':
            return requestNotificationPermission(permissionSignal);
        default:
            return { status: 'unavailable', canAskAgain: false };
    }
}
/**
 * Request media (camera/microphone) permission
 */
async function requestMediaPermission(type, permissionSignal) {
    try {
        const constraints = type === 'video'
            ? { video: true }
            : { audio: true };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        // Stop all tracks immediately - we just needed permission
        stream.getTracks().forEach(track => track.stop());
        const result = { status: 'granted', canAskAgain: false };
        permissionSignal.set(result);
        return result;
    }
    catch (error) {
        let status = 'denied';
        if (error.name === 'NotAllowedError') {
            status = 'blocked';
        }
        else if (error.name === 'NotFoundError') {
            status = 'unavailable';
        }
        const result = { status, canAskAgain: false };
        permissionSignal.set(result);
        return result;
    }
}
/**
 * Request location permission
 */
async function requestLocationPermission(permissionSignal) {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            const result = { status: 'unavailable', canAskAgain: false };
            permissionSignal.set(result);
            resolve(result);
            return;
        }
        navigator.geolocation.getCurrentPosition(() => {
            const result = { status: 'granted', canAskAgain: false };
            permissionSignal.set(result);
            resolve(result);
        }, (error) => {
            let status = 'denied';
            if (error.code === error.PERMISSION_DENIED) {
                status = 'blocked';
            }
            const result = { status, canAskAgain: false };
            permissionSignal.set(result);
            resolve(result);
        }, { timeout: 10000 });
    });
}
/**
 * Request notification permission
 */
async function requestNotificationPermission(permissionSignal) {
    if (!('Notification' in window)) {
        const result = { status: 'unavailable', canAskAgain: false };
        permissionSignal.set(result);
        return result;
    }
    try {
        const permission = await Notification.requestPermission();
        let status;
        switch (permission) {
            case 'granted':
                status = 'granted';
                break;
            case 'denied':
                status = 'blocked';
                break;
            default:
                status = 'undetermined';
        }
        const result = { status, canAskAgain: permission === 'default' };
        permissionSignal.set(result);
        return result;
    }
    catch (error) {
        const result = { status: 'denied', canAskAgain: false };
        permissionSignal.set(result);
        return result;
    }
}
/**
 * Request multiple permissions
 */
export async function requestMultiple(types, rationales) {
    const results = await Promise.all(types.map(type => request(type, rationales?.[type])));
    const permissionsResult = {};
    types.forEach((type, index) => {
        const result = results[index];
        if (result !== undefined) {
            permissionsResult[type] = result;
        }
    });
    return permissionsResult;
}
// ============================================================================
// Permission Utilities
// ============================================================================
/**
 * Open app settings (for blocked permissions)
 */
export async function openSettings() {
    const platform = detectPlatform();
    if (platform === 'web') {
        console.warn('Cannot open settings from web');
        return;
    }
    await nativeBridge.call('Permissions', 'openSettings');
}
/**
 * Check if permission is granted
 */
export function isGranted(status) {
    return status === 'granted' || status === 'limited';
}
/**
 * Check if permission is denied but can request again
 */
export function canRequest(result) {
    return result.status === 'undetermined' ||
        (result.status === 'denied' && result.canAskAgain);
}
/**
 * Check if permission is blocked (need to go to settings)
 */
export function isBlocked(status) {
    return status === 'blocked';
}
/**
 * Check if permission is unavailable on this device
 */
export function isUnavailable(status) {
    return status === 'unavailable';
}
// ============================================================================
// Hooks
// ============================================================================
/**
 * Hook to use a permission
 */
export function usePermission(type) {
    const permissionSignal = getPermissionSignal(type);
    const current = permissionSignal();
    return {
        status: current.status,
        canAskAgain: current.canAskAgain,
        check: () => check(type),
        request: (rationale) => request(type, rationale),
    };
}
/**
 * Hook to use multiple permissions
 */
export function usePermissions(types) {
    const statuses = {};
    types.forEach(type => {
        const permissionSignal = getPermissionSignal(type);
        statuses[type] = permissionSignal();
    });
    const allGranted = types.every(type => isGranted(statuses[type]?.status || 'undetermined'));
    const anyDenied = types.some(type => statuses[type]?.status === 'denied' || statuses[type]?.status === 'blocked');
    return {
        statuses,
        allGranted,
        anyDenied,
        checkAll: () => checkMultiple(types),
        requestAll: (rationales) => requestMultiple(types, rationales),
    };
}
// ============================================================================
// Permission Groups
// ============================================================================
/**
 * Predefined permission groups
 */
export const PermissionGroups = {
    /** Permissions needed for media capture */
    media: ['camera', 'microphone'],
    /** Permissions needed for location-based features */
    location: ['locationWhenInUse', 'locationAlways'],
    /** Permissions needed for communication features */
    communication: ['notifications', 'contacts'],
    /** Permissions needed for health/fitness features */
    health: ['healthRead', 'healthWrite', 'motion'],
    /** Permissions needed for calendar features */
    calendar: ['calendar', 'reminders'],
    /** Permissions needed for media library access */
    mediaLibrary: ['photos', 'mediaLibrary'],
};
/**
 * Request a permission group
 */
export async function requestGroup(group, rationales) {
    return requestMultiple(PermissionGroups[group], rationales);
}
/**
 * Check a permission group
 */
export async function checkGroup(group) {
    return checkMultiple(PermissionGroups[group]);
}
// ============================================================================
// Permissions API Object
// ============================================================================
/**
 * Permissions API singleton
 */
export const Permissions = {
    // Core methods
    check,
    request,
    checkMultiple,
    requestMultiple,
    openSettings,
    // Utility methods
    isGranted,
    isBlocked,
    isUnavailable,
    canRequest,
    // Groups
    groups: PermissionGroups,
    requestGroup,
    checkGroup,
    // Hooks
    usePermission,
    usePermissions,
};
export default Permissions;
//# sourceMappingURL=Permissions.js.map
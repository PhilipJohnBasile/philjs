/**
 * PhilJS Native - Permissions API
 *
 * Unified permissions handling for camera, location, notifications,
 * microphone, contacts, calendar, and other native permissions.
 */

import { signal, effect, batch, type Signal } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Permission types
 */
export type PermissionType =
  | 'camera'
  | 'microphone'
  | 'location'
  | 'locationWhenInUse'
  | 'locationAlways'
  | 'notifications'
  | 'contacts'
  | 'calendar'
  | 'reminders'
  | 'photos'
  | 'mediaLibrary'
  | 'bluetooth'
  | 'motion'
  | 'healthRead'
  | 'healthWrite'
  | 'speechRecognition'
  | 'faceId'
  | 'siri'
  | 'tracking';

/**
 * Permission status
 */
export type PermissionStatus =
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'undetermined'
  | 'limited'
  | 'unavailable';

/**
 * Permission result with details
 */
export interface PermissionResult {
  status: PermissionStatus;
  canAskAgain: boolean;
}

/**
 * Multiple permissions result
 */
export type PermissionsResult = Record<PermissionType, PermissionResult>;

/**
 * Permission rationale for request
 */
export interface PermissionRationale {
  title: string;
  message: string;
  buttonPositive?: string;
  buttonNegative?: string;
}

// ============================================================================
// State
// ============================================================================

/**
 * Permission status cache
 */
const permissionCache = new Map<PermissionType, Signal<PermissionResult>>();

/**
 * Get or create permission signal
 */
function getPermissionSignal(type: PermissionType): Signal<PermissionResult> {
  if (!permissionCache.has(type)) {
    permissionCache.set(type, signal<PermissionResult>({
      status: 'undetermined',
      canAskAgain: true,
    }));
  }
  return permissionCache.get(type)!;
}

// ============================================================================
// Web Permission Mapping
// ============================================================================

/**
 * Map our permission types to Web Permissions API names
 */
const webPermissionMap: Partial<Record<PermissionType, PermissionName>> = {
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
function isWebPermissionSupported(type: PermissionType): boolean {
  return webPermissionMap[type] !== undefined;
}

// ============================================================================
// Permission Checking
// ============================================================================

/**
 * Check a single permission status
 */
export async function check(type: PermissionType): Promise<PermissionResult> {
  const platform = detectPlatform();
  const permissionSignal = getPermissionSignal(type);

  if (platform === 'web') {
    return checkWebPermission(type);
  }

  try {
    const result = await nativeBridge.call<PermissionResult>('Permissions', 'check', type);
    permissionSignal.set(result);
    return result;
  } catch (error) {
    console.error(`Failed to check permission ${type}:`, error);
    return { status: 'unavailable', canAskAgain: false };
  }
}

/**
 * Check permission on web
 */
async function checkWebPermission(type: PermissionType): Promise<PermissionResult> {
  const permissionSignal = getPermissionSignal(type);

  // Check if permission type is supported on web
  if (!isWebPermissionSupported(type)) {
    const result: PermissionResult = { status: 'unavailable', canAskAgain: false };
    permissionSignal.set(result);
    return result;
  }

  try {
    const webPermission = webPermissionMap[type]!;
    const permissionStatus = await navigator.permissions.query({ name: webPermission });

    let status: PermissionStatus;
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

    const result: PermissionResult = {
      status,
      canAskAgain: permissionStatus.state === 'prompt',
    };

    permissionSignal.set(result);
    return result;
  } catch (error) {
    // Fallback for unsupported permissions
    const result: PermissionResult = { status: 'undetermined', canAskAgain: true };
    permissionSignal.set(result);
    return result;
  }
}

/**
 * Check multiple permissions
 */
export async function checkMultiple(types: PermissionType[]): Promise<PermissionsResult> {
  const results = await Promise.all(types.map(type => check(type)));

  const permissionsResult: Partial<PermissionsResult> = {};
  types.forEach((type, index) => {
    const result = results[index];
    if (result !== undefined) {
      permissionsResult[type] = result;
    }
  });

  return permissionsResult as PermissionsResult;
}

// ============================================================================
// Permission Requesting
// ============================================================================

/**
 * Request a single permission
 */
export async function request(
  type: PermissionType,
  rationale?: PermissionRationale
): Promise<PermissionResult> {
  const platform = detectPlatform();
  const permissionSignal = getPermissionSignal(type);

  if (platform === 'web') {
    return requestWebPermission(type);
  }

  try {
    const result = await nativeBridge.call<PermissionResult>(
      'Permissions',
      'request',
      type,
      rationale
    );
    permissionSignal.set(result);
    return result;
  } catch (error) {
    console.error(`Failed to request permission ${type}:`, error);
    return { status: 'denied', canAskAgain: false };
  }
}

/**
 * Request permission on web
 */
async function requestWebPermission(type: PermissionType): Promise<PermissionResult> {
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
async function requestMediaPermission(
  type: 'video' | 'audio',
  permissionSignal: Signal<PermissionResult>
): Promise<PermissionResult> {
  try {
    const constraints: MediaStreamConstraints = type === 'video'
      ? { video: true }
      : { audio: true };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Stop all tracks immediately - we just needed permission
    stream.getTracks().forEach(track => track.stop());

    const result: PermissionResult = { status: 'granted', canAskAgain: false };
    permissionSignal.set(result);
    return result;
  } catch (error: any) {
    let status: PermissionStatus = 'denied';

    if (error.name === 'NotAllowedError') {
      status = 'blocked';
    } else if (error.name === 'NotFoundError') {
      status = 'unavailable';
    }

    const result: PermissionResult = { status, canAskAgain: false };
    permissionSignal.set(result);
    return result;
  }
}

/**
 * Request location permission
 */
async function requestLocationPermission(
  permissionSignal: Signal<PermissionResult>
): Promise<PermissionResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      const result: PermissionResult = { status: 'unavailable', canAskAgain: false };
      permissionSignal.set(result);
      resolve(result);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        const result: PermissionResult = { status: 'granted', canAskAgain: false };
        permissionSignal.set(result);
        resolve(result);
      },
      (error) => {
        let status: PermissionStatus = 'denied';

        if (error.code === error.PERMISSION_DENIED) {
          status = 'blocked';
        }

        const result: PermissionResult = { status, canAskAgain: false };
        permissionSignal.set(result);
        resolve(result);
      },
      { timeout: 10000 }
    );
  });
}

/**
 * Request notification permission
 */
async function requestNotificationPermission(
  permissionSignal: Signal<PermissionResult>
): Promise<PermissionResult> {
  if (!('Notification' in window)) {
    const result: PermissionResult = { status: 'unavailable', canAskAgain: false };
    permissionSignal.set(result);
    return result;
  }

  try {
    const permission = await Notification.requestPermission();

    let status: PermissionStatus;
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

    const result: PermissionResult = { status, canAskAgain: permission === 'default' };
    permissionSignal.set(result);
    return result;
  } catch (error) {
    const result: PermissionResult = { status: 'denied', canAskAgain: false };
    permissionSignal.set(result);
    return result;
  }
}

/**
 * Request multiple permissions
 */
export async function requestMultiple(
  types: PermissionType[],
  rationales?: Partial<Record<PermissionType, PermissionRationale>>
): Promise<PermissionsResult> {
  const results = await Promise.all(
    types.map(type => request(type, rationales?.[type]))
  );

  const permissionsResult: Partial<PermissionsResult> = {};
  types.forEach((type, index) => {
    const result = results[index];
    if (result !== undefined) {
      permissionsResult[type] = result;
    }
  });

  return permissionsResult as PermissionsResult;
}

// ============================================================================
// Permission Utilities
// ============================================================================

/**
 * Open app settings (for blocked permissions)
 */
export async function openSettings(): Promise<void> {
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
export function isGranted(status: PermissionStatus): boolean {
  return status === 'granted' || status === 'limited';
}

/**
 * Check if permission is denied but can request again
 */
export function canRequest(result: PermissionResult): boolean {
  return result.status === 'undetermined' ||
         (result.status === 'denied' && result.canAskAgain);
}

/**
 * Check if permission is blocked (need to go to settings)
 */
export function isBlocked(status: PermissionStatus): boolean {
  return status === 'blocked';
}

/**
 * Check if permission is unavailable on this device
 */
export function isUnavailable(status: PermissionStatus): boolean {
  return status === 'unavailable';
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to use a permission
 */
export function usePermission(type: PermissionType): {
  status: PermissionStatus;
  canAskAgain: boolean;
  check: () => Promise<PermissionResult>;
  request: (rationale?: PermissionRationale) => Promise<PermissionResult>;
} {
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
export function usePermissions(types: PermissionType[]): {
  statuses: Partial<Record<PermissionType, PermissionResult>>;
  allGranted: boolean;
  anyDenied: boolean;
  checkAll: () => Promise<PermissionsResult>;
  requestAll: (rationales?: Partial<Record<PermissionType, PermissionRationale>>) => Promise<PermissionsResult>;
} {
  const statuses: Partial<Record<PermissionType, PermissionResult>> = {};

  types.forEach(type => {
    const permissionSignal = getPermissionSignal(type);
    statuses[type] = permissionSignal();
  });

  const allGranted = types.every(type => isGranted(statuses[type]?.status || 'undetermined'));
  const anyDenied = types.some(type =>
    statuses[type]?.status === 'denied' || statuses[type]?.status === 'blocked'
  );

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
  media: ['camera', 'microphone'] as PermissionType[],

  /** Permissions needed for location-based features */
  location: ['locationWhenInUse', 'locationAlways'] as PermissionType[],

  /** Permissions needed for communication features */
  communication: ['notifications', 'contacts'] as PermissionType[],

  /** Permissions needed for health/fitness features */
  health: ['healthRead', 'healthWrite', 'motion'] as PermissionType[],

  /** Permissions needed for calendar features */
  calendar: ['calendar', 'reminders'] as PermissionType[],

  /** Permissions needed for media library access */
  mediaLibrary: ['photos', 'mediaLibrary'] as PermissionType[],
};

/**
 * Request a permission group
 */
export async function requestGroup(
  group: keyof typeof PermissionGroups,
  rationales?: Partial<Record<PermissionType, PermissionRationale>>
): Promise<PermissionsResult> {
  return requestMultiple(PermissionGroups[group], rationales);
}

/**
 * Check a permission group
 */
export async function checkGroup(
  group: keyof typeof PermissionGroups
): Promise<PermissionsResult> {
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

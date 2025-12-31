/**
 * PhilJS Native - Permissions API
 *
 * Unified permissions handling for camera, location, notifications,
 * microphone, contacts, calendar, and other native permissions.
 */
/**
 * Permission types
 */
export type PermissionType = 'camera' | 'microphone' | 'location' | 'locationWhenInUse' | 'locationAlways' | 'notifications' | 'contacts' | 'calendar' | 'reminders' | 'photos' | 'mediaLibrary' | 'bluetooth' | 'motion' | 'healthRead' | 'healthWrite' | 'speechRecognition' | 'faceId' | 'siri' | 'tracking';
/**
 * Permission status
 */
export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'undetermined' | 'limited' | 'unavailable';
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
/**
 * Check a single permission status
 */
export declare function check(type: PermissionType): Promise<PermissionResult>;
/**
 * Check multiple permissions
 */
export declare function checkMultiple(types: PermissionType[]): Promise<PermissionsResult>;
/**
 * Request a single permission
 */
export declare function request(type: PermissionType, rationale?: PermissionRationale): Promise<PermissionResult>;
/**
 * Request multiple permissions
 */
export declare function requestMultiple(types: PermissionType[], rationales?: Partial<Record<PermissionType, PermissionRationale>>): Promise<PermissionsResult>;
/**
 * Open app settings (for blocked permissions)
 */
export declare function openSettings(): Promise<void>;
/**
 * Check if permission is granted
 */
export declare function isGranted(status: PermissionStatus): boolean;
/**
 * Check if permission is denied but can request again
 */
export declare function canRequest(result: PermissionResult): boolean;
/**
 * Check if permission is blocked (need to go to settings)
 */
export declare function isBlocked(status: PermissionStatus): boolean;
/**
 * Check if permission is unavailable on this device
 */
export declare function isUnavailable(status: PermissionStatus): boolean;
/**
 * Hook to use a permission
 */
export declare function usePermission(type: PermissionType): {
    status: PermissionStatus;
    canAskAgain: boolean;
    check: () => Promise<PermissionResult>;
    request: (rationale?: PermissionRationale) => Promise<PermissionResult>;
};
/**
 * Hook to use multiple permissions
 */
export declare function usePermissions(types: PermissionType[]): {
    statuses: Partial<Record<PermissionType, PermissionResult>>;
    allGranted: boolean;
    anyDenied: boolean;
    checkAll: () => Promise<PermissionsResult>;
    requestAll: (rationales?: Partial<Record<PermissionType, PermissionRationale>>) => Promise<PermissionsResult>;
};
/**
 * Predefined permission groups
 */
export declare const PermissionGroups: {
    /** Permissions needed for media capture */
    media: PermissionType[];
    /** Permissions needed for location-based features */
    location: PermissionType[];
    /** Permissions needed for communication features */
    communication: PermissionType[];
    /** Permissions needed for health/fitness features */
    health: PermissionType[];
    /** Permissions needed for calendar features */
    calendar: PermissionType[];
    /** Permissions needed for media library access */
    mediaLibrary: PermissionType[];
};
/**
 * Request a permission group
 */
export declare function requestGroup(group: keyof typeof PermissionGroups, rationales?: Partial<Record<PermissionType, PermissionRationale>>): Promise<PermissionsResult>;
/**
 * Check a permission group
 */
export declare function checkGroup(group: keyof typeof PermissionGroups): Promise<PermissionsResult>;
/**
 * Permissions API singleton
 */
export declare const Permissions: {
    check: typeof check;
    request: typeof request;
    checkMultiple: typeof checkMultiple;
    requestMultiple: typeof requestMultiple;
    openSettings: typeof openSettings;
    isGranted: typeof isGranted;
    isBlocked: typeof isBlocked;
    isUnavailable: typeof isUnavailable;
    canRequest: typeof canRequest;
    groups: {
        /** Permissions needed for media capture */
        media: PermissionType[];
        /** Permissions needed for location-based features */
        location: PermissionType[];
        /** Permissions needed for communication features */
        communication: PermissionType[];
        /** Permissions needed for health/fitness features */
        health: PermissionType[];
        /** Permissions needed for calendar features */
        calendar: PermissionType[];
        /** Permissions needed for media library access */
        mediaLibrary: PermissionType[];
    };
    requestGroup: typeof requestGroup;
    checkGroup: typeof checkGroup;
    usePermission: typeof usePermission;
    usePermissions: typeof usePermissions;
};
export default Permissions;
//# sourceMappingURL=Permissions.d.ts.map
//! PhilJS Mobile Permissions
//!
//! Runtime permission handling for iOS and Android.

use std::future::Future;

/// Permission types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Permission {
    /// Camera access
    Camera,
    /// Microphone access
    Microphone,
    /// Photo library read access
    PhotoLibraryRead,
    /// Photo library write access
    PhotoLibraryWrite,
    /// Location when in use
    LocationWhenInUse,
    /// Location always (background)
    LocationAlways,
    /// Contacts read access
    ContactsRead,
    /// Contacts write access
    ContactsWrite,
    /// Calendar read access
    CalendarRead,
    /// Calendar write access
    CalendarWrite,
    /// Reminders access
    Reminders,
    /// Push notifications
    Notifications,
    /// Bluetooth
    Bluetooth,
    /// Motion and fitness data
    Motion,
    /// Health data (iOS)
    Health,
    /// Face ID / Biometrics
    Biometrics,
    /// Speech recognition
    SpeechRecognition,
    /// Tracking (iOS 14+)
    Tracking,
    /// Media library
    MediaLibrary,
    /// Background refresh
    BackgroundRefresh,
    /// Siri integration
    Siri,
}

/// Permission status
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PermissionStatus {
    /// Permission hasn't been requested yet
    NotDetermined,
    /// Permission was denied
    Denied,
    /// Permission was granted
    Authorized,
    /// Permission is restricted (parental controls, etc.)
    Restricted,
    /// Limited access (iOS 14+ photo library)
    Limited,
    /// Provisional (quiet notifications)
    Provisional,
}

impl PermissionStatus {
    /// Check if permission is granted
    pub fn is_granted(&self) -> bool {
        matches!(self, PermissionStatus::Authorized | PermissionStatus::Limited | PermissionStatus::Provisional)
    }

    /// Check if we should show rationale (Android)
    pub fn should_show_rationale(&self) -> bool {
        matches!(self, PermissionStatus::Denied)
    }
}

/// Request a permission
pub fn request_permission(permission: Permission) -> impl Future<Output = PermissionStatus> {
    async move {
        #[cfg(target_os = "ios")]
        {
            request_ios_permission(permission).await
        }
        #[cfg(target_os = "android")]
        {
            request_android_permission(permission).await
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            // Simulation - always grant
            let _ = permission;
            PermissionStatus::Authorized
        }
    }
}

/// Check current permission status
pub fn check_permission(permission: Permission) -> PermissionStatus {
    #[cfg(target_os = "ios")]
    {
        check_ios_permission(permission)
    }
    #[cfg(target_os = "android")]
    {
        check_android_permission(permission)
    }
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        let _ = permission;
        PermissionStatus::Authorized
    }
}

/// Request multiple permissions at once
pub fn request_permissions(
    permissions: &[Permission],
) -> impl Future<Output = Vec<(Permission, PermissionStatus)>> {
    let permissions = permissions.to_vec();
    async move {
        let mut results = Vec::new();
        for permission in permissions {
            let status = request_permission(permission).await;
            results.push((permission, status));
        }
        results
    }
}

/// Open app settings (for when permissions are denied)
pub fn open_app_settings() {
    #[cfg(target_os = "ios")]
    {
        open_ios_settings();
    }
    #[cfg(target_os = "android")]
    {
        open_android_settings();
    }
}

#[cfg(target_os = "ios")]
async fn request_ios_permission(permission: Permission) -> PermissionStatus {
    // Would use appropriate framework (AVFoundation, Photos, CoreLocation, etc.)
    match permission {
        Permission::Camera => {
            // Would use AVCaptureDevice.requestAccess
            PermissionStatus::Authorized
        }
        Permission::LocationWhenInUse => {
            // Would use CLLocationManager.requestWhenInUseAuthorization
            PermissionStatus::Authorized
        }
        _ => PermissionStatus::Authorized,
    }
}

#[cfg(target_os = "ios")]
fn check_ios_permission(permission: Permission) -> PermissionStatus {
    // Would check actual status
    let _ = permission;
    PermissionStatus::NotDetermined
}

#[cfg(target_os = "ios")]
fn open_ios_settings() {
    // Would open Settings app via URL scheme
}

#[cfg(target_os = "android")]
async fn request_android_permission(permission: Permission) -> PermissionStatus {
    // Would use ActivityCompat.requestPermissions
    let _ = permission;
    PermissionStatus::Authorized
}

#[cfg(target_os = "android")]
fn check_android_permission(permission: Permission) -> PermissionStatus {
    // Would use ContextCompat.checkSelfPermission
    let _ = permission;
    PermissionStatus::NotDetermined
}

#[cfg(target_os = "android")]
fn open_android_settings() {
    // Would open app settings via Intent
}

/// Permission group for UI purposes
pub struct PermissionGroup {
    pub permission: Permission,
    pub title: &'static str,
    pub description: &'static str,
    pub icon: &'static str,
}

impl Permission {
    /// Get permission group info
    pub fn info(&self) -> PermissionGroup {
        match self {
            Permission::Camera => PermissionGroup {
                permission: *self,
                title: "Camera",
                description: "Used to take photos and videos",
                icon: "camera",
            },
            Permission::Microphone => PermissionGroup {
                permission: *self,
                title: "Microphone",
                description: "Used to record audio",
                icon: "mic",
            },
            Permission::PhotoLibraryRead => PermissionGroup {
                permission: *self,
                title: "Photo Library",
                description: "Access your photos",
                icon: "photo",
            },
            Permission::LocationWhenInUse => PermissionGroup {
                permission: *self,
                title: "Location",
                description: "Access your location while using the app",
                icon: "location",
            },
            Permission::LocationAlways => PermissionGroup {
                permission: *self,
                title: "Background Location",
                description: "Access your location even in the background",
                icon: "location",
            },
            Permission::Notifications => PermissionGroup {
                permission: *self,
                title: "Notifications",
                description: "Send you push notifications",
                icon: "bell",
            },
            Permission::ContactsRead => PermissionGroup {
                permission: *self,
                title: "Contacts",
                description: "Access your contacts",
                icon: "person",
            },
            _ => PermissionGroup {
                permission: *self,
                title: "Permission",
                description: "Required for app functionality",
                icon: "lock",
            },
        }
    }

    /// Get the Android permission string
    #[cfg(target_os = "android")]
    pub fn android_permission(&self) -> &'static str {
        match self {
            Permission::Camera => "android.permission.CAMERA",
            Permission::Microphone => "android.permission.RECORD_AUDIO",
            Permission::PhotoLibraryRead => "android.permission.READ_MEDIA_IMAGES",
            Permission::PhotoLibraryWrite => "android.permission.WRITE_EXTERNAL_STORAGE",
            Permission::LocationWhenInUse => "android.permission.ACCESS_FINE_LOCATION",
            Permission::LocationAlways => "android.permission.ACCESS_BACKGROUND_LOCATION",
            Permission::ContactsRead => "android.permission.READ_CONTACTS",
            Permission::ContactsWrite => "android.permission.WRITE_CONTACTS",
            Permission::CalendarRead => "android.permission.READ_CALENDAR",
            Permission::CalendarWrite => "android.permission.WRITE_CALENDAR",
            Permission::Bluetooth => "android.permission.BLUETOOTH_CONNECT",
            _ => "",
        }
    }
}

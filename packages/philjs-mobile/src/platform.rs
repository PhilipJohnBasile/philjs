//! PhilJS Mobile Platform
//!
//! Platform detection and device information.

use crate::SafeArea;

/// Current platform
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Platform {
    IOS,
    Android,
    /// Desktop simulation for development
    Simulation,
}

impl Platform {
    /// Get the current platform
    pub fn current() -> Self {
        #[cfg(target_os = "ios")]
        {
            Platform::IOS
        }
        #[cfg(target_os = "android")]
        {
            Platform::Android
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            Platform::Simulation
        }
    }

    /// Check if running on iOS
    pub fn is_ios() -> bool {
        matches!(Self::current(), Platform::IOS)
    }

    /// Check if running on Android
    pub fn is_android() -> bool {
        matches!(Self::current(), Platform::Android)
    }

    /// Check if running in simulation mode
    pub fn is_simulation() -> bool {
        matches!(Self::current(), Platform::Simulation)
    }
}

/// Platform information
#[derive(Debug, Clone)]
pub struct PlatformInfo {
    pub platform: Platform,
    pub os_version: String,
    pub sdk_version: u32,
    pub is_tablet: bool,
    pub is_emulator: bool,
    pub locale: String,
    pub timezone: String,
}

impl PlatformInfo {
    /// Get current platform info
    pub fn current() -> Self {
        #[cfg(target_os = "ios")]
        {
            Self::get_ios_info()
        }
        #[cfg(target_os = "android")]
        {
            Self::get_android_info()
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            Self::get_simulation_info()
        }
    }

    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    fn get_simulation_info() -> Self {
        PlatformInfo {
            platform: Platform::Simulation,
            os_version: "Simulation".to_string(),
            sdk_version: 0,
            is_tablet: false,
            is_emulator: true,
            locale: "en-US".to_string(),
            timezone: "UTC".to_string(),
        }
    }

    #[cfg(target_os = "ios")]
    fn get_ios_info() -> Self {
        // Would use UIDevice in real implementation
        PlatformInfo {
            platform: Platform::IOS,
            os_version: "17.0".to_string(),
            sdk_version: 17,
            is_tablet: false,
            is_emulator: false,
            locale: "en-US".to_string(),
            timezone: "America/Los_Angeles".to_string(),
        }
    }

    #[cfg(target_os = "android")]
    fn get_android_info() -> Self {
        // Would use Build.VERSION in real implementation
        PlatformInfo {
            platform: Platform::Android,
            os_version: "14".to_string(),
            sdk_version: 34,
            is_tablet: false,
            is_emulator: false,
            locale: "en-US".to_string(),
            timezone: "America/Los_Angeles".to_string(),
        }
    }
}

/// Device hardware information
#[derive(Debug, Clone)]
pub struct DeviceInfo {
    /// Device model (e.g., "iPhone 15 Pro", "Pixel 8")
    pub model: String,
    /// Device manufacturer
    pub manufacturer: String,
    /// Screen width in logical pixels
    pub screen_width: f32,
    /// Screen height in logical pixels
    pub screen_height: f32,
    /// Screen scale factor (1.0, 2.0, 3.0, etc.)
    pub screen_scale: f32,
    /// Screen pixel density (DPI)
    pub screen_density: f32,
    /// Safe area insets
    pub safe_area: SafeArea,
    /// Whether device has notch/dynamic island
    pub has_notch: bool,
    /// Whether device supports haptic feedback
    pub has_haptics: bool,
    /// Whether device has Face ID
    pub has_face_id: bool,
    /// Whether device has Touch ID
    pub has_touch_id: bool,
    /// Total RAM in bytes
    pub total_memory: u64,
    /// Number of CPU cores
    pub cpu_cores: u32,
}

impl DeviceInfo {
    /// Get current device info
    pub fn current() -> Self {
        #[cfg(target_os = "ios")]
        {
            Self::get_ios_device()
        }
        #[cfg(target_os = "android")]
        {
            Self::get_android_device()
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            Self::get_simulation_device()
        }
    }

    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    fn get_simulation_device() -> Self {
        DeviceInfo {
            model: "Simulation".to_string(),
            manufacturer: "PhilJS".to_string(),
            screen_width: 390.0,  // iPhone 14 size
            screen_height: 844.0,
            screen_scale: 3.0,
            screen_density: 460.0,
            safe_area: SafeArea {
                top: 47.0,    // Dynamic Island
                bottom: 34.0, // Home indicator
                left: 0.0,
                right: 0.0,
            },
            has_notch: true,
            has_haptics: true,
            has_face_id: true,
            has_touch_id: false,
            total_memory: 6 * 1024 * 1024 * 1024, // 6GB
            cpu_cores: 6,
        }
    }

    #[cfg(target_os = "ios")]
    fn get_ios_device() -> Self {
        // Would use UIDevice and UIScreen in real implementation
        DeviceInfo {
            model: "iPhone".to_string(),
            manufacturer: "Apple".to_string(),
            screen_width: 390.0,
            screen_height: 844.0,
            screen_scale: 3.0,
            screen_density: 460.0,
            safe_area: SafeArea {
                top: 47.0,
                bottom: 34.0,
                left: 0.0,
                right: 0.0,
            },
            has_notch: true,
            has_haptics: true,
            has_face_id: true,
            has_touch_id: false,
            total_memory: 6 * 1024 * 1024 * 1024,
            cpu_cores: 6,
        }
    }

    #[cfg(target_os = "android")]
    fn get_android_device() -> Self {
        // Would use DisplayMetrics and Build in real implementation
        DeviceInfo {
            model: "Android Device".to_string(),
            manufacturer: "Unknown".to_string(),
            screen_width: 412.0,
            screen_height: 915.0,
            screen_scale: 2.625,
            screen_density: 420.0,
            safe_area: SafeArea {
                top: 24.0, // Status bar
                bottom: 48.0, // Navigation bar
                left: 0.0,
                right: 0.0,
            },
            has_notch: false,
            has_haptics: true,
            has_face_id: false,
            has_touch_id: true,
            total_memory: 8 * 1024 * 1024 * 1024,
            cpu_cores: 8,
        }
    }

    /// Get screen size in logical pixels
    pub fn screen_size(&self) -> crate::Size {
        crate::Size::new(self.screen_width, self.screen_height)
    }

    /// Get screen size in physical pixels
    pub fn physical_screen_size(&self) -> crate::Size {
        crate::Size::new(
            self.screen_width * self.screen_scale,
            self.screen_height * self.screen_scale,
        )
    }
}

/// Battery information
#[derive(Debug, Clone, Copy)]
pub struct BatteryInfo {
    /// Battery level (0.0 - 1.0)
    pub level: f32,
    /// Whether device is charging
    pub is_charging: bool,
    /// Whether device is fully charged
    pub is_full: bool,
    /// Whether battery monitoring is available
    pub is_available: bool,
}

impl BatteryInfo {
    pub fn current() -> Self {
        // Would use platform APIs in real implementation
        BatteryInfo {
            level: 1.0,
            is_charging: true,
            is_full: true,
            is_available: true,
        }
    }
}

/// Network connectivity state
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NetworkState {
    /// No network connection
    None,
    /// Connected via WiFi
    WiFi,
    /// Connected via cellular
    Cellular,
    /// Connected via Ethernet (rare on mobile)
    Ethernet,
    /// Unknown connection type
    Unknown,
}

impl NetworkState {
    pub fn current() -> Self {
        // Would use platform APIs in real implementation
        NetworkState::WiFi
    }

    pub fn is_connected(&self) -> bool {
        !matches!(self, NetworkState::None)
    }

    pub fn is_expensive(&self) -> bool {
        matches!(self, NetworkState::Cellular)
    }
}

/// App visibility/focus state
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AppVisibility {
    /// App is visible and has focus
    Foreground,
    /// App is visible but doesn't have focus (iOS only)
    Inactive,
    /// App is not visible
    Background,
}

impl AppVisibility {
    pub fn current() -> Self {
        // Would use platform APIs in real implementation
        AppVisibility::Foreground
    }
}

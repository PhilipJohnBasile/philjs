//! PhilJS Mobile Prelude
//!
//! Common imports for mobile app development.

pub use crate::{
    // Core types
    Size, Point, Rect, Color, Constraints, EdgeInsets,
    FontWeight, TextAlign, KeyboardType, SafeArea, Orientation, AppState,

    // Traits
    IntoView, NativeComponent, NativeView,

    // Runtime
    run, run_with_config, MobileApp, MobileConfig,

    // Renderer
    NativeRenderer, RenderContext,

    // Components
    components::{
        Text, Button, Image, TextInput, Switch, Slider,
        VStack, HStack, ZStack, ScrollView, ListView,
        Spacer, Divider, Container, Card,
    },

    // Platform
    Platform, PlatformInfo, DeviceInfo,

    // Navigation
    Navigator, Route, NavigationStack,

    // Gestures
    GestureRecognizer, Gesture, GestureState,

    // Animation
    AnimatedValue, SpringAnimation, TimingAnimation,

    // Storage
    SecureStorage, AsyncStorage, FileSystem,

    // Permissions
    Permission, PermissionStatus, request_permission,

    // Notifications
    LocalNotification, PushNotification, NotificationHandler,

    // Haptics
    HapticFeedback, HapticStyle,
};

// Re-export macros
pub use philjs_macros::{component, view, rsx};

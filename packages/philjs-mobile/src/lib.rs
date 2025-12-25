//! PhilJS Mobile - Native iOS and Android Support
//!
//! Build native mobile apps with Rust using the same PhilJS component model.
//! Supports both iOS (via UIKit bindings) and Android (via JNI).
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────┐
//! │                     PhilJS Components                        │
//! │  (Same code as web - view!, rsx!, #[component], signals)    │
//! └─────────────────────────────────────────────────────────────┘
//!                              │
//!                              ▼
//! ┌─────────────────────────────────────────────────────────────┐
//! │                   PhilJS Mobile Runtime                      │
//! │         (Platform abstraction, event handling)               │
//! └─────────────────────────────────────────────────────────────┘
//!                              │
//!              ┌───────────────┴───────────────┐
//!              ▼                               ▼
//! ┌─────────────────────────┐   ┌─────────────────────────┐
//! │       iOS Renderer      │   │    Android Renderer     │
//! │    (UIKit bindings)     │   │    (JNI + Android)      │
//! └─────────────────────────┘   └─────────────────────────┘
//! ```
//!
//! # Example
//!
//! ```rust,ignore
//! use philjs_mobile::prelude::*;
//!
//! #[component]
//! fn App() -> impl IntoView {
//!     let count = create_signal(0);
//!
//!     view! {
//!         <VStack spacing={16}>
//!             <Text font_size={24}>"Counter App"</Text>
//!             <Text>{count}</Text>
//!             <Button on_press={move || count.update(|n| *n + 1)}>
//!                 "Increment"
//!             </Button>
//!         </VStack>
//!     }
//! }
//!
//! fn main() {
//!     philjs_mobile::run(App);
//! }
//! ```

#![allow(unused)]

pub mod prelude;
pub mod runtime;
pub mod renderer;
pub mod components;
pub mod platform;
pub mod navigation;
pub mod gestures;
pub mod animation;
pub mod storage;
pub mod permissions;
pub mod notifications;
pub mod camera;
pub mod location;
pub mod sensors;
pub mod haptics;
pub mod share;
pub mod biometrics;
pub mod in_app_purchase;

#[cfg(target_os = "ios")]
pub mod ios;

#[cfg(target_os = "android")]
pub mod android;

use std::sync::Arc;

// Re-exports
pub use runtime::{MobileApp, MobileConfig, run, run_with_config};
pub use renderer::{NativeRenderer, RenderContext};
pub use components::*;
pub use platform::{Platform, PlatformInfo, DeviceInfo};
pub use navigation::{Navigator, Route, NavigationStack};
pub use gestures::{GestureRecognizer, Gesture, GestureState};
pub use animation::{AnimatedValue, SpringAnimation, TimingAnimation};
pub use storage::{SecureStorage, AsyncStorage, FileSystem};
pub use permissions::{Permission, PermissionStatus, request_permission};
pub use notifications::{LocalNotification, PushNotification, NotificationHandler};
pub use haptics::{HapticFeedback, HapticStyle};

/// Application entry point
pub fn run<F, V>(app: F)
where
    F: Fn() -> V + 'static,
    V: IntoView,
{
    run_with_config(app, MobileConfig::default())
}

/// Application entry point with custom configuration
pub fn run_with_config<F, V>(app: F, config: MobileConfig)
where
    F: Fn() -> V + 'static,
    V: IntoView,
{
    runtime::start_app(app, config)
}

/// Trait for types that can be rendered as a view
pub trait IntoView {
    type Output;
    fn into_view(self) -> Self::Output;
}

/// Trait for native components
pub trait NativeComponent {
    fn render(&self, ctx: &mut RenderContext) -> NativeView;
    fn update(&self, ctx: &mut RenderContext);
    fn measure(&self, constraints: Constraints) -> Size;
}

/// A native view handle
#[derive(Clone)]
pub struct NativeView {
    pub(crate) handle: Arc<dyn std::any::Any + Send + Sync>,
    pub(crate) children: Vec<NativeView>,
}

/// Size constraints for layout
#[derive(Debug, Clone, Copy)]
pub struct Constraints {
    pub min_width: f32,
    pub max_width: f32,
    pub min_height: f32,
    pub max_height: f32,
}

impl Constraints {
    pub fn tight(size: Size) -> Self {
        Constraints {
            min_width: size.width,
            max_width: size.width,
            min_height: size.height,
            max_height: size.height,
        }
    }

    pub fn loose(size: Size) -> Self {
        Constraints {
            min_width: 0.0,
            max_width: size.width,
            min_height: 0.0,
            max_height: size.height,
        }
    }

    pub fn unbounded() -> Self {
        Constraints {
            min_width: 0.0,
            max_width: f32::INFINITY,
            min_height: 0.0,
            max_height: f32::INFINITY,
        }
    }
}

/// Size in logical pixels
#[derive(Debug, Clone, Copy, Default)]
pub struct Size {
    pub width: f32,
    pub height: f32,
}

impl Size {
    pub fn new(width: f32, height: f32) -> Self {
        Size { width, height }
    }

    pub fn zero() -> Self {
        Size::default()
    }
}

/// Point in logical pixels
#[derive(Debug, Clone, Copy, Default)]
pub struct Point {
    pub x: f32,
    pub y: f32,
}

impl Point {
    pub fn new(x: f32, y: f32) -> Self {
        Point { x, y }
    }

    pub fn zero() -> Self {
        Point::default()
    }
}

/// Rectangle in logical pixels
#[derive(Debug, Clone, Copy, Default)]
pub struct Rect {
    pub origin: Point,
    pub size: Size,
}

impl Rect {
    pub fn new(x: f32, y: f32, width: f32, height: f32) -> Self {
        Rect {
            origin: Point::new(x, y),
            size: Size::new(width, height),
        }
    }

    pub fn from_origin_size(origin: Point, size: Size) -> Self {
        Rect { origin, size }
    }
}

/// Color representation
#[derive(Debug, Clone, Copy)]
pub struct Color {
    pub r: f32,
    pub g: f32,
    pub b: f32,
    pub a: f32,
}

impl Color {
    pub const fn rgba(r: f32, g: f32, b: f32, a: f32) -> Self {
        Color { r, g, b, a }
    }

    pub const fn rgb(r: f32, g: f32, b: f32) -> Self {
        Color { r, g, b, a: 1.0 }
    }

    pub fn from_hex(hex: u32) -> Self {
        let r = ((hex >> 16) & 0xFF) as f32 / 255.0;
        let g = ((hex >> 8) & 0xFF) as f32 / 255.0;
        let b = (hex & 0xFF) as f32 / 255.0;
        Color::rgb(r, g, b)
    }

    // Common colors
    pub const WHITE: Color = Color::rgb(1.0, 1.0, 1.0);
    pub const BLACK: Color = Color::rgb(0.0, 0.0, 0.0);
    pub const RED: Color = Color::rgb(1.0, 0.0, 0.0);
    pub const GREEN: Color = Color::rgb(0.0, 1.0, 0.0);
    pub const BLUE: Color = Color::rgb(0.0, 0.0, 1.0);
    pub const TRANSPARENT: Color = Color::rgba(0.0, 0.0, 0.0, 0.0);
}

/// Edge insets
#[derive(Debug, Clone, Copy, Default)]
pub struct EdgeInsets {
    pub top: f32,
    pub right: f32,
    pub bottom: f32,
    pub left: f32,
}

impl EdgeInsets {
    pub fn all(value: f32) -> Self {
        EdgeInsets {
            top: value,
            right: value,
            bottom: value,
            left: value,
        }
    }

    pub fn horizontal(value: f32) -> Self {
        EdgeInsets {
            top: 0.0,
            right: value,
            bottom: 0.0,
            left: value,
        }
    }

    pub fn vertical(value: f32) -> Self {
        EdgeInsets {
            top: value,
            right: 0.0,
            bottom: value,
            left: 0.0,
        }
    }

    pub fn symmetric(horizontal: f32, vertical: f32) -> Self {
        EdgeInsets {
            top: vertical,
            right: horizontal,
            bottom: vertical,
            left: horizontal,
        }
    }
}

/// Font weight
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FontWeight {
    Thin,
    ExtraLight,
    Light,
    Regular,
    Medium,
    SemiBold,
    Bold,
    ExtraBold,
    Black,
}

impl Default for FontWeight {
    fn default() -> Self {
        FontWeight::Regular
    }
}

/// Text alignment
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum TextAlign {
    #[default]
    Left,
    Center,
    Right,
    Justify,
}

/// Keyboard type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum KeyboardType {
    #[default]
    Default,
    Numeric,
    Email,
    Phone,
    Url,
    NumberPad,
    DecimalPad,
    Password,
}

/// Safe area
#[derive(Debug, Clone, Copy, Default)]
pub struct SafeArea {
    pub top: f32,
    pub right: f32,
    pub bottom: f32,
    pub left: f32,
}

/// Device orientation
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Orientation {
    Portrait,
    PortraitUpsideDown,
    LandscapeLeft,
    LandscapeRight,
}

/// App lifecycle state
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AppState {
    /// App is in the foreground and receiving events
    Active,
    /// App is visible but not receiving events (iOS only)
    Inactive,
    /// App is in the background
    Background,
    /// App is being suspended
    Suspended,
}

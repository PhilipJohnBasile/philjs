//! PhilJS Mobile Runtime
//!
//! Core runtime for mobile applications, handling the app lifecycle,
//! event loop, and platform integration.

use crate::{IntoView, NativeView, RenderContext, SafeArea, Orientation, AppState};
use std::sync::{Arc, Mutex};

/// Mobile application configuration
#[derive(Debug, Clone)]
pub struct MobileConfig {
    /// Application name (displayed in task switcher)
    pub name: String,
    /// Bundle identifier (e.g., "com.example.myapp")
    pub bundle_id: String,
    /// Initial orientation
    pub orientation: OrientationConfig,
    /// Status bar style
    pub status_bar: StatusBarConfig,
    /// Whether to use edge-to-edge display
    pub edge_to_edge: bool,
    /// Background color
    pub background_color: crate::Color,
    /// Enable debug features
    pub debug: bool,
}

impl Default for MobileConfig {
    fn default() -> Self {
        MobileConfig {
            name: "PhilJS App".to_string(),
            bundle_id: "com.philjs.app".to_string(),
            orientation: OrientationConfig::default(),
            status_bar: StatusBarConfig::default(),
            edge_to_edge: true,
            background_color: crate::Color::WHITE,
            debug: cfg!(debug_assertions),
        }
    }
}

/// Orientation configuration
#[derive(Debug, Clone, Default)]
pub struct OrientationConfig {
    pub portrait: bool,
    pub portrait_upside_down: bool,
    pub landscape_left: bool,
    pub landscape_right: bool,
}

impl OrientationConfig {
    pub fn portrait_only() -> Self {
        OrientationConfig {
            portrait: true,
            portrait_upside_down: false,
            landscape_left: false,
            landscape_right: false,
        }
    }

    pub fn landscape_only() -> Self {
        OrientationConfig {
            portrait: false,
            portrait_upside_down: false,
            landscape_left: true,
            landscape_right: true,
        }
    }

    pub fn all() -> Self {
        OrientationConfig {
            portrait: true,
            portrait_upside_down: true,
            landscape_left: true,
            landscape_right: true,
        }
    }
}

/// Status bar configuration
#[derive(Debug, Clone)]
pub struct StatusBarConfig {
    pub style: StatusBarStyle,
    pub hidden: bool,
}

impl Default for StatusBarConfig {
    fn default() -> Self {
        StatusBarConfig {
            style: StatusBarStyle::Default,
            hidden: false,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StatusBarStyle {
    Default,
    Light,
    Dark,
}

/// Mobile application handle
pub struct MobileApp {
    config: MobileConfig,
    state: Arc<Mutex<AppStateInternal>>,
    lifecycle_handlers: LifecycleHandlers,
}

struct AppStateInternal {
    current_state: AppState,
    orientation: Orientation,
    safe_area: SafeArea,
    root_view: Option<NativeView>,
}

struct LifecycleHandlers {
    on_start: Option<Box<dyn Fn() + Send + Sync>>,
    on_resume: Option<Box<dyn Fn() + Send + Sync>>,
    on_pause: Option<Box<dyn Fn() + Send + Sync>>,
    on_stop: Option<Box<dyn Fn() + Send + Sync>>,
    on_memory_warning: Option<Box<dyn Fn() + Send + Sync>>,
    on_orientation_change: Option<Box<dyn Fn(Orientation) + Send + Sync>>,
}

impl Default for LifecycleHandlers {
    fn default() -> Self {
        LifecycleHandlers {
            on_start: None,
            on_resume: None,
            on_pause: None,
            on_stop: None,
            on_memory_warning: None,
            on_orientation_change: None,
        }
    }
}

impl MobileApp {
    pub fn new(config: MobileConfig) -> Self {
        MobileApp {
            config,
            state: Arc::new(Mutex::new(AppStateInternal {
                current_state: AppState::Active,
                orientation: Orientation::Portrait,
                safe_area: SafeArea::default(),
                root_view: None,
            })),
            lifecycle_handlers: LifecycleHandlers::default(),
        }
    }

    /// Set the root view
    pub fn set_root<V: IntoView>(&mut self, view: V) {
        let native_view = view.into_view();
        // Store the view for rendering
        if let Ok(mut state) = self.state.lock() {
            // state.root_view = Some(native_view);
        }
    }

    /// Get current app state
    pub fn current_state(&self) -> AppState {
        self.state.lock().map(|s| s.current_state).unwrap_or(AppState::Active)
    }

    /// Get current orientation
    pub fn orientation(&self) -> Orientation {
        self.state.lock().map(|s| s.orientation).unwrap_or(Orientation::Portrait)
    }

    /// Get safe area insets
    pub fn safe_area(&self) -> SafeArea {
        self.state.lock().map(|s| s.safe_area).unwrap_or_default()
    }

    /// Register lifecycle callback
    pub fn on_start<F: Fn() + Send + Sync + 'static>(&mut self, f: F) {
        self.lifecycle_handlers.on_start = Some(Box::new(f));
    }

    pub fn on_resume<F: Fn() + Send + Sync + 'static>(&mut self, f: F) {
        self.lifecycle_handlers.on_resume = Some(Box::new(f));
    }

    pub fn on_pause<F: Fn() + Send + Sync + 'static>(&mut self, f: F) {
        self.lifecycle_handlers.on_pause = Some(Box::new(f));
    }

    pub fn on_stop<F: Fn() + Send + Sync + 'static>(&mut self, f: F) {
        self.lifecycle_handlers.on_stop = Some(Box::new(f));
    }

    pub fn on_memory_warning<F: Fn() + Send + Sync + 'static>(&mut self, f: F) {
        self.lifecycle_handlers.on_memory_warning = Some(Box::new(f));
    }

    pub fn on_orientation_change<F: Fn(Orientation) + Send + Sync + 'static>(&mut self, f: F) {
        self.lifecycle_handlers.on_orientation_change = Some(Box::new(f));
    }
}

/// Start the mobile application
pub fn start_app<F, V>(app: F, config: MobileConfig)
where
    F: Fn() -> V + 'static,
    V: IntoView,
{
    #[cfg(target_os = "ios")]
    {
        crate::ios::run_ios_app(app, config);
    }

    #[cfg(target_os = "android")]
    {
        crate::android::run_android_app(app, config);
    }

    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        // Desktop fallback for development
        eprintln!("PhilJS Mobile: Running in desktop simulation mode");
        run_desktop_simulation(app, config);
    }
}

#[cfg(not(any(target_os = "ios", target_os = "android")))]
fn run_desktop_simulation<F, V>(app: F, config: MobileConfig)
where
    F: Fn() -> V + 'static,
    V: IntoView,
{
    // Simple simulation for development
    println!("Starting {} in simulation mode", config.name);
    let _root = app();
    // In real implementation, this would create a window simulating a mobile device
}

/// Signal for reactive state
pub struct Signal<T> {
    value: Arc<Mutex<T>>,
    subscribers: Arc<Mutex<Vec<Box<dyn Fn(&T) + Send + Sync>>>>,
}

impl<T: Clone> Signal<T> {
    pub fn new(initial: T) -> Self {
        Signal {
            value: Arc::new(Mutex::new(initial)),
            subscribers: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub fn get(&self) -> T {
        self.value.lock().unwrap().clone()
    }

    pub fn set(&self, value: T) {
        *self.value.lock().unwrap() = value.clone();
        self.notify(&value);
    }

    pub fn update<F: FnOnce(&mut T)>(&self, f: F) {
        let mut guard = self.value.lock().unwrap();
        f(&mut *guard);
        let value = guard.clone();
        drop(guard);
        self.notify(&value);
    }

    fn notify(&self, value: &T) {
        if let Ok(subs) = self.subscribers.lock() {
            for sub in subs.iter() {
                sub(value);
            }
        }
    }

    pub fn subscribe<F: Fn(&T) + Send + Sync + 'static>(&self, f: F) {
        if let Ok(mut subs) = self.subscribers.lock() {
            subs.push(Box::new(f));
        }
    }
}

impl<T: Clone> Clone for Signal<T> {
    fn clone(&self) -> Self {
        Signal {
            value: Arc::clone(&self.value),
            subscribers: Arc::clone(&self.subscribers),
        }
    }
}

/// Create a new signal
pub fn create_signal<T: Clone>(initial: T) -> Signal<T> {
    Signal::new(initial)
}

/// Effect that runs when dependencies change
pub fn create_effect<F: Fn() + Send + Sync + 'static>(f: F) {
    // In real implementation, this would track dependencies
    f();
}

/// Memo/computed value
pub fn create_memo<T: Clone + 'static, F: Fn() -> T + Send + Sync + 'static>(f: F) -> Signal<T> {
    let initial = f();
    Signal::new(initial)
}

/// Run code on the main thread
pub fn run_on_main_thread<F: FnOnce() + Send + 'static>(f: F) {
    #[cfg(target_os = "ios")]
    {
        crate::ios::dispatch_main(f);
    }

    #[cfg(target_os = "android")]
    {
        crate::android::run_on_ui_thread(f);
    }

    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        f();
    }
}

/// Schedule work on a background thread
pub fn spawn<F: FnOnce() + Send + 'static>(f: F) {
    std::thread::spawn(f);
}

/// Schedule async work
pub fn spawn_async<F>(future: F)
where
    F: std::future::Future<Output = ()> + Send + 'static,
{
    // In real implementation, would use the platform's async runtime
    std::thread::spawn(move || {
        futures::executor::block_on(future);
    });
}

//! PhilJS Mobile Android Platform
//!
//! Android-specific implementations using JNI.

#![cfg(target_os = "android")]

use crate::{
    IntoView, MobileConfig, NativeView, RenderContext, Color, Rect, Size, Point,
    renderer::{PlatformRenderer, TextStyle, ButtonConfig, TextInputConfig, ScrollConfig, ContainerStyle, ImageSource},
};
use std::sync::Arc;

// ============================================================================
// Android Application Entry Point
// ============================================================================

/// Run the Android application
pub fn run_android_app<F, V>(app: F, config: MobileConfig)
where
    F: Fn() -> V + 'static,
    V: IntoView,
{
    // Would initialize Android app via JNI
    // This integrates with the Android Activity lifecycle

    // The actual implementation would:
    // 1. Get JNIEnv from ndk-glue
    // 2. Create the main Activity
    // 3. Set up the view hierarchy
    // 4. Start the message loop

    let _ = (app, config);
}

/// Run code on the UI thread
pub fn run_on_ui_thread<F: FnOnce() + Send + 'static>(f: F) {
    // Would use Activity.runOnUiThread or Handler.post
    f();
}

// ============================================================================
// Android Native Renderer
// ============================================================================

/// Android-specific renderer using Android Views
#[derive(Clone)]
pub struct AndroidRenderer {
    density: f32,
    dark_mode: bool,
}

impl AndroidRenderer {
    pub fn new() -> Self {
        AndroidRenderer {
            density: 2.75,  // Common density for modern Android phones
            dark_mode: false,
        }
    }
}

impl Default for AndroidRenderer {
    fn default() -> Self {
        Self::new()
    }
}

impl PlatformRenderer for AndroidRenderer {
    fn create_text(&self, text: &str, style: TextStyle) -> NativeView {
        // Would create TextView via JNI
        // val textView = TextView(context)
        // textView.text = text
        // textView.textSize = style.font_size
        // textView.setTextColor(Color.argb(...))

        NativeView {
            handle: Arc::new(format!("TextView: {}", text)),
            children: Vec::new(),
        }
    }

    fn create_image(&self, source: ImageSource) -> NativeView {
        // Would create ImageView via JNI
        // val imageView = ImageView(context)
        // when (source) {
        //     is Asset -> imageView.setImageResource(R.drawable.name)
        //     is Url -> Glide.with(context).load(url).into(imageView)
        //     ...
        // }

        NativeView {
            handle: Arc::new(format!("ImageView: {:?}", source)),
            children: Vec::new(),
        }
    }

    fn create_button(&self, config: ButtonConfig) -> NativeView {
        // Would create Button or MaterialButton via JNI
        // val button = MaterialButton(context)
        // button.text = config.title
        // button.setBackgroundColor(Color.argb(...))

        NativeView {
            handle: Arc::new(format!("Button: {:?}", config.title)),
            children: Vec::new(),
        }
    }

    fn create_text_input(&self, config: TextInputConfig) -> NativeView {
        // Would create TextInputEditText via JNI
        // val editText = TextInputEditText(context)
        // editText.hint = config.placeholder
        // editText.inputType = if (config.secure) InputType.TYPE_TEXT_VARIATION_PASSWORD else InputType.TYPE_CLASS_TEXT

        NativeView {
            handle: Arc::new(format!("EditText: {:?}", config.placeholder)),
            children: Vec::new(),
        }
    }

    fn create_scroll_view(&self, config: ScrollConfig) -> NativeView {
        // Would create ScrollView or NestedScrollView via JNI
        // val scrollView = NestedScrollView(context)
        // scrollView.isVerticalScrollBarEnabled = config.show_indicators

        NativeView {
            handle: Arc::new("ScrollView"),
            children: Vec::new(),
        }
    }

    fn create_container(&self, style: ContainerStyle) -> NativeView {
        // Would create FrameLayout or ConstraintLayout via JNI
        // val layout = FrameLayout(context)
        // layout.setBackgroundColor(Color.argb(...))
        // (layout.background as? GradientDrawable)?.cornerRadius = style.corner_radius * density

        NativeView {
            handle: Arc::new("FrameLayout"),
            children: Vec::new(),
        }
    }

    fn add_child(&self, parent: &NativeView, child: NativeView) {
        // Would call parent.addView(child)
        let _ = (parent, child);
    }

    fn remove_child(&self, parent: &NativeView, child: &NativeView) {
        // Would call parent.removeView(child)
        let _ = (parent, child);
    }

    fn set_frame(&self, view: &NativeView, frame: Rect) {
        // Would set LayoutParams
        // val params = view.layoutParams
        // params.width = (frame.size.width * density).toInt()
        // params.height = (frame.size.height * density).toInt()
        // view.x = frame.origin.x * density
        // view.y = frame.origin.y * density
        let _ = (view, frame);
    }

    fn measure_text(&self, text: &str, style: &TextStyle, max_width: f32) -> Size {
        // Would use Paint.measureText or StaticLayout
        // val paint = TextPaint()
        // paint.textSize = style.font_size * density
        // val width = paint.measureText(text)

        // Placeholder estimation
        let char_width = style.font_size * 0.5;
        let line_height = style.line_height.unwrap_or(style.font_size * 1.4);
        let text_width = text.len() as f32 * char_width;

        if text_width <= max_width {
            Size::new(text_width, line_height)
        } else {
            let lines = (text_width / max_width).ceil();
            Size::new(max_width, lines * line_height)
        }
    }

    fn scale_factor(&self) -> f32 {
        self.density
    }

    fn is_dark_mode(&self) -> bool {
        self.dark_mode
    }

    fn clone_box(&self) -> Box<dyn PlatformRenderer> {
        Box::new(self.clone())
    }
}

// ============================================================================
// Android-Specific APIs
// ============================================================================

/// Android SDK version
pub fn get_sdk_version() -> u32 {
    // Would use Build.VERSION.SDK_INT
    34 // Android 14
}

/// Android version name
pub fn get_version_name() -> String {
    // Would use Build.VERSION.RELEASE
    "14".to_string()
}

/// Device manufacturer
pub fn get_manufacturer() -> String {
    // Would use Build.MANUFACTURER
    "Google".to_string()
}

/// Device model
pub fn get_model() -> String {
    // Would use Build.MODEL
    "Pixel 8".to_string()
}

/// Package name
pub fn get_package_name() -> String {
    // Would use context.packageName
    "com.philjs.app".to_string()
}

// ============================================================================
// Android Navigation Bar
// ============================================================================

/// Navigation bar mode
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NavigationBarMode {
    ThreeButton,
    TwoButton,
    Gesture,
}

pub fn get_navigation_bar_mode() -> NavigationBarMode {
    // Would check system settings
    NavigationBarMode::Gesture
}

/// Set navigation bar color
pub fn set_navigation_bar_color(color: Color) {
    // Would use window.navigationBarColor
    let _ = color;
}

/// Set navigation bar light icons
pub fn set_light_navigation_bar(light: bool) {
    // Would use WindowInsetsController.setAppearanceLightNavigationBars
    let _ = light;
}

// ============================================================================
// Android Status Bar
// ============================================================================

/// Set status bar color
pub fn set_status_bar_color(color: Color) {
    // Would use window.statusBarColor
    let _ = color;
}

/// Set status bar light icons
pub fn set_light_status_bar(light: bool) {
    // Would use WindowInsetsController.setAppearanceLightStatusBars
    let _ = light;
}

/// Set fullscreen/immersive mode
pub fn set_fullscreen(fullscreen: bool) {
    // Would use WindowInsetsController.hide/show
    let _ = fullscreen;
}

// ============================================================================
// Android Display
// ============================================================================

/// Get display metrics
pub fn get_display_metrics() -> DisplayMetrics {
    // Would use Resources.getSystem().displayMetrics
    DisplayMetrics {
        width_pixels: 1080,
        height_pixels: 2400,
        density: 2.75,
        density_dpi: 440,
        scaled_density: 2.75,
        xdpi: 411.0,
        ydpi: 411.0,
    }
}

#[derive(Debug, Clone)]
pub struct DisplayMetrics {
    pub width_pixels: u32,
    pub height_pixels: u32,
    pub density: f32,
    pub density_dpi: u32,
    pub scaled_density: f32,
    pub xdpi: f32,
    pub ydpi: f32,
}

/// Get window insets (status bar, navigation bar, etc.)
pub fn get_window_insets() -> WindowInsets {
    // Would use WindowInsetsCompat
    WindowInsets {
        status_bar_height: 24,
        navigation_bar_height: 48,
        keyboard_height: 0,
        ime_visible: false,
    }
}

#[derive(Debug, Clone)]
pub struct WindowInsets {
    pub status_bar_height: u32,
    pub navigation_bar_height: u32,
    pub keyboard_height: u32,
    pub ime_visible: bool,
}

// ============================================================================
// Android Night Mode
// ============================================================================

/// Current night mode setting
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NightMode {
    No,
    Yes,
    FollowSystem,
}

pub fn get_night_mode() -> NightMode {
    // Would use Configuration.uiMode
    NightMode::No
}

pub fn set_night_mode(mode: NightMode) {
    // Would use AppCompatDelegate.setDefaultNightMode
    let _ = mode;
}

// ============================================================================
// Android Intents
// ============================================================================

/// Start an activity with intent
pub fn start_activity(intent: Intent) -> Result<(), AndroidError> {
    // Would create and start Intent
    let _ = intent;
    Ok(())
}

/// Intent builder
#[derive(Debug, Clone)]
pub struct Intent {
    pub action: String,
    pub data: Option<String>,
    pub extras: std::collections::HashMap<String, String>,
    pub package: Option<String>,
    pub class: Option<String>,
}

impl Intent {
    pub fn new(action: impl Into<String>) -> Self {
        Intent {
            action: action.into(),
            data: None,
            extras: std::collections::HashMap::new(),
            package: None,
            class: None,
        }
    }

    pub fn view(uri: impl Into<String>) -> Self {
        Intent::new("android.intent.action.VIEW").data(uri)
    }

    pub fn send(text: impl Into<String>) -> Self {
        Intent::new("android.intent.action.SEND")
            .extra("android.intent.extra.TEXT", text)
    }

    pub fn data(mut self, uri: impl Into<String>) -> Self {
        self.data = Some(uri.into());
        self
    }

    pub fn extra(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.extras.insert(key.into(), value.into());
        self
    }

    pub fn package(mut self, package: impl Into<String>) -> Self {
        self.package = Some(package.into());
        self
    }
}

// ============================================================================
// Android Toast
// ============================================================================

/// Show a toast message
pub fn show_toast(message: &str, long: bool) {
    // Would use Toast.makeText(...).show()
    let _ = (message, long);
}

// ============================================================================
// Android Snackbar
// ============================================================================

/// Show a snackbar
pub fn show_snackbar(config: SnackbarConfig) {
    // Would use Snackbar.make(...).show()
    let _ = config;
}

#[derive(Debug, Clone)]
pub struct SnackbarConfig {
    pub message: String,
    pub duration: SnackbarDuration,
    pub action_text: Option<String>,
    pub action_callback: Option<Arc<dyn Fn() + Send + Sync>>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SnackbarDuration {
    Short,
    Long,
    Indefinite,
}

// ============================================================================
// Android Keep Screen On
// ============================================================================

/// Keep screen on
pub fn set_keep_screen_on(keep_on: bool) {
    // Would use FLAG_KEEP_SCREEN_ON
    let _ = keep_on;
}

// ============================================================================
// Android Errors
// ============================================================================

#[derive(Debug, Clone)]
pub enum AndroidError {
    ActivityNotFound,
    PermissionDenied,
    JniError(String),
    Unknown(String),
}

impl std::fmt::Display for AndroidError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AndroidError::ActivityNotFound => write!(f, "Activity not found"),
            AndroidError::PermissionDenied => write!(f, "Permission denied"),
            AndroidError::JniError(e) => write!(f, "JNI error: {}", e),
            AndroidError::Unknown(e) => write!(f, "Unknown error: {}", e),
        }
    }
}

impl std::error::Error for AndroidError {}

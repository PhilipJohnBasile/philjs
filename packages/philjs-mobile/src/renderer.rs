//! PhilJS Mobile Renderer
//!
//! Platform-agnostic rendering abstraction for iOS and Android.

use crate::{
    Color, Constraints, EdgeInsets, FontWeight, NativeView, Point, Rect, Size, TextAlign,
};
use std::any::Any;
use std::sync::Arc;

/// Render context passed to components during rendering
pub struct RenderContext {
    /// Current constraints
    pub constraints: Constraints,
    /// Parent frame
    pub parent_frame: Rect,
    /// Scale factor (1.0 for standard, 2.0 for retina, 3.0 for 3x)
    pub scale_factor: f32,
    /// Whether dark mode is active
    pub dark_mode: bool,
    /// Platform-specific renderer
    renderer: Box<dyn PlatformRenderer>,
}

impl RenderContext {
    pub fn new(renderer: Box<dyn PlatformRenderer>) -> Self {
        RenderContext {
            constraints: Constraints::unbounded(),
            parent_frame: Rect::default(),
            scale_factor: renderer.scale_factor(),
            dark_mode: renderer.is_dark_mode(),
            renderer,
        }
    }

    /// Create a child context with new constraints
    pub fn with_constraints(&self, constraints: Constraints) -> RenderContext {
        RenderContext {
            constraints,
            parent_frame: self.parent_frame,
            scale_factor: self.scale_factor,
            dark_mode: self.dark_mode,
            renderer: self.renderer.clone_box(),
        }
    }

    /// Create a text view
    pub fn create_text(&mut self, text: &str, style: TextStyle) -> NativeView {
        self.renderer.create_text(text, style)
    }

    /// Create an image view
    pub fn create_image(&mut self, source: ImageSource) -> NativeView {
        self.renderer.create_image(source)
    }

    /// Create a button
    pub fn create_button(&mut self, config: ButtonConfig) -> NativeView {
        self.renderer.create_button(config)
    }

    /// Create a text input
    pub fn create_text_input(&mut self, config: TextInputConfig) -> NativeView {
        self.renderer.create_text_input(config)
    }

    /// Create a scroll view
    pub fn create_scroll_view(&mut self, config: ScrollConfig) -> NativeView {
        self.renderer.create_scroll_view(config)
    }

    /// Create a container view
    pub fn create_container(&mut self, style: ContainerStyle) -> NativeView {
        self.renderer.create_container(style)
    }

    /// Add a child to a parent view
    pub fn add_child(&mut self, parent: &NativeView, child: NativeView) {
        self.renderer.add_child(parent, child)
    }

    /// Remove a child from a parent view
    pub fn remove_child(&mut self, parent: &NativeView, child: &NativeView) {
        self.renderer.remove_child(parent, child)
    }

    /// Update a view's frame
    pub fn set_frame(&mut self, view: &NativeView, frame: Rect) {
        self.renderer.set_frame(view, frame)
    }

    /// Measure text size
    pub fn measure_text(&self, text: &str, style: &TextStyle, max_width: f32) -> Size {
        self.renderer.measure_text(text, style, max_width)
    }
}

/// Platform-specific renderer trait
pub trait PlatformRenderer: Send + Sync {
    fn create_text(&self, text: &str, style: TextStyle) -> NativeView;
    fn create_image(&self, source: ImageSource) -> NativeView;
    fn create_button(&self, config: ButtonConfig) -> NativeView;
    fn create_text_input(&self, config: TextInputConfig) -> NativeView;
    fn create_scroll_view(&self, config: ScrollConfig) -> NativeView;
    fn create_container(&self, style: ContainerStyle) -> NativeView;
    fn add_child(&self, parent: &NativeView, child: NativeView);
    fn remove_child(&self, parent: &NativeView, child: &NativeView);
    fn set_frame(&self, view: &NativeView, frame: Rect);
    fn measure_text(&self, text: &str, style: &TextStyle, max_width: f32) -> Size;
    fn scale_factor(&self) -> f32;
    fn is_dark_mode(&self) -> bool;
    fn clone_box(&self) -> Box<dyn PlatformRenderer>;
}

/// Native renderer for the current platform
pub struct NativeRenderer {
    #[cfg(target_os = "ios")]
    inner: crate::ios::IOSRenderer,
    #[cfg(target_os = "android")]
    inner: crate::android::AndroidRenderer,
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    inner: SimulationRenderer,
}

impl NativeRenderer {
    pub fn new() -> Self {
        NativeRenderer {
            #[cfg(target_os = "ios")]
            inner: crate::ios::IOSRenderer::new(),
            #[cfg(target_os = "android")]
            inner: crate::android::AndroidRenderer::new(),
            #[cfg(not(any(target_os = "ios", target_os = "android")))]
            inner: SimulationRenderer::new(),
        }
    }

    pub fn create_context(&self) -> RenderContext {
        #[cfg(target_os = "ios")]
        {
            RenderContext::new(Box::new(self.inner.clone()))
        }
        #[cfg(target_os = "android")]
        {
            RenderContext::new(Box::new(self.inner.clone()))
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            RenderContext::new(Box::new(self.inner.clone()))
        }
    }
}

impl Default for NativeRenderer {
    fn default() -> Self {
        Self::new()
    }
}

/// Text styling
#[derive(Debug, Clone)]
pub struct TextStyle {
    pub font_size: f32,
    pub font_weight: FontWeight,
    pub color: Color,
    pub alignment: TextAlign,
    pub line_height: Option<f32>,
    pub letter_spacing: Option<f32>,
    pub font_family: Option<String>,
    pub italic: bool,
    pub underline: bool,
    pub strikethrough: bool,
}

impl Default for TextStyle {
    fn default() -> Self {
        TextStyle {
            font_size: 17.0, // iOS default
            font_weight: FontWeight::Regular,
            color: Color::BLACK,
            alignment: TextAlign::Left,
            line_height: None,
            letter_spacing: None,
            font_family: None,
            italic: false,
            underline: false,
            strikethrough: false,
        }
    }
}

/// Image source
#[derive(Debug, Clone)]
pub enum ImageSource {
    /// Asset bundled with the app
    Asset(String),
    /// URL to load from network
    Url(String),
    /// Base64 encoded data
    Base64(String),
    /// Raw bytes
    Bytes(Vec<u8>),
    /// System symbol (SF Symbols on iOS, Material Icons on Android)
    Symbol(String),
}

/// Button configuration
#[derive(Debug, Clone)]
pub struct ButtonConfig {
    pub title: Option<String>,
    pub image: Option<ImageSource>,
    pub style: ButtonStyle,
    pub on_press: Option<Arc<dyn Fn() + Send + Sync>>,
    pub enabled: bool,
}

impl Default for ButtonConfig {
    fn default() -> Self {
        ButtonConfig {
            title: None,
            image: None,
            style: ButtonStyle::default(),
            on_press: None,
            enabled: true,
        }
    }
}

#[derive(Debug, Clone)]
pub struct ButtonStyle {
    pub background_color: Color,
    pub text_color: Color,
    pub font_size: f32,
    pub font_weight: FontWeight,
    pub corner_radius: f32,
    pub padding: EdgeInsets,
    pub border_width: f32,
    pub border_color: Color,
}

impl Default for ButtonStyle {
    fn default() -> Self {
        ButtonStyle {
            background_color: Color::from_hex(0x007AFF), // iOS blue
            text_color: Color::WHITE,
            font_size: 17.0,
            font_weight: FontWeight::SemiBold,
            corner_radius: 8.0,
            padding: EdgeInsets::symmetric(16.0, 12.0),
            border_width: 0.0,
            border_color: Color::TRANSPARENT,
        }
    }
}

/// Text input configuration
#[derive(Debug, Clone)]
pub struct TextInputConfig {
    pub placeholder: Option<String>,
    pub value: String,
    pub keyboard_type: crate::KeyboardType,
    pub secure: bool,
    pub auto_capitalize: AutoCapitalize,
    pub auto_correct: bool,
    pub style: TextInputStyle,
    pub on_change: Option<Arc<dyn Fn(String) + Send + Sync>>,
    pub on_submit: Option<Arc<dyn Fn(String) + Send + Sync>>,
}

impl Default for TextInputConfig {
    fn default() -> Self {
        TextInputConfig {
            placeholder: None,
            value: String::new(),
            keyboard_type: crate::KeyboardType::Default,
            secure: false,
            auto_capitalize: AutoCapitalize::Sentences,
            auto_correct: true,
            style: TextInputStyle::default(),
            on_change: None,
            on_submit: None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum AutoCapitalize {
    None,
    Words,
    #[default]
    Sentences,
    AllCharacters,
}

#[derive(Debug, Clone)]
pub struct TextInputStyle {
    pub font_size: f32,
    pub text_color: Color,
    pub placeholder_color: Color,
    pub background_color: Color,
    pub corner_radius: f32,
    pub padding: EdgeInsets,
    pub border_width: f32,
    pub border_color: Color,
}

impl Default for TextInputStyle {
    fn default() -> Self {
        TextInputStyle {
            font_size: 17.0,
            text_color: Color::BLACK,
            placeholder_color: Color::rgba(0.6, 0.6, 0.6, 1.0),
            background_color: Color::WHITE,
            corner_radius: 8.0,
            padding: EdgeInsets::symmetric(12.0, 10.0),
            border_width: 1.0,
            border_color: Color::rgba(0.8, 0.8, 0.8, 1.0),
        }
    }
}

/// Scroll view configuration
#[derive(Debug, Clone)]
pub struct ScrollConfig {
    pub direction: ScrollDirection,
    pub show_indicators: bool,
    pub bounces: bool,
    pub paging: bool,
    pub content_inset: EdgeInsets,
}

impl Default for ScrollConfig {
    fn default() -> Self {
        ScrollConfig {
            direction: ScrollDirection::Vertical,
            show_indicators: true,
            bounces: true,
            paging: false,
            content_inset: EdgeInsets::default(),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum ScrollDirection {
    #[default]
    Vertical,
    Horizontal,
    Both,
}

/// Container styling
#[derive(Debug, Clone)]
pub struct ContainerStyle {
    pub background_color: Color,
    pub corner_radius: f32,
    pub border_width: f32,
    pub border_color: Color,
    pub shadow: Option<Shadow>,
    pub clip_to_bounds: bool,
}

impl Default for ContainerStyle {
    fn default() -> Self {
        ContainerStyle {
            background_color: Color::TRANSPARENT,
            corner_radius: 0.0,
            border_width: 0.0,
            border_color: Color::TRANSPARENT,
            shadow: None,
            clip_to_bounds: false,
        }
    }
}

#[derive(Debug, Clone)]
pub struct Shadow {
    pub color: Color,
    pub offset: Point,
    pub radius: f32,
    pub opacity: f32,
}

impl Default for Shadow {
    fn default() -> Self {
        Shadow {
            color: Color::BLACK,
            offset: Point::new(0.0, 2.0),
            radius: 4.0,
            opacity: 0.25,
        }
    }
}

// Simulation renderer for desktop development
#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[derive(Clone)]
pub struct SimulationRenderer {
    scale: f32,
    dark_mode: bool,
}

#[cfg(not(any(target_os = "ios", target_os = "android")))]
impl SimulationRenderer {
    pub fn new() -> Self {
        SimulationRenderer {
            scale: 2.0,
            dark_mode: false,
        }
    }
}

#[cfg(not(any(target_os = "ios", target_os = "android")))]
impl PlatformRenderer for SimulationRenderer {
    fn create_text(&self, text: &str, _style: TextStyle) -> NativeView {
        NativeView {
            handle: Arc::new(format!("Text: {}", text)),
            children: Vec::new(),
        }
    }

    fn create_image(&self, source: ImageSource) -> NativeView {
        NativeView {
            handle: Arc::new(format!("Image: {:?}", source)),
            children: Vec::new(),
        }
    }

    fn create_button(&self, config: ButtonConfig) -> NativeView {
        NativeView {
            handle: Arc::new(format!("Button: {:?}", config.title)),
            children: Vec::new(),
        }
    }

    fn create_text_input(&self, config: TextInputConfig) -> NativeView {
        NativeView {
            handle: Arc::new(format!("TextInput: {:?}", config.placeholder)),
            children: Vec::new(),
        }
    }

    fn create_scroll_view(&self, _config: ScrollConfig) -> NativeView {
        NativeView {
            handle: Arc::new("ScrollView"),
            children: Vec::new(),
        }
    }

    fn create_container(&self, _style: ContainerStyle) -> NativeView {
        NativeView {
            handle: Arc::new("Container"),
            children: Vec::new(),
        }
    }

    fn add_child(&self, _parent: &NativeView, _child: NativeView) {}
    fn remove_child(&self, _parent: &NativeView, _child: &NativeView) {}
    fn set_frame(&self, _view: &NativeView, _frame: Rect) {}

    fn measure_text(&self, text: &str, style: &TextStyle, max_width: f32) -> Size {
        // Rough estimation for simulation
        let char_width = style.font_size * 0.5;
        let line_height = style.line_height.unwrap_or(style.font_size * 1.2);
        let text_width = text.len() as f32 * char_width;

        if text_width <= max_width {
            Size::new(text_width, line_height)
        } else {
            let lines = (text_width / max_width).ceil();
            Size::new(max_width, lines * line_height)
        }
    }

    fn scale_factor(&self) -> f32 {
        self.scale
    }

    fn is_dark_mode(&self) -> bool {
        self.dark_mode
    }

    fn clone_box(&self) -> Box<dyn PlatformRenderer> {
        Box::new(self.clone())
    }
}

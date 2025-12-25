//! PhilJS Mobile Components
//!
//! Core UI components for building mobile applications.

use crate::{
    Color, Constraints, EdgeInsets, FontWeight, IntoView, NativeComponent, NativeView,
    RenderContext, Size, TextAlign,
};
use std::sync::Arc;

// ============================================================================
// Text Components
// ============================================================================

/// Text display component
pub struct Text {
    pub content: String,
    pub font_size: f32,
    pub font_weight: FontWeight,
    pub color: Color,
    pub alignment: TextAlign,
    pub max_lines: Option<usize>,
}

impl Text {
    pub fn new(content: impl Into<String>) -> Self {
        Text {
            content: content.into(),
            font_size: 17.0,
            font_weight: FontWeight::Regular,
            color: Color::BLACK,
            alignment: TextAlign::Left,
            max_lines: None,
        }
    }

    pub fn font_size(mut self, size: f32) -> Self {
        self.font_size = size;
        self
    }

    pub fn font_weight(mut self, weight: FontWeight) -> Self {
        self.font_weight = weight;
        self
    }

    pub fn color(mut self, color: Color) -> Self {
        self.color = color;
        self
    }

    pub fn alignment(mut self, alignment: TextAlign) -> Self {
        self.alignment = alignment;
        self
    }

    pub fn max_lines(mut self, lines: usize) -> Self {
        self.max_lines = Some(lines);
        self
    }

    pub fn bold(mut self) -> Self {
        self.font_weight = FontWeight::Bold;
        self
    }

    // Semantic constructors
    pub fn title(content: impl Into<String>) -> Self {
        Text::new(content).font_size(28.0).font_weight(FontWeight::Bold)
    }

    pub fn headline(content: impl Into<String>) -> Self {
        Text::new(content).font_size(22.0).font_weight(FontWeight::SemiBold)
    }

    pub fn subheadline(content: impl Into<String>) -> Self {
        Text::new(content).font_size(15.0).color(Color::rgba(0.4, 0.4, 0.4, 1.0))
    }

    pub fn body(content: impl Into<String>) -> Self {
        Text::new(content).font_size(17.0)
    }

    pub fn caption(content: impl Into<String>) -> Self {
        Text::new(content).font_size(12.0).color(Color::rgba(0.5, 0.5, 0.5, 1.0))
    }
}

impl NativeComponent for Text {
    fn render(&self, ctx: &mut RenderContext) -> NativeView {
        ctx.create_text(
            &self.content,
            crate::renderer::TextStyle {
                font_size: self.font_size,
                font_weight: self.font_weight,
                color: self.color,
                alignment: self.alignment,
                ..Default::default()
            },
        )
    }

    fn update(&self, _ctx: &mut RenderContext) {}

    fn measure(&self, constraints: Constraints) -> Size {
        // Estimation - real implementation would use platform text measurement
        let char_width = self.font_size * 0.5;
        let line_height = self.font_size * 1.2;
        let text_width = self.content.len() as f32 * char_width;

        Size::new(
            text_width.min(constraints.max_width),
            line_height.max(constraints.min_height),
        )
    }
}

// ============================================================================
// Button Components
// ============================================================================

/// Interactive button component
pub struct Button<F = fn()> {
    pub title: Option<String>,
    pub on_press: Option<F>,
    pub style: ButtonStyle,
    pub enabled: bool,
}

#[derive(Debug, Clone)]
pub struct ButtonStyle {
    pub background: Color,
    pub text_color: Color,
    pub font_size: f32,
    pub font_weight: FontWeight,
    pub corner_radius: f32,
    pub padding: EdgeInsets,
}

impl Default for ButtonStyle {
    fn default() -> Self {
        ButtonStyle {
            background: Color::from_hex(0x007AFF),
            text_color: Color::WHITE,
            font_size: 17.0,
            font_weight: FontWeight::SemiBold,
            corner_radius: 10.0,
            padding: EdgeInsets::symmetric(20.0, 14.0),
        }
    }
}

impl<F> Button<F> {
    pub fn new(title: impl Into<String>) -> Self {
        Button {
            title: Some(title.into()),
            on_press: None,
            style: ButtonStyle::default(),
            enabled: true,
        }
    }

    pub fn on_press<F2>(self, handler: F2) -> Button<F2> {
        Button {
            title: self.title,
            on_press: Some(handler),
            style: self.style,
            enabled: self.enabled,
        }
    }

    pub fn style(mut self, style: ButtonStyle) -> Self {
        self.style = style;
        self
    }

    pub fn disabled(mut self, disabled: bool) -> Self {
        self.enabled = !disabled;
        self
    }

    // Style presets
    pub fn primary(title: impl Into<String>) -> Self {
        Button::new(title)
    }

    pub fn secondary(title: impl Into<String>) -> Self {
        let mut btn = Button::new(title);
        btn.style.background = Color::TRANSPARENT;
        btn.style.text_color = Color::from_hex(0x007AFF);
        btn
    }

    pub fn destructive(title: impl Into<String>) -> Self {
        let mut btn = Button::new(title);
        btn.style.background = Color::from_hex(0xFF3B30);
        btn
    }
}

// ============================================================================
// Image Component
// ============================================================================

/// Image display component
pub struct Image {
    pub source: ImageSource,
    pub content_mode: ContentMode,
    pub corner_radius: f32,
    pub placeholder: Option<Box<dyn NativeComponent>>,
}

#[derive(Debug, Clone)]
pub enum ImageSource {
    Asset(String),
    Url(String),
    Symbol(String),
    Data(Vec<u8>),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum ContentMode {
    #[default]
    ScaleToFill,
    ScaleAspectFit,
    ScaleAspectFill,
    Center,
    Top,
    Bottom,
    Left,
    Right,
}

impl Image {
    pub fn asset(name: impl Into<String>) -> Self {
        Image {
            source: ImageSource::Asset(name.into()),
            content_mode: ContentMode::ScaleAspectFit,
            corner_radius: 0.0,
            placeholder: None,
        }
    }

    pub fn url(url: impl Into<String>) -> Self {
        Image {
            source: ImageSource::Url(url.into()),
            content_mode: ContentMode::ScaleAspectFit,
            corner_radius: 0.0,
            placeholder: None,
        }
    }

    pub fn symbol(name: impl Into<String>) -> Self {
        Image {
            source: ImageSource::Symbol(name.into()),
            content_mode: ContentMode::ScaleAspectFit,
            corner_radius: 0.0,
            placeholder: None,
        }
    }

    pub fn content_mode(mut self, mode: ContentMode) -> Self {
        self.content_mode = mode;
        self
    }

    pub fn corner_radius(mut self, radius: f32) -> Self {
        self.corner_radius = radius;
        self
    }

    pub fn circular(mut self) -> Self {
        self.corner_radius = f32::MAX; // Will be clamped to half of min dimension
        self
    }
}

// ============================================================================
// Input Components
// ============================================================================

/// Text input field
pub struct TextInput<F = fn(String)> {
    pub value: String,
    pub placeholder: Option<String>,
    pub on_change: Option<F>,
    pub secure: bool,
    pub keyboard_type: crate::KeyboardType,
    pub auto_focus: bool,
}

impl<F> TextInput<F> {
    pub fn new() -> Self {
        TextInput {
            value: String::new(),
            placeholder: None,
            on_change: None,
            secure: false,
            keyboard_type: crate::KeyboardType::Default,
            auto_focus: false,
        }
    }

    pub fn value(mut self, value: impl Into<String>) -> Self {
        self.value = value.into();
        self
    }

    pub fn placeholder(mut self, placeholder: impl Into<String>) -> Self {
        self.placeholder = Some(placeholder.into());
        self
    }

    pub fn on_change<F2>(self, handler: F2) -> TextInput<F2> {
        TextInput {
            value: self.value,
            placeholder: self.placeholder,
            on_change: Some(handler),
            secure: self.secure,
            keyboard_type: self.keyboard_type,
            auto_focus: self.auto_focus,
        }
    }

    pub fn secure(mut self) -> Self {
        self.secure = true;
        self.keyboard_type = crate::KeyboardType::Password;
        self
    }

    pub fn keyboard(mut self, keyboard_type: crate::KeyboardType) -> Self {
        self.keyboard_type = keyboard_type;
        self
    }

    pub fn auto_focus(mut self) -> Self {
        self.auto_focus = true;
        self
    }
}

impl<F> Default for TextInput<F> {
    fn default() -> Self {
        Self::new()
    }
}

/// Toggle switch
pub struct Switch<F = fn(bool)> {
    pub value: bool,
    pub on_change: Option<F>,
    pub enabled: bool,
    pub on_tint: Color,
}

impl<F> Switch<F> {
    pub fn new(value: bool) -> Self {
        Switch {
            value,
            on_change: None,
            enabled: true,
            on_tint: Color::from_hex(0x34C759), // iOS green
        }
    }

    pub fn on_change<F2>(self, handler: F2) -> Switch<F2> {
        Switch {
            value: self.value,
            on_change: Some(handler),
            enabled: self.enabled,
            on_tint: self.on_tint,
        }
    }

    pub fn disabled(mut self, disabled: bool) -> Self {
        self.enabled = !disabled;
        self
    }

    pub fn tint(mut self, color: Color) -> Self {
        self.on_tint = color;
        self
    }
}

/// Slider for numeric values
pub struct Slider<F = fn(f32)> {
    pub value: f32,
    pub min: f32,
    pub max: f32,
    pub step: Option<f32>,
    pub on_change: Option<F>,
    pub enabled: bool,
}

impl<F> Slider<F> {
    pub fn new(value: f32) -> Self {
        Slider {
            value,
            min: 0.0,
            max: 1.0,
            step: None,
            on_change: None,
            enabled: true,
        }
    }

    pub fn range(mut self, min: f32, max: f32) -> Self {
        self.min = min;
        self.max = max;
        self
    }

    pub fn step(mut self, step: f32) -> Self {
        self.step = Some(step);
        self
    }

    pub fn on_change<F2>(self, handler: F2) -> Slider<F2> {
        Slider {
            value: self.value,
            min: self.min,
            max: self.max,
            step: self.step,
            on_change: Some(handler),
            enabled: self.enabled,
        }
    }
}

// ============================================================================
// Layout Components
// ============================================================================

/// Vertical stack layout
pub struct VStack {
    pub children: Vec<Box<dyn NativeComponent>>,
    pub spacing: f32,
    pub alignment: HAlignment,
    pub padding: EdgeInsets,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum HAlignment {
    Leading,
    #[default]
    Center,
    Trailing,
}

impl VStack {
    pub fn new() -> Self {
        VStack {
            children: Vec::new(),
            spacing: 8.0,
            alignment: HAlignment::Center,
            padding: EdgeInsets::default(),
        }
    }

    pub fn spacing(mut self, spacing: f32) -> Self {
        self.spacing = spacing;
        self
    }

    pub fn alignment(mut self, alignment: HAlignment) -> Self {
        self.alignment = alignment;
        self
    }

    pub fn padding(mut self, padding: EdgeInsets) -> Self {
        self.padding = padding;
        self
    }

    pub fn child(mut self, component: impl NativeComponent + 'static) -> Self {
        self.children.push(Box::new(component));
        self
    }
}

impl Default for VStack {
    fn default() -> Self {
        Self::new()
    }
}

/// Horizontal stack layout
pub struct HStack {
    pub children: Vec<Box<dyn NativeComponent>>,
    pub spacing: f32,
    pub alignment: VAlignment,
    pub padding: EdgeInsets,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum VAlignment {
    Top,
    #[default]
    Center,
    Bottom,
    FirstTextBaseline,
    LastTextBaseline,
}

impl HStack {
    pub fn new() -> Self {
        HStack {
            children: Vec::new(),
            spacing: 8.0,
            alignment: VAlignment::Center,
            padding: EdgeInsets::default(),
        }
    }

    pub fn spacing(mut self, spacing: f32) -> Self {
        self.spacing = spacing;
        self
    }

    pub fn alignment(mut self, alignment: VAlignment) -> Self {
        self.alignment = alignment;
        self
    }

    pub fn child(mut self, component: impl NativeComponent + 'static) -> Self {
        self.children.push(Box::new(component));
        self
    }
}

impl Default for HStack {
    fn default() -> Self {
        Self::new()
    }
}

/// Overlay stack (Z-axis)
pub struct ZStack {
    pub children: Vec<Box<dyn NativeComponent>>,
    pub alignment: Alignment,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum Alignment {
    TopLeading,
    Top,
    TopTrailing,
    Leading,
    #[default]
    Center,
    Trailing,
    BottomLeading,
    Bottom,
    BottomTrailing,
}

impl ZStack {
    pub fn new() -> Self {
        ZStack {
            children: Vec::new(),
            alignment: Alignment::Center,
        }
    }

    pub fn alignment(mut self, alignment: Alignment) -> Self {
        self.alignment = alignment;
        self
    }

    pub fn child(mut self, component: impl NativeComponent + 'static) -> Self {
        self.children.push(Box::new(component));
        self
    }
}

impl Default for ZStack {
    fn default() -> Self {
        Self::new()
    }
}

/// Scrollable content container
pub struct ScrollView {
    pub content: Option<Box<dyn NativeComponent>>,
    pub direction: ScrollDirection,
    pub show_indicators: bool,
    pub bounces: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum ScrollDirection {
    #[default]
    Vertical,
    Horizontal,
    Both,
}

impl ScrollView {
    pub fn vertical() -> Self {
        ScrollView {
            content: None,
            direction: ScrollDirection::Vertical,
            show_indicators: true,
            bounces: true,
        }
    }

    pub fn horizontal() -> Self {
        ScrollView {
            content: None,
            direction: ScrollDirection::Horizontal,
            show_indicators: true,
            bounces: true,
        }
    }

    pub fn content(mut self, component: impl NativeComponent + 'static) -> Self {
        self.content = Some(Box::new(component));
        self
    }

    pub fn show_indicators(mut self, show: bool) -> Self {
        self.show_indicators = show;
        self
    }

    pub fn bounces(mut self, bounces: bool) -> Self {
        self.bounces = bounces;
        self
    }
}

/// Optimized list for large datasets
pub struct ListView<T, F> {
    pub items: Vec<T>,
    pub row_builder: F,
    pub row_height: Option<f32>,
    pub separator: bool,
}

impl<T, F, V> ListView<T, F>
where
    F: Fn(&T, usize) -> V,
    V: NativeComponent,
{
    pub fn new(items: Vec<T>, row_builder: F) -> Self {
        ListView {
            items,
            row_builder,
            row_height: None,
            separator: true,
        }
    }

    pub fn row_height(mut self, height: f32) -> Self {
        self.row_height = Some(height);
        self
    }

    pub fn separator(mut self, show: bool) -> Self {
        self.separator = show;
        self
    }
}

// ============================================================================
// Utility Components
// ============================================================================

/// Flexible spacer that expands to fill available space
pub struct Spacer {
    pub min_length: f32,
}

impl Spacer {
    pub fn new() -> Self {
        Spacer { min_length: 0.0 }
    }

    pub fn min_length(mut self, length: f32) -> Self {
        self.min_length = length;
        self
    }
}

impl Default for Spacer {
    fn default() -> Self {
        Self::new()
    }
}

impl NativeComponent for Spacer {
    fn render(&self, ctx: &mut RenderContext) -> NativeView {
        ctx.create_container(crate::renderer::ContainerStyle::default())
    }

    fn update(&self, _ctx: &mut RenderContext) {}

    fn measure(&self, constraints: Constraints) -> Size {
        Size::new(self.min_length, self.min_length)
    }
}

/// Visual separator line
pub struct Divider {
    pub color: Color,
    pub thickness: f32,
}

impl Divider {
    pub fn new() -> Self {
        Divider {
            color: Color::rgba(0.8, 0.8, 0.8, 1.0),
            thickness: 1.0,
        }
    }

    pub fn color(mut self, color: Color) -> Self {
        self.color = color;
        self
    }

    pub fn thickness(mut self, thickness: f32) -> Self {
        self.thickness = thickness;
        self
    }
}

impl Default for Divider {
    fn default() -> Self {
        Self::new()
    }
}

/// Generic container with styling
pub struct Container {
    pub child: Option<Box<dyn NativeComponent>>,
    pub background: Color,
    pub corner_radius: f32,
    pub padding: EdgeInsets,
    pub shadow: Option<Shadow>,
}

#[derive(Debug, Clone)]
pub struct Shadow {
    pub color: Color,
    pub radius: f32,
    pub x: f32,
    pub y: f32,
}

impl Container {
    pub fn new() -> Self {
        Container {
            child: None,
            background: Color::TRANSPARENT,
            corner_radius: 0.0,
            padding: EdgeInsets::default(),
            shadow: None,
        }
    }

    pub fn child(mut self, component: impl NativeComponent + 'static) -> Self {
        self.child = Some(Box::new(component));
        self
    }

    pub fn background(mut self, color: Color) -> Self {
        self.background = color;
        self
    }

    pub fn corner_radius(mut self, radius: f32) -> Self {
        self.corner_radius = radius;
        self
    }

    pub fn padding(mut self, padding: EdgeInsets) -> Self {
        self.padding = padding;
        self
    }

    pub fn shadow(mut self, shadow: Shadow) -> Self {
        self.shadow = Some(shadow);
        self
    }
}

impl Default for Container {
    fn default() -> Self {
        Self::new()
    }
}

/// Pre-styled card container
pub struct Card {
    pub child: Option<Box<dyn NativeComponent>>,
    pub padding: EdgeInsets,
}

impl Card {
    pub fn new() -> Self {
        Card {
            child: None,
            padding: EdgeInsets::all(16.0),
        }
    }

    pub fn child(mut self, component: impl NativeComponent + 'static) -> Self {
        self.child = Some(Box::new(component));
        self
    }

    pub fn padding(mut self, padding: EdgeInsets) -> Self {
        self.padding = padding;
        self
    }
}

impl Default for Card {
    fn default() -> Self {
        Self::new()
    }
}

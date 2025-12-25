//! TUI Components for PhilJS
//!
//! Terminal UI components that mirror the PhilJS component model.

use ratatui::{
    layout::{Alignment, Constraint, Direction, Layout, Rect},
    style::{Color, Modifier, Style},
    text::{Line, Span, Text as RatatuiText},
    widgets::{Block, Borders, Clear, Paragraph, Wrap},
    Frame,
};
use crate::render::View;

/// Text component
pub struct Text {
    content: String,
    style: Style,
    alignment: Alignment,
    wrap: bool,
}

impl Text {
    pub fn new(content: impl Into<String>) -> Self {
        Text {
            content: content.into(),
            style: Style::default(),
            alignment: Alignment::Left,
            wrap: false,
        }
    }

    pub fn style(mut self, style: Style) -> Self {
        self.style = style;
        self
    }

    pub fn fg(mut self, color: Color) -> Self {
        self.style = self.style.fg(color);
        self
    }

    pub fn bg(mut self, color: Color) -> Self {
        self.style = self.style.bg(color);
        self
    }

    pub fn bold(mut self) -> Self {
        self.style = self.style.add_modifier(Modifier::BOLD);
        self
    }

    pub fn italic(mut self) -> Self {
        self.style = self.style.add_modifier(Modifier::ITALIC);
        self
    }

    pub fn underline(mut self) -> Self {
        self.style = self.style.add_modifier(Modifier::UNDERLINED);
        self
    }

    pub fn align(mut self, alignment: Alignment) -> Self {
        self.alignment = alignment;
        self
    }

    pub fn center(mut self) -> Self {
        self.alignment = Alignment::Center;
        self
    }

    pub fn wrap(mut self) -> Self {
        self.wrap = true;
        self
    }
}

impl View for Text {
    fn render(&self, frame: &mut Frame, area: Rect) {
        let mut para = Paragraph::new(self.content.as_str())
            .style(self.style)
            .alignment(self.alignment);

        if self.wrap {
            para = para.wrap(Wrap { trim: true });
        }

        frame.render_widget(para, area);
    }
}

/// Block/container component with border
pub struct Container<V: View> {
    child: V,
    title: Option<String>,
    borders: Borders,
    border_style: Style,
    style: Style,
}

impl<V: View> Container<V> {
    pub fn new(child: V) -> Self {
        Container {
            child,
            title: None,
            borders: Borders::ALL,
            border_style: Style::default(),
            style: Style::default(),
        }
    }

    pub fn title(mut self, title: impl Into<String>) -> Self {
        self.title = Some(title.into());
        self
    }

    pub fn borders(mut self, borders: Borders) -> Self {
        self.borders = borders;
        self
    }

    pub fn no_borders(mut self) -> Self {
        self.borders = Borders::NONE;
        self
    }

    pub fn border_style(mut self, style: Style) -> Self {
        self.border_style = style;
        self
    }

    pub fn style(mut self, style: Style) -> Self {
        self.style = style;
        self
    }
}

impl<V: View> View for Container<V> {
    fn render(&self, frame: &mut Frame, area: Rect) {
        let mut block = Block::default()
            .borders(self.borders)
            .border_style(self.border_style)
            .style(self.style);

        if let Some(ref title) = self.title {
            block = block.title(title.as_str());
        }

        let inner = block.inner(area);
        frame.render_widget(block, area);
        self.child.render(frame, inner);
    }
}

/// Vertical stack layout
pub struct VStack {
    children: Vec<Box<dyn View>>,
    spacing: u16,
    constraints: Vec<Constraint>,
}

impl VStack {
    pub fn new() -> Self {
        VStack {
            children: Vec::new(),
            spacing: 0,
            constraints: Vec::new(),
        }
    }

    pub fn child<V: View + 'static>(mut self, child: V) -> Self {
        self.children.push(Box::new(child));
        self.constraints.push(Constraint::Min(1));
        self
    }

    pub fn child_sized<V: View + 'static>(mut self, child: V, constraint: Constraint) -> Self {
        self.children.push(Box::new(child));
        self.constraints.push(constraint);
        self
    }

    pub fn spacing(mut self, spacing: u16) -> Self {
        self.spacing = spacing;
        self
    }
}

impl Default for VStack {
    fn default() -> Self {
        Self::new()
    }
}

impl View for VStack {
    fn render(&self, frame: &mut Frame, area: Rect) {
        if self.children.is_empty() {
            return;
        }

        let chunks = Layout::default()
            .direction(Direction::Vertical)
            .margin(0)
            .constraints(&self.constraints)
            .split(area);

        for (i, child) in self.children.iter().enumerate() {
            if i < chunks.len() {
                child.render(frame, chunks[i]);
            }
        }
    }
}

/// Horizontal stack layout
pub struct HStack {
    children: Vec<Box<dyn View>>,
    spacing: u16,
    constraints: Vec<Constraint>,
}

impl HStack {
    pub fn new() -> Self {
        HStack {
            children: Vec::new(),
            spacing: 0,
            constraints: Vec::new(),
        }
    }

    pub fn child<V: View + 'static>(mut self, child: V) -> Self {
        self.children.push(Box::new(child));
        self.constraints.push(Constraint::Min(1));
        self
    }

    pub fn child_sized<V: View + 'static>(mut self, child: V, constraint: Constraint) -> Self {
        self.children.push(Box::new(child));
        self.constraints.push(constraint);
        self
    }

    pub fn spacing(mut self, spacing: u16) -> Self {
        self.spacing = spacing;
        self
    }
}

impl Default for HStack {
    fn default() -> Self {
        Self::new()
    }
}

impl View for HStack {
    fn render(&self, frame: &mut Frame, area: Rect) {
        if self.children.is_empty() {
            return;
        }

        let chunks = Layout::default()
            .direction(Direction::Horizontal)
            .margin(0)
            .constraints(&self.constraints)
            .split(area);

        for (i, child) in self.children.iter().enumerate() {
            if i < chunks.len() {
                child.render(frame, chunks[i]);
            }
        }
    }
}

/// Spacer that fills available space
pub struct Spacer;

impl Spacer {
    pub fn new() -> Self {
        Spacer
    }
}

impl Default for Spacer {
    fn default() -> Self {
        Self::new()
    }
}

impl View for Spacer {
    fn render(&self, _frame: &mut Frame, _area: Rect) {
        // Spacer renders nothing, just takes space
    }
}

/// Empty view
pub struct Empty;

impl View for Empty {
    fn render(&self, _frame: &mut Frame, _area: Rect) {}
}

/// Centered content
pub struct Center<V: View> {
    child: V,
}

impl<V: View> Center<V> {
    pub fn new(child: V) -> Self {
        Center { child }
    }
}

impl<V: View> View for Center<V> {
    fn render(&self, frame: &mut Frame, area: Rect) {
        // For now, just render in full area
        // Real implementation would center the content
        self.child.render(frame, area);
    }
}

/// Padded content
pub struct Padding<V: View> {
    child: V,
    top: u16,
    right: u16,
    bottom: u16,
    left: u16,
}

impl<V: View> Padding<V> {
    pub fn new(child: V) -> Self {
        Padding {
            child,
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
        }
    }

    pub fn all(mut self, padding: u16) -> Self {
        self.top = padding;
        self.right = padding;
        self.bottom = padding;
        self.left = padding;
        self
    }

    pub fn horizontal(mut self, padding: u16) -> Self {
        self.left = padding;
        self.right = padding;
        self
    }

    pub fn vertical(mut self, padding: u16) -> Self {
        self.top = padding;
        self.bottom = padding;
        self
    }
}

impl<V: View> View for Padding<V> {
    fn render(&self, frame: &mut Frame, area: Rect) {
        let inner = Rect {
            x: area.x + self.left,
            y: area.y + self.top,
            width: area.width.saturating_sub(self.left + self.right),
            height: area.height.saturating_sub(self.top + self.bottom),
        };
        self.child.render(frame, inner);
    }
}

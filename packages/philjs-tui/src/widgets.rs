//! Additional widgets for PhilJS TUI

use crate::render::View;
use ratatui::{
    layout::Rect,
    style::{Color, Style},
    widgets::{Block, Borders, Gauge, List, ListItem, ListState, Paragraph, Table, Row, Cell},
    Frame,
};

/// Progress bar widget
pub struct ProgressBar {
    value: f64,
    label: Option<String>,
    style: Style,
    gauge_style: Style,
}

impl ProgressBar {
    pub fn new(value: f64) -> Self {
        ProgressBar {
            value: value.clamp(0.0, 1.0),
            label: None,
            style: Style::default(),
            gauge_style: Style::default().fg(Color::Cyan),
        }
    }

    pub fn label(mut self, label: impl Into<String>) -> Self {
        self.label = Some(label.into());
        self
    }

    pub fn style(mut self, style: Style) -> Self {
        self.style = style;
        self
    }

    pub fn gauge_style(mut self, style: Style) -> Self {
        self.gauge_style = style;
        self
    }
}

impl View for ProgressBar {
    fn render(&self, frame: &mut Frame, area: Rect) {
        let label = self.label.clone().unwrap_or_else(|| {
            format!("{}%", (self.value * 100.0) as u8)
        });

        let gauge = Gauge::default()
            .block(Block::default())
            .gauge_style(self.gauge_style)
            .ratio(self.value)
            .label(label);

        frame.render_widget(gauge, area);
    }
}

/// Selectable list widget
pub struct SelectList {
    items: Vec<String>,
    selected: usize,
    title: Option<String>,
    style: Style,
    highlight_style: Style,
}

impl SelectList {
    pub fn new(items: Vec<String>) -> Self {
        SelectList {
            items,
            selected: 0,
            title: None,
            style: Style::default(),
            highlight_style: Style::default().bg(Color::Cyan).fg(Color::Black),
        }
    }

    pub fn selected(mut self, index: usize) -> Self {
        self.selected = index.min(self.items.len().saturating_sub(1));
        self
    }

    pub fn title(mut self, title: impl Into<String>) -> Self {
        self.title = Some(title.into());
        self
    }

    pub fn highlight_style(mut self, style: Style) -> Self {
        self.highlight_style = style;
        self
    }

    pub fn next(&mut self) {
        if !self.items.is_empty() {
            self.selected = (self.selected + 1) % self.items.len();
        }
    }

    pub fn previous(&mut self) {
        if !self.items.is_empty() {
            self.selected = self.selected.checked_sub(1).unwrap_or(self.items.len() - 1);
        }
    }

    pub fn current(&self) -> Option<&String> {
        self.items.get(self.selected)
    }
}

impl View for SelectList {
    fn render(&self, frame: &mut Frame, area: Rect) {
        let items: Vec<ListItem> = self
            .items
            .iter()
            .map(|s| ListItem::new(s.as_str()))
            .collect();

        let mut block = Block::default().borders(Borders::ALL);
        if let Some(ref title) = self.title {
            block = block.title(title.as_str());
        }

        let list = List::new(items)
            .block(block)
            .style(self.style)
            .highlight_style(self.highlight_style)
            .highlight_symbol("> ");

        let mut state = ListState::default();
        state.select(Some(self.selected));

        frame.render_stateful_widget(list, area, &mut state);
    }
}

/// Simple spinner widget
pub struct Spinner {
    frames: Vec<&'static str>,
    current: usize,
    style: Style,
}

impl Spinner {
    pub fn new() -> Self {
        Spinner {
            frames: vec!["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
            current: 0,
            style: Style::default().fg(Color::Cyan),
        }
    }

    pub fn dots() -> Self {
        Self::new()
    }

    pub fn line() -> Self {
        Spinner {
            frames: vec!["-", "\\", "|", "/"],
            current: 0,
            style: Style::default().fg(Color::Cyan),
        }
    }

    pub fn tick(&mut self) {
        self.current = (self.current + 1) % self.frames.len();
    }

    pub fn style(mut self, style: Style) -> Self {
        self.style = style;
        self
    }
}

impl Default for Spinner {
    fn default() -> Self {
        Self::new()
    }
}

impl View for Spinner {
    fn render(&self, frame: &mut Frame, area: Rect) {
        let text = self.frames[self.current];
        let paragraph = Paragraph::new(text).style(self.style);
        frame.render_widget(paragraph, area);
    }
}

/// Input field widget
pub struct Input {
    value: String,
    cursor: usize,
    placeholder: Option<String>,
    style: Style,
    cursor_style: Style,
    focused: bool,
}

impl Input {
    pub fn new() -> Self {
        Input {
            value: String::new(),
            cursor: 0,
            placeholder: None,
            style: Style::default(),
            cursor_style: Style::default().bg(Color::White).fg(Color::Black),
            focused: false,
        }
    }

    pub fn value(mut self, value: impl Into<String>) -> Self {
        self.value = value.into();
        self.cursor = self.value.len();
        self
    }

    pub fn placeholder(mut self, placeholder: impl Into<String>) -> Self {
        self.placeholder = Some(placeholder.into());
        self
    }

    pub fn focused(mut self, focused: bool) -> Self {
        self.focused = focused;
        self
    }

    pub fn input(&mut self, c: char) {
        self.value.insert(self.cursor, c);
        self.cursor += 1;
    }

    pub fn backspace(&mut self) {
        if self.cursor > 0 {
            self.cursor -= 1;
            self.value.remove(self.cursor);
        }
    }

    pub fn delete(&mut self) {
        if self.cursor < self.value.len() {
            self.value.remove(self.cursor);
        }
    }

    pub fn move_left(&mut self) {
        if self.cursor > 0 {
            self.cursor -= 1;
        }
    }

    pub fn move_right(&mut self) {
        if self.cursor < self.value.len() {
            self.cursor += 1;
        }
    }

    pub fn get_value(&self) -> &str {
        &self.value
    }
}

impl Default for Input {
    fn default() -> Self {
        Self::new()
    }
}

impl View for Input {
    fn render(&self, frame: &mut Frame, area: Rect) {
        let display = if self.value.is_empty() {
            self.placeholder.clone().unwrap_or_default()
        } else {
            self.value.clone()
        };

        let style = if self.value.is_empty() && self.placeholder.is_some() {
            self.style.fg(Color::DarkGray)
        } else {
            self.style
        };

        let paragraph = Paragraph::new(display).style(style);
        frame.render_widget(paragraph, area);
    }
}

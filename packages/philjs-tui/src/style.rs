//! Style utilities for PhilJS TUI

pub use ratatui::style::{Color, Modifier, Style, Stylize};

/// Common color palette
pub mod colors {
    use super::Color;

    pub const PRIMARY: Color = Color::Cyan;
    pub const SECONDARY: Color = Color::Magenta;
    pub const SUCCESS: Color = Color::Green;
    pub const WARNING: Color = Color::Yellow;
    pub const ERROR: Color = Color::Red;
    pub const INFO: Color = Color::Blue;

    pub const TEXT: Color = Color::White;
    pub const TEXT_MUTED: Color = Color::DarkGray;
    pub const BACKGROUND: Color = Color::Reset;
    pub const BORDER: Color = Color::Gray;
}

/// Create a style builder
pub fn style() -> Style {
    Style::default()
}

/// Common styles
pub mod styles {
    use super::*;

    pub fn title() -> Style {
        Style::default()
            .fg(colors::PRIMARY)
            .add_modifier(Modifier::BOLD)
    }

    pub fn subtitle() -> Style {
        Style::default()
            .fg(colors::TEXT_MUTED)
    }

    pub fn highlight() -> Style {
        Style::default()
            .bg(colors::PRIMARY)
            .fg(Color::Black)
    }

    pub fn selected() -> Style {
        Style::default()
            .bg(colors::PRIMARY)
            .fg(Color::Black)
            .add_modifier(Modifier::BOLD)
    }

    pub fn error() -> Style {
        Style::default()
            .fg(colors::ERROR)
    }

    pub fn success() -> Style {
        Style::default()
            .fg(colors::SUCCESS)
    }

    pub fn warning() -> Style {
        Style::default()
            .fg(colors::WARNING)
    }

    pub fn border() -> Style {
        Style::default()
            .fg(colors::BORDER)
    }

    pub fn focused_border() -> Style {
        Style::default()
            .fg(colors::PRIMARY)
    }
}

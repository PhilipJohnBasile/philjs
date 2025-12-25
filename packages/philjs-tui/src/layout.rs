//! Layout utilities for PhilJS TUI

pub use ratatui::layout::{Alignment, Constraint, Direction, Layout, Margin, Rect};

/// Create a centered area within a parent area
pub fn center(area: Rect, width: u16, height: u16) -> Rect {
    let x = area.x + (area.width.saturating_sub(width)) / 2;
    let y = area.y + (area.height.saturating_sub(height)) / 2;
    Rect::new(x, y, width.min(area.width), height.min(area.height))
}

/// Create a horizontal layout with even splits
pub fn horizontal_split(area: Rect, count: usize) -> Vec<Rect> {
    let constraints: Vec<Constraint> = (0..count)
        .map(|_| Constraint::Percentage(100 / count as u16))
        .collect();

    Layout::default()
        .direction(Direction::Horizontal)
        .constraints(constraints)
        .split(area)
        .to_vec()
}

/// Create a vertical layout with even splits
pub fn vertical_split(area: Rect, count: usize) -> Vec<Rect> {
    let constraints: Vec<Constraint> = (0..count)
        .map(|_| Constraint::Percentage(100 / count as u16))
        .collect();

    Layout::default()
        .direction(Direction::Vertical)
        .constraints(constraints)
        .split(area)
        .to_vec()
}

/// Create a layout with header and content
pub fn header_layout(area: Rect, header_height: u16) -> (Rect, Rect) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(header_height),
            Constraint::Min(0),
        ])
        .split(area);
    (chunks[0], chunks[1])
}

/// Create a layout with footer and content
pub fn footer_layout(area: Rect, footer_height: u16) -> (Rect, Rect) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Min(0),
            Constraint::Length(footer_height),
        ])
        .split(area);
    (chunks[0], chunks[1])
}

/// Create a layout with sidebar and content
pub fn sidebar_layout(area: Rect, sidebar_width: u16) -> (Rect, Rect) {
    let chunks = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([
            Constraint::Length(sidebar_width),
            Constraint::Min(0),
        ])
        .split(area);
    (chunks[0], chunks[1])
}

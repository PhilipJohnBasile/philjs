//! Rendering traits for PhilJS TUI

use ratatui::{layout::Rect, Frame};

/// Trait for renderable views
pub trait View {
    fn render(&self, frame: &mut Frame, area: Rect);
}

/// Implement View for tuples (for composing multiple views)
impl<A: View, B: View> View for (A, B) {
    fn render(&self, frame: &mut Frame, area: Rect) {
        self.0.render(frame, area);
        self.1.render(frame, area);
    }
}

/// Implement View for Option
impl<V: View> View for Option<V> {
    fn render(&self, frame: &mut Frame, area: Rect) {
        if let Some(v) = self {
            v.render(frame, area);
        }
    }
}

/// Implement View for Vec
impl<V: View> View for Vec<V> {
    fn render(&self, frame: &mut Frame, area: Rect) {
        for v in self {
            v.render(frame, area);
        }
    }
}

/// Implement View for &str
impl View for &str {
    fn render(&self, frame: &mut Frame, area: Rect) {
        use ratatui::widgets::Paragraph;
        frame.render_widget(Paragraph::new(*self), area);
    }
}

/// Implement View for String
impl View for String {
    fn render(&self, frame: &mut Frame, area: Rect) {
        use ratatui::widgets::Paragraph;
        frame.render_widget(Paragraph::new(self.as_str()), area);
    }
}

/// A boxed view for dynamic dispatch
pub struct BoxedView(pub Box<dyn View>);

impl View for BoxedView {
    fn render(&self, frame: &mut Frame, area: Rect) {
        self.0.render(frame, area);
    }
}

//! Text node representation

use super::View;

/// A text node.
#[derive(Clone, Debug)]
pub struct Text {
    content: String,
}

impl Text {
    /// Create a new text node.
    pub fn new(content: impl Into<String>) -> Self {
        Text {
            content: content.into(),
        }
    }

    /// Get the text content.
    pub fn content(&self) -> &str {
        &self.content
    }

    /// Render to HTML string.
    pub fn to_html(&self) -> String {
        escape_html(&self.content)
    }
}

/// Escape HTML special characters in text.
fn escape_html(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

impl From<Text> for View {
    fn from(text: Text) -> Self {
        View::Text(text)
    }
}

impl From<&str> for Text {
    fn from(s: &str) -> Self {
        Text::new(s)
    }
}

impl From<String> for Text {
    fn from(s: String) -> Self {
        Text::new(s)
    }
}

impl From<&str> for View {
    fn from(s: &str) -> Self {
        View::Text(Text::new(s))
    }
}

impl From<String> for View {
    fn from(s: String) -> Self {
        View::Text(Text::new(s))
    }
}

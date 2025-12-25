//! Fragment - multiple nodes without a wrapper

use super::View;

/// A fragment represents multiple nodes without a wrapper element.
#[derive(Clone, Debug)]
pub struct Fragment {
    children: Vec<View>,
}

impl Fragment {
    /// Create a new fragment.
    pub fn new(children: Vec<View>) -> Self {
        Fragment { children }
    }

    /// Create an empty fragment.
    pub fn empty() -> Self {
        Fragment {
            children: Vec::new(),
        }
    }

    /// Get the children.
    pub fn children(&self) -> &[View] {
        &self.children
    }

    /// Add a child.
    pub fn push(&mut self, child: impl Into<View>) {
        self.children.push(child.into());
    }

    /// Render to HTML string.
    pub fn to_html(&self) -> String {
        self.children
            .iter()
            .map(|c| c.to_html())
            .collect::<Vec<_>>()
            .join("")
    }
}

impl From<Fragment> for View {
    fn from(frag: Fragment) -> Self {
        View::Fragment(frag)
    }
}

impl From<Vec<View>> for Fragment {
    fn from(children: Vec<View>) -> Self {
        Fragment::new(children)
    }
}

impl<T: Into<View>> FromIterator<T> for Fragment {
    fn from_iter<I: IntoIterator<Item = T>>(iter: I) -> Self {
        Fragment::new(iter.into_iter().map(|v| v.into()).collect())
    }
}

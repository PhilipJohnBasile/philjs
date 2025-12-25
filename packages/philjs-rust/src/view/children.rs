//! Children prop for components

use super::View;

/// Children passed to a component.
#[derive(Clone, Default)]
pub struct Children {
    views: Vec<View>,
}

impl Children {
    /// Create new children.
    pub fn new(views: Vec<View>) -> Self {
        Children { views }
    }

    /// Create empty children.
    pub fn empty() -> Self {
        Children { views: Vec::new() }
    }

    /// Check if empty.
    pub fn is_empty(&self) -> bool {
        self.views.is_empty()
    }

    /// Get the number of children.
    pub fn len(&self) -> usize {
        self.views.len()
    }

    /// Get the views.
    pub fn into_views(self) -> Vec<View> {
        self.views
    }

    /// Render to HTML.
    pub fn to_html(&self) -> String {
        self.views
            .iter()
            .map(|v| v.to_html())
            .collect::<Vec<_>>()
            .join("")
    }
}

impl From<Children> for View {
    fn from(children: Children) -> Self {
        if children.views.len() == 1 {
            children.views.into_iter().next().unwrap()
        } else {
            View::Fragment(super::Fragment::new(children.views))
        }
    }
}

impl<T: Into<View>> From<T> for Children {
    fn from(view: T) -> Self {
        Children::new(vec![view.into()])
    }
}

impl<T: Into<View>> FromIterator<T> for Children {
    fn from_iter<I: IntoIterator<Item = T>>(iter: I) -> Self {
        Children::new(iter.into_iter().map(|v| v.into()).collect())
    }
}

impl IntoIterator for Children {
    type Item = View;
    type IntoIter = std::vec::IntoIter<View>;

    fn into_iter(self) -> Self::IntoIter {
        self.views.into_iter()
    }
}

impl<'a> IntoIterator for &'a Children {
    type Item = &'a View;
    type IntoIter = std::slice::Iter<'a, View>;

    fn into_iter(self) -> Self::IntoIter {
        self.views.iter()
    }
}

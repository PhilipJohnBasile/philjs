//! IntoView trait for converting values to Views

use super::{View, Element, Text, Fragment, Dynamic, Children};
use crate::reactive::signal::Signal;
use std::rc::Rc;

/// Trait for types that can be converted into a View.
pub trait IntoView {
    /// Convert into a View.
    fn into_view(self) -> View;
}

impl IntoView for View {
    fn into_view(self) -> View {
        self
    }
}

impl IntoView for Element {
    fn into_view(self) -> View {
        View::Element(self)
    }
}

impl IntoView for Text {
    fn into_view(self) -> View {
        View::Text(self)
    }
}

impl IntoView for Fragment {
    fn into_view(self) -> View {
        View::Fragment(self)
    }
}

impl IntoView for Dynamic {
    fn into_view(self) -> View {
        View::Dynamic(Rc::new(self))
    }
}

impl IntoView for Children {
    fn into_view(self) -> View {
        self.into()
    }
}

impl IntoView for () {
    fn into_view(self) -> View {
        View::Empty
    }
}

impl IntoView for &str {
    fn into_view(self) -> View {
        View::Text(Text::new(self))
    }
}

impl IntoView for String {
    fn into_view(self) -> View {
        View::Text(Text::new(self))
    }
}

impl<T: IntoView> IntoView for Option<T> {
    fn into_view(self) -> View {
        match self {
            Some(v) => v.into_view(),
            None => View::Empty,
        }
    }
}

impl<T: IntoView, E: std::fmt::Display> IntoView for Result<T, E> {
    fn into_view(self) -> View {
        match self {
            Ok(v) => v.into_view(),
            Err(e) => View::Text(Text::new(format!("Error: {}", e))),
        }
    }
}

impl<T: IntoView> IntoView for Vec<T> {
    fn into_view(self) -> View {
        View::Fragment(Fragment::new(
            self.into_iter().map(|v| v.into_view()).collect()
        ))
    }
}

// Implement for tuples
impl<A: IntoView, B: IntoView> IntoView for (A, B) {
    fn into_view(self) -> View {
        View::Fragment(Fragment::new(vec![
            self.0.into_view(),
            self.1.into_view(),
        ]))
    }
}

impl<A: IntoView, B: IntoView, C: IntoView> IntoView for (A, B, C) {
    fn into_view(self) -> View {
        View::Fragment(Fragment::new(vec![
            self.0.into_view(),
            self.1.into_view(),
            self.2.into_view(),
        ]))
    }
}

// Primitive types
impl IntoView for i32 {
    fn into_view(self) -> View {
        View::Text(Text::new(self.to_string()))
    }
}

impl IntoView for i64 {
    fn into_view(self) -> View {
        View::Text(Text::new(self.to_string()))
    }
}

impl IntoView for u32 {
    fn into_view(self) -> View {
        View::Text(Text::new(self.to_string()))
    }
}

impl IntoView for u64 {
    fn into_view(self) -> View {
        View::Text(Text::new(self.to_string()))
    }
}

impl IntoView for f32 {
    fn into_view(self) -> View {
        View::Text(Text::new(self.to_string()))
    }
}

impl IntoView for f64 {
    fn into_view(self) -> View {
        View::Text(Text::new(self.to_string()))
    }
}

impl IntoView for bool {
    fn into_view(self) -> View {
        View::Text(Text::new(self.to_string()))
    }
}

// Signal types create dynamic views
impl<T: Clone + IntoView + 'static> IntoView for Signal<T> {
    fn into_view(self) -> View {
        Dynamic::new(move || self.get().into_view()).into_view()
    }
}

// Boxed closures
impl<F, V> IntoView for Box<F>
where
    F: Fn() -> V + 'static,
    V: IntoView,
{
    fn into_view(self) -> View {
        Dynamic::new(move || (*self)().into_view()).into_view()
    }
}

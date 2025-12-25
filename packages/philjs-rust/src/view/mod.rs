//! View types for building UI

pub mod element;
pub mod text;
pub mod fragment;
pub mod dynamic;
pub mod children;
pub mod into_view;
pub mod view;

pub use element::Element;
pub use text::Text;
pub use fragment::Fragment;
pub use dynamic::Dynamic;
pub use children::Children;
pub use into_view::IntoView;
pub use view::View;

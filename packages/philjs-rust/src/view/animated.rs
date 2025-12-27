//! Animated Visibility Components for PhilJS
//!
//! Provides animated conditional rendering, similar to Leptos's AnimatedShow.
//!
//! # Example
//!
//! ```rust
//! use philjs::prelude::*;
//!
//! #[component]
//! fn Modal() -> impl IntoView {
//!     let show = signal!(false);
//!
//!     view! {
//!         <button on:click=move |_| show.update(|s| *s = !*s)>
//!             "Toggle Modal"
//!         </button>
//!         <AnimatedShow
//!             when=move || show.get()
//!             enter="fade-in"
//!             exit="fade-out"
//!             duration_ms=300
//!         >
//!             <div class="modal">
//!                 <h2>"Modal Content"</h2>
//!             </div>
//!         </AnimatedShow>
//!     }
//! }
//! ```

use std::cell::RefCell;
use std::rc::Rc;
use std::time::Duration;

use crate::reactive::Signal;
use crate::view::{View, IntoView};

/// Animation timing function
#[derive(Clone, Debug, Default)]
pub enum Easing {
    #[default]
    Linear,
    EaseIn,
    EaseOut,
    EaseInOut,
    Custom(String),
}

impl Easing {
    pub fn to_css(&self) -> &str {
        match self {
            Easing::Linear => "linear",
            Easing::EaseIn => "ease-in",
            Easing::EaseOut => "ease-out",
            Easing::EaseInOut => "ease-in-out",
            Easing::Custom(s) => s,
        }
    }
}

/// Configuration for animated visibility
#[derive(Clone, Debug)]
pub struct AnimatedShowConfig {
    /// CSS class to apply during enter animation
    pub enter_class: Option<String>,
    /// CSS class to apply during exit animation
    pub exit_class: Option<String>,
    /// Duration of enter animation in milliseconds
    pub enter_duration_ms: u64,
    /// Duration of exit animation in milliseconds
    pub exit_duration_ms: u64,
    /// Easing function for enter
    pub enter_easing: Easing,
    /// Easing function for exit
    pub exit_easing: Easing,
    /// Whether to unmount when hidden (vs just hiding)
    pub unmount_on_exit: bool,
    /// Initial visibility animation
    pub appear: bool,
}

impl Default for AnimatedShowConfig {
    fn default() -> Self {
        Self {
            enter_class: None,
            exit_class: None,
            enter_duration_ms: 200,
            exit_duration_ms: 200,
            enter_easing: Easing::EaseOut,
            exit_easing: Easing::EaseIn,
            unmount_on_exit: true,
            appear: false,
        }
    }
}

/// Animation state for tracking transitions
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum AnimationState {
    /// Not shown, no animation
    Hidden,
    /// Entering (animating in)
    Entering,
    /// Fully visible
    Shown,
    /// Exiting (animating out)
    Exiting,
}

/// Animated conditional rendering component.
///
/// Shows content with enter/exit animations.
pub struct AnimatedShow<W, F, C>
where
    W: Fn() -> bool + 'static,
    F: Fn() -> View + 'static,
    C: Fn() -> View + 'static,
{
    /// Condition for showing content
    when: W,
    /// The content to show
    children: C,
    /// Fallback when hidden (optional)
    fallback: Option<F>,
    /// Animation configuration
    config: AnimatedShowConfig,
    /// Current animation state
    state: Signal<AnimationState>,
}

impl<W, C> AnimatedShow<W, fn() -> View, C>
where
    W: Fn() -> bool + 'static,
    C: Fn() -> View + 'static,
{
    /// Create a new AnimatedShow component
    pub fn new(when: W, children: C) -> Self {
        Self {
            when,
            children,
            fallback: None,
            config: AnimatedShowConfig::default(),
            state: Signal::new(AnimationState::Hidden),
        }
    }
}

impl<W, F, C> AnimatedShow<W, F, C>
where
    W: Fn() -> bool + 'static,
    F: Fn() -> View + 'static,
    C: Fn() -> View + 'static,
{
    /// Set enter animation class
    pub fn enter_class(mut self, class: impl Into<String>) -> Self {
        self.config.enter_class = Some(class.into());
        self
    }

    /// Set exit animation class
    pub fn exit_class(mut self, class: impl Into<String>) -> Self {
        self.config.exit_class = Some(class.into());
        self
    }

    /// Set animation duration (for both enter and exit)
    pub fn duration_ms(mut self, ms: u64) -> Self {
        self.config.enter_duration_ms = ms;
        self.config.exit_duration_ms = ms;
        self
    }

    /// Set enter duration
    pub fn enter_duration_ms(mut self, ms: u64) -> Self {
        self.config.enter_duration_ms = ms;
        self
    }

    /// Set exit duration
    pub fn exit_duration_ms(mut self, ms: u64) -> Self {
        self.config.exit_duration_ms = ms;
        self
    }

    /// Set whether to unmount on exit
    pub fn unmount_on_exit(mut self, unmount: bool) -> Self {
        self.config.unmount_on_exit = unmount;
        self
    }

    /// Set whether to animate on initial mount
    pub fn appear(mut self, appear: bool) -> Self {
        self.config.appear = appear;
        self
    }

    /// Set fallback content
    pub fn with_fallback<NF: Fn() -> View + 'static>(self, fallback: NF) -> AnimatedShow<W, NF, C> {
        AnimatedShow {
            when: self.when,
            children: self.children,
            fallback: Some(fallback),
            config: self.config,
            state: self.state,
        }
    }

    /// Get the current animation state
    pub fn animation_state(&self) -> Signal<AnimationState> {
        self.state.clone()
    }

    /// Render the animated content
    pub fn render(&self) -> View {
        let should_show = (self.when)();
        let current_state = self.state.get();

        match (should_show, current_state) {
            // Need to enter
            (true, AnimationState::Hidden) | (true, AnimationState::Exiting) => {
                self.state.set(AnimationState::Entering);
                self.render_with_animation(true)
            }
            // Already entering or shown
            (true, AnimationState::Entering) | (true, AnimationState::Shown) => {
                self.render_with_animation(true)
            }
            // Need to exit
            (false, AnimationState::Shown) | (false, AnimationState::Entering) => {
                self.state.set(AnimationState::Exiting);
                self.render_with_animation(false)
            }
            // Already hidden or exiting
            (false, AnimationState::Hidden) => {
                if let Some(ref fallback) = self.fallback {
                    fallback()
                } else {
                    View::Empty
                }
            }
            (false, AnimationState::Exiting) => {
                self.render_with_animation(false)
            }
        }
    }

    fn render_with_animation(&self, entering: bool) -> View {
        let content = (self.children)();

        // Build animation wrapper
        let animation_class = if entering {
            self.config.enter_class.clone().unwrap_or_else(|| "philjs-enter".to_string())
        } else {
            self.config.exit_class.clone().unwrap_or_else(|| "philjs-exit".to_string())
        };

        let duration = if entering {
            self.config.enter_duration_ms
        } else {
            self.config.exit_duration_ms
        };

        let easing = if entering {
            &self.config.enter_easing
        } else {
            &self.config.exit_easing
        };

        // Wrap content with animation attributes
        View::Element(crate::view::element::ElementBuilder::new("div")
            .attr("class", &animation_class)
            .attr("data-philjs-animate", if entering { "enter" } else { "exit" })
            .attr("style", &format!(
                "animation-duration: {}ms; animation-timing-function: {};",
                duration,
                easing.to_css()
            ))
            .build())
    }
}

impl<W, F, C> IntoView for AnimatedShow<W, F, C>
where
    W: Fn() -> bool + 'static,
    F: Fn() -> View + 'static,
    C: Fn() -> View + 'static,
{
    fn into_view(self) -> View {
        self.render()
    }
}

// =============================================================================
// Fade Animation Presets
// =============================================================================

/// Create an AnimatedShow with fade animation
pub fn fade<W, C>(when: W, children: C) -> AnimatedShow<W, fn() -> View, C>
where
    W: Fn() -> bool + 'static,
    C: Fn() -> View + 'static,
{
    AnimatedShow::new(when, children)
        .enter_class("philjs-fade-in")
        .exit_class("philjs-fade-out")
        .duration_ms(200)
}

/// Create an AnimatedShow with slide animation
pub fn slide<W, C>(when: W, children: C) -> AnimatedShow<W, fn() -> View, C>
where
    W: Fn() -> bool + 'static,
    C: Fn() -> View + 'static,
{
    AnimatedShow::new(when, children)
        .enter_class("philjs-slide-in")
        .exit_class("philjs-slide-out")
        .duration_ms(300)
}

/// Create an AnimatedShow with scale animation
pub fn scale<W, C>(when: W, children: C) -> AnimatedShow<W, fn() -> View, C>
where
    W: Fn() -> bool + 'static,
    C: Fn() -> View + 'static,
{
    AnimatedShow::new(when, children)
        .enter_class("philjs-scale-in")
        .exit_class("philjs-scale-out")
        .duration_ms(200)
}

// =============================================================================
// CSS Keyframes (for injection)
// =============================================================================

/// Default CSS for animations
pub const ANIMATION_CSS: &str = r#"
@keyframes philjs-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes philjs-fade-out {
    from { opacity: 1; }
    to { opacity: 0; }
}

@keyframes philjs-slide-in {
    from { transform: translateY(-10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

@keyframes philjs-slide-out {
    from { transform: translateY(0); opacity: 1; }
    to { transform: translateY(10px); opacity: 0; }
}

@keyframes philjs-scale-in {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}

@keyframes philjs-scale-out {
    from { transform: scale(1); opacity: 1; }
    to { transform: scale(0.95); opacity: 0; }
}

.philjs-fade-in { animation-name: philjs-fade-in; }
.philjs-fade-out { animation-name: philjs-fade-out; }
.philjs-slide-in { animation-name: philjs-slide-in; }
.philjs-slide-out { animation-name: philjs-slide-out; }
.philjs-scale-in { animation-name: philjs-scale-in; }
.philjs-scale-out { animation-name: philjs-scale-out; }
"#;

// =============================================================================
// Presence (for complex animations)
// =============================================================================

/// Presence component that tracks when children should exit.
///
/// Similar to framer-motion's AnimatePresence.
pub struct Presence<C: Fn() -> View + 'static> {
    children: C,
    /// Whether to wait for exit animations before removing
    exit_before_enter: bool,
    /// Current children to render
    rendered: Rc<RefCell<Option<View>>>,
}

impl<C: Fn() -> View + 'static> Presence<C> {
    pub fn new(children: C) -> Self {
        Self {
            children,
            exit_before_enter: false,
            rendered: Rc::new(RefCell::new(None)),
        }
    }

    pub fn exit_before_enter(mut self, value: bool) -> Self {
        self.exit_before_enter = value;
        self
    }

    pub fn render(&self) -> View {
        (self.children)()
    }
}

impl<C: Fn() -> View + 'static> IntoView for Presence<C> {
    fn into_view(self) -> View {
        self.render()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_animation_config_default() {
        let config = AnimatedShowConfig::default();
        assert_eq!(config.enter_duration_ms, 200);
        assert!(config.unmount_on_exit);
    }

    #[test]
    fn test_easing_to_css() {
        assert_eq!(Easing::Linear.to_css(), "linear");
        assert_eq!(Easing::EaseInOut.to_css(), "ease-in-out");
    }
}

//! PhilJS Mobile Animation
//!
//! High-performance animations for mobile applications.

use std::sync::{Arc, Mutex};
use std::time::Duration;

/// Animated value that smoothly transitions between states
pub struct AnimatedValue {
    current: Arc<Mutex<f32>>,
    target: f32,
    animation: Option<Animation>,
}

impl AnimatedValue {
    pub fn new(initial: f32) -> Self {
        AnimatedValue {
            current: Arc::new(Mutex::new(initial)),
            target: initial,
            animation: None,
        }
    }

    /// Get current value
    pub fn get(&self) -> f32 {
        *self.current.lock().unwrap()
    }

    /// Set target value with animation
    pub fn animate_to(&mut self, target: f32, animation: Animation) {
        self.target = target;
        self.animation = Some(animation);
    }

    /// Set value immediately without animation
    pub fn set(&mut self, value: f32) {
        self.target = value;
        *self.current.lock().unwrap() = value;
        self.animation = None;
    }

    /// Check if animation is in progress
    pub fn is_animating(&self) -> bool {
        self.animation.is_some() && self.get() != self.target
    }
}

impl Clone for AnimatedValue {
    fn clone(&self) -> Self {
        AnimatedValue {
            current: Arc::clone(&self.current),
            target: self.target,
            animation: self.animation.clone(),
        }
    }
}

/// Animation configuration
#[derive(Debug, Clone)]
pub enum Animation {
    /// Spring-based animation (natural feeling)
    Spring(SpringAnimation),
    /// Timing curve animation
    Timing(TimingAnimation),
    /// Keyframe animation
    Keyframe(KeyframeAnimation),
}

impl Animation {
    /// Default spring animation
    pub fn spring() -> Self {
        Animation::Spring(SpringAnimation::default())
    }

    /// Bouncy spring animation
    pub fn bouncy() -> Self {
        Animation::Spring(SpringAnimation::bouncy())
    }

    /// Smooth spring animation
    pub fn smooth() -> Self {
        Animation::Spring(SpringAnimation::smooth())
    }

    /// Snappy spring animation
    pub fn snappy() -> Self {
        Animation::Spring(SpringAnimation::snappy())
    }

    /// Linear timing animation
    pub fn linear(duration: Duration) -> Self {
        Animation::Timing(TimingAnimation::linear(duration))
    }

    /// Ease-in-out timing animation
    pub fn ease_in_out(duration: Duration) -> Self {
        Animation::Timing(TimingAnimation::ease_in_out(duration))
    }

    /// Ease-in timing animation
    pub fn ease_in(duration: Duration) -> Self {
        Animation::Timing(TimingAnimation::ease_in(duration))
    }

    /// Ease-out timing animation
    pub fn ease_out(duration: Duration) -> Self {
        Animation::Timing(TimingAnimation::ease_out(duration))
    }
}

/// Spring-based animation parameters
#[derive(Debug, Clone)]
pub struct SpringAnimation {
    /// Spring stiffness (higher = faster)
    pub stiffness: f32,
    /// Damping ratio (1.0 = critically damped, <1.0 = bouncy)
    pub damping: f32,
    /// Initial velocity
    pub initial_velocity: f32,
    /// Mass
    pub mass: f32,
}

impl SpringAnimation {
    pub fn new(stiffness: f32, damping: f32) -> Self {
        SpringAnimation {
            stiffness,
            damping,
            initial_velocity: 0.0,
            mass: 1.0,
        }
    }

    /// Default spring (Swift-like)
    pub fn default_spring() -> Self {
        SpringAnimation::new(170.0, 26.0)
    }

    /// Bouncy spring
    pub fn bouncy() -> Self {
        SpringAnimation::new(600.0, 15.0)
    }

    /// Smooth spring
    pub fn smooth() -> Self {
        SpringAnimation::new(100.0, 20.0)
    }

    /// Snappy spring
    pub fn snappy() -> Self {
        SpringAnimation::new(400.0, 30.0)
    }

    /// Gentle spring
    pub fn gentle() -> Self {
        SpringAnimation::new(120.0, 14.0)
    }

    /// Set initial velocity
    pub fn velocity(mut self, velocity: f32) -> Self {
        self.initial_velocity = velocity;
        self
    }

    /// Set mass
    pub fn mass(mut self, mass: f32) -> Self {
        self.mass = mass;
        self
    }

    /// Calculate spring response duration
    pub fn response(&self) -> f32 {
        2.0 * std::f32::consts::PI / (self.stiffness / self.mass).sqrt()
    }

    /// Calculate damping ratio
    pub fn damping_ratio(&self) -> f32 {
        self.damping / (2.0 * (self.stiffness * self.mass).sqrt())
    }
}

impl Default for SpringAnimation {
    fn default() -> Self {
        Self::default_spring()
    }
}

/// Timing curve animation
#[derive(Debug, Clone)]
pub struct TimingAnimation {
    /// Animation duration
    pub duration: Duration,
    /// Timing curve
    pub curve: TimingCurve,
    /// Delay before starting
    pub delay: Duration,
}

impl TimingAnimation {
    pub fn new(duration: Duration, curve: TimingCurve) -> Self {
        TimingAnimation {
            duration,
            curve,
            delay: Duration::ZERO,
        }
    }

    pub fn linear(duration: Duration) -> Self {
        Self::new(duration, TimingCurve::Linear)
    }

    pub fn ease_in(duration: Duration) -> Self {
        Self::new(duration, TimingCurve::EaseIn)
    }

    pub fn ease_out(duration: Duration) -> Self {
        Self::new(duration, TimingCurve::EaseOut)
    }

    pub fn ease_in_out(duration: Duration) -> Self {
        Self::new(duration, TimingCurve::EaseInOut)
    }

    pub fn delay(mut self, delay: Duration) -> Self {
        self.delay = delay;
        self
    }
}

/// Timing curve types
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum TimingCurve {
    /// Linear (constant speed)
    Linear,
    /// Ease in (start slow, end fast)
    EaseIn,
    /// Ease out (start fast, end slow)
    EaseOut,
    /// Ease in and out
    EaseInOut,
    /// Custom cubic bezier
    CubicBezier { x1: f32, y1: f32, x2: f32, y2: f32 },
}

impl TimingCurve {
    /// iOS default curve
    pub fn ios_default() -> Self {
        TimingCurve::CubicBezier {
            x1: 0.25,
            y1: 0.1,
            x2: 0.25,
            y2: 1.0,
        }
    }

    /// Material Design standard curve
    pub fn material_standard() -> Self {
        TimingCurve::CubicBezier {
            x1: 0.4,
            y1: 0.0,
            x2: 0.2,
            y2: 1.0,
        }
    }

    /// Material Design decelerate curve
    pub fn material_decelerate() -> Self {
        TimingCurve::CubicBezier {
            x1: 0.0,
            y1: 0.0,
            x2: 0.2,
            y2: 1.0,
        }
    }

    /// Material Design accelerate curve
    pub fn material_accelerate() -> Self {
        TimingCurve::CubicBezier {
            x1: 0.4,
            y1: 0.0,
            x2: 1.0,
            y2: 1.0,
        }
    }

    /// Evaluate the curve at time t (0.0 to 1.0)
    pub fn evaluate(&self, t: f32) -> f32 {
        match self {
            TimingCurve::Linear => t,
            TimingCurve::EaseIn => t * t,
            TimingCurve::EaseOut => 1.0 - (1.0 - t) * (1.0 - t),
            TimingCurve::EaseInOut => {
                if t < 0.5 {
                    2.0 * t * t
                } else {
                    1.0 - (-2.0 * t + 2.0).powi(2) / 2.0
                }
            }
            TimingCurve::CubicBezier { x1, y1, x2, y2 } => {
                // Simplified cubic bezier evaluation
                // Full implementation would use Newton-Raphson
                let t2 = t * t;
                let t3 = t2 * t;
                let mt = 1.0 - t;
                let mt2 = mt * mt;
                let mt3 = mt2 * mt;

                mt3 * 0.0 + 3.0 * mt2 * t * y1 + 3.0 * mt * t2 * y2 + t3 * 1.0
            }
        }
    }
}

/// Keyframe animation
#[derive(Debug, Clone)]
pub struct KeyframeAnimation {
    pub keyframes: Vec<Keyframe>,
    pub duration: Duration,
    pub repeat: RepeatMode,
}

#[derive(Debug, Clone)]
pub struct Keyframe {
    /// Position in animation (0.0 to 1.0)
    pub time: f32,
    /// Value at this keyframe
    pub value: f32,
    /// Easing to next keyframe
    pub easing: TimingCurve,
}

impl KeyframeAnimation {
    pub fn new(duration: Duration) -> Self {
        KeyframeAnimation {
            keyframes: Vec::new(),
            duration,
            repeat: RepeatMode::None,
        }
    }

    pub fn keyframe(mut self, time: f32, value: f32) -> Self {
        self.keyframes.push(Keyframe {
            time,
            value,
            easing: TimingCurve::EaseInOut,
        });
        self.keyframes.sort_by(|a, b| a.time.partial_cmp(&b.time).unwrap());
        self
    }

    pub fn keyframe_eased(mut self, time: f32, value: f32, easing: TimingCurve) -> Self {
        self.keyframes.push(Keyframe { time, value, easing });
        self.keyframes.sort_by(|a, b| a.time.partial_cmp(&b.time).unwrap());
        self
    }

    pub fn repeat(mut self, mode: RepeatMode) -> Self {
        self.repeat = mode;
        self
    }
}

/// Animation repeat mode
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RepeatMode {
    /// Don't repeat
    None,
    /// Repeat from beginning
    Repeat(u32),
    /// Repeat forever
    Forever,
    /// Reverse and repeat
    Autoreverse(u32),
    /// Reverse and repeat forever
    AutoreverseForever,
}

// ============================================================================
// Transition Animations
// ============================================================================

/// View transition
#[derive(Debug, Clone)]
pub enum Transition {
    Opacity,
    Scale,
    Slide(SlideDirection),
    Move(MoveEdge),
    Offset(f32, f32),
    Asymmetric {
        insertion: Box<Transition>,
        removal: Box<Transition>,
    },
    Combined(Vec<Transition>),
}

#[derive(Debug, Clone, Copy)]
pub enum SlideDirection {
    Leading,
    Trailing,
    Top,
    Bottom,
}

#[derive(Debug, Clone, Copy)]
pub enum MoveEdge {
    Leading,
    Trailing,
    Top,
    Bottom,
}

impl Transition {
    pub fn opacity() -> Self {
        Transition::Opacity
    }

    pub fn scale() -> Self {
        Transition::Scale
    }

    pub fn slide_leading() -> Self {
        Transition::Slide(SlideDirection::Leading)
    }

    pub fn slide_trailing() -> Self {
        Transition::Slide(SlideDirection::Trailing)
    }

    pub fn slide_top() -> Self {
        Transition::Slide(SlideDirection::Top)
    }

    pub fn slide_bottom() -> Self {
        Transition::Slide(SlideDirection::Bottom)
    }

    pub fn asymmetric(insertion: Transition, removal: Transition) -> Self {
        Transition::Asymmetric {
            insertion: Box::new(insertion),
            removal: Box::new(removal),
        }
    }

    pub fn combined(transitions: Vec<Transition>) -> Self {
        Transition::Combined(transitions)
    }
}

// ============================================================================
// Animation Modifiers
// ============================================================================

/// Animate a closure's changes
pub fn with_animation<F: FnOnce()>(animation: Animation, f: F) {
    // Would integrate with platform animation system
    f();
}

/// Animate changes with default animation
pub fn animate<F: FnOnce()>(f: F) {
    with_animation(Animation::spring(), f);
}

/// Create a repeating animation
pub fn repeat_forever<F: Fn(f32) + Send + Sync + 'static>(
    animation: Animation,
    f: F,
) -> AnimationHandle {
    // Would start the animation loop
    AnimationHandle { id: 0 }
}

/// Handle to a running animation
pub struct AnimationHandle {
    id: u64,
}

impl AnimationHandle {
    /// Stop the animation
    pub fn stop(&self) {
        // Would stop the animation
    }
}

impl Drop for AnimationHandle {
    fn drop(&mut self) {
        self.stop();
    }
}

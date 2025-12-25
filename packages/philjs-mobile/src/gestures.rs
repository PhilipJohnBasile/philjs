//! PhilJS Mobile Gestures
//!
//! Touch gesture recognition and handling.

use crate::Point;
use std::sync::Arc;
use std::time::Duration;

/// Gesture recognizer state
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GestureState {
    /// Gesture hasn't started
    Possible,
    /// Gesture has begun
    Began,
    /// Gesture is changing
    Changed,
    /// Gesture ended successfully
    Ended,
    /// Gesture was cancelled
    Cancelled,
    /// Gesture recognition failed
    Failed,
}

/// Base trait for gesture recognizers
pub trait GestureRecognizer: Send + Sync {
    fn state(&self) -> GestureState;
    fn location(&self) -> Point;
    fn reset(&mut self);
}

/// Recognized gesture types
#[derive(Debug, Clone)]
pub enum Gesture {
    Tap(TapGesture),
    LongPress(LongPressGesture),
    Pan(PanGesture),
    Pinch(PinchGesture),
    Rotation(RotationGesture),
    Swipe(SwipeGesture),
    EdgePan(EdgePanGesture),
}

// ============================================================================
// Tap Gesture
// ============================================================================

/// Single or multiple tap gesture
#[derive(Debug, Clone)]
pub struct TapGesture {
    /// Number of taps required
    pub taps_required: u32,
    /// Number of touches required
    pub touches_required: u32,
    /// Current location
    pub location: Point,
    /// Current state
    pub state: GestureState,
}

impl TapGesture {
    pub fn new() -> Self {
        TapGesture {
            taps_required: 1,
            touches_required: 1,
            location: Point::zero(),
            state: GestureState::Possible,
        }
    }

    pub fn taps(mut self, count: u32) -> Self {
        self.taps_required = count;
        self
    }

    pub fn touches(mut self, count: u32) -> Self {
        self.touches_required = count;
        self
    }

    /// Create a double tap recognizer
    pub fn double_tap() -> Self {
        TapGesture::new().taps(2)
    }
}

impl Default for TapGesture {
    fn default() -> Self {
        Self::new()
    }
}

/// Tap gesture handler builder
pub struct TapHandler<F> {
    gesture: TapGesture,
    on_tap: F,
}

impl<F: Fn(Point) + Send + Sync + 'static> TapHandler<F> {
    pub fn new(on_tap: F) -> Self {
        TapHandler {
            gesture: TapGesture::new(),
            on_tap,
        }
    }

    pub fn taps(mut self, count: u32) -> Self {
        self.gesture.taps_required = count;
        self
    }
}

// ============================================================================
// Long Press Gesture
// ============================================================================

/// Long press gesture
#[derive(Debug, Clone)]
pub struct LongPressGesture {
    /// Minimum press duration
    pub minimum_duration: Duration,
    /// Maximum movement allowed
    pub allowable_movement: f32,
    /// Number of touches required
    pub touches_required: u32,
    /// Current location
    pub location: Point,
    /// Current state
    pub state: GestureState,
}

impl LongPressGesture {
    pub fn new() -> Self {
        LongPressGesture {
            minimum_duration: Duration::from_millis(500),
            allowable_movement: 10.0,
            touches_required: 1,
            location: Point::zero(),
            state: GestureState::Possible,
        }
    }

    pub fn duration(mut self, duration: Duration) -> Self {
        self.minimum_duration = duration;
        self
    }

    pub fn allowable_movement(mut self, distance: f32) -> Self {
        self.allowable_movement = distance;
        self
    }
}

impl Default for LongPressGesture {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Pan Gesture
// ============================================================================

/// Pan (drag) gesture
#[derive(Debug, Clone)]
pub struct PanGesture {
    /// Minimum number of touches
    pub min_touches: u32,
    /// Maximum number of touches
    pub max_touches: u32,
    /// Current location
    pub location: Point,
    /// Translation from start
    pub translation: Point,
    /// Current velocity (points per second)
    pub velocity: Point,
    /// Current state
    pub state: GestureState,
}

impl PanGesture {
    pub fn new() -> Self {
        PanGesture {
            min_touches: 1,
            max_touches: u32::MAX,
            location: Point::zero(),
            translation: Point::zero(),
            velocity: Point::zero(),
            state: GestureState::Possible,
        }
    }

    pub fn touches(mut self, min: u32, max: u32) -> Self {
        self.min_touches = min;
        self.max_touches = max;
        self
    }
}

impl Default for PanGesture {
    fn default() -> Self {
        Self::new()
    }
}

/// Pan gesture handler
pub struct PanHandler<F> {
    gesture: PanGesture,
    on_pan: F,
}

impl<F: Fn(PanGesture) + Send + Sync + 'static> PanHandler<F> {
    pub fn new(on_pan: F) -> Self {
        PanHandler {
            gesture: PanGesture::new(),
            on_pan,
        }
    }
}

// ============================================================================
// Pinch Gesture
// ============================================================================

/// Pinch (zoom) gesture
#[derive(Debug, Clone)]
pub struct PinchGesture {
    /// Current scale (1.0 = unchanged)
    pub scale: f32,
    /// Velocity of scale change
    pub velocity: f32,
    /// Center point between touches
    pub location: Point,
    /// Current state
    pub state: GestureState,
}

impl PinchGesture {
    pub fn new() -> Self {
        PinchGesture {
            scale: 1.0,
            velocity: 0.0,
            location: Point::zero(),
            state: GestureState::Possible,
        }
    }
}

impl Default for PinchGesture {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Rotation Gesture
// ============================================================================

/// Rotation gesture (two-finger rotate)
#[derive(Debug, Clone)]
pub struct RotationGesture {
    /// Current rotation in radians
    pub rotation: f32,
    /// Velocity of rotation
    pub velocity: f32,
    /// Center point between touches
    pub location: Point,
    /// Current state
    pub state: GestureState,
}

impl RotationGesture {
    pub fn new() -> Self {
        RotationGesture {
            rotation: 0.0,
            velocity: 0.0,
            location: Point::zero(),
            state: GestureState::Possible,
        }
    }
}

impl Default for RotationGesture {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Swipe Gesture
// ============================================================================

/// Swipe direction
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SwipeDirection {
    Left,
    Right,
    Up,
    Down,
}

/// Swipe gesture
#[derive(Debug, Clone)]
pub struct SwipeGesture {
    /// Required swipe direction
    pub direction: SwipeDirection,
    /// Number of touches required
    pub touches_required: u32,
    /// Current location
    pub location: Point,
    /// Current state
    pub state: GestureState,
}

impl SwipeGesture {
    pub fn new(direction: SwipeDirection) -> Self {
        SwipeGesture {
            direction,
            touches_required: 1,
            location: Point::zero(),
            state: GestureState::Possible,
        }
    }

    pub fn left() -> Self {
        Self::new(SwipeDirection::Left)
    }

    pub fn right() -> Self {
        Self::new(SwipeDirection::Right)
    }

    pub fn up() -> Self {
        Self::new(SwipeDirection::Up)
    }

    pub fn down() -> Self {
        Self::new(SwipeDirection::Down)
    }

    pub fn touches(mut self, count: u32) -> Self {
        self.touches_required = count;
        self
    }
}

// ============================================================================
// Edge Pan Gesture
// ============================================================================

/// Screen edge from which to recognize pan
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ScreenEdge {
    Left,
    Right,
    Top,
    Bottom,
}

/// Edge pan gesture (swipe from screen edge)
#[derive(Debug, Clone)]
pub struct EdgePanGesture {
    /// Edge to recognize from
    pub edge: ScreenEdge,
    /// Current location
    pub location: Point,
    /// Translation from edge
    pub translation: Point,
    /// Current state
    pub state: GestureState,
}

impl EdgePanGesture {
    pub fn new(edge: ScreenEdge) -> Self {
        EdgePanGesture {
            edge,
            location: Point::zero(),
            translation: Point::zero(),
            state: GestureState::Possible,
        }
    }

    pub fn left() -> Self {
        Self::new(ScreenEdge::Left)
    }

    pub fn right() -> Self {
        Self::new(ScreenEdge::Right)
    }

    pub fn top() -> Self {
        Self::new(ScreenEdge::Top)
    }

    pub fn bottom() -> Self {
        Self::new(ScreenEdge::Bottom)
    }
}

// ============================================================================
// Gesture Modifiers
// ============================================================================

/// Gesture modifier for composing gestures
pub struct GestureModifier<G, F> {
    pub gesture: G,
    pub handler: F,
}

impl<G, F> GestureModifier<G, F> {
    pub fn new(gesture: G, handler: F) -> Self {
        GestureModifier { gesture, handler }
    }
}

/// Extension trait for adding gesture handlers to views
pub trait GestureExt: Sized {
    fn on_tap<F: Fn(Point) + Send + Sync + 'static>(self, handler: F) -> GestureModifier<Self, F>;
    fn on_double_tap<F: Fn(Point) + Send + Sync + 'static>(self, handler: F) -> GestureModifier<Self, F>;
    fn on_long_press<F: Fn(Point) + Send + Sync + 'static>(self, handler: F) -> GestureModifier<Self, F>;
    fn on_pan<F: Fn(PanGesture) + Send + Sync + 'static>(self, handler: F) -> GestureModifier<Self, F>;
    fn on_pinch<F: Fn(PinchGesture) + Send + Sync + 'static>(self, handler: F) -> GestureModifier<Self, F>;
    fn on_rotation<F: Fn(RotationGesture) + Send + Sync + 'static>(self, handler: F) -> GestureModifier<Self, F>;
    fn on_swipe<F: Fn(SwipeDirection) + Send + Sync + 'static>(self, direction: SwipeDirection, handler: F) -> GestureModifier<Self, F>;
}

// ============================================================================
// Drag and Drop
// ============================================================================

/// Drag item data
#[derive(Debug, Clone)]
pub struct DragItem {
    /// Item identifier
    pub id: String,
    /// Item data
    pub data: Vec<u8>,
    /// MIME type
    pub mime_type: String,
    /// Preview image
    pub preview: Option<Vec<u8>>,
}

impl DragItem {
    pub fn text(id: impl Into<String>, text: impl Into<String>) -> Self {
        let text = text.into();
        DragItem {
            id: id.into(),
            data: text.into_bytes(),
            mime_type: "text/plain".to_string(),
            preview: None,
        }
    }

    pub fn data(id: impl Into<String>, data: Vec<u8>, mime_type: impl Into<String>) -> Self {
        DragItem {
            id: id.into(),
            data,
            mime_type: mime_type.into(),
            preview: None,
        }
    }

    pub fn preview(mut self, preview: Vec<u8>) -> Self {
        self.preview = Some(preview);
        self
    }
}

/// Drop operation result
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DropOperation {
    Copy,
    Move,
    Cancel,
}

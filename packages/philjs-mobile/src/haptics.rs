//! PhilJS Mobile Haptics
//!
//! Haptic feedback for iOS and Android.

/// Haptic feedback generator
pub struct HapticFeedback;

impl HapticFeedback {
    /// Light impact feedback
    pub fn impact_light() {
        Self::impact(HapticStyle::Light);
    }

    /// Medium impact feedback
    pub fn impact_medium() {
        Self::impact(HapticStyle::Medium);
    }

    /// Heavy impact feedback
    pub fn impact_heavy() {
        Self::impact(HapticStyle::Heavy);
    }

    /// Soft impact feedback (iOS 13+)
    pub fn impact_soft() {
        Self::impact(HapticStyle::Soft);
    }

    /// Rigid impact feedback (iOS 13+)
    pub fn impact_rigid() {
        Self::impact(HapticStyle::Rigid);
    }

    /// Impact feedback with custom style
    pub fn impact(style: HapticStyle) {
        #[cfg(target_os = "ios")]
        {
            trigger_ios_impact(style);
        }
        #[cfg(target_os = "android")]
        {
            trigger_android_haptic(style);
        }
    }

    /// Selection changed feedback
    pub fn selection() {
        #[cfg(target_os = "ios")]
        {
            trigger_ios_selection();
        }
        #[cfg(target_os = "android")]
        {
            trigger_android_haptic(HapticStyle::Light);
        }
    }

    /// Success notification feedback
    pub fn notification_success() {
        Self::notification(NotificationHaptic::Success);
    }

    /// Warning notification feedback
    pub fn notification_warning() {
        Self::notification(NotificationHaptic::Warning);
    }

    /// Error notification feedback
    pub fn notification_error() {
        Self::notification(NotificationHaptic::Error);
    }

    /// Notification feedback with type
    pub fn notification(haptic_type: NotificationHaptic) {
        #[cfg(target_os = "ios")]
        {
            trigger_ios_notification(haptic_type);
        }
        #[cfg(target_os = "android")]
        {
            let style = match haptic_type {
                NotificationHaptic::Success => HapticStyle::Medium,
                NotificationHaptic::Warning => HapticStyle::Heavy,
                NotificationHaptic::Error => HapticStyle::Rigid,
            };
            trigger_android_haptic(style);
        }
    }

    /// Custom vibration pattern (Android)
    pub fn vibrate(pattern: &[u64]) {
        #[cfg(target_os = "android")]
        {
            vibrate_android(pattern);
        }
        #[cfg(not(target_os = "android"))]
        {
            // iOS doesn't support custom patterns, use impact instead
            let _ = pattern;
            Self::impact_medium();
        }
    }

    /// Check if haptics are supported
    pub fn is_supported() -> bool {
        #[cfg(target_os = "ios")]
        {
            // Would check UIDevice for Taptic Engine support
            true
        }
        #[cfg(target_os = "android")]
        {
            // Would check Vibrator.hasVibrator()
            true
        }
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            false
        }
    }
}

/// Haptic feedback style
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HapticStyle {
    /// Light impact
    Light,
    /// Medium impact
    Medium,
    /// Heavy impact
    Heavy,
    /// Soft impact (iOS 13+)
    Soft,
    /// Rigid impact (iOS 13+)
    Rigid,
}

/// Notification haptic type
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NotificationHaptic {
    /// Success feedback
    Success,
    /// Warning feedback
    Warning,
    /// Error feedback
    Error,
}

#[cfg(target_os = "ios")]
fn trigger_ios_impact(style: HapticStyle) {
    // Would use UIImpactFeedbackGenerator
    // let generator = UIImpactFeedbackGenerator::new(style);
    // generator.prepare();
    // generator.impactOccurred();
    let _ = style;
}

#[cfg(target_os = "ios")]
fn trigger_ios_selection() {
    // Would use UISelectionFeedbackGenerator
    // let generator = UISelectionFeedbackGenerator::new();
    // generator.prepare();
    // generator.selectionChanged();
}

#[cfg(target_os = "ios")]
fn trigger_ios_notification(haptic_type: NotificationHaptic) {
    // Would use UINotificationFeedbackGenerator
    // let generator = UINotificationFeedbackGenerator::new();
    // generator.prepare();
    // generator.notificationOccurred(haptic_type);
    let _ = haptic_type;
}

#[cfg(target_os = "android")]
fn trigger_android_haptic(style: HapticStyle) {
    // Would use VibrationEffect and Vibrator service
    // val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE)
    // val effect = when (style) {
    //     Light -> VibrationEffect.createOneShot(10, VibrationEffect.DEFAULT_AMPLITUDE)
    //     Medium -> VibrationEffect.createOneShot(20, VibrationEffect.DEFAULT_AMPLITUDE)
    //     Heavy -> VibrationEffect.createOneShot(30, VibrationEffect.DEFAULT_AMPLITUDE)
    // }
    // vibrator.vibrate(effect)
    let _ = style;
}

#[cfg(target_os = "android")]
fn vibrate_android(pattern: &[u64]) {
    // Would use Vibrator.vibrate(pattern, -1)
    let _ = pattern;
}

/// Haptic pattern for complex feedback
#[derive(Debug, Clone)]
pub struct HapticPattern {
    events: Vec<HapticEvent>,
}

#[derive(Debug, Clone)]
pub struct HapticEvent {
    /// Time offset from start
    pub time: f64,
    /// Event type
    pub event_type: HapticEventType,
}

#[derive(Debug, Clone)]
pub enum HapticEventType {
    /// Transient haptic (single tap)
    Transient {
        intensity: f32,
        sharpness: f32,
    },
    /// Continuous haptic
    Continuous {
        intensity: f32,
        sharpness: f32,
        duration: f64,
    },
}

impl HapticPattern {
    pub fn new() -> Self {
        HapticPattern { events: Vec::new() }
    }

    /// Add a transient event
    pub fn transient(mut self, time: f64, intensity: f32, sharpness: f32) -> Self {
        self.events.push(HapticEvent {
            time,
            event_type: HapticEventType::Transient { intensity, sharpness },
        });
        self
    }

    /// Add a continuous event
    pub fn continuous(
        mut self,
        time: f64,
        intensity: f32,
        sharpness: f32,
        duration: f64,
    ) -> Self {
        self.events.push(HapticEvent {
            time,
            event_type: HapticEventType::Continuous {
                intensity,
                sharpness,
                duration,
            },
        });
        self
    }

    /// Play the pattern (iOS 13+ with Core Haptics)
    pub fn play(&self) {
        #[cfg(target_os = "ios")]
        {
            // Would use CHHapticEngine and CHHapticPattern
            let _ = &self.events;
        }
        #[cfg(not(target_os = "ios"))]
        {
            // Fallback to simple vibration on Android
            HapticFeedback::impact_medium();
        }
    }
}

impl Default for HapticPattern {
    fn default() -> Self {
        Self::new()
    }
}

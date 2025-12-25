//! PhilJS Mobile Notifications
//!
//! Local and push notification handling.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, SystemTime};

// ============================================================================
// Local Notifications
// ============================================================================

/// Local notification configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalNotification {
    /// Unique identifier
    pub id: String,
    /// Notification title
    pub title: String,
    /// Notification body
    pub body: String,
    /// Subtitle (iOS only)
    pub subtitle: Option<String>,
    /// Badge number
    pub badge: Option<u32>,
    /// Sound name
    pub sound: Option<NotificationSound>,
    /// Custom data
    pub data: HashMap<String, String>,
    /// Category for actions
    pub category: Option<String>,
    /// Thread ID for grouping
    pub thread_id: Option<String>,
    /// When to show the notification
    pub trigger: NotificationTrigger,
}

impl LocalNotification {
    pub fn new(id: impl Into<String>, title: impl Into<String>, body: impl Into<String>) -> Self {
        LocalNotification {
            id: id.into(),
            title: title.into(),
            body: body.into(),
            subtitle: None,
            badge: None,
            sound: Some(NotificationSound::Default),
            data: HashMap::new(),
            category: None,
            thread_id: None,
            trigger: NotificationTrigger::Immediate,
        }
    }

    pub fn subtitle(mut self, subtitle: impl Into<String>) -> Self {
        self.subtitle = Some(subtitle.into());
        self
    }

    pub fn badge(mut self, badge: u32) -> Self {
        self.badge = Some(badge);
        self
    }

    pub fn sound(mut self, sound: NotificationSound) -> Self {
        self.sound = Some(sound);
        self
    }

    pub fn silent(mut self) -> Self {
        self.sound = None;
        self
    }

    pub fn data(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.data.insert(key.into(), value.into());
        self
    }

    pub fn category(mut self, category: impl Into<String>) -> Self {
        self.category = Some(category.into());
        self
    }

    pub fn thread(mut self, thread_id: impl Into<String>) -> Self {
        self.thread_id = Some(thread_id.into());
        self
    }

    pub fn trigger(mut self, trigger: NotificationTrigger) -> Self {
        self.trigger = trigger;
        self
    }

    /// Schedule the notification
    pub async fn schedule(&self) -> Result<(), NotificationError> {
        schedule_local_notification(self).await
    }

    /// Cancel this notification
    pub fn cancel(&self) {
        cancel_notification(&self.id);
    }
}

/// Notification sound
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NotificationSound {
    /// Default system sound
    Default,
    /// Named sound file
    Named(String),
    /// Critical alert (iOS - requires entitlement)
    Critical { volume: f32 },
}

/// When to trigger a notification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NotificationTrigger {
    /// Show immediately
    Immediate,
    /// Show at specific time
    Date(SystemTime),
    /// Show after interval
    Interval(Duration),
    /// Show on calendar date
    Calendar {
        year: Option<i32>,
        month: Option<u32>,
        day: Option<u32>,
        hour: Option<u32>,
        minute: Option<u32>,
        repeats: bool,
    },
    /// Show at location (iOS)
    Location {
        latitude: f64,
        longitude: f64,
        radius: f64,
        on_entry: bool,
        on_exit: bool,
    },
}

/// Schedule a local notification
async fn schedule_local_notification(_notification: &LocalNotification) -> Result<(), NotificationError> {
    #[cfg(target_os = "ios")]
    {
        // Would use UNUserNotificationCenter
    }
    #[cfg(target_os = "android")]
    {
        // Would use NotificationManager
    }
    Ok(())
}

/// Cancel a scheduled notification
pub fn cancel_notification(_id: &str) {
    #[cfg(target_os = "ios")]
    {
        // Would use UNUserNotificationCenter.removePendingNotificationRequests
    }
    #[cfg(target_os = "android")]
    {
        // Would use NotificationManager.cancel
    }
}

/// Cancel all scheduled notifications
pub fn cancel_all_notifications() {
    #[cfg(target_os = "ios")]
    {
        // Would use UNUserNotificationCenter.removeAllPendingNotificationRequests
    }
    #[cfg(target_os = "android")]
    {
        // Would use NotificationManager.cancelAll
    }
}

/// Get all pending notifications
pub async fn get_pending_notifications() -> Vec<LocalNotification> {
    Vec::new()
}

/// Set app badge number
pub fn set_badge_count(count: u32) {
    #[cfg(target_os = "ios")]
    {
        // Would use UIApplication.applicationIconBadgeNumber
        let _ = count;
    }
    #[cfg(target_os = "android")]
    {
        // Would use ShortcutBadger or similar
        let _ = count;
    }
}

/// Clear app badge
pub fn clear_badge() {
    set_badge_count(0);
}

// ============================================================================
// Push Notifications
// ============================================================================

/// Push notification payload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PushNotification {
    /// Notification title
    pub title: Option<String>,
    /// Notification body
    pub body: Option<String>,
    /// Badge count
    pub badge: Option<u32>,
    /// Sound
    pub sound: Option<String>,
    /// Custom data
    pub data: HashMap<String, serde_json::Value>,
    /// Whether shown in foreground
    pub content_available: bool,
    /// Mutable content (iOS)
    pub mutable_content: bool,
}

/// Push notification token
#[derive(Debug, Clone)]
pub struct PushToken {
    /// Token string
    pub token: String,
    /// Token type
    pub token_type: PushTokenType,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PushTokenType {
    /// Apple Push Notification service
    APNS,
    /// Firebase Cloud Messaging
    FCM,
}

/// Register for push notifications
pub async fn register_for_push() -> Result<PushToken, NotificationError> {
    #[cfg(target_os = "ios")]
    {
        // Would use UIApplication.registerForRemoteNotifications
        Err(NotificationError::NotSupported)
    }
    #[cfg(target_os = "android")]
    {
        // Would use FirebaseMessaging.getToken
        Err(NotificationError::NotSupported)
    }
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        Err(NotificationError::NotSupported)
    }
}

// ============================================================================
// Notification Handler
// ============================================================================

/// Notification event handler
pub struct NotificationHandler {
    on_received: Option<Arc<dyn Fn(PushNotification) + Send + Sync>>,
    on_opened: Option<Arc<dyn Fn(PushNotification) + Send + Sync>>,
    on_token: Option<Arc<dyn Fn(PushToken) + Send + Sync>>,
}

impl NotificationHandler {
    pub fn new() -> Self {
        NotificationHandler {
            on_received: None,
            on_opened: None,
            on_token: None,
        }
    }

    /// Called when notification received while app is in foreground
    pub fn on_received<F: Fn(PushNotification) + Send + Sync + 'static>(mut self, f: F) -> Self {
        self.on_received = Some(Arc::new(f));
        self
    }

    /// Called when user taps on notification
    pub fn on_opened<F: Fn(PushNotification) + Send + Sync + 'static>(mut self, f: F) -> Self {
        self.on_opened = Some(Arc::new(f));
        self
    }

    /// Called when push token is received/updated
    pub fn on_token<F: Fn(PushToken) + Send + Sync + 'static>(mut self, f: F) -> Self {
        self.on_token = Some(Arc::new(f));
        self
    }
}

impl Default for NotificationHandler {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Notification Actions
// ============================================================================

/// Notification action category
#[derive(Debug, Clone)]
pub struct NotificationCategory {
    pub id: String,
    pub actions: Vec<NotificationAction>,
}

impl NotificationCategory {
    pub fn new(id: impl Into<String>) -> Self {
        NotificationCategory {
            id: id.into(),
            actions: Vec::new(),
        }
    }

    pub fn action(mut self, action: NotificationAction) -> Self {
        self.actions.push(action);
        self
    }
}

/// Notification action button
#[derive(Debug, Clone)]
pub struct NotificationAction {
    pub id: String,
    pub title: String,
    pub destructive: bool,
    pub requires_auth: bool,
    pub foreground: bool,
}

impl NotificationAction {
    pub fn new(id: impl Into<String>, title: impl Into<String>) -> Self {
        NotificationAction {
            id: id.into(),
            title: title.into(),
            destructive: false,
            requires_auth: false,
            foreground: false,
        }
    }

    pub fn destructive(mut self) -> Self {
        self.destructive = true;
        self
    }

    pub fn requires_auth(mut self) -> Self {
        self.requires_auth = true;
        self
    }

    pub fn foreground(mut self) -> Self {
        self.foreground = true;
        self
    }
}

/// Register notification categories
pub fn register_categories(categories: Vec<NotificationCategory>) {
    #[cfg(target_os = "ios")]
    {
        // Would use UNUserNotificationCenter.setNotificationCategories
        let _ = categories;
    }
    #[cfg(target_os = "android")]
    {
        // Would create notification channels
        let _ = categories;
    }
}

// ============================================================================
// Errors
// ============================================================================

#[derive(Debug, Clone)]
pub enum NotificationError {
    PermissionDenied,
    NotSupported,
    SchedulingFailed(String),
    TokenError(String),
}

impl std::fmt::Display for NotificationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            NotificationError::PermissionDenied => write!(f, "Notification permission denied"),
            NotificationError::NotSupported => write!(f, "Notifications not supported"),
            NotificationError::SchedulingFailed(e) => write!(f, "Failed to schedule: {}", e),
            NotificationError::TokenError(e) => write!(f, "Token error: {}", e),
        }
    }
}

impl std::error::Error for NotificationError {}

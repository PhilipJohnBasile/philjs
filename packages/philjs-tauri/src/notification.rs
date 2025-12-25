//! Notification utilities for PhilJS Tauri

use tauri::AppHandle;
use crate::TauriError;

/// Notification builder
pub struct Notification {
    title: String,
    body: String,
    icon: Option<String>,
    sound: Option<String>,
}

impl Notification {
    pub fn new(title: impl Into<String>, body: impl Into<String>) -> Self {
        Notification {
            title: title.into(),
            body: body.into(),
            icon: None,
            sound: None,
        }
    }

    pub fn icon(mut self, icon: impl Into<String>) -> Self {
        self.icon = Some(icon.into());
        self
    }

    pub fn sound(mut self, sound: impl Into<String>) -> Self {
        self.sound = Some(sound.into());
        self
    }

    pub fn show(self, handle: &AppHandle) -> Result<(), TauriError> {
        // Would use tauri_plugin_notification
        let _ = handle;
        Ok(())
    }
}

/// Check if notifications are permitted
pub fn is_permission_granted() -> bool {
    // Would use tauri_plugin_notification
    true
}

/// Request notification permission
pub async fn request_permission() -> bool {
    // Would use tauri_plugin_notification
    true
}

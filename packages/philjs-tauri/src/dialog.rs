//! Dialog utilities for PhilJS Tauri

use tauri::AppHandle;
use crate::TauriError;

/// File dialog builder
pub struct FileDialog {
    title: Option<String>,
    default_path: Option<String>,
    filters: Vec<(String, Vec<String>)>,
    directory: bool,
    multiple: bool,
    save: bool,
}

impl FileDialog {
    pub fn new() -> Self {
        FileDialog {
            title: None,
            default_path: None,
            filters: Vec::new(),
            directory: false,
            multiple: false,
            save: false,
        }
    }

    pub fn title(mut self, title: impl Into<String>) -> Self {
        self.title = Some(title.into());
        self
    }

    pub fn default_path(mut self, path: impl Into<String>) -> Self {
        self.default_path = Some(path.into());
        self
    }

    pub fn filter(mut self, name: impl Into<String>, extensions: Vec<&str>) -> Self {
        self.filters.push((
            name.into(),
            extensions.into_iter().map(|s| s.to_string()).collect(),
        ));
        self
    }

    pub fn directory(mut self) -> Self {
        self.directory = true;
        self
    }

    pub fn multiple(mut self) -> Self {
        self.multiple = true;
        self
    }

    pub fn save(mut self) -> Self {
        self.save = true;
        self
    }

    pub async fn pick_file(self) -> Option<std::path::PathBuf> {
        // Would use tauri_plugin_dialog
        None
    }

    pub async fn pick_files(self) -> Option<Vec<std::path::PathBuf>> {
        // Would use tauri_plugin_dialog
        None
    }

    pub async fn pick_folder(self) -> Option<std::path::PathBuf> {
        // Would use tauri_plugin_dialog
        None
    }

    pub async fn save_file(self) -> Option<std::path::PathBuf> {
        // Would use tauri_plugin_dialog
        None
    }
}

impl Default for FileDialog {
    fn default() -> Self {
        Self::new()
    }
}

/// Message dialog
pub struct MessageDialog {
    title: String,
    message: String,
    dialog_type: MessageType,
    buttons: MessageButtons,
}

#[derive(Debug, Clone, Copy)]
pub enum MessageType {
    Info,
    Warning,
    Error,
}

#[derive(Debug, Clone, Copy)]
pub enum MessageButtons {
    Ok,
    OkCancel,
    YesNo,
    YesNoCancel,
}

impl MessageDialog {
    pub fn new(title: impl Into<String>, message: impl Into<String>) -> Self {
        MessageDialog {
            title: title.into(),
            message: message.into(),
            dialog_type: MessageType::Info,
            buttons: MessageButtons::Ok,
        }
    }

    pub fn info(title: impl Into<String>, message: impl Into<String>) -> Self {
        Self::new(title, message)
    }

    pub fn warning(title: impl Into<String>, message: impl Into<String>) -> Self {
        MessageDialog {
            dialog_type: MessageType::Warning,
            ..Self::new(title, message)
        }
    }

    pub fn error(title: impl Into<String>, message: impl Into<String>) -> Self {
        MessageDialog {
            dialog_type: MessageType::Error,
            ..Self::new(title, message)
        }
    }

    pub fn buttons(mut self, buttons: MessageButtons) -> Self {
        self.buttons = buttons;
        self
    }

    pub async fn show(self) -> bool {
        // Would use tauri_plugin_dialog
        true
    }
}

/// Convenience dialog functions
pub struct Dialog;

impl Dialog {
    pub fn file() -> FileDialog {
        FileDialog::new()
    }

    pub fn message(title: impl Into<String>, message: impl Into<String>) -> MessageDialog {
        MessageDialog::new(title, message)
    }

    pub async fn alert(title: impl Into<String>, message: impl Into<String>) {
        MessageDialog::info(title, message).show().await;
    }

    pub async fn confirm(title: impl Into<String>, message: impl Into<String>) -> bool {
        MessageDialog::new(title, message)
            .buttons(MessageButtons::YesNo)
            .show()
            .await
    }
}

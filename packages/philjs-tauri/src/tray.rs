//! System tray utilities for PhilJS Tauri

use crate::TauriError;
use crate::menu::Menu;

/// System tray icon
pub struct TrayIcon {
    id: String,
    tooltip: Option<String>,
    menu: Option<Menu>,
}

impl TrayIcon {
    pub fn new(id: impl Into<String>) -> Self {
        TrayIcon {
            id: id.into(),
            tooltip: None,
            menu: None,
        }
    }

    pub fn tooltip(mut self, tooltip: impl Into<String>) -> Self {
        self.tooltip = Some(tooltip.into());
        self
    }

    pub fn menu(mut self, menu: Menu) -> Self {
        self.menu = Some(menu);
        self
    }
}

/// Tray icon builder
pub struct TrayBuilder {
    icon: TrayIcon,
}

impl TrayBuilder {
    pub fn new(id: impl Into<String>) -> Self {
        TrayBuilder {
            icon: TrayIcon::new(id),
        }
    }

    pub fn tooltip(mut self, tooltip: impl Into<String>) -> Self {
        self.icon.tooltip = Some(tooltip.into());
        self
    }

    pub fn menu(mut self, menu: Menu) -> Self {
        self.icon.menu = Some(menu);
        self
    }

    pub fn build(self) -> Result<TrayIcon, TauriError> {
        Ok(self.icon)
    }
}

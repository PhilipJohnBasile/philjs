//! Window management for PhilJS Tauri

use crate::TauriError;
use tauri::{AppHandle, WebviewWindow, Wry};

/// Window wrapper
#[derive(Clone)]
pub struct Window {
    inner: WebviewWindow,
}

impl Window {
    pub fn new(window: WebviewWindow) -> Self {
        Window { inner: window }
    }

    /// Get the window label
    pub fn label(&self) -> &str {
        self.inner.label()
    }

    /// Show the window
    pub fn show(&self) -> Result<(), TauriError> {
        self.inner.show().map_err(|e| TauriError::Window(e.to_string()))
    }

    /// Hide the window
    pub fn hide(&self) -> Result<(), TauriError> {
        self.inner.hide().map_err(|e| TauriError::Window(e.to_string()))
    }

    /// Close the window
    pub fn close(&self) -> Result<(), TauriError> {
        self.inner.close().map_err(|e| TauriError::Window(e.to_string()))
    }

    /// Minimize the window
    pub fn minimize(&self) -> Result<(), TauriError> {
        self.inner.minimize().map_err(|e| TauriError::Window(e.to_string()))
    }

    /// Maximize the window
    pub fn maximize(&self) -> Result<(), TauriError> {
        self.inner.maximize().map_err(|e| TauriError::Window(e.to_string()))
    }

    /// Unmaximize the window
    pub fn unmaximize(&self) -> Result<(), TauriError> {
        self.inner.unmaximize().map_err(|e| TauriError::Window(e.to_string()))
    }

    /// Toggle maximize
    pub fn toggle_maximize(&self) -> Result<(), TauriError> {
        if self.is_maximized()? {
            self.unmaximize()
        } else {
            self.maximize()
        }
    }

    /// Check if maximized
    pub fn is_maximized(&self) -> Result<bool, TauriError> {
        self.inner.is_maximized().map_err(|e| TauriError::Window(e.to_string()))
    }

    /// Check if minimized
    pub fn is_minimized(&self) -> Result<bool, TauriError> {
        self.inner.is_minimized().map_err(|e| TauriError::Window(e.to_string()))
    }

    /// Check if visible
    pub fn is_visible(&self) -> Result<bool, TauriError> {
        self.inner.is_visible().map_err(|e| TauriError::Window(e.to_string()))
    }

    /// Check if focused
    pub fn is_focused(&self) -> Result<bool, TauriError> {
        self.inner.is_focused().map_err(|e| TauriError::Window(e.to_string()))
    }

    /// Set focus
    pub fn set_focus(&self) -> Result<(), TauriError> {
        self.inner.set_focus().map_err(|e| TauriError::Window(e.to_string()))
    }

    /// Set title
    pub fn set_title(&self, title: &str) -> Result<(), TauriError> {
        self.inner.set_title(title).map_err(|e| TauriError::Window(e.to_string()))
    }

    /// Set size
    pub fn set_size(&self, width: f64, height: f64) -> Result<(), TauriError> {
        use tauri::LogicalSize;
        self.inner
            .set_size(LogicalSize::new(width, height))
            .map_err(|e| TauriError::Window(e.to_string()))
    }

    /// Set min size
    pub fn set_min_size(&self, width: Option<f64>, height: Option<f64>) -> Result<(), TauriError> {
        use tauri::LogicalSize;
        let size = match (width, height) {
            (Some(w), Some(h)) => Some(LogicalSize::new(w, h)),
            _ => None,
        };
        self.inner
            .set_min_size(size)
            .map_err(|e| TauriError::Window(e.to_string()))
    }

    /// Set max size
    pub fn set_max_size(&self, width: Option<f64>, height: Option<f64>) -> Result<(), TauriError> {
        use tauri::LogicalSize;
        let size = match (width, height) {
            (Some(w), Some(h)) => Some(LogicalSize::new(w, h)),
            _ => None,
        };
        self.inner
            .set_max_size(size)
            .map_err(|e| TauriError::Window(e.to_string()))
    }

    /// Set position
    pub fn set_position(&self, x: f64, y: f64) -> Result<(), TauriError> {
        use tauri::LogicalPosition;
        self.inner
            .set_position(LogicalPosition::new(x, y))
            .map_err(|e| TauriError::Window(e.to_string()))
    }

    /// Center the window
    pub fn center(&self) -> Result<(), TauriError> {
        self.inner.center().map_err(|e| TauriError::Window(e.to_string()))
    }

    /// Set fullscreen
    pub fn set_fullscreen(&self, fullscreen: bool) -> Result<(), TauriError> {
        self.inner
            .set_fullscreen(fullscreen)
            .map_err(|e| TauriError::Window(e.to_string()))
    }

    /// Set always on top
    pub fn set_always_on_top(&self, always_on_top: bool) -> Result<(), TauriError> {
        self.inner
            .set_always_on_top(always_on_top)
            .map_err(|e| TauriError::Window(e.to_string()))
    }

    /// Set resizable
    pub fn set_resizable(&self, resizable: bool) -> Result<(), TauriError> {
        self.inner
            .set_resizable(resizable)
            .map_err(|e| TauriError::Window(e.to_string()))
    }

    /// Set decorations
    pub fn set_decorations(&self, decorations: bool) -> Result<(), TauriError> {
        self.inner
            .set_decorations(decorations)
            .map_err(|e| TauriError::Window(e.to_string()))
    }

    /// Open dev tools
    #[cfg(debug_assertions)]
    pub fn open_devtools(&self) {
        self.inner.open_devtools();
    }

    /// Close dev tools
    #[cfg(debug_assertions)]
    pub fn close_devtools(&self) {
        self.inner.close_devtools();
    }

    /// Check if devtools open
    #[cfg(debug_assertions)]
    pub fn is_devtools_open(&self) -> bool {
        self.inner.is_devtools_open()
    }

    /// Emit event to window
    pub fn emit(&self, event: &str, payload: impl serde::Serialize) -> Result<(), TauriError> {
        self.inner
            .emit(event, payload)
            .map_err(|e| TauriError::Window(e.to_string()))
    }

    /// Listen to events from window
    pub fn listen<F>(&self, event: &str, handler: F) -> tauri::EventId
    where
        F: Fn(tauri::Event) + Send + 'static,
    {
        self.inner.listen(event, handler)
    }

    /// Unlisten to event
    pub fn unlisten(&self, id: tauri::EventId) {
        self.inner.unlisten(id);
    }
}

/// Window configuration
#[derive(Debug, Clone)]
pub struct WindowConfig {
    pub label: String,
    pub title: String,
    pub url: String,
    pub width: f64,
    pub height: f64,
    pub min_width: Option<f64>,
    pub min_height: Option<f64>,
    pub max_width: Option<f64>,
    pub max_height: Option<f64>,
    pub x: Option<f64>,
    pub y: Option<f64>,
    pub center: bool,
    pub resizable: bool,
    pub fullscreen: bool,
    pub decorations: bool,
    pub transparent: bool,
    pub always_on_top: bool,
    pub visible: bool,
    pub focused: bool,
}

impl Default for WindowConfig {
    fn default() -> Self {
        WindowConfig {
            label: "main".to_string(),
            title: "PhilJS App".to_string(),
            url: "/".to_string(),
            width: 1024.0,
            height: 768.0,
            min_width: Some(400.0),
            min_height: Some(300.0),
            max_width: None,
            max_height: None,
            x: None,
            y: None,
            center: true,
            resizable: true,
            fullscreen: false,
            decorations: true,
            transparent: false,
            always_on_top: false,
            visible: true,
            focused: true,
        }
    }
}

impl WindowConfig {
    pub fn new(label: impl Into<String>) -> Self {
        WindowConfig {
            label: label.into(),
            ..Default::default()
        }
    }

    pub fn title(mut self, title: impl Into<String>) -> Self {
        self.title = title.into();
        self
    }

    pub fn url(mut self, url: impl Into<String>) -> Self {
        self.url = url.into();
        self
    }

    pub fn size(mut self, width: f64, height: f64) -> Self {
        self.width = width;
        self.height = height;
        self
    }

    pub fn min_size(mut self, width: f64, height: f64) -> Self {
        self.min_width = Some(width);
        self.min_height = Some(height);
        self
    }

    pub fn max_size(mut self, width: f64, height: f64) -> Self {
        self.max_width = Some(width);
        self.max_height = Some(height);
        self
    }

    pub fn position(mut self, x: f64, y: f64) -> Self {
        self.x = Some(x);
        self.y = Some(y);
        self.center = false;
        self
    }

    pub fn center(mut self) -> Self {
        self.center = true;
        self.x = None;
        self.y = None;
        self
    }

    pub fn resizable(mut self, resizable: bool) -> Self {
        self.resizable = resizable;
        self
    }

    pub fn fullscreen(mut self) -> Self {
        self.fullscreen = true;
        self
    }

    pub fn frameless(mut self) -> Self {
        self.decorations = false;
        self
    }

    pub fn transparent(mut self) -> Self {
        self.transparent = true;
        self
    }

    pub fn always_on_top(mut self) -> Self {
        self.always_on_top = true;
        self
    }

    pub fn hidden(mut self) -> Self {
        self.visible = false;
        self
    }
}

/// Window builder
pub struct WindowBuilder<'a> {
    handle: &'a AppHandle<Wry>,
    config: WindowConfig,
}

impl<'a> WindowBuilder<'a> {
    pub fn new(handle: &'a AppHandle<Wry>, config: WindowConfig) -> Self {
        WindowBuilder { handle, config }
    }

    pub fn build(self) -> Result<Window, TauriError> {
        use tauri::{LogicalPosition, LogicalSize, WebviewUrl, WebviewWindowBuilder};

        let mut builder = WebviewWindowBuilder::new(
            self.handle,
            &self.config.label,
            WebviewUrl::App(self.config.url.into()),
        )
        .title(&self.config.title)
        .inner_size(self.config.width, self.config.height)
        .resizable(self.config.resizable)
        .fullscreen(self.config.fullscreen)
        .decorations(self.config.decorations)
        .transparent(self.config.transparent)
        .always_on_top(self.config.always_on_top)
        .visible(self.config.visible)
        .focused(self.config.focused);

        if let (Some(min_w), Some(min_h)) = (self.config.min_width, self.config.min_height) {
            builder = builder.min_inner_size(min_w, min_h);
        }

        if let (Some(max_w), Some(max_h)) = (self.config.max_width, self.config.max_height) {
            builder = builder.max_inner_size(max_w, max_h);
        }

        if self.config.center {
            builder = builder.center();
        } else if let (Some(x), Some(y)) = (self.config.x, self.config.y) {
            builder = builder.position(x, y);
        }

        let window = builder
            .build()
            .map_err(|e| TauriError::Window(e.to_string()))?;

        Ok(Window::new(window))
    }
}

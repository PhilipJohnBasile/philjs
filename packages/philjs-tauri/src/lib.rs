//! PhilJS Tauri Integration
//!
//! Build cross-platform desktop applications using PhilJS and Tauri.
//! Combines the power of PhilJS's component model with Tauri's native capabilities.
//!
//! # Features
//!
//! - **Native Integration**: Access system APIs through Tauri commands
//! - **Type-Safe Commands**: Generate TypeScript bindings from Rust commands
//! - **Hot Reload**: Fast development with HMR support
//! - **Small Binaries**: Tauri's efficient bundling
//! - **Cross-Platform**: Windows, macOS, Linux from one codebase
//!
//! # Example
//!
//! ```rust,ignore
//! use philjs_tauri::prelude::*;
//!
//! #[tauri::command]
//! fn greet(name: &str) -> String {
//!     format!("Hello, {}!", name)
//! }
//!
//! fn main() {
//!     philjs_tauri::Builder::new()
//!         .invoke_handler(tauri::generate_handler![greet])
//!         .run()
//!         .expect("error running tauri application");
//! }
//! ```

pub mod commands;
pub mod window;
pub mod tray;
pub mod menu;
pub mod dialog;
pub mod clipboard;
pub mod notification;
pub mod fs;
pub mod process;
pub mod shell;
pub mod updater;
pub mod state;

pub mod prelude {
    pub use crate::{
        Builder, PhilJSApp, TauriConfig,
        commands::*,
        window::{Window, WindowBuilder, WindowConfig},
        tray::{TrayIcon, TrayBuilder},
        menu::{Menu, MenuItem, MenuBuilder},
        dialog::{Dialog, FileDialog, MessageDialog},
        clipboard::Clipboard,
        notification::Notification,
    };
    pub use tauri::{self, AppHandle, Manager, State, Wry};
}

use std::sync::Arc;
use tauri::{App, AppHandle, Manager, Wry};

/// PhilJS Tauri application builder
pub struct Builder {
    title: String,
    config: TauriConfig,
    setup_hook: Option<Box<dyn FnOnce(&mut App<Wry>) -> Result<(), Box<dyn std::error::Error>> + Send>>,
    invoke_handler: Option<Box<dyn Fn(tauri::Invoke<Wry>) + Send + Sync>>,
}

impl Builder {
    pub fn new() -> Self {
        Builder {
            title: "PhilJS App".to_string(),
            config: TauriConfig::default(),
            setup_hook: None,
            invoke_handler: None,
        }
    }

    /// Set the application title
    pub fn title(mut self, title: impl Into<String>) -> Self {
        self.title = title.into();
        self
    }

    /// Set custom configuration
    pub fn config(mut self, config: TauriConfig) -> Self {
        self.config = config;
        self
    }

    /// Set the setup hook
    pub fn setup<F>(mut self, f: F) -> Self
    where
        F: FnOnce(&mut App<Wry>) -> Result<(), Box<dyn std::error::Error>> + Send + 'static,
    {
        self.setup_hook = Some(Box::new(f));
        self
    }

    /// Set the invoke handler for Tauri commands
    pub fn invoke_handler<F>(mut self, handler: F) -> Self
    where
        F: Fn(tauri::Invoke<Wry>) + Send + Sync + 'static,
    {
        self.invoke_handler = Some(Box::new(handler));
        self
    }

    /// Build and run the application
    pub fn run(self) -> Result<(), TauriError> {
        let mut builder = tauri::Builder::default();

        // Add default plugins
        builder = builder
            .plugin(tauri_plugin_shell::init())
            .plugin(tauri_plugin_dialog::init())
            .plugin(tauri_plugin_fs::init())
            .plugin(tauri_plugin_notification::init())
            .plugin(tauri_plugin_clipboard_manager::init())
            .plugin(tauri_plugin_process::init())
            .plugin(tauri_plugin_os::init());

        // Add setup hook
        if let Some(setup) = self.setup_hook {
            builder = builder.setup(move |app| {
                setup(app)
            });
        }

        // Add invoke handler
        if let Some(handler) = self.invoke_handler {
            builder = builder.invoke_handler(handler);
        }

        builder
            .run(tauri::generate_context!())
            .map_err(|e| TauriError::Runtime(e.to_string()))
    }
}

impl Default for Builder {
    fn default() -> Self {
        Self::new()
    }
}

/// PhilJS Tauri application handle
#[derive(Clone)]
pub struct PhilJSApp {
    handle: AppHandle<Wry>,
}

impl PhilJSApp {
    pub fn new(handle: AppHandle<Wry>) -> Self {
        PhilJSApp { handle }
    }

    /// Get the Tauri app handle
    pub fn handle(&self) -> &AppHandle<Wry> {
        &self.handle
    }

    /// Get a window by label
    pub fn get_window(&self, label: &str) -> Option<window::Window> {
        self.handle
            .get_webview_window(label)
            .map(window::Window::new)
    }

    /// Get the main window
    pub fn main_window(&self) -> Option<window::Window> {
        self.get_window("main")
    }

    /// Create a new window
    pub fn create_window(&self, config: window::WindowConfig) -> Result<window::Window, TauriError> {
        window::WindowBuilder::new(&self.handle, config).build()
    }

    /// Show a notification
    pub fn notify(&self, title: &str, body: &str) -> Result<(), TauriError> {
        notification::Notification::new(title, body).show(&self.handle)
    }

    /// Access the clipboard
    pub fn clipboard(&self) -> clipboard::Clipboard {
        clipboard::Clipboard::new(self.handle.clone())
    }

    /// Exit the application
    pub fn exit(&self, code: i32) {
        self.handle.exit(code);
    }

    /// Restart the application
    pub fn restart(&self) {
        self.handle.restart();
    }
}

/// Tauri configuration
#[derive(Debug, Clone)]
pub struct TauriConfig {
    /// Window configuration
    pub window: window::WindowConfig,
    /// Enable dev tools in release
    pub dev_tools: bool,
    /// Enable system tray
    pub system_tray: bool,
    /// Single instance mode
    pub single_instance: bool,
}

impl Default for TauriConfig {
    fn default() -> Self {
        TauriConfig {
            window: window::WindowConfig::default(),
            dev_tools: cfg!(debug_assertions),
            system_tray: false,
            single_instance: true,
        }
    }
}

/// Tauri error types
#[derive(Debug, thiserror::Error)]
pub enum TauriError {
    #[error("Runtime error: {0}")]
    Runtime(String),
    #[error("Window error: {0}")]
    Window(String),
    #[error("Command error: {0}")]
    Command(String),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}

/// Initialize PhilJS Tauri with default settings
pub fn init() -> Builder {
    Builder::new()
}

/// Create a typed state container
pub fn create_state<T: Send + Sync + 'static>(value: T) -> state::ManagedState<T> {
    state::ManagedState::new(value)
}

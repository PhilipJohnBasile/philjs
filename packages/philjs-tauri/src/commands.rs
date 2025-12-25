//! Tauri command utilities for PhilJS

use serde::{Deserialize, Serialize};

/// Command result type
pub type CommandResult<T> = Result<T, CommandError>;

/// Command error type
#[derive(Debug, Clone, Serialize, Deserialize, thiserror::Error)]
pub enum CommandError {
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Invalid input: {0}")]
    InvalidInput(String),
    #[error("Unauthorized: {0}")]
    Unauthorized(String),
    #[error("Internal error: {0}")]
    Internal(String),
}

impl From<std::io::Error> for CommandError {
    fn from(e: std::io::Error) -> Self {
        CommandError::Internal(e.to_string())
    }
}

impl From<serde_json::Error> for CommandError {
    fn from(e: serde_json::Error) -> Self {
        CommandError::InvalidInput(e.to_string())
    }
}

// Re-export the command macro
pub use tauri::command;

/// Helper macro for creating typed commands
#[macro_export]
macro_rules! philjs_command {
    (
        $(#[$attr:meta])*
        async fn $name:ident($($arg:ident: $type:ty),*) -> $ret:ty $body:block
    ) => {
        $(#[$attr])*
        #[tauri::command]
        pub async fn $name($($arg: $type),*) -> Result<$ret, $crate::commands::CommandError> {
            $body
        }
    };
    (
        $(#[$attr:meta])*
        fn $name:ident($($arg:ident: $type:ty),*) -> $ret:ty $body:block
    ) => {
        $(#[$attr])*
        #[tauri::command]
        pub fn $name($($arg: $type),*) -> Result<$ret, $crate::commands::CommandError> {
            $body
        }
    };
}

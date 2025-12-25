//! CLI Commands for cargo-philjs
//!
//! This module contains all the command implementations for the PhilJS CLI.
//! Each command is designed to provide the best possible developer experience.

pub mod new;
pub mod init;
pub mod dev;
pub mod build;
pub mod check;
pub mod generate;
pub mod test;
pub mod deploy;
pub mod add;
pub mod update;
pub mod info;
pub mod clean;

// Re-export common utilities for commands
pub use crate::utils::{command_exists, project_root, is_philjs_project};
pub use crate::config::Config;

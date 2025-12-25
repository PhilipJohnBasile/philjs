//! Utility functions

use std::path::Path;
use std::process::Command;

/// Check if a command is available
pub fn command_exists(cmd: &str) -> bool {
    which::which(cmd).is_ok()
}

/// Run a command and return its output
pub fn run_command(cmd: &str, args: &[&str]) -> anyhow::Result<String> {
    let output = Command::new(cmd).args(args).output()?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(anyhow::anyhow!(
            "Command failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ))
    }
}

/// Get the project root directory
pub fn project_root() -> Option<std::path::PathBuf> {
    let mut current = std::env::current_dir().ok()?;

    loop {
        if current.join("Cargo.toml").exists() {
            return Some(current);
        }

        if !current.pop() {
            return None;
        }
    }
}

/// Check if we're in a PhilJS project
pub fn is_philjs_project() -> bool {
    if let Some(root) = project_root() {
        let cargo_path = root.join("Cargo.toml");
        if let Ok(content) = std::fs::read_to_string(cargo_path) {
            return content.contains("philjs");
        }
    }
    false
}

/// Convert PascalCase to snake_case
pub fn to_snake_case(s: &str) -> String {
    let mut result = String::new();
    for (i, c) in s.chars().enumerate() {
        if c.is_uppercase() && i > 0 {
            result.push('_');
        }
        result.push(c.to_lowercase().next().unwrap());
    }
    result
}

/// Convert snake_case to PascalCase
pub fn to_pascal_case(s: &str) -> String {
    s.split('_')
        .map(|word| {
            let mut chars = word.chars();
            match chars.next() {
                None => String::new(),
                Some(first) => first.to_uppercase().chain(chars).collect(),
            }
        })
        .collect()
}

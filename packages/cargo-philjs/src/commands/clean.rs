//! Clean build artifacts
//!
//! Removes build outputs and caches.

use anyhow::Result;
use colored::Colorize;
use std::fs;
use std::path::Path;

/// Run clean command
pub fn run(all: bool) -> Result<()> {
    println!("\n{}  Cleaning build artifacts...\n", "[clean]".cyan().bold());

    let dirs_to_clean = if all {
        vec![
            "target",
            "dist",
            "pkg",
            "node_modules",
            ".philjs",
            ".wasm-pack-cache",
        ]
    } else {
        vec!["target", "dist", "pkg", ".philjs"]
    };

    let mut total_freed = 0u64;

    for dir in dirs_to_clean {
        let path = Path::new(dir);
        if path.exists() {
            // Calculate size before removing
            let size = dir_size(path).unwrap_or(0);
            total_freed += size;

            fs::remove_dir_all(path)?;
            println!(
                "  {}  Removed {} ({})",
                "[ok]".green(),
                dir,
                format_size(size).dimmed()
            );
        }
    }

    // Also clean Cargo cache for this project if --all
    if all {
        println!();
        println!("{}  Running cargo clean...", "[clean]".cyan().bold());
        std::process::Command::new("cargo")
            .args(["clean"])
            .status()?;
    }

    println!();
    if total_freed > 0 {
        println!(
            "{}  Cleaned up {}",
            "[done]".green().bold(),
            format_size(total_freed).cyan()
        );
    } else {
        println!(
            "{}  Nothing to clean",
            "[done]".green().bold()
        );
    }
    println!();

    Ok(())
}

/// Calculate directory size
fn dir_size(path: &Path) -> Result<u64> {
    let mut total = 0u64;

    for entry in walkdir::WalkDir::new(path) {
        let entry = entry?;
        if entry.file_type().is_file() {
            total += entry.metadata()?.len();
        }
    }

    Ok(total)
}

/// Format size in human-readable form
fn format_size(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if bytes >= GB {
        format!("{:.2} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.2} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} bytes", bytes)
    }
}

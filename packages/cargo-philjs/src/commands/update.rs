//! Update dependencies
//!
//! Updates PhilJS and related dependencies to the latest versions.

use anyhow::{Context, Result};
use colored::Colorize;
use std::process::Command;

/// Run update command
pub fn run(all: bool, check_only: bool) -> Result<()> {
    println!("\n{}  Checking for updates...\n", "[update]".cyan().bold());

    if check_only {
        check_updates(all)?;
    } else {
        perform_update(all)?;
    }

    Ok(())
}

/// Check for available updates
fn check_updates(all: bool) -> Result<()> {
    // Check cargo-outdated
    if which::which("cargo-outdated").is_err() {
        println!(
            "{}  Installing cargo-outdated for update checks...",
            "[setup]".yellow().bold()
        );
        Command::new("cargo")
            .args(["install", "cargo-outdated"])
            .status()
            .context("Failed to install cargo-outdated")?;
    }

    let mut args = vec!["outdated"];
    if !all {
        args.extend(["--root-deps-only"]);
    }

    println!("{}  Checking for outdated dependencies...\n", "[check]".cyan().bold());

    let output = Command::new("cargo")
        .args(&args)
        .output()
        .context("Failed to run cargo outdated")?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        if stdout.trim().is_empty() || stdout.contains("All dependencies are up to date") {
            println!(
                "{}  All dependencies are up to date!\n",
                "[ok]".green().bold()
            );
        } else {
            println!("{}", stdout);
            println!();
            println!(
                "  Run {} to update.",
                "cargo philjs update".cyan()
            );
            println!();
        }
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        println!(
            "{}  Failed to check updates: {}",
            "[error]".red().bold(),
            stderr
        );
    }

    Ok(())
}

/// Perform the update
fn perform_update(all: bool) -> Result<()> {
    if all {
        println!("{}  Updating all dependencies...\n", "[update]".cyan().bold());

        // Update Cargo.lock
        Command::new("cargo")
            .args(["update"])
            .status()
            .context("Failed to run cargo update")?;
    } else {
        println!("{}  Updating PhilJS dependencies...\n", "[update]".cyan().bold());

        // Update only philjs-related packages
        let packages = [
            "philjs",
            "philjs-macros",
            "wasm-bindgen",
            "wasm-bindgen-futures",
            "web-sys",
            "js-sys",
        ];

        for pkg in packages {
            let result = Command::new("cargo")
                .args(["update", "-p", pkg])
                .output();

            match result {
                Ok(output) if output.status.success() => {
                    println!("  {}  Updated {}", "[ok]".green(), pkg);
                }
                _ => {
                    // Package might not be in dependencies, that's okay
                }
            }
        }
    }

    println!();

    // Check for new tools
    update_tools()?;

    println!(
        "\n{}  Dependencies updated successfully!\n",
        "[done]".green().bold()
    );

    Ok(())
}

/// Update CLI tools
fn update_tools() -> Result<()> {
    println!("{}  Checking tools...", "[tools]".cyan().bold());

    // Check wasm-pack version
    if let Ok(output) = Command::new("wasm-pack").args(["--version"]).output() {
        let version = String::from_utf8_lossy(&output.stdout);
        println!("  {}  wasm-pack: {}", "[ok]".green(), version.trim());
    }

    // Check wasm32 target
    let rustup_output = Command::new("rustup")
        .args(["target", "list", "--installed"])
        .output()?;

    let installed_targets = String::from_utf8_lossy(&rustup_output.stdout);
    if installed_targets.contains("wasm32-unknown-unknown") {
        println!("  {}  wasm32-unknown-unknown target installed", "[ok]".green());
    } else {
        println!(
            "  {}  Adding wasm32-unknown-unknown target...",
            "[setup]".yellow()
        );
        Command::new("rustup")
            .args(["target", "add", "wasm32-unknown-unknown"])
            .status()?;
    }

    Ok(())
}

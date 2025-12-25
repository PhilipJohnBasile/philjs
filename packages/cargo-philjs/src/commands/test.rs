//! Test commands
//!
//! Run tests for PhilJS projects with support for WASM testing.

use anyhow::{Context, Result};
use colored::Colorize;
use std::process::{Command, Stdio};

/// Run tests
pub fn run(watch: bool, browser: bool, coverage: bool, pattern: Option<&str>) -> Result<()> {
    println!("\n{}  Running tests...\n", "[test]".cyan().bold());

    if browser {
        run_browser_tests(pattern)?;
    } else {
        run_cargo_tests(watch, coverage, pattern)?;
    }

    Ok(())
}

/// Run cargo tests
fn run_cargo_tests(watch: bool, coverage: bool, pattern: Option<&str>) -> Result<()> {
    if watch {
        // Check for cargo-watch
        if which::which("cargo-watch").is_err() {
            println!(
                "{}  Installing cargo-watch...",
                "[setup]".yellow().bold()
            );
            Command::new("cargo")
                .args(["install", "cargo-watch"])
                .status()
                .context("Failed to install cargo-watch")?;
        }

        let mut args = vec!["watch", "-x"];
        let test_cmd = if let Some(p) = pattern {
            format!("test {}", p)
        } else {
            "test".to_string()
        };
        args.push(&test_cmd);

        println!("{}  Watching for changes...\n", "[watch]".cyan().bold());

        Command::new("cargo")
            .args(&args)
            .status()
            .context("Failed to run cargo watch")?;
    } else if coverage {
        // Check for cargo-tarpaulin or llvm-cov
        if which::which("cargo-tarpaulin").is_ok() {
            let mut args = vec!["tarpaulin", "--out", "Html"];
            if let Some(p) = pattern {
                args.extend(["--", p]);
            }

            println!("{}  Running with coverage (tarpaulin)...\n", "[test]".cyan().bold());

            Command::new("cargo")
                .args(&args)
                .status()
                .context("Failed to run cargo tarpaulin")?;

            println!(
                "\n{}  Coverage report: {}",
                "[done]".green().bold(),
                "tarpaulin-report.html".cyan()
            );
        } else {
            println!(
                "{}  Install coverage tool: {}",
                "[info]".yellow().bold(),
                "cargo install cargo-tarpaulin".cyan()
            );

            // Fallback to regular tests
            run_regular_tests(pattern)?;
        }
    } else {
        run_regular_tests(pattern)?;
    }

    Ok(())
}

/// Run regular cargo tests
fn run_regular_tests(pattern: Option<&str>) -> Result<()> {
    let mut args = vec!["test"];

    if let Some(p) = pattern {
        args.push(p);
    }

    // Add nice output
    args.extend(["--", "--color=always"]);

    let status = Command::new("cargo")
        .args(&args)
        .status()
        .context("Failed to run cargo test")?;

    if status.success() {
        println!("\n{}  All tests passed!\n", "[done]".green().bold());
    } else {
        println!("\n{}  Some tests failed.\n", "[fail]".red().bold());
    }

    Ok(())
}

/// Run browser/WASM tests
fn run_browser_tests(pattern: Option<&str>) -> Result<()> {
    // Check for wasm-pack
    if which::which("wasm-pack").is_err() {
        println!(
            "{}  Installing wasm-pack...",
            "[setup]".yellow().bold()
        );
        Command::new("cargo")
            .args(["install", "wasm-pack"])
            .status()
            .context("Failed to install wasm-pack")?;
    }

    println!("{}  Running browser tests...\n", "[test]".cyan().bold());

    let mut args = vec!["test", "--headless"];

    // Try Chrome first, then Firefox
    if which::which("chromedriver").is_ok() || which::which("chrome").is_ok() {
        args.push("--chrome");
        println!("  Using Chrome...");
    } else if which::which("geckodriver").is_ok() || which::which("firefox").is_ok() {
        args.push("--firefox");
        println!("  Using Firefox...");
    } else {
        println!(
            "{}  No browser found. Install Chrome or Firefox for browser tests.",
            "[warn]".yellow().bold()
        );
        args.push("--node");
        println!("  Falling back to Node.js...");
    }

    let status = Command::new("wasm-pack")
        .args(&args)
        .status()
        .context("Failed to run wasm-pack test")?;

    if status.success() {
        println!("\n{}  Browser tests passed!\n", "[done]".green().bold());
    } else {
        println!("\n{}  Browser tests failed.\n", "[fail]".red().bold());
    }

    Ok(())
}

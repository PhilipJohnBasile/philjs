//! Type checking and linting command
//!
//! Provides comprehensive code quality checks for PhilJS projects.

use anyhow::{Context, Result};
use colored::Colorize;
use indicatif::{ProgressBar, ProgressStyle};
use std::process::Command;
use std::time::Instant;

/// Run type checking and linting
pub fn run(clippy: bool, fmt: bool, fix: bool) -> Result<()> {
    let start = Instant::now();

    println!(
        "\n{}  Checking PhilJS project...\n",
        "[check]".cyan().bold()
    );

    let pb = ProgressBar::new_spinner();
    pb.set_style(
        ProgressStyle::default_spinner()
            .template("{spinner:.cyan} {msg}")
            .unwrap(),
    );

    let mut has_errors = false;
    let mut checks_run = 0;

    // Run cargo check for WASM target
    pb.set_message("Type checking Rust code...");
    pb.enable_steady_tick(std::time::Duration::from_millis(100));

    let check_result = run_cargo_check()?;
    checks_run += 1;

    if !check_result {
        has_errors = true;
        pb.finish_with_message("Type check failed".red().to_string());
    } else {
        pb.finish_with_message("Type check passed".green().to_string());
    }

    // Run clippy if requested or by default for comprehensive checks
    if clippy || !fmt {
        println!();
        let pb = ProgressBar::new_spinner();
        pb.set_style(
            ProgressStyle::default_spinner()
                .template("{spinner:.cyan} {msg}")
                .unwrap(),
        );
        pb.set_message("Running clippy lints...");
        pb.enable_steady_tick(std::time::Duration::from_millis(100));

        let clippy_result = run_clippy(fix)?;
        checks_run += 1;

        if !clippy_result {
            has_errors = true;
            pb.finish_with_message("Clippy found issues".yellow().to_string());
        } else {
            pb.finish_with_message("Clippy passed".green().to_string());
        }
    }

    // Run format check if requested
    if fmt {
        println!();
        let pb = ProgressBar::new_spinner();
        pb.set_style(
            ProgressStyle::default_spinner()
                .template("{spinner:.cyan} {msg}")
                .unwrap(),
        );
        pb.set_message("Checking formatting...");
        pb.enable_steady_tick(std::time::Duration::from_millis(100));

        let fmt_result = run_fmt_check(fix)?;
        checks_run += 1;

        if !fmt_result {
            has_errors = true;
            pb.finish_with_message("Format issues found".yellow().to_string());
        } else {
            pb.finish_with_message("Format check passed".green().to_string());
        }
    }

    // Check WASM target
    println!();
    let pb = ProgressBar::new_spinner();
    pb.set_style(
        ProgressStyle::default_spinner()
            .template("{spinner:.cyan} {msg}")
            .unwrap(),
    );
    pb.set_message("Checking WASM compilation...");
    pb.enable_steady_tick(std::time::Duration::from_millis(100));

    let wasm_result = run_wasm_check()?;
    checks_run += 1;

    if !wasm_result {
        has_errors = true;
        pb.finish_with_message("WASM check failed".red().to_string());
    } else {
        pb.finish_with_message("WASM check passed".green().to_string());
    }

    let elapsed = start.elapsed();

    println!();
    if has_errors {
        println!(
            "{}  Some checks failed. Run with --fix to auto-fix issues where possible.\n",
            "[!]".yellow().bold()
        );
    } else {
        println!(
            "{}  All {} checks passed in {:.2}s\n",
            "[ok]".green().bold(),
            checks_run,
            elapsed.as_secs_f64()
        );
    }

    if has_errors {
        anyhow::bail!("Check failed");
    }

    Ok(())
}

/// Run cargo check
fn run_cargo_check() -> Result<bool> {
    let status = Command::new("cargo")
        .args(["check", "--lib", "--all-features"])
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .status()
        .context("Failed to run cargo check")?;

    Ok(status.success())
}

/// Run clippy
fn run_clippy(fix: bool) -> Result<bool> {
    let mut args = vec![
        "clippy",
        "--all-targets",
        "--all-features",
        "--",
        "-D",
        "warnings",
        "-W",
        "clippy::all",
        "-W",
        "clippy::pedantic",
        "-A",
        "clippy::module_name_repetitions",
        "-A",
        "clippy::too_many_arguments",
        "-A",
        "clippy::must_use_candidate",
    ];

    if fix {
        args.insert(1, "--fix");
        args.insert(2, "--allow-dirty");
        args.insert(3, "--allow-staged");
    }

    let status = Command::new("cargo")
        .args(&args)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .status()
        .context("Failed to run clippy")?;

    Ok(status.success())
}

/// Run format check
fn run_fmt_check(fix: bool) -> Result<bool> {
    let args = if fix {
        vec!["fmt"]
    } else {
        vec!["fmt", "--check"]
    };

    let status = Command::new("cargo")
        .args(&args)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .status()
        .context("Failed to run cargo fmt")?;

    Ok(status.success())
}

/// Check WASM compilation
fn run_wasm_check() -> Result<bool> {
    let status = Command::new("cargo")
        .args([
            "check",
            "--lib",
            "--target",
            "wasm32-unknown-unknown",
        ])
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .status()
        .context("Failed to check WASM target")?;

    Ok(status.success())
}

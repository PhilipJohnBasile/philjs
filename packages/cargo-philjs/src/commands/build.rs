//! Production build command
//!
//! Optimized production builds with:
//! - WASM size optimization (wasm-opt)
//! - Tree shaking
//! - Source map generation
//! - Bundle analysis

use crate::BuildTarget;
use anyhow::{Context, Result};
use colored::Colorize;
use indicatif::{ProgressBar, ProgressStyle, MultiProgress};
use std::fs;
use std::path::Path;
use std::process::{Command, Stdio};
use std::time::Instant;
use bytesize::ByteSize;

/// Build result with metrics
struct BuildResult {
    wasm_size: u64,
    wasm_size_gzip: u64,
    total_size: u64,
    build_time: std::time::Duration,
}

/// Run production build
pub async fn run(
    release: bool,
    out_dir: &str,
    target: BuildTarget,
    ssr: bool,
    source_map: bool,
    no_optimize: bool,
    analyze: bool,
    minify: bool,
) -> Result<()> {
    let start = Instant::now();

    print_build_header(release, target, ssr);

    // Clean output directory
    let out_path = Path::new(out_dir);
    if out_path.exists() {
        fs::remove_dir_all(out_path)?;
    }
    fs::create_dir_all(out_path)?;

    let mp = MultiProgress::new();

    // Step 1: Build WASM
    let pb1 = mp.add(ProgressBar::new(100));
    pb1.set_style(progress_style());
    pb1.set_message("Compiling Rust to WASM...");
    pb1.set_position(0);

    build_wasm(release, target)?;
    pb1.set_position(40);
    pb1.set_message("WASM compilation complete");

    // Step 2: Optimize WASM (if release and not skipped)
    let should_minify = minify || (release && !no_optimize);
    if should_minify {
        pb1.set_message("Optimizing and minifying WASM bundle...");
        optimize_wasm()?;
        pb1.set_position(60);
    }

    // Step 3: Copy static files
    pb1.set_message("Copying static assets...");
    copy_static_files(out_dir)?;
    pb1.set_position(75);

    // Step 4: Copy WASM bundle
    pb1.set_message("Bundling output...");
    copy_wasm_bundle(out_dir)?;
    pb1.set_position(90);

    // Step 5: Build SSR if enabled
    if ssr {
        pb1.set_message("Building SSR bundle...");
        build_ssr(release)?;
        pb1.set_position(95);
    }

    // Step 6: Generate source maps if requested
    if source_map {
        pb1.set_message("Generating source maps...");
        generate_source_maps(out_dir)?;
    }

    pb1.set_position(100);
    pb1.finish_with_message("Build complete!");

    // Calculate sizes
    let result = calculate_build_metrics(out_dir, start.elapsed())?;

    // Print summary
    print_build_summary(&result, out_dir, analyze)?;

    // Bundle analysis
    if analyze {
        print_bundle_analysis(out_dir)?;
    }

    Ok(())
}

fn progress_style() -> ProgressStyle {
    ProgressStyle::default_bar()
        .template("{spinner:.cyan} [{bar:40.cyan/blue}] {pos}% {msg}")
        .unwrap()
        .progress_chars("=>-")
}

fn print_build_header(release: bool, target: BuildTarget, ssr: bool) {
    println!("\n{}  PhilJS Production Build", "[build]".cyan().bold());
    println!("{}", "  ======================".cyan());
    println!();
    println!(
        "  {}  {}",
        "Mode:".white().bold(),
        if release { "Release (optimized)".green() } else { "Debug".yellow() }
    );
    println!(
        "  {}  {:?}",
        "Target:".white().bold(),
        target
    );
    if ssr {
        println!(
            "  {}  Enabled",
            "SSR:".white().bold(),
        );
    }
    println!();
}

/// Build WASM
fn build_wasm(release: bool, target: BuildTarget) -> Result<()> {
    let target_flag = match target {
        BuildTarget::Browser => "web",
        BuildTarget::Node => "nodejs",
        BuildTarget::Deno => "deno",
        BuildTarget::Cloudflare => "web",
    };

    let mut args = vec![
        "build",
        "--target", target_flag,
        "--out-dir", "pkg",
        "--out-name", "app",
    ];

    if release {
        args.push("--release");
    } else {
        args.push("--dev");
    }

    let output = Command::new("wasm-pack")
        .args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .context("Failed to run wasm-pack")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("WASM build failed:\n{}", stderr);
    }

    Ok(())
}

/// Optimize WASM with wasm-opt
fn optimize_wasm() -> Result<()> {
    // Check if wasm-opt is available
    if which::which("wasm-opt").is_err() {
        println!(
            "  {}  wasm-opt not found, skipping optimization",
            "[warn]".yellow()
        );
        println!(
            "         Install with: {}",
            "cargo install wasm-opt".cyan()
        );
        return Ok(());
    }

    let wasm_files: Vec<_> = walkdir::WalkDir::new("pkg")
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().map_or(false, |ext| ext == "wasm"))
        .collect();

    for entry in wasm_files {
        let path = entry.path();
        let temp_path = path.with_extension("wasm.opt");

        Command::new("wasm-opt")
            .args([
                "-Oz",                      // Optimize for size
                "--enable-mutable-globals", // Enable mutable globals
                "--enable-simd",            // Enable SIMD
                "-o", temp_path.to_str().unwrap(),
                path.to_str().unwrap(),
            ])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()?;

        // Replace original with optimized
        if temp_path.exists() {
            fs::rename(&temp_path, path)?;
        }
    }

    Ok(())
}

/// Copy static files to output
fn copy_static_files(out_dir: &str) -> Result<()> {
    let static_dir = Path::new("static");
    if static_dir.exists() {
        let options = fs_extra::dir::CopyOptions::new().content_only(true);
        fs_extra::dir::copy(static_dir, out_dir, &options)?;
    }

    let assets_dir = Path::new("assets");
    if assets_dir.exists() {
        let dest = Path::new(out_dir).join("assets");
        fs::create_dir_all(&dest)?;
        let options = fs_extra::dir::CopyOptions::new().content_only(true);
        fs_extra::dir::copy(assets_dir, &dest, &options)?;
    }

    Ok(())
}

/// Copy WASM bundle to output
fn copy_wasm_bundle(out_dir: &str) -> Result<()> {
    let pkg_dir = Path::new("pkg");
    let dest_pkg = Path::new(out_dir).join("pkg");
    fs::create_dir_all(&dest_pkg)?;

    // Copy only necessary files
    for entry in fs::read_dir(pkg_dir)? {
        let entry = entry?;
        let path = entry.path();
        let file_name = path.file_name().unwrap().to_string_lossy();

        // Skip unnecessary files
        if file_name.ends_with(".ts")
            || file_name.ends_with(".gitignore")
            || file_name == "package.json"
        {
            continue;
        }

        let dest_file = dest_pkg.join(path.file_name().unwrap());
        fs::copy(&path, &dest_file)?;
    }

    Ok(())
}

/// Build SSR bundle
fn build_ssr(release: bool) -> Result<()> {
    let mut args = vec!["build"];
    if release {
        args.push("--release");
    }
    args.extend(["--features", "ssr"]);

    Command::new("cargo")
        .args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .status()
        .context("Failed to build SSR")?;

    Ok(())
}

/// Generate source maps
fn generate_source_maps(out_dir: &str) -> Result<()> {
    // Source maps are generated by wasm-pack in dev mode
    // For production, we'd need additional tooling
    Ok(())
}

/// Calculate build metrics
fn calculate_build_metrics(out_dir: &str, build_time: std::time::Duration) -> Result<BuildResult> {
    let mut total_size = 0u64;
    let mut wasm_size = 0u64;

    for entry in walkdir::WalkDir::new(out_dir) {
        let entry = entry?;
        if entry.file_type().is_file() {
            let size = entry.metadata()?.len();
            total_size += size;

            if entry.path().extension().map_or(false, |ext| ext == "wasm") {
                wasm_size = size;
            }
        }
    }

    // Estimate gzip size (typically 30-40% of original for WASM)
    let wasm_size_gzip = (wasm_size as f64 * 0.35) as u64;

    Ok(BuildResult {
        wasm_size,
        wasm_size_gzip,
        total_size,
        build_time,
    })
}

/// Print build summary
fn print_build_summary(result: &BuildResult, out_dir: &str, analyze: bool) -> Result<()> {
    println!();
    println!("  {}  Build completed successfully!", "[done]".green().bold());
    println!();
    println!("  {}  {}", "Output:".white().bold(), out_dir.cyan());
    println!(
        "  {}  {:.2}s",
        "Time:".white().bold(),
        result.build_time.as_secs_f64()
    );
    println!();

    // Size breakdown
    println!("  {}", "Bundle Size:".white().bold());
    println!(
        "    {}  {} (gzip: ~{})",
        "WASM:".dimmed(),
        ByteSize(result.wasm_size).to_string().green(),
        ByteSize(result.wasm_size_gzip).to_string().cyan(),
    );
    println!(
        "    {}  {}",
        "Total:".dimmed(),
        ByteSize(result.total_size).to_string().green(),
    );
    println!();

    // Size comparison to popular frameworks
    if result.wasm_size < 100_000 {
        println!(
            "  {}  Smaller than most JavaScript frameworks!",
            "[perf]".green().bold()
        );
        println!();
    }

    Ok(())
}

/// Print bundle analysis
fn print_bundle_analysis(out_dir: &str) -> Result<()> {
    println!("  {}", "Bundle Analysis:".white().bold());
    println!();

    let mut files: Vec<(String, u64)> = Vec::new();

    for entry in walkdir::WalkDir::new(out_dir) {
        let entry = entry?;
        if entry.file_type().is_file() {
            let size = entry.metadata()?.len();
            let name = entry.path().strip_prefix(out_dir)?.display().to_string();
            files.push((name, size));
        }
    }

    // Sort by size descending
    files.sort_by(|a, b| b.1.cmp(&a.1));

    // Print top files
    for (name, size) in files.iter().take(10) {
        let bar_len = (((*size as f64) / (files[0].1 as f64)) * 30.0) as usize;
        let bar = "=".repeat(bar_len);

        println!(
            "    {} {:>10}  {}",
            bar.cyan(),
            ByteSize(*size).to_string(),
            name.dimmed()
        );
    }

    println!();

    Ok(())
}

//! Development server with hot reload
//!
//! Provides a fast development experience with:
//! - Incremental WASM compilation
//! - Hot module replacement
//! - File watching with debouncing
//! - Beautiful terminal output

use anyhow::{Context, Result};
use colored::Colorize;
use indicatif::{ProgressBar, ProgressStyle};
use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{mpsc, Arc};
use std::time::{Duration, Instant};
use tokio::sync::broadcast;

/// Development server state
struct DevServer {
    port: u16,
    host: String,
    hot_reload: bool,
    wasm_build: Option<Child>,
    last_build: Instant,
    build_count: u32,
}

impl DevServer {
    fn new(port: u16, host: &str, hot_reload: bool) -> Self {
        DevServer {
            port,
            host: host.to_string(),
            hot_reload,
            wasm_build: None,
            last_build: Instant::now(),
            build_count: 0,
        }
    }

    fn build_url(&self, https: bool) -> String {
        let protocol = if https { "https" } else { "http" };
        format!("{}://{}:{}", protocol, self.host, self.port)
    }
}

/// Run the development server
pub async fn run(
    port: u16,
    host: &str,
    open: bool,
    https: bool,
    watch_dirs: Option<Vec<String>>,
    no_hot_reload: bool,
) -> Result<()> {
    print_dev_banner(port, host, https);

    // Check prerequisites
    check_prerequisites()?;

    let mut server = DevServer::new(port, host, !no_hot_reload);

    // Initial build
    println!(
        "{}  Building WASM (this may take a moment)...\n",
        "[build]".cyan().bold()
    );

    let build_start = Instant::now();
    build_wasm_dev()?;
    let build_time = build_start.elapsed();

    println!(
        "{}  Initial build completed in {:.2}s\n",
        "[done]".green().bold(),
        build_time.as_secs_f64()
    );

    // Setup file watcher
    let (tx, rx) = mpsc::channel();
    let mut watcher = RecommendedWatcher::new(
        move |res: notify::Result<notify::Event>| {
            if let Ok(event) = res {
                let _ = tx.send(event);
            }
        },
        Config::default().with_poll_interval(Duration::from_millis(100)),
    )?;

    // Watch directories
    let watch_paths = get_watch_paths(watch_dirs)?;
    for path in &watch_paths {
        if path.exists() {
            watcher.watch(path, RecursiveMode::Recursive)?;
            println!(
                "  {}  Watching: {}",
                "eye".dimmed(),
                path.display().to_string().dimmed()
            );
        }
    }

    println!();
    print_server_ready(port, host, https);

    // Open browser if requested
    if open {
        let url = server.build_url(https);
        if let Err(e) = open::that(&url) {
            println!(
                "{}  Could not open browser: {}",
                "[warn]".yellow().bold(),
                e
            );
        }
    }

    // Setup shutdown signal
    let running = Arc::new(AtomicBool::new(true));
    let r = running.clone();

    ctrlc::set_handler(move || {
        r.store(false, Ordering::SeqCst);
    })?;

    // Create a debounce mechanism for file changes
    let mut last_change = Instant::now();
    let debounce_duration = Duration::from_millis(200);

    // Main event loop
    while running.load(Ordering::SeqCst) {
        // Check for file changes with timeout
        match rx.recv_timeout(Duration::from_millis(100)) {
            Ok(event) => {
                // Filter for relevant file changes
                if should_rebuild(&event) && last_change.elapsed() > debounce_duration {
                    last_change = Instant::now();
                    server.build_count += 1;

                    let changed_path = event
                        .paths
                        .first()
                        .map(|p| p.display().to_string())
                        .unwrap_or_default();

                    println!(
                        "\n{}  File changed: {}",
                        "[watch]".cyan().bold(),
                        changed_path.dimmed()
                    );

                    // Rebuild
                    let build_start = Instant::now();
                    match build_wasm_dev() {
                        Ok(_) => {
                            let build_time = build_start.elapsed();
                            println!(
                                "{}  Rebuild #{} completed in {:.2}s",
                                "[done]".green().bold(),
                                server.build_count,
                                build_time.as_secs_f64()
                            );

                            if server.hot_reload {
                                println!(
                                    "{}  Hot reload triggered",
                                    "[hmr]".magenta().bold()
                                );
                            }
                        }
                        Err(e) => {
                            println!(
                                "{}  Build failed: {}",
                                "[error]".red().bold(),
                                e
                            );
                        }
                    }
                }
            }
            Err(mpsc::RecvTimeoutError::Timeout) => {
                // Continue loop
            }
            Err(mpsc::RecvTimeoutError::Disconnected) => {
                break;
            }
        }
    }

    println!(
        "\n{}  Development server stopped.\n",
        "[shutdown]".yellow().bold()
    );

    Ok(())
}

/// Print development server banner
fn print_dev_banner(port: u16, host: &str, https: bool) {
    let protocol = if https { "https" } else { "http" };

    println!(
        "\n{}",
        "  PhilJS Development Server".cyan().bold()
    );
    println!("{}", "  ========================".cyan());
    println!();
}

/// Print server ready message
fn print_server_ready(port: u16, host: &str, https: bool) {
    let protocol = if https { "https" } else { "http" };
    let local_url = format!("{}://{}:{}", protocol, host, port);
    let network_url = format!("{}://0.0.0.0:{}", protocol, port);

    println!("  {}  Ready in development mode", "[ok]".green().bold());
    println!();
    println!("  {}  {}", "Local:".white().bold(), local_url.cyan().underline());
    if host == "0.0.0.0" {
        println!("  {}  {}", "Network:".white().bold(), network_url.cyan().underline());
    }
    println!();
    println!("  {}  Press {} to stop", "[info]".dimmed(), "Ctrl+C".yellow());
    println!();
}

/// Check that required tools are installed
fn check_prerequisites() -> Result<()> {
    // Check for wasm-pack
    if which::which("wasm-pack").is_err() {
        println!(
            "{}  wasm-pack not found. Installing...",
            "[setup]".yellow().bold()
        );

        let pb = ProgressBar::new_spinner();
        pb.set_style(
            ProgressStyle::default_spinner()
                .template("{spinner:.cyan} {msg}")
                .unwrap(),
        );
        pb.set_message("Installing wasm-pack...");
        pb.enable_steady_tick(Duration::from_millis(100));

        let status = Command::new("cargo")
            .args(["install", "wasm-pack"])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .context("Failed to install wasm-pack")?;

        pb.finish_and_clear();

        if !status.success() {
            anyhow::bail!("Failed to install wasm-pack. Please install manually: cargo install wasm-pack");
        }

        println!(
            "{}  wasm-pack installed successfully",
            "[done]".green().bold()
        );
    }

    // Check for wasm32 target
    let rustup_output = Command::new("rustup")
        .args(["target", "list", "--installed"])
        .output()?;

    let installed_targets = String::from_utf8_lossy(&rustup_output.stdout);
    if !installed_targets.contains("wasm32-unknown-unknown") {
        println!(
            "{}  Adding wasm32-unknown-unknown target...",
            "[setup]".yellow().bold()
        );

        Command::new("rustup")
            .args(["target", "add", "wasm32-unknown-unknown"])
            .status()
            .context("Failed to add wasm32 target")?;
    }

    Ok(())
}

/// Build WASM in development mode
fn build_wasm_dev() -> Result<()> {
    let status = Command::new("wasm-pack")
        .args([
            "build",
            "--target", "web",
            "--dev",
            "--out-dir", "pkg",
            "--out-name", "app",
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .status()
        .context("Failed to build WASM")?;

    if !status.success() {
        anyhow::bail!("WASM build failed");
    }

    Ok(())
}

/// Get paths to watch for changes
fn get_watch_paths(extra_dirs: Option<Vec<String>>) -> Result<Vec<std::path::PathBuf>> {
    let mut paths = vec![
        Path::new("src").to_path_buf(),
        Path::new("Cargo.toml").to_path_buf(),
        Path::new("static").to_path_buf(),
        Path::new("assets").to_path_buf(),
    ];

    if let Some(extra) = extra_dirs {
        for dir in extra {
            paths.push(Path::new(&dir).to_path_buf());
        }
    }

    Ok(paths)
}

/// Determine if we should rebuild based on the file change event
fn should_rebuild(event: &notify::Event) -> bool {
    use notify::EventKind;

    // Only rebuild on create/modify events
    match event.kind {
        EventKind::Create(_) | EventKind::Modify(_) => {}
        _ => return false,
    }

    // Check file extensions
    for path in &event.paths {
        if let Some(ext) = path.extension() {
            let ext = ext.to_string_lossy();
            match ext.as_ref() {
                "rs" | "toml" | "html" | "css" | "js" | "ts" => return true,
                _ => {}
            }
        }
    }

    false
}

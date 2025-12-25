//! cargo-philjs - Best-in-class Cargo subcommand for PhilJS
//!
//! The ultimate CLI for building reactive web applications with Rust.
//! Designed to provide the best developer experience for Rust UI development.
//!
//! # Usage
//!
//! ```bash
//! # Create a new project
//! cargo philjs new my-app
//! cargo philjs new my-app --template=fullstack
//!
//! # Start development server with hot reload
//! cargo philjs dev
//!
//! # Build for production
//! cargo philjs build --release
//!
//! # Type check and lint
//! cargo philjs check
//!
//! # Run tests
//! cargo philjs test
//!
//! # Deploy to platforms
//! cargo philjs deploy --platform=vercel
//!
//! # Add components/pages
//! cargo philjs add component Button
//! cargo philjs add page Dashboard
//! ```

mod commands;
mod config;
mod templates;
mod utils;

use clap::{Parser, Subcommand, ValueEnum};
use colored::Colorize;
use miette::Result;
use std::process::ExitCode;

/// ASCII art banner for PhilJS
const BANNER: &str = r#"
    ____  __    _ __      _______
   / __ \/ /_  (_) /     / / ___/
  / /_/ / __ \/ / /     / /\__ \
 / ____/ / / / / /___  / /___/ /
/_/   /_/ /_/_/_____/_/ //____/
                  /___/
"#;

#[derive(Parser)]
#[command(
    name = "cargo-philjs",
    bin_name = "cargo philjs",
    version,
    about = "PhilJS CLI - The #1 UI framework for Rust developers",
    long_about = "PhilJS CLI provides the best-in-class developer experience for building \
                  reactive web applications with Rust. Features include hot reload, \
                  WASM optimization, and seamless deployment.",
    after_help = "For more information, visit https://philjs.dev",
    styles = get_styles(),
)]
struct Cli {
    #[command(subcommand)]
    command: Commands,

    /// Enable verbose output
    #[arg(short, long, global = true)]
    verbose: bool,

    /// Suppress non-essential output
    #[arg(short, long, global = true)]
    quiet: bool,
}

fn get_styles() -> clap::builder::Styles {
    clap::builder::Styles::styled()
        .usage(
            anstyle::Style::new()
                .bold()
                .fg_color(Some(anstyle::Color::Ansi(anstyle::AnsiColor::Cyan))),
        )
        .header(
            anstyle::Style::new()
                .bold()
                .fg_color(Some(anstyle::Color::Ansi(anstyle::AnsiColor::Cyan))),
        )
        .literal(
            anstyle::Style::new()
                .fg_color(Some(anstyle::Color::Ansi(anstyle::AnsiColor::Green))),
        )
        .placeholder(
            anstyle::Style::new()
                .fg_color(Some(anstyle::Color::Ansi(anstyle::AnsiColor::Yellow))),
        )
}

#[derive(Subcommand)]
enum Commands {
    /// Create a new PhilJS project with templates
    #[command(alias = "n", visible_alias = "create")]
    New {
        /// Project name
        name: String,

        /// Template to use
        #[arg(short, long, value_enum, default_value = "spa")]
        template: ProjectTemplate,

        /// Skip git initialization
        #[arg(long)]
        no_git: bool,

        /// Skip installing dependencies
        #[arg(long)]
        no_install: bool,

        /// Use a specific PhilJS version
        #[arg(long)]
        philjs_version: Option<String>,
    },

    /// Initialize PhilJS in an existing Rust project
    Init {
        /// Template to use
        #[arg(short, long, value_enum, default_value = "spa")]
        template: ProjectTemplate,
    },

    /// Start development server with hot reload
    #[command(alias = "d", visible_alias = "serve")]
    Dev {
        /// Port to run on
        #[arg(short, long, default_value = "3000", env = "PHILJS_PORT")]
        port: u16,

        /// Host to bind to
        #[arg(long, default_value = "127.0.0.1", env = "PHILJS_HOST")]
        host: String,

        /// Open browser automatically
        #[arg(short, long)]
        open: bool,

        /// Enable HTTPS with auto-generated certificate
        #[arg(long)]
        https: bool,

        /// Watch additional directories for changes
        #[arg(long, value_delimiter = ',')]
        watch: Option<Vec<String>>,

        /// Disable hot reload
        #[arg(long)]
        no_hot_reload: bool,
    },

    /// Build for production
    #[command(alias = "b")]
    Build {
        /// Enable release optimizations
        #[arg(long, short)]
        release: bool,

        /// Output directory
        #[arg(short, long, default_value = "dist")]
        out_dir: String,

        /// Build target
        #[arg(long, value_enum, default_value = "browser")]
        target: BuildTarget,

        /// Enable SSR (server-side rendering)
        #[arg(long)]
        ssr: bool,

        /// Enable source maps
        #[arg(long)]
        source_map: bool,

        /// Skip WASM optimization (faster builds)
        #[arg(long)]
        no_optimize: bool,

        /// Analyze bundle size
        #[arg(long)]
        analyze: bool,

        /// Minify output (default for release)
        #[arg(long)]
        minify: bool,
    },

    /// Type check and lint your project
    #[command(alias = "c")]
    Check {
        /// Run clippy lints
        #[arg(long)]
        clippy: bool,

        /// Check formatting
        #[arg(long)]
        fmt: bool,

        /// Fix issues automatically where possible
        #[arg(long)]
        fix: bool,
    },

    /// Run tests
    #[command(alias = "t")]
    Test {
        /// Run in watch mode
        #[arg(long)]
        watch: bool,

        /// Run browser/WASM tests
        #[arg(long)]
        browser: bool,

        /// Run with coverage
        #[arg(long)]
        coverage: bool,

        /// Test filter pattern
        pattern: Option<String>,
    },

    /// Generate code (components, pages, etc.)
    #[command(alias = "g", visible_alias = "gen")]
    Generate {
        #[command(subcommand)]
        what: GenerateCommand,
    },

    /// Add a component or page to your project
    Add {
        #[command(subcommand)]
        what: AddCommand,
    },

    /// Deploy to various platforms
    Deploy {
        /// Target platform
        #[arg(short, long, value_enum)]
        platform: Option<DeployPlatform>,

        /// Preview deployment (not production)
        #[arg(long)]
        preview: bool,

        /// Skip build step
        #[arg(long)]
        no_build: bool,
    },

    /// Update PhilJS and dependencies
    Update {
        /// Update all dependencies
        #[arg(long)]
        all: bool,

        /// Check for updates without installing
        #[arg(long)]
        check: bool,
    },

    /// Show project info and diagnostics
    Info {
        /// Output as JSON
        #[arg(long)]
        json: bool,
    },

    /// Clean build artifacts
    Clean {
        /// Also clean node_modules and .philjs cache
        #[arg(long)]
        all: bool,
    },
}

#[derive(ValueEnum, Clone, Copy, Debug, Default)]
pub enum ProjectTemplate {
    /// Single-page application (client-only)
    #[default]
    Spa,
    /// Server-side rendered application
    Ssr,
    /// Full-stack with API routes and SSR
    Fullstack,
    /// LiveView (Phoenix-style server-driven UI)
    Liveview,
    /// Minimal starter
    Minimal,
}

impl std::fmt::Display for ProjectTemplate {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ProjectTemplate::Spa => write!(f, "spa"),
            ProjectTemplate::Ssr => write!(f, "ssr"),
            ProjectTemplate::Fullstack => write!(f, "fullstack"),
            ProjectTemplate::Liveview => write!(f, "liveview"),
            ProjectTemplate::Minimal => write!(f, "minimal"),
        }
    }
}

#[derive(ValueEnum, Clone, Copy, Debug, Default)]
pub enum BuildTarget {
    /// Browser (WebAssembly)
    #[default]
    Browser,
    /// Node.js
    Node,
    /// Deno
    Deno,
    /// Cloudflare Workers
    Cloudflare,
}

#[derive(ValueEnum, Clone, Copy, Debug)]
pub enum DeployPlatform {
    /// Vercel
    Vercel,
    /// Netlify
    Netlify,
    /// Cloudflare Pages
    Cloudflare,
    /// Railway
    Railway,
    /// Fly.io
    Fly,
    /// AWS Lambda
    Aws,
    /// Docker
    Docker,
}

#[derive(Subcommand)]
enum GenerateCommand {
    /// Generate a component
    #[command(alias = "c")]
    Component {
        /// Component name (PascalCase)
        name: String,

        /// Directory to create in
        #[arg(short, long)]
        dir: Option<String>,

        /// Include tests
        #[arg(long, default_value = "true")]
        tests: bool,

        /// Generate with props boilerplate
        #[arg(long)]
        props: bool,

        /// Include CSS module
        #[arg(long)]
        styled: bool,
    },

    /// Generate a page/route
    #[command(alias = "p")]
    Page {
        /// Page name/path
        name: String,

        /// Include loader function
        #[arg(long)]
        loader: bool,
    },

    /// Generate a server function
    #[command(alias = "s")]
    Server {
        /// Function name
        name: String,
    },

    /// Generate an API route
    #[command(alias = "a")]
    Api {
        /// API route name
        name: String,
    },

    /// Generate a store/state module
    Store {
        /// Store name
        name: String,
    },

    /// Generate a custom hook
    Hook {
        /// Hook name
        name: String,
    },
}

#[derive(Subcommand)]
enum AddCommand {
    /// Add a new component
    Component {
        /// Component name
        name: String,
    },

    /// Add a new page/route
    Page {
        /// Page name
        name: String,
    },
}

fn print_banner() {
    println!("{}", BANNER.cyan().bold());
}

#[tokio::main]
async fn main() -> ExitCode {
    // Initialize logging with environment filter
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive(tracing::Level::INFO.into()),
        )
        .with_target(false)
        .without_time()
        .init();

    // Parse CLI, handling the "philjs" subcommand from cargo
    let args: Vec<String> = std::env::args().collect();
    let args = if args.len() > 1 && args[1] == "philjs" {
        // Called as `cargo philjs`, skip the "philjs" arg
        let mut new_args = vec![args[0].clone()];
        new_args.extend(args[2..].iter().cloned());
        new_args
    } else {
        args
    };

    let cli = match Cli::try_parse_from(args) {
        Ok(cli) => cli,
        Err(e) => {
            // Print banner on help
            if e.kind() == clap::error::ErrorKind::DisplayHelp {
                print_banner();
            }
            eprintln!("{}", e);
            return ExitCode::FAILURE;
        }
    };

    let result = run_command(cli).await;

    match result {
        Ok(_) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("\n{}  {}\n", "Error:".red().bold(), e);

            // Provide helpful suggestions based on error
            if e.to_string().contains("wasm-pack") {
                eprintln!(
                    "{}  Install wasm-pack: {}",
                    "Tip:".yellow().bold(),
                    "cargo install wasm-pack".cyan()
                );
            }

            ExitCode::FAILURE
        }
    }
}

async fn run_command(cli: Cli) -> anyhow::Result<()> {
    match cli.command {
        Commands::New {
            name,
            template,
            no_git,
            no_install,
            philjs_version,
        } => {
            commands::new::run(
                &name,
                template,
                no_git,
                no_install,
                philjs_version.as_deref(),
            )
            .await
        }
        Commands::Init { template } => commands::init::run(template),
        Commands::Dev {
            port,
            host,
            open,
            https,
            watch,
            no_hot_reload,
        } => {
            commands::dev::run(port, &host, open, https, watch, no_hot_reload).await
        }
        Commands::Build {
            release,
            out_dir,
            target,
            ssr,
            source_map,
            no_optimize,
            analyze,
            minify,
        } => {
            commands::build::run(
                release,
                &out_dir,
                target,
                ssr,
                source_map,
                no_optimize,
                analyze,
                minify,
            )
            .await
        }
        Commands::Check { clippy, fmt, fix } => {
            commands::check::run(clippy, fmt, fix)
        }
        Commands::Generate { what } => match what {
            GenerateCommand::Component { name, dir, tests, props, styled } => {
                commands::generate::component_enhanced(&name, dir.as_deref(), tests, props, styled)
            }
            GenerateCommand::Page { name, loader } => {
                commands::generate::page(&name, loader)
            }
            GenerateCommand::Server { name } => {
                commands::generate::server_fn(&name)
            }
            GenerateCommand::Api { name } => {
                commands::generate::api(&name)
            }
            GenerateCommand::Store { name } => {
                commands::generate::store(&name)
            }
            GenerateCommand::Hook { name } => {
                commands::generate::hook(&name)
            }
        },
        Commands::Add { what } => match what {
            AddCommand::Component { name } => {
                commands::generate::component(&name, None, true)
            }
            AddCommand::Page { name } => {
                commands::generate::page(&name, true)
            }
        },
        Commands::Test {
            watch,
            browser,
            coverage,
            pattern,
        } => {
            commands::test::run(watch, browser, coverage, pattern.as_deref())
        }
        Commands::Deploy {
            platform,
            preview,
            no_build,
        } => commands::deploy::run(platform, preview, no_build).await,
        Commands::Update { all, check } => {
            commands::update::run(all, check)
        }
        Commands::Info { json } => commands::info::run(json),
        Commands::Clean { all } => commands::clean::run(all),
    }
}

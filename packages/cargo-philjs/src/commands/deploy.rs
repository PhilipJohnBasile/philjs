//! Deployment commands
//!
//! Deploy PhilJS applications to various platforms.

use crate::DeployPlatform;
use anyhow::{Context, Result};
use colored::Colorize;
use dialoguer::{theme::ColorfulTheme, Select};
use std::process::Command;

/// Run deployment
pub async fn run(
    platform: Option<DeployPlatform>,
    preview: bool,
    no_build: bool,
) -> Result<()> {
    let platform = match platform {
        Some(p) => p,
        None => select_platform()?,
    };

    println!(
        "\n{}  Deploying to {:?}...\n",
        "[deploy]".cyan().bold(),
        platform
    );

    // Build first if needed
    if !no_build {
        println!("{}  Building for production...", "[build]".cyan().bold());
        crate::commands::build::run(true, "dist", crate::BuildTarget::Browser, false, false, false, false).await?;
        println!();
    }

    // Deploy based on platform
    match platform {
        DeployPlatform::Vercel => deploy_vercel(preview)?,
        DeployPlatform::Netlify => deploy_netlify(preview)?,
        DeployPlatform::Cloudflare => deploy_cloudflare(preview)?,
        DeployPlatform::Railway => deploy_railway()?,
        DeployPlatform::Fly => deploy_fly(preview)?,
        DeployPlatform::Aws => deploy_aws()?,
        DeployPlatform::Docker => build_docker()?,
    }

    Ok(())
}

/// Interactive platform selection
fn select_platform() -> Result<DeployPlatform> {
    let options = vec![
        "Vercel (Recommended for SPAs)",
        "Netlify",
        "Cloudflare Pages",
        "Railway (Full-stack)",
        "Fly.io (Full-stack)",
        "AWS Lambda",
        "Docker",
    ];

    let selection = Select::with_theme(&ColorfulTheme::default())
        .with_prompt("Select deployment platform")
        .items(&options)
        .default(0)
        .interact()?;

    Ok(match selection {
        0 => DeployPlatform::Vercel,
        1 => DeployPlatform::Netlify,
        2 => DeployPlatform::Cloudflare,
        3 => DeployPlatform::Railway,
        4 => DeployPlatform::Fly,
        5 => DeployPlatform::Aws,
        6 => DeployPlatform::Docker,
        _ => DeployPlatform::Vercel,
    })
}

/// Deploy to Vercel
fn deploy_vercel(preview: bool) -> Result<()> {
    check_cli("vercel", "npm i -g vercel")?;

    let mut args = vec!["deploy", "dist"];
    if !preview {
        args.push("--prod");
    }

    println!("{}  Running vercel deploy...\n", "[vercel]".cyan().bold());

    let status = Command::new("vercel")
        .args(&args)
        .status()
        .context("Failed to run vercel deploy")?;

    if status.success() {
        println!(
            "\n{}  Deployed to Vercel successfully!",
            "[done]".green().bold()
        );
    }

    Ok(())
}

/// Deploy to Netlify
fn deploy_netlify(preview: bool) -> Result<()> {
    check_cli("netlify", "npm i -g netlify-cli")?;

    let mut args = vec!["deploy", "--dir=dist"];
    if !preview {
        args.push("--prod");
    }

    println!("{}  Running netlify deploy...\n", "[netlify]".cyan().bold());

    let status = Command::new("netlify")
        .args(&args)
        .status()
        .context("Failed to run netlify deploy")?;

    if status.success() {
        println!(
            "\n{}  Deployed to Netlify successfully!",
            "[done]".green().bold()
        );
    }

    Ok(())
}

/// Deploy to Cloudflare Pages
fn deploy_cloudflare(preview: bool) -> Result<()> {
    check_cli("wrangler", "npm i -g wrangler")?;

    println!(
        "{}  Running wrangler pages deploy...\n",
        "[cloudflare]".cyan().bold()
    );

    let status = Command::new("wrangler")
        .args(["pages", "deploy", "dist"])
        .status()
        .context("Failed to run wrangler deploy")?;

    if status.success() {
        println!(
            "\n{}  Deployed to Cloudflare Pages successfully!",
            "[done]".green().bold()
        );
    }

    Ok(())
}

/// Deploy to Railway
fn deploy_railway() -> Result<()> {
    check_cli("railway", "npm i -g @railway/cli")?;

    println!("{}  Running railway up...\n", "[railway]".cyan().bold());

    let status = Command::new("railway")
        .args(["up"])
        .status()
        .context("Failed to run railway up")?;

    if status.success() {
        println!(
            "\n{}  Deployed to Railway successfully!",
            "[done]".green().bold()
        );
    }

    Ok(())
}

/// Deploy to Fly.io
fn deploy_fly(preview: bool) -> Result<()> {
    check_cli("flyctl", "curl -L https://fly.io/install.sh | sh")?;

    // Check if fly.toml exists, if not create one
    if !std::path::Path::new("fly.toml").exists() {
        println!("{}  Creating fly.toml...", "[fly]".cyan().bold());

        let fly_toml = r#"app = "philjs-app"
primary_region = "sjc"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
"#;
        std::fs::write("fly.toml", fly_toml)?;
    }

    println!("{}  Running fly deploy...\n", "[fly]".cyan().bold());

    let status = Command::new("flyctl")
        .args(["deploy"])
        .status()
        .context("Failed to run fly deploy")?;

    if status.success() {
        println!(
            "\n{}  Deployed to Fly.io successfully!",
            "[done]".green().bold()
        );
    }

    Ok(())
}

/// Deploy to AWS Lambda
fn deploy_aws() -> Result<()> {
    check_cli("aws", "https://aws.amazon.com/cli/")?;

    println!(
        "{}  AWS deployment requires SAM or CDK setup.",
        "[aws]".yellow().bold()
    );
    println!("  See: https://philjs.dev/docs/deploy/aws\n");

    // Create a basic SAM template if it doesn't exist
    if !std::path::Path::new("template.yaml").exists() {
        let template = r#"AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: PhilJS Application

Resources:
  PhilJSFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: bootstrap
      Runtime: provided.al2
      CodeUri: ./dist
      Events:
        Api:
          Type: HttpApi
"#;
        std::fs::write("template.yaml", template)?;
        println!(
            "{}  Created template.yaml for SAM deployment",
            "[done]".green().bold()
        );
    }

    Ok(())
}

/// Build Docker image
fn build_docker() -> Result<()> {
    // Create Dockerfile if it doesn't exist
    if !std::path::Path::new("Dockerfile").exists() {
        let dockerfile = r#"# Build stage
FROM rust:1.75 as builder

# Install wasm-pack
RUN cargo install wasm-pack

WORKDIR /app
COPY . .

# Build WASM
RUN wasm-pack build --target web --release

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/pkg /usr/share/nginx/html/pkg

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
"#;
        std::fs::write("Dockerfile", dockerfile)?;

        let nginx_conf = r#"server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(wasm)$ {
        add_header Content-Type application/wasm;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript application/wasm;
}
"#;
        std::fs::write("nginx.conf", nginx_conf)?;

        println!(
            "{}  Created Dockerfile and nginx.conf",
            "[done]".green().bold()
        );
    }

    println!("{}  Building Docker image...\n", "[docker]".cyan().bold());

    let status = Command::new("docker")
        .args(["build", "-t", "philjs-app", "."])
        .status()
        .context("Failed to build Docker image")?;

    if status.success() {
        println!(
            "\n{}  Docker image built successfully!",
            "[done]".green().bold()
        );
        println!("\n  Run with: {}", "docker run -p 8080:80 philjs-app".cyan());
    }

    Ok(())
}

/// Check if CLI tool is installed
fn check_cli(cmd: &str, install_hint: &str) -> Result<()> {
    if which::which(cmd).is_err() {
        anyhow::bail!(
            "{} not found. Install with:\n  {}",
            cmd,
            install_hint
        );
    }
    Ok(())
}

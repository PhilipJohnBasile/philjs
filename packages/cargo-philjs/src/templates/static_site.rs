//! Static Site Generator Template
//!
//! Build-time rendered static sites with PhilJS.

use std::collections::HashMap;

/// Generate static site template files
pub fn generate() -> HashMap<String, String> {
    let mut files = HashMap::new();

    // Cargo.toml
    files.insert(
        "Cargo.toml".to_string(),
        r#"[package]
name = "{{name}}"
version = "0.1.0"
edition = "2021"

[dependencies]
philjs = { version = "2.0", features = ["ssg"] }
philjs-ssg = "2.0"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
anyhow = "1.0"
tokio = { version = "1", features = ["full"] }
chrono = "0.4"

# Markdown support
pulldown-cmark = "0.9"
gray_matter = "0.2"

# Template engine
tera = "1.19"

[build-dependencies]
philjs-ssg = "2.0"

[profile.release]
opt-level = "z"
lto = true
codegen-units = 1
"#
        .to_string(),
    );

    // src/main.rs
    files.insert(
        "src/main.rs".to_string(),
        r#"//! {{name}} - Static Site Generator

mod components;
mod pages;
mod content;

use philjs_ssg::prelude::*;
use anyhow::Result;

use components::layout::Layout;
use pages::{index, about, blog};
use content::markdown::load_posts;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize site generator
    let mut site = SiteBuilder::new("{{name}}")
        .output_dir("dist")
        .base_url("https://example.com")
        .build()?;

    // Register pages
    site.add_page("/", index::render)?;
    site.add_page("/about", about::render)?;

    // Generate blog posts from markdown
    let posts = load_posts("content/posts")?;
    for post in posts {
        let slug = &post.slug;
        site.add_page(&format!("/blog/{}", slug), move || {
            blog::render_post(&post)
        })?;
    }

    // Generate blog index
    site.add_page("/blog", || blog::render_index(&posts))?;

    // Copy static assets
    site.copy_static("static")?;

    // Build site
    println!("Building site...");
    site.build().await?;

    println!("✓ Site built successfully to dist/");
    println!("  Run a local server: python3 -m http.server --directory dist");

    Ok(())
}
"#
        .to_string(),
    );

    // src/components/mod.rs
    files.insert(
        "src/components/mod.rs".to_string(),
        "pub mod layout;\npub mod header;\npub mod footer;\n".to_string(),
    );

    // src/components/layout.rs
    files.insert(
        "src/components/layout.rs".to_string(),
        r#"//! Page Layout Component

use philjs::prelude::*;
use super::{header::Header, footer::Footer};

#[derive(Clone)]
pub struct LayoutProps {
    pub title: String,
    pub description: String,
    pub children: Children,
}

#[component]
pub fn Layout(props: LayoutProps) -> impl IntoView {
    view! {
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>{&props.title}</title>
                <meta name="description" content={&props.description} />
                <link rel="stylesheet" href="/styles.css" />
            </head>
            <body>
                <Header />

                <main class="main-content">
                    {props.children}
                </main>

                <Footer />
            </body>
        </html>
    }
}
"#
        .to_string(),
    );

    // src/components/header.rs
    files.insert(
        "src/components/header.rs".to_string(),
        r#"//! Header Component

use philjs::prelude::*;

#[component]
pub fn Header() -> impl IntoView {
    view! {
        <header class="header">
            <div class="container">
                <nav class="nav">
                    <a href="/" class="logo">"{{name}}"</a>
                    <ul class="nav-links">
                        <li><a href="/">"Home"</a></li>
                        <li><a href="/blog">"Blog"</a></li>
                        <li><a href="/about">"About"</a></li>
                    </ul>
                </nav>
            </div>
        </header>
    }
}
"#
        .to_string(),
    );

    // src/components/footer.rs
    files.insert(
        "src/components/footer.rs".to_string(),
        r#"//! Footer Component

use philjs::prelude::*;
use chrono::Utc;

#[component]
pub fn Footer() -> impl IntoView {
    let year = Utc::now().year();

    view! {
        <footer class="footer">
            <div class="container">
                <p>"© " {year} " {{name}}. Built with PhilJS."</p>
            </div>
        </footer>
    }
}
"#
        .to_string(),
    );

    // src/pages/mod.rs
    files.insert(
        "src/pages/mod.rs".to_string(),
        "pub mod index;\npub mod about;\npub mod blog;\n".to_string(),
    );

    // src/pages/index.rs
    files.insert(
        "src/pages/index.rs".to_string(),
        r#"//! Home Page

use philjs::prelude::*;
use crate::components::layout::Layout;

pub fn render() -> String {
    render_to_string(|| view! {
        <Layout
            title="{{name}} - Home"
            description="Welcome to {{name}}"
        >
            <div class="hero">
                <h1>"Welcome to {{name}}"</h1>
                <p class="lead">"A blazing fast static site built with PhilJS"</p>
                <div class="cta">
                    <a href="/blog" class="btn btn-primary">"Read the Blog"</a>
                    <a href="/about" class="btn btn-secondary">"Learn More"</a>
                </div>
            </div>

            <section class="features">
                <div class="container">
                    <h2>"Features"</h2>
                    <div class="feature-grid">
                        <div class="feature">
                            <h3>"⚡ Lightning Fast"</h3>
                            <p>"Pre-rendered at build time for instant page loads"</p>
                        </div>
                        <div class="feature">
                            <h3>"🦀 Rust Powered"</h3>
                            <p>"Built with Rust for safety and performance"</p>
                        </div>
                        <div class="feature">
                            <h3>"📝 Markdown Support"</h3>
                            <p>"Write content in Markdown with frontmatter"</p>
                        </div>
                        <div class="feature">
                            <h3>"🎨 Fully Customizable"</h3>
                            <p>"Easy to theme and extend with components"</p>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    })
}
"#
        .to_string(),
    );

    // src/pages/about.rs
    files.insert(
        "src/pages/about.rs".to_string(),
        r#"//! About Page

use philjs::prelude::*;
use crate::components::layout::Layout;

pub fn render() -> String {
    render_to_string(|| view! {
        <Layout
            title="About - {{name}}"
            description="Learn more about {{name}}"
        >
            <div class="container">
                <article class="prose">
                    <h1>"About {{name}}"</h1>

                    <p>
                        "{{name}} is a static site generator built with PhilJS, "
                        "the #1 UI framework for Rust developers."
                    </p>

                    <h2>"Why Static Sites?"</h2>
                    <p>
                        "Static sites are fast, secure, and easy to deploy. "
                        "They're perfect for blogs, documentation, portfolios, "
                        "and marketing sites."
                    </p>

                    <h2>"Technology Stack"</h2>
                    <ul>
                        <li>"PhilJS - Reactive UI in Rust"</li>
                        <li>"Markdown - Content authoring"</li>
                        <li>"Tera - Template engine"</li>
                        <li>"CSS - Styling"</li>
                    </ul>

                    <h2>"Get Started"</h2>
                    <p>
                        "Check out the "
                        <a href="/blog">"blog"</a>
                        " for tutorials and guides."
                    </p>
                </article>
            </div>
        </Layout>
    })
}
"#
        .to_string(),
    );

    // src/pages/blog.rs
    files.insert(
        "src/pages/blog.rs".to_string(),
        r#"//! Blog Pages

use philjs::prelude::*;
use crate::{
    components::layout::Layout,
    content::markdown::Post,
};

pub fn render_index(posts: &[Post]) -> String {
    render_to_string(|| view! {
        <Layout
            title="Blog - {{name}}"
            description="Articles and tutorials"
        >
            <div class="container">
                <h1>"Blog"</h1>

                <div class="post-list">
                    <For
                        each=|| posts.to_vec()
                        key=|post| post.slug.clone()
                        children=|post: Post| {
                            view! {
                                <article class="post-preview">
                                    <h2>
                                        <a href={format!("/blog/{}", post.slug)}>
                                            {&post.title}
                                        </a>
                                    </h2>
                                    <div class="post-meta">
                                        <time datetime={&post.date}>{&post.date}</time>
                                        {post.author.as_ref().map(|author| {
                                            view! { <span>" by " {author}</span> }
                                        })}
                                    </div>
                                    <p>{&post.excerpt}</p>
                                    <a href={format!("/blog/{}", post.slug)} class="read-more">
                                        "Read more →"
                                    </a>
                                </article>
                            }
                        }
                    />
                </div>
            </div>
        </Layout>
    })
}

pub fn render_post(post: &Post) -> String {
    render_to_string(|| view! {
        <Layout
            title={format!("{} - {{{{name}}}}", post.title)}
            description={post.excerpt.clone()}
        >
            <div class="container">
                <article class="prose">
                    <header class="post-header">
                        <h1>{&post.title}</h1>
                        <div class="post-meta">
                            <time datetime={&post.date}>{&post.date}</time>
                            {post.author.as_ref().map(|author| {
                                view! { <span>" by " {author}</span> }
                            })}
                        </div>
                    </header>

                    <div class="post-content" inner_html={&post.content} />
                </article>
            </div>
        </Layout>
    })
}
"#
        .to_string(),
    );

    // src/content/mod.rs
    files.insert(
        "src/content/mod.rs".to_string(),
        "pub mod markdown;\n".to_string(),
    );

    // src/content/markdown.rs
    files.insert(
        "src/content/markdown.rs".to_string(),
        r#"//! Markdown Content Loader

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Post {
    pub slug: String,
    pub title: String,
    pub date: String,
    pub author: Option<String>,
    pub excerpt: String,
    pub content: String,
}

#[derive(Debug, Deserialize)]
struct Frontmatter {
    title: String,
    date: String,
    author: Option<String>,
    excerpt: Option<String>,
}

pub fn load_posts<P: AsRef<Path>>(dir: P) -> Result<Vec<Post>> {
    let mut posts = Vec::new();

    if !dir.as_ref().exists() {
        return Ok(posts);
    }

    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.extension().and_then(|s| s.to_str()) == Some("md") {
            let content = fs::read_to_string(&path)?;
            let post = parse_post(&path, &content)?;
            posts.push(post);
        }
    }

    // Sort by date descending
    posts.sort_by(|a, b| b.date.cmp(&a.date));

    Ok(posts)
}

fn parse_post(path: &Path, content: &str) -> Result<Post> {
    let (frontmatter, markdown) = split_frontmatter(content)?;
    let fm: Frontmatter = serde_yaml::from_str(&frontmatter)?;

    // Convert markdown to HTML
    let parser = pulldown_cmark::Parser::new(&markdown);
    let mut html_output = String::new();
    pulldown_cmark::html::push_html(&mut html_output, parser);

    // Generate excerpt from content if not provided
    let excerpt = fm.excerpt.unwrap_or_else(|| {
        let text: String = markdown.chars().take(200).collect();
        text + "..."
    });

    // Extract slug from filename
    let slug = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("post")
        .to_string();

    Ok(Post {
        slug,
        title: fm.title,
        date: fm.date,
        author: fm.author,
        excerpt,
        content: html_output,
    })
}

fn split_frontmatter(content: &str) -> Result<(String, String)> {
    let parts: Vec<&str> = content.splitn(3, "---").collect();

    if parts.len() < 3 {
        anyhow::bail!("Invalid frontmatter format");
    }

    Ok((parts[1].to_string(), parts[2].to_string()))
}
"#
        .to_string(),
    );

    // content/posts/hello-world.md
    files.insert(
        "content/posts/hello-world.md".to_string(),
        r#"---
title: Hello World
date: 2024-01-01
author: Your Name
excerpt: Welcome to my new blog built with PhilJS!
---

# Hello World

Welcome to my new blog! This is my first post built with PhilJS static site generator.

## Why PhilJS?

PhilJS is an amazing framework for building web applications with Rust. It provides:

- **Type Safety**: Catch errors at compile time
- **Performance**: Blazing fast with Rust
- **Developer Experience**: Great tooling and hot reload

## Getting Started

Creating a new static site is easy:

```bash
cargo philjs new my-blog --template=static
cd my-blog
cargo run
```

Your site will be generated in the `dist/` directory.

## Next Steps

- Customize the theme
- Add more posts
- Deploy to Netlify or Vercel

Happy blogging!
"#
        .to_string(),
    );

    // static/styles.css
    files.insert(
        "static/styles.css".to_string(),
        r#"/* {{name}} Styles */

:root {
    --color-primary: #3b82f6;
    --color-primary-dark: #2563eb;
    --color-text: #1f2937;
    --color-text-light: #6b7280;
    --color-bg: #ffffff;
    --color-bg-alt: #f9fafb;
    --color-border: #e5e7eb;
    --max-width: 1200px;
    --max-width-prose: 65ch;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    line-height: 1.6;
    color: var(--color-text);
    background-color: var(--color-bg);
}

.container {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 0 1.5rem;
}

/* Header */
.header {
    background: white;
    border-bottom: 1px solid var(--color-border);
    padding: 1rem 0;
}

.nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-primary);
    text-decoration: none;
}

.nav-links {
    display: flex;
    gap: 2rem;
    list-style: none;
}

.nav-links a {
    color: var(--color-text);
    text-decoration: none;
    transition: color 0.2s;
}

.nav-links a:hover {
    color: var(--color-primary);
}

/* Main Content */
.main-content {
    min-height: calc(100vh - 200px);
    padding: 3rem 0;
}

/* Hero */
.hero {
    text-align: center;
    padding: 4rem 2rem;
}

.hero h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: var(--color-text);
}

.lead {
    font-size: 1.5rem;
    color: var(--color-text-light);
    margin-bottom: 2rem;
}

.cta {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

/* Buttons */
.btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s;
}

.btn-primary {
    background: var(--color-primary);
    color: white;
}

.btn-primary:hover {
    background: var(--color-primary-dark);
}

.btn-secondary {
    background: transparent;
    color: var(--color-primary);
    border: 2px solid var(--color-primary);
}

.btn-secondary:hover {
    background: var(--color-primary);
    color: white;
}

/* Features */
.features {
    padding: 4rem 0;
    background: var(--color-bg-alt);
}

.features h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
}

.feature {
    background: white;
    padding: 2rem;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.feature h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
}

/* Blog */
.post-list {
    max-width: var(--max-width-prose);
    margin: 0 auto;
}

.post-preview {
    margin-bottom: 3rem;
    padding-bottom: 3rem;
    border-bottom: 1px solid var(--color-border);
}

.post-preview h2 {
    margin-bottom: 0.5rem;
}

.post-preview h2 a {
    color: var(--color-text);
    text-decoration: none;
}

.post-preview h2 a:hover {
    color: var(--color-primary);
}

.post-meta {
    color: var(--color-text-light);
    font-size: 0.875rem;
    margin-bottom: 1rem;
}

.read-more {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 600;
}

.read-more:hover {
    text-decoration: underline;
}

/* Prose (Article Content) */
.prose {
    max-width: var(--max-width-prose);
    margin: 0 auto;
}

.prose h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
}

.prose h2 {
    font-size: 2rem;
    margin-top: 2rem;
    margin-bottom: 1rem;
}

.prose h3 {
    font-size: 1.5rem;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
}

.prose p {
    margin-bottom: 1.5rem;
}

.prose ul, .prose ol {
    margin-bottom: 1.5rem;
    padding-left: 2rem;
}

.prose li {
    margin-bottom: 0.5rem;
}

.prose a {
    color: var(--color-primary);
    text-decoration: none;
}

.prose a:hover {
    text-decoration: underline;
}

.prose code {
    background: var(--color-bg-alt);
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
    font-size: 0.875em;
}

.prose pre {
    background: var(--color-bg-alt);
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin-bottom: 1.5rem;
}

.prose pre code {
    background: none;
    padding: 0;
}

.post-header {
    margin-bottom: 3rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--color-border);
}

/* Footer */
.footer {
    background: var(--color-bg-alt);
    border-top: 1px solid var(--color-border);
    padding: 2rem 0;
    text-align: center;
    color: var(--color-text-light);
}

/* Responsive */
@media (max-width: 768px) {
    .hero h1 {
        font-size: 2rem;
    }

    .lead {
        font-size: 1.25rem;
    }

    .cta {
        flex-direction: column;
        align-items: center;
    }

    .nav-links {
        gap: 1rem;
    }
}
"#
        .to_string(),
    );

    // README.md
    files.insert(
        "README.md".to_string(),
        r#"# {{name}}

Static site generator built with PhilJS.

## Features

- Write content in Markdown
- YAML frontmatter for metadata
- Fast build times with Rust
- Easy deployment to any static host

## Getting Started

```bash
# Build the site
cargo run

# Preview locally
python3 -m http.server --directory dist
```

## Project Structure

```
content/
└── posts/           # Blog posts (Markdown)
src/
├── main.rs          # Build script
├── components/      # Reusable components
└── pages/          # Page templates
static/
└── styles.css      # Global styles
dist/               # Generated site (git-ignored)
```

## Writing Content

Create a new post in `content/posts/my-post.md`:

```markdown
---
title: My Post Title
date: 2024-01-01
author: Your Name
excerpt: A brief description
---

# Post content goes here

Write your content in Markdown!
```

## Deployment

### Netlify

```bash
# netlify.toml
[build]
  command = "cargo run"
  publish = "dist"
```

### Vercel

```bash
# vercel.json
{
  "buildCommand": "cargo run",
  "outputDirectory": "dist"
}
```

### GitHub Pages

Add to `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - run: cargo run
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Customization

- Edit components in `src/components/`
- Modify styles in `static/styles.css`
- Add new pages in `src/pages/`

## Learn More

- [PhilJS Documentation](https://philjs.dev/docs)
- [Markdown Guide](https://www.markdownguide.org/)
"#
        .to_string(),
    );

    files
}

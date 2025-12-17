# PhilJS Blog SSG Example

A complete static blog example demonstrating file-based routing, markdown content processing, and SEO optimization with PhilJS.

## Features

- **File-Based Routing**: Organized route structure with dynamic parameters
- **Markdown Content**: Blog posts written in markdown with frontmatter metadata
- **SEO Optimization**: Meta tags, Open Graph, and Twitter Cards
- **Tag System**: Filter posts by tags
- **Post Listing**: Browse all blog posts
- **Individual Post Pages**: Beautifully formatted article pages
- **Client-Side Navigation**: Smooth transitions between pages

## What You'll Learn

This example demonstrates:

- **Markdown Processing**: Using gray-matter and remark to parse markdown
- **Dynamic Routes**: Handling URL parameters for posts and tags
- **SEO Components**: Adding proper meta tags for search engines
- **Data Fetching**: Loading and filtering blog posts
- **Component Composition**: Building reusable UI components
- **Custom Routing**: Implementing a simple client-side router

## Getting Started

### Prerequisites

Make sure you're in the monorepo root and have dependencies installed:

```bash
pnpm install
```

### Running the Example

From the monorepo root:

```bash
cd examples/blog-ssg
pnpm dev
```

Then open http://localhost:5173 in your browser.

### Building for Production

```bash
pnpm build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
pnpm preview
```

## Project Structure

```
blog-ssg/
├── content/
│   └── posts/
│       ├── first-post.md       # Blog post: Getting Started
│       ├── second-post.md      # Blog post: Advanced Patterns
│       └── third-post.md       # Blog post: Building with SSG
├── src/
│   ├── components/
│   │   ├── PostCard.tsx        # Post preview card
│   │   └── SEO.tsx             # SEO meta tags component
│   ├── lib/
│   │   └── posts.ts            # Post utilities and data fetching
│   ├── routes/
│   │   ├── index.tsx           # Homepage
│   │   ├── blog/
│   │   │   ├── index.tsx       # Blog listing page
│   │   │   └── [slug].tsx      # Individual post page
│   │   └── tags/
│   │       └── [tag].tsx       # Tag filtering page
│   ├── router.tsx              # Client-side router
│   └── main.tsx                # Entry point
├── index.html                  # HTML template
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
└── package.json
```

## Content Structure

Blog posts are written in Markdown with YAML frontmatter:

```markdown
---
title: "Post Title"
date: "2024-01-15"
author: "Author Name"
excerpt: "Brief description"
tags: ["tag1", "tag2"]
---

# Post Content

Your markdown content here...
```

## Key Concepts

### Markdown Processing

The `posts.ts` utility uses:

- **gray-matter**: Parses frontmatter metadata
- **remark**: Converts markdown to HTML
- **remark-html**: HTML generation plugin

### Dynamic Routes

Routes use URL parameters:

- `/blog/:slug` - Individual post pages
- `/tags/:tag` - Posts filtered by tag

### Client-Side Router

A simple pattern-matching router that:

- Matches URL patterns with parameters
- Loads route components dynamically
- Handles browser navigation events
- Intercepts link clicks for SPA navigation

### SEO Component

The SEO component adds:

- Title and description tags
- Open Graph metadata for social sharing
- Twitter Card metadata
- Canonical URLs
- Article-specific metadata

## Adding New Posts

1. Create a new `.md` file in `content/posts/`
2. Add frontmatter with required fields
3. Write your content in Markdown
4. The post will automatically appear in the blog listing

Example:

```bash
# Create new post
touch content/posts/my-new-post.md
```

```markdown
---
title: "My New Post"
date: "2024-01-30"
author: "Your Name"
excerpt: "Description of your post"
tags: ["tutorial", "philjs"]
---

# My New Post

Your content here...
```

## Tutorial

For a detailed step-by-step tutorial on building this example, see:
[Tutorial: Build a Blog with SSG](../../docs/getting-started/tutorial-blog-ssg.md)

## Extending the Example

Ideas for enhancements:

1. **Search**: Add full-text search functionality
2. **Pagination**: Paginate the blog listing
3. **Related Posts**: Show similar articles
4. **Reading Time**: Calculate estimated reading time
5. **Table of Contents**: Auto-generate from headings
6. **Syntax Highlighting**: Add code highlighting with Prism or Shiki
7. **Dark Mode**: Implement theme switching
8. **RSS Feed**: Generate RSS/Atom feed
9. **Sitemap**: Create XML sitemap for SEO
10. **Comments**: Integrate a commenting system

## Static Site Generation

Note: This example currently uses client-side routing. For true SSG (pre-rendering at build time), you would need to:

1. Configure a build step to generate static HTML files
2. Use a static site generator or build plugin
3. Pre-render all routes during the build process
4. Deploy the static files to a CDN or static host

The tutorial covers these concepts in detail.

## License

Part of the PhilJS project.

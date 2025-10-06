# PhilJS Documentation Site - Build Prompt

**How to use:** Copy this entire file and paste into Claude Code after running:
```bash
cd ~/projects
mkdir philjs-docs
cd philjs-docs
git init
claude --dangerously-skip-permissions
```

---

ultrathink

Update the current documentation by building the official PhilJS documentation website - a world-class documentation experience that rivals react.dev, vuejs.org, and solidjs.com. Work autonomously until completion. Build real, production-ready code.

═══════════════════════════════════════════════════════════════════════════════
PHILJS DOCUMENTATION SITE - philjs.dev
═══════════════════════════════════════════════════════════════════════════════

MISSION:
Create a stunning, interactive documentation site that makes PhilJS approachable for beginners while serving as a comprehensive reference for advanced users. This site should set a new standard for framework documentation.

DESIGN PRINCIPLES:
─────────────────────────────────────────────────────
• Beautiful, modern, minimal design
• Fast - sub-second page loads
• Interactive - live code examples everywhere
• Accessible - WCAG AA compliant
• Mobile-first responsive design
• Dark mode with smooth transitions
• Exceptional typography and readability
• Progressive enhancement throughout

CORE FEATURES TO IMPLEMENT:
═══════════════════════════════════════════════════════════════════════════════

1. HOMEPAGE (90 min estimated)
─────────────────────────────────────────────────────
□ Hero Section:
  - Bold headline: "The framework that thinks ahead"
  - Animated code example showing PhilJS features
  - CTA buttons: "Get Started" and "Why PhilJS?"
  - Live bundle size comparison widget
  - Performance metrics ticker (LCP, FID, CLS)

□ Feature Showcase Grid:
  - 6-8 key features with icons and descriptions
  - Micro-interactions on hover
  - Each links to detailed docs

□ Interactive Playground Section:
  - Embedded code editor with live preview
  - Pre-loaded with compelling example
  - "Try it yourself" encouragement
  - Share button to create permalinks

□ Performance Comparison:
  - Interactive chart: PhilJS vs React vs Vue vs Svelte
  - Metrics: Bundle size, Runtime speed, Memory usage
  - Real benchmark data visualization

□ Who's Using PhilJS:
  - Logo grid of companies (mock for now)
  - Testimonials carousel
  - Link to showcase page

□ Quick Links Footer:
  - Documentation, GitHub, Twitter, Discord
  - Newsletter signup
  - RSS feed for blog

2. DOCUMENTATION LAYOUT (60 min estimated)
─────────────────────────────────────────────────────
□ Navigation:
  - Sticky sidebar with collapsible sections
  - Search bar (Algolia-style)
  - Table of contents for current page
  - Breadcrumbs
  - Version selector
  - Theme toggle (light/dark)

□ Content Area:
  - MDX rendering with custom components
  - Syntax highlighting (Shiki or Prism)
  - Copy buttons on all code blocks
  - Edit on GitHub links
  - Last updated timestamps
  - Reading time estimates

□ Right Sidebar:
  - On-this-page navigation (auto-generated from H2/H3)
  - Smooth scroll to sections
  - Active section highlighting

□ Mobile Navigation:
  - Hamburger menu
  - Full-screen overlay
  - Swipeable drawers

3. GETTING STARTED (45 min estimated)
─────────────────────────────────────────────────────
□ Installation page:
  - Multiple installation methods (npm, pnpm, yarn, bun)
  - System requirements
  - Troubleshooting section
  - Video tutorial embed option

□ Quick Start Tutorial:
  - Step-by-step guide (5 steps max)
  - Each step has working code example
  - Progressive complexity
  - "What's next?" section at end

□ Your First Component:
  - Interactive tutorial
  - Builds a real component
  - Explains signals, effects, JSX
  - Links to deeper dive docs

□ Tutorial Series:
  - Tic-tac-toe game (React-style)
  - Todo app with persistence
  - Blog with routing and SSG
  - Each fully interactive with checkpoints

4. LEARN SECTION (90 min estimated)
─────────────────────────────────────────────────────
□ Core Concepts (10-15 pages):
  - Components
  - Signals & Reactivity
  - Effects & Lifecycle
  - Context API
  - Error Boundaries
  Each page includes:
    - Clear explanations
    - Multiple interactive examples
    - Common pitfalls callouts
    - Best practices
    - Links to related concepts

□ Routing (5-7 pages):
  - File-based routing
  - Nested layouts
  - Dynamic routes
  - Route parameters
  - Navigation & Links
  - Data loading per route
  - Error pages

□ Data Fetching (5-7 pages):
  - Fetch API wrapper
  - Caching strategies
  - Optimistic updates
  - Error handling
  - Loading states
  - Mutations
  - Real-time data

□ Forms (3-5 pages):
  - Form actions
  - Validation
  - Progressive enhancement
  - File uploads
  - Complex forms

□ Styling (4-6 pages):
  - CSS modules
  - Inline styles
  - CSS-in-JS options
  - Tailwind integration
  - Animation primitives
  - Theming

□ Performance (5-7 pages):
  - Code splitting
  - Lazy loading
  - Image optimization
  - Performance budgets
  - Profiling tools
  - Common optimizations

5. API REFERENCE (60 min estimated)
─────────────────────────────────────────────────────
Auto-generated from TypeScript types + hand-written descriptions

□ @philjs/core:
  - createSignal()
  - createEffect()
  - createMemo()
  - createContext()
  - useContext()
  - Show, For, Switch, Match components
  - ErrorBoundary
  - All with TypeScript signatures, examples, parameters

□ @philjs/router:
  - Route configuration
  - useRouter()
  - useParams()
  - useSearchParams()
  - Link component
  - Navigate function

□ @philjs/data:
  - createQuery()
  - createMutation()
  - cache configuration
  - QueryClient API

□ CLI Commands:
  - create-philjs
  - philjs dev
  - philjs build
  - philjs preview
  - All flags and options

□ Configuration:
  - philjs.config.ts reference
  - All options documented
  - Examples for common setups

6. INTERACTIVE PLAYGROUND (90 min estimated)
─────────────────────────────────────────────────────
□ Full-featured code editor:
  - Monaco Editor or CodeMirror
  - TypeScript support with IntelliSense
  - Multi-file editing (tabs)
  - File tree navigation
  - Hot module reloading

□ Live Preview Pane:
  - Real-time rendering
  - Mobile/tablet/desktop preview modes
  - Console output
  - Error overlay

□ Features:
  - Save to URL (shareable links)
  - Fork playground
  - Download as project
  - Import from GitHub
  - Reset to default
  - Templates library (starter examples)

□ Integration:
  - Embed playground in any doc page
  - Pre-populated with relevant examples
  - Minimal mode for small embeds

7. EXAMPLES & SHOWCASE (45 min estimated)
─────────────────────────────────────────────────────
□ Example Gallery:
  - Filterable by category (UI, Animation, Data, etc.)
  - Each example has:
    - Screenshot/GIF
    - Description
    - Source code link
    - Live demo link
    - Complexity level badge

□ Templates:
  - Starter templates (Blog, SaaS, E-commerce, Dashboard)
  - One-click deploy to Vercel/Netlify
  - GitHub template repos

□ Community Showcase:
  - Submit your site form
  - Curated projects built with PhilJS
  - Screenshots and descriptions

8. BLOG (30 min estimated)
─────────────────────────────────────────────────────
□ Blog listing page:
  - Card grid layout
  - Featured post hero
  - Filter by category/tags
  - Search
  - Pagination

□ Blog post template:
  - Beautiful typography
  - Author info
  - Published date
  - Reading time
  - Social share buttons
  - Related posts
  - Newsletter CTA

□ Sample Posts (create 3-5):
  - "Introducing PhilJS"
  - "Why We Built PhilJS"
  - "PhilJS vs React: Migration Guide"
  - "Building a Real-Time App with PhilJS"
  - "Performance Deep Dive"

9. SEARCH FUNCTIONALITY (45 min estimated)
─────────────────────────────────────────────────────
□ Implement search:
  - Keyboard shortcut (Cmd+K / Ctrl+K)
  - Modal overlay
  - Fuzzy search through all docs
  - Instant results as you type
  - Keyboard navigation
  - Recent searches
  - Popular searches
  - Category filtering

□ Search indexing:
  - Build-time index generation
  - Include page titles, headings, content
  - Rank by relevance
  - Update on build

10. ADDITIONAL PAGES (45 min estimated)
─────────────────────────────────────────────────────
□ About PhilJS:
  - Philosophy and design decisions
  - Comparison to other frameworks (honest)
  - When to use PhilJS vs alternatives
  - Roadmap

□ Team & Community:
  - Core team (with photos, bios, GitHub)
  - Contributors
  - How to contribute
  - Code of conduct

□ Ecosystem:
  - Official packages
  - Community plugins
  - Tools and integrations
  - Editor plugins

□ Releases:
  - Changelog (auto-generated from GitHub)
  - Migration guides between versions
  - Breaking changes highlighted

□ Resources:
  - Videos and talks
  - Podcasts
  - Articles
  - Courses
  - Books

11. TECHNICAL IMPLEMENTATION (60 min estimated)
─────────────────────────────────────────────────────
□ Build with PhilJS itself (dogfooding)
□ Static site generation (SSG)
□ Optimize for performance:
  - Image optimization
  - Font subsetting
  - Code splitting
  - Service worker for offline
  - Prefetching
  - < 3s Time to Interactive

□ SEO optimization:
  - Meta tags
  - Open Graph
  - Twitter Cards
  - Sitemap
  - RSS feed
  - Structured data (JSON-LD)

□ Analytics:
  - Privacy-friendly (Plausible or similar)
  - Track page views
  - Track playground usage
  - No cookies, no PII

□ Deployment:
  - Configure for Vercel/Netlify
  - CI/CD with GitHub Actions
  - Preview deployments
  - Automatic updates from main branch

12. DESIGN SYSTEM (45 min estimated)
─────────────────────────────────────────────────────
□ Create reusable components:
  - Button variants
  - Code blocks with copy
  - Callout boxes (info, warning, tip, danger)
  - Tabs
  - Accordion
  - Table of contents
  - Cards
  - Hero sections
  - Feature grids

□ Typography scale
□ Color system (light & dark themes)
□ Spacing scale
□ Breakpoints
□ Animation utilities

13. CONTENT CREATION (90 min estimated)
─────────────────────────────────────────────────────
Write actual documentation content (not Lorem Ipsum):

□ 50+ documentation pages covering:
  - Getting started (5 pages)
  - Core concepts (15 pages)
  - Routing (7 pages)
  - Data fetching (7 pages)
  - Forms (5 pages)
  - Styling (6 pages)
  - Performance (7 pages)
  - API reference (auto-generated + descriptions)

□ 5 complete tutorials
□ 20+ interactive code examples
□ 5 blog posts
□ All with proper technical writing

═══════════════════════════════════════════════════════════════════════════════

SITE STRUCTURE:
─────────────────────────────────────────────────────
philjs.dev/
├── /                          # Homepage
├── /docs
│   ├── /getting-started
│   │   ├── /installation
│   │   ├── /quick-start
│   │   └── /tutorial
│   ├── /learn
│   │   ├── /components
│   │   ├── /signals
│   │   ├── /effects
│   │   ├── /routing
│   │   ├── /data-fetching
│   │   ├── /forms
│   │   ├── /styling
│   │   └── /performance
│   ├── /api
│   │   ├── /core
│   │   ├── /router
│   │   ├── /data
│   │   ├── /cli
│   │   └── /config
│   └── /guides
│       ├── /migration-from-react
│       ├── /migration-from-vue
│       └── /best-practices
├── /playground              # Interactive playground
├── /examples                # Example gallery
├── /blog                    # Blog posts
├── /community               # Team, contributing, resources
└── /releases               # Changelog

DESIGN INSPIRATION:
─────────────────────────────────────────────────────
Study and implement best practices from:
• react.dev - Clean, modern, great tutorials
• vuejs.org - Excellent API reference, searchability
• solidjs.com - Interactive playground integration
• tailwindcss.com - Beautiful design, great search
• stripe.com/docs - Developer experience excellence

TECH STACK:
─────────────────────────────────────────────────────
• Built with PhilJS (dogfooding)
• MDX for content
• Shiki for syntax highlighting
• Monaco Editor for playground
• PhilJS Router for navigation
• Deployed on Vercel/Netlify

DELIVERABLES:
─────────────────────────────────────────────────────
□ Fully functional documentation site
□ 50+ documentation pages with real content
□ Interactive playground that works
□ 5 complete tutorials
□ Search functionality
□ Mobile responsive
□ Dark mode
□ < 100 Lighthouse performance score
□ Accessible (WCAG AA)
□ Deployable to production

CONSTRAINTS:
─────────────────────────────────────────────────────
• First page load < 3s on 3G
• Homepage < 200KB transferred
• Perfect Lighthouse scores (or close)
• Works with JavaScript disabled (progressive enhancement)
• Keyboard navigable throughout

QUALITY CHECKLIST:
─────────────────────────────────────────────────────
□ Every code example is tested and works
□ No broken links
□ All images have alt text
□ Proper heading hierarchy (a11y)
□ Focus states visible
□ Color contrast passes WCAG AA
□ Responsive on mobile/tablet/desktop
□ Fast on slow connections
□ Works in all modern browsers

═══════════════════════════════════════════════════════════════════════════════
START NOW
═══════════════════════════════════════════════════════════════════════════════

Build the complete documentation site. Make it beautiful, fast, and comprehensive. Show progress as you complete each section.

When finished, provide:
1. How to run the site locally
2. How to deploy
3. Summary of all pages created
4. Performance metrics
5. Screenshots of key pages

LET'S CREATE THE BEST FRAMEWORK DOCUMENTATION SITE EVER BUILT. GO.

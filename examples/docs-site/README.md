# PhilJS Documentation Site

The official documentation website for PhilJS, built with PhilJS itself to showcase the framework's capabilities.

## Features

### Core Functionality

- **📚 Comprehensive Documentation**: Complete guides, tutorials, API references, and examples
- **🔍 Advanced Search**: Full-text search with fuzzy matching and result highlighting
- **🎨 Syntax Highlighting**: Beautiful code examples with copy-to-clipboard functionality
- **🎮 Interactive Playground**: Live code editor to experiment with PhilJS
- **🌙 Dark/Light Mode**: Seamless theme switching with system preference detection
- **♿ Accessibility**: WCAG 2.1 AA compliant with keyboard navigation
- **📱 Responsive Design**: Mobile-first design that works on all devices

### Documentation Structure

#### 1. Getting Started
- Introduction to PhilJS
- Installation guide
- Quick start tutorial
- Your first component
- Thinking in PhilJS
- Interactive tutorials (Tic-Tac-Toe, Todo App, etc.)

#### 2. Learn
- Core concepts (Components, Signals, Effects, Context)
- JSX and templates
- Event handling
- Conditional rendering
- Forms and validation
- Styling and animations
- Performance optimization
- TypeScript integration

#### 3. Routing
- File-based routing
- Dynamic routes
- Layouts and nested routing
- Data loading
- Route guards and middleware
- View transitions

#### 4. Data Fetching
- Queries and mutations
- Caching strategies
- Loading states
- Error handling
- Server functions
- Real-time data

#### 5. Advanced Topics
- Server-side rendering (SSR)
- Static site generation (SSG)
- Islands architecture
- Resumability
- State management
- Authentication
- Testing strategies

#### 6. API Reference
- Core API documentation
- Router API
- SSR API
- Auto-generated from TSDoc comments

#### 7. Examples
- Real-world examples
- Code snippets
- Best practices
- Common patterns

### Key Components

#### Layout Components

**Layout.tsx**
- `Layout`: Base layout with header, footer, and optional sidebar
- `DocLayout`: Specialized layout for documentation pages with TOC
- `CenteredLayout`: For landing pages and centered content

**Header.tsx**
- Navigation menu
- Search trigger
- Theme switcher
- Version selector
- Mobile menu

**Footer.tsx**
- Links to resources
- Social media links
- License information

**Sidebar.tsx**
- Hierarchical navigation
- Active page highlighting
- Collapsible sections
- Smooth scrolling to active item

**TableOfContents.tsx**
- Automatic heading extraction
- Scroll spy for active section
- Smooth scroll to headings

#### Interactive Components

**CodeBlock.tsx**
- Syntax highlighting with highlight.js
- Copy to clipboard
- Language detection
- Line numbers (optional)

**CodePlayground.tsx**
- Live code editor
- Real-time execution
- Error handling
- Multiple templates
- Share functionality

**SearchModal.tsx**
- Keyboard shortcut (Cmd/Ctrl + K)
- Fuzzy search
- Result highlighting
- Recent searches
- Keyboard navigation

**VersionSwitcher.tsx**
- Version dropdown
- Stable/Beta/Legacy indicators
- Link to changelog

#### Utility Components

**Breadcrumbs.tsx**
- Auto-generated from route path
- Clickable navigation
- Mobile-responsive

**DocNavigation.tsx**
- Previous/Next page links
- Smart navigation within sections

**LoadingSkeleton.tsx**
- Content placeholders during loading
- Smooth transitions

**ErrorBoundary.tsx**
- Graceful error handling
- Error reporting
- Fallback UI

### Documentation Markdown Features

The markdown renderer supports enhanced features:

#### Code Blocks

```typescript
// Regular code block
const count = signal(0);
```

```typescript live
// Interactive playground (add 'live' to language)
const count = signal(0);
effect(() => console.log('Count:', count()));
```

#### Callouts

> 💡 **Tip:** This is a tip callout

> ⚠️ **Warning:** This is a warning callout

> ℹ️ **Note:** This is a note callout

> ❗ **Important:** This is an important callout

#### Features
- Automatic heading IDs for anchor links
- External link indicators
- Syntax highlighting
- Copy code buttons
- Responsive tables
- Image optimization

### Search Index

The search system uses a custom inverted index for fast, client-side searching:

**Features:**
- Tokenization and stemming
- Weighted scoring (titles > headings > content)
- Prefix matching
- Excerpt generation with context
- Debounced input
- Result ranking

**Implementation:**
- `SearchIndex` class for indexing
- Async initialization on page load
- Incremental updates
- Efficient memory usage

### API Documentation Generator

The site includes an API documentation generator that:

1. Parses TypeScript source files
2. Extracts TSDoc comments
3. Generates formatted API reference pages
4. Supports:
   - Function signatures
   - Parameter documentation
   - Return types
   - Examples
   - Since/Deprecated tags
   - Interface definitions
   - Type aliases

### Performance Optimizations

1. **Code Splitting**: Dynamic imports for routes and components
2. **Lazy Loading**: Images and heavy components loaded on demand
3. **Memoization**: Expensive computations cached
4. **Virtual Scrolling**: For long lists (search results, TOC)
5. **Bundle Size**: Tree-shaking and minification
6. **Preloading**: Smart preloading of likely-next pages
7. **Caching**: Service worker for offline support (PWA)

### Accessibility

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation
- Focus management
- Skip to content links
- Screen reader friendly
- Color contrast (WCAG AA)
- Reduced motion support

## Development

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run E2E tests
npm run test:e2e

# Type checking
npm run typecheck
```

### Project Structure

```
docs-site/
├── public/
│   └── md-files/          # Markdown documentation files
│       ├── getting-started/
│       ├── learn/
│       ├── api-reference/
│       └── ...
├── src/
│   ├── components/        # React components
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── SearchModal.tsx
│   │   └── ...
│   ├── lib/              # Utilities and libraries
│   │   ├── docs-structure.ts
│   │   ├── markdown-renderer.ts
│   │   ├── search-index.ts
│   │   ├── api-doc-generator.ts
│   │   └── theme.ts
│   ├── pages/            # Page components
│   │   ├── HomePage.tsx
│   │   ├── DocsPage.tsx
│   │   ├── ExamplesPage.tsx
│   │   └── PlaygroundPage.tsx
│   ├── styles/           # Global styles
│   │   ├── global.css
│   │   ├── design-tokens.ts
│   │   └── code-playground.css
│   ├── App.tsx           # Main app component
│   ├── Router.tsx        # Client-side router
│   └── main.tsx          # Entry point
├── tests/                # Playwright E2E tests
├── index.html
├── vite.config.ts
├── package.json
└── README.md
```

### Adding New Documentation

1. Create a markdown file in `public/md-files/{section}/{file}.md`
2. Add the entry to `src/lib/docs-structure.ts`
3. The search index will automatically include it

### Creating New Components

1. Add component to `src/components/`
2. Export from component file
3. Import and use in pages
4. Add tests in `tests/`

### Customizing Theme

Edit `src/styles/design-tokens.ts` and `src/lib/theme.ts`:

```typescript
export const designTokens = {
  colors: {
    brand: '#7c3aed',     // Primary brand color
    success: '#10b981',   // Success state
    warning: '#f59e0b',   // Warning state
    error: '#ef4444',     // Error state
    // ...
  },
  spacing: {
    // ...
  },
  typography: {
    // ...
  },
};
```

### Search Configuration

Adjust search behavior in `src/lib/search-index.ts`:

```typescript
// Customize weights
this.indexText(entry.title, index, 3);    // Title weight
this.indexText(heading, index, 2);        // Heading weight
this.indexText(entry.content, index, 1);  // Content weight

// Adjust excerpt length
const maxLength = 150;  // Characters in excerpt
```

## Deployment

### Build

```bash
npm run build
```

Outputs to `dist/` directory.

### Deploy to Vercel

```bash
vercel
```

Or use the `vercel.json` configuration:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev"
}
```

### Deploy to Netlify

Use the `netlify.toml` configuration:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Deploy to GitHub Pages

```bash
# Build
npm run build

# Deploy
npm run deploy
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

Tests include:
- Homepage navigation
- Documentation page loading
- Search functionality
- Theme switching
- Responsive behavior
- Accessibility checks

### Manual Testing

1. Theme switching works correctly
2. Search returns relevant results
3. Code playground executes code
4. Mobile menu functions
5. All links work
6. Breadcrumbs update correctly
7. TOC highlights active section
8. Copy buttons work

## Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../../LICENSE) file.

## Credits

Built with:
- PhilJS - The framework itself
- Vite - Build tool
- TypeScript - Type safety
- Highlight.js - Syntax highlighting
- Marked - Markdown parsing
- Playwright - E2E testing

---

**Live Site**: [https://philjs.dev](https://philjs.dev)

**Documentation**: [https://philjs.dev/docs](https://philjs.dev/docs)

**GitHub**: [https://github.com/philjs/philjs](https://github.com/philjs/philjs)

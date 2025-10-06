# PhilJS Documentation Site

Official documentation website for PhilJS - built with PhilJS itself (dogfooding!).

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## 📁 Project Structure

```
docs-site/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── CodeBlock.tsx
│   │   └── Callout.tsx
│   ├── pages/           # Page components
│   │   └── HomePage.tsx
│   ├── styles/          # Global styles and design tokens
│   │   ├── global.css
│   │   └── design-tokens.ts
│   ├── lib/             # Utilities
│   │   └── theme.ts
│   ├── data/            # Documentation content
│   │   └── docs.ts
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── public/              # Static assets
├── index.html           # HTML template
└── vite.config.ts       # Vite configuration
```

## ✨ Features Implemented

### Core Features
- ✅ Beautiful, modern homepage with hero section
- ✅ Feature showcase grid with 8 key features
- ✅ Responsive design (mobile-first)
- ✅ Dark mode with smooth transitions
- ✅ Syntax-highlighted code blocks with copy button
- ✅ Callout components (info, warning, success, error)

### Design System
- ✅ Design tokens (colors, typography, spacing)
- ✅ Reusable components (Button, CodeBlock, Callout)
- ✅ Theme context for light/dark mode
- ✅ Accessible focus styles
- ✅ Smooth animations and transitions

### Documentation Content
- ✅ Getting Started (Installation, Quick Start)
- ✅ Learn section (Signals, Components, Routing)
- ✅ Real, working code examples
- ✅ Best practices and tips

### Performance
- ⚡ Sub-second page loads
- ⚡ Optimized CSS (design tokens)
- ⚡ Code splitting ready
- ⚡ Minimal bundle size

## 🎨 Design Principles

- **Beautiful**: Modern, minimal design with attention to detail
- **Fast**: Sub-second page loads, optimized performance
- **Accessible**: WCAG AA compliant, keyboard navigable
- **Responsive**: Mobile-first, works on all devices
- **Interactive**: Live code examples, smooth transitions

## 🔧 Tech Stack

- **Framework**: PhilJS (dogfooding!)
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: CSS with design tokens
- **Syntax Highlighting**: Ready for Shiki integration

## 📝 Adding Documentation

Documentation is stored in `src/data/docs.ts`. To add a new page:

```ts
{
  title: 'Your Page Title',
  slug: 'category/page-slug',
  category: 'Category Name',
  content: `
# Your Page Title

Your markdown content here...
  `,
}
```

## 🚢 Deployment

### Vercel

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Build command
pnpm build

# Publish directory
dist
```

## 📊 Performance Targets

- First Contentful Paint: < 1s
- Time to Interactive: < 3s
- Lighthouse Score: 100
- Bundle Size: < 200KB (homepage)

## 🎯 Future Enhancements

- [ ] Full documentation site with routing
- [ ] Interactive code playground
- [ ] Search functionality (Cmd+K)
- [ ] API reference pages
- [ ] Blog section
- [ ] Examples gallery
- [ ] Community showcase

## 📄 License

MIT - Same as PhilJS core framework

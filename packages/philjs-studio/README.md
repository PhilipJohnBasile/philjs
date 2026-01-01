# @philjs/studio

Visual development studio for PhilJS applications. A comprehensive IDE-like environment for building, previewing, and deploying PhilJS components and applications.

## Installation

```bash
npm install @philjs/studio
# or
yarn add @philjs/studio
# or
pnpm add @philjs/studio
```

## Basic Usage

```bash
# Start the visual studio
npx philjs-studio

# Or with configuration
npx philjs-studio --port 4000 --project ./my-app
```

```tsx
// Embed studio in your app
import { Studio, StudioProvider } from '@philjs/studio';

function DevEnvironment() {
  return (
    <StudioProvider project="./src">
      <Studio />
    </StudioProvider>
  );
}
```

## Features

- **Visual Editor** - Drag-and-drop component composition
- **Code Editor** - Integrated code editor with IntelliSense
- **Component Library** - Browse and preview available components
- **Props Panel** - Visual editing of component properties
- **Live Preview** - Real-time preview of changes
- **State Inspector** - Debug component state and props
- **Design Tokens** - Manage colors, typography, spacing
- **Responsive Testing** - Test across device sizes
- **Component Docs** - Auto-generated documentation
- **Version Control** - Built-in Git integration
- **Deploy** - One-click deployment to cloud
- **Collaboration** - Real-time collaborative editing

## Panels

| Panel | Description |
|-------|-------------|
| Component Tree | Hierarchical view of components |
| Props Editor | Edit component properties |
| Code View | Source code editor |
| Preview | Live component preview |
| Console | Debug output and logs |
| Assets | Manage images and files |
| Styles | CSS and design tokens |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save changes |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+P` | Quick file open |
| `Ctrl+Space` | Autocomplete |
| `F5` | Refresh preview |

## Configuration

```json
// philjs-studio.config.json
{
  "port": 4000,
  "project": "./src",
  "components": "./src/components",
  "theme": "dark",
  "plugins": ["@philjs/studio-plugin-tailwind"]
}
```

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: (none detected)

### Public API
- Direct exports: (none detected)
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT

# @philjs/builder

A visual UI component builder and editor for React applications. Enables drag-and-drop component composition with real-time preview and code generation.

## Installation

```bash
npm install @philjs/builder
# or
yarn add @philjs/builder
# or
pnpm add @philjs/builder
```

## Basic Usage

```tsx
import { Builder, ComponentPalette, Canvas } from '@philjs/builder';

function App() {
  const handleSave = (components) => {
    console.log('Saved components:', components);
  };

  return (
    <Builder onSave={handleSave}>
      <ComponentPalette />
      <Canvas />
    </Builder>
  );
}
```

## Features

- **Visual Editor** - Drag-and-drop interface for building UI components
- **Component Palette** - Pre-built component library with customizable elements
- **Real-time Preview** - Instant visual feedback as you build
- **Code Generation** - Export to React/TypeScript code
- **Serialization** - Save and load component configurations
- **Template System** - Built-in templates for common UI patterns
- **Undo/Redo** - Full history management for editing operations
- **Responsive Design** - Preview components at different breakpoints
- **Custom Components** - Register your own components in the palette
- **Props Editor** - Visual interface for editing component properties

## API Reference

### Builder

Main container component that provides context for the editor.

### Canvas

The editable area where components are placed and arranged.

### ComponentPalette

Sidebar displaying available components for drag-and-drop.

### useBuilder

Hook for accessing builder state and actions programmatically.

## License

MIT

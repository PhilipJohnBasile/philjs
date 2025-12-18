# PhilJS VS Code Extension - Development Guide

## Overview

This is the official VS Code extension for PhilJS, providing comprehensive IDE support for PhilJS development.

## Features

### IntelliSense

- **Auto-completion**: Smart code completion for PhilJS APIs
  - Core primitives: `signal()`, `computed()`, `effect()`
  - Lifecycle hooks: `onMount()`, `onCleanup()`, `onError()`
  - Context API: `createContext()`, `useContext()`
  - Router hooks: `useNavigate()`, `useParams()`, `useLoaderData()`
  - SSR functions: `renderToString()`, `hydrate()`
  - Island components: `island()`

- **Hover Information**: Rich documentation on hover
  - Function signatures
  - Parameter descriptions
  - Usage examples
  - Links to official documentation

- **Signature Help**: Parameter hints while typing
  - Shows expected parameters
  - Type information
  - Parameter descriptions

### Code Actions

Quick fixes and refactorings:

- **Add .get() to signal access**: Automatically fix signal usage in JSX
- **Add effect cleanup**: Add cleanup function to effects
- **Add missing imports**: Auto-import PhilJS modules
- **Extract to signal**: Convert value to a reactive signal
- **Wrap in memo()**: Memoize a component
- **Convert to island**: Transform component to island component

### Diagnostics

Real-time error detection:

- Signal access without `.get()` in JSX
- `signal.set()` called directly in render
- Empty effect bodies
- Async effects without cleanup
- Unnecessary `memo()` usage
- `useContext()` outside components

### Code Generators

Generate boilerplate code:

- **Components**: Full component with props and types
- **Routes**: Route component with loader
- **Pages**: Page component with SEO meta tags
- **Hooks**: Custom hooks with signals
- **Stores**: State stores with actions

### Snippets

Over 30 code snippets for common patterns:

- Core: `psig`, `pcomp`, `peff`, `pmount`
- Components: `pfc`, `pfcs`, `pmemo`, `pctx`
- Routing: `proute`, `ploader`, `paction`, `papi`
- Islands: `pisland`
- Forms: `pform`
- Testing: `ptest`
- And more...

## Project Structure

```
philjs-vscode/
├── src/
│   ├── extension.ts              # Main extension entry point
│   ├── extension-enhanced.ts     # Enhanced version with all features
│   ├── generators.ts              # Code generation utilities
│   └── providers/
│       ├── completion.ts          # Basic completion provider
│       ├── completion-enhanced.ts # Enhanced completion with imports
│       ├── hover.ts               # Hover documentation
│       ├── definition.ts          # Go to definition
│       ├── diagnostics.ts         # Real-time diagnostics
│       ├── signature.ts           # Parameter hints
│       ├── code-actions.ts        # Quick fixes and refactorings
│       └── formatting.ts          # Code formatting
├── snippets/
│   ├── philjs.json                # Core snippets
│   └── philjs-enhanced.json       # Additional snippets
├── .vscode/
│   ├── launch.json                # Debug configuration
│   └── tasks.json                 # Build tasks
├── scripts/
│   ├── build.js                   # Build script
│   └── package.js                 # Packaging script
├── package.json                   # Extension manifest
├── package-enhanced.json          # Enhanced manifest with all features
├── language-configuration.json    # Language settings
├── tsconfig.json                  # TypeScript configuration
├── .vscodeignore                  # Files to exclude from package
├── README.md                      # User documentation
├── CHANGELOG.md                   # Version history
└── DEVELOPMENT.md                 # This file

```

## Development Setup

### Prerequisites

- Node.js >= 18
- VS Code >= 1.85.0
- TypeScript >= 5.0

### Installation

```bash
# Navigate to extension directory
cd packages/philjs-vscode

# Install dependencies
npm install

# Compile TypeScript
npm run compile
```

### Running the Extension

1. Open the `philjs-vscode` folder in VS Code
2. Press F5 to launch Extension Development Host
3. A new VS Code window opens with the extension loaded
4. Open a PhilJS project to test features

### Debugging

1. Set breakpoints in TypeScript files
2. Press F5 to start debugging
3. Use Debug Console to inspect variables
4. Check Output > PhilJS for extension logs

### Testing Changes

After making changes:

```bash
# Recompile
npm run compile

# Or watch mode
npm run watch
```

Then reload the Extension Development Host (Ctrl+R / Cmd+R).

## Building for Production

### Compile

```bash
npm run compile
```

This compiles TypeScript to JavaScript in the `dist` folder.

### Package

```bash
# Using npm script
npm run package

# Or directly
npx vsce package
```

This creates a `.vsix` file that can be installed in VS Code.

### Install Locally

```bash
code --install-extension philjs-vscode-1.0.0.vsix
```

## Publishing to Marketplace

### Prerequisites

1. Create a publisher account on [Visual Studio Marketplace](https://marketplace.visualstudio.com/)
2. Generate a Personal Access Token (PAT)
3. Login with vsce:

```bash
npx vsce login your-publisher-name
```

### Publish

```bash
# Update version in package.json
npm version patch  # or minor, major

# Publish
npm run publish

# Or directly
npx vsce publish
```

## Architecture

### Extension Activation

The extension activates when:
- Opening JavaScript/TypeScript files
- Using language: `javascript`, `typescript`, `javascriptreact`, `typescriptreact`

### Provider Registration

All language features are registered as providers:

```typescript
// Completion provider
vscode.languages.registerCompletionItemProvider(
  selector,
  new PhilJSCompletionProvider(),
  '.', '<', '/'
);

// Hover provider
vscode.languages.registerHoverProvider(
  selector,
  new PhilJSHoverProvider()
);

// And more...
```

### Context Detection

The extension detects PhilJS files by:
- Checking for `import` statements from PhilJS packages
- Looking for PhilJS API usage (`signal`, `computed`, etc.)

### Code Generation

Generators use VS Code's file system API:

```typescript
await fs.promises.writeFile(path, content);
const doc = await vscode.workspace.openTextDocument(path);
await vscode.window.showTextDocument(doc);
```

## Adding New Features

### Add a New Snippet

1. Open `snippets/philjs.json`
2. Add snippet definition:

```json
"Snippet Name": {
  "prefix": ["trigger", "alt-trigger"],
  "body": [
    "line 1",
    "line 2 with ${1:placeholder}"
  ],
  "description": "What this snippet does"
}
```

### Add a New Command

1. Add to `package.json`:

```json
"commands": [
  {
    "command": "philjs.myCommand",
    "title": "PhilJS: My Command"
  }
]
```

2. Register in `extension.ts`:

```typescript
context.subscriptions.push(
  vscode.commands.registerCommand('philjs.myCommand', async () => {
    // Implementation
  })
);
```

### Add a New Completion

1. Open `src/providers/completion-enhanced.ts`
2. Add to appropriate section:

```typescript
completions.push(
  this.createCompletion(
    'functionName',
    'Description',
    'const ${1:name} = functionName(${2:args});',
    vscode.CompletionItemKind.Function,
    'Detailed documentation'
  )
);
```

### Add a New Diagnostic

1. Open `src/providers/diagnostics.ts`
2. Add check method:

```typescript
private checkMyPattern(
  document: vscode.TextDocument,
  text: string,
  diagnostics: vscode.Diagnostic[]
): void {
  // Pattern matching and diagnostic creation
}
```

3. Call in `updateDiagnostics()`:

```typescript
this.checkMyPattern(document, text, diagnostics);
```

## Best Practices

1. **Performance**
   - Use regex carefully (can be slow on large files)
   - Cache computed values when possible
   - Debounce expensive operations

2. **User Experience**
   - Provide clear error messages
   - Add descriptions to all completions
   - Use appropriate diagnostic severities

3. **Code Quality**
   - Follow TypeScript best practices
   - Add JSDoc comments
   - Keep functions small and focused

4. **Testing**
   - Test on various file sizes
   - Verify in different VS Code versions
   - Test with and without PhilJS projects

## Troubleshooting

### Extension Not Activating

- Check activation events in `package.json`
- Verify file language IDs
- Check Output > Log (Extension Host) for errors

### Completions Not Showing

- Ensure trigger characters are registered
- Check `isPhilJSContext()` logic
- Verify completion item creation

### Diagnostics Not Working

- Check if diagnostic collection is created
- Verify event listeners are registered
- Ensure patterns match expected code

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/)
- [Extension Samples](https://github.com/microsoft/vscode-extension-samples)
- [PhilJS Documentation](https://philjs.dev/docs)

## Contributing

See main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT

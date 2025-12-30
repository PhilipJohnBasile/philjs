/**
 * PhilJS Interactive Playground
 *
 * A browser-based REPL for trying PhilJS code without installation.
 */

export { Playground, createPlayground } from './playground.js';
export { Editor, createEditor } from './editor.js';
export { Preview, createPreview } from './preview.js';
export { Console, createConsole } from './console.js';
export { compileCode, transpileCode } from './compiler.js';
export { exampleCode, tutorialSteps } from './examples.js';

export type {
  PlaygroundConfig,
  EditorConfig,
  PreviewConfig,
  CompileResult,
  ConsoleMessage,
} from './types.js';

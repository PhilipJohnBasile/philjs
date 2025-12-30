/**
 * @philjs/genui
 * Runtime AI-driven UI composition with A2UI protocol
 *
 * @packageDocumentation
 */

// Protocol
export {
  createRenderMessage,
  createUpdateMessage,
  createActionMessage,
} from './protocol/a2ui-schema.js';
export { validateMessage, validateComponent, validateLayout, schemas } from './protocol/validator.js';

// Registry
export {
  ComponentRegistry,
  createRegistry,
  getDefaultRegistry,
  setDefaultRegistry,
} from './registry/component-registry.js';
export { builtinComponents, registerBuiltins } from './registry/builtin-components.js';

// Sandbox
export {
  ASTValidator,
  createValidator,
  DEFAULT_SANDBOX_CONFIG,
} from './sandbox/ast-validator.js';

// Runtime
export { GenUIHydrator, createHydrator } from './runtime/hydrator.js';

// Hooks
export {
  useGenUI,
  useAgentUI,
  createMockAgent,
  createLayoutGenerator,
} from './hooks.js';

// Types (re-export all)
export * from './types.js';

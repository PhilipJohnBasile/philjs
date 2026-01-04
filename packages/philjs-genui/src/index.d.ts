/**
 * @philjs/genui
 * Runtime AI-driven UI composition with A2UI protocol
 *
 * @packageDocumentation
 */
export { createRenderMessage, createUpdateMessage, createActionMessage, } from './protocol/a2ui-schema.js';
export { validateMessage, validateComponent, validateLayout, schemas } from './protocol/validator.js';
export { ComponentRegistry, createRegistry, getDefaultRegistry, setDefaultRegistry, } from './registry/component-registry.js';
export { builtinComponents, registerBuiltins } from './registry/builtin-components.js';
export { ASTValidator, createValidator, DEFAULT_SANDBOX_CONFIG, } from './sandbox/ast-validator.js';
export { GenUIHydrator, createHydrator } from './runtime/hydrator.js';
export { useGenUI, useAgentUI, createMockAgent, createLayoutGenerator, } from './hooks.js';
export * from './types.js';
//# sourceMappingURL=index.d.ts.map
/**
 * Server-side exports for PhilJS Resumable
 *
 * This module provides all server-side rendering and serialization utilities.
 */

// Render
export {
  createSSRContext,
  getSSRContext,
  withSSRContext,
  renderToResumableHTML,
  renderNodeToHTML,
  generateStateScript,
  generateBootstrapScript,
  createStreamingRenderer,
} from './render.js';

// Serialize
export {
  createSerializationContext,
  getSerializationContext,
  withSerializationContext,
  generateId,
  serializeValue,
  serializeCaptures,
  registerElement,
  registerSignal,
  addSignalSubscriber,
  registerComponent,
  serializeState,
  serializeStateToJSON,
  serializeToAttribute,
  generateInlineState,
  createStreamingContext,
  addStreamingChunk,
  generateElementAttributes,
} from './serialize.js';

// QRL
export {
  configureQRL,
  clearQRLRegistry,
  registerChunk,
  registerChunks,
  createQRL,
  parseQRL,
  $,
  generateQRL,
  component$,
  event$,
  qrl,
  inlineQRL,
  onClick$,
  onInput$,
  onChange$,
  onSubmit$,
  onKeyDown$,
  onKeyUp$,
  onFocus$,
  onBlur$,
  isQRL,
  getQRLAttribute,
  prefetchQRL,
  prefetchQRLs,
  server$,
  browser$,
  useVisibleTask$,
  useTask$,
} from './qrl.js';

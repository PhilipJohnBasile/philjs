/**
 * @file Godot Integration
 * @description Complete Godot HTML5 export integration for PhilJS
 */

// Types
export type {
  GodotEngine,
  GodotConfig,
  GodotJSInterface,
  GodotInstance,
  GodotState,
  GodotEmbedProps,
  UseGodotResult,
  SignalHandler,
} from './types';

// Hooks
export {
  createGodotInstance,
  useGodot,
  callGodot,
  onGodotSignal,
  disposeGodot,
  syncToGodot,
  syncFromGodot,
  createGodotBridge,
} from './hooks';

// Components
export {
  GodotEmbed,
  createGodotEmbedElement,
  GodotLoadingIndicator,
} from './GodotEmbed';

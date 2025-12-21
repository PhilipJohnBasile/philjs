/**
 * @file Unreal Engine Integration
 * @description Complete Unreal Engine Pixel Streaming integration for PhilJS
 */

// Types
export type {
  PixelStreamingConfig,
  WebRTCStats,
  PixelStreamingInputEvent,
  KeyboardInputData,
  MouseInputData,
  TouchInputData,
  GamepadInputData,
  ConsoleCommandOptions,
  UnrealCustomEvent,
  PixelStreamingInstance,
  UnrealEmbedProps,
  UnrealState,
  UseUnrealResult,
} from './types';

// Hooks
export {
  createPixelStreamingInstance,
  useUnreal,
  setupInputForwarding,
  disposeUnreal,
} from './hooks';

// Components
export {
  UnrealEmbed,
  createUnrealEmbedElement,
  UnrealStatsOverlay,
} from './UnrealEmbed';

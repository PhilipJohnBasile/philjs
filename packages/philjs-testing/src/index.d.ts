/**
 * PhilJS Testing Library
 *
 * Official testing utilities for PhilJS applications.
 * Provides render, queries, events, and utilities for testing components.
 */
export { render, cleanup, RenderResult, RenderOptions } from './render';
export { screen, within, queries } from './queries';
export type { BoundFunctions, Queries } from './queries';
export { fireEvent, createEvent } from './events';
export { userEvent, user, setup } from './user-event';
export { renderHook, act, cleanupHooks, HookResult } from './hooks';
export { waitFor, waitForElementToBeRemoved, findByRole, findByText, waitForLoadingToFinish, waitForNetworkIdle, delay, WaitForOptions, } from './async';
export { debug, logDOM, prettyDOM, debugSignals, debugA11y, debugForm, snapshot, compareSnapshots, } from './debug';
export { toBeInTheDocument, toHaveTextContent, toBeVisible, toBeDisabled, toBeEnabled, toHaveAttribute, toHaveClass, toHaveStyle, toHaveFocus, toHaveValue, toBeChecked, toBeEmptyDOMElement, MatcherResult, } from './matchers';
export { createMockSignal, createMockComputed, signalValue, waitForSignal, waitForSignalValue, assertSignalHistory, MockSignal, } from './signals';
//# sourceMappingURL=index.d.ts.map
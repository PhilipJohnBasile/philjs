/**
 * PhilJS Testing Library
 *
 * Official testing utilities for PhilJS applications.
 * Provides render, queries, events, and utilities for testing components.
 */
// Core rendering
export { render, cleanup } from './render';
// Queries (re-exported from @testing-library/dom with PhilJS enhancements)
export { screen, within, queries } from './queries';
// Events
export { fireEvent, createEvent } from './events';
export { userEvent, user, setup } from './user-event';
// Hooks testing
export { renderHook, act, cleanupHooks } from './hooks';
// Async utilities
export { waitFor, waitForElementToBeRemoved, findByRole, findByText, waitForLoadingToFinish, waitForNetworkIdle, delay, } from './async';
// Debug utilities
export { debug, logDOM, prettyDOM, debugSignals, debugA11y, debugForm, snapshot, compareSnapshots, } from './debug';
// Matchers
export { toBeInTheDocument, toHaveTextContent, toBeVisible, toBeDisabled, toBeEnabled, toHaveAttribute, toHaveClass, toHaveStyle, toHaveFocus, toHaveValue, toBeChecked, toBeEmptyDOMElement, } from './matchers';
// Signal testing utilities
export { createMockSignal, createMockComputed, signalValue, waitForSignal, waitForSignalValue, assertSignalHistory, } from './signals';
//# sourceMappingURL=index.js.map
/**
 * PhilJS Testing Library
 *
 * Official testing utilities for PhilJS applications.
 * Provides render, queries, events, and utilities for testing components.
 */

// Core rendering
export { render, cleanup, RenderResult, RenderOptions } from './render';

// Queries (re-exported from @testing-library/dom with PhilJS enhancements)
export { screen, within, queries } from './queries';
export type { BoundFunctions, Queries } from './queries';

// Events
export { fireEvent, createEvent } from './events';
export { userEvent, user, setup } from './user-event';

// Hooks testing
export { renderHook, act, cleanupHooks, HookResult } from './hooks';

// Async utilities
export {
  waitFor,
  waitForElementToBeRemoved,
  findByRole,
  findByText,
  waitForLoadingToFinish,
  waitForNetworkIdle,
  delay,
  WaitForOptions,
} from './async';

// Debug utilities
export {
  debug,
  logDOM,
  prettyDOM,
  debugSignals,
  debugA11y,
  debugForm,
  snapshot,
  compareSnapshots,
} from './debug';

// Matchers
export {
  toBeInTheDocument,
  toHaveTextContent,
  toBeVisible,
  toBeDisabled,
  toBeEnabled,
  toHaveAttribute,
  toHaveClass,
  toHaveStyle,
  toHaveFocus,
  toHaveValue,
  toBeChecked,
  toBeEmptyDOMElement,
  MatcherResult,
} from './matchers';

// Signal testing utilities
export {
  createMockSignal,
  createMockComputed,
  signalValue,
  waitForSignal,
  waitForSignalValue,
  assertSignalHistory,
  MockSignal,
} from './signals';

// Snapshot testing
export {
  takeSnapshot,
  createSnapshotMatcher,
  snapshotSignalState,
  compareSignalSnapshots,
  SnapshotOptions,
  SnapshotResult,
  SnapshotMatcher,
} from './snapshot';

// Route testing utilities
export {
  createMockRoute,
  createMockLoader,
  createMockAction,
  createMockRequest,
  createMockFormData,
  testLoader,
  testLoaderWithParams,
  expectLoaderToReturn,
  expectLoaderToThrow,
  testAction,
  testPostAction,
  expectActionToReturn,
  expectActionToThrow,
  testNavigation,
  waitForNavigation,
  waitForLoaderData,
  assertRouteParams,
  assertSearchParams,
  assertNavigationState,
} from './route-testing';

export type {
  MockRouteOptions,
  NavigationState,
  MockLoader,
  MockAction,
  LoaderArgs,
  ActionArgs,
  RouteTestContext,
  NavigateOptions,
  SubmitOptions,
} from './route-testing';

// Integration testing utilities
export {
  IntegrationTestContext,
  createIntegrationTest,
  createAPITestHelper,
  createDatabaseTestHelper,
  createAuthTestHelper,
  testRouteFlow,
  measureResponseTime,
  benchmarkRoute,
  expectHTMLSnapshot,
  expectJSONSnapshot,
  waitFor as integrationWaitFor,
  retry,
} from './integration';

export type {
  IntegrationTestOptions,
  TestContext,
  APITestHelper,
} from './integration';

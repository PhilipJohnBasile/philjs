/**
 * PhilJS Testing Library
 *
 * Official testing utilities for PhilJS applications.
 * Provides render, queries, events, and utilities for testing components.
 */
// Core rendering
export { render, cleanup } from './render.js';
// Queries (re-exported from @testing-library/dom with PhilJS enhancements)
export { screen, within, queries } from './queries.js';
// Events
export { fireEvent, createEvent } from './events.js';
export { userEvent, user, setup } from './user-event.js';
// Hooks testing
export { renderHook, act, cleanupHooks } from './hooks.js';
// Async utilities
export { waitFor, waitForElementToBeRemoved, findByRole, findByText, waitForLoadingToFinish, waitForNetworkIdle, delay, } from './async.js';
// Debug utilities
export { debug, logDOM, prettyDOM, debugSignals, debugA11y, debugForm, snapshot, compareSnapshots, } from './debug.js';
// Matchers
export { toBeInTheDocument, toHaveTextContent, toBeVisible, toBeDisabled, toBeEnabled, toHaveAttribute, toHaveClass, toHaveStyle, toHaveFocus, toHaveValue, toBeChecked, toBeEmptyDOMElement, } from './matchers.js';
// Signal testing utilities
export { createMockSignal, createMockComputed, signalValue, waitForSignal, waitForSignalValue, assertSignalHistory, } from './signals.js';
// Snapshot testing
export { takeSnapshot, createSnapshotMatcher, snapshotSignalState, compareSignalSnapshots, } from './snapshot.js';
// Route testing utilities
export { createMockRoute, createMockLoader, createMockAction, createMockRequest, createMockFormData, testLoader, testLoaderWithParams, expectLoaderToReturn, expectLoaderToThrow, testAction, testPostAction, expectActionToReturn, expectActionToThrow, testNavigation, waitForNavigation, waitForLoaderData, assertRouteParams, assertSearchParams, assertNavigationState, } from './route-testing.js';
// Integration testing utilities
export { IntegrationTestContext, createIntegrationTest, createAPITestHelper, createDatabaseTestHelper, createAuthTestHelper, testRouteFlow, measureResponseTime, benchmarkRoute, expectHTMLSnapshot, expectJSONSnapshot, waitFor as integrationWaitFor, retry, } from './integration.js';
// Component Testing
export { testComponent, visualTest, createVisualSnapshot, updateVisualSnapshot, expectNoA11yViolations, measureRenderPerformance, expectRenderWithinBudget, interactionTest, createFixture, componentFixture, } from './component-testing.js';
// Network Mocking
export { createNetworkMock, json, error as networkError, delayed, flaky, paginated, withHeaders, withBody, withQuery, expectRequest, expectRequestCount, expectNoRequests, getNetworkStats, createGraphQLMock, createWebSocketMock, } from './network-mocking.js';
//# sourceMappingURL=index.js.map
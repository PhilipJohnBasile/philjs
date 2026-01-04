/**
 * PhilJS Testing Library
 *
 * Official testing utilities for PhilJS applications.
 * Provides render, queries, events, and utilities for testing components.
 */
export { render, cleanup } from './render.js';
export type { RenderResult, RenderOptions } from './render.js';
export { screen, within, queries } from './queries.js';
export type { BoundFunctions, Queries } from './queries.js';
export { fireEvent, createEvent } from './events.js';
export { userEvent, user, setup } from './user-event.js';
export { renderHook, act, cleanupHooks } from './hooks.js';
export type { HookResult } from './hooks.js';
export { waitFor, waitForElementToBeRemoved, findByRole, findByText, waitForLoadingToFinish, waitForNetworkIdle, delay, } from './async.js';
export type { WaitForOptions } from './async.js';
export { debug, logDOM, prettyDOM, debugSignals, debugA11y, debugForm, snapshot, compareSnapshots, } from './debug.js';
export { toBeInTheDocument, toHaveTextContent, toBeVisible, toBeDisabled, toBeEnabled, toHaveAttribute, toHaveClass, toHaveStyle, toHaveFocus, toHaveValue, toBeChecked, toBeEmptyDOMElement, } from './matchers.js';
export type { MatcherResult } from './matchers.js';
export { createMockSignal, createMockComputed, signalValue, waitForSignal, waitForSignalValue, assertSignalHistory, } from './signals.js';
export type { MockSignal } from './signals.js';
export { takeSnapshot, createSnapshotMatcher, snapshotSignalState, compareSignalSnapshots, } from './snapshot.js';
export type { SnapshotOptions, SnapshotResult, SnapshotMatcher } from './snapshot.js';
export { createMockRoute, createMockLoader, createMockAction, createMockRequest, createMockFormData, testLoader, testLoaderWithParams, expectLoaderToReturn, expectLoaderToThrow, testAction, testPostAction, expectActionToReturn, expectActionToThrow, testNavigation, waitForNavigation, waitForLoaderData, assertRouteParams, assertSearchParams, assertNavigationState, } from './route-testing.js';
export type { MockRouteOptions, NavigationState, MockLoader, MockAction, LoaderArgs, ActionArgs, RouteTestContext, NavigateOptions, SubmitOptions, } from './route-testing.js';
export { IntegrationTestContext, createIntegrationTest, createAPITestHelper, createDatabaseTestHelper, createAuthTestHelper, testRouteFlow, measureResponseTime, benchmarkRoute, expectHTMLSnapshot, expectJSONSnapshot, waitFor as integrationWaitFor, retry, } from './integration.js';
export type { IntegrationTestOptions, TestContext, APITestHelper, } from './integration.js';
export { testComponent, visualTest, createVisualSnapshot, updateVisualSnapshot, expectNoA11yViolations, measureRenderPerformance, expectRenderWithinBudget, interactionTest, createFixture, componentFixture, } from './component-testing.js';
export type { ComponentTestConfig, ComponentTestResult, A11yReport, A11yViolation, A11yPass, A11yIncomplete, PerformanceMetrics, ComponentQueries, QueryOptions, VisualTestOptions, VisualDiff, TestFixture, } from './component-testing.js';
export { createNetworkMock, json, error as networkError, delayed, flaky, paginated, withHeaders, withBody, withQuery, expectRequest, expectRequestCount, expectNoRequests, getNetworkStats, createGraphQLMock, createWebSocketMock, } from './network-mocking.js';
export type { MockRequest, MockResponse, MockHandler, NetworkMock, MockResponseConfig, NetworkStats, GraphQLMock, WebSocketMock, } from './network-mocking.js';
//# sourceMappingURL=index.d.ts.map
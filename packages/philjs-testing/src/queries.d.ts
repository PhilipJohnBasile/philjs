/**
 * PhilJS Testing - Query Utilities
 *
 * Re-exports @testing-library/dom queries with PhilJS enhancements
 */
import * as dtl from '@testing-library/dom';
export type Queries = typeof dtl.queries;
export type BoundFunctions = ReturnType<typeof dtl.within>;
export declare const queries: typeof dtl.queries;
export declare const screen: dtl.Screen<typeof dtl.queries>;
export declare const within: typeof dtl.getQueriesForElement;
export declare const getByRole: typeof dtl.getByRole, getAllByRole: typeof dtl.getAllByRole, queryByRole: typeof dtl.queryByRole, queryAllByRole: typeof dtl.queryAllByRole, findByRole: typeof dtl.findByRole, findAllByRole: typeof dtl.findAllByRole, getByText: typeof dtl.getByText, getAllByText: typeof dtl.getAllByText, queryByText: typeof dtl.queryByText, queryAllByText: typeof dtl.queryAllByText, findByText: typeof dtl.findByText, findAllByText: typeof dtl.findAllByText, getByTestId: typeof dtl.getByTestId, getAllByTestId: typeof dtl.getAllByTestId, queryByTestId: typeof dtl.queryByTestId, queryAllByTestId: typeof dtl.queryAllByTestId, findByTestId: typeof dtl.findByTestId, findAllByTestId: typeof dtl.findAllByTestId, getByLabelText: typeof dtl.getByLabelText, getAllByLabelText: typeof dtl.getAllByLabelText, queryByLabelText: typeof dtl.queryByLabelText, queryAllByLabelText: typeof dtl.queryAllByLabelText, findByLabelText: typeof dtl.findByLabelText, findAllByLabelText: typeof dtl.findAllByLabelText, getByPlaceholderText: typeof dtl.getByPlaceholderText, getAllByPlaceholderText: typeof dtl.getAllByPlaceholderText, queryByPlaceholderText: typeof dtl.queryByPlaceholderText, queryAllByPlaceholderText: typeof dtl.queryAllByPlaceholderText, findByPlaceholderText: typeof dtl.findByPlaceholderText, findAllByPlaceholderText: typeof dtl.findAllByPlaceholderText, getByDisplayValue: typeof dtl.getByDisplayValue, getAllByDisplayValue: typeof dtl.getAllByDisplayValue, queryByDisplayValue: typeof dtl.queryByDisplayValue, queryAllByDisplayValue: typeof dtl.queryAllByDisplayValue, findByDisplayValue: typeof dtl.findByDisplayValue, findAllByDisplayValue: typeof dtl.findAllByDisplayValue, getByAltText: typeof dtl.getByAltText, getAllByAltText: typeof dtl.getAllByAltText, queryByAltText: typeof dtl.queryByAltText, queryAllByAltText: typeof dtl.queryAllByAltText, findByAltText: typeof dtl.findByAltText, findAllByAltText: typeof dtl.findAllByAltText, getByTitle: typeof dtl.getByTitle, getAllByTitle: typeof dtl.getAllByTitle, queryByTitle: typeof dtl.queryByTitle, queryAllByTitle: typeof dtl.queryAllByTitle, findByTitle: typeof dtl.findByTitle, findAllByTitle: typeof dtl.findAllByTitle;
/**
 * Query by signal value - PhilJS specific
 */
export declare function queryBySignalValue(container: HTMLElement, signalName: string, value: unknown): HTMLElement | null;
/**
 * Query all elements with a specific signal binding
 */
export declare function queryAllBySignal(container: HTMLElement, signalName: string): HTMLElement[];
//# sourceMappingURL=queries.d.ts.map
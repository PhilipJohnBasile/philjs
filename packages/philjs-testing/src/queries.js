/**
 * PhilJS Testing - Query Utilities
 *
 * Re-exports @testing-library/dom queries with PhilJS enhancements
 */
import * as dtl from '@testing-library/dom';
// Re-export all queries from @testing-library/dom
export const queries = dtl.queries;
// Screen object for querying the document.body
export const screen = dtl.screen;
// Within for scoped queries
export const within = dtl.within;
// Query helpers
export const { getByRole, getAllByRole, queryByRole, queryAllByRole, findByRole, findAllByRole, getByText, getAllByText, queryByText, queryAllByText, findByText, findAllByText, getByTestId, getAllByTestId, queryByTestId, queryAllByTestId, findByTestId, findAllByTestId, getByLabelText, getAllByLabelText, queryByLabelText, queryAllByLabelText, findByLabelText, findAllByLabelText, getByPlaceholderText, getAllByPlaceholderText, queryByPlaceholderText, queryAllByPlaceholderText, findByPlaceholderText, findAllByPlaceholderText, getByDisplayValue, getAllByDisplayValue, queryByDisplayValue, queryAllByDisplayValue, findByDisplayValue, findAllByDisplayValue, getByAltText, getAllByAltText, queryByAltText, queryAllByAltText, findByAltText, findAllByAltText, getByTitle, getAllByTitle, queryByTitle, queryAllByTitle, findByTitle, findAllByTitle, } = dtl;
/**
 * Query by signal value - PhilJS specific
 */
export function queryBySignalValue(container, signalName, value) {
    // Find elements that display signal values
    const elements = container.querySelectorAll('[data-signal]');
    for (const el of elements) {
        if (el.getAttribute('data-signal') === signalName) {
            const textContent = el.textContent?.trim();
            if (textContent === String(value)) {
                return el;
            }
        }
    }
    return null;
}
/**
 * Query all elements with a specific signal binding
 */
export function queryAllBySignal(container, signalName) {
    const elements = container.querySelectorAll(`[data-signal="${signalName}"]`);
    return Array.from(elements);
}
//# sourceMappingURL=queries.js.map
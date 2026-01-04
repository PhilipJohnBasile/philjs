/**
 * PhilJS Testing - Render Utilities
 */
import { queries } from './queries.js';
export interface RenderOptions {
    container?: HTMLElement;
    baseElement?: HTMLElement;
    wrapper?: (props: {
        children: any;
    }) => any;
    hydrate?: boolean;
}
export interface RenderResult {
    container: HTMLElement;
    baseElement: HTMLElement;
    debug: (el?: HTMLElement) => void;
    rerender: (ui: any) => void;
    unmount: () => void;
    asFragment: () => DocumentFragment;
    getByRole: typeof queries.getByRole;
    getAllByRole: typeof queries.getAllByRole;
    queryByRole: typeof queries.queryByRole;
    queryAllByRole: typeof queries.queryAllByRole;
    findByRole: typeof queries.findByRole;
    findAllByRole: typeof queries.findAllByRole;
    getByText: typeof queries.getByText;
    getAllByText: typeof queries.getAllByText;
    queryByText: typeof queries.queryByText;
    queryAllByText: typeof queries.queryAllByText;
    findByText: typeof queries.findByText;
    findAllByText: typeof queries.findAllByText;
    getByTestId: typeof queries.getByTestId;
    getAllByTestId: typeof queries.getAllByTestId;
    queryByTestId: typeof queries.queryByTestId;
    queryAllByTestId: typeof queries.queryAllByTestId;
    findByTestId: typeof queries.findByTestId;
    findAllByTestId: typeof queries.findAllByTestId;
    getByLabelText: typeof queries.getByLabelText;
    getAllByLabelText: typeof queries.getAllByLabelText;
    queryByLabelText: typeof queries.queryByLabelText;
    queryAllByLabelText: typeof queries.queryAllByLabelText;
    findByLabelText: typeof queries.findByLabelText;
    findAllByLabelText: typeof queries.findAllByLabelText;
    getByPlaceholderText: typeof queries.getByPlaceholderText;
    getAllByPlaceholderText: typeof queries.getAllByPlaceholderText;
    queryByPlaceholderText: typeof queries.queryByPlaceholderText;
    queryAllByPlaceholderText: typeof queries.queryAllByPlaceholderText;
    findByPlaceholderText: typeof queries.findByPlaceholderText;
    findAllByPlaceholderText: typeof queries.findAllByPlaceholderText;
    getByDisplayValue: typeof queries.getByDisplayValue;
    getAllByDisplayValue: typeof queries.getAllByDisplayValue;
    queryByDisplayValue: typeof queries.queryByDisplayValue;
    queryAllByDisplayValue: typeof queries.queryAllByDisplayValue;
    findByDisplayValue: typeof queries.findByDisplayValue;
    findAllByDisplayValue: typeof queries.findAllByDisplayValue;
    getByAltText: typeof queries.getByAltText;
    getAllByAltText: typeof queries.getAllByAltText;
    queryByAltText: typeof queries.queryByAltText;
    queryAllByAltText: typeof queries.queryAllByAltText;
    findByAltText: typeof queries.findByAltText;
    findAllByAltText: typeof queries.findAllByAltText;
    getByTitle: typeof queries.getByTitle;
    getAllByTitle: typeof queries.getAllByTitle;
    queryByTitle: typeof queries.queryByTitle;
    queryAllByTitle: typeof queries.queryAllByTitle;
    findByTitle: typeof queries.findByTitle;
    findAllByTitle: typeof queries.findAllByTitle;
}
/**
 * Render a PhilJS component into a container for testing
 */
export declare function render(ui: any, options?: RenderOptions): RenderResult;
/**
 * Cleanup all rendered containers
 */
export declare function cleanup(): void;
//# sourceMappingURL=render.d.ts.map
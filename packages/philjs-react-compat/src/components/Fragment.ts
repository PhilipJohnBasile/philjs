/**
 * React Fragment compatibility.
 * PhilJS already has Fragment support built-in, so we just re-export it.
 */

export { Fragment } from 'philjs-core';

/**
 * React Fragment component.
 * Groups multiple children without adding extra DOM nodes.
 *
 * @example
 * ```tsx
 * import { Fragment } from 'philjs-react-compat';
 *
 * function List() {
 *   return (
 *     <Fragment>
 *       <li>Item 1</li>
 *       <li>Item 2</li>
 *       <li>Item 3</li>
 *     </Fragment>
 *   );
 * }
 *
 * // Or use the shorthand syntax <>...</>
 * function List() {
 *   return (
 *     <>
 *       <li>Item 1</li>
 *       <li>Item 2</li>
 *       <li>Item 3</li>
 *     </>
 *   );
 * }
 * ```
 */

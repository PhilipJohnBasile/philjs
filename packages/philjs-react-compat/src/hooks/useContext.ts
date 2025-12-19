/**
 * React useContext compatibility - direct re-export from PhilJS core.
 * PhilJS's context API is already compatible with React's.
 */

export { createContext, useContext, type Context } from 'philjs-core';

/**
 * Create a context with a default value.
 * This is identical to React's createContext.
 *
 * @example
 * ```tsx
 * const ThemeContext = createContext('light');
 *
 * function App() {
 *   return (
 *     <ThemeContext.Provider value="dark">
 *       <ThemedButton />
 *     </ThemeContext.Provider>
 *   );
 * }
 *
 * function ThemedButton() {
 *   const theme = useContext(ThemeContext);
 *   return <button className={theme}>Button</button>;
 * }
 * ```
 */

/**
 * Use a context value in a component.
 * This is identical to React's useContext.
 *
 * @example
 * ```tsx
 * function Component() {
 *   const theme = useContext(ThemeContext);
 *   const user = useContext(UserContext);
 *
 *   return <div className={theme}>{user.name}</div>;
 * }
 * ```
 */

/**
 * Helper hook to create a context with a signal value.
 * Useful for reactive context that updates automatically.
 *
 * @example
 * ```tsx
 * import { signal } from 'philjs-core';
 *
 * const ThemeContext = createContext({ theme: signal('light') });
 *
 * function App() {
 *   const theme = signal('light');
 *
 *   return (
 *     <ThemeContext.Provider value={{ theme }}>
 *       <ThemedButton />
 *     </ThemeContext.Provider>
 *   );
 * }
 *
 * function ThemedButton() {
 *   const { theme } = useContext(ThemeContext);
 *
 *   return (
 *     <button className={theme()}>
 *       <span onClick={() => theme.set(theme() === 'light' ? 'dark' : 'light')}>
 *         Toggle Theme
 *       </span>
 *     </button>
 *   );
 * }
 * ```
 */

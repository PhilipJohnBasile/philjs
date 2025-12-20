/**
 * Dark mode implementation example
 * Shows how to implement dark mode with Tailwind
 */

import { useState, useEffect } from "react";
import { dark } from "philjs-plugin-tailwind/utils";

/**
 * Dark mode toggle hook
 */
export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check system preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);

    // Check localStorage
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }

    // Listen for system changes
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const toggleDark = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", !isDark ? "dark" : "light");
  };

  return { isDark, toggleDark };
}

/**
 * Dark mode toggle component
 */
export function DarkModeToggle() {
  const { isDark, toggleDark } = useDarkMode();

  return (
    <button
      onClick={toggleDark}
      className={dark(
        "bg-gray-200 text-gray-800",
        "bg-gray-700 text-white"
      )}
      aria-label="Toggle dark mode"
    >
      {isDark ? "🌙" : "☀️"}
    </button>
  );
}

/**
 * Example component with dark mode styles
 */
export function DarkModeExample() {
  return (
    <div className={dark(
      "bg-white text-gray-900",
      "bg-gray-900 text-white"
    )}>
      <header className="p-6 border-b dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My App</h1>
          <DarkModeToggle />
        </div>
      </header>

      <main className="p-6">
        <article className={dark(
          "bg-gray-50 text-gray-900",
          "bg-gray-800 text-gray-100"
        )}>
          <h2 className="text-xl font-semibold mb-4">
            Dark Mode Example
          </h2>

          <p className="mb-4">
            This component adapts to dark mode automatically.
          </p>

          <div className="space-y-4">
            <div className={dark(
              "bg-blue-100 border-blue-300 text-blue-900",
              "bg-blue-900 border-blue-700 text-blue-100"
            )}>
              Info message
            </div>

            <div className={dark(
              "bg-green-100 border-green-300 text-green-900",
              "bg-green-900 border-green-700 text-green-100"
            )}>
              Success message
            </div>

            <div className={dark(
              "bg-red-100 border-red-300 text-red-900",
              "bg-red-900 border-red-700 text-red-100"
            )}>
              Error message
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}

/**
 * Theme provider example (for app-wide dark mode)
 */
export function ThemeProvider({ children }) {
  const { isDark, toggleDark } = useDarkMode();

  return (
    <div className={isDark ? "dark" : ""}>
      <ThemeContext.Provider value={{ isDark, toggleDark }}>
        {children}
      </ThemeContext.Provider>
    </div>
  );
}

/**
 * Usage in app
 */
export function App() {
  return (
    <ThemeProvider>
      <DarkModeExample />
    </ThemeProvider>
  );
}

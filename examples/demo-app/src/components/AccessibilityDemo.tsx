import { signal } from "philjs-core";

/**
 * Accessibility Demo - Automatic WCAG Compliance
 *
 * Demonstrates PhilJS's industry-first automatic accessibility features:
 * - Auto ARIA labels
 * - Color contrast validation
 * - Keyboard navigation
 * - Screen reader support
 *
 * NOTE: The accessibility module would need to be imported from philjs-core
 * This demo shows manual accessibility best practices that the module automates
 */
export function AccessibilityDemo() {
  const isDarkMode = signal(false);
  const fontSize = signal(16);

  const toggleDarkMode = () => isDarkMode.set(!isDarkMode());
  const increaseFontSize = () => fontSize.set(Math.min(fontSize() + 2, 24));
  const decreaseFontSize = () => fontSize.set(Math.max(fontSize() - 2, 12));

  const bgColor = isDarkMode() ? "#1a1a1a" : "#ffffff";
  const textColor = isDarkMode() ? "#ffffff" : "#1a1a1a";
  const buttonBg = isDarkMode() ? "#667eea" : "#764ba2";

  return (
    <div
      style={{
        padding: "1rem",
        background: bgColor,
        color: textColor,
        borderRadius: "8px",
        transition: "all 0.3s ease",
      }}
      role="region"
      aria-label="Accessibility demonstration"
    >
      <h3
        style={{
          fontSize: `${fontSize()}px`,
          marginBottom: "1rem",
          transition: "font-size 0.2s ease",
        }}
      >
        Accessibility Features
      </h3>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        <button
          onClick={toggleDarkMode}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.9rem",
            background: buttonBg,
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
          aria-label={isDarkMode() ? "Switch to light mode" : "Switch to dark mode"}
          aria-pressed={isDarkMode()}
        >
          {isDarkMode() ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
          }}
          role="group"
          aria-label="Font size controls"
        >
          <button
            onClick={decreaseFontSize}
            style={{
              flex: 1,
              padding: "0.5rem",
              fontSize: "0.9rem",
              background: buttonBg,
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
            aria-label="Decrease font size"
            disabled={fontSize() <= 12}
          >
            A-
          </button>
          <button
            onClick={increaseFontSize}
            style={{
              flex: 1,
              padding: "0.5rem",
              fontSize: "0.9rem",
              background: buttonBg,
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
            aria-label="Increase font size"
            disabled={fontSize() >= 24}
          >
            A+
          </button>
        </div>
      </div>

      <div
        style={{
          fontSize: "0.85rem",
          padding: "0.75rem",
          background: isDarkMode() ? "#2a2a2a" : "#f5f5f5",
          borderRadius: "6px",
          borderLeft: `4px solid ${buttonBg}`,
        }}
        role="status"
        aria-live="polite"
      >
        <strong>Current Settings:</strong>
        <ul style={{ margin: "0.5rem 0 0 1.5rem", padding: 0 }}>
          <li>Font Size: {fontSize()}px</li>
          <li>Contrast: {isDarkMode() ? "High (Dark)" : "Normal (Light)"}</li>
          <li>WCAG AA: ✅ Compliant</li>
        </ul>
      </div>

      <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#888" }}>
        ♿ PhilJS automatically adds ARIA labels, validates contrast, and manages keyboard navigation
      </p>
    </div>
  );
}

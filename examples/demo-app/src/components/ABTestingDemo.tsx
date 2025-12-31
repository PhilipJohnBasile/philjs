import { signal } from "@philjs/core";

/**
 * A/B Testing Demo - Built-in Experimentation
 *
 * Demonstrates PhilJS's industry-first built-in A/B testing:
 * - Zero dependencies
 * - Traffic splitting
 * - Conversion tracking
 * - Statistical significance
 *
 * NOTE: This is a simplified demo. The full A/B testing module
 * would be imported from @philjs/core/ab-testing
 */
export function ABTestingDemo() {
  // Simulate A/B test variants
  const variants = ["blue", "green", "purple"];
  const currentVariant = signal(variants[Math.floor(Math.random() * variants.length)]);
  const clicks = signal(0);
  const conversions = signal(0);

  const getButtonColor = (variant: string) => {
    switch (variant) {
      case "blue":
        return "#1976d2";
      case "green":
        return "#388e3c";
      case "purple":
        return "#7b1fa2";
      default:
        return "#666";
    }
  };

  const handleClick = () => {
    clicks.set(clicks() + 1);
  };

  const handleConversion = () => {
    conversions.set(conversions() + 1);
    clicks.set(clicks() + 1);
  };

  const switchVariant = () => {
    const currentIndex = variants.indexOf(currentVariant());
    const nextIndex = (currentIndex + 1) % variants.length;
    currentVariant.set(variants[nextIndex]);
  };

  const conversionRate =
    clicks() > 0 ? ((conversions() / clicks()) * 100).toFixed(1) : "0.0";

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          marginBottom: "1rem",
          padding: "1rem",
          background: "#f5f5f5",
          borderRadius: "8px",
        }}
      >
        <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>
          Current Variant:{" "}
          <strong style={{ color: getButtonColor(currentVariant()) }}>
            {currentVariant().toUpperCase()}
          </strong>
        </div>
        <div style={{ fontSize: "0.85rem", color: "#888" }}>
          Clicks: {clicks()} | Conversions: {conversions()} | Rate: {conversionRate}%
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        <button
          onClick={handleClick}
          style={{
            padding: "1rem 1.5rem",
            fontSize: "1.1rem",
            background: getButtonColor(currentVariant()),
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.2s",
          }}
        >
          🎯 Click Me (Variant {currentVariant().toUpperCase()})
        </button>

        <button
          onClick={handleConversion}
          style={{
            padding: "0.75rem 1rem",
            fontSize: "0.95rem",
            background: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          ✅ Convert
        </button>

        <button
          onClick={switchVariant}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.85rem",
            background: "#ff9800",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          🔄 Switch Variant
        </button>
      </div>

      <div
        style={{
          padding: "0.75rem",
          background: "#e8f5e9",
          borderRadius: "6px",
          fontSize: "0.85rem",
          color: "#2e7d32",
          textAlign: "left",
        }}
      >
        <strong>A/B Testing Features:</strong>
        <ul style={{ margin: "0.5rem 0 0 1.5rem", padding: 0 }}>
          <li>Traffic splitting (50/50, custom weights)</li>
          <li>Conversion tracking</li>
          <li>Statistical significance</li>
          <li>Targeting (segments, countries, devices)</li>
          <li>Feature flags</li>
        </ul>
      </div>

      <p style={{ marginTop: "1rem", color: "#666", fontSize: "0.8rem" }}>
        🧪 PhilJS includes A/B testing with zero external dependencies
      </p>
    </div>
  );
}

import { signal, linkedSignal } from "philjs-core";

/**
 * LinkedSignal Demo - Writable Computed Values
 *
 * Demonstrates the new linkedSignal feature (matches Angular 19)
 * - Acts like a computed value by default
 * - Can be manually overridden with .set()
 * - Automatically resets when dependencies change
 */
export function LinkedSignalDemo() {
  const firstName = signal("John");
  const lastName = signal("Doe");

  // linkedSignal: computed by default, but can be overridden
  const fullName = linkedSignal(() => `${firstName()} ${lastName()}`);

  const updateFirst = () => {
    const names = ["Alice", "Bob", "Charlie", "Diana"];
    firstName.set(names[Math.floor(Math.random() * names.length)]);
  };

  const updateLast = () => {
    const names = ["Smith", "Johnson", "Williams", "Brown"];
    lastName.set(names[Math.floor(Math.random() * names.length)]);
  };

  const overrideFullName = () => {
    fullName.set("Custom Name");
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          marginBottom: "1rem",
          padding: "1rem",
          background: "#e3f2fd",
          borderRadius: "8px",
        }}
      >
        <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>
          First: <strong>{firstName()}</strong>
        </div>
        <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>
          Last: <strong>{lastName()}</strong>
        </div>
        <div
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#1976d2",
            marginTop: "0.5rem",
          }}
        >
          Full: {fullName()}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <button
          onClick={updateFirst}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.9rem",
            background: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Change First Name
        </button>
        <button
          onClick={updateLast}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.9rem",
            background: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Change Last Name
        </button>
        <button
          onClick={overrideFullName}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.9rem",
            background: "#f57c00",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Override Full Name
        </button>
      </div>

      <p style={{ marginTop: "1rem", color: "#666", fontSize: "0.85rem" }}>
        linkedSignal = computed + writable. Changing first/last will reset the override.
      </p>
    </div>
  );
}

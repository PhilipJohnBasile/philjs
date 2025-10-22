import { signal, memo } from "philjs-core";

export function ReactiveAttributesDemo() {
  return (
    <div data-test="reactive-attributes-demo">
      <h2 style="margin: 0 0 1.5rem 0; color: var(--primary);">Reactive Attributes</h2>

      <ReactiveStylesExample />
      <ReactiveClassesExample />
      <ReactiveAttributesExample />
      <ThemeSwitcherExample />
    </div>
  );
}

function ReactiveStylesExample() {
  const isActive = signal(false);
  const size = signal(16);
  const color = signal("#9d3eb8");

  const boxStyle = memo(() => ({
    background: color(),
    width: `${size()}px`,
    height: `${size()}px`,
    borderRadius: isActive() ? "50%" : "8px",
    transition: "all 0.3s ease",
    display: "inline-block",
  }));

  return (
    <div class="card" data-test="reactive-styles">
      <h3 style="margin: 0 0 1rem 0;">Reactive Styles</h3>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="padding: 2rem; background: var(--bg-alt); border-radius: 8px; display: flex; justify-content: center;">
          <div style={boxStyle} data-test="style-box"></div>
        </div>

        <div style="display: flex; align-items: center; gap: 1rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => isActive.set((e.target as HTMLInputElement).checked)}
              data-test="style-active"
            />
            <span>Circle Shape</span>
          </label>
        </div>

        <div>
          <label style="display: block; margin-bottom: 0.5rem;">
            Size: <strong data-test="style-size-value">{() => `${size()}px`}</strong>
          </label>
          <input
            type="range"
            min="50"
            max="200"
            value={size}
            onInput={(e) => size.set(Number((e.target as HTMLInputElement).value))}
            style="width: 100%;"
            data-test="style-size"
          />
        </div>

        <div>
          <label style="display: block; margin-bottom: 0.5rem;">
            Color: <strong data-test="style-color-value">{color}</strong>
          </label>
          <input
            type="color"
            value={color}
            onInput={(e) => color.set((e.target as HTMLInputElement).value)}
            style="width: 100%; height: 40px;"
            data-test="style-color"
          />
        </div>

        <div style="background: var(--bg-alt); padding: 1rem; border-radius: 6px;">
          <code>{"style={memo(() => ({ background: color() }))}"}</code>
        </div>
      </div>
    </div>
  );
}

function ReactiveClassesExample() {
  const status = signal<"success" | "error" | "warning" | "info">("info");

  const statusClass = memo(() => {
    const base = "status-indicator";
    return `${base} ${base}-${status()}`;
  });

  const statusStyle = memo(() => ({
    padding: "1rem",
    borderRadius: "8px",
    fontWeight: "600" as const,
    textAlign: "center" as const,
    background:
      status() === "success" ? "#10b981" :
      status() === "error" ? "#ef4444" :
      status() === "warning" ? "#f59e0b" :
      "#3b82f6",
    color: "white",
    transition: "all 0.3s ease",
  }));

  return (
    <div class="card" data-test="reactive-classes">
      <h3 style="margin: 0 0 1rem 0;">Reactive Classes & Conditional Styling</h3>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div class={statusClass} style={statusStyle} data-test="status-box">
          Status: {() => status().toUpperCase()}
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
          <button
            class="button"
            onClick={() => status.set("success")}
            data-test="status-success"
          >
            Success
          </button>
          <button
            class="button"
            onClick={() => status.set("error")}
            data-test="status-error"
          >
            Error
          </button>
          <button
            class="button"
            onClick={() => status.set("warning")}
            data-test="status-warning"
          >
            Warning
          </button>
          <button
            class="button"
            onClick={() => status.set("info")}
            data-test="status-info"
          >
            Info
          </button>
        </div>

        <div style="background: var(--bg-alt); padding: 1rem; border-radius: 6px;">
          <code>{"class={memo(() => `base ${status()}`)}"}</code>
        </div>
      </div>
    </div>
  );
}

function ReactiveAttributesExample() {
  const isDisabled = signal(false);
  const maxLength = signal(50);
  const placeholder = signal("Type something...");

  return (
    <div class="card" data-test="reactive-attrs">
      <h3 style="margin: 0 0 1rem 0;">Reactive Attributes</h3>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <input
          class="input"
          disabled={isDisabled}
          maxLength={maxLength}
          placeholder={placeholder}
          data-test="reactive-input"
        />

        <div style="display: flex; align-items: center; gap: 1rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
            <input
              type="checkbox"
              checked={isDisabled}
              onChange={(e) => isDisabled.set((e.target as HTMLInputElement).checked)}
              data-test="attr-disabled"
            />
            <span>Disabled</span>
          </label>
        </div>

        <div>
          <label style="display: block; margin-bottom: 0.5rem;">
            Max Length: <strong data-test="attr-maxlength-value">{maxLength}</strong>
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={maxLength}
            onInput={(e) => maxLength.set(Number((e.target as HTMLInputElement).value))}
            style="width: 100%;"
            data-test="attr-maxlength"
          />
        </div>

        <div>
          <label style="display: block; margin-bottom: 0.5rem;">Placeholder:</label>
          <input
            class="input"
            value={placeholder()}
            onInput={(e) => placeholder.set((e.target as HTMLInputElement).value)}
            data-test="attr-placeholder"
          />
        </div>

        <div style="background: var(--bg-alt); padding: 1rem; border-radius: 6px;">
          <code>disabled={"{isDisabled}"} maxLength={"{maxLength}"}</code>
        </div>
      </div>
    </div>
  );
}

function ThemeSwitcherExample() {
  const theme = signal<"light" | "dark">("light");

  const containerStyle = memo(() => ({
    background: theme() === "dark" ? "#1a1a1a" : "#ffffff",
    color: theme() === "dark" ? "#ffffff" : "#333333",
    padding: "2rem",
    borderRadius: "8px",
    transition: "all 0.3s ease",
    border: `2px solid ${theme() === "dark" ? "#333" : "#e0e0e0"}`,
  }));

  const buttonStyle = memo(() => ({
    background: theme() === "dark" ? "#9d3eb8" : "#667eea",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600" as const,
    transition: "all 0.2s ease",
  }));

  return (
    <div class="card" data-test="theme-switcher">
      <h3 style="margin: 0 0 1rem 0;">Theme Switcher</h3>
      <div style={containerStyle}>
        <h4 style="margin: 0 0 1rem 0;">
          Current Theme: <span data-test="theme-name">{() => theme().toUpperCase()}</span>
        </h4>
        <p style="margin: 0 0 1.5rem 0;">
          This container's background, text color, and border all update reactively!
        </p>
        <button
          style={buttonStyle}
          onClick={() => theme.set(theme() === "light" ? "dark" : "light")}
          data-test="theme-toggle"
        >
          {() => `Switch to ${theme() === "light" ? "Dark" : "Light"} Theme`}
        </button>
      </div>

      <div style="background: var(--bg-alt); padding: 1rem; border-radius: 6px; margin-top: 1rem;">
        <code>{"style={memo(() => ({ background: theme() === 'dark' ? '#1a1a1a' : '#fff' }))}"}</code>
      </div>
    </div>
  );
}

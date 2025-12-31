import { signal, effect, render } from "@philjs/core";

export function PlaygroundPage({
  navigate,
}: {
  navigate: (path: string) => void;
}) {
  const activeTab = signal("counter");
  const code = signal(`import { signal } from "@philjs/core";

export function Counter() {
  const count = signal(0);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>
        {count()}
      </h1>
      <button
        onClick={() => count.set(count() + 1)}
        style={{
          padding: "0.75rem 2rem",
          fontSize: "1rem",
          background: "#7c3aed",
          color: "white",
          border: "none",
          borderRadius: "0.5rem",
          cursor: "pointer"
        }}
      >
        Increment
      </button>
    </div>
  );
}`);

  const error = signal("");

  const templates = {
    counter: {
      title: "Counter",
      code: `import { signal } from "@philjs/core";

export function Counter() {
  const count = signal(0);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>
        {count()}
      </h1>
      <button
        onClick={() => count.set(count() + 1)}
        style={{
          padding: "0.75rem 2rem",
          fontSize: "1rem",
          background: "#7c3aed",
          color: "white",
          border: "none",
          borderRadius: "0.5rem",
          cursor: "pointer"
        }}
      >
        Increment
      </button>
    </div>
  );
}`,
    },
    todoList: {
      title: "Todo List",
      code: `import { signal } from "@philjs/core";

export function TodoList() {
  const todos = signal([
    { id: 1, text: "Learn PhilJS", done: false },
    { id: 2, text: "Build an app", done: false }
  ]);
  const input = signal("");

  const addTodo = () => {
    if (input().trim()) {
      todos.set([
        ...todos(),
        { id: Date.now(), text: input(), done: false }
      ]);
      input.set("");
    }
  };

  const toggle = (id) => {
    todos.set(
      todos().map(t =>
        t.id === id ? { ...t, done: !t.done } : t
      )
    );
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "500px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Todo List</h1>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          type="text"
          value={input()}
          onInput={(e: Event) => input.set(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addTodo()}
          placeholder="Add a todo..."
          style={{
            flex: 1,
            padding: "0.5rem",
            fontSize: "1rem",
            border: "1px solid #e9ecef",
            borderRadius: "0.375rem"
          }}
        />
        <button
          onClick={addTodo}
          style={{
            padding: "0.5rem 1rem",
            background: "#7c3aed",
            color: "white",
            border: "none",
            borderRadius: "0.375rem",
            cursor: "pointer"
          }}
        >
          Add
        </button>
      </div>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {todos().map(todo => (
          <li
            key={todo.id}
            onClick={() => toggle(todo.id)}
            style={{
              padding: "0.75rem",
              marginBottom: "0.5rem",
              background: "#f8f9fa",
              borderRadius: "0.375rem",
              cursor: "pointer",
              textDecoration: todo.done ? "line-through" : "none",
              opacity: todo.done ? 0.6 : 1
            }}
          >
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  );
}`,
    },
    form: {
      title: "Form Validation",
      code: `import { signal } from "@philjs/core";

export function SignupForm() {
  const email = signal("");
  const password = signal("");
  const submitted = signal(false);

  const emailError = () => {
    if (!email()) return "";
    return email().includes("@") ? "" : "Invalid email";
  };

  const passwordError = () => {
    if (!password()) return "";
    return password().length >= 8 ? "" : "Min 8 characters";
  };

  const isValid = () => !emailError() && !passwordError() && email() && password();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid()) {
      submitted.set(true);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Sign Up</h1>

      {submitted() ? (
        <div style={{
          padding: "1rem",
          background: "#10b981",
          color: "white",
          borderRadius: "0.375rem"
        }}>
          Account created successfully!
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
              Email
            </label>
            <input
              type="email"
              value={email()}
              onInput={(e: Event) => email.set(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                fontSize: "1rem",
                border: \`1px solid \${emailError() ? "#ef4444" : "#e9ecef"}\`,
                borderRadius: "0.375rem"
              }}
            />
            {emailError() && (
              <div style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                {emailError()}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
              Password
            </label>
            <input
              type="password"
              value={password()}
              onInput={(e: Event) => password.set(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                fontSize: "1rem",
                border: \`1px solid \${passwordError() ? "#ef4444" : "#e9ecef"}\`,
                borderRadius: "0.375rem"
              }}
            />
            {passwordError() && (
              <div style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                {passwordError()}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid()}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: isValid() ? "#7c3aed" : "#e9ecef",
              color: isValid() ? "white" : "#adb5bd",
              border: "none",
              borderRadius: "0.375rem",
              cursor: isValid() ? "pointer" : "not-allowed",
              fontSize: "1rem",
              fontWeight: 500
            }}
          >
            Sign Up
          </button>
        </form>
      )}
    </div>
  );
}`,
    },
    animation: {
      title: "Animated Counter",
      code: `import { signal, effect } from "@philjs/core";

export function AnimatedCounter() {
  const count = signal(0);
  const isAnimating = signal(false);

  const increment = () => {
    isAnimating.set(true);
    count.set(count() + 1);
    setTimeout(() => isAnimating.set(false), 300);
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1
        style={{
          fontSize: "4rem",
          marginBottom: "1rem",
          transform: isAnimating() ? "scale(1.2)" : "scale(1)",
          transition: "transform 0.3s",
          color: "#7c3aed"
        }}
      >
        {count()}
      </h1>
      <button
        onClick={increment}
        style={{
          padding: "0.75rem 2rem",
          fontSize: "1rem",
          background: "#7c3aed",
          color: "white",
          border: "none",
          borderRadius: "0.5rem",
          cursor: "pointer",
          transform: isAnimating() ? "translateY(2px)" : "translateY(0)",
          transition: "all 0.1s"
        }}
      >
        Increment
      </button>
    </div>
  );
}`,
    },
  };

  // Update code when template changes
  effect(() => {
    const template = templates[activeTab() as keyof typeof templates];
    if (template) {
      code.set(template.code);
      error.set("");
      executeCode(template.code);
    }
  });

  // Execute code and render result
  const executeCode = (codeStr: string) => {
    try {
      error.set("");

      // Extract the component code
      const componentMatch = codeStr.match(/export function (\w+)/);
      if (!componentMatch) {
        throw new Error("No exported component found");
      }

      const componentName = componentMatch[1];

      // Create a function that returns the component
      // This is a simplified version - real implementation would use proper sandboxing
      const componentCode = codeStr
        .replace(/import.*from.*@philjs\/core.*;?\n/g, "")
        .replace(/export function/, "function");

      // Execute in a sandboxed context
      const sandbox = {
        signal,
        effect,
        console,
        Date,
        setTimeout,
        clearTimeout,
      };

      const func = new Function(
        ...Object.keys(sandbox),
        `${componentCode}\nreturn ${componentName};`
      );

      const Component = func(...Object.values(sandbox));

      // Render to preview
      const previewEl = document.getElementById("playground-preview");
      if (previewEl) {
        render(<Component />, previewEl);
      }
    } catch (err: any) {
      error.set(err.message || "Execution error");
      console.error("Playground error:", err);
    }
  };

  // Initial execution
  effect(() => {
    executeCode(code());
  });

  const handleRun = () => {
    executeCode(code());
  };

  const handleReset = () => {
    const template = templates[activeTab() as keyof typeof templates];
    if (template) {
      code.set(template.code);
      error.set("");
      executeCode(template.code);
    }
  };

  return (
    <div style={styles.playground}>
      <div style={styles.header}>
        <h1 style={styles.title}>Interactive Playground</h1>
        <p style={styles.subtitle}>
          Edit PhilJS code and see changes instantly
        </p>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.templates}>
          {Object.entries(templates).map(([key, template]) => (
            <button
              onClick={() => activeTab.set(key)}
              style={{
                ...styles.templateButton,
                ...(activeTab() === key ? styles.templateButtonActive : {}),
              }}
            >
              {template.title}
            </button>
          ))}
        </div>

        <div style={styles.actions}>
          <button style={styles.actionButton} onClick={handleRun} title="Run (Ctrl+Enter)">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <polygon points="5 3 19 12 5 21 5 3" stroke-width="2" />
            </svg>
          </button>
          <button style={styles.actionButton} onClick={handleReset} title="Reset">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {error() && (
        <div style={styles.error}>
          <strong>Error:</strong> {error()}
        </div>
      )}

      <div style={styles.editor}>
        <div style={styles.editorPane}>
          <div style={styles.paneHeader}>
            <span style={styles.paneTitle}>Code</span>
            <span style={styles.paneBadge}>TypeScript</span>
          </div>
          <textarea
            value={code()}
            onInput={(e: Event) => code.set((e.target as HTMLTextAreaElement).value)}
            onKeyDown={(e: any) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                handleRun();
              }
            }}
            style={styles.codeEditor}
            spellCheck={false}
          />
        </div>

        <div style={styles.previewPane}>
          <div style={styles.paneHeader}>
            <span style={styles.paneTitle}>Preview</span>
            <span style={styles.paneBadge}>Live</span>
          </div>
          <div style={styles.preview}>
            <div id="playground-preview" style={styles.previewContent}></div>
          </div>
        </div>
      </div>

      <div style={styles.features}>
        <div style={styles.feature}>
          <div style={styles.featureIcon}>⚡</div>
          <div>
            <h4 style={styles.featureTitle}>Live Execution</h4>
            <p style={styles.featureDescription}>
              Code runs in real-time as you type
            </p>
          </div>
        </div>
        <div style={styles.feature}>
          <div style={styles.featureIcon}>🎯</div>
          <div>
            <h4 style={styles.featureTitle}>Error Handling</h4>
            <p style={styles.featureDescription}>
              Clear error messages when something goes wrong
            </p>
          </div>
        </div>
        <div style={styles.feature}>
          <div style={styles.featureIcon}>📦</div>
          <div>
            <h4 style={styles.featureTitle}>Templates</h4>
            <p style={styles.featureDescription}>
              Start with built-in examples and templates
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, Record<string, any>> = {
  playground: {
    padding: "var(--space-8) var(--space-6)",
    maxWidth: "var(--max-width-2xl)",
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    marginBottom: "var(--space-8)",
  },
  title: {
    fontSize: "var(--text-5xl)",
    fontWeight: 800,
    marginBottom: "var(--space-3)",
  },
  subtitle: {
    fontSize: "var(--text-xl)",
    color: "var(--color-text-secondary)",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "var(--space-6)",
    padding: "var(--space-4)",
    background: "var(--color-bg-secondary)",
    borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
    border: "1px solid var(--color-border)",
    borderBottom: "none",
  },
  templates: {
    display: "flex",
    gap: "var(--space-2)",
    flexWrap: "wrap",
  },
  templateButton: {
    padding: "var(--space-2) var(--space-4)",
    background: "var(--color-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    fontSize: "var(--text-sm)",
    fontWeight: 500,
    color: "var(--color-text-secondary)",
    cursor: "pointer",
    transition: "all var(--transition-fast)",
  },
  templateButtonActive: {
    background: "var(--color-accent)",
    color: "white",
    borderColor: "var(--color-accent)",
  },
  actions: {
    display: "flex",
    gap: "var(--space-2)",
  },
  actionButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    background: "var(--color-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    color: "var(--color-text-secondary)",
    cursor: "pointer",
    transition: "all var(--transition-fast)",
  },
  error: {
    padding: "var(--space-4)",
    marginBottom: "var(--space-4)",
    background: "#fee",
    border: "1px solid #fcc",
    borderRadius: "var(--radius)",
    color: "#c00",
    fontSize: "var(--text-sm)",
  },
  editor: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1px",
    background: "var(--color-border)",
    borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
    overflow: "hidden",
    border: "1px solid var(--color-border)",
    minHeight: "600px",
  },
  editorPane: {
    display: "flex",
    flexDirection: "column",
    background: "var(--color-bg)",
  },
  previewPane: {
    display: "flex",
    flexDirection: "column",
    background: "var(--color-bg)",
  },
  paneHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "var(--space-3) var(--space-4)",
    background: "var(--color-bg-secondary)",
    borderBottom: "1px solid var(--color-border)",
  },
  paneTitle: {
    fontSize: "var(--text-sm)",
    fontWeight: 600,
    color: "var(--color-text)",
  },
  paneBadge: {
    fontSize: "var(--text-xs)",
    padding: "var(--space-1) var(--space-2)",
    background: "var(--color-accent-light)",
    color: "var(--color-accent)",
    borderRadius: "var(--radius-sm)",
    fontWeight: 500,
  },
  codeEditor: {
    flex: 1,
    padding: "var(--space-4)",
    background: "var(--color-code-bg)",
    color: "var(--color-text)",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-sm)",
    lineHeight: 1.7,
    border: "none",
    outline: "none",
    resize: "none",
    tabSize: 2,
  },
  preview: {
    flex: 1,
    background: "white",
    overflow: "auto",
  },
  previewContent: {
    minHeight: "100%",
  },
  features: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "var(--space-6)",
    marginTop: "var(--space-12)",
    padding: "var(--space-8)",
    background: "var(--color-bg-secondary)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--color-border)",
  },
  feature: {
    display: "flex",
    gap: "var(--space-3)",
    alignItems: "flex-start",
  },
  featureIcon: {
    fontSize: "var(--text-3xl)",
  },
  featureTitle: {
    fontSize: "var(--text-base)",
    fontWeight: 600,
    marginBottom: "var(--space-1)",
  },
  featureDescription: {
    fontSize: "var(--text-sm)",
    color: "var(--color-text-secondary)",
    lineHeight: 1.6,
  },
};

import { signal, memo } from "@philjs/core";
import { SignalsDemo } from "./demos/SignalsDemo";
import { ReactiveAttributesDemo } from "./demos/ReactiveAttributesDemo";
import { FormsDemo } from "./demos/FormsDemo";
import { ListsDemo } from "./demos/ListsDemo";
import { AsyncDemo } from "./demos/AsyncDemo";
import { AdvancedPatternsDemo } from "./demos/AdvancedPatternsDemo";

export function App() {
  const activeSection = signal<string>("signals");

  const sections = [
    { id: "signals", label: "Signals & Reactivity" },
    { id: "attributes", label: "Reactive Attributes" },
    { id: "forms", label: "Forms & Validation" },
    { id: "lists", label: "Lists & Rendering" },
    { id: "async", label: "Async & Data Fetching" },
    { id: "advanced", label: "Advanced Patterns" },
  ];

  const navButtonStyle = (isActive: boolean) => ({
    background: isActive ? "var(--primary)" : "var(--bg)",
    color: isActive ? "white" : "var(--text)",
    border: `1px solid ${isActive ? "var(--primary)" : "var(--border)"}`,
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontWeight: isActive ? "600" : "400",
  });

  // Define reactive display memos ONCE outside JSX
  const signalsDisplay = memo(() => ({ display: activeSection() === "signals" ? "block" : "none" }));
  const attributesDisplay = memo(() => ({ display: activeSection() === "attributes" ? "block" : "none" }));
  const formsDisplay = memo(() => ({ display: activeSection() === "forms" ? "block" : "none" }));
  const listsDisplay = memo(() => ({ display: activeSection() === "lists" ? "block" : "none" }));
  const asyncDisplay = memo(() => ({ display: activeSection() === "async" ? "block" : "none" }));
  const advancedDisplay = memo(() => ({ display: activeSection() === "advanced" ? "block" : "none" }));

  return (
    <div style="min-height: 100vh; padding: 2rem 0;">
      <div class="container">
        {/* Header */}
        <div style="background: white; border-radius: 12px; padding: 2rem; margin-bottom: 2rem; box-shadow: var(--shadow-lg);">
          <h1 style="margin: 0 0 0.5rem 0; font-size: 2.5rem; color: var(--primary);">
            PhilJS Kitchen Sink
          </h1>
          <p style="margin: 0; color: var(--text-secondary); font-size: 1.1rem;">
            Complete demonstration of all PhilJS features with interactive examples and tests
          </p>
        </div>

        {/* Navigation */}
        <div style="background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; box-shadow: var(--shadow);">
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => activeSection.set(section.id)}
                style={navButtonStyle(activeSection() === section.id)}
                data-test={`nav-${section.id}`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Demo Sections - All rendered with show/hide */}
        <div style="background: white; border-radius: 12px; padding: 2rem; box-shadow: var(--shadow-lg);">
          <div style={signalsDisplay}>
            <SignalsDemo />
          </div>
          <div style={attributesDisplay}>
            <ReactiveAttributesDemo />
          </div>
          <div style={formsDisplay}>
            <FormsDemo />
          </div>
          <div style={listsDisplay}>
            <ListsDemo />
          </div>
          <div style={asyncDisplay}>
            <AsyncDemo />
          </div>
          <div style={advancedDisplay}>
            <AdvancedPatternsDemo />
          </div>
        </div>

        {/* Footer */}
        <div style="margin-top: 2rem; text-align: center; color: white; opacity: 0.9;">
          <p style="margin: 0;">
            Built with PhilJS | Test Coverage: Unit + E2E + Playwright
          </p>
        </div>
      </div>
    </div>
  );
}

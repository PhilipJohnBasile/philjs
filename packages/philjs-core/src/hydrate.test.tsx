import { describe, it, expect } from "vitest";
import { signal } from "./signals";
import { render } from "./hydrate";

const createContainer = () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  return container;
};

describe("render() dynamic accessors", () => {
  it("updates text content when a signal changes", () => {
    const count = signal(0);
    const container = createContainer();

    render(<div data-testid="counter">{count}</div>, container);

    const counter = container.querySelector("[data-testid='counter']") as HTMLElement;
    expect(counter.textContent).toBe("0");

    count.set(5);
    expect(counter.textContent).toBe("5");

    count.set(42);
    expect(counter.textContent).toBe("42");

    document.body.removeChild(container);
  });

  it("swaps conditional children without leaving stale nodes", () => {
    const toggle = signal(true);
    const container = createContainer();

    render(
      <div data-testid="conditional">
        {() =>
          toggle()
            ? [<span data-marker="a">A</span>, <span data-marker="b">B</span>]
            : <span data-marker="c">C</span>
        }
      </div>,
      container
    );

    const getMarkers = () =>
      Array.from(container.querySelectorAll("[data-marker]")).map(
        (el) => (el as HTMLElement).dataset.marker
      );

    expect(getMarkers()).toEqual(["a", "b"]);

    toggle.set(false);
    expect(getMarkers()).toEqual(["c"]);

    toggle.set(true);
    expect(getMarkers()).toEqual(["a", "b"]);

    document.body.removeChild(container);
  });

  it("removes DOM nodes when dynamic accessor returns null", () => {
    const show = signal(true);
    const container = createContainer();

    render(
      <div data-testid="nullable">
        {() => (show() ? <span data-marker="present">Here</span> : null)}
      </div>,
      container
    );

    const query = () => container.querySelector("[data-marker='present']");

    expect(query()).not.toBeNull();

    show.set(false);
    expect(query()).toBeNull();

    show.set(true);
    expect(query()).not.toBeNull();

    document.body.removeChild(container);
  });
});

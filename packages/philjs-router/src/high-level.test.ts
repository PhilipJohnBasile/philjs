import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createAppRouter, useRouter, Link } from "./high-level.js";

describe("High-level router", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    document.body.innerHTML = "";
    window.history.replaceState({}, "", "/");
  });

  it("creates manifest and renders initial route", async () => {
    const router = createAppRouter({
      routes: [
        { path: "/", component: () => "Home" },
        { path: "/about", component: () => "About" },
      ],
    });

    expect(Object.keys(router.manifest)).toContain("/");
    expect(document.getElementById("app")?.textContent).toContain("Home");

    await router.navigate("/about");
    expect(document.getElementById("app")?.textContent).toContain("About");

    router.dispose();
  });

  it("supports nested layouts and params", async () => {
    const router = createAppRouter({
      routes: [
        {
          path: "/blog",
          component: () => "Blog Index",
          layout: ({ children }) => `<section>${children}</section>`,
          children: [
            {
              path: "/:slug",
              component: ({ params }) => `Post:${params.slug}`,
            },
          ],
        },
      ],
    });

    await router.navigate("/blog/my-first-post");
    expect(document.getElementById("app")?.innerHTML).toContain("Post:my-first-post");

    const state = useRouter();
    expect(state.route?.params.slug).toBe("my-first-post");

    router.dispose();
  });

  it("Link component navigates without full reload", async () => {
    const router = createAppRouter({
      routes: [
        { path: "/", component: () => "Home" },
        { path: "/docs", component: () => "Docs" },
      ],
    });

    const vnode = Link({ to: "/docs", children: "Docs" });
    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
    Object.defineProperty(clickEvent, "button", { value: 0 });

    await vnode.props.onClick(clickEvent);

    expect(document.getElementById("app")?.textContent).toContain("Docs");
    router.dispose();
  });
});

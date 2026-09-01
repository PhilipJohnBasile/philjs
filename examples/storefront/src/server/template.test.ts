import { describe, expect, it } from "vitest";
import { html } from "./template";

describe("HTML templates", () => {
  it("preserves nested templates while escaping plain values", () => {
    const unsafeValue = '<script>alert("xss")</script>';
    const result = html`<main>${html`<a href="/products/1">Product</a>`}<p>${unsafeValue}</p></main>`;

    expect(String(result)).toBe(
      '<main><a href="/products/1">Product</a><p>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p></main>'
    );
  });
});

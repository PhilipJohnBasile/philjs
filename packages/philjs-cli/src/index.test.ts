import { describe, it, expect } from "vitest";
import {
  analyze,
  buildProduction,
  generateTypes,
  philJSPlugin,
  philJSSSRPlugin,
  startDevServer,
} from "./index.js";

describe("philjs-cli public API", () => {
  it("exposes expected functions", () => {
    expect(typeof analyze).toBe("function");
    expect(typeof buildProduction).toBe("function");
    expect(typeof generateTypes).toBe("function");
    expect(typeof startDevServer).toBe("function");
  });

  it("provides Vite plugins", () => {
    expect(typeof philJSPlugin).toBe("function");
    expect(typeof philJSSSRPlugin).toBe("function");
  });
});

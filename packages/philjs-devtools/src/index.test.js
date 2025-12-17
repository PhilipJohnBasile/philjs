import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { showOverlay } from "./index.js";
describe("showOverlay", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        delete window.__PHILJS_PROD__;
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    it("renders the overlay and removes it when closed", () => {
        showOverlay();
        const overlay = document.getElementById("philjs-devtools");
        expect(overlay).not.toBeNull();
        const islandCount = overlay?.querySelector("#island-count");
        expect(islandCount?.textContent).toBe("0");
        const closeButton = overlay?.querySelector("#close-devtools");
        expect(closeButton).not.toBeNull();
        closeButton?.click();
        expect(document.getElementById("philjs-devtools")).toBeNull();
    });
    it("skips rendering when running in production mode", () => {
        window.__PHILJS_PROD__ = true;
        showOverlay();
        expect(document.getElementById("philjs-devtools")).toBeNull();
    });
});
//# sourceMappingURL=index.test.js.map
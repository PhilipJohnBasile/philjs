import { describe, it, expect } from "vitest";
import { jsx, Fragment, createElement, isJSXElement } from "./jsx-runtime.js";
import { renderToString } from "./render-to-string.js";
describe("JSX Runtime", () => {
    it("creates a simple element", () => {
        const element = jsx("div", { className: "test" });
        expect(element.type).toBe("div");
        expect(element.props.className).toBe("test");
    });
    it("handles children", () => {
        const element = jsx("div", { children: ["Hello", "World"] });
        expect(element.props.children).toEqual(["Hello", "World"]);
    });
    it("flattens nested children", () => {
        const element = jsx("div", { children: [["a", "b"], "c"] });
        expect(element.props.children).toEqual(["a", "b", "c"]);
    });
    it("filters out null and false children", () => {
        const element = jsx("div", { children: ["a", null, false, "b", undefined] });
        expect(element.props.children).toEqual(["a", "b"]);
    });
    it("creates Fragment", () => {
        const frag = Fragment({ children: ["a", "b"] });
        expect(frag.type).toBe(Fragment);
        expect(frag.props.children).toEqual(["a", "b"]);
    });
    it("createElement is compatible", () => {
        const element = createElement("div", { className: "test" }, "child1", "child2");
        expect(element.props.children).toEqual(["child1", "child2"]);
    });
    it("isJSXElement identifies elements correctly", () => {
        const element = jsx("div", {});
        expect(isJSXElement(element)).toBe(true);
        expect(isJSXElement("string")).toBeFalsy();
        expect(isJSXElement(null)).toBeFalsy();
        expect(isJSXElement(123)).toBeFalsy();
    });
});
describe("renderToString", () => {
    it("renders simple element", () => {
        const vnode = jsx("div", {});
        expect(renderToString(vnode)).toBe("<div></div>");
    });
    it("renders element with text content", () => {
        const vnode = jsx("div", { children: "Hello" });
        expect(renderToString(vnode)).toBe("<div>Hello</div>");
    });
    it("renders element with className", () => {
        const vnode = jsx("div", { className: "test" });
        expect(renderToString(vnode)).toBe('<div class="test"></div>');
    });
    it("escapes HTML in text", () => {
        const vnode = jsx("div", { children: "<script>alert('xss')</script>" });
        expect(renderToString(vnode)).toBe("<div>&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;</div>");
    });
    it("renders nested elements", () => {
        const vnode = jsx("div", { children: jsx("span", { children: "nested" }) });
        expect(renderToString(vnode)).toBe("<div><span>nested</span></div>");
    });
    it("renders Fragment", () => {
        const vnode = Fragment({ children: [jsx("div", {}), jsx("span", {})] });
        expect(renderToString(vnode)).toBe("<div></div><span></span>");
    });
    it("renders void elements", () => {
        const vnode = jsx("img", { src: "/test.jpg", alt: "test" });
        expect(renderToString(vnode)).toBe('<img src="/test.jpg" alt="test">');
    });
    it("handles boolean attributes", () => {
        const vnode = jsx("input", { type: "checkbox", checked: true, disabled: false });
        expect(renderToString(vnode)).toBe('<input type="checkbox" checked>');
    });
    it("renders function components", () => {
        const Button = (props) => jsx("button", { children: props.label });
        const vnode = jsx(Button, { label: "Click me" });
        expect(renderToString(vnode)).toBe("<button>Click me</button>");
    });
    it("handles style objects", () => {
        const vnode = jsx("div", { style: { color: "red", fontSize: "16px" } });
        expect(renderToString(vnode)).toBe('<div style="color:red;font-size:16px"></div>');
    });
    it("ignores event handlers", () => {
        const vnode = jsx("button", { onClick: () => { }, children: "Click" });
        expect(renderToString(vnode)).toBe("<button>Click</button>");
    });
    it("renders arrays of children", () => {
        const vnode = jsx("ul", {
            children: [jsx("li", { children: "1" }), jsx("li", { children: "2" })],
        });
        expect(renderToString(vnode)).toBe("<ul><li>1</li><li>2</li></ul>");
    });
});
//# sourceMappingURL=jsx-runtime.test.js.map
/**
 * CSS Optimizer Tests
 */

import { describe, it, expect } from "vitest";
import {
  CSSOptimizer,
  optimizeCSS,
  CriticalCSSExtractor,
  extractCriticalCSS,
  purgeUnusedCSS,
  analyzeCSSStats,
} from "./optimizer.js";

describe("CSSOptimizer", () => {
  describe("removeComments", () => {
    it("should remove block comments", () => {
      const css = "/* comment */ .class { color: red; }";
      const result = optimizeCSS(css);
      expect(result.css).not.toContain("comment");
    });

    it("should remove multiline comments", () => {
      const css = `
        /*
          Multi-line
          comment
        */
        .class { color: red; }
      `;
      const result = optimizeCSS(css);
      expect(result.css).not.toContain("Multi-line");
    });
  });

  describe("removeEmptyRules", () => {
    it("should remove empty rules", () => {
      const css = ".empty {} .filled { color: red; }";
      const result = optimizeCSS(css);
      expect(result.css).not.toContain(".empty");
      expect(result.css).toContain("color:red");
    });

    it("should remove rules with only whitespace", () => {
      const css = ".empty {   } .filled { color: red; }";
      const result = optimizeCSS(css);
      expect(result.css).not.toContain(".empty");
    });
  });

  describe("minify", () => {
    it("should remove unnecessary whitespace", () => {
      const css = ".class   {   color:   red;   }";
      const result = optimizeCSS(css);
      expect(result.css).toBe(".class{color:red}");
    });

    it("should remove newlines", () => {
      const css = `.class {
        color: red;
        background: blue;
      }`;
      const result = optimizeCSS(css);
      expect(result.css).not.toContain("\n");
    });

    it("should remove trailing semicolons before closing brace", () => {
      const css = ".class { color: red; }";
      const result = optimizeCSS(css);
      expect(result.css).toBe(".class{color:red}");
    });
  });

  describe("size reduction", () => {
    it("should calculate size reduction", () => {
      const css = `
        /* Large comment */
        .class {
          color: red;
        }
      `;
      const result = optimizeCSS(css);
      expect(result.originalSize).toBeGreaterThan(result.optimizedSize);
      expect(result.reduction).toBeGreaterThan(0);
    });
  });

  describe("options", () => {
    it("should not minify when disabled", () => {
      const css = ".class { color: red; }";
      const result = optimizeCSS(css, { minify: false });
      expect(result.css).toContain(" ");
    });

    it("should keep comments when removeComments is false", () => {
      const css = "/* comment */ .class { color: red; }";
      const result = optimizeCSS(css, { removeComments: false, minify: false });
      expect(result.css).toContain("comment");
    });
  });
});

describe("CriticalCSSExtractor", () => {
  const extractor = new CriticalCSSExtractor();

  it("should extract CSS for used classes", () => {
    const css = '.used { color: red; } .unused { color: blue; }';
    const html = '<div class="used">Content</div>';

    const result = extractor.extractCritical(css, html);

    expect(result.critical).toContain(".used");
    expect(result.deferred).toContain(".unused");
  });

  it("should extract CSS for used IDs", () => {
    const css = '#header { color: red; } #unused { color: blue; }';
    const html = '<div id="header">Content</div>';

    const result = extractor.extractCritical(css, html);

    expect(result.critical).toContain("#header");
    expect(result.deferred).toContain("#unused");
  });

  it("should extract CSS for used tags", () => {
    const css = 'div { color: red; } span { color: blue; }';
    const html = '<div>Content</div>';

    const result = extractor.extractCritical(css, html);

    expect(result.critical).toContain("div");
  });

  it("should always include universal selectors", () => {
    const css = '* { box-sizing: border-box; } .class { color: red; }';
    const html = '<div>Content</div>';

    const result = extractor.extractCritical(css, html);

    expect(result.critical).toContain("*");
  });
});

describe("extractCriticalCSS", () => {
  it("should extract critical CSS using convenience function", () => {
    const css = '.above-fold { color: red; } .below-fold { color: blue; }';
    const html = '<div class="above-fold">Content</div>';

    const result = extractCriticalCSS(css, html);

    expect(result.critical).toContain(".above-fold");
    expect(result.deferred).toContain(".below-fold");
  });
});

describe("purgeUnusedCSS", () => {
  it("should keep CSS for used classes", () => {
    const css = '.used { color: red; } .unused { color: blue; }';
    const content = ['<div class="used">Content</div>'];

    const result = purgeUnusedCSS(css, content);

    expect(result).toContain(".used");
    expect(result).not.toContain(".unused");
  });

  it("should keep safelisted classes", () => {
    const css = '.safelisted { color: red; } .unused { color: blue; }';
    const content = ['<div>Content</div>'];

    const result = purgeUnusedCSS(css, content, {
      safelist: ["safelisted"],
    });

    expect(result).toContain(".safelisted");
    expect(result).not.toContain(".unused");
  });

  it("should remove blocklisted classes", () => {
    const css = '.blocked { color: red; }';
    const content = ['<div class="blocked">Content</div>'];

    const result = purgeUnusedCSS(css, content, {
      blocklist: ["blocked"],
    });

    expect(result).not.toContain(".blocked");
  });

  it("should keep tag selectors", () => {
    const css = 'div { color: red; }';
    const content = ['<div>Content</div>'];

    const result = purgeUnusedCSS(css, content);

    expect(result).toContain("div");
  });
});

describe("analyzeCSSStats", () => {
  it("should count rules", () => {
    const css = '.a { color: red; } .b { color: blue; }';
    const stats = analyzeCSSStats(css);

    expect(stats.ruleCount).toBe(2);
  });

  it("should count selectors", () => {
    const css = '.a, .b { color: red; } .c { color: blue; }';
    const stats = analyzeCSSStats(css);

    expect(stats.selectorCount).toBe(3);
  });

  it("should count declarations", () => {
    const css = '.a { color: red; background: blue; }';
    const stats = analyzeCSSStats(css);

    expect(stats.declarationCount).toBe(2);
  });

  it("should extract unique properties", () => {
    const css = '.a { color: red; } .b { color: blue; background: green; }';
    const stats = analyzeCSSStats(css);

    expect(stats.uniqueProperties).toContain("color");
    expect(stats.uniqueProperties).toContain("background");
  });

  it("should extract unique colors", () => {
    const css = '.a { color: #ff0000; background: rgba(0,0,0,0.5); }';
    const stats = analyzeCSSStats(css);

    expect(stats.uniqueColors).toContain("#ff0000");
    expect(stats.uniqueColors).toContain("rgba(0,0,0,0.5)");
  });

  it("should count media queries", () => {
    const css = '@media (min-width: 640px) { .a { color: red; } } @media (min-width: 768px) { .b { color: blue; } }';
    const stats = analyzeCSSStats(css);

    expect(stats.mediaQueryCount).toBe(2);
  });

  it("should calculate file size", () => {
    const css = '.a { color: red; }';
    const stats = analyzeCSSStats(css);

    expect(stats.size).toBeGreaterThan(0);
  });
});

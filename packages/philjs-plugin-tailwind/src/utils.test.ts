/**
 * Tests for utility functions
 */

import { describe, it, expect } from "vitest";
import {
  cn,
  clsx,
  createVariants,
  responsive,
  withStates,
  dark,
  extractClasses,
  isValidClass,
  sortClasses,
  arbitrary,
  mergeThemes,
} from "./utils.js";

describe("cn (class names)", () => {
  it("should merge simple classes", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle undefined and null", () => {
    expect(cn("foo", undefined, "bar", null)).toBe("foo bar");
  });

  it("should handle arrays", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("should handle nested arrays", () => {
    expect(cn(["foo", ["bar", "baz"]])).toBe("foo bar baz");
  });

  it("should handle conflict resolution", () => {
    const result = cn("px-4", "px-6");
    // Should keep px-6 (last occurrence)
    expect(result).toContain("px-6");
    expect(result.split(" ").filter(c => c.startsWith("px-")).length).toBe(1);
  });

  it("should handle multiple conflicts", () => {
    const result = cn("p-4", "px-6", "py-8");
    // Should keep all as they don't directly conflict
    expect(result).toContain("px-6");
    expect(result).toContain("py-8");
  });

  it("should handle empty strings", () => {
    expect(cn("", "foo", "")).toBe("foo");
  });

  it("should handle false values", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });
});

describe("clsx", () => {
  it("should work as alias to cn", () => {
    expect(clsx("foo", "bar")).toBe(cn("foo", "bar"));
  });
});

describe("createVariants", () => {
  it("should create variant function", () => {
    const variants = createVariants({
      size: {
        sm: "text-sm p-2",
        md: "text-base p-4",
        lg: "text-lg p-6",
      },
      color: {
        blue: "bg-blue-500 text-white",
        red: "bg-red-500 text-white",
      },
    });

    const result = variants({ size: "md", color: "blue" });
    expect(result).toContain("text-base p-4");
    expect(result).toContain("bg-blue-500 text-white");
  });

  it("should handle missing variants", () => {
    const variants = createVariants({
      size: {
        sm: "text-sm",
        md: "text-base",
      },
    });

    const result = variants({});
    expect(result).toBe("");
  });

  it("should handle unknown variant values", () => {
    const variants = createVariants({
      size: {
        sm: "text-sm",
        md: "text-base",
      },
    });

    const result = variants({ size: "xl" as any });
    expect(result).toBe("");
  });
});

describe("responsive", () => {
  it("should generate responsive classes", () => {
    const result = responsive("text-base", {
      sm: "text-lg",
      md: "text-xl",
    });

    expect(result).toBe("text-base sm:text-lg md:text-xl");
  });

  it("should handle missing breakpoints", () => {
    const result = responsive("text-base");
    expect(result).toBe("text-base");
  });

  it("should skip undefined breakpoint values", () => {
    const result = responsive("text-base", {
      sm: "text-lg",
      md: undefined,
      lg: "text-xl",
    });

    expect(result).toContain("sm:text-lg");
    expect(result).toContain("lg:text-xl");
    expect(result).not.toContain("md:");
  });
});

describe("withStates", () => {
  it("should generate hover state by default", () => {
    const result = withStates("bg-blue-500", { hover: true });
    expect(result).toContain("hover:bg-blue-500");
  });

  it("should generate custom state values", () => {
    const result = withStates("bg-blue-500", { hover: "bg-blue-600" });
    expect(result).toContain("hover:bg-blue-600");
  });

  it("should handle multiple states", () => {
    const result = withStates("bg-blue-500", {
      hover: "bg-blue-600",
      focus: "bg-blue-700",
      active: "bg-blue-800",
    });

    expect(result).toContain("hover:bg-blue-600");
    expect(result).toContain("focus:bg-blue-700");
    expect(result).toContain("active:bg-blue-800");
  });

  it("should handle group and peer states", () => {
    const result = withStates("bg-blue-500", {
      group: true,
      peer: true,
    });

    expect(result).toContain("group:bg-blue-500");
    expect(result).toContain("peer:bg-blue-500");
  });
});

describe("dark", () => {
  it("should generate dark mode classes", () => {
    const result = dark("bg-white", "bg-gray-900");
    expect(result).toBe("bg-white dark:bg-gray-900");
  });

  it("should work with complex classes", () => {
    const result = dark(
      "bg-white text-gray-900",
      "bg-gray-900 text-white"
    );
    expect(result).toContain("bg-white text-gray-900");
    expect(result).toContain("dark:bg-gray-900 text-white");
  });
});

describe("extractClasses", () => {
  it("should extract classes from HTML", () => {
    const html = '<div class="foo bar baz">content</div>';
    const result = extractClasses(html);

    expect(result).toContain("foo");
    expect(result).toContain("bar");
    expect(result).toContain("baz");
  });

  it("should extract classes from JSX className", () => {
    const jsx = '<div className="foo bar">content</div>';
    const result = extractClasses(jsx);

    expect(result).toContain("foo");
    expect(result).toContain("bar");
  });

  it("should remove duplicates", () => {
    const html = '<div class="foo bar"></div><span class="foo baz"></span>';
    const result = extractClasses(html);

    const fooCount = result.filter(c => c === "foo").length;
    expect(fooCount).toBe(1);
  });

  it("should handle empty content", () => {
    const result = extractClasses("");
    expect(result).toEqual([]);
  });
});

describe("isValidClass", () => {
  it("should validate simple class names", () => {
    expect(isValidClass("foo")).toBe(true);
    expect(isValidClass("foo-bar")).toBe(true);
    expect(isValidClass("foo_bar")).toBe(false);
  });

  it("should validate Tailwind utilities", () => {
    expect(isValidClass("px-4")).toBe(true);
    expect(isValidClass("text-sm")).toBe(true);
    expect(isValidClass("hover:bg-blue-500")).toBe(true);
  });

  it("should validate arbitrary values", () => {
    expect(isValidClass("[color:red]")).toBe(true);
    expect(isValidClass("[padding:1rem]")).toBe(true);
  });

  it("should reject invalid characters", () => {
    expect(isValidClass("foo bar")).toBe(false);
    expect(isValidClass("foo!")).toBe(false);
  });

  it("should reject empty strings", () => {
    expect(isValidClass("")).toBe(false);
  });
});

describe("sortClasses", () => {
  it("should sort classes by category", () => {
    const classes = ["text-sm", "p-4", "flex", "bg-blue-500"];
    const sorted = sortClasses(classes);

    const flexIndex = sorted.indexOf("flex");
    const paddingIndex = sorted.indexOf("p-4");
    const textIndex = sorted.indexOf("text-sm");
    const bgIndex = sorted.indexOf("bg-blue-500");

    expect(flexIndex).toBeLessThan(paddingIndex);
    expect(paddingIndex).toBeLessThan(textIndex);
    expect(textIndex).toBeLessThan(bgIndex);
  });

  it("should handle unknown classes", () => {
    const classes = ["custom-class", "p-4", "unknown"];
    const sorted = sortClasses(classes);

    expect(sorted).toHaveLength(3);
    expect(sorted).toContain("custom-class");
    expect(sorted).toContain("p-4");
    expect(sorted).toContain("unknown");
  });
});

describe("arbitrary", () => {
  it("should generate arbitrary value classes", () => {
    expect(arbitrary("color", "red")).toBe("[color:red]");
    expect(arbitrary("padding", "1rem")).toBe("[padding:1rem]");
  });

  it("should handle complex values", () => {
    expect(arbitrary("background", "linear-gradient(to right, red, blue)"))
      .toBe("[background:linear-gradient(to right, red, blue)]");
  });
});

describe("mergeThemes", () => {
  it("should merge theme objects", () => {
    const theme1 = {
      colors: { primary: "#3b82f6" },
      spacing: { sm: "0.5rem" },
    };

    const theme2 = {
      colors: { secondary: "#8b5cf6" },
      fontFamily: { sans: ["Inter"] },
    };

    const result = mergeThemes(theme1, theme2);

    expect(result.colors.primary).toBe("#3b82f6");
    expect(result.colors.secondary).toBe("#8b5cf6");
    expect(result.spacing.sm).toBe("0.5rem");
    expect(result.fontFamily.sans).toEqual(["Inter"]);
  });

  it("should handle overlapping properties", () => {
    const theme1 = { colors: { primary: "#3b82f6" } };
    const theme2 = { colors: { primary: "#2563eb" } };

    const result = mergeThemes(theme1, theme2);

    expect(result.colors.primary).toBe("#2563eb");
  });

  it("should handle empty themes", () => {
    const result = mergeThemes({}, {});
    expect(result).toEqual({});
  });

  it("should handle single theme", () => {
    const theme = { colors: { primary: "#3b82f6" } };
    const result = mergeThemes(theme);

    expect(result).toEqual(theme);
  });
});

/**
 * Utility functions examples
 * Shows how to use the various utility helpers
 */

import {
  cn,
  createVariants,
  responsive,
  withStates,
  dark,
  arbitrary,
  sortClasses,
  extractClasses,
  mergeThemes,
} from "philjs-plugin-tailwind/utils";

// Example 1: Class merging with conflict resolution
const buttonClasses = cn(
  "px-4 py-2",     // Base padding
  "px-6",          // Overrides px-4
  "rounded-lg",
  "bg-blue-500",
  "text-white"
);
console.log(buttonClasses); // "py-2 rounded-lg bg-blue-500 text-white px-6"

// Example 2: Conditional classes
const isActive = true;
const isDisabled = false;

const linkClasses = cn(
  "text-base",
  isActive && "font-bold text-blue-600",
  isDisabled && "opacity-50 cursor-not-allowed",
  !isDisabled && "hover:underline"
);

// Example 3: Variant system
const buttonVariants = createVariants({
  size: {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  },
  variant: {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50",
  },
});

const smallPrimaryButton = buttonVariants({ size: "sm", variant: "primary" });
const largeOutlineButton = buttonVariants({ size: "lg", variant: "outline" });

// Example 4: Responsive utilities
const responsiveText = responsive("text-base", {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
});
console.log(responsiveText);
// "text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl"

// Example 5: State variants
const interactiveButton = withStates("bg-blue-600", {
  hover: "bg-blue-700",
  focus: "ring-2 ring-blue-500 ring-offset-2",
  active: "bg-blue-800",
  disabled: "bg-blue-300 cursor-not-allowed",
});

// Example 6: Dark mode helper
const cardClasses = dark(
  "bg-white text-gray-900 border-gray-200",
  "bg-gray-800 text-white border-gray-700"
);

// Example 7: Arbitrary values
const customClasses = cn(
  arbitrary("color", "#FF6B6B"),
  arbitrary("padding", "2.5rem"),
  arbitrary("font-size", "clamp(1rem, 2vw, 1.5rem)")
);

// Example 8: Extract classes from markup
const htmlString = `
  <div class="container mx-auto px-4">
    <button class="btn btn-primary">Click me</button>
  </div>
`;
const extractedClasses = extractClasses(htmlString);
console.log(extractedClasses);
// ["container", "mx-auto", "px-4", "btn", "btn-primary"]

// Example 9: Sort classes by Tailwind order
const unsortedClasses = [
  "text-white",
  "flex",
  "p-4",
  "bg-blue-500",
  "rounded-lg",
];
const sortedClasses = sortClasses(unsortedClasses);
console.log(sortedClasses);
// ["flex", "p-4", "text-white", "bg-blue-500", "rounded-lg"]

// Example 10: Merge theme configurations
const baseTheme = {
  colors: {
    primary: "#3b82f6",
  },
  spacing: {
    sm: "0.5rem",
  },
};

const extendedTheme = {
  colors: {
    secondary: "#8b5cf6",
    accent: "#06b6d4",
  },
  fontFamily: {
    sans: ["Inter", "sans-serif"],
  },
};

const mergedTheme = mergeThemes(baseTheme, extendedTheme);
console.log(mergedTheme);
// {
//   colors: { primary: "#3b82f6", secondary: "#8b5cf6", accent: "#06b6d4" },
//   spacing: { sm: "0.5rem" },
//   fontFamily: { sans: ["Inter", "sans-serif"] }
// }

// Example 11: Complex component styling
export function ComplexComponent({
  size = "md",
  variant = "primary",
  isLoading = false,
  disabled = false
}) {
  const baseClasses = "font-medium rounded-lg transition-all duration-200";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const variantClasses = {
    primary: dark(
      "bg-blue-600 text-white hover:bg-blue-700",
      "bg-blue-500 text-white hover:bg-blue-600"
    ),
    secondary: dark(
      "bg-gray-200 text-gray-800 hover:bg-gray-300",
      "bg-gray-700 text-white hover:bg-gray-600"
    ),
  };

  const stateClasses = cn(
    isLoading && "opacity-75 cursor-wait",
    disabled && "opacity-50 cursor-not-allowed"
  );

  const finalClasses = cn(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    stateClasses
  );

  return finalClasses;
}

// Example 12: Responsive grid with variants
export function ResponsiveGrid({ columns = 3, gap = 4 }) {
  const gapClasses = {
    2: "gap-2",
    4: "gap-4",
    6: "gap-6",
    8: "gap-8",
  };

  const columnClasses = responsive("grid grid-cols-1", {
    sm: columns >= 2 ? "grid-cols-2" : "grid-cols-1",
    md: columns >= 3 ? "grid-cols-3" : `grid-cols-${Math.min(columns, 2)}`,
    lg: `grid-cols-${columns}`,
  });

  return cn(columnClasses, gapClasses[gap]);
}

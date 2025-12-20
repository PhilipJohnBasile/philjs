/**
 * Component usage examples
 * Shows how to use Tailwind classes in React components
 */

import { cn, withStates, dark, responsive } from "philjs-plugin-tailwind/utils";

// Import Tailwind styles
import "./styles/tailwind.css";

/**
 * Basic button component
 */
export function Button({ children, variant = "primary" }) {
  const baseClasses = "px-4 py-2 rounded-lg font-medium transition-colors";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button className={cn(baseClasses, variants[variant])}>
      {children}
    </button>
  );
}

/**
 * Card component with dark mode
 */
export function Card({ title, children }) {
  return (
    <div className={dark(
      "bg-white text-gray-900",
      "bg-gray-800 text-white"
    )}>
      <div className="p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

/**
 * Responsive grid component
 */
export function Grid({ children }) {
  return (
    <div className={responsive(
      "grid grid-cols-1 gap-4",
      {
        md: "grid-cols-2",
        lg: "grid-cols-3",
        xl: "grid-cols-4",
      }
    )}>
      {children}
    </div>
  );
}

/**
 * Input component with states
 */
export function Input({ label, ...props }) {
  const inputClasses = cn(
    "w-full px-4 py-2 border rounded-lg",
    "focus:outline-none focus:ring-2 focus:ring-blue-500",
    "disabled:bg-gray-100 disabled:cursor-not-allowed"
  );

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
        </label>
      )}
      <input className={inputClasses} {...props} />
    </div>
  );
}

/**
 * Advanced button with all utilities
 */
export function AdvancedButton({
  children,
  size = "md",
  variant = "primary",
  disabled = false
}) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const variantClasses = {
    primary: withStates("bg-blue-600 text-white", {
      hover: "bg-blue-700",
      focus: "ring-2 ring-blue-500 ring-offset-2",
      disabled: "bg-blue-300 cursor-not-allowed",
    }),
    secondary: withStates("bg-gray-200 text-gray-800", {
      hover: "bg-gray-300",
      focus: "ring-2 ring-gray-500 ring-offset-2",
      disabled: "bg-gray-100 cursor-not-allowed",
    }),
  };

  return (
    <button
      className={cn(
        "rounded-lg font-medium transition-all duration-200",
        sizeClasses[size],
        variantClasses[variant],
        disabled && "opacity-50"
      )}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

/**
 * Example usage
 */
export function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">
          Tailwind Examples
        </h1>

        <Grid>
          <Card title="Card 1">
            <p>This is a card with dark mode support</p>
            <Button variant="primary">Click me</Button>
          </Card>

          <Card title="Card 2">
            <Input label="Email" type="email" placeholder="you@example.com" />
            <AdvancedButton size="lg" variant="primary">
              Submit
            </AdvancedButton>
          </Card>

          <Card title="Card 3">
            <div className="space-y-4">
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </Card>
        </Grid>
      </div>
    </div>
  );
}

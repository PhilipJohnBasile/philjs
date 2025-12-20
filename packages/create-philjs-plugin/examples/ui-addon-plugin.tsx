/**
 * Example: UI Addon Plugin
 *
 * This example shows how to create a plugin that provides UI components
 */

import type { Plugin, PluginContext } from "philjs-core/plugin-system";
import * as React from "react";

export interface UIAddonConfig {
  enabled?: boolean;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    spacing?: Record<string, string>;
  };
}

// Example UI Components
export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  const theme = React.useContext(ThemeContext);

  const backgroundColor = variant === 'primary'
    ? theme.primaryColor
    : theme.secondaryColor;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor,
        color: 'white',
        padding: theme.spacing?.md || '0.5rem 1rem',
        border: 'none',
        borderRadius: '0.25rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
};

export interface CardProps {
  children: React.ReactNode;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, title }) => {
  const theme = React.useContext(ThemeContext);

  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: '0.5rem',
        padding: theme.spacing?.lg || '1rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      {title && <h3 style={{ marginTop: 0 }}>{title}</h3>}
      {children}
    </div>
  );
};

// Theme Context
interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  spacing: Record<string, string>;
}

const defaultTheme: ThemeConfig = {
  primaryColor: '#007bff',
  secondaryColor: '#6c757d',
  spacing: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    xl: '2rem',
  },
};

const ThemeContext = React.createContext<ThemeConfig>(defaultTheme);

export const ThemeProvider: React.FC<{
  theme?: Partial<ThemeConfig>;
  children: React.ReactNode;
}> = ({ theme, children }) => {
  const mergedTheme = { ...defaultTheme, ...theme };

  return (
    <ThemeContext.Provider value={mergedTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Plugin Definition
export function createUIAddonPlugin(
  config: UIAddonConfig = {}
): Plugin {
  return {
    meta: {
      name: "philjs-plugin-ui-addon",
      version: "1.0.0",
      description: "UI components addon for PhilJS",
      author: "PhilJS Team",
      license: "MIT",
      philjs: "^2.0.0",
    },

    async setup(pluginConfig: UIAddonConfig, ctx: PluginContext) {
      ctx.logger.info("Setting up UIAddon plugin...");

      const { enabled = true } = pluginConfig;

      if (!enabled) {
        ctx.logger.warn("Plugin is disabled");
        return;
      }

      // Setup theme if provided
      if (pluginConfig.theme) {
        ctx.logger.debug("Configuring custom theme");
      }

      ctx.logger.success("UIAddon plugin setup complete!");
    },

    hooks: {
      async init(ctx) {
        ctx.logger.info("UIAddon plugin initialized");
      },
    },
  };
}

export default createUIAddonPlugin();

// Example usage in your app:
// import { Button, Card, ThemeProvider } from 'philjs-plugin-ui-addon';
//
// function App() {
//   return (
//     <ThemeProvider theme={{ primaryColor: '#ff6b6b' }}>
//       <Card title="Welcome">
//         <p>This is a card component</p>
//         <Button onClick={() => alert('Clicked!')}>
//           Click Me
//         </Button>
//       </Card>
//     </ThemeProvider>
//   );
// }

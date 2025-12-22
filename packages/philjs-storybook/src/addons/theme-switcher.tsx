/**
 * Theme Switcher Addon
 *
 * Switch between light/dark themes and custom themes
 */

import { signal, effect } from 'philjs-core';

const ADDON_ID = 'philjs/theme-switcher';
const TOOLBAR_ID = `${ADDON_ID}/toolbar`;

export type Theme = 'light' | 'dark' | 'custom';

interface ThemeConfig {
  name: string;
  colors: Record<string, string>;
}

const currentTheme$ = signal<Theme>('light');
const customThemes$ = signal<ThemeConfig[]>([]);

const defaultThemes: Record<Theme, ThemeConfig> = {
  light: {
    name: 'Light',
    colors: {
      '--bg-color': '#ffffff',
      '--text-color': '#000000',
      '--primary-color': '#1976d2',
      '--secondary-color': '#dc004e',
      '--border-color': '#e0e0e0',
    },
  },
  dark: {
    name: 'Dark',
    colors: {
      '--bg-color': '#121212',
      '--text-color': '#ffffff',
      '--primary-color': '#90caf9',
      '--secondary-color': '#f48fb1',
      '--border-color': '#424242',
    },
  },
  custom: {
    name: 'Custom',
    colors: {},
  },
};

/**
 * Set the current theme
 */
export function setTheme(theme: Theme) {
  currentTheme$.set(theme);
  applyTheme(theme);
}

/**
 * Get the current theme
 */
export function getTheme(): Theme {
  return currentTheme$();
}

/**
 * Register a custom theme
 */
export function registerTheme(theme: ThemeConfig) {
  customThemes$.set([...customThemes$(), theme]);
}

/**
 * Apply theme to document
 */
function applyTheme(theme: Theme) {
  const themeConfig = defaultThemes[theme];
  if (!themeConfig) return;

  Object.entries(themeConfig.colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
}

/**
 * Theme Switcher Toolbar Component
 */
export function ThemeSwitcherToolbar() {
  const themes = ['light', 'dark', ...customThemes$().map((t) => t.name)];

  effect(() => {
    applyTheme(currentTheme$());
  });

  const handleThemeChange = (e: any) => {
    const theme = e.target.value as Theme;
    setTheme(theme);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Theme:</label>
      <select
        value={currentTheme$()}
        onChange={handleThemeChange}
        style={{
          padding: '4px 8px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '12px',
        }}
      >
        {themes.map((theme) => (
          <option key={theme} value={theme}>
            {theme.charAt(0).toUpperCase() + theme.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Theme Switcher Panel Component
 */
export function ThemeSwitcherPanel() {
  const newThemeName$ = signal<string>('');
  const themeColors$ = signal<Record<string, string>>({});

  const handleAddColor = () => {
    const key = prompt('CSS Variable name (e.g., --primary-color):');
    const value = prompt('CSS Value (e.g., #1976d2):');

    if (key && value) {
      themeColors$.set({
        ...themeColors$(),
        [key]: value,
      });
    }
  };

  const handleCreateTheme = () => {
    const name = newThemeName$();
    if (!name) return;

    registerTheme({
      name,
      colors: themeColors$(),
    });

    newThemeName$.set('');
    themeColors$.set({});
  };

  return (
    <div style={{ padding: '16px', fontFamily: 'sans-serif' }}>
      <h2>Theme Switcher</h2>

      <div style={{ marginBottom: '24px' }}>
        <h3>Current Theme: {currentTheme$()}</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          {Object.keys(defaultThemes).map((theme) => (
            <button
              key={theme}
              onClick={() => setTheme(theme as Theme)}
              style={{
                padding: '8px 16px',
                backgroundColor: currentTheme$() === theme ? '#1976d2' : '#f5f5f5',
                color: currentTheme$() === theme ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {defaultThemes[theme as Theme].name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3>Create Custom Theme</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="text"
            value={newThemeName$()}
            onInput={(e: any) => newThemeName$.set(e.target.value)}
            placeholder="Theme name"
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />

          <div>
            <button
              onClick={handleAddColor}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Add Color Variable
            </button>
          </div>

          {Object.entries(themeColors$()).map(([key, value]) => (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
              }}
            >
              <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{key}:</span>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: value,
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
              <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{value}</span>
            </div>
          ))}

          <button
            onClick={handleCreateTheme}
            disabled={!newThemeName$() || Object.keys(themeColors$()).length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: !newThemeName$() || Object.keys(themeColors$()).length === 0 ? 0.5 : 1,
            }}
          >
            Create Theme
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Addon registration
 */
export const themeSwitcherAddon = {
  id: ADDON_ID,
  title: 'Theme Switcher',
  type: 'panel',
  toolbar: ThemeSwitcherToolbar,
  render: () => <ThemeSwitcherPanel />,
};

export default themeSwitcherAddon;

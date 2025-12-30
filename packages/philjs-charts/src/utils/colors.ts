/**
 * Color palettes and utilities for PhilJS Charts
 */

// Default color palette - accessible and visually distinct
export const defaultPalette = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
];

// Color-blind safe palette
export const colorBlindSafePalette = [
  '#0077BB', // Blue
  '#33BBEE', // Cyan
  '#009988', // Teal
  '#EE7733', // Orange
  '#CC3311', // Red
  '#EE3377', // Magenta
  '#BBBBBB', // Grey
  '#000000', // Black
];

// Diverging palette (for heatmaps, etc.)
export const divergingPalette = {
  negative: ['#67001F', '#B2182B', '#D6604D', '#F4A582', '#FDDBC7'],
  neutral: '#F7F7F7',
  positive: ['#D1E5F0', '#92C5DE', '#4393C3', '#2166AC', '#053061'],
};

// Sequential palettes
export const sequentialPalettes = {
  blues: ['#EFF6FF', '#BFDBFE', '#60A5FA', '#3B82F6', '#1D4ED8', '#1E3A8A'],
  greens: ['#ECFDF5', '#A7F3D0', '#34D399', '#10B981', '#059669', '#064E3B'],
  oranges: ['#FFF7ED', '#FED7AA', '#FB923C', '#F97316', '#EA580C', '#9A3412'],
  purples: ['#FAF5FF', '#E9D5FF', '#C084FC', '#A855F7', '#7C3AED', '#581C87'],
  reds: ['#FEF2F2', '#FECACA', '#F87171', '#EF4444', '#DC2626', '#7F1D1D'],
};

// Theme definitions
export interface ChartTheme {
  name: string;
  colors: string[];
  background: string;
  text: string;
  grid: string;
  axis: string;
  tooltip: {
    background: string;
    text: string;
    border: string;
  };
}

export const lightTheme: ChartTheme = {
  name: 'light',
  colors: defaultPalette,
  background: '#FFFFFF',
  text: '#1F2937',
  grid: '#E5E7EB',
  axis: '#6B7280',
  tooltip: {
    background: '#FFFFFF',
    text: '#1F2937',
    border: '#E5E7EB',
  },
};

export const darkTheme: ChartTheme = {
  name: 'dark',
  colors: defaultPalette.map(adjustForDarkMode),
  background: '#1F2937',
  text: '#F9FAFB',
  grid: '#374151',
  axis: '#9CA3AF',
  tooltip: {
    background: '#374151',
    text: '#F9FAFB',
    border: '#4B5563',
  },
};

// Utility functions
export function adjustForDarkMode(color: string): string {
  // Lighten colors slightly for dark mode visibility
  const hex = color.replace('#', '');
  const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + 30);
  const g = Math.min(255, parseInt(hex.slice(2, 4), 16) + 30);
  const b = Math.min(255, parseInt(hex.slice(4, 6), 16) + 30);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const hexClean = hex.replace('#', '');
  const r = parseInt(hexClean.slice(0, 2), 16);
  const g = parseInt(hexClean.slice(2, 4), 16);
  const b = parseInt(hexClean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function generateGradient(
  startColor: string,
  endColor: string,
  steps: number
): string[] {
  const start = hexToRgb(startColor);
  const end = hexToRgb(endColor);
  const gradient: string[] = [];

  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);
    const r = Math.round(start.r + (end.r - start.r) * ratio);
    const g = Math.round(start.g + (end.g - start.g) * ratio);
    const b = Math.round(start.b + (end.b - start.b) * ratio);
    gradient.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
  }

  return gradient;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const hexClean = hex.replace('#', '');
  return {
    r: parseInt(hexClean.slice(0, 2), 16),
    g: parseInt(hexClean.slice(2, 4), 16),
    b: parseInt(hexClean.slice(4, 6), 16),
  };
}

export function getContrastColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor);
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#1F2937' : '#F9FAFB';
}

export function createColorScale(
  domain: [number, number],
  palette: string[]
): (value: number) => string {
  const [min, max] = domain;
  const range = max - min;

  return (value: number) => {
    const normalized = Math.max(0, Math.min(1, (value - min) / range));
    const index = Math.floor(normalized * (palette.length - 1));
    return palette[index] ?? palette[0] ?? '#000000';
  };
}

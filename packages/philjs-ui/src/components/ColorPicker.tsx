/**
 * PhilJS UI - ColorPicker Component
 *
 * Full-featured color picker with RGB, HSL, and HEX support,
 * preset colors, and eyedropper tool.
 */

import { signal, effect, memo } from 'philjs-core';

export interface ColorPickerProps {
  value?: string;
  defaultValue?: string;
  format?: 'hex' | 'rgb' | 'hsl';
  showInput?: boolean;
  showPresets?: boolean;
  presets?: string[];
  showEyedropper?: boolean;
  showAlpha?: boolean;
  disabled?: boolean;
  onChange?: (color: string) => void;
  onChangeComplete?: (color: string) => void;
  label?: string;
  className?: string;
}

interface HSL {
  h: number;
  s: number;
  l: number;
  a: number;
}

interface RGB {
  r: number;
  g: number;
  b: number;
  a: number;
}

const DEFAULT_PRESETS = [
  '#000000', '#ffffff', '#f44336', '#e91e63', '#9c27b0', '#673ab7',
  '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
  '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
];

function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0, a: 1 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: result[4] ? parseInt(result[4], 16) / 255 : 1,
  };
}

function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: l * 100, a: rgb.a };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return { h: h * 360, s: s * 100, l: l * 100, a: rgb.a };
}

function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const gray = Math.round(l * 255);
    return { r: gray, g: gray, b: gray, a: hsl.a };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    a: hsl.a,
  };
}

export function ColorPicker(props: ColorPickerProps) {
  const {
    value,
    defaultValue = '#3b82f6',
    format = 'hex',
    showInput = true,
    showPresets = true,
    presets = DEFAULT_PRESETS,
    showEyedropper = true,
    showAlpha = false,
    disabled = false,
    onChange,
    onChangeComplete,
    label,
    className = '',
  } = props;

  const color = signal<HSL>(rgbToHsl(hexToRgb(value ?? defaultValue)));
  const isOpen = signal(false);
  const isDragging = signal(false);
  const inputValue = signal(value ?? defaultValue);
  const saturationRef = signal<HTMLDivElement | null>(null);
  const hueRef = signal<HTMLDivElement | null>(null);
  const alphaRef = signal<HTMLDivElement | null>(null);

  effect(() => {
    if (value) {
      color.set(rgbToHsl(hexToRgb(value)));
      inputValue.set(value);
    }
  });

  const currentHex = memo(() => rgbToHex(hslToRgb(color())));

  const formatOutput = (c: HSL): string => {
    const rgb = hslToRgb(c);
    switch (format) {
      case 'rgb':
        return showAlpha
          ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${c.a.toFixed(2)})`
          : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      case 'hsl':
        return showAlpha
          ? `hsla(${Math.round(c.h)}, ${Math.round(c.s)}%, ${Math.round(c.l)}%, ${c.a.toFixed(2)})`
          : `hsl(${Math.round(c.h)}, ${Math.round(c.s)}%, ${Math.round(c.l)}%)`;
      default:
        return rgbToHex(rgb);
    }
  };

  const updateColor = (updates: Partial<HSL>, complete = false) => {
    const newColor = { ...color(), ...updates };
    color.set(newColor);
    const output = formatOutput(newColor);
    inputValue.set(output);
    onChange?.(output);
    if (complete) onChangeComplete?.(output);
  };

  const handleSaturationMouseDown = (e: MouseEvent) => {
    if (disabled) return;
    isDragging.set(true);
    updateSaturation(e);
  };

  const updateSaturation = (e: MouseEvent) => {
    const rect = saturationRef()?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    updateColor({ s: x * 100, l: (1 - y) * 50 + (1 - x) * 50 * (1 - y) });
  };

  const handleHueMouseDown = (e: MouseEvent) => {
    if (disabled) return;
    isDragging.set(true);
    updateHue(e);
  };

  const updateHue = (e: MouseEvent) => {
    const rect = hueRef()?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    updateColor({ h: x * 360 });
  };

  const handleAlphaMouseDown = (e: MouseEvent) => {
    if (disabled) return;
    isDragging.set(true);
    updateAlpha(e);
  };

  const updateAlpha = (e: MouseEvent) => {
    const rect = alphaRef()?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    updateColor({ a: x });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging()) return;
    // Determine which slider is being dragged based on position
  };

  const handleMouseUp = () => {
    if (isDragging()) {
      isDragging.set(false);
      onChangeComplete?.(formatOutput(color()));
    }
  };

  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const val = target.value;
    inputValue.set(val);

    // Try to parse the color
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      const rgb = hexToRgb(val);
      const hsl = rgbToHsl(rgb);
      color.set(hsl);
      onChange?.(formatOutput(hsl));
    }
  };

  const handlePresetClick = (preset: string) => {
    const rgb = hexToRgb(preset);
    const hsl = rgbToHsl(rgb);
    color.set(hsl);
    const output = formatOutput(hsl);
    inputValue.set(output);
    onChange?.(output);
    onChangeComplete?.(output);
  };

  const handleEyedropper = async () => {
    if (!('EyeDropper' in window)) return;

    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      const rgb = hexToRgb(result.sRGBHex);
      const hsl = rgbToHsl(rgb);
      color.set(hsl);
      const output = formatOutput(hsl);
      inputValue.set(output);
      onChange?.(output);
      onChangeComplete?.(output);
    } catch (e) {
      // User canceled or error
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {/* Trigger */}
      <div
        className={`
          flex items-center gap-2 p-2 border rounded-md
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
        `}
        onClick={() => !disabled && isOpen.set(!isOpen())}
      >
        <div
          className="w-8 h-8 rounded border border-gray-300"
          style={{ backgroundColor: currentHex() }}
        />
        <span className="flex-1 text-sm font-mono">{inputValue()}</span>
      </div>

      {/* Popover */}
      {isOpen() && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => isOpen.set(false)} />
          <div
            className="absolute z-50 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Saturation/Lightness Picker */}
            <div
              ref={(el: HTMLDivElement) => saturationRef.set(el)}
              className="w-48 h-48 rounded cursor-crosshair relative"
              style={{
                background: `
                  linear-gradient(to top, #000, transparent),
                  linear-gradient(to right, #fff, hsl(${color().h}, 100%, 50%))
                `,
              }}
              onMouseDown={handleSaturationMouseDown}
            >
              <div
                className="absolute w-4 h-4 border-2 border-white rounded-full shadow transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${color().s}%`,
                  top: `${100 - color().l}%`,
                  backgroundColor: currentHex(),
                }}
              />
            </div>

            {/* Hue Slider */}
            <div
              ref={(el: HTMLDivElement) => hueRef.set(el)}
              className="w-48 h-3 mt-4 rounded cursor-pointer relative"
              style={{
                background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
              }}
              onMouseDown={handleHueMouseDown}
            >
              <div
                className="absolute w-3 h-5 -top-1 bg-white border border-gray-300 rounded shadow transform -translate-x-1/2"
                style={{ left: `${(color().h / 360) * 100}%` }}
              />
            </div>

            {/* Alpha Slider */}
            {showAlpha && (
              <div
                ref={(el: HTMLDivElement) => alphaRef.set(el)}
                className="w-48 h-3 mt-2 rounded cursor-pointer relative"
                style={{
                  background: `
                    linear-gradient(to right, transparent, ${currentHex()}),
                    repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 50% / 8px 8px
                  `,
                }}
                onMouseDown={handleAlphaMouseDown}
              >
                <div
                  className="absolute w-3 h-5 -top-1 bg-white border border-gray-300 rounded shadow transform -translate-x-1/2"
                  style={{ left: `${color().a * 100}%` }}
                />
              </div>
            )}

            {/* Input */}
            {showInput && (
              <div className="mt-4">
                <input
                  type="text"
                  value={inputValue()}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-sm font-mono border rounded"
                  placeholder="#000000"
                />
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              {showEyedropper && 'EyeDropper' in window && (
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded"
                  onClick={handleEyedropper}
                  title="Pick color from screen"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 2a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V2zm2 0v2h8V2H6z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Presets */}
            {showPresets && presets.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-2">Presets</div>
                <div className="grid grid-cols-6 gap-1">
                  {presets.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: preset }}
                      onClick={() => handlePresetClick(preset)}
                      title={preset}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * SimpleColorPicker - Minimal color input
 */
export interface SimpleColorPickerProps {
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  onChange?: (color: string) => void;
  className?: string;
}

export function SimpleColorPicker(props: SimpleColorPickerProps) {
  const { value, defaultValue = '#3b82f6', disabled = false, onChange, className = '' } = props;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <input
        type="color"
        value={value ?? defaultValue}
        disabled={disabled}
        onChange={(e: any) => onChange?.(e.target.value)}
        className={`
          w-10 h-10 rounded border-0 cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      />
      <input
        type="text"
        value={value ?? defaultValue}
        disabled={disabled}
        onChange={(e: any) => {
          if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
            onChange?.(e.target.value);
          }
        }}
        className={`
          w-24 px-2 py-1 text-sm font-mono border rounded
          ${disabled ? 'bg-gray-100' : ''}
        `}
      />
    </div>
  );
}

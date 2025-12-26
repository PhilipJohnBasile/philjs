// @ts-nocheck
/**
 * Enhanced Property Editor Panel
 * Provides comprehensive editing of component properties, styles, and events
 */

import { signal, memo, effect, batch } from 'philjs-core';
import type { BuilderStore } from '../state/store.js';
import type {
  ComponentNode,
  NodeId,
  PropDefinition,
  PropValue,
  NodeStyles,
  StyleValue,
  EventHandler,
  BindingExpression,
} from '../types.js';

// ============================================================================
// Types
// ============================================================================

export interface PropertyPanelProps {
  store: BuilderStore;
  className?: string;
  style?: Record<string, string | number>;
}

export interface PropertyGroupProps {
  title: string;
  children: any;
  collapsed?: boolean;
  onToggle?: () => void;
}

export interface BindingEditorProps {
  value: PropValue;
  onChange: (value: PropValue) => void;
  onBindingToggle: (isBinding: boolean) => void;
}

type EditorTab = 'properties' | 'styles' | 'layout' | 'typography' | 'effects' | 'events' | 'data';

// ============================================================================
// Constants
// ============================================================================

const SPACING_PRESETS = [0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64];
const FONT_SIZE_PRESETS = [10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72];
const FONT_WEIGHT_PRESETS = [
  { label: 'Thin', value: 100 },
  { label: 'Extra Light', value: 200 },
  { label: 'Light', value: 300 },
  { label: 'Regular', value: 400 },
  { label: 'Medium', value: 500 },
  { label: 'Semibold', value: 600 },
  { label: 'Bold', value: 700 },
  { label: 'Extra Bold', value: 800 },
  { label: 'Black', value: 900 },
];
const BORDER_RADIUS_PRESETS = [0, 2, 4, 6, 8, 12, 16, 24, 32, 9999];
const LINE_HEIGHT_PRESETS = [1, 1.25, 1.375, 1.5, 1.625, 1.75, 2];
const OPACITY_PRESETS = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];

const CSS_UNITS = ['px', 'em', 'rem', '%', 'vh', 'vw', 'auto'];
const DISPLAY_OPTIONS = ['block', 'flex', 'grid', 'inline', 'inline-block', 'inline-flex', 'none'];
const POSITION_OPTIONS = ['static', 'relative', 'absolute', 'fixed', 'sticky'];
const FLEX_DIRECTION_OPTIONS = ['row', 'column', 'row-reverse', 'column-reverse'];
const FLEX_WRAP_OPTIONS = ['nowrap', 'wrap', 'wrap-reverse'];
const JUSTIFY_CONTENT_OPTIONS = ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'];
const ALIGN_ITEMS_OPTIONS = ['flex-start', 'flex-end', 'center', 'stretch', 'baseline'];
const TEXT_ALIGN_OPTIONS = ['left', 'center', 'right', 'justify'];
const FONT_STYLE_OPTIONS = ['normal', 'italic', 'oblique'];
const TEXT_DECORATION_OPTIONS = ['none', 'underline', 'line-through', 'overline'];
const TEXT_TRANSFORM_OPTIONS = ['none', 'uppercase', 'lowercase', 'capitalize'];
const OVERFLOW_OPTIONS = ['visible', 'hidden', 'scroll', 'auto'];
const CURSOR_OPTIONS = ['default', 'pointer', 'text', 'move', 'not-allowed', 'grab', 'grabbing', 'crosshair', 'help', 'wait'];
const BORDER_STYLE_OPTIONS = ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'];
const BLEND_MODE_OPTIONS = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn'];

// ============================================================================
// Utility Functions
// ============================================================================

function getStyleValue(style: StyleValue | string | number | undefined): number {
  if (style === undefined || style === null) return 0;
  if (typeof style === 'number') return style;
  if (typeof style === 'string') return parseFloat(style) || 0;
  if (typeof style === 'object' && 'value' in style) return style.value;
  return 0;
}

function getStyleUnit(style: StyleValue | string | number | undefined): string {
  if (typeof style === 'object' && style !== null && 'unit' in style) {
    return style.unit || 'px';
  }
  return 'px';
}

function isBinding(value: PropValue): value is BindingExpression {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'binding';
}

function createStyleValue(value: number, unit: string = 'px'): StyleValue {
  return { value, unit: unit as StyleValue['unit'] };
}

// ============================================================================
// Reusable Input Components
// ============================================================================

interface InputLabelProps {
  children: string;
  htmlFor?: string;
}

function InputLabel({ children, htmlFor }: InputLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: 'block',
        fontSize: '11px',
        fontWeight: 500,
        color: '#666',
        marginBottom: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
    >
      {children}
    </label>
  );
}

interface NumberInputWithUnitProps {
  label?: string;
  value: number;
  unit: string;
  onChange: (value: number, unit: string) => void;
  min?: number;
  max?: number;
  step?: number;
  presets?: number[];
  showUnit?: boolean;
}

function NumberInputWithUnit({
  label,
  value,
  unit,
  onChange,
  min,
  max,
  step = 1,
  presets,
  showUnit = true,
}: NumberInputWithUnitProps) {
  return (
    <div style={{ marginBottom: '12px' }}>
      {label && <InputLabel>{label}</InputLabel>}
      <div style={{ display: 'flex', gap: '4px' }}>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat((e.target as HTMLInputElement).value) || 0, unit)}
          style={{
            flex: 1,
            padding: '6px 8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '12px',
            minWidth: '60px',
          }}
        />
        {showUnit && (
          <select
            value={unit}
            onChange={(e) => onChange(value, (e.target as HTMLSelectElement).value)}
            style={{
              padding: '6px 4px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '11px',
              backgroundColor: '#fff',
              minWidth: '50px',
            }}
          >
            {CSS_UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        )}
      </div>
      {presets && presets.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', marginTop: '4px' }}>
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => onChange(preset, unit)}
              style={{
                padding: '2px 6px',
                fontSize: '10px',
                border: value === preset ? '1px solid #0066ff' : '1px solid #ddd',
                borderRadius: '2px',
                backgroundColor: value === preset ? '#0066ff' : '#fff',
                color: value === preset ? '#fff' : '#666',
                cursor: 'pointer',
              }}
            >
              {preset}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ColorInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  showAlpha?: boolean;
}

function ColorInput({ label, value, onChange, showAlpha = false }: ColorInputProps) {
  return (
    <div style={{ marginBottom: '12px' }}>
      {label && <InputLabel>{label}</InputLabel>}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            backgroundColor: value || 'transparent',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <input
            type="color"
            value={value?.startsWith('#') ? value : '#000000'}
            onChange={(e) => onChange((e.target as HTMLInputElement).value)}
            style={{
              position: 'absolute',
              top: '-10px',
              left: '-10px',
              width: '60px',
              height: '60px',
              cursor: 'pointer',
              opacity: 0,
            }}
          />
        </div>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange((e.target as HTMLInputElement).value)}
          placeholder="#000000 or rgba()"
          style={{
            flex: 1,
            padding: '6px 8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            style={{
              padding: '4px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title="Clear color"
          >
            X
          </button>
        )}
      </div>
    </div>
  );
}

interface SelectInputProps {
  label?: string;
  value: string;
  options: (string | { label: string; value: string })[];
  onChange: (value: string) => void;
  placeholder?: string;
}

function SelectInput({ label, value, options, onChange, placeholder }: SelectInputProps) {
  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  return (
    <div style={{ marginBottom: '12px' }}>
      {label && <InputLabel>{label}</InputLabel>}
      <select
        value={value || ''}
        onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
        style={{
          width: '100%',
          padding: '6px 8px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '12px',
          backgroundColor: '#fff',
        }}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {normalizedOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface TextInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}

function TextInput({ label, value, onChange, placeholder, multiline, rows = 3 }: TextInputProps) {
  const inputStyle = {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '12px',
    resize: 'vertical' as const,
  };

  return (
    <div style={{ marginBottom: '12px' }}>
      {label && <InputLabel>{label}</InputLabel>}
      {multiline ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange((e.target as HTMLTextAreaElement).value)}
          placeholder={placeholder}
          rows={rows}
          style={inputStyle}
        />
      ) : (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange((e.target as HTMLInputElement).value)}
          placeholder={placeholder}
          style={inputStyle}
        />
      )}
    </div>
  );
}

interface CheckboxInputProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function CheckboxInput({ label, checked, onChange }: CheckboxInputProps) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
        cursor: 'pointer',
        fontSize: '12px',
        color: '#333',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
        style={{ margin: 0 }}
      />
      {label}
    </label>
  );
}

// ============================================================================
// Property Group Component
// ============================================================================

export function PropertyGroup({ title, children, collapsed = false, onToggle }: PropertyGroupProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 0',
          cursor: onToggle ? 'pointer' : 'default',
          borderBottom: '1px solid #eee',
          marginBottom: '12px',
        }}
        onClick={onToggle}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#333', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </span>
        {onToggle && (
          <span style={{ fontSize: '10px', color: '#999', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            v
          </span>
        )}
      </div>
      {!collapsed && (
        <div style={{ paddingLeft: '4px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Spacing Editor Component (Box Model)
// ============================================================================

interface SpacingEditorProps {
  label: string;
  top: number;
  right: number;
  bottom: number;
  left: number;
  onChange: (top: number, right: number, bottom: number, left: number) => void;
}

function SpacingEditor({ label, top, right, bottom, left, onChange }: SpacingEditorProps) {
  const linked = signal(top === right && right === bottom && bottom === left);

  const handleChange = (position: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    if (linked()) {
      onChange(value, value, value, value);
    } else {
      const values = { top, right, bottom, left, [position]: value };
      onChange(values.top, values.right, values.bottom, values.left);
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <InputLabel>{label}</InputLabel>
        <button
          onClick={() => {
            if (!linked()) {
              // Link all values
              onChange(top, top, top, top);
            }
            linked.set(!linked());
          }}
          style={{
            padding: '2px 6px',
            border: linked() ? '1px solid #0066ff' : '1px solid #ddd',
            borderRadius: '2px',
            backgroundColor: linked() ? '#0066ff' : '#fff',
            color: linked() ? '#fff' : '#666',
            cursor: 'pointer',
            fontSize: '10px',
          }}
          title={linked() ? 'Unlink values' : 'Link all values'}
        >
          {linked() ? 'Linked' : 'Link'}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '10px', color: '#999', width: '12px' }}>T</span>
          <input
            type="number"
            value={top}
            onChange={(e) => handleChange('top', parseFloat((e.target as HTMLInputElement).value) || 0)}
            style={{ flex: 1, padding: '4px 6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '11px' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '10px', color: '#999', width: '12px' }}>R</span>
          <input
            type="number"
            value={right}
            onChange={(e) => handleChange('right', parseFloat((e.target as HTMLInputElement).value) || 0)}
            style={{ flex: 1, padding: '4px 6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '11px' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '10px', color: '#999', width: '12px' }}>B</span>
          <input
            type="number"
            value={bottom}
            onChange={(e) => handleChange('bottom', parseFloat((e.target as HTMLInputElement).value) || 0)}
            style={{ flex: 1, padding: '4px 6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '11px' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '10px', color: '#999', width: '12px' }}>L</span>
          <input
            type="number"
            value={left}
            onChange={(e) => handleChange('left', parseFloat((e.target as HTMLInputElement).value) || 0)}
            style={{ flex: 1, padding: '4px 6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '11px' }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Layout Tab Component
// ============================================================================

interface LayoutTabProps {
  styles: NodeStyles;
  onChange: (styles: Partial<NodeStyles>) => void;
}

function LayoutTab({ styles, onChange }: LayoutTabProps) {
  return (
    <div style={{ padding: '12px' }}>
      <PropertyGroup title="Display">
        <SelectInput
          label="Display"
          value={(styles.display as string) || 'block'}
          options={DISPLAY_OPTIONS}
          onChange={(v) => onChange({ display: v })}
        />
        <SelectInput
          label="Position"
          value={(styles.position as string) || 'static'}
          options={POSITION_OPTIONS}
          onChange={(v) => onChange({ position: v })}
        />
      </PropertyGroup>

      {(styles.position === 'absolute' || styles.position === 'fixed' || styles.position === 'sticky') && (
        <PropertyGroup title="Position Offsets">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <NumberInputWithUnit
              label="Top"
              value={getStyleValue(styles.top)}
              unit={getStyleUnit(styles.top)}
              onChange={(v, u) => onChange({ top: createStyleValue(v, u) })}
            />
            <NumberInputWithUnit
              label="Right"
              value={getStyleValue(styles.right)}
              unit={getStyleUnit(styles.right)}
              onChange={(v, u) => onChange({ right: createStyleValue(v, u) })}
            />
            <NumberInputWithUnit
              label="Bottom"
              value={getStyleValue(styles.bottom)}
              unit={getStyleUnit(styles.bottom)}
              onChange={(v, u) => onChange({ bottom: createStyleValue(v, u) })}
            />
            <NumberInputWithUnit
              label="Left"
              value={getStyleValue(styles.left)}
              unit={getStyleUnit(styles.left)}
              onChange={(v, u) => onChange({ left: createStyleValue(v, u) })}
            />
          </div>
        </PropertyGroup>
      )}

      {styles.display === 'flex' && (
        <PropertyGroup title="Flexbox">
          <SelectInput
            label="Direction"
            value={(styles.flexDirection as string) || 'row'}
            options={FLEX_DIRECTION_OPTIONS}
            onChange={(v) => onChange({ flexDirection: v })}
          />
          <SelectInput
            label="Wrap"
            value={(styles.flexWrap as string) || 'nowrap'}
            options={FLEX_WRAP_OPTIONS}
            onChange={(v) => onChange({ flexWrap: v })}
          />
          <SelectInput
            label="Justify Content"
            value={(styles.justifyContent as string) || 'flex-start'}
            options={JUSTIFY_CONTENT_OPTIONS}
            onChange={(v) => onChange({ justifyContent: v })}
          />
          <SelectInput
            label="Align Items"
            value={(styles.alignItems as string) || 'stretch'}
            options={ALIGN_ITEMS_OPTIONS}
            onChange={(v) => onChange({ alignItems: v })}
          />
          <NumberInputWithUnit
            label="Gap"
            value={getStyleValue(styles.gap)}
            unit={getStyleUnit(styles.gap)}
            onChange={(v, u) => onChange({ gap: createStyleValue(v, u) })}
            presets={SPACING_PRESETS}
          />
        </PropertyGroup>
      )}

      {styles.display === 'grid' && (
        <PropertyGroup title="Grid">
          <TextInput
            label="Columns"
            value={(styles.gridTemplateColumns as string) || ''}
            onChange={(v) => onChange({ gridTemplateColumns: v })}
            placeholder="e.g., repeat(3, 1fr)"
          />
          <TextInput
            label="Rows"
            value={(styles.gridTemplateRows as string) || ''}
            onChange={(v) => onChange({ gridTemplateRows: v })}
            placeholder="e.g., repeat(2, auto)"
          />
          <NumberInputWithUnit
            label="Gap"
            value={getStyleValue(styles.gridGap)}
            unit={getStyleUnit(styles.gridGap)}
            onChange={(v, u) => onChange({ gridGap: createStyleValue(v, u) })}
            presets={SPACING_PRESETS}
          />
        </PropertyGroup>
      )}

      <PropertyGroup title="Size">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <NumberInputWithUnit
            label="Width"
            value={getStyleValue(styles.width)}
            unit={getStyleUnit(styles.width)}
            onChange={(v, u) => onChange({ width: createStyleValue(v, u) })}
          />
          <NumberInputWithUnit
            label="Height"
            value={getStyleValue(styles.height)}
            unit={getStyleUnit(styles.height)}
            onChange={(v, u) => onChange({ height: createStyleValue(v, u) })}
          />
          <NumberInputWithUnit
            label="Min Width"
            value={getStyleValue(styles.minWidth)}
            unit={getStyleUnit(styles.minWidth)}
            onChange={(v, u) => onChange({ minWidth: createStyleValue(v, u) })}
          />
          <NumberInputWithUnit
            label="Min Height"
            value={getStyleValue(styles.minHeight)}
            unit={getStyleUnit(styles.minHeight)}
            onChange={(v, u) => onChange({ minHeight: createStyleValue(v, u) })}
          />
          <NumberInputWithUnit
            label="Max Width"
            value={getStyleValue(styles.maxWidth)}
            unit={getStyleUnit(styles.maxWidth)}
            onChange={(v, u) => onChange({ maxWidth: createStyleValue(v, u) })}
          />
          <NumberInputWithUnit
            label="Max Height"
            value={getStyleValue(styles.maxHeight)}
            unit={getStyleUnit(styles.maxHeight)}
            onChange={(v, u) => onChange({ maxHeight: createStyleValue(v, u) })}
          />
        </div>
      </PropertyGroup>

      <PropertyGroup title="Spacing">
        <SpacingEditor
          label="Margin"
          top={getStyleValue(styles.marginTop)}
          right={getStyleValue(styles.marginRight)}
          bottom={getStyleValue(styles.marginBottom)}
          left={getStyleValue(styles.marginLeft)}
          onChange={(t, r, b, l) => onChange({
            marginTop: createStyleValue(t),
            marginRight: createStyleValue(r),
            marginBottom: createStyleValue(b),
            marginLeft: createStyleValue(l),
          })}
        />
        <SpacingEditor
          label="Padding"
          top={getStyleValue(styles.paddingTop)}
          right={getStyleValue(styles.paddingRight)}
          bottom={getStyleValue(styles.paddingBottom)}
          left={getStyleValue(styles.paddingLeft)}
          onChange={(t, r, b, l) => onChange({
            paddingTop: createStyleValue(t),
            paddingRight: createStyleValue(r),
            paddingBottom: createStyleValue(b),
            paddingLeft: createStyleValue(l),
          })}
        />
      </PropertyGroup>
    </div>
  );
}

// ============================================================================
// Typography Tab Component
// ============================================================================

interface TypographyTabProps {
  styles: NodeStyles;
  onChange: (styles: Partial<NodeStyles>) => void;
}

function TypographyTab({ styles, onChange }: TypographyTabProps) {
  return (
    <div style={{ padding: '12px' }}>
      <PropertyGroup title="Font">
        <TextInput
          label="Font Family"
          value={(styles.fontFamily as string) || ''}
          onChange={(v) => onChange({ fontFamily: v })}
          placeholder="e.g., Arial, sans-serif"
        />
        <NumberInputWithUnit
          label="Font Size"
          value={getStyleValue(styles.fontSize)}
          unit={getStyleUnit(styles.fontSize)}
          onChange={(v, u) => onChange({ fontSize: createStyleValue(v, u) })}
          presets={FONT_SIZE_PRESETS}
        />
        <SelectInput
          label="Font Weight"
          value={String(styles.fontWeight || 400)}
          options={FONT_WEIGHT_PRESETS.map((p) => ({ label: `${p.label} (${p.value})`, value: String(p.value) }))}
          onChange={(v) => onChange({ fontWeight: parseInt(v) })}
        />
        <SelectInput
          label="Font Style"
          value={(styles.fontStyle as string) || 'normal'}
          options={FONT_STYLE_OPTIONS}
          onChange={(v) => onChange({ fontStyle: v })}
        />
      </PropertyGroup>

      <PropertyGroup title="Text">
        <ColorInput
          label="Color"
          value={(styles.color as string) || ''}
          onChange={(v) => onChange({ color: v })}
        />
        <SelectInput
          label="Text Align"
          value={(styles.textAlign as string) || 'left'}
          options={TEXT_ALIGN_OPTIONS}
          onChange={(v) => onChange({ textAlign: v })}
        />
        <SelectInput
          label="Text Decoration"
          value={(styles.textDecoration as string) || 'none'}
          options={TEXT_DECORATION_OPTIONS}
          onChange={(v) => onChange({ textDecoration: v })}
        />
        <SelectInput
          label="Text Transform"
          value={(styles.textTransform as string) || 'none'}
          options={TEXT_TRANSFORM_OPTIONS}
          onChange={(v) => onChange({ textTransform: v })}
        />
      </PropertyGroup>

      <PropertyGroup title="Spacing">
        <NumberInputWithUnit
          label="Line Height"
          value={getStyleValue(styles.lineHeight)}
          unit={getStyleUnit(styles.lineHeight) || 'none'}
          onChange={(v, u) => onChange({ lineHeight: createStyleValue(v, u) })}
          presets={LINE_HEIGHT_PRESETS}
        />
        <NumberInputWithUnit
          label="Letter Spacing"
          value={getStyleValue(styles.letterSpacing)}
          unit={getStyleUnit(styles.letterSpacing)}
          onChange={(v, u) => onChange({ letterSpacing: createStyleValue(v, u) })}
        />
      </PropertyGroup>
    </div>
  );
}

// ============================================================================
// Effects Tab Component
// ============================================================================

interface EffectsTabProps {
  styles: NodeStyles;
  onChange: (styles: Partial<NodeStyles>) => void;
}

function EffectsTab({ styles, onChange }: EffectsTabProps) {
  return (
    <div style={{ padding: '12px' }}>
      <PropertyGroup title="Background">
        <ColorInput
          label="Background Color"
          value={(styles.backgroundColor as string) || ''}
          onChange={(v) => onChange({ backgroundColor: v })}
        />
        <TextInput
          label="Background Image"
          value={(styles.backgroundImage as string) || ''}
          onChange={(v) => onChange({ backgroundImage: v })}
          placeholder="url(...) or gradient"
        />
        <SelectInput
          label="Background Size"
          value={(styles.backgroundSize as string) || 'auto'}
          options={['auto', 'cover', 'contain', '100% 100%']}
          onChange={(v) => onChange({ backgroundSize: v })}
        />
        <SelectInput
          label="Background Position"
          value={(styles.backgroundPosition as string) || 'center'}
          options={['center', 'top', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right']}
          onChange={(v) => onChange({ backgroundPosition: v })}
        />
        <SelectInput
          label="Background Repeat"
          value={(styles.backgroundRepeat as string) || 'no-repeat'}
          options={['no-repeat', 'repeat', 'repeat-x', 'repeat-y', 'space', 'round']}
          onChange={(v) => onChange({ backgroundRepeat: v })}
        />
      </PropertyGroup>

      <PropertyGroup title="Border">
        <NumberInputWithUnit
          label="Border Radius"
          value={getStyleValue(styles.borderRadius)}
          unit={getStyleUnit(styles.borderRadius)}
          onChange={(v, u) => onChange({ borderRadius: createStyleValue(v, u) })}
          presets={BORDER_RADIUS_PRESETS}
        />
        <NumberInputWithUnit
          label="Border Width"
          value={getStyleValue(styles.borderWidth)}
          unit={getStyleUnit(styles.borderWidth)}
          onChange={(v, u) => onChange({ borderWidth: createStyleValue(v, u) })}
        />
        <SelectInput
          label="Border Style"
          value={(styles.borderStyle as string) || 'none'}
          options={BORDER_STYLE_OPTIONS}
          onChange={(v) => onChange({ borderStyle: v })}
        />
        <ColorInput
          label="Border Color"
          value={(styles.borderColor as string) || ''}
          onChange={(v) => onChange({ borderColor: v })}
        />
      </PropertyGroup>

      <PropertyGroup title="Shadow & Opacity">
        <TextInput
          label="Box Shadow"
          value={(styles.boxShadow as string) || ''}
          onChange={(v) => onChange({ boxShadow: v })}
          placeholder="e.g., 0 4px 6px rgba(0,0,0,0.1)"
        />
        <NumberInputWithUnit
          label="Opacity"
          value={(styles.opacity as number) ?? 1}
          unit=""
          onChange={(v) => onChange({ opacity: Math.max(0, Math.min(1, v)) })}
          min={0}
          max={1}
          step={0.05}
          presets={OPACITY_PRESETS}
          showUnit={false}
        />
      </PropertyGroup>

      <PropertyGroup title="Transform">
        <TextInput
          label="Transform"
          value={(styles.transform as string) || ''}
          onChange={(v) => onChange({ transform: v })}
          placeholder="e.g., rotate(45deg) scale(1.1)"
        />
        <TextInput
          label="Transition"
          value={(styles.transition as string) || ''}
          onChange={(v) => onChange({ transition: v })}
          placeholder="e.g., all 0.3s ease"
        />
      </PropertyGroup>

      <PropertyGroup title="Overflow & Cursor">
        <SelectInput
          label="Overflow"
          value={(styles.overflow as string) || 'visible'}
          options={OVERFLOW_OPTIONS}
          onChange={(v) => onChange({ overflow: v })}
        />
        <SelectInput
          label="Cursor"
          value={(styles.cursor as string) || 'default'}
          options={CURSOR_OPTIONS}
          onChange={(v) => onChange({ cursor: v })}
        />
        <NumberInputWithUnit
          label="Z-Index"
          value={(styles.zIndex as number) ?? 0}
          unit=""
          onChange={(v) => onChange({ zIndex: Math.round(v) })}
          showUnit={false}
        />
      </PropertyGroup>
    </div>
  );
}

// ============================================================================
// Events Tab Component
// ============================================================================

interface EventsTabProps {
  events: EventHandler[];
  onChange: (events: EventHandler[]) => void;
}

const EVENT_TYPES = [
  { value: 'onClick', label: 'Click' },
  { value: 'onDoubleClick', label: 'Double Click' },
  { value: 'onMouseEnter', label: 'Mouse Enter' },
  { value: 'onMouseLeave', label: 'Mouse Leave' },
  { value: 'onMouseDown', label: 'Mouse Down' },
  { value: 'onMouseUp', label: 'Mouse Up' },
  { value: 'onFocus', label: 'Focus' },
  { value: 'onBlur', label: 'Blur' },
  { value: 'onChange', label: 'Change' },
  { value: 'onInput', label: 'Input' },
  { value: 'onSubmit', label: 'Submit' },
  { value: 'onKeyDown', label: 'Key Down' },
  { value: 'onKeyUp', label: 'Key Up' },
  { value: 'onKeyPress', label: 'Key Press' },
  { value: 'onScroll', label: 'Scroll' },
  { value: 'onWheel', label: 'Wheel' },
  { value: 'onDragStart', label: 'Drag Start' },
  { value: 'onDragEnd', label: 'Drag End' },
  { value: 'onDrop', label: 'Drop' },
];

function EventsTab({ events, onChange }: EventsTabProps) {
  const addEvent = () => {
    onChange([...events, { event: 'onClick', handler: '', modifiers: [] }]);
  };

  const updateEvent = (index: number, updates: Partial<EventHandler>) => {
    const newEvents = [...events];
    newEvents[index] = { ...newEvents[index], ...updates };
    onChange(newEvents);
  };

  const removeEvent = (index: number) => {
    onChange(events.filter((_, i) => i !== index));
  };

  return (
    <div style={{ padding: '12px' }}>
      <PropertyGroup title="Event Handlers">
        {events.map((event, index) => (
          <div
            key={index}
            style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #e9ecef',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <SelectInput
                value={event.event}
                options={EVENT_TYPES}
                onChange={(v) => updateEvent(index, { event: v })}
              />
              <button
                onClick={() => removeEvent(index)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                Remove
              </button>
            </div>
            <textarea
              value={event.handler}
              onChange={(e) => updateEvent(index, { handler: (e.target as HTMLTextAreaElement).value })}
              placeholder={`// ${event.event} handler\n(event) => {\n  // Your code here\n}`}
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace',
                resize: 'vertical',
                backgroundColor: '#fff',
              }}
            />
            <div style={{ marginTop: '8px' }}>
              <InputLabel>Modifiers</InputLabel>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['prevent', 'stop', 'self', 'once', 'capture'].map((mod) => (
                  <label key={mod} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                    <input
                      type="checkbox"
                      checked={event.modifiers?.includes(mod) || false}
                      onChange={(e) => {
                        const modifiers = event.modifiers || [];
                        if ((e.target as HTMLInputElement).checked) {
                          updateEvent(index, { modifiers: [...modifiers, mod] });
                        } else {
                          updateEvent(index, { modifiers: modifiers.filter((m) => m !== mod) });
                        }
                      }}
                    />
                    {mod}
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addEvent}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#f0f0f0',
            border: '2px dashed #ccc',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#666',
            transition: 'all 0.2s ease',
          }}
        >
          + Add Event Handler
        </button>
      </PropertyGroup>
    </div>
  );
}

// ============================================================================
// Properties Tab Component
// ============================================================================

interface PropertiesTabProps {
  node: ComponentNode;
  componentDef: any;
  onPropsChange: (key: string, value: PropValue) => void;
}

function PropertiesTab({ node, componentDef, onPropsChange }: PropertiesTabProps) {
  const propsByGroup = new Map<string, PropDefinition[]>();

  if (componentDef?.props) {
    for (const prop of componentDef.props) {
      const group = prop.group || 'General';
      if (!propsByGroup.has(group)) {
        propsByGroup.set(group, []);
      }
      propsByGroup.get(group)!.push(prop);
    }
  }

  const renderPropEditor = (prop: PropDefinition) => {
    const value = node.props[prop.name];

    switch (prop.type) {
      case 'string':
        return (
          <TextInput
            key={prop.name}
            label={prop.name}
            value={(value as string) || (prop.defaultValue as string) || ''}
            onChange={(v) => onPropsChange(prop.name, v)}
            placeholder={prop.description}
          />
        );

      case 'number':
        return (
          <NumberInputWithUnit
            key={prop.name}
            label={prop.name}
            value={(value as number) ?? (prop.defaultValue as number) ?? 0}
            unit=""
            onChange={(v) => onPropsChange(prop.name, v)}
            min={prop.min}
            max={prop.max}
            step={prop.step}
            showUnit={false}
          />
        );

      case 'boolean':
        return (
          <CheckboxInput
            key={prop.name}
            label={prop.name}
            checked={(value as boolean) ?? (prop.defaultValue as boolean) ?? false}
            onChange={(v) => onPropsChange(prop.name, v)}
          />
        );

      case 'enum':
        return (
          <SelectInput
            key={prop.name}
            label={prop.name}
            value={(value as string) || (prop.defaultValue as string) || ''}
            options={prop.enumValues || []}
            onChange={(v) => onPropsChange(prop.name, v)}
          />
        );

      case 'color':
        return (
          <ColorInput
            key={prop.name}
            label={prop.name}
            value={(value as string) || (prop.defaultValue as string) || ''}
            onChange={(v) => onPropsChange(prop.name, v)}
          />
        );

      case 'image':
        return (
          <TextInput
            key={prop.name}
            label={prop.name}
            value={(value as string) || (prop.defaultValue as string) || ''}
            onChange={(v) => onPropsChange(prop.name, v)}
            placeholder="Enter image URL"
          />
        );

      case 'array':
        return (
          <TextInput
            key={prop.name}
            label={prop.name}
            value={Array.isArray(value) ? value.join(', ') : (prop.defaultValue as string[])?.join(', ') || ''}
            onChange={(v) => onPropsChange(prop.name, v.split(',').map((s) => s.trim()))}
            placeholder="Comma-separated values"
          />
        );

      default:
        return (
          <TextInput
            key={prop.name}
            label={prop.name}
            value={typeof value === 'object' ? JSON.stringify(value) : String(value || '')}
            onChange={(v) => {
              try {
                onPropsChange(prop.name, JSON.parse(v));
              } catch {
                onPropsChange(prop.name, v);
              }
            }}
          />
        );
    }
  };

  return (
    <div style={{ padding: '12px' }}>
      {propsByGroup.size === 0 && (
        <div style={{ padding: '24px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
          No configurable properties for this component
        </div>
      )}

      {Array.from(propsByGroup.entries()).map(([group, props]) => (
        <PropertyGroup key={group} title={group}>
          {props.map(renderPropEditor)}
        </PropertyGroup>
      ))}
    </div>
  );
}

// ============================================================================
// Main Property Panel Component
// ============================================================================

export function PropertyPanel({ store, className, style }: PropertyPanelProps) {
  const activeTab = signal<EditorTab>('properties');
  const collapsedGroups = signal<Set<string>>(new Set());

  const selection = store.selection;
  const nodes = store.nodes;
  const components = store.components;

  const selectedNode = memo(() => {
    const sel = selection();
    if (sel.selectedIds.length !== 1) return null;
    return nodes()[sel.selectedIds[0]] || null;
  });

  const componentDef = memo(() => {
    const node = selectedNode();
    if (!node) return null;
    return components()[node.type] || null;
  });

  const handlePropsChange = (key: string, value: PropValue) => {
    const node = selectedNode();
    if (!node) return;

    store.dispatch({
      type: 'UPDATE_NODE_PROPS',
      payload: { nodeId: node.id, props: { [key]: value } },
    });
  };

  const handleStylesChange = (newStyles: Partial<NodeStyles>) => {
    const node = selectedNode();
    if (!node) return;

    store.dispatch({
      type: 'UPDATE_NODE_STYLES',
      payload: { nodeId: node.id, styles: newStyles },
    });
  };

  const handleEventsChange = (events: EventHandler[]) => {
    const node = selectedNode();
    if (!node) return;

    const currentNodes = nodes();
    store.nodes.set({
      ...currentNodes,
      [node.id]: { ...node, events },
    });
  };

  const node = selectedNode();
  const tabs: { key: EditorTab; label: string }[] = [
    { key: 'properties', label: 'Props' },
    { key: 'layout', label: 'Layout' },
    { key: 'typography', label: 'Text' },
    { key: 'effects', label: 'Effects' },
    { key: 'events', label: 'Events' },
  ];

  return (
    <div
      class={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#fafafa',
        borderLeft: '1px solid #e0e0e0',
        minWidth: '280px',
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#ffffff',
        }}
      >
        {node ? (
          <>
            <input
              type="text"
              value={node.name || node.type}
              onChange={(e) => {
                store.dispatch({
                  type: 'UPDATE_NODE_NAME',
                  payload: { nodeId: node.id, name: (e.target as HTMLInputElement).value },
                });
              }}
              style={{
                width: '100%',
                padding: '4px 0',
                border: 'none',
                borderBottom: '2px solid transparent',
                fontSize: '14px',
                fontWeight: 600,
                color: '#333',
                backgroundColor: 'transparent',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', color: '#666', backgroundColor: '#e9ecef', padding: '2px 6px', borderRadius: '4px' }}>
                {node.type}
              </span>
              <span style={{ fontSize: '10px', color: '#999', fontFamily: 'monospace' }}>
                {node.id.slice(0, 15)}...
              </span>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#999', fontSize: '13px', padding: '8px 0' }}>
            No element selected
          </div>
        )}
      </div>

      {node && (
        <>
          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#ffffff',
              overflowX: 'auto',
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => activeTab.set(tab.key)}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: activeTab() === tab.key ? '#0066ff' : '#666',
                  borderBottom: activeTab() === tab.key ? '2px solid #0066ff' : '2px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {activeTab() === 'properties' && (
              <PropertiesTab
                node={node}
                componentDef={componentDef()}
                onPropsChange={handlePropsChange}
              />
            )}

            {activeTab() === 'layout' && (
              <LayoutTab
                styles={node.styles}
                onChange={handleStylesChange}
              />
            )}

            {activeTab() === 'typography' && (
              <TypographyTab
                styles={node.styles}
                onChange={handleStylesChange}
              />
            )}

            {activeTab() === 'effects' && (
              <EffectsTab
                styles={node.styles}
                onChange={handleStylesChange}
              />
            )}

            {activeTab() === 'events' && (
              <EventsTab
                events={node.events}
                onChange={handleEventsChange}
              />
            )}
          </div>
        </>
      )}

      {!node && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ textAlign: 'center', color: '#999', fontSize: '13px' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px', opacity: 0.5 }}>O</div>
            <p style={{ margin: '0 0 8px' }}>Select an element to</p>
            <p style={{ margin: 0 }}>edit its properties</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertyPanel;

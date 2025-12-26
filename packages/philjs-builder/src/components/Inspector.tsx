// @ts-nocheck
/**
 * Property Inspector Panel for the visual builder
 * Allows editing component properties, styles, and events
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
} from '../types.js';

// ============================================================================
// Types
// ============================================================================

export interface InspectorProps {
  store: BuilderStore;
  className?: string;
  style?: Record<string, string | number>;
}

export interface PropertyEditorProps {
  definition: PropDefinition;
  value: PropValue;
  onChange: (value: PropValue) => void;
}

export interface StyleEditorProps {
  store: BuilderStore;
  nodeId: NodeId;
  styles: NodeStyles;
  onChange: (styles: Partial<NodeStyles>) => void;
}

export interface EventEditorProps {
  events: EventHandler[];
  onChange: (events: EventHandler[]) => void;
}

type InspectorTab = 'props' | 'styles' | 'events' | 'advanced';

// ============================================================================
// Style Preset Definitions
// ============================================================================

const spacingPresets = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64];
const fontSizePresets = [10, 11, 12, 13, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72];
const fontWeightPresets = [
  { label: 'Thin', value: 100 },
  { label: 'Light', value: 300 },
  { label: 'Regular', value: 400 },
  { label: 'Medium', value: 500 },
  { label: 'Semibold', value: 600 },
  { label: 'Bold', value: 700 },
  { label: 'Black', value: 900 },
];
const borderRadiusPresets = [0, 2, 4, 6, 8, 12, 16, 24, 9999];

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

// ============================================================================
// Input Components
// ============================================================================

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  presets?: number[];
  label?: string;
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = 'px',
  presets,
  label,
}: NumberInputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label style={{ fontSize: '11px', color: '#666', fontWeight: 500 }}>
          {label}
        </label>
      )}
      <div style={{ display: 'flex', gap: '4px' }}>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat((e.target as HTMLInputElement).value) || 0)}
          style={{
            flex: 1,
            padding: '6px 8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '12px',
          }}
        />
        <span style={{ fontSize: '11px', color: '#999', alignSelf: 'center' }}>{unit}</span>
      </div>
      {presets && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => onChange(preset)}
              style={{
                padding: '2px 6px',
                fontSize: '10px',
                border: '1px solid #ddd',
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
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

function ColorInput({ value, onChange, label }: ColorInputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label style={{ fontSize: '11px', color: '#666', fontWeight: 500 }}>
          {label}
        </label>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange((e.target as HTMLInputElement).value)}
          style={{
            width: '32px',
            height: '32px',
            padding: 0,
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange((e.target as HTMLInputElement).value)}
          placeholder="#000000"
          style={{
            flex: 1,
            padding: '6px 8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '12px',
          }}
        />
      </div>
    </div>
  );
}

interface SelectInputProps {
  value: string;
  options: { label: string; value: string }[] | string[];
  onChange: (value: string) => void;
  label?: string;
}

function SelectInput({ value, options, onChange, label }: SelectInputProps) {
  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label style={{ fontSize: '11px', color: '#666', fontWeight: 500 }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
        style={{
          padding: '6px 8px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '12px',
          backgroundColor: '#fff',
        }}
      >
        {normalizedOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ============================================================================
// Property Editor Component
// ============================================================================

export function PropertyEditor({ definition, value, onChange }: PropertyEditorProps) {
  switch (definition.type) {
    case 'string':
      return (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '11px', color: '#666', fontWeight: 500, marginBottom: '4px', display: 'block' }}>
            {definition.name}
          </label>
          <input
            type="text"
            value={(value as string) || definition.defaultValue || ''}
            onChange={(e) => onChange((e.target as HTMLInputElement).value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          />
        </div>
      );

    case 'number':
      return (
        <div style={{ marginBottom: '12px' }}>
          <NumberInput
            label={definition.name}
            value={(value as number) ?? (definition.defaultValue as number) ?? 0}
            onChange={onChange}
            min={definition.min}
            max={definition.max}
            step={definition.step}
          />
        </div>
      );

    case 'boolean':
      return (
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={(value as boolean) ?? (definition.defaultValue as boolean) ?? false}
            onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
            style={{ margin: 0 }}
          />
          <label style={{ fontSize: '12px', color: '#333' }}>
            {definition.name}
          </label>
        </div>
      );

    case 'enum':
      return (
        <div style={{ marginBottom: '12px' }}>
          <SelectInput
            label={definition.name}
            value={(value as string) || (definition.defaultValue as string) || ''}
            options={definition.enumValues || []}
            onChange={onChange}
          />
        </div>
      );

    case 'color':
      return (
        <div style={{ marginBottom: '12px' }}>
          <ColorInput
            label={definition.name}
            value={(value as string) || (definition.defaultValue as string) || '#000000'}
            onChange={onChange}
          />
        </div>
      );

    default:
      return (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '11px', color: '#666', fontWeight: 500, marginBottom: '4px', display: 'block' }}>
            {definition.name}
          </label>
          <input
            type="text"
            value={JSON.stringify(value) || ''}
            onChange={(e) => {
              try {
                onChange(JSON.parse((e.target as HTMLInputElement).value));
              } catch {
                onChange((e.target as HTMLInputElement).value);
              }
            }}
            style={{
              width: '100%',
              padding: '6px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          />
        </div>
      );
  }
}

// ============================================================================
// Style Editor Component
// ============================================================================

export function StyleEditor({ store, nodeId, styles, onChange }: StyleEditorProps) {
  const updateStyle = (key: keyof NodeStyles, value: StyleValue | string | number) => {
    onChange({ [key]: value });
  };

  return (
    <div style={{ padding: '12px' }}>
      {/* Layout Section */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 600, color: '#333' }}>
          Layout
        </h4>

        <SelectInput
          label="Display"
          value={(styles.display as string) || 'block'}
          options={['block', 'flex', 'grid', 'inline', 'inline-block', 'none']}
          onChange={(v) => updateStyle('display', v)}
        />

        {styles.display === 'flex' && (
          <>
            <div style={{ marginTop: '12px' }}>
              <SelectInput
                label="Direction"
                value={(styles.flexDirection as string) || 'row'}
                options={['row', 'column', 'row-reverse', 'column-reverse']}
                onChange={(v) => updateStyle('flexDirection', v)}
              />
            </div>
            <div style={{ marginTop: '12px' }}>
              <SelectInput
                label="Justify"
                value={(styles.justifyContent as string) || 'flex-start'}
                options={['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly']}
                onChange={(v) => updateStyle('justifyContent', v)}
              />
            </div>
            <div style={{ marginTop: '12px' }}>
              <SelectInput
                label="Align"
                value={(styles.alignItems as string) || 'stretch'}
                options={['flex-start', 'flex-end', 'center', 'stretch', 'baseline']}
                onChange={(v) => updateStyle('alignItems', v)}
              />
            </div>
            <div style={{ marginTop: '12px' }}>
              <NumberInput
                label="Gap"
                value={getStyleValue(styles.gap)}
                onChange={(v) => updateStyle('gap', { value: v, unit: 'px' })}
                presets={spacingPresets}
              />
            </div>
          </>
        )}
      </div>

      {/* Size Section */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 600, color: '#333' }}>
          Size
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <NumberInput
            label="Width"
            value={getStyleValue(styles.width)}
            onChange={(v) => updateStyle('width', { value: v, unit: getStyleUnit(styles.width) })}
          />
          <NumberInput
            label="Height"
            value={getStyleValue(styles.height)}
            onChange={(v) => updateStyle('height', { value: v, unit: getStyleUnit(styles.height) })}
          />
        </div>
      </div>

      {/* Spacing Section */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 600, color: '#333' }}>
          Spacing
        </h4>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '11px', color: '#666', fontWeight: 500 }}>Padding</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginTop: '4px' }}>
            <NumberInput
              value={getStyleValue(styles.paddingTop)}
              onChange={(v) => updateStyle('paddingTop', { value: v, unit: 'px' })}
            />
            <NumberInput
              value={getStyleValue(styles.paddingRight)}
              onChange={(v) => updateStyle('paddingRight', { value: v, unit: 'px' })}
            />
            <NumberInput
              value={getStyleValue(styles.paddingBottom)}
              onChange={(v) => updateStyle('paddingBottom', { value: v, unit: 'px' })}
            />
            <NumberInput
              value={getStyleValue(styles.paddingLeft)}
              onChange={(v) => updateStyle('paddingLeft', { value: v, unit: 'px' })}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '11px', color: '#666', fontWeight: 500 }}>Margin</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginTop: '4px' }}>
            <NumberInput
              value={getStyleValue(styles.marginTop)}
              onChange={(v) => updateStyle('marginTop', { value: v, unit: 'px' })}
            />
            <NumberInput
              value={getStyleValue(styles.marginRight)}
              onChange={(v) => updateStyle('marginRight', { value: v, unit: 'px' })}
            />
            <NumberInput
              value={getStyleValue(styles.marginBottom)}
              onChange={(v) => updateStyle('marginBottom', { value: v, unit: 'px' })}
            />
            <NumberInput
              value={getStyleValue(styles.marginLeft)}
              onChange={(v) => updateStyle('marginLeft', { value: v, unit: 'px' })}
            />
          </div>
        </div>
      </div>

      {/* Typography Section */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 600, color: '#333' }}>
          Typography
        </h4>

        <NumberInput
          label="Font Size"
          value={getStyleValue(styles.fontSize)}
          onChange={(v) => updateStyle('fontSize', { value: v, unit: 'px' })}
          presets={fontSizePresets}
        />

        <div style={{ marginTop: '12px' }}>
          <SelectInput
            label="Font Weight"
            value={String(styles.fontWeight || 400)}
            options={fontWeightPresets.map((p) => ({ label: p.label, value: String(p.value) }))}
            onChange={(v) => updateStyle('fontWeight', parseInt(v))}
          />
        </div>

        <div style={{ marginTop: '12px' }}>
          <ColorInput
            label="Color"
            value={(styles.color as string) || '#000000'}
            onChange={(v) => updateStyle('color', v)}
          />
        </div>

        <div style={{ marginTop: '12px' }}>
          <SelectInput
            label="Text Align"
            value={(styles.textAlign as string) || 'left'}
            options={['left', 'center', 'right', 'justify']}
            onChange={(v) => updateStyle('textAlign', v)}
          />
        </div>
      </div>

      {/* Background Section */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 600, color: '#333' }}>
          Background
        </h4>

        <ColorInput
          label="Background Color"
          value={(styles.backgroundColor as string) || ''}
          onChange={(v) => updateStyle('backgroundColor', v)}
        />
      </div>

      {/* Border Section */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 600, color: '#333' }}>
          Border
        </h4>

        <NumberInput
          label="Border Radius"
          value={getStyleValue(styles.borderRadius)}
          onChange={(v) => updateStyle('borderRadius', { value: v, unit: 'px' })}
          presets={borderRadiusPresets}
        />

        <div style={{ marginTop: '12px' }}>
          <ColorInput
            label="Border Color"
            value={(styles.borderColor as string) || ''}
            onChange={(v) => updateStyle('borderColor', v)}
          />
        </div>

        <div style={{ marginTop: '12px' }}>
          <NumberInput
            label="Border Width"
            value={getStyleValue(styles.borderWidth)}
            onChange={(v) => updateStyle('borderWidth', { value: v, unit: 'px' })}
          />
        </div>

        <div style={{ marginTop: '12px' }}>
          <SelectInput
            label="Border Style"
            value={(styles.borderStyle as string) || 'none'}
            options={['none', 'solid', 'dashed', 'dotted', 'double']}
            onChange={(v) => updateStyle('borderStyle', v)}
          />
        </div>
      </div>

      {/* Effects Section */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 600, color: '#333' }}>
          Effects
        </h4>

        <NumberInput
          label="Opacity"
          value={(styles.opacity as number) ?? 1}
          onChange={(v) => updateStyle('opacity', v)}
          min={0}
          max={1}
          step={0.1}
          unit=""
        />

        <div style={{ marginTop: '12px' }}>
          <SelectInput
            label="Overflow"
            value={(styles.overflow as string) || 'visible'}
            options={['visible', 'hidden', 'scroll', 'auto']}
            onChange={(v) => updateStyle('overflow', v)}
          />
        </div>

        <div style={{ marginTop: '12px' }}>
          <SelectInput
            label="Cursor"
            value={(styles.cursor as string) || 'default'}
            options={['default', 'pointer', 'text', 'move', 'not-allowed', 'grab', 'grabbing']}
            onChange={(v) => updateStyle('cursor', v)}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Event Editor Component
// ============================================================================

export function EventEditor({ events, onChange }: EventEditorProps) {
  const addEvent = () => {
    onChange([...events, { event: 'onClick', handler: '' }]);
  };

  const updateEvent = (index: number, updates: Partial<EventHandler>) => {
    const newEvents = [...events];
    newEvents[index] = { ...newEvents[index], ...updates };
    onChange(newEvents);
  };

  const removeEvent = (index: number) => {
    onChange(events.filter((_, i) => i !== index));
  };

  const eventTypes = ['onClick', 'onMouseEnter', 'onMouseLeave', 'onFocus', 'onBlur', 'onChange', 'onSubmit', 'onKeyDown', 'onKeyUp'];

  return (
    <div style={{ padding: '12px' }}>
      {events.map((event, index) => (
        <div
          key={index}
          style={{
            marginBottom: '12px',
            padding: '12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <SelectInput
              value={event.event}
              options={eventTypes}
              onChange={(v) => updateEvent(index, { event: v })}
            />
            <button
              onClick={() => removeEvent(index)}
              style={{
                padding: '4px 8px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              x
            </button>
          </div>
          <textarea
            value={event.handler}
            onChange={(e) => updateEvent(index, { handler: (e.target as HTMLTextAreaElement).value })}
            placeholder="// Handler code..."
            style={{
              width: '100%',
              minHeight: '60px',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace',
              resize: 'vertical',
            }}
          />
        </div>
      ))}

      <button
        onClick={addEvent}
        style={{
          width: '100%',
          padding: '8px',
          backgroundColor: '#f0f0f0',
          border: '1px dashed #ccc',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          color: '#666',
        }}
      >
        + Add Event Handler
      </button>
    </div>
  );
}

// ============================================================================
// Main Inspector Component
// ============================================================================

export function Inspector({ store, className, style }: InspectorProps) {
  const activeTab = signal<InspectorTab>('props');

  const selection = store.selection;
  const nodes = store.nodes;
  const components = store.components;

  // Get the selected node
  const selectedNode = memo(() => {
    const sel = selection();
    if (sel.selectedIds.length !== 1) return null;
    return nodes()[sel.selectedIds[0]] || null;
  });

  // Get the component definition for the selected node
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
      payload: {
        nodeId: node.id,
        props: { [key]: value },
      },
    });
  };

  const handleStylesChange = (styles: Partial<NodeStyles>) => {
    const node = selectedNode();
    if (!node) return;

    store.dispatch({
      type: 'UPDATE_NODE_STYLES',
      payload: {
        nodeId: node.id,
        styles,
      },
    });
  };

  const handleEventsChange = (events: EventHandler[]) => {
    const node = selectedNode();
    if (!node) return;

    // Update node with new events
    const currentNodes = nodes();
    store.nodes.set({
      ...currentNodes,
      [node.id]: { ...node, events },
    });
  };

  const node = selectedNode();

  return (
    <div
      class={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#fafafa',
        borderLeft: '1px solid #e0e0e0',
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
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
                borderBottom: '1px solid transparent',
                fontSize: '14px',
                fontWeight: 600,
                color: '#333',
                backgroundColor: 'transparent',
                outline: 'none',
              }}
            />
            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
              {node.type}
            </div>
          </>
        ) : (
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#999' }}>
            No selection
          </h3>
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
            }}
          >
            {(['props', 'styles', 'events', 'advanced'] as InspectorTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => activeTab.set(tab)}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: activeTab() === tab ? '#0066ff' : '#666',
                  borderBottom: activeTab() === tab ? '2px solid #0066ff' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {activeTab() === 'props' && (
              <div style={{ padding: '12px' }}>
                {componentDef()?.props?.map((prop) => (
                  <PropertyEditor
                    key={prop.name}
                    definition={prop}
                    value={node.props[prop.name]}
                    onChange={(v) => handlePropsChange(prop.name, v)}
                  />
                ))}

                {(!componentDef()?.props || componentDef()?.props.length === 0) && (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
                    No configurable properties
                  </div>
                )}
              </div>
            )}

            {activeTab() === 'styles' && (
              <StyleEditor
                store={store}
                nodeId={node.id}
                styles={node.styles}
                onChange={handleStylesChange}
              />
            )}

            {activeTab() === 'events' && (
              <EventEditor
                events={node.events}
                onChange={handleEventsChange}
              />
            )}

            {activeTab() === 'advanced' && (
              <div style={{ padding: '12px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', color: '#666', fontWeight: 500, marginBottom: '4px', display: 'block' }}>
                    Node ID
                  </label>
                  <input
                    type="text"
                    value={node.id}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: '#f5f5f5',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={node.isLocked || false}
                    onChange={(e) => {
                      const currentNodes = nodes();
                      store.nodes.set({
                        ...currentNodes,
                        [node.id]: { ...node, isLocked: (e.target as HTMLInputElement).checked },
                      });
                    }}
                    style={{ margin: 0 }}
                  />
                  <label style={{ fontSize: '12px', color: '#333' }}>
                    Locked
                  </label>
                </div>

                <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={node.isHidden || false}
                    onChange={(e) => {
                      const currentNodes = nodes();
                      store.nodes.set({
                        ...currentNodes,
                        [node.id]: { ...node, isHidden: (e.target as HTMLInputElement).checked },
                      });
                    }}
                    style={{ margin: 0 }}
                  />
                  <label style={{ fontSize: '12px', color: '#333' }}>
                    Hidden
                  </label>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {!node && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#999', fontSize: '13px' }}>
            <p>Select an element to</p>
            <p>inspect its properties</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inspector;

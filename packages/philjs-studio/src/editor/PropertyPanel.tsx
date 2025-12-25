import React, { useState, useCallback, useMemo } from 'react';
import { useEditorStore, useSelectedComponents } from '../state/EditorStore';
import type {
  ComponentNode,
  ComponentStyle,
  Breakpoint,
  EventHandler,
  SpacingValue
} from '../state/EditorStore';

// ============================================================================
// Types
// ============================================================================

export interface PropertyPanelProps {
  className?: string;
  style?: React.CSSProperties;
}

type PropertyTab = 'props' | 'style' | 'events' | 'responsive';

interface PropertyDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'color' | 'select' | 'boolean' | 'spacing' | 'textarea';
  options?: { value: string | number; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

// ============================================================================
// Property Definitions by Component Type
// ============================================================================

const commonProps: PropertyDefinition[] = [
  { key: 'className', label: 'Class Name', type: 'text', placeholder: 'custom-class' },
  { key: 'id', label: 'ID', type: 'text', placeholder: 'element-id' },
];

const componentPropertyDefinitions: Record<string, PropertyDefinition[]> = {
  Button: [
    { key: 'children', label: 'Label', type: 'text' },
    {
      key: 'variant',
      label: 'Variant',
      type: 'select',
      options: [
        { value: 'primary', label: 'Primary' },
        { value: 'secondary', label: 'Secondary' },
        { value: 'outline', label: 'Outline' },
        { value: 'ghost', label: 'Ghost' },
        { value: 'destructive', label: 'Destructive' },
      ],
    },
    {
      key: 'size',
      label: 'Size',
      type: 'select',
      options: [
        { value: 'sm', label: 'Small' },
        { value: 'md', label: 'Medium' },
        { value: 'lg', label: 'Large' },
      ],
    },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  Text: [
    { key: 'children', label: 'Content', type: 'textarea' },
  ],
  Heading: [
    { key: 'children', label: 'Content', type: 'text' },
    {
      key: 'level',
      label: 'Level',
      type: 'select',
      options: [
        { value: 1, label: 'H1' },
        { value: 2, label: 'H2' },
        { value: 3, label: 'H3' },
        { value: 4, label: 'H4' },
        { value: 5, label: 'H5' },
        { value: 6, label: 'H6' },
      ],
    },
  ],
  Input: [
    { key: 'placeholder', label: 'Placeholder', type: 'text' },
    { key: 'defaultValue', label: 'Default Value', type: 'text' },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'text', label: 'Text' },
        { value: 'email', label: 'Email' },
        { value: 'password', label: 'Password' },
        { value: 'number', label: 'Number' },
        { value: 'tel', label: 'Phone' },
        { value: 'url', label: 'URL' },
      ],
    },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    { key: 'required', label: 'Required', type: 'boolean' },
  ],
  Image: [
    { key: 'src', label: 'Source URL', type: 'text', placeholder: 'https://...' },
    { key: 'alt', label: 'Alt Text', type: 'text' },
    {
      key: 'objectFit',
      label: 'Object Fit',
      type: 'select',
      options: [
        { value: 'cover', label: 'Cover' },
        { value: 'contain', label: 'Contain' },
        { value: 'fill', label: 'Fill' },
        { value: 'none', label: 'None' },
      ],
    },
  ],
  Card: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
  Container: [
    { key: 'as', label: 'HTML Tag', type: 'select', options: [
      { value: 'div', label: 'div' },
      { value: 'section', label: 'section' },
      { value: 'article', label: 'article' },
      { value: 'main', label: 'main' },
      { value: 'aside', label: 'aside' },
      { value: 'header', label: 'header' },
      { value: 'footer', label: 'footer' },
    ]},
  ],
  Link: [
    { key: 'href', label: 'URL', type: 'text', placeholder: 'https://...' },
    { key: 'children', label: 'Label', type: 'text' },
    { key: 'target', label: 'Target', type: 'select', options: [
      { value: '_self', label: 'Same Window' },
      { value: '_blank', label: 'New Tab' },
    ]},
  ],
};

const styleProperties: PropertyDefinition[] = [
  // Size
  { key: 'width', label: 'Width', type: 'text', placeholder: 'auto' },
  { key: 'height', label: 'Height', type: 'text', placeholder: 'auto' },
  { key: 'minWidth', label: 'Min Width', type: 'text' },
  { key: 'maxWidth', label: 'Max Width', type: 'text' },
  { key: 'minHeight', label: 'Min Height', type: 'text' },
  { key: 'maxHeight', label: 'Max Height', type: 'text' },
];

const layoutProperties: PropertyDefinition[] = [
  { key: 'display', label: 'Display', type: 'select', options: [
    { value: 'block', label: 'Block' },
    { value: 'flex', label: 'Flex' },
    { value: 'grid', label: 'Grid' },
    { value: 'inline', label: 'Inline' },
    { value: 'inline-flex', label: 'Inline Flex' },
    { value: 'none', label: 'None' },
  ]},
  { key: 'flexDirection', label: 'Direction', type: 'select', options: [
    { value: 'row', label: 'Row' },
    { value: 'column', label: 'Column' },
    { value: 'row-reverse', label: 'Row Reverse' },
    { value: 'column-reverse', label: 'Column Reverse' },
  ]},
  { key: 'justifyContent', label: 'Justify', type: 'select', options: [
    { value: 'flex-start', label: 'Start' },
    { value: 'center', label: 'Center' },
    { value: 'flex-end', label: 'End' },
    { value: 'space-between', label: 'Space Between' },
    { value: 'space-around', label: 'Space Around' },
    { value: 'space-evenly', label: 'Space Evenly' },
  ]},
  { key: 'alignItems', label: 'Align', type: 'select', options: [
    { value: 'flex-start', label: 'Start' },
    { value: 'center', label: 'Center' },
    { value: 'flex-end', label: 'End' },
    { value: 'stretch', label: 'Stretch' },
    { value: 'baseline', label: 'Baseline' },
  ]},
  { key: 'gap', label: 'Gap', type: 'text', placeholder: '0' },
];

// ============================================================================
// Sub-components
// ============================================================================

interface PropertyInputProps {
  definition: PropertyDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

const PropertyInput: React.FC<PropertyInputProps> = ({ definition, value, onChange }) => {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #D1D5DB',
    borderRadius: 4,
    fontSize: 13,
    backgroundColor: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  };

  switch (definition.type) {
    case 'text':
      return (
        <input
          type="text"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={definition.placeholder}
          style={inputStyle}
        />
      );

    case 'textarea':
      return (
        <textarea
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={definition.placeholder}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={(value as number) ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          min={definition.min}
          max={definition.max}
          step={definition.step}
          placeholder={definition.placeholder}
          style={inputStyle}
        />
      );

    case 'color':
      return (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="color"
            value={(value as string) || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            style={{ width: 36, height: 32, padding: 2, border: '1px solid #D1D5DB', borderRadius: 4 }}
          />
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            style={{ ...inputStyle, flex: 1 }}
          />
        </div>
      );

    case 'select':
      return (
        <select
          value={(value as string | number) ?? ''}
          onChange={(e) => {
            const selectedOption = definition.options?.find(
              (opt) => String(opt.value) === e.target.value
            );
            onChange(selectedOption?.value ?? e.target.value);
          }}
          style={inputStyle}
        >
          <option value="">Select...</option>
          {definition.options?.map((opt) => (
            <option key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case 'boolean':
      return (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          <span style={{ fontSize: 13, color: '#374151' }}>
            {value ? 'Yes' : 'No'}
          </span>
        </label>
      );

    default:
      return null;
  }
};

interface SpacingEditorProps {
  label: string;
  value: SpacingValue | number | string | undefined;
  onChange: (value: SpacingValue) => void;
}

const SpacingEditor: React.FC<SpacingEditorProps> = ({ label, value, onChange }) => {
  const spacingValue: SpacingValue = useMemo(() => {
    if (typeof value === 'number') {
      return { top: value, right: value, bottom: value, left: value };
    }
    if (typeof value === 'object' && value !== null) {
      return value as SpacingValue;
    }
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }, [value]);

  const handleChange = useCallback(
    (side: keyof SpacingValue, newValue: number) => {
      onChange({ ...spacingValue, [side]: newValue });
    },
    [spacingValue, onChange]
  );

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '4px 6px',
    border: '1px solid #D1D5DB',
    borderRadius: 4,
    fontSize: 12,
    textAlign: 'center',
    outline: 'none',
  };

  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 8, display: 'block' }}>
        {label}
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, maxWidth: 120, margin: '0 auto' }}>
        <div />
        <input
          type="number"
          value={spacingValue.top}
          onChange={(e) => handleChange('top', Number(e.target.value))}
          style={inputStyle}
          placeholder="T"
        />
        <div />
        <input
          type="number"
          value={spacingValue.left}
          onChange={(e) => handleChange('left', Number(e.target.value))}
          style={inputStyle}
          placeholder="L"
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#9CA3AF" strokeWidth="1">
            <rect x="4" y="4" width="12" height="12" rx="2" />
          </svg>
        </div>
        <input
          type="number"
          value={spacingValue.right}
          onChange={(e) => handleChange('right', Number(e.target.value))}
          style={inputStyle}
          placeholder="R"
        />
        <div />
        <input
          type="number"
          value={spacingValue.bottom}
          onChange={(e) => handleChange('bottom', Number(e.target.value))}
          style={inputStyle}
          placeholder="B"
        />
        <div />
      </div>
    </div>
  );
};

interface PropertySectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const PropertySection: React.FC<PropertySectionProps> = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{ borderBottom: '1px solid #E5E7EB' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 600,
          color: '#374151',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        <span>{title}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="2,4 6,8 10,4" />
        </svg>
      </button>
      {isOpen && (
        <div style={{ padding: '0 16px 16px' }}>
          {children}
        </div>
      )}
    </div>
  );
};

interface EventEditorProps {
  events: EventHandler[];
  onAdd: (handler: EventHandler) => void;
  onUpdate: (index: number, handler: EventHandler) => void;
  onRemove: (index: number) => void;
}

const EventEditor: React.FC<EventEditorProps> = ({ events, onAdd, onUpdate, onRemove }) => {
  const eventTypes = ['onClick', 'onDoubleClick', 'onMouseEnter', 'onMouseLeave', 'onFocus', 'onBlur', 'onChange', 'onSubmit'];
  const actionTypes = ['navigate', 'custom', 'setState', 'submit'];

  const handleAddEvent = useCallback(() => {
    onAdd({
      event: 'onClick',
      action: 'custom',
      config: {},
    });
  }, [onAdd]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {events.map((handler, index) => (
        <div
          key={index}
          style={{
            padding: 12,
            backgroundColor: '#F9FAFB',
            borderRadius: 8,
            border: '1px solid #E5E7EB',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>
              Event {index + 1}
            </span>
            <button
              onClick={() => onRemove(index)}
              style={{
                padding: '2px 6px',
                border: 'none',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                borderRadius: 4,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Remove
            </button>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>
                Event Type
              </label>
              <select
                value={handler.event}
                onChange={(e) => onUpdate(index, { ...handler, event: e.target.value })}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 4,
                  fontSize: 12,
                }}
              >
                {eventTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>
                Action
              </label>
              <select
                value={handler.action}
                onChange={(e) => onUpdate(index, { ...handler, action: e.target.value as EventHandler['action'] })}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 4,
                  fontSize: 12,
                }}
              >
                {actionTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {handler.action === 'navigate' && (
              <div>
                <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>
                  URL
                </label>
                <input
                  type="text"
                  value={(handler.config.url as string) || ''}
                  onChange={(e) => onUpdate(index, {
                    ...handler,
                    config: { ...handler.config, url: e.target.value }
                  })}
                  placeholder="/path or https://..."
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 4,
                    fontSize: 12,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {handler.action === 'custom' && (
              <div>
                <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>
                  Handler Code
                </label>
                <textarea
                  value={(handler.config.code as string) || ''}
                  onChange={(e) => onUpdate(index, {
                    ...handler,
                    config: { ...handler.config, code: e.target.value }
                  })}
                  placeholder="console.log('clicked')"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 4,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ))}

      <button
        onClick={handleAddEvent}
        style={{
          padding: '8px 12px',
          border: '1px dashed #D1D5DB',
          backgroundColor: 'transparent',
          borderRadius: 6,
          fontSize: 13,
          color: '#6B7280',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="7" y1="2" x2="7" y2="12" />
          <line x1="2" y1="7" x2="12" y2="7" />
        </svg>
        Add Event Handler
      </button>
    </div>
  );
};

// ============================================================================
// Breakpoint Selector
// ============================================================================

interface BreakpointSelectorProps {
  activeBreakpoint: Breakpoint;
  onChange: (breakpoint: Breakpoint) => void;
}

const BreakpointSelector: React.FC<BreakpointSelectorProps> = ({ activeBreakpoint, onChange }) => {
  const breakpoints: { value: Breakpoint; label: string; icon: React.ReactNode; width: string }[] = [
    { value: 'base', label: 'Base', icon: <MobileIcon />, width: 'All' },
    { value: 'sm', label: 'Small', icon: <MobileIcon />, width: '640px' },
    { value: 'md', label: 'Medium', icon: <TabletIcon />, width: '768px' },
    { value: 'lg', label: 'Large', icon: <DesktopIcon />, width: '1024px' },
    { value: 'xl', label: 'XL', icon: <DesktopIcon />, width: '1280px' },
  ];

  return (
    <div style={{ display: 'flex', gap: 4, padding: '8px 16px', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
      {breakpoints.map(({ value, label, icon, width }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          title={`${label} (${width})`}
          style={{
            flex: 1,
            padding: '8px 4px',
            border: activeBreakpoint === value ? '1px solid #3B82F6' : '1px solid transparent',
            backgroundColor: activeBreakpoint === value ? '#EFF6FF' : 'transparent',
            borderRadius: 6,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            color: activeBreakpoint === value ? '#3B82F6' : '#6B7280',
          }}
        >
          {icon}
          <span style={{ fontSize: 10 }}>{label}</span>
        </button>
      ))}
    </div>
  );
};

function MobileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="2" width="8" height="12" rx="1" />
      <line x1="7" y1="11" x2="9" y2="11" />
    </svg>
  );
}

function TabletIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="10" rx="1" />
      <line x1="7" y1="10" x2="9" y2="10" />
    </svg>
  );
}

function DesktopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="2" width="14" height="9" rx="1" />
      <line x1="5" y1="14" x2="11" y2="14" />
      <line x1="8" y1="11" x2="8" y2="14" />
    </svg>
  );
}

// ============================================================================
// Main Property Panel
// ============================================================================

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ className, style }) => {
  const [activeTab, setActiveTab] = useState<PropertyTab>('props');

  const selectedComponents = useSelectedComponents();
  const activeBreakpoint = useEditorStore((state) => state.activeBreakpoint);

  const {
    updateProps,
    updateStyles,
    updateComponent,
    addEventHandler,
    updateEventHandler,
    removeEventHandler,
    setActiveBreakpoint,
  } = useEditorStore();

  const selectedComponent = selectedComponents[0];

  const handlePropsChange = useCallback(
    (key: string, value: unknown) => {
      if (selectedComponent) {
        updateProps(selectedComponent.id, { [key]: value });
      }
    },
    [selectedComponent, updateProps]
  );

  const handleStyleChange = useCallback(
    (key: string, value: unknown) => {
      if (selectedComponent) {
        updateStyles(selectedComponent.id, { [key]: value }, activeBreakpoint);
      }
    },
    [selectedComponent, activeBreakpoint, updateStyles]
  );

  const handleNameChange = useCallback(
    (name: string) => {
      if (selectedComponent) {
        updateComponent(selectedComponent.id, { name });
      }
    },
    [selectedComponent, updateComponent]
  );

  const handleAddEvent = useCallback(
    (handler: EventHandler) => {
      if (selectedComponent) {
        addEventHandler(selectedComponent.id, handler);
      }
    },
    [selectedComponent, addEventHandler]
  );

  const handleUpdateEvent = useCallback(
    (index: number, handler: EventHandler) => {
      if (selectedComponent) {
        updateEventHandler(selectedComponent.id, index, handler);
      }
    },
    [selectedComponent, updateEventHandler]
  );

  const handleRemoveEvent = useCallback(
    (index: number) => {
      if (selectedComponent) {
        removeEventHandler(selectedComponent.id, index);
      }
    },
    [selectedComponent, removeEventHandler]
  );

  const propertyDefinitions = useMemo(() => {
    if (!selectedComponent) return [];
    return [
      ...commonProps,
      ...(componentPropertyDefinitions[selectedComponent.type] || []),
    ];
  }, [selectedComponent]);

  const currentStyles = useMemo(() => {
    if (!selectedComponent) return {};
    return selectedComponent.styles[activeBreakpoint] || selectedComponent.styles.base || {};
  }, [selectedComponent, activeBreakpoint]);

  if (!selectedComponent) {
    return (
      <div
        className={`property-panel ${className || ''}`}
        style={{
          width: 280,
          height: '100%',
          backgroundColor: '#fff',
          borderLeft: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
      >
        <div style={{ textAlign: 'center', padding: 24, color: '#9CA3AF' }}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ margin: '0 auto 16px', opacity: 0.5 }}
          >
            <rect x="6" y="6" width="36" height="36" rx="4" />
            <line x1="6" y1="18" x2="42" y2="18" />
            <line x1="18" y1="18" x2="18" y2="42" />
          </svg>
          <p style={{ fontSize: 14, margin: 0 }}>Select a component to edit its properties</p>
        </div>
      </div>
    );
  }

  const tabs: { key: PropertyTab; label: string }[] = [
    { key: 'props', label: 'Properties' },
    { key: 'style', label: 'Style' },
    { key: 'events', label: 'Events' },
  ];

  return (
    <div
      className={`property-panel ${className || ''}`}
      style={{
        width: 280,
        height: '100%',
        backgroundColor: '#fff',
        borderLeft: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Header */}
      <div style={{ padding: 16, borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              backgroundColor: '#EFF6FF',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: '#3B82F6' }}>
              {selectedComponent.type.charAt(0)}
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={selectedComponent.name}
              onChange={(e) => handleNameChange(e.target.value)}
              style={{
                width: '100%',
                padding: '4px 8px',
                border: '1px solid transparent',
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 500,
                backgroundColor: 'transparent',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3B82F6';
                e.target.style.backgroundColor = '#fff';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'transparent';
                e.target.style.backgroundColor = 'transparent';
              }}
            />
            <div style={{ fontSize: 11, color: '#9CA3AF', paddingLeft: 8 }}>
              {selectedComponent.type}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, backgroundColor: '#F3F4F6', borderRadius: 6, padding: 2 }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '6px 8px',
                border: 'none',
                backgroundColor: activeTab === tab.key ? '#fff' : 'transparent',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 500,
                color: activeTab === tab.key ? '#111827' : '#6B7280',
                cursor: 'pointer',
                boxShadow: activeTab === tab.key ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive breakpoints (for style tab) */}
      {activeTab === 'style' && (
        <BreakpointSelector
          activeBreakpoint={activeBreakpoint}
          onChange={setActiveBreakpoint}
        />
      )}

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'props' && (
          <>
            <PropertySection title="Component Properties">
              <div style={{ display: 'grid', gap: 12 }}>
                {propertyDefinitions.map((def) => (
                  <div key={def.key}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#374151',
                        marginBottom: 6,
                      }}
                    >
                      {def.label}
                    </label>
                    <PropertyInput
                      definition={def}
                      value={selectedComponent.props[def.key]}
                      onChange={(value) => handlePropsChange(def.key, value)}
                    />
                  </div>
                ))}
              </div>
            </PropertySection>
          </>
        )}

        {activeTab === 'style' && (
          <>
            <PropertySection title="Size">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {styleProperties.map((def) => (
                  <div key={def.key}>
                    <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                      {def.label}
                    </label>
                    <PropertyInput
                      definition={def}
                      value={currentStyles[def.key as keyof ComponentStyle]}
                      onChange={(value) => handleStyleChange(def.key, value)}
                    />
                  </div>
                ))}
              </div>
            </PropertySection>

            <PropertySection title="Layout">
              <div style={{ display: 'grid', gap: 12 }}>
                {layoutProperties.map((def) => (
                  <div key={def.key}>
                    <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                      {def.label}
                    </label>
                    <PropertyInput
                      definition={def}
                      value={currentStyles[def.key as keyof ComponentStyle]}
                      onChange={(value) => handleStyleChange(def.key, value)}
                    />
                  </div>
                ))}
              </div>
            </PropertySection>

            <PropertySection title="Spacing">
              <div style={{ display: 'grid', gap: 16 }}>
                <SpacingEditor
                  label="Padding"
                  value={currentStyles.padding}
                  onChange={(value) => handleStyleChange('padding', value)}
                />
                <SpacingEditor
                  label="Margin"
                  value={currentStyles.margin}
                  onChange={(value) => handleStyleChange('margin', value)}
                />
              </div>
            </PropertySection>

            <PropertySection title="Colors">
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                    Background
                  </label>
                  <PropertyInput
                    definition={{ key: 'backgroundColor', label: 'Background', type: 'color' }}
                    value={currentStyles.backgroundColor}
                    onChange={(value) => handleStyleChange('backgroundColor', value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                    Text Color
                  </label>
                  <PropertyInput
                    definition={{ key: 'color', label: 'Color', type: 'color' }}
                    value={currentStyles.color}
                    onChange={(value) => handleStyleChange('color', value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                    Border Color
                  </label>
                  <PropertyInput
                    definition={{ key: 'borderColor', label: 'Border', type: 'color' }}
                    value={currentStyles.borderColor}
                    onChange={(value) => handleStyleChange('borderColor', value)}
                  />
                </div>
              </div>
            </PropertySection>

            <PropertySection title="Border">
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                    Border Width
                  </label>
                  <PropertyInput
                    definition={{ key: 'borderWidth', label: 'Width', type: 'text', placeholder: '0' }}
                    value={currentStyles.borderWidth}
                    onChange={(value) => handleStyleChange('borderWidth', value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                    Border Radius
                  </label>
                  <PropertyInput
                    definition={{ key: 'borderRadius', label: 'Radius', type: 'text', placeholder: '0' }}
                    value={currentStyles.borderRadius}
                    onChange={(value) => handleStyleChange('borderRadius', value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                    Border Style
                  </label>
                  <PropertyInput
                    definition={{
                      key: 'borderStyle',
                      label: 'Style',
                      type: 'select',
                      options: [
                        { value: 'solid', label: 'Solid' },
                        { value: 'dashed', label: 'Dashed' },
                        { value: 'dotted', label: 'Dotted' },
                        { value: 'none', label: 'None' },
                      ],
                    }}
                    value={currentStyles.borderStyle}
                    onChange={(value) => handleStyleChange('borderStyle', value)}
                  />
                </div>
              </div>
            </PropertySection>

            <PropertySection title="Effects">
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                    Opacity
                  </label>
                  <PropertyInput
                    definition={{ key: 'opacity', label: 'Opacity', type: 'number', min: 0, max: 1, step: 0.1 }}
                    value={currentStyles.opacity}
                    onChange={(value) => handleStyleChange('opacity', value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                    Box Shadow
                  </label>
                  <PropertyInput
                    definition={{ key: 'boxShadow', label: 'Shadow', type: 'text', placeholder: '0 2px 4px rgba(0,0,0,0.1)' }}
                    value={currentStyles.boxShadow}
                    onChange={(value) => handleStyleChange('boxShadow', value)}
                  />
                </div>
              </div>
            </PropertySection>
          </>
        )}

        {activeTab === 'events' && (
          <PropertySection title="Event Handlers">
            <EventEditor
              events={selectedComponent.events}
              onAdd={handleAddEvent}
              onUpdate={handleUpdateEvent}
              onRemove={handleRemoveEvent}
            />
          </PropertySection>
        )}
      </div>
    </div>
  );
};

export default PropertyPanel;

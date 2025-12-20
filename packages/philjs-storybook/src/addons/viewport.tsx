/**
 * Viewport Helper Addon
 *
 * Test responsive designs with preset viewport sizes
 */

import { signal } from 'philjs-core';
import { useEffect } from 'philjs-core';

const ADDON_ID = 'philjs/viewport';
const TOOLBAR_ID = `${ADDON_ID}/toolbar`;

export interface ViewportConfig {
  name: string;
  width: number;
  height: number;
  type: 'mobile' | 'tablet' | 'desktop' | 'custom';
}

const currentViewport$ = signal<ViewportConfig | null>(null);

export const defaultViewports: ViewportConfig[] = [
  { name: 'iPhone 12', width: 390, height: 844, type: 'mobile' },
  { name: 'iPhone 12 Pro Max', width: 428, height: 926, type: 'mobile' },
  { name: 'Samsung Galaxy S21', width: 360, height: 800, type: 'mobile' },
  { name: 'iPad', width: 768, height: 1024, type: 'tablet' },
  { name: 'iPad Pro', width: 1024, height: 1366, type: 'tablet' },
  { name: 'Laptop', width: 1366, height: 768, type: 'desktop' },
  { name: 'Desktop', width: 1920, height: 1080, type: 'desktop' },
  { name: '4K', width: 3840, height: 2160, type: 'desktop' },
];

/**
 * Set the viewport
 */
export function setViewport(viewport: ViewportConfig | null) {
  currentViewport$.set(viewport);
  applyViewport(viewport);
}

/**
 * Get the current viewport
 */
export function getViewport(): ViewportConfig | null {
  return currentViewport$();
}

/**
 * Apply viewport to iframe
 */
function applyViewport(viewport: ViewportConfig | null) {
  const iframe = document.querySelector('iframe#storybook-preview-iframe') as HTMLIFrameElement;
  if (!iframe) return;

  if (viewport) {
    iframe.style.width = `${viewport.width}px`;
    iframe.style.height = `${viewport.height}px`;
    iframe.style.margin = '0 auto';
  } else {
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.margin = '0';
  }
}

/**
 * Viewport Toolbar Component
 */
export function ViewportToolbar() {
  const customWidth$ = signal<number>(375);
  const customHeight$ = signal<number>(667);

  const handleViewportChange = (e: any) => {
    const value = e.target.value;
    if (value === 'reset') {
      setViewport(null);
    } else if (value === 'custom') {
      setViewport({
        name: 'Custom',
        width: customWidth$(),
        height: customHeight$(),
        type: 'custom',
      });
    } else {
      const viewport = defaultViewports[parseInt(value)];
      setViewport(viewport);
    }
  };

  const handleRotate = () => {
    const current = currentViewport$();
    if (current) {
      setViewport({
        ...current,
        width: current.height,
        height: current.width,
      });
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Viewport:</label>
      <select
        onChange={handleViewportChange}
        style={{
          padding: '4px 8px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '12px',
        }}
      >
        <option value="reset">Full Width</option>
        {defaultViewports.map((viewport, index) => (
          <option key={index} value={index}>
            {viewport.name} ({viewport.width}x{viewport.height})
          </option>
        ))}
        <option value="custom">Custom</option>
      </select>

      {currentViewport$() && (
        <button
          onClick={handleRotate}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Rotate
        </button>
      )}
    </div>
  );
}

/**
 * Viewport Panel Component
 */
export function ViewportPanel() {
  const customWidth$ = signal<number>(375);
  const customHeight$ = signal<number>(667);
  const customName$ = signal<string>('Custom Viewport');

  const handleApplyCustom = () => {
    setViewport({
      name: customName$(),
      width: customWidth$(),
      height: customHeight$(),
      type: 'custom',
    });
  };

  return (
    <div style={{ padding: '16px', fontFamily: 'sans-serif' }}>
      <h2>Viewport Helper</h2>

      <div style={{ marginBottom: '24px' }}>
        <h3>Current Viewport</h3>
        {currentViewport$() ? (
          <div>
            <p>
              <strong>Name:</strong> {currentViewport$()!.name}
            </p>
            <p>
              <strong>Size:</strong> {currentViewport$()!.width}x{currentViewport$()!.height}
            </p>
            <p>
              <strong>Type:</strong> {currentViewport$()!.type}
            </p>
            <button
              onClick={() => setViewport(null)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          </div>
        ) : (
          <p>Full width</p>
        )}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3>Preset Viewports</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {defaultViewports.map((viewport, index) => (
            <button
              key={index}
              onClick={() => setViewport(viewport)}
              style={{
                padding: '12px',
                backgroundColor:
                  currentViewport$()?.name === viewport.name ? '#1976d2' : '#f5f5f5',
                color: currentViewport$()?.name === viewport.name ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{viewport.name}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                {viewport.width}x{viewport.height}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3>Custom Viewport</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="text"
            value={customName$()}
            onInput={(e: any) => customName$.set(e.target.value)}
            placeholder="Viewport name"
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="number"
              value={customWidth$()}
              onInput={(e: any) => customWidth$.set(parseInt(e.target.value))}
              placeholder="Width"
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
            <input
              type="number"
              value={customHeight$()}
              onInput={(e: any) => customHeight$.set(parseInt(e.target.value))}
              placeholder="Height"
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
          </div>
          <button
            onClick={handleApplyCustom}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Apply Custom Viewport
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Addon registration
 */
export const viewportAddon = {
  id: ADDON_ID,
  title: 'Viewport',
  type: 'panel',
  toolbar: ViewportToolbar,
  render: () => <ViewportPanel />,
};

export default viewportAddon;

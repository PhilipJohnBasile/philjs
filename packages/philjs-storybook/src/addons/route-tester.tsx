/**
 * Route Tester Addon
 *
 * Test PhilJS routes in isolation with mock loaders and actions
 */

import { signal } from 'philjs-core';
import { useEffect } from 'philjs-core';

const ADDON_ID = 'philjs/route-tester';
const PANEL_ID = `${ADDON_ID}/panel`;

interface RouteTest {
  path: string;
  params: Record<string, string>;
  searchParams: Record<string, string>;
  loaderData?: any;
  actionData?: any;
}

const currentRoute$ = signal<RouteTest>({
  path: '/',
  params: {},
  searchParams: {},
});

const routeHistory$ = signal<RouteTest[]>([]);

/**
 * Set current route for testing
 */
export function setTestRoute(route: Partial<RouteTest>) {
  const current = currentRoute$();
  const newRoute = { ...current, ...route };
  currentRoute$.set(newRoute);
  routeHistory$.set([...routeHistory$(), newRoute]);
}

/**
 * Get current test route
 */
export function getTestRoute(): RouteTest {
  return currentRoute$();
}

/**
 * Route Tester Panel Component
 */
export function RouteTesterPanel() {
  const path$ = signal<string>('/');
  const params$ = signal<string>('{}');
  const searchParams$ = signal<string>('{}');
  const loaderData$ = signal<string>('{}');
  const actionData$ = signal<string>('{}');

  const handleNavigate = () => {
    try {
      setTestRoute({
        path: path$(),
        params: JSON.parse(params$()),
        searchParams: JSON.parse(searchParams$()),
        loaderData: JSON.parse(loaderData$()),
        actionData: JSON.parse(actionData$()),
      });
    } catch (err) {
      console.error('Invalid JSON:', err);
    }
  };

  const handleClearHistory = () => {
    routeHistory$.set([]);
  };

  return (
    <div style={{ padding: '16px', fontFamily: 'sans-serif' }}>
      <h2>Route Tester</h2>

      <div style={{ marginBottom: '16px' }}>
        <h3>Current Route</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
              Path
            </label>
            <input
              type="text"
              value={path$()}
              onInput={(e: any) => path$.set(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
              placeholder="/users/[id]"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
              Params (JSON)
            </label>
            <textarea
              value={params$()}
              onInput={(e: any) => params$.set(e.target.value)}
              style={{
                width: '100%',
                height: '60px',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px',
              }}
              placeholder='{"id": "123"}'
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
              Search Params (JSON)
            </label>
            <textarea
              value={searchParams$()}
              onInput={(e: any) => searchParams$.set(e.target.value)}
              style={{
                width: '100%',
                height: '60px',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px',
              }}
              placeholder='{"page": "1", "sort": "name"}'
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
              Loader Data (JSON)
            </label>
            <textarea
              value={loaderData$()}
              onInput={(e: any) => loaderData$.set(e.target.value)}
              style={{
                width: '100%',
                height: '100px',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px',
              }}
              placeholder='{"user": {"id": 1, "name": "John"}}'
            />
          </div>

          <button
            onClick={handleNavigate}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Navigate
          </button>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Route History ({routeHistory$().length})</h3>
          <button
            onClick={handleClearHistory}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {routeHistory$().map((route, index) => (
            <div
              key={index}
              style={{
                padding: '8px',
                backgroundColor: '#f5f5f5',
                marginBottom: '8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
            >
              <div>
                <strong>Path:</strong> {route.path}
              </div>
              {Object.keys(route.params).length > 0 && (
                <div>
                  <strong>Params:</strong> {JSON.stringify(route.params)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Addon registration
 */
export const routeTesterAddon = {
  id: ADDON_ID,
  title: 'Route Tester',
  type: 'panel',
  render: () => <RouteTesterPanel />,
};

export default routeTesterAddon;

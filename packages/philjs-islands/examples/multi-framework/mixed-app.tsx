/**
 * Mixed Framework Application Example
 * Demonstrates using multiple frameworks on the same page
 */

import { Island, registerIslandComponent, createSharedState, eventBus } from 'philjs-islands';

// Register components from different frameworks
registerIslandComponent('react', 'Counter', () => import('./react-counter.js'));
registerIslandComponent('vue', 'TodoList', () => import('./vue-todo.vue'));
registerIslandComponent('svelte', 'Timer', () => import('./svelte-timer.svelte'));

// Create shared state accessible across all frameworks
const globalState = createSharedState('app', {
  theme: 'light',
  user: { name: 'Guest' },
  notifications: [] as string[]
});

// Event bus for cross-framework communication
eventBus.on('counter-changed', (data: { value: number }) => {
  console.log('Counter changed:', data.value);
  globalState.updateState({
    notifications: [...globalState.getState().notifications, `Counter: ${data.value}`]
  });
});

/**
 * Main application page with multi-framework islands
 */
export default function App() {
  return (
    <div className="app-container">
      <header style={{
        padding: '20px',
        backgroundColor: '#333',
        color: 'white',
        marginBottom: '20px'
      }}>
        <h1>PhilJS Multi-Framework Islands Demo</h1>
        <p>React, Vue, and Svelte components working together on one page!</p>
      </header>

      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        display: 'grid',
        gap: '20px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
      }}>
        {/* React Island - Immediate hydration */}
        <Island
          framework="react"
          component="Counter"
          props={{ initial: 0, step: 1, label: 'Clicks' }}
          hydration={{ strategy: 'immediate' }}
        />

        {/* Vue Island - Visible hydration */}
        <Island
          framework="vue"
          component="TodoList"
          props={{ initialTodos: ['Learn PhilJS', 'Build Islands', 'Deploy'] }}
          hydration={{ strategy: 'visible', rootMargin: '50px' }}
        />

        {/* Svelte Island - Idle hydration */}
        <Island
          framework="svelte"
          component="Timer"
          props={{ autoStart: false, label: 'Session Timer' }}
          hydration={{ strategy: 'idle', timeout: 2000 }}
        />

        {/* Another React Island - Interaction hydration */}
        <Island
          framework="react"
          component="Counter"
          props={{ initial: 100, step: 10, label: 'Score' }}
          hydration={{
            strategy: 'interaction',
            events: ['mouseenter', 'click']
          }}
        />
      </main>

      <section style={{
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '20px',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px'
      }}>
        <h2>Shared State Demo</h2>
        <p>All islands can access and modify shared application state:</p>
        <pre style={{
          padding: '15px',
          backgroundColor: '#282c34',
          color: '#61dafb',
          borderRadius: '4px',
          overflow: 'auto'
        }}>
          {JSON.stringify(globalState.getState(), null, 2)}
        </pre>
      </section>

      <footer style={{
        marginTop: '40px',
        padding: '20px',
        textAlign: 'center',
        borderTop: '1px solid #ddd',
        color: '#666'
      }}>
        <h3>Features Demonstrated:</h3>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '20px'
        }}>
          <li>✓ Multi-framework support (React, Vue, Svelte)</li>
          <li>✓ Multiple hydration strategies</li>
          <li>✓ Shared state across frameworks</li>
          <li>✓ Event bus communication</li>
          <li>✓ Framework auto-detection</li>
          <li>✓ Code splitting by framework</li>
        </ul>
      </footer>
    </div>
  );
}

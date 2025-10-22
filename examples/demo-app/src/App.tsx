import { Counter } from "./components/Counter";
import { DataFetcher } from "./components/DataFetcher";
import { AnimationDemo } from "./components/AnimationDemo";

export function App() {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    }}>
      <header style={{
        textAlign: 'center',
        marginBottom: '3rem'
      }}>
        <h1 style={{
          fontSize: '3rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem'
        }}>
          PhilJS Framework
        </h1>
        <p style={{
          color: '#666',
          fontSize: '1.2rem'
        }}>
          Revolutionary Frontend Framework with Intelligence Built-In
        </p>
      </header>

      <section style={{
        display: 'grid',
        gap: '2rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
      }}>
        <FeatureCard
          title="Signals & Reactivity"
          description="Fine-grained reactivity without virtual DOM"
        >
          <Counter />
        </FeatureCard>

        <FeatureCard
          title="Data Fetching"
          description="Unified caching with SWR-style revalidation"
        >
          <DataFetcher />
        </FeatureCard>

        <FeatureCard
          title="Spring Animations"
          description="Physics-based animations with FLIP support"
        >
          <AnimationDemo />
        </FeatureCard>
      </section>

      <footer style={{
        marginTop: '3rem',
        padding: '2rem',
        background: '#f8f9fa',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>
          Novel Features Demonstrated
        </h3>
        <ul style={{
          listStyle: 'none',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          textAlign: 'left'
        }}>
          <li>✅ Performance Budgets</li>
          <li>✅ Cost Tracking</li>
          <li>✅ Usage Analytics</li>
          <li>✅ Automatic Regression Detection</li>
          <li>✅ Dead Code Detection</li>
          <li>✅ Spring Physics</li>
          <li>✅ Resumability</li>
          <li>✅ Islands Architecture</li>
        </ul>
      </footer>
    </div>
  );
}

function FeatureCard(props: {
  title: string;
  description: string;
  children: any;
}) {
  return (
    <div style={{
      padding: '1.5rem',
      border: '2px solid #e9ecef',
      borderRadius: '12px',
      transition: 'all 0.3s ease'
    }}>
      <h3 style={{
        color: '#667eea',
        marginBottom: '0.5rem',
        fontSize: '1.3rem'
      }}>
        {props.title}
      </h3>
      <p style={{
        color: '#666',
        marginBottom: '1rem',
        fontSize: '0.9rem'
      }}>
        {props.description}
      </p>
      <div style={{
        padding: '1rem',
        background: '#f8f9fa',
        borderRadius: '8px'
      }}>
        {props.children}
      </div>
    </div>
  );
}

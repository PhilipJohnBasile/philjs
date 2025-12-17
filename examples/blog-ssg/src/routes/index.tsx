import { SEO } from '../components/SEO';

export default function HomePage() {
  return (
    <>
      <SEO
        title="Home"
        description="Welcome to the PhilJS Blog - Learn about building modern web applications"
        url="http://localhost:5173"
      />
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>PhilJS Blog</h1>
          <p style={styles.subtitle}>
            Learn how to build fast, modern web applications with PhilJS
          </p>
          <nav style={styles.nav}>
            <a href="/blog" style={styles.navLink}>
              View All Posts
            </a>
          </nav>
        </header>

        <section style={styles.hero}>
          <h2 style={styles.heroTitle}>Featured Topics</h2>
          <div style={styles.topics}>
            <div style={styles.topic}>
              <h3>Getting Started</h3>
              <p>Learn the basics of PhilJS and build your first app</p>
            </div>
            <div style={styles.topic}>
              <h3>Advanced Patterns</h3>
              <p>Master advanced techniques and best practices</p>
            </div>
            <div style={styles.topic}>
              <h3>Static Site Generation</h3>
              <p>Build blazing fast static sites with SSG</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '3rem',
  },
  title: {
    fontSize: '3.5rem',
    margin: '0 0 1rem',
    color: '#333',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '1.25rem',
    color: '#666',
    margin: '0 0 2rem',
  },
  nav: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
  },
  navLink: {
    padding: '0.75rem 1.5rem',
    background: '#667eea',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: 'bold' as const,
    transition: 'all 0.2s',
  },
  hero: {
    marginTop: '4rem',
  },
  heroTitle: {
    fontSize: '2rem',
    textAlign: 'center' as const,
    marginBottom: '2rem',
    color: '#333',
  },
  topics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
  },
  topic: {
    padding: '2rem',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
};

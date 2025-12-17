import { PostCard } from '../../components/PostCard';
import { SEO } from '../../components/SEO';
import { getAllPosts } from '../../lib/posts';

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <>
      <SEO
        title="Blog"
        description="Articles about web development, PhilJS, and modern JavaScript"
        url="http://localhost:5173/blog"
      />

      <div style={styles.container}>
        <header style={styles.header}>
          <a href="/" style={styles.backLink}>
            ← Home
          </a>
          <h1 style={styles.title}>Blog</h1>
          <p style={styles.subtitle}>
            Thoughts on web development and PhilJS
          </p>
        </header>

        <div style={styles.grid}>
          {posts.map(post => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>

        {posts.length === 0 && (
          <div style={styles.empty}>
            <p>No posts yet. Check back soon!</p>
          </div>
        )}
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
  backLink: {
    display: 'inline-block',
    marginBottom: '1rem',
    color: '#667eea',
    textDecoration: 'none',
  },
  title: {
    fontSize: '3rem',
    margin: '0 0 1rem',
    color: '#333',
  },
  subtitle: {
    fontSize: '1.25rem',
    color: '#666',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '2rem',
  },
  empty: {
    textAlign: 'center' as const,
    padding: '4rem',
    color: '#999',
  },
};

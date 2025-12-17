import { SEO } from '../../components/SEO';
import { getPostsByTag } from '../../lib/posts';

interface TagPageProps {
  params: { tag: string };
}

export default async function TagPage({ params }: TagPageProps) {
  const posts = await getPostsByTag(params.tag);

  return (
    <>
      <SEO
        title={`Posts tagged "${params.tag}"`}
        description={`All PhilJS blog posts tagged with ${params.tag}`}
        url={`http://localhost:5173/tags/${params.tag}`}
      />

      <div style={styles.container}>
        <header style={styles.header}>
          <a href="/blog" style={styles.back}>
            ← Back to all posts
          </a>

          <h1 style={styles.title}>#{params.tag}</h1>
          <p style={styles.subtitle}>
            {posts.length} {posts.length === 1 ? 'post' : 'posts'} with this tag
          </p>
        </header>

        <div style={styles.list}>
          {posts.map(post => (
            <article key={post.slug} style={styles.post}>
              <a href={`/blog/${post.slug}`} style={styles.postTitle}>
                {post.title}
              </a>
              <p style={styles.excerpt}>{post.excerpt}</p>
            </article>
          ))}
        </div>

        {posts.length === 0 && (
          <div style={styles.empty}>
            <p>No posts yet for this tag.</p>
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '2rem',
  },
  header: {
    marginBottom: '2rem',
  },
  back: {
    display: 'inline-block',
    marginBottom: '1rem',
    color: '#667eea',
    textDecoration: 'none',
  },
  title: {
    fontSize: '2.5rem',
    margin: '0 0 0.5rem',
    color: '#333',
  },
  subtitle: {
    color: '#666',
    margin: 0,
  },
  list: {
    display: 'grid',
    gap: '2rem',
  },
  post: {
    padding: '1.5rem',
    borderRadius: '12px',
    background: '#f8fafc',
  },
  postTitle: {
    fontSize: '1.5rem',
    color: '#1f2937',
    textDecoration: 'none',
  },
  excerpt: {
    marginTop: '0.75rem',
    color: '#4b5563',
    lineHeight: 1.6,
  },
  empty: {
    textAlign: 'center' as const,
    padding: '3rem',
    color: '#94a3b8',
  },
};

import { SEO } from '../../components/SEO';
import { getPostBySlug, formatDate } from '../../lib/posts';

interface PostPageProps {
  params: { slug: string };
}

export default async function PostPage({ params }: PostPageProps) {
  const post = await getPostBySlug(params.slug);

  return (
    <>
      <SEO
        title={post.title}
        description={post.excerpt}
        url={`http://localhost:5173/blog/${post.slug}`}
        type="article"
        publishedTime={post.date}
        author={post.author}
        tags={post.tags}
      />

      <article style={styles.article}>
        <header style={styles.header}>
          <a href="/blog" style={styles.back}>
            ← Back to blog
          </a>

          <h1 style={styles.title}>{post.title}</h1>

          <div style={styles.meta}>
            <time style={styles.date}>{formatDate(post.date)}</time>
            <span style={styles.author}>by {post.author}</span>
          </div>

          <div style={styles.tags}>
            {post.tags.map(tag => (
              <a
                key={tag}
                href={`/tags/${tag}`}
                style={styles.tag}
              >
                #{tag}
              </a>
            ))}
          </div>
        </header>

        <div
          style={styles.content}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <footer style={styles.footer}>
          <a href="/blog" style={styles.backButton}>
            ← Back to all posts
          </a>
        </footer>
      </article>
    </>
  );
}

const styles = {
  article: {
    maxWidth: '800px',
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
    fontSize: '3rem',
    margin: '0 0 1rem',
    color: '#333',
    lineHeight: 1.2,
  },
  meta: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    color: '#666',
  },
  date: {},
  author: {},
  tags: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
  },
  tag: {
    padding: '0.25rem 0.75rem',
    background: '#f0f0f0',
    borderRadius: '20px',
    fontSize: '0.875rem',
    color: '#667eea',
    textDecoration: 'none',
  },
  content: {
    fontSize: '1.125rem',
    lineHeight: 1.8,
    color: '#333',
  },
  footer: {
    marginTop: '3rem',
    paddingTop: '2rem',
    borderTop: '1px solid #eee',
  },
  backButton: {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    background: '#667eea',
    color: 'white',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 'bold' as const,
  },
};

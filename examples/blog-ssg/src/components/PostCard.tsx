import type { Post } from '../lib/posts';
import { formatDate } from '../lib/posts';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article style={styles.card}>
      <div style={styles.content}>
        <div style={styles.meta}>
          <time style={styles.date}>{formatDate(post.date)}</time>
          <span style={styles.author}>by {post.author}</span>
        </div>

        <a href={`/blog/${post.slug}`} style={styles.titleLink}>
          <h2 style={styles.title}>{post.title}</h2>
        </a>

        <p style={styles.excerpt}>{post.excerpt}</p>

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

        <a href={`/blog/${post.slug}`} style={styles.readMore}>
          Read more →
        </a>
      </div>
    </article>
  );
}

const styles = {
  card: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  content: {
    padding: '1.5rem',
  },
  meta: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '0.75rem',
    fontSize: '0.875rem',
    color: '#666',
  },
  date: {},
  author: {},
  titleLink: {
    textDecoration: 'none',
    color: 'inherit',
  },
  title: {
    margin: '0 0 0.75rem',
    fontSize: '1.5rem',
    color: '#333',
    transition: 'color 0.2s',
  },
  excerpt: {
    margin: '0 0 1rem',
    color: '#666',
    lineHeight: 1.6,
  },
  tags: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
    marginBottom: '1rem',
  },
  tag: {
    padding: '0.25rem 0.75rem',
    background: '#f0f0f0',
    borderRadius: '20px',
    fontSize: '0.875rem',
    color: '#667eea',
    textDecoration: 'none',
    transition: 'background 0.2s',
  },
  readMore: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: 'bold' as const,
  },
};

/**
 * Example: Content utilities
 *
 * This example shows how to use content utility functions
 * for reading time, excerpts, TOC, related posts, and more.
 */

import { getCollection, getEntry } from 'philjs-content';
import {
  calculateReadingTime,
  generateExcerpt,
  extractTableOfContents,
  renderTableOfContents,
  findRelatedPosts,
  generateTagCloud,
  renderTagCloud,
  groupByDate,
  paginate,
  formatDate,
  getRelativeTime,
} from 'philjs-content/utils';

// Example 1: Blog post with reading time and excerpt
export function BlogPostCard({ slug }: { slug: string }) {
  const post = await getEntry('blog', slug);
  const readingTime = calculateReadingTime(post.body);
  const excerpt = generateExcerpt(post.body, { length: 160 });

  return (
    <article>
      <h2>{post.data.title}</h2>
      <p>{excerpt}</p>
      <div>
        <span>{formatDate(post.data.date, 'medium')}</span>
        <span>{readingTime.text}</span>
      </div>
    </article>
  );
}

// Example 2: Blog post with table of contents
export function BlogPostWithTOC({ slug }: { slug: string }) {
  const post = await getEntry('blog', slug);
  const rendered = await post.render();

  // Extract TOC from headings
  const toc = extractTableOfContents(rendered.headings, {
    minDepth: 2,
    maxDepth: 3,
  });

  // Render TOC as HTML
  const tocHTML = renderTableOfContents(toc, {
    className: 'table-of-contents',
  });

  return (
    <article>
      <h1>{post.data.title}</h1>

      {toc.length > 0 && (
        <aside>
          <h2>Table of Contents</h2>
          <div innerHTML={tocHTML} />
        </aside>
      )}

      <div innerHTML={rendered.Content} />
    </article>
  );
}

// Example 3: Related posts
export function BlogPostWithRelated({ slug }: { slug: string }) {
  const post = await getEntry('blog', slug);
  const allPosts = await getCollection('blog', {
    filter: (p) => !(p.data as { draft?: boolean }).draft,
  });

  // Find related posts based on tags
  const related = findRelatedPosts(post, allPosts, {
    limit: 3,
    minSharedTags: 1,
  });

  return (
    <article>
      <h1>{post.data.title}</h1>
      <div innerHTML={await post.render()} />

      {related.length > 0 && (
        <aside>
          <h2>Related Posts</h2>
          <ul>
            {related.map(relatedPost => (
              <li>
                <a href={`/blog/${relatedPost.slug}`}>
                  {relatedPost.data.title}
                </a>
                <span>Relevance: {(relatedPost.score * 100).toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
}

// Example 4: Tag cloud
export function TagCloudPage() {
  const posts = await getCollection('blog');

  // Generate tag cloud
  const tagCloud = generateTagCloud(posts, {
    minCount: 2,
    sort: 'count',
    limit: 20,
  });

  // Render as HTML
  const cloudHTML = renderTagCloud(tagCloud, {
    baseUrl: '/blog/tags/',
    className: 'tag-cloud',
    useWeightForSize: true,
    minSize: 0.8,
    maxSize: 2.0,
  });

  return (
    <div>
      <h1>Popular Tags</h1>
      <div innerHTML={cloudHTML} />

      {/* Or render manually with custom styling */}
      <div class="custom-tag-cloud">
        {tagCloud.map(({ tag, count, weight }) => (
          <a
            href={`/blog/tags/${tag}`}
            style={`font-size: ${0.8 + weight * 1.2}em; opacity: ${0.5 + weight * 0.5}`}
            title={`${count} post${count === 1 ? '' : 's'}`}
          >
            {tag}
          </a>
        ))}
      </div>
    </div>
  );
}

// Example 5: Blog archive grouped by date
export function BlogArchive() {
  const posts = await getCollection('blog', {
    filter: (p) => !(p.data as { draft?: boolean }).draft,
    sort: (a, b) => {
      const aDate = (a.data as { date: Date }).date;
      const bDate = (b.data as { date: Date }).date;
      return bDate.getTime() - aDate.getTime();
    },
  });

  // Group by month
  const byMonth = groupByDate(posts, {
    granularity: 'month',
    sort: 'desc',
  });

  return (
    <div>
      <h1>Blog Archive</h1>

      {Array.from(byMonth.entries()).map(([month, monthPosts]) => (
        <section>
          <h2>{formatMonthYear(month)}</h2>
          <ul>
            {monthPosts.map(post => (
              <li>
                <a href={`/blog/${post.slug}`}>
                  {post.data.title}
                </a>
                <time>{formatDate(post.data.date, 'medium')}</time>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// Example 6: Paginated blog index
export function BlogIndex({ page = 1 }: { page?: number }) {
  const allPosts = await getCollection('blog', {
    filter: (p) => !(p.data as { draft?: boolean }).draft,
    sort: (a, b) => {
      const aDate = (a.data as { date: Date }).date;
      const bDate = (b.data as { date: Date }).date;
      return bDate.getTime() - aDate.getTime();
    },
  });

  // Paginate posts
  const paginated = paginate(allPosts, {
    pageSize: 10,
    page,
  });

  return (
    <div>
      <h1>Blog</h1>

      <div>
        {paginated.items.map(post => {
          const readingTime = calculateReadingTime(post.body);
          const excerpt = generateExcerpt(post.body);

          return (
            <article>
              <h2>
                <a href={`/blog/${post.slug}`}>{post.data.title}</a>
              </h2>
              <p>{excerpt}</p>
              <div>
                <time>{getRelativeTime(post.data.date)}</time>
                <span>{readingTime.text}</span>
              </div>
              {post.data.tags && (
                <div>
                  {post.data.tags.map(tag => (
                    <a href={`/blog/tags/${tag}`}>{tag}</a>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Pagination controls */}
      <nav>
        {paginated.hasPrev && (
          <a href={`/blog?page=${paginated.page - 1}`}>Previous</a>
        )}
        <span>
          Page {paginated.page} of {paginated.totalPages}
        </span>
        {paginated.hasNext && (
          <a href={`/blog?page=${paginated.page + 1}`}>Next</a>
        )}
      </nav>
    </div>
  );
}

// Example 7: Search results with excerpts
export function SearchResults({ query }: { query: string }) {
  const posts = await getCollection('blog');

  // Simple search in title and body
  const results = posts.filter(post => {
    const searchText = `${post.data.title} ${post.body}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  });

  return (
    <div>
      <h1>Search Results for "{query}"</h1>
      <p>Found {results.length} result{results.length === 1 ? '' : 's'}</p>

      {results.map(post => {
        // Generate excerpt showing context
        const excerpt = generateExcerpt(post.body, {
          length: 200,
          preserveWords: true,
        });

        return (
          <article>
            <h2>
              <a href={`/blog/${post.slug}`}>{post.data.title}</a>
            </h2>
            <p>{excerpt}</p>
          </article>
        );
      })}
    </div>
  );
}

// Helper function
function formatMonthYear(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

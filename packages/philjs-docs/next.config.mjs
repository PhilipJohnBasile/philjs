import createMDX from '@next/mdx';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrettyCode from 'rehype-pretty-code';

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  // Enable static export for deployment to any static host
  output: process.env.STATIC_EXPORT === 'true' ? 'export' : undefined,
  // Trailing slashes for static hosting compatibility
  trailingSlash: true,
  experimental: {
    mdxRs: false,
  },
  images: {
    // Use unoptimized images for static export
    unoptimized: process.env.STATIC_EXPORT === 'true',
    remotePatterns: [
      { protocol: 'https', hostname: 'github.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
    ],
  },
  // Transpile workspace packages
  transpilePackages: [
    'philjs-core',
    'philjs-router',
    'philjs-forms',
    'philjs-ui',
    'philjs-playground',
  ],
  async redirects() {
    // Skip redirects in static export mode
    if (process.env.STATIC_EXPORT === 'true') return [];
    return [
      {
        source: '/docs',
        destination: '/docs/getting-started/installation',
        permanent: true,
      },
    ];
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'append' }],
      [
        rehypePrettyCode,
        {
          theme: 'github-dark',
          onVisitLine(node) {
            if (node.children.length === 0) {
              node.children = [{ type: 'text', value: ' ' }];
            }
          },
          onVisitHighlightedLine(node) {
            node.properties.className.push('highlighted');
          },
          onVisitHighlightedWord(node) {
            node.properties.className = ['word--highlighted'];
          },
        },
      ],
    ],
  },
});

export default withMDX(nextConfig);

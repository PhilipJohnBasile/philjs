import { Metadata } from 'next';
import { APIReference } from '@/components/APIReference';

export const metadata: Metadata = {
  title: 'philjs-ssr API Reference',
  description: 'Complete API documentation for philjs-ssr - server-side rendering, streaming, and hydration.',
};

export default function SSRAPIPage() {
  return (
    <APIReference
      title="philjs-ssr"
      description="Server-side rendering utilities for PhilJS applications."
      sourceLink="https://github.com/philjs/philjs/tree/main/packages/philjs-ssr"
      methods={[
        {
          name: 'renderToString',
          signature: 'function renderToString(fn: () => JSX.Element, options?: RenderOptions): string',
          description: 'Synchronously renders a component tree to an HTML string.',
          parameters: [
            {
              name: 'fn',
              type: '() => JSX.Element',
              description: 'Function that returns the component to render',
            },
            {
              name: 'options',
              type: 'RenderOptions',
              description: 'Rendering options',
              optional: true,
            },
          ],
          returns: {
            type: 'string',
            description: 'HTML string of the rendered component',
          },
          example: `import { renderToString } from 'philjs-ssr';
import { App } from './App';

const html = renderToString(() => <App />);

console.log(html); // '<div>...</div>'`,
          since: '1.0.0',
        },
        {
          name: 'renderToStream',
          signature: 'function renderToStream(fn: () => JSX.Element, options?: RenderOptions): ReadableStream',
          description: 'Renders a component tree to a readable stream for progressive rendering.',
          parameters: [
            {
              name: 'fn',
              type: '() => JSX.Element',
              description: 'Function that returns the component to render',
            },
            {
              name: 'options',
              type: 'RenderOptions',
              description: 'Rendering options',
              optional: true,
            },
          ],
          returns: {
            type: 'ReadableStream',
            description: 'Stream of HTML chunks',
          },
          example: `import { renderToStream } from 'philjs-ssr';
import { App } from './App';

app.get('*', (req, res) => {
  const stream = renderToStream(() => <App url={req.url} />);

  res.setHeader('Content-Type', 'text/html');
  stream.pipeTo(res);
});`,
          since: '1.0.0',
        },
        {
          name: 'hydrate',
          signature: 'function hydrate(fn: () => JSX.Element, node: Element): () => void',
          description: 'Hydrates a server-rendered component tree, making it interactive.',
          parameters: [
            {
              name: 'fn',
              type: '() => JSX.Element',
              description: 'Function that returns the component to hydrate',
            },
            {
              name: 'node',
              type: 'Element',
              description: 'DOM node containing server-rendered HTML',
            },
          ],
          returns: {
            type: '() => void',
            description: 'Disposal function',
          },
          example: `import { hydrate } from 'philjs-ssr';
import { App } from './App';

hydrate(
  () => <App />,
  document.getElementById('app')!
);`,
          since: '1.0.0',
        },
        {
          name: 'Suspense',
          signature: 'function Suspense(props: SuspenseProps): JSX.Element',
          description: 'Wraps async components and shows fallback content while loading.',
          parameters: [
            {
              name: 'props.fallback',
              type: 'JSX.Element',
              description: 'Content to show while children are suspending',
            },
            {
              name: 'props.children',
              type: 'JSX.Element',
              description: 'Components that may suspend',
            },
          ],
          example: `<Suspense fallback={<Spinner />}>
  <AsyncUserProfile userId={userId()} />
</Suspense>

// With multiple boundaries
<Suspense fallback={<PageSkeleton />}>
  <Header />
  <Suspense fallback={<ContentSkeleton />}>
    <MainContent />
  </Suspense>
  <Footer />
</Suspense>`,
          since: '1.0.0',
        },
        {
          name: 'Title',
          signature: 'function Title(props: { children: string }): JSX.Element',
          description: 'Sets the document title. Works with SSR.',
          parameters: [
            {
              name: 'props.children',
              type: 'string',
              description: 'The page title',
            },
          ],
          example: `function BlogPost(props: { post: Post }) {
  return (
    <>
      <Title>{props.post.title} - My Blog</Title>
      <article>{/* content */}</article>
    </>
  );
}`,
          since: '1.0.0',
        },
        {
          name: 'Meta',
          signature: 'function Meta(props: MetaProps): JSX.Element',
          description: 'Adds meta tags to the document head. Works with SSR.',
          parameters: [
            {
              name: 'props',
              type: 'MetaProps',
              description: 'Meta tag attributes',
            },
          ],
          example: `<Meta name="description" content="Learn PhilJS" />
<Meta property="og:title" content="PhilJS Tutorial" />
<Meta property="og:image" content="/og-image.png" />
<Meta name="twitter:card" content="summary_large_image" />`,
          since: '1.0.0',
        },
        {
          name: 'Link',
          signature: 'function Link(props: LinkProps): JSX.Element',
          description: 'Adds link tags to the document head. Works with SSR.',
          parameters: [
            {
              name: 'props',
              type: 'LinkProps',
              description: 'Link tag attributes',
            },
          ],
          example: `<Link rel="canonical" href="https://example.com/page" />
<Link rel="stylesheet" href="/styles.css" />
<Link rel="icon" type="image/png" href="/favicon.png" />`,
          since: '1.0.0',
        },
        {
          name: 'isServer',
          signature: 'const isServer: boolean',
          description: 'Boolean indicating if code is running on the server.',
          example: `import { isServer } from 'philjs-ssr';

function Component() {
  const data = createResource(async () => {
    if (isServer) {
      // Server-only code
      return await db.query('...');
    } else {
      // Client-side fetch
      return fetch('/api/data').then(r => r.json());
    }
  });

  return <div>{/* render data */}</div>;
}`,
          since: '1.0.0',
        },
        {
          name: 'ssr',
          signature: 'function ssr(template: string, ...values: any[]): { t: string }',
          description: 'Template literal tag for SSR-safe HTML.',
          parameters: [
            {
              name: 'template',
              type: 'string',
              description: 'HTML template string',
            },
            {
              name: 'values',
              type: 'any[]',
              description: 'Values to interpolate',
            },
          ],
          returns: {
            type: '{ t: string }',
            description: 'SSR-safe HTML object',
          },
          example: `function RawHTML() {
  const content = ssr\`
    <div class="prose">
      <h1>Title</h1>
      <p>Content with <strong>HTML</strong></p>
    </div>
  \`;

  return <div innerHTML={content.t} />;
}`,
          since: '1.0.0',
        },
        {
          name: 'createAsync',
          signature: 'function createAsync<T>(fn: () => Promise<T>): Accessor<T | undefined>',
          description: 'Creates an async resource that works with Suspense.',
          parameters: [
            {
              name: 'fn',
              type: '() => Promise<T>',
              description: 'Async function to execute',
            },
          ],
          returns: {
            type: 'Accessor<T | undefined>',
            description: 'Accessor for the async result',
          },
          example: `function UserProfile(props: { userId: string }) {
  const user = createAsync(async () => {
    const res = await fetch(\`/api/users/\${props.userId}\`);
    return res.json();
  });

  return (
    <Suspense fallback={<Spinner />}>
      <div>{user()?.name}</div>
    </Suspense>
  );
}`,
          since: '1.0.0',
        },
      ]}
      types={[
        {
          name: 'RenderOptions',
          kind: 'interface',
          description: 'Options for server rendering functions.',
          properties: [
            {
              name: 'nonce',
              type: 'string',
              description: 'Nonce for CSP',
              optional: true,
            },
            {
              name: 'renderId',
              type: 'string',
              description: 'Unique ID for this render',
              optional: true,
            },
          ],
        },
        {
          name: 'MetaProps',
          kind: 'interface',
          description: 'Props for Meta component.',
          properties: [
            {
              name: 'name',
              type: 'string',
              description: 'Meta name attribute',
              optional: true,
            },
            {
              name: 'property',
              type: 'string',
              description: 'Meta property attribute (for Open Graph)',
              optional: true,
            },
            {
              name: 'content',
              type: 'string',
              description: 'Meta content',
            },
            {
              name: 'charset',
              type: 'string',
              description: 'Character encoding',
              optional: true,
            },
          ],
        },
        {
          name: 'SuspenseContext',
          kind: 'interface',
          description: 'Context provided by Suspense boundaries.',
          properties: [
            {
              name: 'suspended',
              type: 'boolean',
              description: 'Whether content is currently suspended',
            },
            {
              name: 'resources',
              type: 'Set<Promise<any>>',
              description: 'Pending resource promises',
            },
          ],
        },
      ]}
    />
  );
}

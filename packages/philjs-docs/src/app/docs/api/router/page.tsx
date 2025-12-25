import { Metadata } from 'next';
import { APIReference } from '@/components/APIReference';

export const metadata: Metadata = {
  title: 'philjs-router API Reference',
  description: 'Complete API documentation for philjs-router - routing, navigation, and data loading.',
};

export default function RouterAPIPage() {
  return (
    <APIReference
      title="philjs-router"
      description="File-based routing with nested routes, data loading, and navigation."
      sourceLink="https://github.com/philjs/philjs/tree/main/packages/philjs-router"
      methods={[
        {
          name: 'Router',
          signature: 'function Router(props: RouterProps): JSX.Element',
          description: 'Root router component that enables routing in your application.',
          parameters: [
            {
              name: 'props.url',
              type: 'string',
              description: 'Initial URL (for SSR)',
              optional: true,
            },
            {
              name: 'props.base',
              type: 'string',
              description: 'Base path for all routes',
              optional: true,
            },
            {
              name: 'props.children',
              type: 'JSX.Element',
              description: 'Route components',
            },
          ],
          example: `import { Router, Route } from 'philjs-router';

function App() {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/users/:id" component={UserProfile} />
    </Router>
  );
}`,
          since: '1.0.0',
        },
        {
          name: 'Route',
          signature: 'function Route(props: RouteProps): JSX.Element',
          description: 'Defines a route that renders a component when the path matches.',
          parameters: [
            {
              name: 'props.path',
              type: 'string',
              description: 'URL path pattern to match',
            },
            {
              name: 'props.component',
              type: 'Component',
              description: 'Component to render when matched',
              optional: true,
            },
            {
              name: 'props.children',
              type: 'JSX.Element',
              description: 'Nested routes',
              optional: true,
            },
            {
              name: 'props.data',
              type: '(args) => Promise<T>',
              description: 'Data loader function',
              optional: true,
            },
          ],
          example: `// Basic route
<Route path="/about" component={About} />

// With parameters
<Route path="/users/:id" component={UserProfile} />

// With data loading
<Route
  path="/posts/:id"
  component={PostPage}
  data={({ params }) => fetchPost(params.id)}
/>

// Nested routes
<Route path="/dashboard" component={Dashboard}>
  <Route path="/settings" component={Settings} />
  <Route path="/profile" component={Profile} />
</Route>`,
          since: '1.0.0',
        },
        {
          name: 'useNavigate',
          signature: 'function useNavigate(): (path: string, options?: NavigateOptions) => void',
          description: 'Returns a function to programmatically navigate between routes.',
          returns: {
            type: '(path: string, options?: NavigateOptions) => void',
            description: 'Navigation function',
          },
          example: `function LoginButton() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    await login();
    navigate('/dashboard');
  };

  return <button onClick={handleLogin}>Login</button>;
}

// With options
navigate('/profile', { replace: true });
navigate('/search', { state: { query: 'philjs' } });`,
          since: '1.0.0',
        },
        {
          name: 'useParams',
          signature: 'function useParams<T extends Params>(): T',
          description: 'Returns the current route parameters.',
          returns: {
            type: 'T',
            description: 'Object containing route parameters',
          },
          example: `// Route: /users/:id/posts/:postId
function PostPage() {
  const params = useParams<{ id: string; postId: string }>();

  return (
    <div>
      User ID: {params.id}
      Post ID: {params.postId}
    </div>
  );
}`,
          since: '1.0.0',
        },
        {
          name: 'useLocation',
          signature: 'function useLocation(): Location',
          description: 'Returns the current location object.',
          returns: {
            type: 'Location',
            description: 'Current location with pathname, search, hash, etc.',
          },
          example: `function CurrentPath() {
  const location = useLocation();

  return (
    <div>
      <p>Pathname: {location.pathname}</p>
      <p>Search: {location.search}</p>
      <p>Hash: {location.hash}</p>
    </div>
  );
}`,
          since: '1.0.0',
        },
        {
          name: 'useSearchParams',
          signature: 'function useSearchParams(): [URLSearchParams, (params: Params) => void]',
          description: 'Returns the current search params and a function to update them.',
          returns: {
            type: '[URLSearchParams, (params: Params) => void]',
            description: 'Search params and setter function',
          },
          example: `function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const updateSearch = (newQuery: string) => {
    setSearchParams({ q: newQuery, page: '1' });
  };

  return (
    <div>
      <input
        value={query}
        onInput={(e) => updateSearch(e.currentTarget.value)}
      />
      <p>Page: {page}</p>
    </div>
  );
}`,
          since: '1.0.0',
        },
        {
          name: 'useRouteData',
          signature: 'function useRouteData<T>(): T | undefined',
          description: 'Returns the data loaded by the route\'s data function.',
          returns: {
            type: 'T | undefined',
            description: 'Data returned from the route data loader',
          },
          example: `<Route
  path="/posts/:id"
  component={PostPage}
  data={async ({ params }) => {
    const res = await fetch(\`/api/posts/\${params.id}\`);
    return res.json();
  }}
/>

function PostPage() {
  const post = useRouteData<Post>();

  return (
    <Show when={post}>
      {(postData) => (
        <article>
          <h1>{postData.title}</h1>
          <p>{postData.content}</p>
        </article>
      )}
    </Show>
  );
}`,
          since: '1.0.0',
        },
        {
          name: 'Link',
          signature: 'function Link(props: LinkProps): JSX.Element',
          description: 'Navigation link component with client-side routing.',
          parameters: [
            {
              name: 'props.href',
              type: 'string',
              description: 'URL to navigate to',
            },
            {
              name: 'props.replace',
              type: 'boolean',
              description: 'Replace history instead of push',
              optional: true,
            },
            {
              name: 'props.state',
              type: 'any',
              description: 'State to pass to the next route',
              optional: true,
            },
            {
              name: 'props.activeClass',
              type: 'string',
              description: 'Class to add when link is active',
              optional: true,
            },
          ],
          example: `<Link href="/about">About Us</Link>

<Link href="/dashboard" replace>
  Go to Dashboard
</Link>

<Link
  href="/search"
  state={{ query: 'philjs' }}
  activeClass="active"
>
  Search
</Link>`,
          since: '1.0.0',
        },
        {
          name: 'Navigate',
          signature: 'function Navigate(props: NavigateProps): null',
          description: 'Component that navigates when rendered.',
          parameters: [
            {
              name: 'props.href',
              type: 'string',
              description: 'URL to navigate to',
            },
            {
              name: 'props.replace',
              type: 'boolean',
              description: 'Replace history instead of push',
              optional: true,
            },
          ],
          example: `function ProtectedRoute() {
  const user = useUser();

  return (
    <Show
      when={user()}
      fallback={<Navigate href="/login" />}
    >
      <Dashboard />
    </Show>
  );
}`,
          since: '1.0.0',
        },
      ]}
      types={[
        {
          name: 'Location',
          kind: 'interface',
          description: 'Represents the current browser location.',
          properties: [
            {
              name: 'pathname',
              type: 'string',
              description: 'The path portion of the URL',
            },
            {
              name: 'search',
              type: 'string',
              description: 'The query string',
            },
            {
              name: 'hash',
              type: 'string',
              description: 'The hash fragment',
            },
            {
              name: 'state',
              type: 'any',
              description: 'Location state',
            },
            {
              name: 'key',
              type: 'string',
              description: 'Unique key for this location',
            },
          ],
        },
        {
          name: 'NavigateOptions',
          kind: 'interface',
          description: 'Options for programmatic navigation.',
          properties: [
            {
              name: 'replace',
              type: 'boolean',
              description: 'Replace current entry instead of adding new one',
              optional: true,
            },
            {
              name: 'state',
              type: 'any',
              description: 'State to associate with the navigation',
              optional: true,
            },
            {
              name: 'scroll',
              type: 'boolean',
              description: 'Whether to scroll to top on navigation',
              optional: true,
              default: 'true',
            },
          ],
        },
        {
          name: 'RouteDataArgs',
          kind: 'interface',
          description: 'Arguments passed to route data functions.',
          properties: [
            {
              name: 'params',
              type: 'Params',
              description: 'Route parameters from the URL',
            },
            {
              name: 'location',
              type: 'Location',
              description: 'Current location object',
            },
            {
              name: 'data',
              type: 'any',
              description: 'Data from parent routes',
            },
          ],
        },
      ]}
    />
  );
}

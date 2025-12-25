(()=>{var e={};e.id=7724,e.ids=[7724],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},5949:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>o.a,__next_app__:()=>u,originalPathname:()=>d,pages:()=>l,routeModule:()=>h,tree:()=>c}),r(8125),r(2108),r(4001),r(1305);var a=r(3545),s=r(5947),i=r(9761),o=r.n(i),n=r(4798),p={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(p[e]=()=>n[e]);r.d(t,p);let c=["",{children:["docs",{children:["api",{children:["router",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,8125)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\api\\router\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(r.bind(r,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,1305,23)),"next/dist/client/components/not-found-error"]}],l=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\api\\router\\page.tsx"],d="/docs/api/router/page",u={require:r,loadChunk:()=>Promise.resolve()},h=new a.AppPageRouteModule({definition:{kind:s.x.APP_PAGE,page:"/docs/api/router/page",pathname:"/docs/api/router",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},5356:(e,t,r)=>{Promise.resolve().then(r.bind(r,2015))},4444:(e,t,r)=>{Promise.resolve().then(r.bind(r,5173))},5173:(e,t,r)=>{"use strict";r.d(t,{Sidebar:()=>l,docsNavigation:()=>c});var a=r(6741),s=r(8972),i=r(47),o=r(7678),n=r(3178),p=r(5280);let c=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function l({sections:e}){let t=(0,i.usePathname)(),[r,c]=(0,p.useState)(()=>{let r=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(r?[r.title]:[e[0]?.title])}),l=e=>{c(t=>{let r=new Set(t);return r.has(e)?r.delete(e):r.add(e),r})};return a.jsx("nav",{className:"w-64 flex-shrink-0",children:a.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:a.jsx("ul",{className:"space-y-6",children:e.map(e=>{let i=r.has(e.title),p=e.links.some(e=>t===e.href);return(0,a.jsxs)("li",{children:[(0,a.jsxs)("button",{onClick:()=>l(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,a.jsx(n.Z,{className:(0,o.Z)("w-4 h-4 transition-transform",i&&"rotate-90")})]}),(i||p)&&a.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let r=t===e.href;return a.jsx("li",{children:a.jsx(s.default,{href:e.href,className:(0,o.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",r?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8125:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>o,metadata:()=>i});var a=r(9015),s=r(7309);let i={title:"philjs-router API Reference",description:"Complete API documentation for philjs-router - routing, navigation, and data loading."};function o(){return a.jsx(s.q,{title:"philjs-router",description:"File-based routing with nested routes, data loading, and navigation.",sourceLink:"https://github.com/philjs/philjs/tree/main/packages/philjs-router",methods:[{name:"Router",signature:"function Router(props: RouterProps): JSX.Element",description:"Root router component that enables routing in your application.",parameters:[{name:"props.url",type:"string",description:"Initial URL (for SSR)",optional:!0},{name:"props.base",type:"string",description:"Base path for all routes",optional:!0},{name:"props.children",type:"JSX.Element",description:"Route components"}],example:`import { Router, Route } from 'philjs-router';

function App() {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/users/:id" component={UserProfile} />
    </Router>
  );
}`,since:"1.0.0"},{name:"Route",signature:"function Route(props: RouteProps): JSX.Element",description:"Defines a route that renders a component when the path matches.",parameters:[{name:"props.path",type:"string",description:"URL path pattern to match"},{name:"props.component",type:"Component",description:"Component to render when matched",optional:!0},{name:"props.children",type:"JSX.Element",description:"Nested routes",optional:!0},{name:"props.data",type:"(args) => Promise<T>",description:"Data loader function",optional:!0}],example:`// Basic route
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
</Route>`,since:"1.0.0"},{name:"useNavigate",signature:"function useNavigate(): (path: string, options?: NavigateOptions) => void",description:"Returns a function to programmatically navigate between routes.",returns:{type:"(path: string, options?: NavigateOptions) => void",description:"Navigation function"},example:`function LoginButton() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    await login();
    navigate('/dashboard');
  };

  return <button onClick={handleLogin}>Login</button>;
}

// With options
navigate('/profile', { replace: true });
navigate('/search', { state: { query: 'philjs' } });`,since:"1.0.0"},{name:"useParams",signature:"function useParams<T extends Params>(): T",description:"Returns the current route parameters.",returns:{type:"T",description:"Object containing route parameters"},example:`// Route: /users/:id/posts/:postId
function PostPage() {
  const params = useParams<{ id: string; postId: string }>();

  return (
    <div>
      User ID: {params.id}
      Post ID: {params.postId}
    </div>
  );
}`,since:"1.0.0"},{name:"useLocation",signature:"function useLocation(): Location",description:"Returns the current location object.",returns:{type:"Location",description:"Current location with pathname, search, hash, etc."},example:`function CurrentPath() {
  const location = useLocation();

  return (
    <div>
      <p>Pathname: {location.pathname}</p>
      <p>Search: {location.search}</p>
      <p>Hash: {location.hash}</p>
    </div>
  );
}`,since:"1.0.0"},{name:"useSearchParams",signature:"function useSearchParams(): [URLSearchParams, (params: Params) => void]",description:"Returns the current search params and a function to update them.",returns:{type:"[URLSearchParams, (params: Params) => void]",description:"Search params and setter function"},example:`function SearchPage() {
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
}`,since:"1.0.0"},{name:"useRouteData",signature:"function useRouteData<T>(): T | undefined",description:"Returns the data loaded by the route's data function.",returns:{type:"T | undefined",description:"Data returned from the route data loader"},example:`<Route
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
}`,since:"1.0.0"},{name:"Link",signature:"function Link(props: LinkProps): JSX.Element",description:"Navigation link component with client-side routing.",parameters:[{name:"props.href",type:"string",description:"URL to navigate to"},{name:"props.replace",type:"boolean",description:"Replace history instead of push",optional:!0},{name:"props.state",type:"any",description:"State to pass to the next route",optional:!0},{name:"props.activeClass",type:"string",description:"Class to add when link is active",optional:!0}],example:`<Link href="/about">About Us</Link>

<Link href="/dashboard" replace>
  Go to Dashboard
</Link>

<Link
  href="/search"
  state={{ query: 'philjs' }}
  activeClass="active"
>
  Search
</Link>`,since:"1.0.0"},{name:"Navigate",signature:"function Navigate(props: NavigateProps): null",description:"Component that navigates when rendered.",parameters:[{name:"props.href",type:"string",description:"URL to navigate to"},{name:"props.replace",type:"boolean",description:"Replace history instead of push",optional:!0}],example:`function ProtectedRoute() {
  const user = useUser();

  return (
    <Show
      when={user()}
      fallback={<Navigate href="/login" />}
    >
      <Dashboard />
    </Show>
  );
}`,since:"1.0.0"}],types:[{name:"Location",kind:"interface",description:"Represents the current browser location.",properties:[{name:"pathname",type:"string",description:"The path portion of the URL"},{name:"search",type:"string",description:"The query string"},{name:"hash",type:"string",description:"The hash fragment"},{name:"state",type:"any",description:"Location state"},{name:"key",type:"string",description:"Unique key for this location"}]},{name:"NavigateOptions",kind:"interface",description:"Options for programmatic navigation.",properties:[{name:"replace",type:"boolean",description:"Replace current entry instead of adding new one",optional:!0},{name:"state",type:"any",description:"State to associate with the navigation",optional:!0},{name:"scroll",type:"boolean",description:"Whether to scroll to top on navigation",optional:!0,default:"true"}]},{name:"RouteDataArgs",kind:"interface",description:"Arguments passed to route data functions.",properties:[{name:"params",type:"Params",description:"Route parameters from the URL"},{name:"location",type:"Location",description:"Current location object"},{name:"data",type:"any",description:"Data from parent routes"}]}]})}},2108:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>n});var a=r(9015),s=r(1471);let i=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),o=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function n({children:e}){return a.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,a.jsxs)("div",{className:"flex gap-12",children:[a.jsx(o,{sections:i}),a.jsx("main",{className:"flex-1 min-w-0",children:a.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[732,6314,9858],()=>r(5949));module.exports=a})();
(()=>{var e={};e.id=1394,e.ids=[1394],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},3920:(e,t,n)=>{"use strict";n.r(t),n.d(t,{GlobalError:()=>o.a,__next_app__:()=>d,originalPathname:()=>p,pages:()=>u,routeModule:()=>m,tree:()=>l}),n(3840),n(2108),n(4001),n(1305);var r=n(3545),s=n(5947),i=n(9761),o=n.n(i),a=n(4798),c={};for(let e in a)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(c[e]=()=>a[e]);n.d(t,c);let l=["",{children:["docs",{children:["api",{children:["core",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(n.bind(n,3840)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\api\\core\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(n.bind(n,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(n.bind(n,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(n.t.bind(n,1305,23)),"next/dist/client/components/not-found-error"]}],u=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\api\\core\\page.tsx"],p="/docs/api/core/page",d={require:n,loadChunk:()=>Promise.resolve()},m=new r.AppPageRouteModule({definition:{kind:s.x.APP_PAGE,page:"/docs/api/core/page",pathname:"/docs/api/core",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})},5356:(e,t,n)=>{Promise.resolve().then(n.bind(n,2015))},4444:(e,t,n)=>{Promise.resolve().then(n.bind(n,5173))},5173:(e,t,n)=>{"use strict";n.d(t,{Sidebar:()=>u,docsNavigation:()=>l});var r=n(6741),s=n(8972),i=n(47),o=n(7678),a=n(3178),c=n(5280);let l=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function u({sections:e}){let t=(0,i.usePathname)(),[n,l]=(0,c.useState)(()=>{let n=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(n?[n.title]:[e[0]?.title])}),u=e=>{l(t=>{let n=new Set(t);return n.has(e)?n.delete(e):n.add(e),n})};return r.jsx("nav",{className:"w-64 flex-shrink-0",children:r.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:r.jsx("ul",{className:"space-y-6",children:e.map(e=>{let i=n.has(e.title),c=e.links.some(e=>t===e.href);return(0,r.jsxs)("li",{children:[(0,r.jsxs)("button",{onClick:()=>u(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,r.jsx(a.Z,{className:(0,o.Z)("w-4 h-4 transition-transform",i&&"rotate-90")})]}),(i||c)&&r.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let n=t===e.href;return r.jsx("li",{children:r.jsx(s.default,{href:e.href,className:(0,o.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",n?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},3840:(e,t,n)=>{"use strict";n.r(t),n.d(t,{default:()=>o,metadata:()=>i});var r=n(9015),s=n(7309);let i={title:"philjs-core API Reference",description:"Complete API documentation for philjs-core - signals, effects, components, and more."};function o(){return r.jsx(s.q,{title:"philjs-core",description:"The core reactivity system and component primitives for PhilJS.",sourceLink:"https://github.com/philjs/philjs/tree/main/packages/philjs-core",methods:[{name:"createSignal",signature:"function createSignal<T>(initialValue: T, options?: SignalOptions<T>): [Accessor<T>, Setter<T>]",description:"Creates a reactive signal with a getter and setter.",parameters:[{name:"initialValue",type:"T",description:"The initial value of the signal"},{name:"options",type:"SignalOptions<T>",description:"Optional configuration for the signal",optional:!0}],returns:{type:"[Accessor<T>, Setter<T>]",description:"A tuple with getter and setter functions"},example:`const [count, setCount] = createSignal(0);

console.log(count()); // 0
setCount(5);
console.log(count()); // 5

// With updater function
setCount(prev => prev + 1);
console.log(count()); // 6

// With options
const [value, setValue] = createSignal(
  { x: 0, y: 0 },
  { equals: (a, b) => a.x === b.x && a.y === b.y }
);`,since:"1.0.0"},{name:"createEffect",signature:"function createEffect<T>(fn: (prev?: T) => T, value?: T): void",description:"Creates a side effect that automatically tracks and re-runs when dependencies change.",parameters:[{name:"fn",type:"(prev?: T) => T",description:"The effect function to run"},{name:"value",type:"T",description:"Optional initial value passed to the effect",optional:!0}],example:`const [count, setCount] = createSignal(0);

createEffect(() => {
  console.log('Count changed:', count());
});

setCount(1); // Logs: "Count changed: 1"

// With previous value
createEffect((prev = 0) => {
  const current = count();
  console.log(\`Changed from \${prev} to \${current}\`);
  return current;
});`,since:"1.0.0"},{name:"createMemo",signature:"function createMemo<T>(fn: (prev?: T) => T, value?: T, options?: MemoOptions<T>): Accessor<T>",description:"Creates a memoized computed value that only recalculates when dependencies change.",parameters:[{name:"fn",type:"(prev?: T) => T",description:"The computation function"},{name:"value",type:"T",description:"Optional initial value",optional:!0},{name:"options",type:"MemoOptions<T>",description:"Optional configuration",optional:!0}],returns:{type:"Accessor<T>",description:"A getter function that returns the memoized value"},example:`const [firstName, setFirstName] = createSignal('John');
const [lastName, setLastName] = createSignal('Doe');

const fullName = createMemo(() => {
  console.log('Computing...');
  return \`\${firstName()} \${lastName()}\`;
});

console.log(fullName()); // "Computing...", "John Doe"
console.log(fullName()); // "John Doe" (cached)

setFirstName('Jane');
console.log(fullName()); // "Computing...", "Jane Doe"`,since:"1.0.0"},{name:"createResource",signature:"function createResource<T, S>(source: Accessor<S> | false | null | undefined, fetcher: (source: S, info: ResourceFetcherInfo) => T | Promise<T>): ResourceReturn<T>",description:"Creates a resource for async data fetching with loading and error states.",parameters:[{name:"source",type:"Accessor<S>",description:"Source signal that triggers refetching when it changes"},{name:"fetcher",type:"(source: S) => T | Promise<T>",description:"Async function that fetches the data"}],returns:{type:"ResourceReturn<T>",description:"Resource accessor and control methods"},example:`const [userId, setUserId] = createSignal(1);

const [user, { refetch, mutate }] = createResource(
  userId,
  async (id) => {
    const res = await fetch(\`/api/users/\${id}\`);
    return res.json();
  }
);

// Access data
user(); // User | undefined
user.loading; // boolean
user.error; // Error | null
user.state; // 'pending' | 'ready' | 'refreshing' | 'errored'

// Refetch
refetch();

// Optimistic update
mutate(newUserData);`,since:"1.0.0"},{name:"createStore",signature:"function createStore<T extends object>(initial: T): [Store<T>, SetStoreFunction<T>]",description:"Creates a reactive store for nested state with fine-grained updates.",parameters:[{name:"initial",type:"T",description:"The initial state object"}],returns:{type:"[Store<T>, SetStoreFunction<T>]",description:"Store accessor and setter function"},example:`const [state, setState] = createStore({
  user: {
    name: 'Alice',
    age: 30,
  },
  todos: [
    { id: 1, text: 'Learn PhilJS', done: false },
  ],
});

// Read
console.log(state.user.name); // 'Alice'

// Update nested
setState('user', 'age', 31);

// Update with function
setState('user', 'age', age => age + 1);

// Array operations
setState('todos', 0, 'done', true);`,since:"1.0.0"},{name:"onMount",signature:"function onMount(fn: () => void): void",description:"Runs a function once when the component is first created and inserted into the DOM.",parameters:[{name:"fn",type:"() => void",description:"The function to run on mount"}],example:`function Component() {
  onMount(() => {
    console.log('Component mounted!');
    fetchData();
  });

  return <div>Hello</div>;
}`,since:"1.0.0"},{name:"onCleanup",signature:"function onCleanup(fn: () => void): void",description:"Registers a cleanup function to run when the current scope is disposed.",parameters:[{name:"fn",type:"() => void",description:"The cleanup function"}],example:`function Timer() {
  const [time, setTime] = createSignal(0);

  onMount(() => {
    const interval = setInterval(() => {
      setTime(t => t + 1);
    }, 1000);

    onCleanup(() => clearInterval(interval));
  });

  return <div>{time()}s</div>;
}`,since:"1.0.0"},{name:"batch",signature:"function batch<T>(fn: () => T): T",description:"Batches multiple signal updates to prevent unnecessary re-computations.",parameters:[{name:"fn",type:"() => T",description:"Function containing the batched updates"}],returns:{type:"T",description:"The return value of the function"},example:`const [first, setFirst] = createSignal('John');
const [last, setLast] = createSignal('Doe');

createEffect(() => {
  console.log(\`\${first()} \${last()}\`);
});

// Without batch: logs twice
setFirst('Jane');
setLast('Smith');

// With batch: logs once
batch(() => {
  setFirst('Alice');
  setLast('Johnson');
});`,since:"1.0.0"},{name:"untrack",signature:"function untrack<T>(fn: () => T): T",description:"Reads signals without creating dependencies in the current tracking scope.",parameters:[{name:"fn",type:"() => T",description:"Function to run without tracking"}],returns:{type:"T",description:"The return value of the function"},example:`const [count, setCount] = createSignal(0);
const [name, setName] = createSignal('Alice');

createEffect(() => {
  console.log('Count:', count());
  console.log('Name:', untrack(name)); // Won't track
});

setCount(1); // Logs
setName('Bob'); // Doesn't log`,since:"1.0.0"},{name:"createContext",signature:"function createContext<T>(defaultValue?: T): Context<T>",description:"Creates a context object for passing data through the component tree.",parameters:[{name:"defaultValue",type:"T",description:"Optional default value",optional:!0}],returns:{type:"Context<T>",description:"Context object"},example:`const ThemeContext = createContext<'light' | 'dark'>('light');

function App() {
  const [theme, setTheme] = createSignal<'light' | 'dark'>('dark');

  return (
    <ThemeContext.Provider value={theme()}>
      <Child />
    </ThemeContext.Provider>
  );
}

function Child() {
  const theme = useContext(ThemeContext);
  return <div className={theme}>Content</div>;
}`,since:"1.0.0"},{name:"useContext",signature:"function useContext<T>(context: Context<T>): T",description:"Retrieves the value from a context.",parameters:[{name:"context",type:"Context<T>",description:"The context object"}],returns:{type:"T",description:"The context value"},example:`const MyContext = createContext<string>();

function Child() {
  const value = useContext(MyContext);
  return <div>{value}</div>;
}`,since:"1.0.0"},{name:"lazy",signature:"function lazy<T extends Component<any>>(fn: () => Promise<{ default: T }>): T",description:"Lazy loads a component for code splitting.",parameters:[{name:"fn",type:"() => Promise<{ default: T }>",description:"Function that returns a dynamic import"}],returns:{type:"T",description:"The lazy-loaded component"},example:`const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyComponent />
    </Suspense>
  );
}`,since:"1.0.0"}],types:[{name:"Accessor",kind:"type",description:"A function that returns the current value of a signal or memo.",example:`type Accessor<T> = () => T;

const count: Accessor<number> = createSignal(0)[0];
console.log(count()); // 0`},{name:"Setter",kind:"type",description:"A function that sets a new value for a signal.",example:`type Setter<T> = (value: T | ((prev: T) => T)) => T;

const setCount: Setter<number> = createSignal(0)[1];
setCount(5);
setCount(prev => prev + 1);`},{name:"SignalOptions",kind:"interface",description:"Options for configuring signal behavior.",properties:[{name:"equals",type:"(prev: T, next: T) => boolean",description:"Custom equality function",optional:!0,default:"Object.is"},{name:"name",type:"string",description:"Debug name for the signal",optional:!0}]},{name:"ResourceReturn",kind:"type",description:"Return type of createResource with data accessor and control methods.",properties:[{name:"loading",type:"boolean",description:"Whether the resource is currently loading"},{name:"error",type:"Error | null",description:"Error if the fetch failed"},{name:"state",type:"'pending' | 'ready' | 'refreshing' | 'errored'",description:"Current state of the resource"}]}]})}},2108:(e,t,n)=>{"use strict";n.r(t),n.d(t,{default:()=>a});var r=n(9015),s=n(1471);let i=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),o=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function a({children:e}){return r.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,r.jsxs)("div",{className:"flex gap-12",children:[r.jsx(o,{sections:i}),r.jsx("main",{className:"flex-1 min-w-0",children:r.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),r=t.X(0,[732,6314,9858],()=>n(3920));module.exports=r})();
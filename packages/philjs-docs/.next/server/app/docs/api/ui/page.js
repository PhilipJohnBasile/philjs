(()=>{var e={};e.id=6903,e.ids=[6903],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},174:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>a.a,__next_app__:()=>u,originalPathname:()=>p,pages:()=>d,routeModule:()=>m,tree:()=>c}),r(9374),r(2108),r(4001),r(1305);var s=r(3545),i=r(5947),o=r(9761),a=r.n(o),n=r(4798),l={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>n[e]);r.d(t,l);let c=["",{children:["docs",{children:["api",{children:["ui",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,9374)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\api\\ui\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(r.bind(r,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,1305,23)),"next/dist/client/components/not-found-error"]}],d=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\api\\ui\\page.tsx"],p="/docs/api/ui/page",u={require:r,loadChunk:()=>Promise.resolve()},m=new s.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/docs/api/ui/page",pathname:"/docs/api/ui",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},7656:(e,t,r)=>{Promise.resolve().then(r.t.bind(r,5505,23)),Promise.resolve().then(r.bind(r,2015)),Promise.resolve().then(r.bind(r,306))},4444:(e,t,r)=>{Promise.resolve().then(r.bind(r,5173))},5173:(e,t,r)=>{"use strict";r.d(t,{Sidebar:()=>d,docsNavigation:()=>c});var s=r(6741),i=r(8972),o=r(47),a=r(7678),n=r(3178),l=r(5280);let c=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function d({sections:e}){let t=(0,o.usePathname)(),[r,c]=(0,l.useState)(()=>{let r=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(r?[r.title]:[e[0]?.title])}),d=e=>{c(t=>{let r=new Set(t);return r.has(e)?r.delete(e):r.add(e),r})};return s.jsx("nav",{className:"w-64 flex-shrink-0",children:s.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:s.jsx("ul",{className:"space-y-6",children:e.map(e=>{let o=r.has(e.title),l=e.links.some(e=>t===e.href);return(0,s.jsxs)("li",{children:[(0,s.jsxs)("button",{onClick:()=>d(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,s.jsx(n.Z,{className:(0,a.Z)("w-4 h-4 transition-transform",o&&"rotate-90")})]}),(o||l)&&s.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let r=t===e.href;return s.jsx("li",{children:s.jsx(i.default,{href:e.href,className:(0,a.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",r?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,r)=>{"use strict";r.d(t,{default:()=>i.a});var s=r(7654),i=r.n(s)},7654:(e,t,r)=>{"use strict";let{createProxy:s}=r(1471);e.exports=s("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},9374:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>l,metadata:()=>n});var s=r(9015),i=r(3288),o=r(7309),a=r(8951);let n={title:"philjs-ui Component Library",description:"Pre-built, accessible UI components for PhilJS applications."};function l(){return(0,s.jsxs)("div",{className:"mdx-content",children:[s.jsx("h1",{children:"philjs-ui Component Library"}),s.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"A collection of accessible, customizable UI components built for PhilJS. All components are unstyled by default and designed to be styled with Tailwind CSS."}),s.jsx("h2",{id:"installation",children:"Installation"}),s.jsx(i.dn,{code:"pnpm add philjs-ui",language:"bash"}),s.jsx("h2",{id:"components",children:"Components"}),(0,s.jsxs)("div",{className:"space-y-8",children:[s.jsx(c,{name:"Button",description:"A flexible button component with multiple variants and sizes.",example:`import { Button } from 'philjs-ui';

function Example() {
  return (
    <>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Delete</Button>
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
      <Button loading>Loading...</Button>
      <Button disabled>Disabled</Button>
    </>
  );
}`,props:[{name:"variant",type:'"primary" | "secondary" | "outline" | "ghost" | "destructive"',default:'"primary"'},{name:"size",type:'"sm" | "md" | "lg"',default:'"md"'},{name:"loading",type:"boolean",default:"false"},{name:"disabled",type:"boolean",default:"false"},{name:"asChild",type:"boolean",default:"false"}]}),s.jsx(c,{name:"Input",description:"Text input with label, error state, and description support.",example:`import { Input } from 'philjs-ui';

function Example() {
  return (
    <>
      <Input label="Email" type="email" placeholder="you@example.com" />
      <Input label="Password" type="password" error="Password is required" />
      <Input label="Bio" description="Tell us about yourself" />
      <Input disabled value="Read only" />
    </>
  );
}`,props:[{name:"label",type:"string"},{name:"error",type:"string"},{name:"description",type:"string"},{name:"type",type:"string",default:'"text"'}]}),s.jsx(c,{name:"Select",description:"Accessible dropdown select with search and multi-select support.",example:`import { Select } from 'philjs-ui';

function Example() {
  return (
    <Select
      label="Country"
      options={[
        { value: 'us', label: 'United States' },
        { value: 'uk', label: 'United Kingdom' },
        { value: 'ca', label: 'Canada' },
      ]}
      onChange={(value) => console.log(value)}
    />
  );
}`,props:[{name:"options",type:"Array<{ value: string; label: string }>"},{name:"value",type:"string"},{name:"onChange",type:"(value: string) => void"},{name:"label",type:"string"},{name:"placeholder",type:"string"},{name:"searchable",type:"boolean",default:"false"},{name:"multiple",type:"boolean",default:"false"}]}),s.jsx(c,{name:"Dialog",description:"Modal dialog with focus trap and keyboard navigation.",example:`import { Dialog, Button } from 'philjs-ui';
import { createSignal } from 'philjs-core';

function Example() {
  const [open, setOpen] = createSignal(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>

      <Dialog open={open()} onClose={() => setOpen(false)}>
        <Dialog.Title>Confirm Action</Dialog.Title>
        <Dialog.Description>
          Are you sure you want to continue?
        </Dialog.Description>
        <Dialog.Footer>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>
            Confirm
          </Button>
        </Dialog.Footer>
      </Dialog>
    </>
  );
}`,props:[{name:"open",type:"boolean"},{name:"onClose",type:"() => void"},{name:"initialFocus",type:"RefObject<HTMLElement>"}]}),s.jsx(c,{name:"Tabs",description:"Accessible tabbed interface with keyboard navigation.",example:`import { Tabs } from 'philjs-ui';

function Example() {
  return (
    <Tabs defaultValue="account">
      <Tabs.List>
        <Tabs.Trigger value="account">Account</Tabs.Trigger>
        <Tabs.Trigger value="password">Password</Tabs.Trigger>
        <Tabs.Trigger value="notifications">Notifications</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="account">
        <p>Manage your account settings here.</p>
      </Tabs.Content>
      <Tabs.Content value="password">
        <p>Change your password here.</p>
      </Tabs.Content>
      <Tabs.Content value="notifications">
        <p>Configure your notification preferences.</p>
      </Tabs.Content>
    </Tabs>
  );
}`,props:[{name:"defaultValue",type:"string"},{name:"value",type:"string"},{name:"onChange",type:"(value: string) => void"},{name:"orientation",type:'"horizontal" | "vertical"',default:'"horizontal"'}]}),s.jsx(c,{name:"Accordion",description:"Collapsible content sections.",example:`import { Accordion } from 'philjs-ui';

function Example() {
  return (
    <Accordion type="single" collapsible>
      <Accordion.Item value="item-1">
        <Accordion.Trigger>What is PhilJS?</Accordion.Trigger>
        <Accordion.Content>
          PhilJS is a modern web framework with fine-grained reactivity.
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="item-2">
        <Accordion.Trigger>How do signals work?</Accordion.Trigger>
        <Accordion.Content>
          Signals are reactive primitives that automatically track dependencies.
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}`,props:[{name:"type",type:'"single" | "multiple"',default:'"single"'},{name:"collapsible",type:"boolean",default:"false"},{name:"defaultValue",type:"string | string[]"}]}),s.jsx(c,{name:"Toast",description:"Non-blocking notification messages.",example:`import { toast, Toaster } from 'philjs-ui';

function Example() {
  return (
    <>
      <Toaster />
      <button onClick={() => toast('Hello, world!')}>
        Show Toast
      </button>
      <button onClick={() => toast.success('Saved!')}>
        Success
      </button>
      <button onClick={() => toast.error('Something went wrong')}>
        Error
      </button>
      <button onClick={() => toast.loading('Processing...')}>
        Loading
      </button>
    </>
  );
}`,props:[{name:"position",type:'"top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"',default:'"bottom-right"'},{name:"duration",type:"number",default:"4000"}]}),s.jsx(c,{name:"Tooltip",description:"Contextual information on hover or focus.",example:`import { Tooltip, Button } from 'philjs-ui';

function Example() {
  return (
    <Tooltip content="This is helpful information">
      <Button>Hover me</Button>
    </Tooltip>
  );
}`,props:[{name:"content",type:"string | JSX.Element"},{name:"side",type:'"top" | "right" | "bottom" | "left"',default:'"top"'},{name:"delay",type:"number",default:"200"}]}),s.jsx(c,{name:"Dropdown",description:"Dropdown menu with keyboard navigation.",example:`import { Dropdown, Button } from 'philjs-ui';

function Example() {
  return (
    <Dropdown>
      <Dropdown.Trigger asChild>
        <Button>Open Menu</Button>
      </Dropdown.Trigger>
      <Dropdown.Content>
        <Dropdown.Item onClick={() => console.log('Edit')}>
          Edit
        </Dropdown.Item>
        <Dropdown.Item onClick={() => console.log('Duplicate')}>
          Duplicate
        </Dropdown.Item>
        <Dropdown.Separator />
        <Dropdown.Item variant="destructive">
          Delete
        </Dropdown.Item>
      </Dropdown.Content>
    </Dropdown>
  );
}`,props:[{name:"align",type:'"start" | "center" | "end"',default:'"start"'},{name:"side",type:'"top" | "right" | "bottom" | "left"',default:'"bottom"'}]})]}),s.jsx("h2",{id:"theming",children:"Theming"}),s.jsx("p",{children:"philjs-ui uses CSS variables for theming. Override these in your CSS to customize:"}),s.jsx(i.dn,{code:`:root {
  --ui-primary: 59 130 246;      /* blue-500 */
  --ui-secondary: 100 116 139;   /* slate-500 */
  --ui-destructive: 239 68 68;   /* red-500 */
  --ui-background: 255 255 255;
  --ui-foreground: 15 23 42;
  --ui-border: 226 232 240;
  --ui-radius: 0.5rem;
}

.dark {
  --ui-background: 15 23 42;
  --ui-foreground: 248 250 252;
  --ui-border: 51 65 85;
}`,language:"css",filename:"globals.css"}),s.jsx("h2",{id:"accessibility",children:"Accessibility"}),(0,s.jsxs)(o.U,{type:"info",title:"WCAG Compliant",children:["All philjs-ui components are built with accessibility in mind:",(0,s.jsxs)("ul",{className:"mt-2 list-disc ml-4",children:[s.jsx("li",{children:"Proper ARIA attributes"}),s.jsx("li",{children:"Keyboard navigation support"}),s.jsx("li",{children:"Focus management"}),s.jsx("li",{children:"Screen reader compatible"}),s.jsx("li",{children:"Color contrast compliant"})]})]}),s.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,s.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,s.jsxs)(a.default,{href:"/docs/guides/styling",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[s.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Styling Guide"}),s.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Learn how to customize component styles"})]}),(0,s.jsxs)(a.default,{href:"/examples",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[s.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Examples"}),s.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"See components in action"})]})]})]})}function c({name:e,description:t,example:r,props:o}){return(0,s.jsxs)("div",{className:"border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden",children:[(0,s.jsxs)("div",{className:"p-4 bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700",children:[s.jsx("h3",{id:e.toLowerCase(),className:"text-xl font-semibold text-primary-600 dark:text-primary-400 scroll-mt-20",children:e}),s.jsx("p",{className:"text-surface-600 dark:text-surface-400 mt-1",children:t})]}),(0,s.jsxs)("div",{className:"p-4",children:[s.jsx("h4",{className:"font-semibold text-surface-900 dark:text-white mb-2",children:"Example"}),s.jsx(i.dn,{code:r,language:"typescript"}),s.jsx("h4",{className:"font-semibold text-surface-900 dark:text-white mt-4 mb-2",children:"Props"}),s.jsx("div",{className:"overflow-x-auto",children:(0,s.jsxs)("table",{className:"w-full text-sm",children:[s.jsx("thead",{children:(0,s.jsxs)("tr",{className:"border-b border-surface-200 dark:border-surface-700",children:[s.jsx("th",{className:"text-left py-2 font-medium",children:"Prop"}),s.jsx("th",{className:"text-left py-2 font-medium",children:"Type"}),s.jsx("th",{className:"text-left py-2 font-medium",children:"Default"})]})}),s.jsx("tbody",{children:o.map(e=>(0,s.jsxs)("tr",{className:"border-b border-surface-100 dark:border-surface-800",children:[s.jsx("td",{className:"py-2",children:s.jsx("code",{className:"text-accent-600 dark:text-accent-400",children:e.name})}),s.jsx("td",{className:"py-2",children:s.jsx("code",{className:"text-surface-500 text-xs",children:e.type})}),s.jsx("td",{className:"py-2 text-surface-500",children:e.default||"-"})]},e.name))})]})})]})]})}},2108:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>n});var s=r(9015),i=r(1471);let o=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),a=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function n({children:e}){return s.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,s.jsxs)("div",{className:"flex gap-12",children:[s.jsx(a,{sections:o}),s.jsx("main",{className:"flex-1 min-w-0",children:s.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},3288:(e,t,r)=>{"use strict";r.d(t,{dn:()=>i,oI:()=>o});var s=r(1471);let i=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let o=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[732,6314,9858],()=>r(174));module.exports=s})();
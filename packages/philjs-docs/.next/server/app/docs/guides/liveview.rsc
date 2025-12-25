2:I[7696,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","5919","static/chunks/app/docs/guides/liveview/page-327908c7ef881589.js"],"Callout"]
3:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","5919","static/chunks/app/docs/guides/liveview/page-327908c7ef881589.js"],"Terminal"]
4:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","5919","static/chunks/app/docs/guides/liveview/page-327908c7ef881589.js"],"CodeBlock"]
7:I[6542,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","5919","static/chunks/app/docs/guides/liveview/page-327908c7ef881589.js"],""]
8:I[6419,[],""]
9:I[8445,[],""]
a:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"Sidebar"]
b:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"docsNavigation"]
c:I[1229,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"ThemeProvider"]
d:I[8529,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"Header"]
5:T5fc,import { createLiveView } from 'philjs-liveview';

export const ContactForm = createLiveView({
  mount: () => ({
    form: { name: '', email: '', message: '' },
    errors: {},
    submitted: false,
  }),

  handleEvent: {
    validate: (state, { field, value }) => {
      const errors = { ...state.errors };

      if (field === 'email' && !value.includes('@')) {
        errors.email = 'Invalid email address';
      } else {
        delete errors[field];
      }

      return {
        ...state,
        form: { ...state.form, [field]: value },
        errors,
      };
    },

    submit: async (state) => {
      // Server-side form processing
      await sendEmail(state.form);
      return { ...state, submitted: true };
    },
  },

  render: (state, { pushEvent }) => (
    <form onSubmit={(e) => { e.preventDefault(); pushEvent('submit'); }}>
      <input
        value={state.form.name}
        onInput={(e) => pushEvent('validate', {
          field: 'name',
          value: e.target.value,
        })}
      />

      <input
        type="email"
        value={state.form.email}
        onInput={(e) => pushEvent('validate', {
          field: 'email',
          value: e.target.value,
        })}
      />
      {state.errors.email && <span>{state.errors.email}</span>}

      <textarea
        value={state.form.message}
        onInput={(e) => pushEvent('validate', {
          field: 'message',
          value: e.target.value,
        })}
      />

      <button type="submit">Send</button>
    </form>
  ),
});6:T45b,import { createLiveView } from 'philjs-liveview';

export const ImageUpload = createLiveView({
  mount: () => ({
    uploads: [],
    progress: {},
  }),

  // Configure uploads
  uploads: {
    images: {
      accept: ['image/*'],
      maxSize: 5 * 1024 * 1024, // 5MB
      maxEntries: 5,
    },
  },

  handleEvent: {
    upload: async (state, { uploads }, { consumeUpload }) => {
      const uploaded = [];
      for (const upload of uploads.images) {
        const url = await consumeUpload(upload, saveToStorage);
        uploaded.push({ name: upload.name, url });
      }
      return { ...state, uploads: [...state.uploads, ...uploaded] };
    },
  },

  render: (state, { uploads, pushEvent }) => (
    <div>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => uploads.images.addFiles(e.target.files)}
      />

      {uploads.images.entries.map(entry => (
        <div key={entry.ref}>
          {entry.name} - {entry.progress}%
        </div>
      ))}

      <button onClick={() => pushEvent('upload')}>
        Upload
      </button>
    </div>
  ),
});0:["cd22Ei08xvul0IDkb5kRy",[[["",{"children":["docs",{"children":["guides",{"children":["liveview",{"children":["__PAGE__",{}]}]}]}]},"$undefined","$undefined",true],["",{"children":["docs",{"children":["guides",{"children":["liveview",{"children":["__PAGE__",{},[["$L1",["$","div",null,{"className":"mdx-content","children":[["$","h1",null,{"children":"LiveView"}],["$","p",null,{"className":"lead text-xl text-surface-600 dark:text-surface-400","children":"PhilJS LiveView enables real-time, server-rendered UI updates over WebSockets, providing rich interactivity without complex client-side state management."}],["$","h2",null,{"id":"introduction","children":"Introduction"}],["$","p",null,{"children":"LiveView keeps your application logic on the server while providing a reactive, real-time user experience. The server maintains the state, handles events, and sends optimized DOM patches to the client over WebSockets."}],["$","$L2",null,{"type":"info","title":"Inspiration","children":"PhilJS LiveView is inspired by Phoenix LiveView and brings similar patterns to the TypeScript/Rust ecosystem with seamless integration into the PhilJS framework."}],["$","h2",null,{"id":"setup","children":"Setup"}],["$","$L3",null,{"commands":["pnpm add philjs-liveview","# For Rust projects:","cargo add philjs-liveview"]}],["$","$L4",null,{"code":"// server.ts\nimport { createServer } from 'philjs-liveview/server';\nimport { App } from './App';\n\nconst server = createServer({\n  component: App,\n  port: 3000,\n  // WebSocket configuration\n  ws: {\n    path: '/live',\n    heartbeat: 30000,\n  },\n});\n\nserver.listen();","language":"typescript","filename":"server.ts"}],["$","h2",null,{"id":"basic-example","children":"Basic Example"}],["$","h3",null,{"children":"TypeScript"}],["$","$L4",null,{"code":"import { createLiveView, useLiveState } from 'philjs-liveview';\n\nexport const Counter = createLiveView({\n  // Initial state (runs on server)\n  mount: () => ({\n    count: 0,\n  }),\n\n  // Event handlers (run on server)\n  handleEvent: {\n    increment: (state) => ({\n      ...state,\n      count: state.count + 1,\n    }),\n    decrement: (state) => ({\n      ...state,\n      count: state.count - 1,\n    }),\n  },\n\n  // Render (runs on server, sends DOM patches)\n  render: (state, { pushEvent }) => (\n    <div className=\"counter\">\n      <h1>Count: {state.count}</h1>\n      <button onClick={() => pushEvent('decrement')}>-</button>\n      <button onClick={() => pushEvent('increment')}>+</button>\n    </div>\n  ),\n});","language":"typescript","filename":"Counter.tsx"}],["$","h3",null,{"children":"Rust"}],["$","$L4",null,{"code":"use philjs_liveview::prelude::*;\n\n#[derive(Default, Clone)]\nstruct CounterState {\n    count: i32,\n}\n\n#[live_view]\nfn Counter() -> impl LiveView {\n    LiveViewBuilder::new()\n        .mount(|| CounterState::default())\n        .handle_event(\"increment\", |state: &mut CounterState| {\n            state.count += 1;\n        })\n        .handle_event(\"decrement\", |state: &mut CounterState| {\n            state.count -= 1;\n        })\n        .render(|state, cx| {\n            view! {\n                <div class=\"counter\">\n                    <h1>\"Count: \" {state.count}</h1>\n                    <button on:click=cx.push_event(\"decrement\")>\"-\"</button>\n                    <button on:click=cx.push_event(\"increment\")\">\"+\"</button>\n                </div>\n            }\n        })\n}","language":"rust","filename":"counter.rs"}],["$","h2",null,{"id":"forms","children":"Form Handling"}],["$","p",null,{"children":"LiveView provides seamless form handling with real-time validation:"}],["$","$L4",null,{"code":"$5","language":"typescript"}],["$","h2",null,{"id":"real-time-updates","children":"Real-Time Updates"}],["$","p",null,{"children":"LiveView can push updates to clients from server-side events:"}],["$","$L4",null,{"code":"import { createLiveView } from 'philjs-liveview';\n\nexport const Dashboard = createLiveView({\n  mount: async () => ({\n    metrics: await fetchMetrics(),\n    lastUpdated: new Date(),\n  }),\n\n  // Subscribe to server-side events\n  subscriptions: ['metrics:updated'],\n\n  // Handle broadcast messages\n  handleInfo: {\n    'metrics:updated': async (state, payload) => ({\n      ...state,\n      metrics: payload.metrics,\n      lastUpdated: new Date(),\n    }),\n  },\n\n  render: (state) => (\n    <div className=\"dashboard\">\n      <h1>Live Metrics</h1>\n      <p>Last updated: {state.lastUpdated.toLocaleString()}</p>\n      <MetricsGrid metrics={state.metrics} />\n    </div>\n  ),\n});\n\n// Broadcast updates from anywhere on the server\nimport { broadcast } from 'philjs-liveview';\n\nsetInterval(async () => {\n  const metrics = await fetchMetrics();\n  broadcast('metrics:updated', { metrics });\n}, 5000);","language":"typescript"}],["$","h2",null,{"id":"navigation","children":"Navigation"}],["$","p",null,{"children":"LiveView supports client-side navigation while maintaining WebSocket connection:"}],["$","$L4",null,{"code":"import { createLiveView, navigate, Link } from 'philjs-liveview';\n\nexport const ProductList = createLiveView({\n  mount: async ({ params }) => ({\n    products: await fetchProducts(params.category),\n    category: params.category,\n  }),\n\n  render: (state) => (\n    <div>\n      <nav>\n        <Link to=\"/products/electronics\">Electronics</Link>\n        <Link to=\"/products/clothing\">Clothing</Link>\n      </nav>\n\n      <ul>\n        {state.products.map(product => (\n          <li key={product.id}>\n            <Link to={`/products/${product.id}`}>\n              {product.name}\n            </Link>\n          </li>\n        ))}\n      </ul>\n    </div>\n  ),\n});","language":"typescript"}],["$","h2",null,{"id":"uploads","children":"File Uploads"}],["$","$L4",null,{"code":"$6","language":"typescript"}],["$","h2",null,{"id":"javascript-hooks","children":"JavaScript Hooks"}],["$","p",null,{"children":"For complex client-side behavior, use JavaScript hooks:"}],["$","$L4",null,{"code":"// hooks.ts\nexport const Hooks = {\n  Chart: {\n    mounted() {\n      this.chart = new Chart(this.el, {\n        data: JSON.parse(this.el.dataset.points),\n      });\n    },\n    updated() {\n      this.chart.update(JSON.parse(this.el.dataset.points));\n    },\n    destroyed() {\n      this.chart.destroy();\n    },\n  },\n};\n\n// In your LiveView\nrender: (state) => (\n  <canvas\n    phx-hook=\"Chart\"\n    data-points={JSON.stringify(state.chartData)}\n  />\n)","language":"typescript"}],["$","h2",null,{"id":"axum-integration","children":"Axum Integration (Rust)"}],["$","$L4",null,{"code":"use axum::{routing::get, Router};\nuse philjs_liveview::{LiveViewLayer, live};\n\n#[tokio::main]\nasync fn main() {\n    let app = Router::new()\n        .route(\"/\", get(home))\n        .route(\"/counter\", live(Counter))\n        .route(\"/dashboard\", live(Dashboard))\n        .layer(LiveViewLayer::new());\n\n    axum::Server::bind(&\"0.0.0.0:3000\".parse().unwrap())\n        .serve(app.into_make_service())\n        .await\n        .unwrap();\n}","language":"rust","filename":"main.rs"}],["$","h2",null,{"id":"best-practices","children":"Best Practices"}],["$","ul",null,{"children":[["$","li",null,{"children":[["$","strong",null,{"children":"Keep state minimal:"}]," Only store what's needed for rendering"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Debounce frequent events:"}]," Use built-in debouncing for inputs"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Handle disconnections:"}]," Implement reconnection logic for robustness"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Use hooks sparingly:"}]," Prefer server-side logic when possible"]}],["$","li",null,{"children":[["$","strong",null,{"children":"Optimize subscriptions:"}]," Unsubscribe from topics when not needed"]}]]}],["$","h2",null,{"id":"next-steps","children":"Next Steps"}],["$","div",null,{"className":"grid md:grid-cols-2 gap-4 mt-6 not-prose","children":[["$","$L7",null,{"href":"/docs/guides/ssr-hydration","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"SSR & Hydration"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Understanding server-side rendering"}]]}],["$","$L7",null,{"href":"/docs/guides/forms","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Forms"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Form handling patterns in PhilJS"}]]}]]}]]}],null],null],null]},[null,["$","$L8",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","guides","children","liveview","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L9",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[null,["$","$L8",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","guides","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L9",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[[null,["$","div",null,{"className":"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8","children":["$","div",null,{"className":"flex gap-12","children":[["$","$La",null,{"sections":"$b"}],["$","main",null,{"className":"flex-1 min-w-0","children":["$","article",null,{"className":"prose prose-surface dark:prose-invert max-w-none","children":["$","$L8",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L9",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]}]}]]}]}]],null],null]},[[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/00bb994365e07be9.css","precedence":"next","crossOrigin":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":["$","body",null,{"className":"__variable_f367f3 __variable_3c557b font-sans antialiased","children":["$","$Lc",null,{"children":["$","div",null,{"className":"min-h-screen bg-white dark:bg-surface-950","children":[["$","$Ld",null,{}],["$","$L8",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L9",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":"404"}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],"notFoundStyles":[]}]]}]}]}]}]],null],null],["$Le",null]]]]
e:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","1",{"charSet":"utf-8"}],["$","title","2",{"children":"LiveView - PhilJS Guide | PhilJS"}],["$","meta","3",{"name":"description","content":"Build real-time server-rendered UI with PhilJS LiveView for interactive applications without complex client-side state."}],["$","meta","4",{"name":"author","content":"PhilJS Team"}],["$","link","5",{"rel":"manifest","href":"/site.webmanifest","crossOrigin":"use-credentials"}],["$","meta","6",{"name":"keywords","content":"philjs,javascript,typescript,rust,framework,signals,reactivity,wasm"}],["$","meta","7",{"property":"og:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","8",{"property":"og:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","9",{"property":"og:url","content":"https://philjs.dev/"}],["$","meta","10",{"property":"og:site_name","content":"PhilJS"}],["$","meta","11",{"property":"og:locale","content":"en_US"}],["$","meta","12",{"property":"og:image","content":"https://philjs.dev/og-image.png"}],["$","meta","13",{"property":"og:image:width","content":"1200"}],["$","meta","14",{"property":"og:image:height","content":"630"}],["$","meta","15",{"property":"og:image:alt","content":"PhilJS Framework"}],["$","meta","16",{"property":"og:type","content":"website"}],["$","meta","17",{"name":"twitter:card","content":"summary_large_image"}],["$","meta","18",{"name":"twitter:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","19",{"name":"twitter:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","20",{"name":"twitter:image","content":"https://philjs.dev/og-image.png"}],["$","link","21",{"rel":"shortcut icon","href":"/favicon-16x16.png"}],["$","link","22",{"rel":"icon","href":"/favicon.ico"}],["$","link","23",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]]
1:null

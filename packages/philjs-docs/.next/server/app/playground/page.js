(()=>{var e={};e.id=2383,e.ids=[2383],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},9513:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>i.a,__next_app__:()=>p,originalPathname:()=>u,pages:()=>c,routeModule:()=>x,tree:()=>d}),s(706),s(4001),s(1305);var o=s(3545),a=s(5947),r=s(9761),i=s.n(r),n=s(4798),l={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>n[e]);s.d(t,l);let d=["",{children:["playground",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,706)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\playground\\page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,1305,23)),"next/dist/client/components/not-found-error"]}],c=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\playground\\page.tsx"],u="/playground/page",p={require:s,loadChunk:()=>Promise.resolve()},x=new o.AppPageRouteModule({definition:{kind:a.x.APP_PAGE,page:"/playground/page",pathname:"/playground",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},2202:(e,t,s)=>{Promise.resolve().then(s.bind(s,9026))},5765:(e,t,s)=>{"use strict";s.d(t,{Z:()=>o});let o=(0,s(5230).Z)("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]])},5694:(e,t,s)=>{"use strict";s.d(t,{Z:()=>o});let o=(0,s(5230).Z)("ChevronDown",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]])},7150:(e,t,s)=>{"use strict";s.d(t,{Z:()=>o});let o=(0,s(5230).Z)("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]])},9026:(e,t,s)=>{"use strict";s.d(t,{Playground:()=>v});var o=s(6741),a=s(5280),r=s(5694),i=s(9834),n=s(5230);let l=(0,n.Z)("Layout",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["line",{x1:"3",x2:"21",y1:"9",y2:"9",key:"1vqk6q"}],["line",{x1:"9",x2:"9",y1:"21",y2:"9",key:"wpwpyp"}]]),d=(0,n.Z)("Maximize2",[["polyline",{points:"15 3 21 3 21 9",key:"mznyad"}],["polyline",{points:"9 21 3 21 3 15",key:"1avn1i"}],["line",{x1:"21",x2:"14",y1:"3",y2:"10",key:"ota7mn"}],["line",{x1:"3",x2:"10",y1:"21",y2:"14",key:"1atl0r"}]]),c=(0,n.Z)("Monitor",[["rect",{width:"20",height:"14",x:"2",y:"3",rx:"2",key:"48i651"}],["line",{x1:"8",x2:"16",y1:"21",y2:"21",key:"1svkeh"}],["line",{x1:"12",x2:"12",y1:"17",y2:"21",key:"vw1qmm"}]]),u=(0,n.Z)("Smartphone",[["rect",{width:"14",height:"20",x:"5",y:"2",rx:"2",ry:"2",key:"1yt0o3"}],["path",{d:"M12 18h.01",key:"mhygvu"}]]);var p=s(5765),x=s(7150);let m=(0,n.Z)("Download",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]]),h=(0,n.Z)("Share2",[["circle",{cx:"18",cy:"5",r:"3",key:"gq8acd"}],["circle",{cx:"6",cy:"12",r:"3",key:"w7nqdw"}],["circle",{cx:"18",cy:"19",r:"3",key:"1xt0gg"}],["line",{x1:"8.59",x2:"15.42",y1:"13.51",y2:"17.49",key:"47mynk"}],["line",{x1:"15.41",x2:"8.59",y1:"6.51",y2:"10.49",key:"1n3mei"}]]),g=(0,n.Z)("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]),y=(0,n.Z)("Play",[["polygon",{points:"5 3 19 12 5 21 5 3",key:"191637"}]]);var f=s(7678);let b={counter:{name:"Counter",typescript:`import { signal } from 'philjs-core';

function Counter() {
  const count = signal(0);

  return (
    <div className="p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">
        Count: {count}
      </h1>
      <div className="flex gap-2 justify-center">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => count.set(c => c - 1)}
        >
          -
        </button>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => count.set(c => c + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}`,rust:`use philjs::prelude::*;

#[component]
fn Counter() -> Element {
    let count = use_signal(|| 0);

    view! {
        <div class="p-4 text-center">
            <h1 class="text-2xl font-bold mb-4">
                "Count: " {count}
            </h1>
            <div class="flex gap-2 justify-center">
                <button
                    class="px-4 py-2 bg-blue-500 text-white rounded"
                    on:click=move |_| count.set(|c| c - 1)
                >
                    "-"
                </button>
                <button
                    class="px-4 py-2 bg-blue-500 text-white rounded"
                    on:click=move |_| count.set(|c| c + 1)
                >
                    "+"
                </button>
            </div>
        </div>
    }
}`},todoList:{name:"Todo List",typescript:`import { signal, memo } from 'philjs-core';

function TodoList() {
  const todos = signal([
    { id: 1, text: 'Learn PhilJS', done: true },
    { id: 2, text: 'Build an app', done: false },
    { id: 3, text: 'Deploy to production', done: false },
  ]);
  const newTodo = signal('');

  const remaining = memo(() =>
    todos().filter(t => !t.done).length
  );

  const addTodo = () => {
    if (newTodo().trim()) {
      todos.set(t => [
        ...t,
        { id: Date.now(), text: newTodo(), done: false }
      ]);
      newTodo.set('');
    }
  };

  const toggle = (id: number) => {
    todos.set(t => t.map(todo =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    ));
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Todo List</h1>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTodo()}
          onInput={(e) => newTodo.set(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a todo..."
          className="flex-1 px-3 py-2 border rounded"
        />
        <button
          onClick={addTodo}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Add
        </button>
      </div>
      <ul className="space-y-2">
        {todos().map(todo => (
          <li
            key={todo.id}
            className="flex items-center gap-2 p-2 bg-gray-50 rounded"
          >
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggle(todo.id)}
            />
            <span className={todo.done ? 'line-through text-gray-400' : ''}>
              {todo.text}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-gray-500">
        {remaining()} items remaining
      </p>
    </div>
  );
}`,rust:`use philjs::prelude::*;

#[derive(Clone)]
struct Todo {
    id: u32,
    text: String,
    done: bool,
}

#[component]
fn TodoList() -> Element {
    let todos = use_signal(|| vec![
        Todo { id: 1, text: "Learn PhilJS".into(), done: true },
        Todo { id: 2, text: "Build an app".into(), done: false },
        Todo { id: 3, text: "Deploy to production".into(), done: false },
    ]);
    let new_todo = use_signal(String::new);

    let remaining = use_memo(move || {
        todos().iter().filter(|t| !t.done).count()
    });

    let add_todo = move |_| {
        let text = new_todo().trim().to_string();
        if !text.is_empty() {
            todos.update(|t| t.push(Todo {
                id: js_sys::Date::now() as u32,
                text,
                done: false,
            }));
            new_todo.set(String::new());
        }
    };

    view! {
        <div class="p-4 max-w-md mx-auto">
            <h1 class="text-2xl font-bold mb-4">"Todo List"</h1>
            <div class="flex gap-2 mb-4">
                <input
                    type="text"
                    prop:value=new_todo
                    on:input=move |e| new_todo.set(event_target_value(&e))
                    placeholder="Add a todo..."
                    class="flex-1 px-3 py-2 border rounded"
                />
                <button
                    on:click=add_todo
                    class="px-4 py-2 bg-blue-500 text-white rounded"
                >
                    "Add"
                </button>
            </div>
            <ul class="space-y-2">
                <For each=move || todos() key=|todo| todo.id>
                    {|todo| view! { <TodoItem todo=todo /> }}
                </For>
            </ul>
            <p class="mt-4 text-sm text-gray-500">
                {remaining} " items remaining"
            </p>
        </div>
    }
}`},fetching:{name:"Data Fetching",typescript:`import { signal, resource } from 'philjs-core';

interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile() {
  const userId = signal(1);

  const user = resource<User>(async () => {
    const res = await fetch(
      \`https://jsonplaceholder.typicode.com/users/\${userId()}\`
    );
    return res.json();
  });

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>

      <div className="flex gap-2 mb-4">
        {[1, 2, 3].map(id => (
          <button
            key={id}
            onClick={() => { userId.set(id); user.refresh(); }}
            className={\`px-3 py-1 rounded \${
              userId() === id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200'
            }\`}
          >
            User {id}
          </button>
        ))}
      </div>

      {user.loading() ? (
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      ) : user.error() ? (
        <div className="text-red-500">
          Error: {user.error()?.message}
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded">
          <h2 className="font-bold">{user().name}</h2>
          <p className="text-gray-600">{user().email}</p>
        </div>
      )}
    </div>
  );
}`,rust:`use philjs::prelude::*;

#[derive(Clone, Deserialize)]
struct User {
    id: u32,
    name: String,
    email: String,
}

#[component]
fn UserProfile() -> Element {
    let user_id = use_signal(|| 1u32);

    let user = use_resource(move || async move {
        let url = format!(
            "https://jsonplaceholder.typicode.com/users/{}",
            user_id()
        );
        reqwest::get(&url).await?.json::<User>().await
    });

    view! {
        <div class="p-4 max-w-md mx-auto">
            <h1 class="text-2xl font-bold mb-4">"User Profile"</h1>

            <div class="flex gap-2 mb-4">
                <For each=|| [1, 2, 3] key=|id| *id>
                    {|id| view! {
                        <button
                            on:click=move |_| user_id.set(id)
                            class=move || format!(
                                "px-3 py-1 rounded {}",
                                if user_id() == id {
                                    "bg-blue-500 text-white"
                                } else {
                                    "bg-gray-200"
                                }
                            )
                        >
                            "User " {id}
                        </button>
                    }}
                </For>
            </div>

            <Suspense fallback=|| view! { <LoadingSkeleton /> }>
                {move || user.read().map(|u| view! {
                    <div class="bg-gray-50 p-4 rounded">
                        <h2 class="font-bold">{u.name}</h2>
                        <p class="text-gray-600">{u.email}</p>
                    </div>
                })}
            </Suspense>
        </div>
    }
}`}};function v({initialCode:e,language:t="typescript",template:s="counter"}){let[n,v]=(0,a.useState)(e||b[s]?.[t]||""),[w,j]=(0,a.useState)(t),[k,N]=(0,a.useState)(s),[C,_]=(0,a.useState)(""),[P,S]=(0,a.useState)(null),[T,Z]=(0,a.useState)(!1),[U,L]=(0,a.useState)(!1),[q,R]=(0,a.useState)("split"),[E,M]=(0,a.useState)("desktop"),D=(0,a.useRef)(null),A=(0,a.useCallback)(async()=>{Z(!0),S(null);try{await new Promise(e=>setTimeout(e,500));let e=`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { font-family: system-ui, sans-serif; }
            </style>
          </head>
          <body>
            <div id="app">
              <div class="p-4 text-center">
                <p class="text-gray-500">Preview would render here</p>
                <p class="text-sm text-gray-400 mt-2">In a full implementation, this would compile and run your ${w} code</p>
              </div>
            </div>
          </body>
        </html>
      `;D.current&&(D.current.srcdoc=e),_("Compiled successfully!")}catch(e){S(e instanceof Error?e.message:"An error occurred")}finally{Z(!1)}},[n,w]),I=(0,a.useCallback)(async()=>{await navigator.clipboard.writeText(n),L(!0),setTimeout(()=>L(!1),2e3)},[n]),G=(0,a.useCallback)(async()=>{let e=`${window.location.origin}/playground?code=${btoa(encodeURIComponent(n))}&lang=${w}`;await navigator.clipboard.writeText(e),alert("Share URL copied to clipboard!")},[n,w]),$=(0,a.useCallback)(e=>{N(e),v(b[e][w])},[w]),z=(0,a.useCallback)(e=>{j(e),v(b[k][e])},[k]),F=(0,a.useCallback)(()=>{let e=new Blob([n],{type:"text/plain"}),t=URL.createObjectURL(e),s=document.createElement("a");s.href=t,s.download=`playground.${"typescript"===w?"tsx":"rs"}`,s.click(),URL.revokeObjectURL(t)},[n,w]);return(0,o.jsxs)("div",{className:"h-[700px] flex flex-col bg-surface-900 rounded-xl overflow-hidden border border-surface-700",children:[(0,o.jsxs)("div",{className:"flex items-center justify-between px-4 py-2 bg-surface-800 border-b border-surface-700",children:[(0,o.jsxs)("div",{className:"flex items-center gap-4",children:[(0,o.jsxs)("div",{className:"relative",children:[o.jsx("select",{value:k,onChange:e=>$(e.target.value),className:"appearance-none bg-surface-700 text-surface-200 text-sm px-3 py-1.5 pr-8 rounded cursor-pointer hover:bg-surface-600 transition-colors",children:Object.entries(b).map(([e,t])=>o.jsx("option",{value:e,children:t.name},e))}),o.jsx(r.Z,{className:"absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none"})]}),(0,o.jsxs)("div",{className:"flex bg-surface-700 rounded p-0.5",children:[o.jsx("button",{onClick:()=>z("typescript"),className:(0,f.Z)("px-3 py-1 text-sm rounded transition-colors","typescript"===w?"bg-primary-600 text-white":"text-surface-400 hover:text-white"),children:"TypeScript"}),o.jsx("button",{onClick:()=>z("rust"),className:(0,f.Z)("px-3 py-1 text-sm rounded transition-colors","rust"===w?"bg-accent-600 text-white":"text-surface-400 hover:text-white"),children:"Rust"})]})]}),(0,o.jsxs)("div",{className:"flex items-center gap-2",children:[(0,o.jsxs)("div",{className:"flex bg-surface-700 rounded p-0.5",children:[o.jsx("button",{onClick:()=>R("code"),className:(0,f.Z)("p-1.5 rounded transition-colors","code"===q?"bg-surface-600 text-white":"text-surface-400 hover:text-white"),title:"Code only",children:o.jsx(i.Z,{className:"w-4 h-4"})}),o.jsx("button",{onClick:()=>R("split"),className:(0,f.Z)("p-1.5 rounded transition-colors","split"===q?"bg-surface-600 text-white":"text-surface-400 hover:text-white"),title:"Split view",children:o.jsx(l,{className:"w-4 h-4"})}),o.jsx("button",{onClick:()=>R("preview"),className:(0,f.Z)("p-1.5 rounded transition-colors","preview"===q?"bg-surface-600 text-white":"text-surface-400 hover:text-white"),title:"Preview only",children:o.jsx(d,{className:"w-4 h-4"})})]}),"code"!==q&&(0,o.jsxs)("div",{className:"flex bg-surface-700 rounded p-0.5",children:[o.jsx("button",{onClick:()=>M("desktop"),className:(0,f.Z)("p-1.5 rounded transition-colors","desktop"===E?"bg-surface-600 text-white":"text-surface-400 hover:text-white"),title:"Desktop",children:o.jsx(c,{className:"w-4 h-4"})}),o.jsx("button",{onClick:()=>M("mobile"),className:(0,f.Z)("p-1.5 rounded transition-colors","mobile"===E?"bg-surface-600 text-white":"text-surface-400 hover:text-white"),title:"Mobile",children:o.jsx(u,{className:"w-4 h-4"})})]}),o.jsx("div",{className:"w-px h-6 bg-surface-600"}),o.jsx("button",{onClick:I,className:"p-2 text-surface-400 hover:text-white transition-colors",title:"Copy code",children:U?o.jsx(p.Z,{className:"w-4 h-4 text-green-400"}):o.jsx(x.Z,{className:"w-4 h-4"})}),o.jsx("button",{onClick:F,className:"p-2 text-surface-400 hover:text-white transition-colors",title:"Download code",children:o.jsx(m,{className:"w-4 h-4"})}),o.jsx("button",{onClick:G,className:"p-2 text-surface-400 hover:text-white transition-colors",title:"Share",children:o.jsx(h,{className:"w-4 h-4"})}),(0,o.jsxs)("button",{onClick:A,disabled:T,className:(0,f.Z)("flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-colors",T?"bg-surface-600 text-surface-400 cursor-not-allowed":"bg-green-600 text-white hover:bg-green-500"),children:[T?o.jsx(g,{className:"w-4 h-4 animate-spin"}):o.jsx(y,{className:"w-4 h-4"}),"Run"]})]})]}),(0,o.jsxs)("div",{className:"flex-1 flex min-h-0",children:["preview"!==q&&(0,o.jsxs)("div",{className:(0,f.Z)("flex flex-col","split"===q?"w-1/2":"w-full"),children:[o.jsx("div",{className:"flex items-center px-4 py-2 bg-surface-800/50 border-b border-surface-700 text-xs text-surface-400",children:(0,o.jsxs)("span",{className:"font-mono",children:["App.","typescript"===w?"tsx":"rs"]})}),o.jsx("div",{className:"flex-1 overflow-auto",children:o.jsx("textarea",{value:n,onChange:e=>v(e.target.value),className:"w-full h-full bg-transparent text-surface-100 font-mono text-sm p-4 resize-none outline-none",spellCheck:!1})})]}),"split"===q&&o.jsx("div",{className:"w-px bg-surface-700"}),"code"!==q&&(0,o.jsxs)("div",{className:(0,f.Z)("flex flex-col bg-white","split"===q?"w-1/2":"w-full"),children:[(0,o.jsxs)("div",{className:"flex items-center justify-between px-4 py-2 bg-surface-100 border-b text-xs text-surface-500",children:[o.jsx("span",{children:"Preview"}),C&&!P&&o.jsx("span",{className:"text-green-600",children:C})]}),o.jsx("div",{className:"flex-1 flex items-start justify-center bg-surface-50 overflow-auto p-4",children:o.jsx("div",{style:{width:{desktop:"100%",tablet:"768px",mobile:"375px"}[E]},className:"bg-white shadow-lg rounded-lg overflow-hidden",children:o.jsx("iframe",{ref:D,className:"w-full h-[500px]",sandbox:"allow-scripts",title:"Preview"})})})]})]}),P&&(0,o.jsxs)("div",{className:"px-4 py-2 bg-red-900/50 border-t border-red-800 text-red-300 text-sm font-mono",children:["Error: ",P]})]})}},706:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>i,metadata:()=>r});var o=s(9015);let a=(0,s(1471).createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Playground.tsx#Playground`),r={title:"Interactive Playground",description:"Try PhilJS in your browser with our interactive playground. Write TypeScript or Rust code and see it run in real-time."};function i(){return(0,o.jsxs)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:[(0,o.jsxs)("div",{className:"mb-8",children:[o.jsx("h1",{className:"text-3xl font-bold text-surface-900 dark:text-white mb-2",children:"Interactive Playground"}),o.jsx("p",{className:"text-lg text-surface-600 dark:text-surface-400",children:"Experiment with PhilJS code in your browser. Choose from example templates or write your own code."})]}),o.jsx(a,{}),(0,o.jsxs)("div",{className:"mt-8 grid md:grid-cols-3 gap-6",children:[(0,o.jsxs)("div",{className:"p-4 bg-surface-50 dark:bg-surface-800 rounded-lg",children:[o.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white mb-2",children:"TypeScript or Rust"}),o.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400",children:"Toggle between TypeScript and Rust to see the same concepts in both languages."})]}),(0,o.jsxs)("div",{className:"p-4 bg-surface-50 dark:bg-surface-800 rounded-lg",children:[o.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white mb-2",children:"Real-Time Preview"}),o.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400",children:"See your changes instantly with hot reloading in the preview panel."})]}),(0,o.jsxs)("div",{className:"p-4 bg-surface-50 dark:bg-surface-800 rounded-lg",children:[o.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white mb-2",children:"Share Your Code"}),o.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400",children:"Generate shareable links to your playground sessions."})]})]})]})}}};var t=require("../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),o=t.X(0,[732,6314],()=>s(9513));module.exports=o})();
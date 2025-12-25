'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Play, RefreshCw, Copy, Check, Share2, ChevronDown, Layout, Code2, Monitor, Smartphone, Maximize2, Download } from 'lucide-react';
import clsx from 'clsx';

interface PlaygroundProps {
  initialCode?: string;
  language?: 'typescript' | 'rust';
  template?: string;
}

const templates = {
  counter: {
    name: 'Counter',
    typescript: `import { signal } from 'philjs-core';

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
}`,
    rust: `use philjs::prelude::*;

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
}`,
  },
  todoList: {
    name: 'Todo List',
    typescript: `import { signal, memo } from 'philjs-core';

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
}`,
    rust: `use philjs::prelude::*;

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
}`,
  },
  fetching: {
    name: 'Data Fetching',
    typescript: `import { signal, resource } from 'philjs-core';

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
}`,
    rust: `use philjs::prelude::*;

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
}`,
  },
};

type TemplateName = keyof typeof templates;

export function Playground({ initialCode, language = 'typescript', template = 'counter' }: PlaygroundProps) {
  const [code, setCode] = useState(initialCode || templates[template as TemplateName]?.[language] || '');
  const [currentLanguage, setCurrentLanguage] = useState<'typescript' | 'rust'>(language);
  const [currentTemplate, setCurrentTemplate] = useState<TemplateName>(template as TemplateName);
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'code' | 'preview'>('split');
  const [deviceSize, setDeviceSize] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setError(null);

    try {
      // In a real implementation, this would compile and run the code
      // For now, we'll just simulate a successful run
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create a simple preview HTML
      const previewHtml = `
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
                <p class="text-sm text-gray-400 mt-2">In a full implementation, this would compile and run your ${currentLanguage} code</p>
              </div>
            </div>
          </body>
        </html>
      `;

      if (iframeRef.current) {
        iframeRef.current.srcdoc = previewHtml;
      }

      setOutput('Compiled successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsRunning(false);
    }
  }, [code, currentLanguage]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/playground?code=${btoa(encodeURIComponent(code))}&lang=${currentLanguage}`;
    await navigator.clipboard.writeText(shareUrl);
    alert('Share URL copied to clipboard!');
  }, [code, currentLanguage]);

  const handleTemplateChange = useCallback((templateName: TemplateName) => {
    setCurrentTemplate(templateName);
    setCode(templates[templateName][currentLanguage]);
  }, [currentLanguage]);

  const handleLanguageChange = useCallback((lang: 'typescript' | 'rust') => {
    setCurrentLanguage(lang);
    setCode(templates[currentTemplate][lang]);
  }, [currentTemplate]);

  const handleExport = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `playground.${currentLanguage === 'typescript' ? 'tsx' : 'rs'}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [code, currentLanguage]);

  // Auto-run on mount
  useEffect(() => {
    handleRun();
  }, []);

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  return (
    <div className="h-[700px] flex flex-col bg-surface-900 rounded-xl overflow-hidden border border-surface-700">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-800 border-b border-surface-700">
        <div className="flex items-center gap-4">
          {/* Template selector */}
          <div className="relative">
            <select
              value={currentTemplate}
              onChange={(e) => handleTemplateChange(e.target.value as TemplateName)}
              className="appearance-none bg-surface-700 text-surface-200 text-sm px-3 py-1.5 pr-8 rounded cursor-pointer hover:bg-surface-600 transition-colors"
            >
              {Object.entries(templates).map(([key, value]) => (
                <option key={key} value={key}>{value.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
          </div>

          {/* Language toggle */}
          <div className="flex bg-surface-700 rounded p-0.5">
            <button
              onClick={() => handleLanguageChange('typescript')}
              className={clsx(
                'px-3 py-1 text-sm rounded transition-colors',
                currentLanguage === 'typescript'
                  ? 'bg-primary-600 text-white'
                  : 'text-surface-400 hover:text-white'
              )}
            >
              TypeScript
            </button>
            <button
              onClick={() => handleLanguageChange('rust')}
              className={clsx(
                'px-3 py-1 text-sm rounded transition-colors',
                currentLanguage === 'rust'
                  ? 'bg-accent-600 text-white'
                  : 'text-surface-400 hover:text-white'
              )}
            >
              Rust
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex bg-surface-700 rounded p-0.5">
            <button
              onClick={() => setViewMode('code')}
              className={clsx(
                'p-1.5 rounded transition-colors',
                viewMode === 'code' ? 'bg-surface-600 text-white' : 'text-surface-400 hover:text-white'
              )}
              title="Code only"
            >
              <Code2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={clsx(
                'p-1.5 rounded transition-colors',
                viewMode === 'split' ? 'bg-surface-600 text-white' : 'text-surface-400 hover:text-white'
              )}
              title="Split view"
            >
              <Layout className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={clsx(
                'p-1.5 rounded transition-colors',
                viewMode === 'preview' ? 'bg-surface-600 text-white' : 'text-surface-400 hover:text-white'
              )}
              title="Preview only"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Device size toggle (preview mode) */}
          {viewMode !== 'code' && (
            <div className="flex bg-surface-700 rounded p-0.5">
              <button
                onClick={() => setDeviceSize('desktop')}
                className={clsx(
                  'p-1.5 rounded transition-colors',
                  deviceSize === 'desktop' ? 'bg-surface-600 text-white' : 'text-surface-400 hover:text-white'
                )}
                title="Desktop"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceSize('mobile')}
                className={clsx(
                  'p-1.5 rounded transition-colors',
                  deviceSize === 'mobile' ? 'bg-surface-600 text-white' : 'text-surface-400 hover:text-white'
                )}
                title="Mobile"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="w-px h-6 bg-surface-600" />

          {/* Action buttons */}
          <button
            onClick={handleCopy}
            className="p-2 text-surface-400 hover:text-white transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleExport}
            className="p-2 text-surface-400 hover:text-white transition-colors"
            title="Download code"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleShare}
            className="p-2 text-surface-400 hover:text-white transition-colors"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className={clsx(
              'flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-colors',
              isRunning
                ? 'bg-surface-600 text-surface-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-500'
            )}
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Code editor */}
        {viewMode !== 'preview' && (
          <div className={clsx('flex flex-col', viewMode === 'split' ? 'w-1/2' : 'w-full')}>
            <div className="flex items-center px-4 py-2 bg-surface-800/50 border-b border-surface-700 text-xs text-surface-400">
              <span className="font-mono">
                App.{currentLanguage === 'typescript' ? 'tsx' : 'rs'}
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full bg-transparent text-surface-100 font-mono text-sm p-4 resize-none outline-none"
                spellCheck={false}
              />
            </div>
          </div>
        )}

        {/* Divider */}
        {viewMode === 'split' && (
          <div className="w-px bg-surface-700" />
        )}

        {/* Preview */}
        {viewMode !== 'code' && (
          <div className={clsx('flex flex-col bg-white', viewMode === 'split' ? 'w-1/2' : 'w-full')}>
            <div className="flex items-center justify-between px-4 py-2 bg-surface-100 border-b text-xs text-surface-500">
              <span>Preview</span>
              {output && !error && (
                <span className="text-green-600">{output}</span>
              )}
            </div>
            <div className="flex-1 flex items-start justify-center bg-surface-50 overflow-auto p-4">
              <div
                style={{ width: deviceWidths[deviceSize] }}
                className="bg-white shadow-lg rounded-lg overflow-hidden"
              >
                <iframe
                  ref={iframeRef}
                  className="w-full h-[500px]"
                  sandbox="allow-scripts"
                  title="Preview"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Console */}
      {error && (
        <div className="px-4 py-2 bg-red-900/50 border-t border-red-800 text-red-300 text-sm font-mono">
          Error: {error}
        </div>
      )}
    </div>
  );
}

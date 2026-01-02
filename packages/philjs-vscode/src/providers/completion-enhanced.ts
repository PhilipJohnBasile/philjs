/**
 * PhilJS VS Code - Enhanced Completion Provider
 */

import * as vscode from 'vscode';

export class PhilJSCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    const linePrefix = document.lineAt(position).text.substring(0, position.character);

    // PhilJS Core completions
    if (this.isPhilJSContext(document, position)) {
      return this.getPhilJSCompletions(linePrefix, document, position);
    }

    // JSX completions
    if (context.triggerCharacter === '<') {
      return this.getJSXCompletions();
    }

    // Import completions
    if (linePrefix.includes('import') && linePrefix.includes('from')) {
      return this.getImportCompletions();
    }

    return [];
  }

  private isPhilJSContext(document: vscode.TextDocument, position: vscode.Position): boolean {
    const text = document.getText();
    return text.includes('@philjs/core') ||
           text.includes('philjs-router') ||
           text.includes('philjs-ssr') ||
           text.includes('philjs');
  }

  private getPhilJSCompletions(
    linePrefix: string,
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] {
    const completions: vscode.CompletionItem[] = [];

    // Signal completions
    completions.push(
      this.createCompletion(
        'signal',
        'Create a reactive signal',
        'const ${1:name} = signal(${2:initialValue});',
        vscode.CompletionItemKind.Function,
        'Creates a reactive signal that triggers updates when its value changes.'
      ),
    );

    // Check if we're accessing a signal (has a dot before)
    if (linePrefix.endsWith('.')) {
      completions.push(
        this.createCompletion('get', 'Get signal value', 'get()', vscode.CompletionItemKind.Method, 'Returns the current value of the signal'),
        this.createCompletion('set', 'Set signal value', 'set(${1:value})', vscode.CompletionItemKind.Method, 'Sets a new value for the signal'),
        this.createCompletion('update', 'Update signal with function', 'update(prev => ${1:prev})', vscode.CompletionItemKind.Method, 'Updates the signal using a function'),
        this.createCompletion('subscribe', 'Subscribe to changes', 'subscribe((value) => {\n\t${1:// handle change}\n})', vscode.CompletionItemKind.Method, 'Subscribe to signal changes'),
      );
    }

    // Computed completions
    completions.push(
      this.createCompletion(
        'computed',
        'Create a computed value',
        'const ${1:name} = computed(() => ${2:expression});',
        vscode.CompletionItemKind.Function,
        'Creates a derived value that automatically updates when dependencies change.'
      ),
    );

    // Effect completions
    completions.push(
      this.createCompletion(
        'effect',
        'Create a side effect',
        'effect(() => {\n\t${1:// side effect}\n});',
        vscode.CompletionItemKind.Function,
        'Runs a side effect whenever its reactive dependencies change.'
      ),
      this.createCompletion(
        'effect-cleanup',
        'Effect with cleanup',
        'effect(() => {\n\t${1:// side effect}\n\n\treturn () => {\n\t\t${2:// cleanup}\n\t};\n});',
        vscode.CompletionItemKind.Function,
        'Creates an effect with a cleanup function.'
      ),
    );

    // Lifecycle completions
    completions.push(
      this.createCompletion(
        'onMount',
        'Run on component mount',
        'onMount(() => {\n\t${1:// mount logic}\n});',
        vscode.CompletionItemKind.Function,
        'Runs a callback when the component is mounted.'
      ),
      this.createCompletion(
        'onCleanup',
        'Run on cleanup',
        'onCleanup(() => {\n\t${1:// cleanup logic}\n});',
        vscode.CompletionItemKind.Function,
        'Registers a cleanup function.'
      ),
      this.createCompletion(
        'onError',
        'Handle errors',
        'onError((error) => {\n\t${1:// error handling}\n});',
        vscode.CompletionItemKind.Function,
        'Handles errors in the component.'
      ),
    );

    // Memo completions
    completions.push(
      this.createCompletion(
        'memo',
        'Memoize a component',
        'const ${1:ComponentName} = memo((${2:props}) => {\n\treturn (\n\t\t${3:<div></div>}\n\t);\n});',
        vscode.CompletionItemKind.Function,
        'Memoizes a component to prevent unnecessary re-renders.'
      ),
    );

    // Context completions
    completions.push(
      this.createCompletion(
        'createContext',
        'Create a context',
        'const ${1:Name}Context = createContext<${2:Type} | null>(null);',
        vscode.CompletionItemKind.Function,
        'Creates a context for passing data through the component tree.'
      ),
      this.createCompletion(
        'useContext',
        'Use a context',
        'const ${1:value} = useContext(${2:Context});',
        vscode.CompletionItemKind.Function,
        'Accesses the value of a context.'
      ),
    );

    // Router completions
    completions.push(
      this.createCompletion(
        'useNavigate',
        'Navigate programmatically',
        'const navigate = useNavigate();\nnavigate(\'${1:/path}\');',
        vscode.CompletionItemKind.Function,
        'Returns a function to navigate programmatically.'
      ),
      this.createCompletion(
        'useParams',
        'Get route parameters',
        'const { ${1:id} } = useParams();',
        vscode.CompletionItemKind.Function,
        'Returns the route parameters.'
      ),
      this.createCompletion(
        'useSearchParams',
        'Get search parameters',
        'const [searchParams, setSearchParams] = useSearchParams();',
        vscode.CompletionItemKind.Function,
        'Returns search parameters and a setter.'
      ),
      this.createCompletion(
        'useLoaderData',
        'Get loader data',
        'const data = useLoaderData<typeof loader>();',
        vscode.CompletionItemKind.Function,
        'Returns data from the route loader.'
      ),
      this.createCompletion(
        'useLocation',
        'Get current location',
        'const location = useLocation();',
        vscode.CompletionItemKind.Function,
        'Returns the current location object.'
      ),
    );

    // SSR completions
    completions.push(
      this.createCompletion(
        'renderToString',
        'Render to HTML string',
        'const html = await renderToString(<${1:App} />);',
        vscode.CompletionItemKind.Function,
        'Renders a component to an HTML string for SSR.'
      ),
      this.createCompletion(
        'hydrate',
        'Hydrate on client',
        'hydrate(document.getElementById(\'${1:root}\')!, <${2:App} />);',
        vscode.CompletionItemKind.Function,
        'Hydrates a server-rendered component on the client.'
      ),
    );

    // Island completions
    completions.push(
      this.createCompletion(
        'island',
        'Create an island component',
        'export default island(function ${1:ComponentName}() {\n\t${2:// interactive logic}\n\treturn <div>${3}</div>;\n});',
        vscode.CompletionItemKind.Function,
        'Creates an interactive island component for partial hydration.'
      ),
    );

    // Form completions
    completions.push(
      this.createCompletion(
        'useFormData',
        'Get form data',
        'const formData = useFormData();',
        vscode.CompletionItemKind.Function,
        'Returns the submitted form data.'
      ),
      this.createCompletion(
        'useActionData',
        'Get action data',
        'const data = useActionData<typeof action>();',
        vscode.CompletionItemKind.Function,
        'Returns data from the form action.'
      ),
    );

    return completions;
  }

  private getJSXCompletions(): vscode.CompletionItem[] {
    return [
      // PhilJS UI Components
      this.createCompletion(
        'Button',
        'PhilJS UI Button',
        '<Button ${1|onClick,variant,size|}={${2}}>${3}</Button>',
        vscode.CompletionItemKind.Class,
        'A customizable button component.'
      ),
      this.createCompletion(
        'Input',
        'PhilJS UI Input',
        '<Input\n\tplaceholder="${1}"\n\tvalue={${2}}\n\tonChange={${3}}\n/>',
        vscode.CompletionItemKind.Class,
        'A text input component.'
      ),
      this.createCompletion(
        'Select',
        'PhilJS UI Select',
        '<Select\n\toptions={${1}}\n\tvalue={${2}}\n\tonChange={${3}}\n/>',
        vscode.CompletionItemKind.Class,
        'A select dropdown component.'
      ),
      this.createCompletion(
        'Modal',
        'PhilJS UI Modal',
        '<Modal isOpen={${1}} onClose={${2}}>\n\t${3}\n</Modal>',
        vscode.CompletionItemKind.Class,
        'A modal dialog component.'
      ),
      this.createCompletion(
        'Card',
        'PhilJS UI Card',
        '<Card>\n\t${1}\n</Card>',
        vscode.CompletionItemKind.Class,
        'A card container component.'
      ),
      this.createCompletion(
        'Alert',
        'PhilJS UI Alert',
        '<Alert status="${1|info,success,warning,error|}">\n\t${2}\n</Alert>',
        vscode.CompletionItemKind.Class,
        'An alert message component.'
      ),
      this.createCompletion(
        'Tabs',
        'PhilJS UI Tabs',
        '<Tabs defaultValue="${1}">\n\t<TabList>\n\t\t<Tab value="${1}">${2}</Tab>\n\t</TabList>\n\t<TabPanels>\n\t\t<TabPanel value="${1}">${3}</TabPanel>\n\t</TabPanels>\n</Tabs>',
        vscode.CompletionItemKind.Class,
        'A tabs component with panels.'
      ),

      // PhilJS Router Components
      this.createCompletion(
        'Link',
        'PhilJS Router Link',
        '<Link to="${1}">${2}</Link>',
        vscode.CompletionItemKind.Class,
        'A client-side navigation link.'
      ),
      this.createCompletion(
        'Route',
        'PhilJS Route',
        '<Route path="${1}" element={<${2} />} />',
        vscode.CompletionItemKind.Class,
        'Defines a route in the application.'
      ),
      this.createCompletion(
        'Routes',
        'PhilJS Routes Container',
        '<Routes>\n\t<Route path="${1}" element={<${2} />} />\n</Routes>',
        vscode.CompletionItemKind.Class,
        'Container for route definitions.'
      ),
      this.createCompletion(
        'Outlet',
        'PhilJS Router Outlet',
        '<Outlet />',
        vscode.CompletionItemKind.Class,
        'Renders child routes.'
      ),

      // PhilJS Meta Components
      this.createCompletion(
        'Head',
        'PhilJS Meta Head',
        '<Head>\n\t<Title>${1}</Title>\n\t<Meta name="description" content="${2}" />\n</Head>',
        vscode.CompletionItemKind.Class,
        'Contains meta tags for SEO.'
      ),
      this.createCompletion(
        'Title',
        'PhilJS Meta Title',
        '<Title>${1}</Title>',
        vscode.CompletionItemKind.Class,
        'Sets the page title.'
      ),
      this.createCompletion(
        'Meta',
        'PhilJS Meta Tag',
        '<Meta name="${1}" content="${2}" />',
        vscode.CompletionItemKind.Class,
        'Adds a meta tag to the head.'
      ),

      // Error Boundary
      this.createCompletion(
        'ErrorBoundary',
        'PhilJS Error Boundary',
        '<ErrorBoundary fallback={<${1} />}>\n\t${2}\n</ErrorBoundary>',
        vscode.CompletionItemKind.Class,
        'Catches errors in child components.'
      ),

      // Suspense
      this.createCompletion(
        'Suspense',
        'PhilJS Suspense',
        '<Suspense fallback={<${1} />}>\n\t${2}\n</Suspense>',
        vscode.CompletionItemKind.Class,
        'Shows a fallback while loading.'
      ),
    ];
  }

  private getImportCompletions(): vscode.CompletionItem[] {
    return [
      this.createCompletion(
        '@philjs/core',
        'Import from @philjs/core',
        'import { ${1:signal, computed, effect} } from \'@philjs/core\';',
        vscode.CompletionItemKind.Module,
        'Core reactive primitives.'
      ),
      this.createCompletion(
        'philjs-router',
        'Import from philjs-router',
        'import { ${1:Link, Route, useNavigate} } from \'philjs-router\';',
        vscode.CompletionItemKind.Module,
        'Routing utilities and components.'
      ),
      this.createCompletion(
        'philjs-ssr',
        'Import from philjs-ssr',
        'import { ${1:renderToString, hydrate} } from \'philjs-ssr\';',
        vscode.CompletionItemKind.Module,
        'Server-side rendering utilities.'
      ),
      this.createCompletion(
        'philjs-ui',
        'Import from philjs-ui',
        'import { ${1:Button, Input, Card} } from \'philjs-ui\';',
        vscode.CompletionItemKind.Module,
        'UI component library.'
      ),
      this.createCompletion(
        'philjs-meta',
        'Import from philjs-meta',
        'import { ${1:Head, Title, Meta} } from \'philjs-meta\';',
        vscode.CompletionItemKind.Module,
        'SEO and meta tag components.'
      ),
      this.createCompletion(
        'philjs-islands',
        'Import from philjs-islands',
        'import { ${1:island} } from \'philjs-islands\';',
        vscode.CompletionItemKind.Module,
        'Island architecture utilities.'
      ),
    ];
  }

  private createCompletion(
    label: string,
    detail: string,
    insertText: string,
    kind: vscode.CompletionItemKind,
    documentation?: string
  ): vscode.CompletionItem {
    const completion = new vscode.CompletionItem(label, kind);
    completion.detail = detail;
    completion.insertText = new vscode.SnippetString(insertText);

    const markdown = new vscode.MarkdownString();
    markdown.appendMarkdown(`**${label}**\n\n${detail}`);
    if (documentation) {
      markdown.appendMarkdown(`\n\n${documentation}`);
    }
    markdown.appendCodeblock(insertText, 'typescript');

    completion.documentation = markdown;
    return completion;
  }

  resolveCompletionItem?(
    item: vscode.CompletionItem,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CompletionItem> {
    // Add more detailed documentation when item is selected
    return item;
  }
}

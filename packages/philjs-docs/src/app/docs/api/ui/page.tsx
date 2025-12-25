import { Metadata } from 'next';
import { CodeBlock } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'philjs-ui Component Library',
  description: 'Pre-built, accessible UI components for PhilJS applications.',
};

export default function UIAPIPage() {
  return (
    <div className="mdx-content">
      <h1>philjs-ui Component Library</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        A collection of accessible, customizable UI components built for PhilJS.
        All components are unstyled by default and designed to be styled with Tailwind CSS.
      </p>

      <h2 id="installation">Installation</h2>

      <CodeBlock
        code={`pnpm add philjs-ui`}
        language="bash"
      />

      <h2 id="components">Components</h2>

      <div className="space-y-8">
        <ComponentDoc
          name="Button"
          description="A flexible button component with multiple variants and sizes."
          example={`import { Button } from 'philjs-ui';

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
}`}
          props={[
            { name: 'variant', type: '"primary" | "secondary" | "outline" | "ghost" | "destructive"', default: '"primary"' },
            { name: 'size', type: '"sm" | "md" | "lg"', default: '"md"' },
            { name: 'loading', type: 'boolean', default: 'false' },
            { name: 'disabled', type: 'boolean', default: 'false' },
            { name: 'asChild', type: 'boolean', default: 'false' },
          ]}
        />

        <ComponentDoc
          name="Input"
          description="Text input with label, error state, and description support."
          example={`import { Input } from 'philjs-ui';

function Example() {
  return (
    <>
      <Input label="Email" type="email" placeholder="you@example.com" />
      <Input label="Password" type="password" error="Password is required" />
      <Input label="Bio" description="Tell us about yourself" />
      <Input disabled value="Read only" />
    </>
  );
}`}
          props={[
            { name: 'label', type: 'string' },
            { name: 'error', type: 'string' },
            { name: 'description', type: 'string' },
            { name: 'type', type: 'string', default: '"text"' },
          ]}
        />

        <ComponentDoc
          name="Select"
          description="Accessible dropdown select with search and multi-select support."
          example={`import { Select } from 'philjs-ui';

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
}`}
          props={[
            { name: 'options', type: 'Array<{ value: string; label: string }>' },
            { name: 'value', type: 'string' },
            { name: 'onChange', type: '(value: string) => void' },
            { name: 'label', type: 'string' },
            { name: 'placeholder', type: 'string' },
            { name: 'searchable', type: 'boolean', default: 'false' },
            { name: 'multiple', type: 'boolean', default: 'false' },
          ]}
        />

        <ComponentDoc
          name="Dialog"
          description="Modal dialog with focus trap and keyboard navigation."
          example={`import { Dialog, Button } from 'philjs-ui';
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
}`}
          props={[
            { name: 'open', type: 'boolean' },
            { name: 'onClose', type: '() => void' },
            { name: 'initialFocus', type: 'RefObject<HTMLElement>' },
          ]}
        />

        <ComponentDoc
          name="Tabs"
          description="Accessible tabbed interface with keyboard navigation."
          example={`import { Tabs } from 'philjs-ui';

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
}`}
          props={[
            { name: 'defaultValue', type: 'string' },
            { name: 'value', type: 'string' },
            { name: 'onChange', type: '(value: string) => void' },
            { name: 'orientation', type: '"horizontal" | "vertical"', default: '"horizontal"' },
          ]}
        />

        <ComponentDoc
          name="Accordion"
          description="Collapsible content sections."
          example={`import { Accordion } from 'philjs-ui';

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
}`}
          props={[
            { name: 'type', type: '"single" | "multiple"', default: '"single"' },
            { name: 'collapsible', type: 'boolean', default: 'false' },
            { name: 'defaultValue', type: 'string | string[]' },
          ]}
        />

        <ComponentDoc
          name="Toast"
          description="Non-blocking notification messages."
          example={`import { toast, Toaster } from 'philjs-ui';

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
}`}
          props={[
            { name: 'position', type: '"top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"', default: '"bottom-right"' },
            { name: 'duration', type: 'number', default: '4000' },
          ]}
        />

        <ComponentDoc
          name="Tooltip"
          description="Contextual information on hover or focus."
          example={`import { Tooltip, Button } from 'philjs-ui';

function Example() {
  return (
    <Tooltip content="This is helpful information">
      <Button>Hover me</Button>
    </Tooltip>
  );
}`}
          props={[
            { name: 'content', type: 'string | JSX.Element' },
            { name: 'side', type: '"top" | "right" | "bottom" | "left"', default: '"top"' },
            { name: 'delay', type: 'number', default: '200' },
          ]}
        />

        <ComponentDoc
          name="Dropdown"
          description="Dropdown menu with keyboard navigation."
          example={`import { Dropdown, Button } from 'philjs-ui';

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
}`}
          props={[
            { name: 'align', type: '"start" | "center" | "end"', default: '"start"' },
            { name: 'side', type: '"top" | "right" | "bottom" | "left"', default: '"bottom"' },
          ]}
        />
      </div>

      <h2 id="theming">Theming</h2>

      <p>
        philjs-ui uses CSS variables for theming. Override these in your CSS to customize:
      </p>

      <CodeBlock
        code={`:root {
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
}`}
        language="css"
        filename="globals.css"
      />

      <h2 id="accessibility">Accessibility</h2>

      <Callout type="info" title="WCAG Compliant">
        All philjs-ui components are built with accessibility in mind:
        <ul className="mt-2 list-disc ml-4">
          <li>Proper ARIA attributes</li>
          <li>Keyboard navigation support</li>
          <li>Focus management</li>
          <li>Screen reader compatible</li>
          <li>Color contrast compliant</li>
        </ul>
      </Callout>

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/guides/styling"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Styling Guide</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Learn how to customize component styles
          </p>
        </Link>

        <Link
          href="/examples"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Examples</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            See components in action
          </p>
        </Link>
      </div>
    </div>
  );
}

interface ComponentDocProps {
  name: string;
  description: string;
  example: string;
  props: Array<{ name: string; type: string; default?: string }>;
}

function ComponentDoc({ name, description, example, props }: ComponentDocProps) {
  return (
    <div className="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
      <div className="p-4 bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700">
        <h3 id={name.toLowerCase()} className="text-xl font-semibold text-primary-600 dark:text-primary-400 scroll-mt-20">
          {name}
        </h3>
        <p className="text-surface-600 dark:text-surface-400 mt-1">{description}</p>
      </div>

      <div className="p-4">
        <h4 className="font-semibold text-surface-900 dark:text-white mb-2">Example</h4>
        <CodeBlock code={example} language="typescript" />

        <h4 className="font-semibold text-surface-900 dark:text-white mt-4 mb-2">Props</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700">
                <th className="text-left py-2 font-medium">Prop</th>
                <th className="text-left py-2 font-medium">Type</th>
                <th className="text-left py-2 font-medium">Default</th>
              </tr>
            </thead>
            <tbody>
              {props.map((prop) => (
                <tr key={prop.name} className="border-b border-surface-100 dark:border-surface-800">
                  <td className="py-2">
                    <code className="text-accent-600 dark:text-accent-400">{prop.name}</code>
                  </td>
                  <td className="py-2">
                    <code className="text-surface-500 text-xs">{prop.type}</code>
                  </td>
                  <td className="py-2 text-surface-500">
                    {prop.default || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

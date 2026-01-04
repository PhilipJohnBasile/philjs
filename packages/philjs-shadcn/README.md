# @philjs/shadcn

Native shadcn/ui components for PhilJS - beautiful, accessible components built with signals.

## Installation

```bash
npm install @philjs/shadcn
```

## Usage

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '@philjs/shadcn';
import { signal } from '@philjs/core';

function LoginForm() {
  const email = signal('');
  const password = signal('');
  const loading = signal(false);

  const handleSubmit = async () => {
    loading.set(true);
    await login(email(), password());
    loading.set(false);
  };

  return (
    <Card class="w-[400px]">
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onInput={(v) => email.set(v)}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onInput={(v) => password.set(v)}
        />
        <Button
          variant="default"
          loading={loading}
          onClick={handleSubmit}
        >
          Sign In
        </Button>
      </CardContent>
    </Card>
  );
}
```

## Components

### UI Components
- `Button` - Buttons with variants (default, destructive, outline, secondary, ghost, link)
- `Input` - Text input with signal binding
- `Card` - Card container with Header, Title, Description, Content, Footer
- `Dialog` - Modal dialogs with trigger, content, and close

### Form Components
- `Label` - Form labels with required indicator
- `Textarea` - Multi-line text input
- `Checkbox` - Checkbox with signal binding
- `Select` - Dropdown select with options

## Theming

Components use CSS variables for theming. Add these to your CSS:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}
```

## License

MIT

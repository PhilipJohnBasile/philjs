# @philjs/email

Email template components for building responsive, cross-client compatible emails with React. Write emails using familiar React patterns and render to HTML.

## Installation

```bash
npm install @philjs/email
# or
yarn add @philjs/email
# or
pnpm add @philjs/email
```

## Basic Usage

```tsx
import { Email, Container, Heading, Text, Button, render } from '@philjs/email';

function WelcomeEmail({ name }) {
  return (
    <Email preview="Welcome to our platform!">
      <Container>
        <Heading>Welcome, {name}!</Heading>
        <Text>Thanks for signing up. Get started by clicking below.</Text>
        <Button href="https://example.com/dashboard">
          Go to Dashboard
        </Button>
      </Container>
    </Email>
  );
}

// Render to HTML string
const html = render(<WelcomeEmail name="John" />);
```

## Features

- **React Components** - Build emails with familiar React patterns
- **Cross-Client Compatible** - Works in Gmail, Outlook, Apple Mail, and more
- **Responsive Design** - Mobile-friendly email layouts
- **Preview Text** - Control inbox preview snippets
- **Inline Styles** - Automatic CSS inlining for compatibility
- **Dark Mode** - Support for dark mode email clients
- **Components Library** - Pre-built components for common patterns
- **Template System** - Reusable email templates
- **Testing** - Preview and test emails locally
- **TypeScript** - Full type safety for email props

## Components

| Component | Description |
|-----------|-------------|
| `Email` | Root email container |
| `Container` | Centered content wrapper |
| `Section` | Content section |
| `Row` / `Column` | Layout grid |
| `Heading` | Email headings (h1-h6) |
| `Text` | Paragraph text |
| `Button` | Call-to-action buttons |
| `Image` | Responsive images |
| `Link` | Styled links |
| `Divider` | Horizontal divider |

## Sending Emails

```typescript
import { render } from '@philjs/email';
import nodemailer from 'nodemailer';

const html = render(<WelcomeEmail name="John" />);
await transporter.sendMail({ to, subject, html });
```

## License

MIT

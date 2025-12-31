# Examples

Explore complete, production-ready examples showcasing PhilJS features and patterns. Each example includes live preview, source code, and deployment instructions.

## Beginner Examples

### Counter App
**Difficulty**: Beginner | **Topics**: Signals, Event Handling

A simple counter demonstrating PhilJS signals and reactivity. Perfect first example for learning the basics.

```typescript
import { signal } from '@philjs/core';

function Counter() {
  const count = signal(0);

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(count() + 1)}>
        Increment
      </button>
    </div>
  );
}
```

**[View Source](https://github.com/philjs/philjs/tree/main/examples/counter)** | **[Live Demo](https://philjs-counter.vercel.app)**

---

### Todo List
**Difficulty**: Beginner | **Topics**: Signals, Lists, Forms

Classic todo app with add, complete, and delete functionality. Demonstrates list rendering and state management.

**Features**:
- Add new todos
- Mark as complete
- Delete todos
- Filter by status
- Persist to localStorage

**[View Source](https://github.com/philjs/philjs/tree/main/examples/todo-app)** | **[Live Demo](https://philjs-todos.vercel.app)**

---

## Intermediate Examples

### Blog with Static Generation
**Difficulty**: Intermediate | **Topics**: SSG, Routing, Markdown

Static blog with markdown support, code highlighting, and RSS feed. Shows how to build content-heavy sites with PhilJS.

**Features**:
- Markdown-based posts
- Syntax highlighting
- Category/tag filtering
- RSS feed
- SEO optimized
- Static generation for performance

**[View Source](https://github.com/philjs/philjs/tree/main/examples/blog-ssg)** | **[Live Demo](https://philjs-blog.vercel.app)**

---

### E-commerce Storefront
**Difficulty**: Intermediate | **Topics**: Data Fetching, Forms, State

Product catalog with cart, checkout, and payment integration. Demonstrates real-world e-commerce patterns.

**Features**:
- Product listing with filters
- Shopping cart with persistence
- Checkout flow
- Payment integration
- Order history
- Responsive design

**[View Source](https://github.com/philjs/philjs/tree/main/examples/storefront)** | **[Live Demo](https://philjs-store.vercel.app)**

---

### Real-time Chat
**Difficulty**: Intermediate | **Topics**: WebSockets, Real-time, Authentication

Chat application with real-time messaging, user presence, and typing indicators.

**Features**:
- Real-time messaging with WebSockets
- User authentication
- Typing indicators
- Online/offline status
- Message history
- Emoji support

**[View Source](https://github.com/philjs/philjs/tree/main/examples/chat-app)** | **[Live Demo](https://philjs-chat.vercel.app)**

---

## Advanced Examples

### Dashboard with Analytics
**Difficulty**: Advanced | **Topics**: Charts, Real-time Data, Islands

Interactive analytics dashboard with charts, filters, and real-time updates. Shows performance optimization with islands architecture.

**Features**:
- Multiple chart types
- Real-time data updates
- Date range filters
- Export functionality
- Islands for interactivity
- Optimized bundle size

**[View Source](https://github.com/philjs/philjs/tree/main/examples/dashboard)** | **[Live Demo](https://@philjs/dashboard.vercel.app)**

---

### Multi-tenant SaaS Template
**Difficulty**: Advanced | **Topics**: SSR, Authentication, Database, Multi-tenancy

Complete SaaS application template with authentication, organization management, and billing.

**Features**:
- User authentication (email, OAuth)
- Organization/team management
- Role-based access control
- Subscription billing
- Admin panel
- Server-side rendering
- Database integration

**[View Source](https://github.com/philjs/philjs/tree/main/examples/saas-template)** | **[Live Demo](https://philjs-saas.vercel.app)**

---

## Example Categories

### By Topic

- **Signals & Reactivity**: Counter, Todo List
- **Routing**: Blog, Storefront, SaaS Template
- **Data Fetching**: Storefront, Dashboard, Chat
- **Forms**: Todo List, Storefront, SaaS Template
- **SSR/SSG**: Blog, SaaS Template
- **Real-time**: Chat, Dashboard
- **Islands**: Dashboard

### By Stack

- **Minimal**: Counter, Todo List
- **Full-stack**: Storefront, Chat, SaaS Template
- **Static**: Blog
- **Database**: Storefront, Chat, SaaS Template

## Running Examples Locally

Clone the repository and run any example:

```bash
git clone https://github.com/philjs/philjs.git
cd philjs/examples/[example-name]
npm install
npm run dev
```

## Contributing Examples

Have a great example to share? We welcome contributions!

1. Fork the repository
2. Create your example in `/examples/your-example`
3. Include README with setup instructions
4. Submit a pull request

**[Contribute an Example](https://github.com/philjs/philjs/blob/main/CONTRIBUTING.md)**

## Community Examples

Check out examples created by the community:

- **[PhilJS Starter Kit](https://github.com/community/philjs-starter)** - Opinionated starter with Tailwind, ESLint, Prettier
- **[PhilJS + Supabase](https://github.com/community/philjs-supabase)** - Integration with Supabase for auth and database
- **[PhilJS E-learning Platform](https://github.com/community/philjs-learning)** - Course platform with video, quizzes, progress tracking

**[Submit Your Example](https://github.com/philjs/philjs/discussions/new?category=show-and-tell)**

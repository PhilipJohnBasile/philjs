# PhilJS Video Tutorial Scripts

This directory contains scripts and outlines for PhilJS video tutorials.

## Tutorial Series

### 1. Getting Started with PhilJS (10 min)
**File:** `01-getting-started.md`

**Outline:**
1. What is PhilJS? (1 min)
   - Reactive, lightweight, modern framework
   - Fine-grained reactivity with signals
   - No virtual DOM overhead

2. Installation (2 min)
   ```bash
   npx create-philjs my-app
   cd my-app
   npm run dev
   ```

3. Project Structure (2 min)
   - `/src` - Source code
   - `/routes` - File-based routing
   - `/components` - Reusable components

4. Your First Component (3 min)
   - Creating a signal
   - Binding to the DOM
   - Handling events

5. Next Steps (2 min)
   - Links to docs
   - Community resources

---

### 2. Signals Deep Dive (15 min)
**File:** `02-signals.md`

**Outline:**
1. What are Signals? (2 min)
   - Reactive primitives
   - Fine-grained updates
   - No re-renders of entire components

2. Creating Signals (3 min)
   ```typescript
   const count = signal(0);
   count(); // Read
   count.set(1); // Write
   ```

3. Computed Values (3 min)
   ```typescript
   const doubled = computed(() => count() * 2);
   ```

4. Effects (4 min)
   ```typescript
   effect(() => {
     console.log('Count changed:', count());
   });
   ```

5. Best Practices (3 min)
   - When to use signals vs props
   - Avoiding infinite loops
   - Cleanup in effects

---

### 3. Routing in PhilJS (12 min)
**File:** `03-routing.md`

**Outline:**
1. File-based Routing (2 min)
   - `/routes/index.tsx` → `/`
   - `/routes/about.tsx` → `/about`
   - `/routes/users/[id].tsx` → `/users/:id`

2. Navigation (3 min)
   - `<Link>` component
   - `navigate()` function
   - Programmatic navigation

3. Route Parameters (2 min)
   - Dynamic routes `[id]`
   - Catch-all routes `[...slug]`
   - Query parameters

4. Loaders & Actions (3 min)
   - Data fetching with loaders
   - Form handling with actions

5. Layouts (2 min)
   - Nested layouts
   - Shared state

---

### 4. Building a Todo App (20 min)
**File:** `04-todo-app.md`

**Outline:**
1. Project Setup (2 min)
2. Creating the Todo Store (3 min)
3. Todo List Component (4 min)
4. Adding Todos (3 min)
5. Completing Todos (3 min)
6. Filtering Todos (3 min)
7. Persisting to LocalStorage (2 min)

---

### 5. API Routes & Full-Stack (18 min)
**File:** `05-api-routes.md`

**Outline:**
1. Creating API Routes (3 min)
2. Handling Different Methods (3 min)
3. Request/Response Helpers (3 min)
4. Database Integration (4 min)
5. Authentication (3 min)
6. Error Handling (2 min)

---

### 6. Deployment Guide (15 min)
**File:** `06-deployment.md`

**Outline:**
1. Building for Production (2 min)
2. Deploying to Vercel (3 min)
3. Deploying to Netlify (3 min)
4. Deploying to Cloudflare (3 min)
5. Docker Deployment (4 min)

---

### 7. Advanced Patterns (20 min)
**File:** `07-advanced.md`

**Outline:**
1. Context & Dependency Injection (4 min)
2. Custom Hooks (4 min)
3. Performance Optimization (4 min)
4. Server-Side Rendering (4 min)
5. Testing Components (4 min)

---

### 8. Building a SaaS Dashboard (45 min)
**File:** `08-saas-dashboard.md`

**Outline:**
1. Project Setup & Architecture (5 min)
2. Authentication with Auth.js (8 min)
3. Database with Prisma (7 min)
4. Dashboard Layout (5 min)
5. Charts & Data Visualization (7 min)
6. User Management (6 min)
7. Deployment & CI/CD (7 min)

---

## Recording Guidelines

### Equipment
- Microphone: Blue Yeti or equivalent
- Screen recording: OBS Studio
- Resolution: 1920x1080 @ 60fps
- Audio: 48kHz, mono

### Style Guide
- Code font: JetBrains Mono, 16px
- Terminal theme: One Dark
- Editor: VS Code with PhilJS extension
- Browser: Chrome with DevTools open

### Best Practices
1. Write code live, don't paste
2. Explain as you type
3. Make mistakes and fix them (shows debugging)
4. Keep videos under 20 minutes when possible
5. Include timestamps in description

### Intro/Outro Template
```
[INTRO - 5 seconds]
PhilJS logo animation

[CONTENT]
Main tutorial content

[OUTRO - 10 seconds]
"Thanks for watching! Subscribe for more PhilJS tutorials."
Links to docs, Discord, GitHub
```

---

## Video Descriptions Template

```
Learn [TOPIC] with PhilJS!

In this video:
- [Point 1]
- [Point 2]
- [Point 3]

⏱️ Timestamps:
00:00 Introduction
[...]

📚 Resources:
- Docs: https://philjs.dev/docs
- GitHub: https://github.com/philjs/philjs
- Discord: https://discord.gg/philjs

#PhilJS #WebDev #TypeScript
```

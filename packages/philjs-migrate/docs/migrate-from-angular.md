# Migrating from Angular to PhilJS

This guide helps you migrate Angular applications to PhilJS. While Angular is a full-featured framework with dependency injection, services, and modules, PhilJS takes a simpler approach with signals and function components.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Concept Mapping](#concept-mapping)
3. [Angular Signals to PhilJS Signals](#angular-signals-to-philjs-signals)
4. [Components](#components)
5. [Services and Dependency Injection](#services-and-dependency-injection)
6. [NgRx to Signals](#ngrx-to-signals)
7. [Angular Router Migration](#angular-router-migration)
8. [Forms](#forms)
9. [Common Patterns](#common-patterns)
10. [Step-by-Step Migration](#step-by-step-migration)

---

## Quick Start

### Installation

```bash
# Remove Angular dependencies
npm uninstall @angular/core @angular/common @angular/router @angular/forms @ngrx/store

# Install PhilJS
npm install @philjs/core philjs-router
```

### Basic Component Conversion

```typescript
// Before (Angular)
import { Component, signal, computed, effect } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <button (click)="increment()">
      Count: {{ count() }} (Doubled: {{ doubled() }})
    </button>
  `,
})
export class CounterComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);

  constructor() {
    effect(() => {
      console.log('Count changed:', this.count());
    });
  }

  increment() {
    this.count.update(c => c + 1);
  }
}
```

```tsx
// After (PhilJS)
import { signal, memo, effect } from '@philjs/core';

function Counter() {
  const count = signal(0);
  const doubled = memo(() => count() * 2);

  effect(() => {
    console.log('Count changed:', count());
  });

  const increment = () => count.set(c => c + 1);

  return (
    <button onClick={increment}>
      Count: {count()} (Doubled: {doubled()})
    </button>
  );
}

export default Counter;
```

---

## Concept Mapping

| Angular | PhilJS | Notes |
|---------|--------|-------|
| `signal()` | `signal()` | Very similar API |
| `computed()` | `memo()` | Auto-tracked |
| `effect()` | `effect()` | Same concept |
| `@Component` | Function component | No decorator needed |
| `@Injectable` service | Context + signals | Use createContext |
| `@Input()` | Props | Function parameters |
| `@Output()` | Callback props | Pass callbacks as props |
| NgModule | Not needed | Just use imports |
| Dependency Injection | `createContext`/`useContext` | Simpler approach |
| `*ngIf` | `{condition && <.../>}` | JSX conditional |
| `*ngFor` | `{items.map(...)}` | JSX iteration |
| `[(ngModel)]` | `value` + `onInput` | Two-way binding |
| `(event)` | `onEvent` | Event handlers |
| `[property]` | `property={value}` | Property binding |
| `<ng-content>` | `props.children` | Content projection |
| Pipes | Functions | Just call functions |
| Guards | Route loaders | Protect with loaders |

---

## Angular Signals to PhilJS Signals

Angular 17+ introduced signals which are very similar to PhilJS:

### signal()

```typescript
// Angular
import { signal } from '@angular/core';

const count = signal(0);
console.log(count());      // Read
count.set(5);              // Write
count.update(c => c + 1);  // Update

// PhilJS - almost identical!
import { signal } from '@philjs/core';

const count = signal(0);
console.log(count());      // Read - same
count.set(5);              // Write - same
count.set(c => c + 1);     // Update - use .set() with callback
```

### computed()

```typescript
// Angular
import { signal, computed } from '@angular/core';

const count = signal(0);
const doubled = computed(() => count() * 2);

// PhilJS
import { signal, memo } from '@philjs/core';

const count = signal(0);
const doubled = memo(() => count() * 2);
```

### effect()

```typescript
// Angular
import { signal, effect } from '@angular/core';

const count = signal(0);

effect(() => {
  console.log('Count:', count());
});

// PhilJS - identical!
import { signal, effect } from '@philjs/core';

const count = signal(0);

effect(() => {
  console.log('Count:', count());
});
```

### Key Differences

1. **Update method**: Angular uses `.update()`, PhilJS uses `.set()` with callback
2. **Computed naming**: Angular uses `computed()`, PhilJS uses `memo()`
3. **No injection context**: PhilJS effects don't need injection context

```typescript
// Angular - effect needs injection context
@Component({...})
export class MyComponent {
  count = signal(0);

  constructor() {
    // Must be in constructor or with injector
    effect(() => {
      console.log(this.count());
    });
  }
}

// PhilJS - effect works anywhere
function MyComponent() {
  const count = signal(0);

  // No injection context needed
  effect(() => {
    console.log(count());
  });
}
```

---

## Components

### Class to Function

```typescript
// Angular
@Component({
  selector: 'app-greeting',
  template: `<h1>Hello, {{ name }}!</h1>`,
})
export class GreetingComponent {
  @Input() name: string = 'World';
}

// PhilJS
interface GreetingProps {
  name?: string;
}

function Greeting({ name = 'World' }: GreetingProps) {
  return <h1>Hello, {name}!</h1>;
}
```

### Input/Output to Props

```typescript
// Angular
@Component({
  selector: 'app-counter',
  template: `
    <button (click)="increment()">{{ count }}</button>
  `,
})
export class CounterComponent {
  @Input() count = 0;
  @Output() countChange = new EventEmitter<number>();

  increment() {
    this.count++;
    this.countChange.emit(this.count);
  }
}

// Usage
<app-counter [count]="value" (countChange)="handleChange($event)"></app-counter>

// PhilJS
interface CounterProps {
  count: number;
  onCountChange?: (count: number) => void;
}

function Counter({ count, onCountChange }: CounterProps) {
  const increment = () => {
    const newCount = count + 1;
    onCountChange?.(newCount);
  };

  return <button onClick={increment}>{count}</button>;
}

// Usage
<Counter count={value()} onCountChange={handleChange} />
```

### Lifecycle Hooks

```typescript
// Angular
@Component({...})
export class MyComponent implements OnInit, OnDestroy, AfterViewInit {
  ngOnInit() {
    console.log('Initialized');
  }

  ngAfterViewInit() {
    console.log('View ready');
  }

  ngOnDestroy() {
    console.log('Destroyed');
  }
}

// PhilJS
import { onMount, onCleanup, effect } from '@philjs/core';

function MyComponent() {
  // ngOnInit + ngAfterViewInit equivalent
  onMount(() => {
    console.log('Initialized and view ready');
  });

  // ngOnDestroy equivalent
  onCleanup(() => {
    console.log('Destroyed');
  });

  // Or use effect with cleanup
  effect(() => {
    console.log('Effect running');
    return () => console.log('Cleanup');
  });
}
```

---

## Services and Dependency Injection

Angular's DI system is replaced with React-style context in PhilJS:

### Injectable Service to Context

```typescript
// Angular Service
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private user = signal<User | null>(null);

  getUser() {
    return this.user();
  }

  setUser(user: User) {
    this.user.set(user);
  }

  async fetchUser(id: string) {
    const response = await fetch(`/api/users/${id}`);
    const user = await response.json();
    this.user.set(user);
    return user;
  }
}

// Angular Component
@Component({...})
export class ProfileComponent {
  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.fetchUser('123');
  }
}
```

```tsx
// PhilJS - Context + Signals
import { createContext, useContext, signal } from '@philjs/core';

// Create the service as a context
interface UserContextType {
  user: () => User | null;
  setUser: (user: User) => void;
  fetchUser: (id: string) => Promise<User>;
}

const UserContext = createContext<UserContextType | null>(null);

// Provider component
function UserProvider(props: { children: JSX.Element }) {
  const user = signal<User | null>(null);

  const value: UserContextType = {
    user: () => user(),
    setUser: (u) => user.set(u),
    fetchUser: async (id) => {
      const response = await fetch(`/api/users/${id}`);
      const data = await response.json();
      user.set(data);
      return data;
    },
  };

  return (
    <UserContext.Provider value={value}>
      {props.children}
    </UserContext.Provider>
  );
}

// Hook to use the service
function useUserService() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUserService must be within UserProvider');
  return context;
}

// Component using the service
function Profile() {
  const userService = useUserService();

  onMount(() => {
    userService.fetchUser('123');
  });

  return <div>{userService.user()?.name}</div>;
}

// App with provider
function App() {
  return (
    <UserProvider>
      <Profile />
    </UserProvider>
  );
}
```

### Simple Approach - Just Export Signals

For simpler cases, you don't need context at all:

```typescript
// stores/user.ts
import { signal } from '@philjs/core';

const user = signal<User | null>(null);

export const userStore = {
  user: () => user(),
  setUser: (u: User) => user.set(u),
  fetchUser: async (id: string) => {
    const response = await fetch(`/api/users/${id}`);
    const data = await response.json();
    user.set(data);
    return data;
  },
};

// Component
import { userStore } from './stores/user';

function Profile() {
  onMount(() => {
    userStore.fetchUser('123');
  });

  return <div>{userStore.user()?.name}</div>;
}
```

---

## NgRx to Signals

NgRx's Redux-style patterns can be simplified with signals:

### Store/Reducer to Signals

```typescript
// NgRx
// actions.ts
export const increment = createAction('[Counter] Increment');
export const decrement = createAction('[Counter] Decrement');

// reducer.ts
export const counterReducer = createReducer(
  0,
  on(increment, state => state + 1),
  on(decrement, state => state - 1)
);

// selectors.ts
export const selectCount = (state: AppState) => state.counter;
export const selectDoubled = createSelector(
  selectCount,
  count => count * 2
);

// component.ts
@Component({...})
export class CounterComponent {
  count$ = this.store.select(selectCount);
  doubled$ = this.store.select(selectDoubled);

  constructor(private store: Store) {}

  increment() {
    this.store.dispatch(increment());
  }
}
```

```tsx
// PhilJS - Much simpler!
// store.ts
import { signal, memo } from '@philjs/core';

const count = signal(0);

export const counterStore = {
  count: () => count(),
  doubled: memo(() => count() * 2),
  increment: () => count.set(c => c + 1),
  decrement: () => count.set(c => c - 1),
};

// component.tsx
import { counterStore } from './store';

function Counter() {
  return (
    <div>
      <span>Count: {counterStore.count()}</span>
      <span>Doubled: {counterStore.doubled()}</span>
      <button onClick={counterStore.increment}>+</button>
      <button onClick={counterStore.decrement}>-</button>
    </div>
  );
}
```

### Effects to Regular Async

```typescript
// NgRx Effects
@Injectable()
export class UserEffects {
  loadUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadUser),
      switchMap(action =>
        this.userService.getUser(action.id).pipe(
          map(user => loadUserSuccess({ user })),
          catchError(error => of(loadUserFailure({ error })))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private userService: UserService
  ) {}
}

// PhilJS - Just use async/await
import { signal, resource } from '@philjs/core';

const userId = signal<string | null>(null);

const user = resource(async () => {
  const id = userId();
  if (!id) return null;
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});

// Usage
function UserProfile() {
  return (
    <div>
      {user.loading() && <span>Loading...</span>}
      {user.error() && <span>Error: {user.error().message}</span>}
      {user() && <span>{user().name}</span>}
    </div>
  );
}
```

---

## Angular Router Migration

### Route Configuration

```typescript
// Angular
const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  {
    path: 'users/:id',
    component: UserComponent,
    resolve: { user: userResolver },
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module'),
  },
];

// PhilJS
import { createAppRouter } from 'philjs-router';

const router = createAppRouter({
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
    {
      path: '/users/:id',
      component: User,
      loader: async ({ params }) => {
        // Replaces resolver
        return fetch(`/api/users/${params.id}`).then(r => r.json());
      },
    },
    {
      path: '/admin',
      component: lazy(() => import('./admin/Admin')),
    },
  ],
});
```

### Router Link

```html
<!-- Angular -->
<a routerLink="/about" routerLinkActive="active">About</a>
<a [routerLink]="['/users', user.id]">User</a>
```

```tsx
// PhilJS
import { Link } from 'philjs-router';

<Link href="/about" activeClass="active">About</Link>
<Link href={`/users/${user.id}`}>User</Link>
```

### Programmatic Navigation

```typescript
// Angular
constructor(private router: Router) {}

navigate() {
  this.router.navigate(['/users', id]);
  this.router.navigate(['/home'], { queryParams: { tab: 'settings' } });
}

// PhilJS
import { useRouter } from 'philjs-router';

function Component() {
  const { navigate } = useRouter();

  const goToUser = () => navigate(`/users/${id}`);
  const goHome = () => navigate('/home?tab=settings');
}
```

### Route Guards to Loaders

```typescript
// Angular Guard
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    if (this.auth.isLoggedIn()) {
      return true;
    }
    return this.router.parseUrl('/login');
  }
}

// PhilJS - Use loader with redirect
import { redirect } from 'philjs-router';
import { authStore } from './stores/auth';

const routes = [
  {
    path: '/protected',
    component: Protected,
    loader: async () => {
      if (!authStore.isLoggedIn()) {
        throw redirect('/login');
      }
      return null;
    },
  },
];
```

---

## Forms

### Template-Driven to Signals

```html
<!-- Angular Template-Driven -->
<form #myForm="ngForm" (ngSubmit)="onSubmit(myForm)">
  <input [(ngModel)]="user.name" name="name" required />
  <input [(ngModel)]="user.email" name="email" required email />
  <button type="submit" [disabled]="myForm.invalid">Submit</button>
</form>
```

```tsx
// PhilJS
import { signal, memo } from '@philjs/core';

function Form() {
  const name = signal('');
  const email = signal('');

  const isValid = memo(() => {
    return name().length > 0 && email().includes('@');
  });

  const onSubmit = (e: Event) => {
    e.preventDefault();
    console.log({ name: name(), email: email() });
  };

  return (
    <form onSubmit={onSubmit}>
      <input
        value={name()}
        onInput={(e) => name.set(e.target.value)}
        required
      />
      <input
        type="email"
        value={email()}
        onInput={(e) => email.set(e.target.value)}
        required
      />
      <button type="submit" disabled={!isValid()}>Submit</button>
    </form>
  );
}
```

### Reactive Forms to useForm

```typescript
// Angular Reactive Forms
@Component({...})
export class LoginComponent {
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
  });

  onSubmit() {
    if (this.form.valid) {
      console.log(this.form.value);
    }
  }
}
```

```tsx
// PhilJS with useForm helper
import { useForm, validators as v } from '@philjs/core';

function Login() {
  const form = useForm({
    email: { initial: '', validate: [v.required(), v.email()] },
    password: { initial: '', validate: [v.required(), v.minLength(8)] },
  });

  const onSubmit = form.handleSubmit((data) => {
    console.log(data);
  });

  return (
    <form onSubmit={onSubmit}>
      <input {...form.field('email')} />
      {form.errors.email && <span>{form.errors.email}</span>}

      <input type="password" {...form.field('password')} />
      {form.errors.password && <span>{form.errors.password}</span>}

      <button type="submit" disabled={!form.isValid()}>Login</button>
    </form>
  );
}
```

---

## Common Patterns

### Pipes to Functions

```typescript
// Angular Pipe
@Pipe({ name: 'uppercase' })
export class UppercasePipe implements PipeTransform {
  transform(value: string): string {
    return value.toUpperCase();
  }
}

// Usage: {{ name | uppercase }}

// PhilJS - Just use functions
function uppercase(value: string): string {
  return value.toUpperCase();
}

// Usage: {uppercase(name())}

// Or for formatting:
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US').format(date);
}

// Usage: {formatDate(createdAt())}
```

### Async Pipe to Resource

```html
<!-- Angular -->
<div *ngIf="user$ | async as user">
  {{ user.name }}
</div>
```

```tsx
// PhilJS
import { resource } from '@philjs/core';

function UserProfile() {
  const user = resource(() => fetch('/api/user').then(r => r.json()));

  return (
    <div>
      {!user.loading() && user() && (
        <span>{user().name}</span>
      )}
    </div>
  );
}
```

### ViewChild to Ref

```typescript
// Angular
@Component({
  template: `<input #myInput />`,
})
export class MyComponent {
  @ViewChild('myInput') inputRef!: ElementRef<HTMLInputElement>;

  ngAfterViewInit() {
    this.inputRef.nativeElement.focus();
  }
}

// PhilJS
function MyComponent() {
  let inputRef: HTMLInputElement | null = null;

  onMount(() => {
    inputRef?.focus();
  });

  return <input ref={(el) => inputRef = el} />;
}
```

### Content Projection

```html
<!-- Angular -->
<app-card>
  <h1 header>Title</h1>
  <p>Content</p>
  <button footer>Submit</button>
</app-card>

<!-- Card Component -->
<div class="card">
  <header><ng-content select="[header]"></ng-content></header>
  <main><ng-content></ng-content></main>
  <footer><ng-content select="[footer]"></ng-content></footer>
</div>
```

```tsx
// PhilJS
interface CardProps {
  header?: JSX.Element;
  footer?: JSX.Element;
  children: JSX.Element;
}

function Card(props: CardProps) {
  return (
    <div className="card">
      <header>{props.header}</header>
      <main>{props.children}</main>
      <footer>{props.footer}</footer>
    </div>
  );
}

// Usage
<Card
  header={<h1>Title</h1>}
  footer={<button>Submit</button>}
>
  <p>Content</p>
</Card>
```

---

## Step-by-Step Migration

### 1. Install Dependencies

```bash
npm install @philjs/core philjs-router
npm uninstall @angular/core @angular/common @angular/router @angular/forms
```

### 2. Update Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@philjs/core",
    "experimentalDecorators": false,
    "emitDecoratorMetadata": false
  }
}
```

### 3. Update Entry Point

```typescript
// Before (Angular)
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent);

// After (PhilJS)
// main.tsx
import { render } from '@philjs/core';
import App from './App';

render(() => <App />, document.getElementById('app')!);
```

### 4. Convert Components (Start with Leaf Components)

1. Remove `@Component` decorator
2. Convert class to function
3. Convert `@Input()` to props
4. Convert `@Output()` to callback props
5. Convert Angular signals to PhilJS signals
6. Convert template to JSX

### 5. Convert Services

1. Create context for shared services
2. Convert class methods to functions
3. Replace DI with `useContext`

### 6. Convert Router

1. Replace Angular Router with philjs-router
2. Convert guards to loader functions
3. Update route definitions

### 7. Convert Forms

1. Replace template-driven with signal-based
2. Replace reactive forms with useForm

---

## Migration CLI

```bash
# Analyze project
npx philjs-migrate --from angular --source ./src --analyze-only

# Preview changes
npx philjs-migrate --from angular --source ./src --dry-run

# Run migration
npx philjs-migrate --from angular --source ./src --output ./src-migrated
```

---

## Need Help?

- [PhilJS Documentation](https://philjs.dev)
- [Discord Community](https://discord.gg/philjs)
- [GitHub Issues](https://github.com/philjs/philjs/issues)

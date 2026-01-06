# Migrating from Angular to PhilJS

This guide helps Angular developers transition to PhilJS, covering the shift from class-based to functional patterns.

## Quick Comparison

| Angular | PhilJS | Notes |
|---------|--------|-------|
| `@Component` class | Function component | No decorators |
| `@Input()` | props object | Function parameters |
| `@Output()` | callback props | Direct function calls |
| RxJS Observables | `signal()` | Simpler reactivity |
| `ngIf` | `{condition && ...}` | JSX conditionals |
| `ngFor` | `<For>` or `.map()` | List rendering |
| Services/DI | Context or modules | No decorator-based DI |
| NgModules | ES modules | Standard imports |
| `[(ngModel)]` | Manual binding | Two-way binding |

## Core Concepts

### Components

**Angular @Component → PhilJS function**

```typescript
// Angular
@Component({
  selector: 'app-counter',
  template: `
    <button (click)="increment()">
      Count: {{ count }}
    </button>
  `
})
export class CounterComponent {
  count = 0;

  increment() {
    this.count++;
  }
}
```

```tsx
// PhilJS
import { signal } from '@philjs/core';

function Counter() {
  const count = signal(0);

  return (
    <button onClick={() => count.set(count() + 1)}>
      Count: {count()}
    </button>
  );
}
```

**Key Differences:**
- No class, decorators, or `this`
- State via `signal()` instead of class properties
- JSX instead of separate template

### Inputs (Props)

**Angular @Input → props**

```typescript
// Angular
@Component({
  selector: 'app-greeting',
  template: `<h1>Hello, {{ name }}!</h1>`
})
export class GreetingComponent {
  @Input() name: string = '';
  @Input() age: number = 0;
}

// Usage
<app-greeting [name]="userName" [age]="userAge"></app-greeting>
```

```tsx
// PhilJS
interface GreetingProps {
  name: string;
  age?: number;
}

function Greeting(props: GreetingProps) {
  return <h1>Hello, {props.name}!</h1>;
}

// Usage
<Greeting name={userName} age={userAge} />
```

### Outputs (Events)

**Angular @Output → callback props**

```typescript
// Angular
@Component({
  selector: 'app-button',
  template: `<button (click)="onClick()">{{ label }}</button>`
})
export class ButtonComponent {
  @Input() label: string = '';
  @Output() clicked = new EventEmitter<void>();

  onClick() {
    this.clicked.emit();
  }
}

// Parent
<app-button label="Submit" (clicked)="handleClick()"></app-button>
```

```tsx
// PhilJS
interface ButtonProps {
  label: string;
  onClick: () => void;
}

function Button(props: ButtonProps) {
  return <button onClick={props.onClick}>{props.label}</button>;
}

// Parent
<Button label="Submit" onClick={handleClick} />
```

### RxJS → Signals

**Angular Observable → PhilJS signal**

```typescript
// Angular
@Component({
  selector: 'app-user',
  template: `
    <div *ngIf="user$ | async as user">
      {{ user.name }}
    </div>
  `
})
export class UserComponent implements OnInit {
  user$!: Observable<User>;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.user$ = this.userService.getUser();
  }
}
```

```tsx
// PhilJS
import { signal, effect } from '@philjs/core';

function User() {
  const user = signal<User | null>(null);

  effect(() => {
    userService.getUser().then(data => user.set(data));
  });

  return user() && <div>{user()!.name}</div>;
}

// Or with createResource
import { createResource } from '@philjs/core';

function User() {
  const [user] = createResource(() => userService.getUser());
  return user() && <div>{user()!.name}</div>;
}
```

### Computed Values

**Angular getter → PhilJS computed**

```typescript
// Angular
@Component({...})
export class PriceComponent {
  price = 100;
  quantity = 2;

  get total(): number {
    return this.price * this.quantity;
  }
}
```

```tsx
// PhilJS
import { signal, computed } from '@philjs/core';

function Price() {
  const price = signal(100);
  const quantity = signal(2);
  const total = computed(() => price() * quantity());

  return <div>Total: {total()}</div>;
}
```

## Template → JSX

### Conditionals

**Angular *ngIf → JSX**

```html
<!-- Angular -->
<div *ngIf="isLoggedIn; else loginTemplate">
  <app-dashboard></app-dashboard>
</div>
<ng-template #loginTemplate>
  <app-login></app-login>
</ng-template>
```

```tsx
// PhilJS
function Content(props) {
  return props.isLoggedIn()
    ? <Dashboard />
    : <Login />;
}
```

### Lists

**Angular *ngFor → For component**

```html
<!-- Angular -->
<ul>
  <li *ngFor="let item of items; trackBy: trackById">
    {{ item.name }}
  </li>
</ul>
```

```tsx
// PhilJS
import { For } from '@philjs/core';

function List(props) {
  return (
    <ul>
      <For each={props.items()}>
        {item => <li>{item.name}</li>}
      </For>
    </ul>
  );
}
```

### Switch/Case

**Angular ngSwitch → JSX**

```html
<!-- Angular -->
<div [ngSwitch]="status">
  <p *ngSwitchCase="'loading'">Loading...</p>
  <p *ngSwitchCase="'error'">Error!</p>
  <p *ngSwitchDefault>Ready</p>
</div>
```

```tsx
// PhilJS
function StatusDisplay(props) {
  const status = props.status();

  switch (status) {
    case 'loading': return <p>Loading...</p>;
    case 'error': return <p>Error!</p>;
    default: return <p>Ready</p>;
  }
}
```

### Two-Way Binding

**Angular [(ngModel)] → Manual binding**

```html
<!-- Angular -->
<input [(ngModel)]="name" />
<input type="checkbox" [(ngModel)]="checked" />
```

```tsx
// PhilJS
import { signal } from '@philjs/core';

function Form() {
  const name = signal('');
  const checked = signal(false);

  return (
    <>
      <input
        value={name()}
        onInput={(e) => name.set(e.target.value)}
      />
      <input
        type="checkbox"
        checked={checked()}
        onChange={(e) => checked.set(e.target.checked)}
      />
    </>
  );
}
```

## Services → Functions/Modules

**Angular Service → Plain module**

```typescript
// Angular
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }

  createUser(user: User): Observable<User> {
    return this.http.post<User>('/api/users', user);
  }
}

// Component
@Component({...})
export class UsersComponent {
  private userService = inject(UserService);
  users$ = this.userService.getUsers();
}
```

```tsx
// PhilJS - Plain module
// userService.ts
export async function getUsers(): Promise<User[]> {
  const response = await fetch('/api/users');
  return response.json();
}

export async function createUser(user: User): Promise<User> {
  const response = await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });
  return response.json();
}

// Component
import { getUsers } from './userService';
import { createResource } from '@philjs/core';

function Users() {
  const [users] = createResource(getUsers);

  return (
    <ul>
      <For each={users() ?? []}>
        {user => <li>{user.name}</li>}
      </For>
    </ul>
  );
}
```

### Shared State (like Services)

**Angular Service with state → PhilJS store**

```typescript
// Angular
@Injectable({ providedIn: 'root' })
export class CartService {
  private items = new BehaviorSubject<CartItem[]>([]);
  items$ = this.items.asObservable();

  addItem(item: CartItem) {
    this.items.next([...this.items.value, item]);
  }

  get total(): number {
    return this.items.value.reduce((sum, item) => sum + item.price, 0);
  }
}
```

```tsx
// PhilJS - Store
import { signal, computed } from '@philjs/core';

// Shared state module
const items = signal<CartItem[]>([]);

export const cartStore = {
  items,
  total: computed(() => items().reduce((sum, item) => sum + item.price, 0)),
  addItem(item: CartItem) {
    items.set([...items(), item]);
  }
};

// Or use createStore
import { createStore } from '@philjs/store';

export const cartStore = createStore({
  items: [] as CartItem[],

  get total() {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  },

  addItem(item: CartItem) {
    this.items = [...this.items, item];
  }
});
```

## Dependency Injection → Context

**Angular DI → PhilJS Context**

```typescript
// Angular
@Injectable()
export class ThemeService {
  theme = signal('light');
  toggleTheme() {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }
}

@Component({
  providers: [ThemeService]
})
export class AppComponent {
  theme = inject(ThemeService);
}
```

```tsx
// PhilJS
import { createContext, useContext, signal } from '@philjs/core';

const ThemeContext = createContext<{
  theme: Signal<string>;
  toggleTheme: () => void;
}>();

function ThemeProvider(props: { children: any }) {
  const theme = signal('light');
  const toggleTheme = () => theme.set(theme() === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {props.children}
    </ThemeContext.Provider>
  );
}

function ThemedComponent() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  return (
    <button onClick={toggleTheme}>
      Theme: {theme()}
    </button>
  );
}
```

## Lifecycle

**Angular lifecycle hooks → PhilJS**

```typescript
// Angular
@Component({...})
export class MyComponent implements OnInit, OnDestroy, OnChanges {
  @Input() data!: string;

  ngOnInit() {
    console.log('Initialized');
  }

  ngOnDestroy() {
    console.log('Destroyed');
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      console.log('Data changed:', changes['data'].currentValue);
    }
  }
}
```

```tsx
// PhilJS
import { onMount, onCleanup, effect } from '@philjs/core';

function MyComponent(props: { data: () => string }) {
  onMount(() => {
    console.log('Initialized');
  });

  onCleanup(() => {
    console.log('Destroyed');
  });

  // React to prop changes
  effect(() => {
    console.log('Data changed:', props.data());
  });

  return <div>{props.data()}</div>;
}
```

## Forms

**Angular Reactive Forms → PhilJS signals**

```typescript
// Angular
@Component({...})
export class FormComponent {
  form = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  onSubmit() {
    if (this.form.valid) {
      console.log(this.form.value);
    }
  }
}
```

```tsx
// PhilJS
import { signal, computed } from '@philjs/core';

function Form() {
  const name = signal('');
  const email = signal('');

  const errors = computed(() => {
    const errs: string[] = [];
    if (!name()) errs.push('Name is required');
    if (!email()) errs.push('Email is required');
    if (email() && !email().includes('@')) errs.push('Invalid email');
    return errs;
  });

  const isValid = computed(() => errors().length === 0);

  const onSubmit = (e: Event) => {
    e.preventDefault();
    if (isValid()) {
      console.log({ name: name(), email: email() });
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <input
        value={name()}
        onInput={(e) => name.set(e.target.value)}
        placeholder="Name"
      />
      <input
        value={email()}
        onInput={(e) => email.set(e.target.value)}
        placeholder="Email"
      />
      {errors().map(err => <p class="error">{err}</p>)}
      <button type="submit" disabled={!isValid()}>Submit</button>
    </form>
  );
}
```

## HTTP Requests

**Angular HttpClient → fetch/createResource**

```typescript
// Angular
@Component({...})
export class DataComponent implements OnInit {
  data$!: Observable<Data>;
  loading = false;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loading = true;
    this.data$ = this.http.get<Data>('/api/data').pipe(
      tap(() => this.loading = false),
      catchError(err => {
        this.error = err.message;
        this.loading = false;
        return EMPTY;
      })
    );
  }
}
```

```tsx
// PhilJS
import { createResource, Suspense, ErrorBoundary } from '@philjs/core';

async function fetchData(): Promise<Data> {
  const response = await fetch('/api/data');
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
}

function DataComponent() {
  const [data] = createResource(fetchData);

  return (
    <ErrorBoundary fallback={(err) => <p>Error: {err.message}</p>}>
      <Suspense fallback={<p>Loading...</p>}>
        <div>{data()?.value}</div>
      </Suspense>
    </ErrorBoundary>
  );
}
```

## Routing

**Angular Router → PhilJS Router**

```typescript
// Angular
const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'users/:id', component: UserComponent },
];

@Component({...})
export class UserComponent {
  private route = inject(ActivatedRoute);
  userId = this.route.params.pipe(map(p => p['id']));
}
```

```tsx
// PhilJS
import { createAppRouter, useRoute, Link } from '@philjs/router';

const router = createAppRouter({
  routes: [
    { path: '/', component: Home },
    { path: '/users/:id', component: User },
  ]
});

function User() {
  const route = useRoute();
  return <div>User ID: {route.params.id}</div>;
}
```

## Common Gotchas

### 1. No `this` context
```tsx
// Angular uses `this`
// PhilJS: everything is functional, no `this`
```

### 2. Explicit reactivity
```tsx
// Angular: change detection
// PhilJS: explicit signals
const count = signal(0);
<div>{count()}</div>  // Must call as function
```

### 3. No decorators
```tsx
// Angular: @Component, @Input, @Output
// PhilJS: Plain functions and parameters
```

### 4. No NgModules
```tsx
// Angular: NgModule for organization
// PhilJS: Standard ES modules
import { Component } from './Component';
```

## Migration Strategy

1. **Start with services**: Convert to plain functions/modules
2. **Migrate leaf components**: Presentational components first
3. **Replace observables**: RxJS → signals gradually
4. **Convert routing**: Last major step
5. **Remove Angular**: Final cleanup

## Benefits After Migration

- **Smaller bundle**: ~3KB vs Angular's 100KB+
- **Simpler mental model**: No zones, change detection, or DI
- **Faster startup**: No module initialization
- **Better tree-shaking**: Only import what you use
- **Standard JavaScript**: No decorators or metadata

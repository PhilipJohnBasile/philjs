/**
 * Complete application example with PhilJS Optimizer
 * Demonstrates all features: lazy handlers, routing, components, forms
 */

import { signal, memo } from 'philjs-core';
import { $, $$, prefetchHandler } from 'philjs-core/lazy-handlers';
import { lazyRoute } from '../src/integrations/router.js';
import { lazy, Suspense } from '../src/integrations/component.js';
import { lazyStore } from '../src/integrations/store.js';
import {
  lazySubmit,
  lazyChange,
  lazyValidate,
  createLazyForm,
} from '../src/integrations/forms.js';

/**
 * Global state with lazy loading
 */
const userStore = lazyStore(
  () => import('./stores/user').then((m) => m.userStore),
  { user: null, isAuthenticated: false }
);

const cartStore = lazyStore(
  () => import('./stores/cart').then((m) => m.cartStore),
  { items: [], total: 0 }
);

/**
 * Lazy components
 */
const ProductGrid = lazy(() => import('./components/ProductGrid'));
const Checkout = lazy(() => import('./components/Checkout'));
const UserDashboard = lazy(() => import('./components/UserDashboard'));

/**
 * Home Page with lazy interactions
 */
function HomePage() {
  const products = signal<any[]>([]);
  const searchQuery = signal('');
  const isLoading = signal(false);

  const filteredProducts = memo(() => {
    const query = searchQuery().toLowerCase();
    return products().filter((p) =>
      p.name.toLowerCase().includes(query)
    );
  });

  return (
    <div class="home-page">
      <h1>Welcome to Our Store</h1>

      {/* Search with lazy handler */}
      <input
        type="text"
        placeholder="Search products..."
        value={searchQuery()}
        onInput={$((e: InputEvent) => {
          const target = e.target as HTMLInputElement;
          searchQuery.set(target.value);
        })}
      />

      {/* Lazy load products on button click */}
      <button
        onClick={$$(
          'loadProducts',
          async () => {
            isLoading.set(true);
            try {
              const response = await fetch('/api/products');
              const data = await response.json();
              products.set(data);
            } finally {
              isLoading.set(false);
            }
          }
        )}
        onMouseEnter={() => prefetchHandler('loadProducts')}
      >
        {isLoading() ? 'Loading...' : 'Load Products'}
      </button>

      {/* Lazy component */}
      {filteredProducts().length > 0 && (
        <Suspense fallback={<div>Loading grid...</div>}>
          <ProductGrid products={filteredProducts()} />
        </Suspense>
      )}
    </div>
  );
}

/**
 * Product Page with add to cart
 */
function ProductPage({ product }: { product: any }) {
  const quantity = signal(1);
  const addingToCart = signal(false);

  const addToCart = $$('addToCart', async () => {
    addingToCart.set(true);
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity: quantity(),
        }),
      });

      // Update cart store
      const cart = await import('./stores/cart');
      cart.cartStore.addItem(product, quantity());

      alert('Added to cart!');
    } finally {
      addingToCart.set(false);
    }
  });

  return (
    <div class="product-page">
      <h1>{product.name}</h1>
      <img src={product.image} alt={product.name} />
      <p>{product.description}</p>
      <p class="price">${product.price}</p>

      <div class="quantity">
        <button
          onClick={$(() => quantity.set(Math.max(1, quantity() - 1)))}
        >
          -
        </button>
        <span>{quantity()}</span>
        <button onClick={$(() => quantity.set(quantity() + 1))}>+</button>
      </div>

      <button
        onClick={addToCart}
        onMouseEnter={() => prefetchHandler('addToCart')}
        disabled={addingToCart()}
      >
        {addingToCart() ? 'Adding...' : 'Add to Cart'}
      </button>
    </div>
  );
}

/**
 * Checkout Page with lazy form handlers
 */
function CheckoutPage() {
  const formRef = signal<HTMLFormElement | null>(null);

  // Initialize lazy form
  const initForm = $((form: HTMLFormElement) => {
    const lazyForm = createLazyForm(form);

    lazyForm
      .onSubmit(
        lazySubmit(async (formData) => {
          const order = {
            name: formData.get('name'),
            email: formData.get('email'),
            address: formData.get('address'),
            cardNumber: formData.get('cardNumber'),
          };

          const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order),
          });

          if (response.ok) {
            alert('Order placed successfully!');
            window.location.href = '/confirmation';
          }
        })
      )
      .onChange(
        'email',
        lazyChange((value) => {
          console.log('Email changed:', value);
        })
      )
      .validate(
        'email',
        lazyValidate((value) => {
          if (!value) return 'Email is required';
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'Invalid email format';
          }
          return null;
        })
      )
      .validate(
        'cardNumber',
        lazyValidate((value) => {
          if (!value) return 'Card number is required';
          if (!/^\d{16}$/.test(value.replace(/\s/g, ''))) {
            return 'Invalid card number';
          }
          return null;
        })
      );
  });

  return (
    <div class="checkout-page">
      <h1>Checkout</h1>

      <Suspense fallback={<div>Loading cart summary...</div>}>
        <Checkout />
      </Suspense>

      <form
        ref={(el: any) => {
          formRef.set(el);
          if (el) initForm(el);
        }}
      >
        <h2>Shipping Information</h2>
        <input type="text" name="name" placeholder="Full Name" required />
        <input type="email" name="email" placeholder="Email" required />
        <textarea name="address" placeholder="Address" required />

        <h2>Payment Information</h2>
        <input
          type="text"
          name="cardNumber"
          placeholder="Card Number"
          required
        />
        <input type="text" name="expiry" placeholder="MM/YY" required />
        <input type="text" name="cvv" placeholder="CVV" required />

        <button type="submit">Place Order</button>
      </form>
    </div>
  );
}

/**
 * Dashboard with lazy navigation
 */
function DashboardPage() {
  const activeTab = signal('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'Orders' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div class="dashboard-page">
      <h1>Dashboard</h1>

      <nav class="tabs">
        {tabs.map((tab) => (
          <button
            class={activeTab() === tab.id ? 'active' : ''}
            onClick={$(() => activeTab.set(tab.id))}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div class="tab-content">
        {activeTab() === 'overview' && (
          <Suspense fallback={<div>Loading overview...</div>}>
            <UserDashboard />
          </Suspense>
        )}

        {activeTab() === 'orders' && <OrdersTab />}
        {activeTab() === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

/**
 * Orders Tab with pagination
 */
function OrdersTab() {
  const orders = signal<any[]>([]);
  const page = signal(1);
  const loading = signal(false);

  const loadOrders = $$('loadOrders', async (pageNum: number) => {
    loading.set(true);
    try {
      const response = await fetch(`/api/orders?page=${pageNum}`);
      const data = await response.json();
      orders.set(data.orders);
    } finally {
      loading.set(false);
    }
  });

  return (
    <div class="orders-tab">
      <h2>Your Orders</h2>

      {loading() ? (
        <div>Loading orders...</div>
      ) : (
        <>
          <ul>
            {orders().map((order) => (
              <li key={order.id}>
                <span>Order #{order.id}</span>
                <span>{order.date}</span>
                <span>${order.total}</span>
                <button
                  onClick={$$(
                    `viewOrder_${order.id}`,
                    () => {
                      window.location.href = `/orders/${order.id}`;
                    }
                  )}
                >
                  View Details
                </button>
              </li>
            ))}
          </ul>

          <div class="pagination">
            <button
              onClick={$(() => {
                page.set(Math.max(1, page() - 1));
                loadOrders(page());
              })}
              disabled={page() === 1}
            >
              Previous
            </button>
            <span>Page {page()}</span>
            <button
              onClick={$(() => {
                page.set(page() + 1);
                loadOrders(page());
              })}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Settings Tab with lazy updates
 */
function SettingsTab() {
  const settings = signal({
    notifications: true,
    newsletter: false,
    theme: 'light',
  });

  const saveSettings = $$('saveSettings', async () => {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings()),
    });

    alert('Settings saved!');
  });

  return (
    <div class="settings-tab">
      <h2>Settings</h2>

      <label>
        <input
          type="checkbox"
          checked={settings().notifications}
          onChange={$((e: Event) => {
            const target = e.target as HTMLInputElement;
            settings.set({
              ...settings(),
              notifications: target.checked,
            });
          })}
        />
        Enable Notifications
      </label>

      <label>
        <input
          type="checkbox"
          checked={settings().newsletter}
          onChange={$((e: Event) => {
            const target = e.target as HTMLInputElement;
            settings.set({
              ...settings(),
              newsletter: target.checked,
            });
          })}
        />
        Subscribe to Newsletter
      </label>

      <label>
        Theme:
        <select
          value={settings().theme}
          onChange={$((e: Event) => {
            const target = e.target as HTMLSelectElement;
            settings.set({
              ...settings(),
              theme: target.value,
            });
          })}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto</option>
        </select>
      </label>

      <button
        onClick={saveSettings}
        onMouseEnter={() => prefetchHandler('saveSettings')}
      >
        Save Settings
      </button>
    </div>
  );
}

/**
 * Route definitions
 */
export const routes = [
  lazyRoute({
    path: '/',
    component: () => HomePage,
    loader: async () => {
      // Prefetch critical data
      const featured = await fetch('/api/featured').then((r) => r.json());
      return { featured };
    },
  }),

  lazyRoute({
    path: '/product/:id',
    component: () => ProductPage,
    loader: async ({ params }: any) => {
      const product = await fetch(`/api/products/${params.id}`).then((r) =>
        r.json()
      );
      return { product };
    },
  }),

  lazyRoute({
    path: '/checkout',
    component: () => CheckoutPage,
    loader: async () => {
      const cart = await fetch('/api/cart').then((r) => r.json());
      return { cart };
    },
  }),

  lazyRoute({
    path: '/dashboard',
    component: () => DashboardPage,
    loader: async () => {
      const user = await fetch('/api/user').then((r) => r.json());
      return { user };
    },
  }),
];

/**
 * App component
 */
function App() {
  return (
    <div class="app">
      <header>
        <h1>PhilJS Store</h1>
        <nav>
          <a href="/">Home</a>
          <a href="/products">Products</a>
          <a href="/dashboard">Dashboard</a>
          <a
            href="/checkout"
            onClick={$((e: Event) => {
              e.preventDefault();
              // Prefetch checkout before navigation
              prefetchHandler('loadProducts');
              window.location.href = '/checkout';
            })}
          >
            Cart
          </a>
        </nav>
      </header>

      <main>{/* Router will render here */}</main>

      <footer>
        <p>Powered by PhilJS with Optimizer</p>
      </footer>
    </div>
  );
}

export { App, HomePage, ProductPage, CheckoutPage, DashboardPage };

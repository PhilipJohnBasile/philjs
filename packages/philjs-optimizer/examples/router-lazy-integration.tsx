/**
 * Integration example with PhilJS Router
 * Shows how to use the optimizer with the existing router package
 */

import { createRouter, defineRoutes } from 'philjs-router';
import { $ } from 'philjs-core/lazy-handlers';
import { lazy } from '../src/integrations/component.js';
import { signal } from 'philjs-core';

/**
 * Define routes with lazy-loaded components
 */
const routes = defineRoutes([
  {
    path: '/',
    component: lazy(() => import('./pages/Home')),
    loader: async () => {
      const data = await fetch('/api/home').then((r) => r.json());
      return { data };
    },
  },
  {
    path: '/products',
    component: lazy(() => import('./pages/Products')),
    loader: async () => {
      const products = await fetch('/api/products').then((r) => r.json());
      return { products };
    },
    children: [
      {
        path: ':id',
        component: lazy(() => import('./pages/ProductDetail')),
        loader: async ({ params }: any) => {
          const product = await fetch(`/api/products/${params.id}`).then(
            (r) => r.json()
          );
          return { product };
        },
      },
    ],
  },
  {
    path: '/cart',
    component: lazy(() => import('./pages/Cart')),
    action: async ({ request }: any) => {
      const formData = await request.formData();
      await fetch('/api/cart', {
        method: 'POST',
        body: formData,
      });
      return { success: true };
    },
  },
  {
    path: '/checkout',
    component: lazy(() => import('./pages/Checkout')),
    loader: async () => {
      const cart = await fetch('/api/cart').then((r) => r.json());
      const user = await fetch('/api/user').then((r) => r.json());
      return { cart, user };
    },
    action: async ({ request }: any) => {
      const formData = await request.formData();
      const order = await fetch('/api/checkout', {
        method: 'POST',
        body: formData,
      }).then((r) => r.json());
      return { order };
    },
  },
]);

/**
 * Create router instance
 */
const router = createRouter({
  routes,
  basePath: '/',
});

/**
 * Navigation component with lazy handlers
 */
function Navigation() {
  const currentPath = signal(window.location.pathname);

  return (
    <nav>
      <a
        href="/"
        onClick={$((e: Event) => {
          e.preventDefault();
          router.navigate('/');
          currentPath.set('/');
        })}
        class={currentPath() === '/' ? 'active' : ''}
      >
        Home
      </a>
      <a
        href="/products"
        onClick={$((e: Event) => {
          e.preventDefault();
          router.navigate('/products');
          currentPath.set('/products');
        })}
        class={currentPath() === '/products' ? 'active' : ''}
      >
        Products
      </a>
      <a
        href="/cart"
        onClick={$((e: Event) => {
          e.preventDefault();
          router.navigate('/cart');
          currentPath.set('/cart');
        })}
        class={currentPath() === '/cart' ? 'active' : ''}
      >
        Cart
      </a>
    </nav>
  );
}

/**
 * App component
 */
function App() {
  return (
    <div class="app">
      <header>
        <h1>PhilJS Store</h1>
        <Navigation />
      </header>

      <main>
        <router.Router />
      </main>

      <footer>
        <p>Powered by PhilJS with Optimizer</p>
      </footer>
    </div>
  );
}

/**
 * Initialize the application
 */
export function initApp() {
  // Mount the app
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = '';
    root.appendChild(<App />);
  }

  // Start the router
  router.start();
}

/**
 * Example page components
 */

// Home page
export function Home({ data }: any) {
  return (
    <div class="home-page">
      <h1>Welcome to PhilJS Store</h1>
      <p>{data?.message}</p>

      <div class="featured-products">
        <h2>Featured Products</h2>
        {data?.featured?.map((product: any) => (
          <div class="product-card">
            <img src={product.image} alt={product.name} />
            <h3>{product.name}</h3>
            <p>${product.price}</p>
            <a
              href={`/products/${product.id}`}
              onClick={$((e: Event) => {
                e.preventDefault();
                router.navigate(`/products/${product.id}`);
              })}
            >
              View Details
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

// Products listing page
export function Products({ products }: any) {
  const filter = signal('all');
  const sort = signal('name');

  const filteredProducts = () => {
    let result = products;

    if (filter() !== 'all') {
      result = result.filter((p: any) => p.category === filter());
    }

    result.sort((a: any, b: any) => {
      if (sort() === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sort() === 'price') {
        return a.price - b.price;
      }
      return 0;
    });

    return result;
  };

  return (
    <div class="products-page">
      <h1>Products</h1>

      <div class="filters">
        <select
          value={filter()}
          onChange={$((e: Event) => {
            const target = e.target as HTMLSelectElement;
            filter.set(target.value);
          })}
        >
          <option value="all">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="books">Books</option>
        </select>

        <select
          value={sort()}
          onChange={$((e: Event) => {
            const target = e.target as HTMLSelectElement;
            sort.set(target.value);
          })}
        >
          <option value="name">Sort by Name</option>
          <option value="price">Sort by Price</option>
        </select>
      </div>

      <div class="product-grid">
        {filteredProducts().map((product: any) => (
          <div class="product-card">
            <img src={product.image} alt={product.name} />
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p class="price">${product.price}</p>
            <a
              href={`/products/${product.id}`}
              onClick={$((e: Event) => {
                e.preventDefault();
                router.navigate(`/products/${product.id}`);
              })}
            >
              View Details
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

// Product detail page
export function ProductDetail({ product }: any) {
  const quantity = signal(1);

  return (
    <div class="product-detail-page">
      <div class="product-images">
        <img src={product.image} alt={product.name} />
      </div>

      <div class="product-info">
        <h1>{product.name}</h1>
        <p class="price">${product.price}</p>
        <p class="description">{product.description}</p>

        <div class="quantity-selector">
          <button onClick={$(() => quantity.set(Math.max(1, quantity() - 1)))}>
            -
          </button>
          <span>{quantity()}</span>
          <button onClick={$(() => quantity.set(quantity() + 1))}>+</button>
        </div>

        <button
          class="add-to-cart"
          onClick={$((e: Event) => {
            e.preventDefault();
            fetch('/api/cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                productId: product.id,
                quantity: quantity(),
              }),
            }).then(() => {
              alert('Added to cart!');
              router.navigate('/cart');
            });
          })}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

// Cart page
export function Cart() {
  const cart = signal<any[]>([]);
  const loading = signal(true);

  // Load cart
  (async () => {
    const data = await fetch('/api/cart').then((r) => r.json());
    cart.set(data.items);
    loading.set(false);
  })();

  const total = () =>
    cart().reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div class="cart-page">
      <h1>Your Cart</h1>

      {loading() ? (
        <div>Loading...</div>
      ) : cart().length === 0 ? (
        <div>
          <p>Your cart is empty</p>
          <a
            href="/products"
            onClick={$((e: Event) => {
              e.preventDefault();
              router.navigate('/products');
            })}
          >
            Continue Shopping
          </a>
        </div>
      ) : (
        <>
          <div class="cart-items">
            {cart().map((item, index) => (
              <div class="cart-item">
                <img src={item.image} alt={item.name} />
                <div class="item-info">
                  <h3>{item.name}</h3>
                  <p>${item.price}</p>
                </div>
                <div class="quantity">
                  <button
                    onClick={$(() => {
                      const newCart = [...cart()];
                      newCart[index].quantity = Math.max(
                        1,
                        newCart[index].quantity - 1
                      );
                      cart.set(newCart);
                    })}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={$(() => {
                      const newCart = [...cart()];
                      newCart[index].quantity += 1;
                      cart.set(newCart);
                    })}
                  >
                    +
                  </button>
                </div>
                <button
                  class="remove"
                  onClick={$(() => {
                    cart.set(cart().filter((_, i) => i !== index));
                  })}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div class="cart-summary">
            <h2>Summary</h2>
            <p>Total: ${total().toFixed(2)}</p>
            <a
              href="/checkout"
              class="checkout-button"
              onClick={$((e: Event) => {
                e.preventDefault();
                router.navigate('/checkout');
              })}
            >
              Proceed to Checkout
            </a>
          </div>
        </>
      )}
    </div>
  );
}

export { App, Navigation, router };

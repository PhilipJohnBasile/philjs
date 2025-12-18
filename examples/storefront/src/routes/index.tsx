import { defineLoader } from "philjs-ssr";
import { html } from "../server/template";
import type { Product, Category } from "../server/mock-db";

type LoaderData = {
  products: Product[];
  categories: Category[];
  selectedCategory?: string;
  searchQuery?: string;
  cartItemCount: number;
};

export const loader = defineLoader(async ({ url, db }) => {
  const category = url.searchParams.get("category") as Category | null;
  const search = url.searchParams.get("q");

  let products: Product[];
  if (search) {
    products = await db.product.search(search);
  } else if (category) {
    products = await db.product.byCategory(category);
  } else {
    products = await db.product.all();
  }

  // Get cart count for display
  const cart = await db.cart.get("user-123");
  const cartItemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const categories: Category[] = ["laptops", "keyboards", "mice", "monitors", "accessories", "audio"];

  return {
    products,
    categories,
    selectedCategory: category ?? undefined,
    searchQuery: search ?? undefined,
    cartItemCount
  } satisfies LoaderData;
});

export default function Home({ data }: { data: LoaderData }) {
  const { products, categories, selectedCategory, searchQuery, cartItemCount } = data;

  return html`
    <main data-page="home">
      <header class="store-header">
        <div class="store-header-content">
          <div>
            <h1>PhilJS Storefront</h1>
            <p>Premium tech gear, delivered fast.</p>
          </div>
          <nav class="store-nav">
            <a href="/cart" class="cart-link" data-cart-count="${cartItemCount}">
              <span class="cart-icon">&#128722;</span>
              <span>Cart</span>
              ${cartItemCount > 0 ? html`<span class="cart-badge">${cartItemCount}</span>` : ""}
            </a>
          </nav>
        </div>
      </header>

      <section class="catalog">
        <aside class="filters" island="Filters">
          <h2>Categories</h2>
          <form method="get" data-filter-form>
            <ul class="category-list">
              <li>
                <a href="/" class="${!selectedCategory ? "active" : ""}">
                  All Products
                </a>
              </li>
              ${categories.map(
                (cat) =>
                  html`
                    <li>
                      <a href="/?category=${cat}" class="${selectedCategory === cat ? "active" : ""}">
                        ${cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </a>
                    </li>
                  `
              )}
            </ul>
          </form>

          <div class="search-box">
            <h3>Search</h3>
            <form method="get" action="/">
              <input
                type="search"
                name="q"
                placeholder="Search products..."
                value="${searchQuery ?? ""}"
                data-search-input
              />
              <button type="submit">Search</button>
            </form>
          </div>
        </aside>

        <div class="product-section">
          ${searchQuery ? html`<p class="results-info">Search results for "${searchQuery}"</p>` : ""}
          ${selectedCategory ? html`<p class="results-info">Category: ${selectedCategory}</p>` : ""}

          ${products.length === 0
            ? html`
                <div class="empty-state">
                  <p>No products found.</p>
                  <a href="/">View all products</a>
                </div>
              `
            : html`
                <div class="product-grid">
                  ${products.map(
                    (product) =>
                      html`
                        <article class="product-card" data-product-id="${product.id}">
                          <div class="product-card-content">
                            <h3>${product.title}</h3>
                            <p class="product-category">${product.category}</p>
                            ${product.rating
                              ? html`
                                  <div class="product-rating">
                                    <span class="stars">&#9733;</span> ${product.rating.toFixed(1)}
                                    ${product.reviews ? html`<span class="reviews">(${product.reviews})</span>` : ""}
                                  </div>
                                `
                              : ""}
                            <p class="product-price">$${product.price.toFixed(2)}</p>
                            ${product.stock < 10 && product.stock > 0
                              ? html`<p class="stock-warning">Only ${product.stock} left!</p>`
                              : ""}
                            ${product.stock === 0 ? html`<p class="out-of-stock">Out of stock</p>` : ""}
                          </div>
                          <a href="/products/${product.id}" class="product-link" data-phil-prefetch> View details </a>
                        </article>
                      `
                  )}
                </div>
              `}
        </div>
      </section>
    </main>
  `;
}

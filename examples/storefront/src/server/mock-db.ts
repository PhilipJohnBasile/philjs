const products = [
  {
    id: "1",
    title: "Gaming Laptop",
    description: "High-performance laptop with RTX 4080 GPU, perfect for gaming and creative work.",
    price: 1299.99
  },
  {
    id: "2",
    title: "Mechanical Keyboard",
    description: "Premium mechanical keyboard with hot-swappable switches and per-key RGB lighting.",
    price: 149.99
  },
  {
    id: "3",
    title: "Wireless Mouse",
    description: "Ergonomic wireless mouse with precision tracking and long battery life.",
    price: 79.99
  }
];

const relatedProducts = [
  { id: "101", title: "USB-C Hub", price: 49.99 },
  { id: "102", title: "Monitor Stand", price: 34.99 },
  { id: "103", title: "Desk Mat", price: 24.99 }
];

type Product = (typeof products)[number];

type MockDb = {
  product: {
    find: (id: string) => Promise<Product>;
    related: (id: string) => Promise<typeof relatedProducts>;
    all: () => Promise<Product[]>;
  };
  cart: {
    add: (userId: string, productId: string, quantity: number) => Promise<{ success: boolean }>;
  };
};

export function createMockDb(): MockDb {
  const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
  return {
    product: {
      async find(id: string) {
        const product = products.find((item) => item.id === id) ?? products[0];
        return clone(product);
      },
      async related(id: string) {
        return clone(relatedProducts);
      },
      async all() {
        return clone(products);
      }
    },
    cart: {
      async add(userId: string, productId: string, quantity: number) {
        console.info(`Cart update for user=${userId} product=${productId} quantity=${quantity}`);
        return { success: true };
      }
    }
  };
}

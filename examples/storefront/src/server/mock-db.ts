// Product categories
export type Category = "laptops" | "keyboards" | "mice" | "monitors" | "accessories" | "audio";

// Core product type
export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  image?: string;
  stock: number;
  rating?: number;
  reviews?: number;
};

// Cart item type
export type CartItem = {
  productId: string;
  quantity: number;
  addedAt: Date;
};

// Cart type
export type Cart = {
  userId: string;
  items: CartItem[];
  updatedAt: Date;
};

// Order type
export type Order = {
  id: string;
  userId: string;
  items: Array<{ productId: string; quantity: number; price: number; title: string }>;
  total: number;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
  shippingAddress?: ShippingAddress;
  paymentMethod?: string;
};

// Shipping address type
export type ShippingAddress = {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

const products: Product[] = [
  {
    id: "1",
    title: "Gaming Laptop Pro",
    description: "High-performance laptop with RTX 4080 GPU, perfect for gaming and creative work. Features 32GB RAM, 1TB SSD, and a stunning 165Hz display.",
    price: 1299.99,
    category: "laptops",
    stock: 15,
    rating: 4.8,
    reviews: 124
  },
  {
    id: "2",
    title: "Mechanical Keyboard RGB",
    description: "Premium mechanical keyboard with hot-swappable switches and per-key RGB lighting. Cherry MX compatible switches for ultimate customization.",
    price: 149.99,
    category: "keyboards",
    stock: 42,
    rating: 4.6,
    reviews: 89
  },
  {
    id: "3",
    title: "Wireless Mouse Pro",
    description: "Ergonomic wireless mouse with precision tracking and long battery life. Features adjustable DPI up to 16000 and customizable buttons.",
    price: 79.99,
    category: "mice",
    stock: 67,
    rating: 4.7,
    reviews: 203
  },
  {
    id: "4",
    title: "4K Ultra Monitor 27\"",
    description: "Professional 4K monitor with IPS panel, HDR support, and 99% sRGB color accuracy. Perfect for creative professionals and gamers.",
    price: 499.99,
    category: "monitors",
    stock: 23,
    rating: 4.9,
    reviews: 156
  },
  {
    id: "5",
    title: "Compact Mechanical Keyboard",
    description: "60% compact mechanical keyboard with aluminum frame. Perfect for minimalist setups with premium build quality.",
    price: 89.99,
    category: "keyboards",
    stock: 31,
    rating: 4.5,
    reviews: 78
  },
  {
    id: "6",
    title: "USB-C Hub Pro",
    description: "10-in-1 USB-C hub with 4K HDMI, USB 3.0 ports, SD card reader, and 100W power delivery. Essential for modern laptops.",
    price: 49.99,
    category: "accessories",
    stock: 88,
    rating: 4.4,
    reviews: 312
  },
  {
    id: "7",
    title: "Gaming Mouse RGB",
    description: "High-performance gaming mouse with 20000 DPI sensor, RGB lighting, and 8 programmable buttons. Designed for competitive gaming.",
    price: 59.99,
    category: "mice",
    stock: 54,
    rating: 4.6,
    reviews: 167
  },
  {
    id: "8",
    title: "Wireless Headphones",
    description: "Premium wireless headphones with active noise cancellation, 30-hour battery life, and studio-quality sound.",
    price: 249.99,
    category: "audio",
    stock: 28,
    rating: 4.8,
    reviews: 445
  },
  {
    id: "9",
    title: "Adjustable Monitor Stand",
    description: "Ergonomic monitor stand with height, tilt, and rotation adjustment. Gas spring mechanism for smooth operation.",
    price: 34.99,
    category: "accessories",
    stock: 76,
    rating: 4.3,
    reviews: 98
  },
  {
    id: "10",
    title: "Premium Desk Mat",
    description: "Large extended desk mat with water-resistant surface. Non-slip rubber base and stitched edges for durability.",
    price: 24.99,
    category: "accessories",
    stock: 134,
    rating: 4.5,
    reviews: 267
  },
  {
    id: "11",
    title: "Ultrawide Monitor 34\"",
    description: "Curved ultrawide monitor with 3440x1440 resolution, 144Hz refresh rate, and G-Sync support. Immersive gaming experience.",
    price: 699.99,
    category: "monitors",
    stock: 12,
    rating: 4.9,
    reviews: 89
  },
  {
    id: "12",
    title: "Webcam HD Pro",
    description: "1080p webcam with autofocus, dual microphones, and adjustable field of view. Perfect for streaming and video calls.",
    price: 89.99,
    category: "accessories",
    stock: 45,
    rating: 4.4,
    reviews: 156
  }
];

// In-memory cart storage
const carts = new Map<string, Cart>();

// In-memory order storage
const orders = new Map<string, Order>();
let orderCounter = 1000;

type MockDb = {
  product: {
    find: (id: string) => Promise<Product>;
    related: (id: string) => Promise<Product[]>;
    all: () => Promise<Product[]>;
    byCategory: (category: Category) => Promise<Product[]>;
    search: (query: string) => Promise<Product[]>;
  };
  cart: {
    add: (userId: string, productId: string, quantity: number) => Promise<{ success: boolean }>;
    get: (userId: string) => Promise<Cart | null>;
    update: (userId: string, productId: string, quantity: number) => Promise<{ success: boolean }>;
    remove: (userId: string, productId: string) => Promise<{ success: boolean }>;
    clear: (userId: string) => Promise<{ success: boolean }>;
  };
  order: {
    create: (userId: string, items: Cart["items"], total: number, shippingAddress: ShippingAddress, paymentMethod: string) => Promise<Order>;
    get: (orderId: string) => Promise<Order | null>;
    getByUser: (userId: string) => Promise<Order[]>;
  };
};

export function createMockDb(): MockDb {
  const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

  return {
    product: {
      async find(id: string) {
        const product = products.find((item) => item.id === id);
        if (!product) throw new Error(`Product not found: ${id}`);
        return clone(product);
      },
      async related(id: string) {
        const product = products.find((item) => item.id === id);
        if (!product) return [];

        // Find products in the same category, excluding the current product
        const related = products
          .filter((p) => p.category === product.category && p.id !== id)
          .slice(0, 3);

        // If not enough products in same category, add random products
        if (related.length < 3) {
          const remaining = products
            .filter((p) => p.id !== id && !related.includes(p))
            .slice(0, 3 - related.length);
          related.push(...remaining);
        }

        return clone(related);
      },
      async all() {
        return clone(products);
      },
      async byCategory(category: Category) {
        return clone(products.filter((p) => p.category === category));
      },
      async search(query: string) {
        const lowerQuery = query.toLowerCase();
        return clone(
          products.filter(
            (p) =>
              p.title.toLowerCase().includes(lowerQuery) ||
              p.description.toLowerCase().includes(lowerQuery) ||
              p.category.toLowerCase().includes(lowerQuery)
          )
        );
      }
    },
    cart: {
      async add(userId: string, productId: string, quantity: number) {
        const product = products.find((p) => p.id === productId);
        if (!product) return { success: false };

        let cart = carts.get(userId);
        if (!cart) {
          cart = { userId, items: [], updatedAt: new Date() };
          carts.set(userId, cart);
        }

        const existingItem = cart.items.find((item) => item.productId === productId);
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          cart.items.push({ productId, quantity, addedAt: new Date() });
        }

        cart.updatedAt = new Date();
        console.info(`Cart update for user=${userId} product=${productId} quantity=${quantity}`);
        return { success: true };
      },
      async get(userId: string) {
        const cart = carts.get(userId);
        return cart ? clone(cart) : null;
      },
      async update(userId: string, productId: string, quantity: number) {
        const cart = carts.get(userId);
        if (!cart) return { success: false };

        const item = cart.items.find((i) => i.productId === productId);
        if (!item) return { success: false };

        if (quantity <= 0) {
          cart.items = cart.items.filter((i) => i.productId !== productId);
        } else {
          item.quantity = quantity;
        }

        cart.updatedAt = new Date();
        return { success: true };
      },
      async remove(userId: string, productId: string) {
        const cart = carts.get(userId);
        if (!cart) return { success: false };

        cart.items = cart.items.filter((i) => i.productId !== productId);
        cart.updatedAt = new Date();
        return { success: true };
      },
      async clear(userId: string) {
        const cart = carts.get(userId);
        if (!cart) return { success: false };

        cart.items = [];
        cart.updatedAt = new Date();
        return { success: true };
      }
    },
    order: {
      async create(userId: string, items: Cart["items"], total: number, shippingAddress: ShippingAddress, paymentMethod: string) {
        const orderId = `ORD-${orderCounter++}`;

        // Enrich cart items with product details
        const orderItems = items.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return {
            productId: item.productId,
            quantity: item.quantity,
            price: product?.price ?? 0,
            title: product?.title ?? "Unknown Product"
          };
        });

        const order: Order = {
          id: orderId,
          userId,
          items: orderItems,
          total,
          status: "pending",
          createdAt: new Date(),
          shippingAddress,
          paymentMethod
        };

        orders.set(orderId, order);

        // Simulate async processing
        setTimeout(() => {
          const storedOrder = orders.get(orderId);
          if (storedOrder) {
            storedOrder.status = "completed";
          }
        }, 2000);

        return clone(order);
      },
      async get(orderId: string) {
        const order = orders.get(orderId);
        return order ? clone(order) : null;
      },
      async getByUser(userId: string) {
        const userOrders = Array.from(orders.values()).filter((o) => o.userId === userId);
        return clone(userOrders);
      }
    }
  };
}

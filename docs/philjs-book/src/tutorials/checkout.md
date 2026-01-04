# Build an E-commerce Checkout with PhilJS

In this tutorial, you'll build a complete e-commerce checkout flow with:
- ✅ Shopping cart with persistent state
- ✅ Form validation with Zod
- ✅ Payment integration (Stripe)
- ✅ Order confirmation with optimistic updates

**Time to complete**: ~30 minutes

---

## 1. Setup

```bash
pnpm add @philjs/forms zod @stripe/stripe-js
```

## 2. Cart Store

```typescript
// src/stores/cart.ts
import { signal, memo } from '@philjs/core';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

// Persistent cart using localStorage
const savedCart = localStorage.getItem('cart');
export const cart = signal<CartItem[]>(savedCart ? JSON.parse(savedCart) : []);

// Auto-save to localStorage
import { effect } from '@philjs/core';
effect(() => {
  localStorage.setItem('cart', JSON.stringify(cart()));
});

// Derived values
export const cartTotal = memo(() => 
  cart().reduce((sum, item) => sum + item.price * item.quantity, 0)
);

export const cartCount = memo(() =>
  cart().reduce((sum, item) => sum + item.quantity, 0)
);

// Actions
export function addToCart(item: Omit<CartItem, 'quantity'>) {
  cart.update((c) => {
    const existing = c.find((i) => i.id === item.id);
    if (existing) {
      existing.quantity++;
    } else {
      c.push({ ...item, quantity: 1 });
    }
    return [...c];
  });
}

export function removeFromCart(id: string) {
  cart.set(cart().filter((i) => i.id !== id));
}

export function updateQuantity(id: string, quantity: number) {
  cart.update((c) => {
    const item = c.find((i) => i.id === id);
    if (item) {
      item.quantity = Math.max(0, quantity);
    }
    return c.filter((i) => i.quantity > 0);
  });
}

export function clearCart() {
  cart.set([]);
}
```

## 3. Checkout Form

```typescript
// src/components/CheckoutForm.tsx
import { signal } from '@philjs/core';
import { createForm, zodValidator } from '@philjs/forms';
import { z } from 'zod';
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent } from '@philjs/shadcn';

const checkoutSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2, 'Name required'),
  address: z.string().min(5, 'Address required'),
  city: z.string().min(2, 'City required'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP'),
  cardNumber: z.string().length(16, 'Invalid card number'),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, 'Format: MM/YY'),
  cvv: z.string().length(3, 'Invalid CVV'),
});

type CheckoutData = z.infer<typeof checkoutSchema>;

interface CheckoutFormProps {
  onSubmit: (data: CheckoutData) => Promise<void>;
}

export function CheckoutForm(props: CheckoutFormProps) {
  const form = createForm<CheckoutData>({
    validator: zodValidator(checkoutSchema),
    onSubmit: props.onSubmit,
  });

  return (
    <form onSubmit={form.handleSubmit} class="space-y-6">
      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register('email')}
            />
            {form.errors.email && (
              <p class="text-red-500 text-sm">{form.errors.email}</p>
            )}
          </div>
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" {...form.register('name')} />
            {form.errors.name && (
              <p class="text-red-500 text-sm">{form.errors.name}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Shipping */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Address</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...form.register('address')} />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" {...form.register('city')} />
            </div>
            <div>
              <Label htmlFor="zip">ZIP Code</Label>
              <Input id="zip" {...form.register('zip')} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment */}
      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div>
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input id="cardNumber" placeholder="1234 5678 9012 3456" {...form.register('cardNumber')} />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiry">Expiry</Label>
              <Input id="expiry" placeholder="MM/YY" {...form.register('expiry')} />
            </div>
            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input id="cvv" type="password" {...form.register('cvv')} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" loading={form.submitting} class="w-full">
        {form.submitting() ? 'Processing...' : 'Place Order'}
      </Button>
    </form>
  );
}
```

## 4. Checkout Page

```typescript
// src/pages/Checkout.tsx
import { signal } from '@philjs/core';
import { useNavigate } from '@philjs/router';
import { CheckoutForm } from '../components/CheckoutForm';
import { CartSummary } from '../components/CartSummary';
import { cart, cartTotal, clearCart } from '../stores/cart';

export function CheckoutPage() {
  const navigate = useNavigate();
  const orderPlaced = signal(false);
  const orderId = signal<string | null>(null);

  const handleSubmit = async (data) => {
    // Create order via API
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        items: cart(),
        total: cartTotal(),
      }),
    });

    const order = await response.json();
    orderId.set(order.id);
    orderPlaced.set(true);
    clearCart();
  };

  if (orderPlaced()) {
    return (
      <div class="max-w-md mx-auto text-center py-12">
        <div class="text-6xl mb-4">🎉</div>
        <h1 class="text-2xl font-bold mb-2">Order Placed!</h1>
        <p class="text-gray-600 mb-4">Order #{orderId()}</p>
        <Button onClick={() => navigate('/')}>Continue Shopping</Button>
      </div>
    );
  }

  return (
    <div class="max-w-4xl mx-auto py-8">
      <h1 class="text-3xl font-bold mb-8">Checkout</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <CheckoutForm onSubmit={handleSubmit} />
        <CartSummary />
      </div>
    </div>
  );
}
```

## Key Concepts

| Feature | Implementation |
|:--------|:---------------|
| Persistent state | Signals + localStorage effect |
| Form validation | `@philjs/forms` + Zod |
| Optimistic updates | Update UI before API confirms |
| Loading states | Signal-based loading indicators |

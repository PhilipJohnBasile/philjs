# API Routes

Build backend API endpoints alongside your frontend pages using file-based API routes.

## What You'll Learn

- Creating API routes
- HTTP methods (GET, POST, PUT, DELETE)
- Request and response handling
- Middleware for APIs
- Authentication
- Error handling
- Best practices

## Basic API Routes

### Creating an API Route

```typescript
// src/pages/api/hello.ts
export async function GET(request: Request) {
  return new Response(
    JSON.stringify({ message: 'Hello, World!' }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
```

**URL:** `/api/hello`

### Multiple HTTP Methods

```typescript
// src/pages/api/users.ts
export async function GET(request: Request) {
  const users = await db.users.findAll();

  return new Response(JSON.stringify(users), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  const user = await db.users.create(body);

  return new Response(JSON.stringify(user), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## Dynamic API Routes

### Route Parameters

```typescript
// src/pages/api/users/[id].ts
interface Params {
  id: string;
}

export async function GET(
  request: Request,
  { params }: { params: Params }
) {
  const user = await db.users.findById(params.id);

  if (!user) {
    return new Response(
      JSON.stringify({ error: 'User not found' }),
      { status: 404 }
    );
  }

  return new Response(JSON.stringify(user), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Params }
) {
  const body = await request.json();

  const user = await db.users.update(params.id, body);

  return new Response(JSON.stringify(user), { status: 200 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Params }
) {
  await db.users.delete(params.id);

  return new Response(null, { status: 204 });
}
```

### Multiple Parameters

```typescript
// src/pages/api/posts/[postId]/comments/[commentId].ts
interface Params {
  postId: string;
  commentId: string;
}

export async function GET(
  request: Request,
  { params }: { params: Params }
) {
  const comment = await db.comments.findOne({
    postId: params.postId,
    id: params.commentId
  });

  return new Response(JSON.stringify(comment), { status: 200 });
}
```

## Request Handling

### Query Parameters

```typescript
// src/pages/api/products.ts
export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');

  const products = await db.products.find({
    category,
    skip: (page - 1) * limit,
    limit
  });

  return new Response(JSON.stringify(products), { status: 200 });
}

// Usage: /api/products?category=electronics&page=2&limit=20
```

### Request Body

```typescript
// src/pages/api/posts.ts
export async function POST(request: Request) {
  // Parse JSON body
  const body = await request.json();

  const { title, content, authorId } = body;

  // Validate
  if (!title || !content) {
    return new Response(
      JSON.stringify({ error: 'Title and content required' }),
      { status: 400 }
    );
  }

  // Create post
  const post = await db.posts.create({
    title,
    content,
    authorId,
    createdAt: new Date()
  });

  return new Response(JSON.stringify(post), { status: 201 });
}
```

### Headers

```typescript
export async function GET(request: Request) {
  // Read headers
  const auth = request.headers.get('Authorization');
  const contentType = request.headers.get('Content-Type');

  // Set response headers
  return new Response(JSON.stringify({ data: '...' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'X-Custom-Header': 'value'
    }
  });
}
```

## Response Helpers

### JSON Response

```typescript
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function GET(request: Request) {
  const users = await db.users.findAll();
  return jsonResponse(users);
}
```

### Error Response

```typescript
function errorResponse(message: string, status = 500) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export async function GET(request: Request) {
  try {
    const data = await fetchData();
    return jsonResponse(data);
  } catch (error) {
    return errorResponse('Failed to fetch data', 500);
  }
}
```

## Authentication

### JWT Authentication

```typescript
// src/lib/auth.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function createToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
```

```typescript
// src/pages/api/protected.ts
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  const auth = request.headers.get('Authorization');

  if (!auth?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401 }
    );
  }

  const token = auth.substring(7);
  const user = verifyToken(token);

  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Invalid token' }),
      { status: 401 }
    );
  }

  // User is authenticated
  return new Response(JSON.stringify({ user }), { status: 200 });
}
```

### Login Endpoint

```typescript
// src/pages/api/auth/login.ts
import { createToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  // Find user
  const user = await db.users.findByEmail(email);

  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Invalid credentials' }),
      { status: 401 }
    );
  }

  // Verify password
  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    return new Response(
      JSON.stringify({ error: 'Invalid credentials' }),
      { status: 401 }
    );
  }

  // Create token
  const token = createToken({ userId: user.id, email: user.email });

  return new Response(
    JSON.stringify({ token, user: { id: user.id, email: user.email } }),
    { status: 200 }
  );
}
```

### Session-Based Auth

```typescript
// src/pages/api/auth/session.ts
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  const session = await getSession(request);

  if (!session?.userId) {
    return new Response(
      JSON.stringify({ error: 'Not authenticated' }),
      { status: 401 }
    );
  }

  const user = await db.users.findById(session.userId);

  return new Response(JSON.stringify({ user }), { status: 200 });
}
```

## Validation

### Zod Validation

```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().min(18).max(120)
});

export async function POST(request: Request) {
  const body = await request.json();

  // Validate
  const result = CreateUserSchema.safeParse(body);

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Validation failed',
        details: result.error.issues
      }),
      { status: 400 }
    );
  }

  // Create user with validated data
  const user = await db.users.create(result.data);

  return new Response(JSON.stringify(user), { status: 201 });
}
```

## CORS

### Enable CORS

```typescript
// src/pages/api/public-data.ts
export async function GET(request: Request) {
  const data = await fetchData();

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
```

### CORS Middleware

```typescript
// src/lib/cors.ts
export function withCORS(handler: Function) {
  return async (request: Request, ...args: any[]) => {
    // Handle OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // Call handler
    const response = await handler(request, ...args);

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');

    return response;
  };
}
```

```typescript
// src/pages/api/data.ts
import { withCORS } from '@/lib/cors';

async function handler(request: Request) {
  return new Response(JSON.stringify({ data: '...' }), { status: 200 });
}

export const GET = withCORS(handler);
```

## Rate Limiting

### Simple Rate Limiter

```typescript
// src/lib/rate-limit.ts
const requests = new Map<string, number[]>();

export function rateLimit(
  ip: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const userRequests = requests.get(ip) || [];

  // Filter requests within window
  const recentRequests = userRequests.filter(
    time => now - time < windowMs
  );

  if (recentRequests.length >= limit) {
    return false; // Rate limit exceeded
  }

  // Add current request
  recentRequests.push(now);
  requests.set(ip, recentRequests);

  return true;
}
```

```typescript
// src/pages/api/limited.ts
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  // Allow 10 requests per minute
  if (!rateLimit(ip, 10, 60000)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429 }
    );
  }

  return new Response(JSON.stringify({ data: '...' }), { status: 200 });
}
```

## File Uploads

### Handle File Upload

```typescript
// src/pages/api/upload.ts
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return new Response(
      JSON.stringify({ error: 'No file provided' }),
      { status: 400 }
    );
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return new Response(
      JSON.stringify({ error: 'Invalid file type' }),
      { status: 400 }
    );
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return new Response(
      JSON.stringify({ error: 'File too large' }),
      { status: 400 }
    );
  }

  // Save file
  const buffer = await file.arrayBuffer();
  const filename = `${Date.now()}-${file.name}`;

  await saveFile(filename, buffer);

  return new Response(
    JSON.stringify({ filename, url: `/uploads/${filename}` }),
    { status: 201 }
  );
}
```

## Webhooks

### Webhook Endpoint

```typescript
// src/pages/api/webhooks/stripe.ts
import { verifyStripeSignature } from '@/lib/stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  // Verify webhook signature
  const event = verifyStripeSignature(body, signature);

  if (!event) {
    return new Response('Invalid signature', { status: 400 });
  }

  // Handle event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(event.data.object);
      break;
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
```

## Caching

### Cache Control

```typescript
export async function GET(request: Request) {
  const data = await fetchData();

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Cache for 1 hour
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
```

### Conditional Requests

```typescript
export async function GET(request: Request) {
  const data = await fetchData();
  const etag = generateETag(data);

  // Check If-None-Match header
  if (request.headers.get('If-None-Match') === etag) {
    return new Response(null, { status: 304 }); // Not Modified
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'ETag': etag,
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
```

## Best Practices

### Use Appropriate Status Codes

```typescript
// ✅ Correct status codes
// 200 - Success
// 201 - Created
// 204 - No Content
// 400 - Bad Request
// 401 - Unauthorized
// 403 - Forbidden
// 404 - Not Found
// 500 - Server Error

// ❌ Always 200
return new Response(JSON.stringify({ error: '...' }), { status: 200 });
```

### Validate Input

```typescript
// ✅ Validate all input
const result = schema.safeParse(body);
if (!result.success) {
  return errorResponse('Invalid input', 400);
}

// ❌ Trust user input
const user = await db.users.create(body);
```

### Handle Errors

```typescript
// ✅ Catch and handle errors
try {
  const data = await fetchData();
  return jsonResponse(data);
} catch (error) {
  console.error(error);
  return errorResponse('Server error', 500);
}

// ❌ Let errors crash
const data = await fetchData();
return jsonResponse(data);
```

### Use TypeScript

```typescript
// ✅ Type-safe APIs
interface CreateUserRequest {
  name: string;
  email: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export async function POST(request: Request): Promise<Response> {
  const body: CreateUserRequest = await request.json();
  const user: User = await db.users.create(body);
  return jsonResponse(user);
}
```

## Summary

You've learned:

✅ Creating API routes
✅ HTTP methods (GET, POST, PUT, DELETE)
✅ Dynamic routes with parameters
✅ Request/response handling
✅ Authentication (JWT, sessions)
✅ Input validation
✅ CORS configuration
✅ Rate limiting
✅ File uploads
✅ Webhooks
✅ Caching strategies
✅ Best practices

API routes let you build full-stack applications!

---

**Congratulations!** You've completed the Routing section. Next, explore [Data Fetching →](../data-fetching/overview.md) to learn advanced data loading patterns.

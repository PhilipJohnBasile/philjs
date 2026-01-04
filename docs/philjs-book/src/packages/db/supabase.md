# Supabase Integration

@philjs/db provides comprehensive Supabase integration including client management, authentication, storage, and real-time subscriptions.

## Setup

### Installation

```bash
npm install @philjs/db @supabase/supabase-js
```

### Client Initialization

```typescript
import { createSupabaseClient } from '@philjs/db';

// Initialize the Supabase client
const supabase = await createSupabaseClient({
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
});

// With authentication options
const supabase = await createSupabaseClient({
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  auth: {
    persistSession: true,        // Store session in localStorage
    autoRefreshToken: true,      // Auto-refresh expired tokens
    detectSessionInUrl: true,    // Handle OAuth redirects
  },
});
```

### Getting the Client

```typescript
import { useSupabase } from '@philjs/db';

// Get the initialized client
const supabase = useSupabase();

// With type safety
const supabase = useSupabase<Database>();
```

### Higher-Order Function Pattern

```typescript
import { withSupabase } from '@philjs/db';

// Inject Supabase client into functions
const getUsers = withSupabase(async (supabase) => {
  const { data, error } = await supabase
    .from('users')
    .select('*');
  return data;
});

// Usage
const users = await getUsers();
```

## Authentication

### Setup

```typescript
import { useSupabaseAuth } from '@philjs/db';

const auth = useSupabaseAuth();
```

### Sign Up

```typescript
// Email/password sign up
const { data, error } = await auth.signUp(
  'user@example.com',
  'password123',
  {
    name: 'John Doe',
    role: 'user',
  }
);

if (error) {
  console.error('Sign up failed:', error.message);
} else {
  console.log('User created:', data.user);
}
```

### Sign In

```typescript
// Email/password sign in
const { data, error } = await auth.signIn(
  'user@example.com',
  'password123'
);

// OAuth sign in
await auth.signInWithOAuth('google');
await auth.signInWithOAuth('github');
await auth.signInWithOAuth('discord');
await auth.signInWithOAuth('twitter');
await auth.signInWithOAuth('facebook');

// Magic link
await auth.signInWithMagicLink('user@example.com');
```

### Session Management

```typescript
// Get current session
const { data: { session } } = await auth.getSession();

if (session) {
  console.log('Access token:', session.access_token);
  console.log('Expires at:', session.expires_at);
}

// Get current user
const user = await auth.getUser();

if (user) {
  console.log('User ID:', user.id);
  console.log('Email:', user.email);
  console.log('Metadata:', user.user_metadata);
}

// Sign out
await auth.signOut();
```

### Auth State Changes

```typescript
// Listen to authentication changes
const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
  switch (event) {
    case 'SIGNED_IN':
      console.log('User signed in:', session?.user);
      break;
    case 'SIGNED_OUT':
      console.log('User signed out');
      break;
    case 'TOKEN_REFRESHED':
      console.log('Token refreshed');
      break;
    case 'USER_UPDATED':
      console.log('User updated:', session?.user);
      break;
  }
});

// Cleanup
subscription.unsubscribe();
```

### Password Management

```typescript
// Request password reset email
await auth.resetPassword('user@example.com');

// Update password (while logged in)
await auth.updatePassword('newPassword123');
```

### User Updates

```typescript
// Update user email
await auth.updateUser({
  email: 'newemail@example.com',
});

// Update user metadata
await auth.updateUser({
  data: {
    name: 'Jane Doe',
    avatar_url: 'https://example.com/avatar.jpg',
  },
});

// Update both
await auth.updateUser({
  email: 'newemail@example.com',
  data: {
    name: 'Jane Doe',
  },
});
```

## Storage

### Setup

```typescript
import { useSupabaseStorage } from '@philjs/db';

// Get storage bucket
const storage = useSupabaseStorage('avatars');
```

### File Upload

```typescript
// Upload file
const { data, error } = await storage.upload('path/to/file.png', file);

if (error) {
  console.error('Upload failed:', error.message);
} else {
  console.log('Uploaded to:', data.path);
}

// Upload with options
const { data, error } = await storage.upload('user-123/avatar.png', file, {
  cacheControl: '3600',  // Cache for 1 hour
  upsert: true,          // Overwrite if exists
});

// Upload from component
function AvatarUpload({ userId }) {
  const storage = useSupabaseStorage('avatars');

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const path = `${userId}/${Date.now()}-${file.name}`;
    const { data, error } = await storage.upload(path, file, {
      upsert: true,
    });

    if (error) {
      alert('Upload failed: ' + error.message);
    } else {
      const url = storage.getPublicUrl(data.path);
      console.log('Avatar URL:', url);
    }
  };

  return <input type="file" accept="image/*" onChange={handleUpload} />;
}
```

### File Download

```typescript
// Download file
const { data: blob, error } = await storage.download('path/to/file.png');

if (blob) {
  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'file.png';
  a.click();
}
```

### Public URLs

```typescript
// Get public URL (for public buckets)
const { data: { publicUrl } } = storage.getPublicUrl('path/to/file.png');
console.log('Public URL:', publicUrl);

// Create signed URL (for private buckets)
const { data: { signedUrl }, error } = await storage.createSignedUrl(
  'path/to/file.png',
  3600  // Expires in 1 hour
);
console.log('Signed URL:', signedUrl);
```

### File Listing

```typescript
// List all files in a path
const { data: files, error } = await storage.list('user-123/');

files.forEach(file => {
  console.log('File:', file.name);
  console.log('Size:', file.metadata.size);
  console.log('Type:', file.metadata.mimetype);
  console.log('Created:', file.created_at);
});

// List with options
const { data: files, error } = await storage.list('user-123/', {
  limit: 100,
  offset: 0,
  sortBy: {
    column: 'created_at',
    order: 'desc',
  },
});
```

### File Operations

```typescript
// Remove files
await storage.remove(['path/to/file1.png', 'path/to/file2.png']);

// Move/rename file
await storage.move('old-path.png', 'new-path.png');

// Copy file
await storage.copy('source.png', 'destination.png');
```

## Real-time Subscriptions

### Table Changes

```typescript
import { useSupabaseRealtime } from '@philjs/db';

// Subscribe to all changes on a table
const unsubscribe = useSupabaseRealtime('posts', (payload) => {
  console.log('Change type:', payload.eventType);  // INSERT, UPDATE, DELETE
  console.log('New data:', payload.new);
  console.log('Old data:', payload.old);

  switch (payload.eventType) {
    case 'INSERT':
      addPost(payload.new);
      break;
    case 'UPDATE':
      updatePost(payload.new);
      break;
    case 'DELETE':
      removePost(payload.old);
      break;
  }
});

// Cleanup on unmount
unsubscribe();
```

### Direct Supabase Subscriptions

For more control, use the Supabase client directly:

```typescript
const supabase = useSupabase();

// Subscribe to specific events
const channel = supabase
  .channel('posts-channel')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'posts',
    },
    (payload) => {
      console.log('New post:', payload.new);
    }
  )
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'posts',
      filter: 'author_id=eq.123',
    },
    (payload) => {
      console.log('Updated post by user 123:', payload.new);
    }
  )
  .subscribe();

// Cleanup
supabase.removeChannel(channel);
```

### Presence

```typescript
const supabase = useSupabase();

// Track user presence
const channel = supabase.channel('room-1');

channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    console.log('Online users:', Object.keys(state));
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('User joined:', key);
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('User left:', key);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        user_id: currentUser.id,
        username: currentUser.name,
        online_at: new Date().toISOString(),
      });
    }
  });

// Leave presence
await channel.untrack();
```

### Broadcast

```typescript
const supabase = useSupabase();

const channel = supabase.channel('chat-room');

// Listen for messages
channel.on('broadcast', { event: 'message' }, (payload) => {
  console.log('Received:', payload);
  addMessage(payload.message);
});

channel.subscribe();

// Send message
await channel.send({
  type: 'broadcast',
  event: 'message',
  payload: {
    message: 'Hello everyone!',
    user_id: currentUser.id,
  },
});
```

## Database Queries

### Using with Repository

```typescript
import { createRepository } from '@philjs/db';

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Date;
}

const posts = createRepository<Post>(supabase, 'posts');

// CRUD operations
const newPost = await posts.create({
  title: 'Hello World',
  content: 'My first post',
  authorId: user.id,
});

const allPosts = await posts.findAll({ page: 1, perPage: 10 });
const post = await posts.findById('123');
await posts.update('123', { title: 'Updated Title' });
await posts.delete('123');
```

### Using QueryBuilder

```typescript
import { queryBuilder } from '@philjs/db';

const publishedPosts = await queryBuilder<Post>(supabase, 'posts')
  .where({ status: 'published' })
  .orderBy('createdAt', 'desc')
  .limit(10)
  .include({ author: true })
  .findMany();
```

### Direct Supabase Queries

```typescript
const supabase = useSupabase();

// Select
const { data, error } = await supabase
  .from('posts')
  .select('id, title, author:users(name)')
  .eq('status', 'published')
  .order('created_at', { ascending: false })
  .limit(10);

// Insert
const { data, error } = await supabase
  .from('posts')
  .insert({ title: 'New Post', content: '...' })
  .select()
  .single();

// Update
const { data, error } = await supabase
  .from('posts')
  .update({ title: 'Updated' })
  .eq('id', '123')
  .select()
  .single();

// Delete
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', '123');

// Upsert
const { data, error } = await supabase
  .from('posts')
  .upsert({ id: '123', title: 'Updated or Created' })
  .select()
  .single();
```

## Row Level Security (RLS)

### Setting Up RLS

In Supabase SQL editor:

```sql
-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow users to read all published posts
CREATE POLICY "Public posts are viewable by everyone"
ON posts FOR SELECT
USING (status = 'published');

-- Allow users to read their own posts
CREATE POLICY "Users can view own posts"
ON posts FOR SELECT
USING (auth.uid() = author_id);

-- Allow users to insert their own posts
CREATE POLICY "Users can create posts"
ON posts FOR INSERT
WITH CHECK (auth.uid() = author_id);

-- Allow users to update their own posts
CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE
USING (auth.uid() = author_id);

-- Allow users to delete their own posts
CREATE POLICY "Users can delete own posts"
ON posts FOR DELETE
USING (auth.uid() = author_id);
```

### Using RLS with @philjs/db

RLS is transparent - the client automatically uses the authenticated user's context:

```typescript
// These queries automatically respect RLS policies
const auth = useSupabaseAuth();
await auth.signIn('user@example.com', 'password');

// Only returns posts the user can see
const { data: posts } = await supabase
  .from('posts')
  .select('*');

// Only succeeds if user owns the post
const { data, error } = await supabase
  .from('posts')
  .update({ title: 'Updated' })
  .eq('id', '123');

if (error?.code === 'PGRST301') {
  console.log('No permission to update this post');
}
```

## Server-Side Usage

### API Routes

```typescript
// src/routes/api/posts/+server.ts
import { defineAPIRoute, json } from '@philjs/api';
import { useSupabase } from '@philjs/db';

export const GET = defineAPIRoute({
  handler: async () => {
    const supabase = useSupabase();

    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, title, content, author:users(name)')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      return json({ error: error.message }, { status: 500 });
    }

    return json(posts);
  },
});

export const POST = defineAPIRoute({
  handler: async (req) => {
    const supabase = useSupabase();
    const body = await req.json();

    const { data: post, error } = await supabase
      .from('posts')
      .insert(body)
      .select()
      .single();

    if (error) {
      return json({ error: error.message }, { status: 400 });
    }

    return json(post, { status: 201 });
  },
});
```

### Server-Side Auth

```typescript
import { createServerClient } from '@supabase/ssr';

export async function createServerSupabase(request: Request) {
  const cookies = parseCookies(request.headers.get('cookie') || '');

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookies[name];
        },
        set(name, value, options) {
          // Set cookie in response
        },
        remove(name, options) {
          // Remove cookie
        },
      },
    }
  );
}
```

## TypeScript Types

### Generating Types

Use the Supabase CLI to generate types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

### Using Generated Types

```typescript
import type { Database } from './types/database';

const supabase = useSupabase<Database>();

// Fully typed queries
const { data } = await supabase
  .from('posts')     // Autocomplete table names
  .select('id, title, content')  // Autocomplete column names
  .eq('status', 'published');    // Type-checked values

// data is properly typed as Pick<Post, 'id' | 'title' | 'content'>[]
```

### Table Helpers

```typescript
type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

type Post = Tables<'posts'>;
// { id: string; title: string; content: string; ... }

type InsertPost = Database['public']['Tables']['posts']['Insert'];
type UpdatePost = Database['public']['Tables']['posts']['Update'];
```

## Error Handling

```typescript
import { useSupabase } from '@philjs/db';

async function createPost(data: CreatePost) {
  const supabase = useSupabase();

  const { data: post, error } = await supabase
    .from('posts')
    .insert(data)
    .select()
    .single();

  if (error) {
    // Common error codes
    switch (error.code) {
      case '23505':  // Unique violation
        throw new Error('A post with this title already exists');
      case '23503':  // Foreign key violation
        throw new Error('Invalid author ID');
      case '42501':  // RLS violation
        throw new Error('You do not have permission to create posts');
      case 'PGRST301':  // No rows returned
        throw new Error('Post not found');
      default:
        throw new Error(`Database error: ${error.message}`);
    }
  }

  return post;
}
```

## Best Practices

### 1. Initialize Once

```typescript
// src/lib/supabase.ts
import { createSupabaseClient } from '@philjs/db';

let supabasePromise: Promise<any> | null = null;

export async function getSupabase() {
  if (!supabasePromise) {
    supabasePromise = createSupabaseClient({
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY,
    });
  }
  return supabasePromise;
}
```

### 2. Use Environment Variables

```typescript
// .env
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-side only
```

### 3. Handle Auth State

```typescript
// src/lib/auth.ts
import { useSupabaseAuth } from '@philjs/db';
import { signal } from '@philjs/core';

export const currentUser = signal(null);
export const isLoading = signal(true);

export async function initAuth() {
  const auth = useSupabaseAuth();

  // Check initial session
  const user = await auth.getUser();
  currentUser.set(user);
  isLoading.set(false);

  // Listen for changes
  auth.onAuthStateChange((event, session) => {
    currentUser.set(session?.user || null);
  });
}
```

### 4. Cleanup Subscriptions

```typescript
import { onCleanup } from '@philjs/core';

function PostList() {
  const unsubscribe = useSupabaseRealtime('posts', handleChange);

  // Cleanup on component unmount
  onCleanup(() => {
    unsubscribe();
  });

  return <div>...</div>;
}
```

## Next Steps

- [Queries](./queries.md) - Full query documentation
- [Migrations](./migrations.md) - Database migrations
- [Schema](./schema.md) - Schema validation

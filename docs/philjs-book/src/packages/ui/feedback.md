# Feedback Components

PhilJS UI provides components for communicating status, progress, and notifications to users.

## Alert

Contextual feedback component for displaying messages with different severity levels.

```tsx
import { Alert, AlertTitle, AlertDescription } from '@philjs/ui';

// Basic alerts
<Alert status="info">This is an informational message.</Alert>
<Alert status="success">Operation completed successfully!</Alert>
<Alert status="warning">Please review before proceeding.</Alert>
<Alert status="error">An error occurred. Please try again.</Alert>

// With title
<Alert status="success" title="Payment Successful">
  Your payment has been processed.
</Alert>

// Dismissible alert
<Alert status="info" dismissible onDismiss={() => console.log('dismissed')}>
  Click the X to dismiss this alert.
</Alert>

// Different variants
<Alert status="error" variant="solid">
  Solid variant with filled background
</Alert>

<Alert status="warning" variant="left-accent">
  Left accent variant with border
</Alert>
```

### Alert Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `status` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | Alert severity |
| `variant` | `'subtle' \| 'solid' \| 'left-accent' \| 'top-accent'` | `'subtle'` | Visual style |
| `title` | `string` | - | Alert title |
| `children` | `JSX.Element \| string` | - | Alert content |
| `icon` | `JSX.Element` | - | Custom icon |
| `showIcon` | `boolean` | `true` | Show status icon |
| `dismissible` | `boolean` | `false` | Show dismiss button |
| `onDismiss` | `() => void` | - | Dismiss callback |
| `className` | `string` | - | Additional CSS classes |

### Alert Variants

```tsx
// Subtle (default) - light background
<Alert status="info" variant="subtle">
  Subtle alert with light background
</Alert>

// Solid - filled background
<Alert status="info" variant="solid">
  Solid alert with full color
</Alert>

// Left accent - border on left
<Alert status="info" variant="left-accent">
  Left accent with colored border
</Alert>

// Top accent - border on top
<Alert status="info" variant="top-accent">
  Top accent with colored border
</Alert>
```

### Alert with Custom Content

```tsx
<Alert status="warning">
  <AlertTitle>Update Available</AlertTitle>
  <AlertDescription>
    A new version is available. Please update to get the latest features.
  </AlertDescription>
  <div className="mt-3">
    <Button size="sm">Update Now</Button>
  </div>
</Alert>
```

## Toast

Temporary notification system for non-blocking feedback.

```tsx
import { toast, ToastContainer, useToast } from '@philjs/ui';

// Add ToastContainer to your app root
function App() {
  return (
    <ThemeProvider>
      <YourApp />
      <ToastContainer />
    </ThemeProvider>
  );
}

// Show toasts anywhere in your app
function MyComponent() {
  const handleAction = () => {
    // Basic toast
    toast({ title: 'Hello!', description: 'This is a toast message.' });

    // Status shortcuts
    toast.success({ title: 'Saved!', description: 'Your changes were saved.' });
    toast.error({ title: 'Error', description: 'Something went wrong.' });
    toast.warning({ title: 'Warning', description: 'Please review your input.' });
    toast.info({ title: 'Info', description: 'New features available.' });
  };

  return <Button onClick={handleAction}>Show Toast</Button>;
}
```

### Toast API

```tsx
// Full options
toast({
  id: 'unique-id',           // Optional unique ID
  title: 'Toast Title',      // Optional title
  description: 'Message',    // Optional description
  status: 'success',         // 'info' | 'success' | 'warning' | 'error'
  duration: 5000,            // Duration in ms (0 = persistent)
  isClosable: true,          // Show close button
  position: 'top-right',     // Position on screen
});

// Returns toast ID for programmatic control
const id = toast.success({ title: 'Saved!' });

// Close specific toast
toast.close(id);

// Close all toasts
toast.closeAll();
```

### Toast Positions

```tsx
// Available positions
toast({ title: 'Top', position: 'top' });
toast({ title: 'Top Left', position: 'top-left' });
toast({ title: 'Top Right', position: 'top-right' });
toast({ title: 'Bottom', position: 'bottom' });
toast({ title: 'Bottom Left', position: 'bottom-left' });
toast({ title: 'Bottom Right', position: 'bottom-right' });
```

### Toast with Custom Render

```tsx
toast({
  render: ({ onClose }) => (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h3>Custom Toast</h3>
      <p>This is a completely custom toast.</p>
      <Button size="sm" onClick={onClose}>Dismiss</Button>
    </div>
  ),
});
```

### useToast Hook

```tsx
import { useToast } from '@philjs/ui';

function MyComponent() {
  const toast = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      toast.success({ title: 'Saved!' });
    } catch (error) {
      toast.error({ title: 'Failed to save' });
    }
  };

  return <Button onClick={handleSave}>Save</Button>;
}
```

### ToastOptions Type

```tsx
interface ToastOptions {
  id?: string;
  title?: string;
  description?: string;
  status?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;      // Default: 5000ms
  isClosable?: boolean;   // Default: true
  position?: 'top' | 'top-left' | 'top-right' | 'bottom' | 'bottom-left' | 'bottom-right';
  render?: (props: { onClose: () => void }) => JSX.Element;
}
```

## Spinner

Loading indicator for async operations.

```tsx
import { Spinner } from '@philjs/ui';

// Basic spinner
<Spinner />

// Different sizes
<Spinner size="xs" />
<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />
<Spinner size="xl" />

// Custom color
<Spinner color="text-purple-600" />

// With label (for screen readers)
<Spinner label="Loading data..." />

// In a loading state
{isLoading() ? (
  <div className="flex items-center gap-2">
    <Spinner size="sm" />
    <span>Loading...</span>
  </div>
) : (
  <Content />
)}
```

### Spinner Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Spinner size |
| `color` | `string` | `'text-blue-600'` | Color class |
| `thickness` | `string` | `'border-2'` | Border thickness |
| `speed` | `string` | `'animate-spin'` | Animation class |
| `label` | `string` | `'Loading'` | Screen reader label |
| `className` | `string` | - | Additional CSS classes |

## Progress

Linear progress bar for determinate progress.

```tsx
import { Progress } from '@philjs/ui';

// Basic progress
<Progress value={60} />

// With label and value display
<Progress value={75} label="Upload Progress" showValue />

// Different sizes
<Progress value={50} size="xs" />
<Progress value={50} size="sm" />
<Progress value={50} size="md" />
<Progress value={50} size="lg" />

// Different colors
<Progress value={80} color="green" />
<Progress value={30} color="yellow" />
<Progress value={60} color="red" />

// Striped
<Progress value={70} striped />

// Animated stripes
<Progress value={70} striped animated />

// Custom max value
<Progress value={3} max={10} showValue />
```

### Progress Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | required | Current value |
| `max` | `number` | `100` | Maximum value |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Bar height |
| `color` | `'blue' \| 'green' \| 'red' \| 'yellow' \| 'purple'` | `'blue'` | Bar color |
| `showValue` | `boolean` | `false` | Show percentage |
| `striped` | `boolean` | `false` | Striped pattern |
| `animated` | `boolean` | `false` | Animate stripes |
| `label` | `string` | - | Label above bar |
| `className` | `string` | - | Additional CSS classes |

## CircularProgress

Circular progress indicator for determinate progress.

```tsx
import { CircularProgress } from '@philjs/ui';

// Basic circular progress
<CircularProgress value={60} />

// With value display
<CircularProgress value={75} showValue />

// Custom size and thickness
<CircularProgress
  value={80}
  size={80}
  thickness={6}
  showValue
/>

// Custom colors
<CircularProgress
  value={60}
  color="#10b981"
  trackColor="#d1fae5"
/>

// As a dashboard metric
<div className="text-center">
  <CircularProgress value={85} size={100} showValue />
  <p className="mt-2 text-sm text-gray-600">CPU Usage</p>
</div>
```

### CircularProgress Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | required | Current value |
| `max` | `number` | `100` | Maximum value |
| `size` | `number` | `48` | Diameter in pixels |
| `thickness` | `number` | `4` | Stroke width |
| `color` | `string` | `'#3b82f6'` | Progress color |
| `trackColor` | `string` | `'#e5e7eb'` | Track background color |
| `showValue` | `boolean` | `false` | Show percentage in center |
| `className` | `string` | - | Additional CSS classes |

## Skeleton

Content placeholder for loading states.

```tsx
import { Skeleton } from '@philjs/ui';

// Text skeleton
<Skeleton />
<Skeleton width="60%" />

// Circular skeleton (avatar)
<Skeleton variant="circular" width={40} />

// Rectangular skeleton (image)
<Skeleton variant="rectangular" width="100%" height={200} />

// Card loading skeleton
<div className="space-y-3">
  <Skeleton variant="rectangular" height={180} />
  <Skeleton width="80%" />
  <Skeleton width="60%" />
  <Skeleton width="40%" />
</div>

// List loading skeleton
<div className="space-y-4">
  {[1, 2, 3].map((i) => (
    <div key={i} className="flex items-center gap-3">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <Skeleton width="60%" />
        <Skeleton width="40%" />
      </div>
    </div>
  ))}
</div>
```

### Skeleton Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'text' \| 'circular' \| 'rectangular'` | `'text'` | Shape variant |
| `width` | `number \| string` | - | Width |
| `height` | `number \| string` | - | Height |
| `className` | `string` | - | Additional CSS classes |

## Common Patterns

### Loading Button with Toast Feedback

```tsx
import { signal } from '@philjs/core';
import { Button, Spinner, toast } from '@philjs/ui';

function SaveButton() {
  const loading = signal(false);

  const handleSave = async () => {
    loading.set(true);
    try {
      await saveData();
      toast.success({ title: 'Saved successfully!' });
    } catch (error) {
      toast.error({ title: 'Failed to save', description: error.message });
    } finally {
      loading.set(false);
    }
  };

  return (
    <Button onClick={handleSave} loading={loading()}>
      Save
    </Button>
  );
}
```

### Page Loading State

```tsx
function DataPage() {
  const { data, loading, error } = useData();

  if (loading()) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Spinner size="lg" />
        <p className="text-gray-500">Loading data...</p>
      </div>
    );
  }

  if (error()) {
    return (
      <Alert status="error" title="Error loading data">
        {error().message}
        <Button size="sm" onClick={retry} className="mt-2">
          Retry
        </Button>
      </Alert>
    );
  }

  return <DataContent data={data()} />;
}
```

### File Upload Progress

```tsx
function FileUpload() {
  const progress = signal(0);
  const uploading = signal(false);

  const handleUpload = async (file: File) => {
    uploading.set(true);
    progress.set(0);

    try {
      await uploadFile(file, (percent) => progress.set(percent));
      toast.success({ title: 'Upload complete!' });
    } catch (error) {
      toast.error({ title: 'Upload failed' });
    } finally {
      uploading.set(false);
    }
  };

  return (
    <div>
      {uploading() && (
        <Progress
          value={progress()}
          label="Uploading..."
          showValue
          striped
          animated
        />
      )}
    </div>
  );
}
```

### Skeleton Loading Cards

```tsx
function CardGrid() {
  const { data, loading } = useData();

  if (loading()) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-4 border rounded-lg">
            <Skeleton variant="rectangular" height={150} className="mb-4" />
            <Skeleton width="80%" className="mb-2" />
            <Skeleton width="60%" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {data().map((item) => (
        <Card key={item.id}>{/* ... */}</Card>
      ))}
    </div>
  );
}
```

### Dashboard Metrics

```tsx
function Metrics() {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="p-4 bg-white rounded-lg shadow">
        <CircularProgress value={87} size={80} showValue />
        <p className="mt-2 text-sm font-medium">CPU</p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <CircularProgress value={65} size={80} showValue color="#10b981" />
        <p className="mt-2 text-sm font-medium">Memory</p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <CircularProgress value={42} size={80} showValue color="#f59e0b" />
        <p className="mt-2 text-sm font-medium">Disk</p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <CircularProgress value={23} size={80} showValue color="#8b5cf6" />
        <p className="mt-2 text-sm font-medium">Network</p>
      </div>
    </div>
  );
}
```

## Accessibility

### Alert Accessibility

- Uses `role="alert"` for important messages
- Dismiss button has `aria-label="Dismiss"`
- Screen readers announce alert content

### Toast Accessibility

- Container uses `aria-live="polite"` for non-disruptive announcements
- Close button has proper labeling
- Toasts don't trap focus

### Spinner Accessibility

- Uses `role="status"` to indicate loading
- Includes screen reader text via `label` prop
- Spinner animation is purely decorative (`aria-hidden`)

### Progress Accessibility

- Uses `role="progressbar"`
- Includes `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Optional `aria-label` via `label` prop

# Activity Component

The Activity component enables priority-based rendering for hidden content. Inspired by React 19.2's Activity API, it allows you to pre-render hidden content with low priority, preserve state when hiding/showing, and control visibility transitions.

## Overview

The Activity component is perfect for:

- **Tab interfaces** where switching between tabs is instant
- **Accordions** with smooth expand/collapse
- **Modals** that maintain state when hidden
- **Lazy-loaded sections** with progressive rendering
- **Complex UIs** with multiple visibility states

## Quick Start

```typescript
import { Activity } from 'philjs-core';

function TabPanel({ isActive, children }) {
  return (
    <Activity mode={isActive ? 'visible' : 'hidden'}>
      {children}
    </Activity>
  );
}
```

## Core Concepts

### Activity Modes

Activities have two modes:

- **`visible`**: Content is displayed and interactive
- **`hidden`**: Content is hidden but can be pre-rendered

```typescript
<Activity mode="visible">
  <ExpensiveComponent />
</Activity>

<Activity mode="hidden" keepMounted={true}>
  <PrerenderedContent />
</Activity>
```

### Priority-Based Rendering

Control when hidden content is rendered based on priority:

```typescript
// High priority - renders immediately when hidden
<Activity mode="hidden" priority={10} keepMounted={true}>
  <ImportantContent />
</Activity>

// Low priority - renders during idle time
<Activity mode="hidden" priority={1} keepMounted={true}>
  <LessCriticalContent />
</Activity>
```

### State Preservation

Hidden activities can maintain their state:

```typescript
function TabContent() {
  const [formData, setFormData] = signal({ name: '', email: '' });

  return (
    <Activity mode={isActive ? 'visible' : 'hidden'} keepMounted={true}>
      <form>
        <input
          value={formData().name}
          onChange={(e) => setFormData({ ...formData(), name: e.target.value })}
        />
      </form>
    </Activity>
  );
}
// Form state is preserved when tab switches
```

## Configuration

### Global Configuration

Configure Activity behavior globally:

```typescript
import { configureActivity } from 'philjs-core';

configureActivity({
  prerender: true, // Enable pre-rendering
  defaultPriority: 5, // Default priority level
  maxConcurrent: 3, // Max concurrent pre-renders
  idleTimeout: 100, // Idle timeout before pre-rendering (ms)
  useIdleCallback: true, // Use requestIdleCallback
});
```

### Per-Activity Configuration

Configure individual activities:

```typescript
<Activity
  mode="hidden"
  priority={8}
  keepMounted={true}
  hideDelay={300}
  transition="opacity 0.3s ease-in-out"
  onShow={() => console.log('Activity shown')}
  onHide={() => console.log('Activity hidden')}
  id="my-activity"
>
  <Content />
</Activity>
```

## Activity State Management

### Using Activity State

Access activity state programmatically:

```typescript
import { useActivityState, isActivityVisible } from 'philjs-core';

function MyComponent() {
  const state = useActivityState('my-activity');

  if (state) {
    console.log('Is visible:', state().isVisible);
    console.log('Is pre-rendering:', state().isPrerendering);
    console.log('Has rendered:', state().hasRendered);
    console.log('Priority:', state().priority);
  }

  // Or use the helper
  const visible = isActivityVisible('my-activity');
}
```

### Programmatic Control

Show, hide, or toggle activities programmatically:

```typescript
import { showActivity, hideActivity, toggleActivity } from 'philjs-core';

// Show an activity
showActivity('my-activity');

// Hide an activity
hideActivity('my-activity');

// Toggle visibility
toggleActivity('my-activity');
```

### Clear Activity State

Clean up activity state when no longer needed:

```typescript
import { clearActivityState } from 'philjs-core';

clearActivityState('my-activity');
```

## Activity Groups

### Basic Group

Create groups where only one activity is visible at a time:

```typescript
import { createActivityGroup } from 'philjs-core';

const group = createActivityGroup(['tab1', 'tab2', 'tab3']);

// Show a specific activity (hides others)
group.show('tab2');

// Get current activity
const current = group.current(); // 'tab2'
```

### Tab Management

Create tab-like interfaces easily:

```typescript
import { createTabs } from 'philjs-core';

function TabsExample() {
  const tabs = createTabs(['home', 'profile', 'settings'], 'home');

  return (
    <div>
      <nav>
        <button onClick={() => tabs.setActiveTab('home')}>Home</button>
        <button onClick={() => tabs.setActiveTab('profile')}>Profile</button>
        <button onClick={() => tabs.setActiveTab('settings')}>Settings</button>
      </nav>

      <Activity mode={tabs.getMode('home')} id="tab-home">
        <HomeContent />
      </Activity>

      <Activity mode={tabs.getMode('profile')} id="tab-profile">
        <ProfileContent />
      </Activity>

      <Activity mode={tabs.getMode('settings')} id="tab-settings">
        <SettingsContent />
      </Activity>
    </div>
  );
}
```

## Transitions

### Built-in Transitions

Use pre-defined transitions:

```typescript
import { activityTransitions } from 'philjs-core';

<Activity
  mode={mode}
  transition={activityTransitions.fade}
>
  <Content />
</Activity>

// Available transitions:
// - fade: 'opacity 0.3s ease-in-out'
// - slide: 'transform 0.3s ease-in-out'
// - scale: 'transform 0.2s ease-out'
// - fadeSlide: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out'
```

### Custom Transitions

Create custom transitions:

```typescript
import { createTransition } from 'philjs-core';

const customTransition = createTransition('all', 500, 'cubic-bezier(0.4, 0, 0.2, 1)');

<Activity mode={mode} transition={customTransition}>
  <Content />
</Activity>
```

## Pre-rendering Scheduler

### Creating a Scheduler

Manage pre-rendering manually:

```typescript
import { createActivityScheduler } from 'philjs-core';

const scheduler = createActivityScheduler();

// Schedule an activity for pre-rendering
scheduler.schedule('my-activity', 8, () => {
  console.log('Pre-rendering activity');
});

// Cancel scheduled activity
scheduler.cancel('my-activity');

// Get pending activities
const pending = scheduler.pending();

// Pause/resume pre-rendering
scheduler.pause();
scheduler.resume();
```

## Performance Optimization

### List Optimization

Optimize activity rendering for lists:

```typescript
import { optimizeActivityList } from 'philjs-core';

function ItemList({ items, currentIndex }) {
  const optimized = optimizeActivityList(items, currentIndex, {
    prerenderAhead: 2, // Pre-render 2 items ahead
    prerenderBehind: 1, // Pre-render 1 item behind
    priority: (index) => 10 - Math.abs(index - currentIndex),
  });

  return (
    <div>
      {optimized.map(({ item, mode, priority }) => (
        <Activity
          key={item.id}
          mode={mode}
          priority={priority}
          keepMounted={true}
        >
          <ItemDisplay item={item} />
        </Activity>
      ))}
    </div>
  );
}
```

### Activity Wrapper

Create reusable activity-aware components:

```typescript
import { withActivity } from 'philjs-core';

const ActivityAwareCard = withActivity(
  ({ title, content }) => (
    <div className="card">
      <h3>{title}</h3>
      <p>{content}</p>
    </div>
  ),
  {
    priority: 5,
    keepMounted: true,
    transition: activityTransitions.fade,
  }
);

// Usage
<ActivityAwareCard
  title="Card Title"
  content="Card content"
  activityMode="hidden"
/>
```

## Advanced Patterns

### Lazy Loading with Activity

Combine with code splitting for optimal loading:

```typescript
import { lazy } from 'philjs-core';

const LazyComponent = lazy(() => import('./HeavyComponent'));

function LazyActivity({ isActive }) {
  return (
    <Activity mode={isActive ? 'visible' : 'hidden'} keepMounted={true}>
      <LazyComponent />
    </Activity>
  );
}
```

### Conditional Pre-rendering

Pre-render based on user behavior:

```typescript
function SmartActivity({ children, shouldPrerender }) {
  const [mode, setMode] = signal('hidden');
  const keepMounted = shouldPrerender;

  return (
    <Activity
      mode={mode()}
      keepMounted={keepMounted}
      priority={shouldPrerender ? 8 : 1}
    >
      {children}
    </Activity>
  );
}
```

### Nested Activities

Activities can be nested for complex UIs:

```typescript
function NestedExample() {
  const [activeTab, setActiveTab] = signal('tab1');
  const [activeSubTab, setActiveSubTab] = signal('subtab1');

  return (
    <Activity mode={activeTab() === 'tab1' ? 'visible' : 'hidden'}>
      <div>
        <h2>Tab 1</h2>

        <Activity mode={activeSubTab() === 'subtab1' ? 'visible' : 'hidden'}>
          <SubTab1Content />
        </Activity>

        <Activity mode={activeSubTab() === 'subtab2' ? 'visible' : 'hidden'}>
          <SubTab2Content />
        </Activity>
      </div>
    </Activity>
  );
}
```

## Examples

### Tab Interface

```typescript
function Tabs() {
  const tabs = createTabs(['overview', 'details', 'reviews']);

  return (
    <div className="tabs">
      <div className="tab-buttons">
        <button
          className={tabs.isActive('overview') ? 'active' : ''}
          onClick={() => tabs.setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={tabs.isActive('details') ? 'active' : ''}
          onClick={() => tabs.setActiveTab('details')}
        >
          Details
        </button>
        <button
          className={tabs.isActive('reviews') ? 'active' : ''}
          onClick={() => tabs.setActiveTab('reviews')}
        >
          Reviews
        </button>
      </div>

      <div className="tab-content">
        <Activity
          mode={tabs.getMode('overview')}
          keepMounted={true}
          transition={activityTransitions.fadeSlide}
        >
          <OverviewTab />
        </Activity>

        <Activity
          mode={tabs.getMode('details')}
          keepMounted={true}
          transition={activityTransitions.fadeSlide}
        >
          <DetailsTab />
        </Activity>

        <Activity
          mode={tabs.getMode('reviews')}
          keepMounted={true}
          transition={activityTransitions.fadeSlide}
        >
          <ReviewsTab />
        </Activity>
      </div>
    </div>
  );
}
```

### Accordion

```typescript
function Accordion({ items }) {
  const [openItem, setOpenItem] = signal<string | null>(null);

  return (
    <div className="accordion">
      {items.map((item) => (
        <div key={item.id} className="accordion-item">
          <button
            className="accordion-header"
            onClick={() => setOpenItem(openItem() === item.id ? null : item.id)}
          >
            {item.title}
          </button>

          <Activity
            mode={openItem() === item.id ? 'visible' : 'hidden'}
            keepMounted={true}
            transition={activityTransitions.slide}
            hideDelay={200}
          >
            <div className="accordion-content">
              {item.content}
            </div>
          </Activity>
        </div>
      ))}
    </div>
  );
}
```

### Modal Dialog

```typescript
function Modal({ isOpen, onClose, children }) {
  return (
    <Activity
      mode={isOpen ? 'visible' : 'hidden'}
      keepMounted={true}
      transition={activityTransitions.fade}
      onShow={() => document.body.style.overflow = 'hidden'}
      onHide={() => document.body.style.overflow = 'auto'}
    >
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </Activity>
  );
}
```

### Carousel

```typescript
function Carousel({ slides }) {
  const [currentIndex, setCurrentIndex] = signal(0);

  const optimized = optimizeActivityList(slides, currentIndex(), {
    prerenderAhead: 1,
    prerenderBehind: 1,
  });

  return (
    <div className="carousel">
      <button onClick={() => setCurrentIndex(Math.max(0, currentIndex() - 1))}>
        Previous
      </button>

      <div className="carousel-slides">
        {optimized.map(({ item, mode, priority }, index) => (
          <Activity
            key={item.id}
            mode={mode}
            priority={priority}
            keepMounted={true}
            transition={activityTransitions.slide}
          >
            <Slide data={item} />
          </Activity>
        ))}
      </div>

      <button onClick={() => setCurrentIndex(Math.min(slides.length - 1, currentIndex() + 1))}>
        Next
      </button>
    </div>
  );
}
```

### Settings Panel

```typescript
function Settings() {
  const sections = createTabs(['account', 'privacy', 'notifications', 'appearance']);

  return (
    <div className="settings">
      <aside className="settings-sidebar">
        <nav>
          <button onClick={() => sections.setActiveTab('account')}>
            Account
          </button>
          <button onClick={() => sections.setActiveTab('privacy')}>
            Privacy
          </button>
          <button onClick={() => sections.setActiveTab('notifications')}>
            Notifications
          </button>
          <button onClick={() => sections.setActiveTab('appearance')}>
            Appearance
          </button>
        </nav>
      </aside>

      <main className="settings-content">
        <Activity mode={sections.getMode('account')} keepMounted={true}>
          <AccountSettings />
        </Activity>

        <Activity mode={sections.getMode('privacy')} keepMounted={true}>
          <PrivacySettings />
        </Activity>

        <Activity mode={sections.getMode('notifications')} keepMounted={true}>
          <NotificationSettings />
        </Activity>

        <Activity mode={sections.getMode('appearance')} keepMounted={true}>
          <AppearanceSettings />
        </Activity>
      </main>
    </div>
  );
}
```

## Best Practices

### 1. Use Appropriate Priority Levels

Set priorities based on user importance:

```typescript
// Critical - user is likely to see soon
<Activity mode="hidden" priority={10} keepMounted={true}>
  <NextSlide />
</Activity>

// Nice to have - less likely to be seen
<Activity mode="hidden" priority={1} keepMounted={true}>
  <FarAwayContent />
</Activity>
```

### 2. Keep Mounted for State Preservation

Use `keepMounted={true}` when state needs to persist:

```typescript
// Form state should persist
<Activity mode={mode} keepMounted={true}>
  <ComplexForm />
</Activity>

// Simple display can unmount
<Activity mode={mode} keepMounted={false}>
  <StaticContent />
</Activity>
```

### 3. Add Transitions for Better UX

Use transitions for smooth visibility changes:

```typescript
<Activity
  mode={mode}
  transition={activityTransitions.fadeSlide}
  hideDelay={150}
>
  <Content />
</Activity>
```

### 4. Provide Unique IDs

Use unique IDs for programmatic control:

```typescript
<Activity id={`tab-${tab.id}`} mode={mode}>
  <TabContent />
</Activity>
```

### 5. Optimize List Rendering

Use `optimizeActivityList` for large lists:

```typescript
const optimized = optimizeActivityList(items, currentIndex, {
  prerenderAhead: 2,
  prerenderBehind: 1,
});
```

## Troubleshooting

### Content Not Pre-rendering

**Problem**: Hidden content isn't being pre-rendered

**Solutions**:
1. Ensure `keepMounted={true}` is set
2. Check global `prerender` configuration
3. Verify priority is set appropriately

```typescript
import { getActivityConfig } from 'philjs-core';

const config = getActivityConfig();
console.log('Prerender enabled:', config.prerender);
```

### Performance Issues

**Problem**: Too many activities causing performance problems

**Solutions**:
1. Reduce `maxConcurrent` in configuration
2. Lower priority for less important content
3. Use `keepMounted={false}` where possible

```typescript
configureActivity({
  maxConcurrent: 2, // Reduce concurrent pre-renders
});
```

### State Loss on Hide

**Problem**: State is lost when activity is hidden

**Solutions**:
1. Set `keepMounted={true}`
2. Move state management up the component tree
3. Use context or global state

```typescript
<Activity mode={mode} keepMounted={true}>
  <StatefulComponent />
</Activity>
```

## API Reference

For complete API documentation, see [Core API Reference: Activity](/docs/api-reference/core.md#activity-component)

### Key Functions

- `Activity` - Component for priority-based rendering
- `configureActivity()` - Configure global activity behavior
- `getActivityConfig()` - Get current configuration
- `useActivityState()` - Access activity state
- `getAllActivityStates()` - Get all activity states
- `clearActivityState()` - Clear activity state
- `createActivityScheduler()` - Create pre-render scheduler
- `isActivityVisible()` - Check if activity is visible
- `showActivity()` - Show an activity
- `hideActivity()` - Hide an activity
- `toggleActivity()` - Toggle activity visibility
- `createActivityGroup()` - Create activity group
- `createTabs()` - Create tab management
- `activityTransitions` - Built-in transitions
- `createTransition()` - Create custom transition
- `optimizeActivityList()` - Optimize list rendering
- `withActivity()` - Wrap component with Activity

## Related Topics

- [State Management](/docs/advanced/state-management.md)
- [Performance Optimization](/docs/best-practices/performance.md)
- [Lazy Loading](/docs/learn/lazy-loading.md)
- [Component Patterns](/docs/best-practices/component-patterns.md)
- [Partial Pre-rendering](/docs/advanced/ppr.md)

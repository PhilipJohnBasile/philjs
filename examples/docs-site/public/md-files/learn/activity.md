# Activity Component

The Activity component enables priority-based pre-rendering of hidden content, allowing for smooth transitions and instant tab switches without sacrificing performance.

## What is the Activity Component?

The Activity component lets you:
- Pre-render hidden content with low priority during idle time
- Preserve state when hiding/showing content
- Control visibility transitions with CSS
- Optimize tab panels and accordions
- Schedule rendering based on priority

This feature is similar to React 19.2's Activity component but with more control over scheduling and state management.

## Basic Usage

```tsx
import { signal } from 'philjs-core';
import { Activity } from 'philjs-core/activity';

function TabPanel() {
  const activeTab = signal('home');

  return (
    <div>
      <nav>
        <button onClick={() => activeTab.set('home')}>Home</button>
        <button onClick={() => activeTab.set('profile')}>Profile</button>
        <button onClick={() => activeTab.set('settings')}>Settings</button>
      </nav>

      <Activity mode={activeTab() === 'home' ? 'visible' : 'hidden'}>
        <HomeTab />
      </Activity>

      <Activity mode={activeTab() === 'profile' ? 'visible' : 'hidden'}>
        <ProfileTab />
      </Activity>

      <Activity mode={activeTab() === 'settings' ? 'visible' : 'hidden'}>
        <SettingsTab />
      </Activity>
    </div>
  );
}
```

## Activity Modes

### `visible`
Content is rendered and displayed normally.

### `hidden`
Content is rendered but hidden with CSS. State is preserved.

### `disabled`
Content is not rendered at all. State is lost when switching modes.

```tsx
import { Activity } from 'philjs-core/activity';

// Always rendered, just hidden when inactive
<Activity mode={isActive ? 'visible' : 'hidden'} keepMounted={true}>
  <ExpensiveComponent />
</Activity>

// Only rendered when active
<Activity mode={isActive ? 'visible' : 'disabled'}>
  <LightweightComponent />
</Activity>
```

## Props

```typescript
interface ActivityProps {
  // Current mode: 'visible' | 'hidden' | 'disabled'
  mode: ActivityMode;

  // Children to render
  children: JSX.Element;

  // Rendering priority (0-10, default: 5)
  // Higher priority renders first
  priority?: number;

  // Keep component mounted when hidden (default: true)
  keepMounted?: boolean;

  // Delay before hiding (ms)
  hideDelay?: number;

  // CSS transition to apply
  transition?: ActivityTransition;

  // Callbacks
  onShow?: () => void;
  onHide?: () => void;
}
```

## Priority-Based Rendering

Set priorities to control rendering order:

```tsx
import { Activity } from 'philjs-core/activity';

function Dashboard() {
  const activeTab = signal('overview');

  return (
    <div>
      {/* High priority - render first */}
      <Activity
        mode={activeTab() === 'overview' ? 'visible' : 'hidden'}
        priority={10}
      >
        <OverviewTab />
      </Activity>

      {/* Medium priority */}
      <Activity
        mode={activeTab() === 'analytics' ? 'visible' : 'hidden'}
        priority={5}
      >
        <AnalyticsTab />
      </Activity>

      {/* Low priority - render during idle time */}
      <Activity
        mode={activeTab() === 'settings' ? 'visible' : 'hidden'}
        priority={1}
      >
        <SettingsTab />
      </Activity>
    </div>
  );
}
```

## Transitions

Built-in transitions for smooth UX:

```tsx
import { Activity, activityTransitions } from 'philjs-core/activity';

<Activity
  mode={isVisible ? 'visible' : 'hidden'}
  transition={activityTransitions.fade}
>
  <Content />
</Activity>

// Available transitions
activityTransitions.fade       // Opacity fade
activityTransitions.slide      // Slide in/out
activityTransitions.scale      // Scale up/down
activityTransitions.slideUp    // Slide from bottom
activityTransitions.slideDown  // Slide from top
```

### Custom Transitions

```tsx
const customTransition = {
  enter: 'animate-in fade-in duration-300',
  exit: 'animate-out fade-out duration-200',
};

<Activity mode={mode} transition={customTransition}>
  <Content />
</Activity>
```

## Tab Management Helpers

PhilJS provides helpers for common tab patterns:

```tsx
import { createTabs } from 'philjs-core/activity';

function TabComponent() {
  const tabs = createTabs(['home', 'about', 'contact'], 'home');

  return (
    <div>
      <nav>
        <button onClick={() => tabs.setActiveTab('home')}>
          Home {tabs.isActive('home') && '✓'}
        </button>
        <button onClick={() => tabs.setActiveTab('about')}>
          About {tabs.isActive('about') && '✓'}
        </button>
        <button onClick={() => tabs.setActiveTab('contact')}>
          Contact {tabs.isActive('contact') && '✓'}
        </button>
      </nav>

      <Activity mode={tabs.getMode('home')}>
        <HomeContent />
      </Activity>

      <Activity mode={tabs.getMode('about')}>
        <AboutContent />
      </Activity>

      <Activity mode={tabs.getMode('contact')}>
        <ContactContent />
      </Activity>
    </div>
  );
}
```

## Activity Groups

Create exclusive groups where only one activity is visible:

```tsx
import { createActivityGroup } from 'philjs-core/activity';

function AccordionPanel() {
  const group = createActivityGroup(['panel-1', 'panel-2', 'panel-3']);

  return (
    <div>
      <button onClick={() => group.show('panel-1')}>Panel 1</button>
      <Activity mode={group.getMode('panel-1')}>
        <Panel1Content />
      </Activity>

      <button onClick={() => group.show('panel-2')}>Panel 2</button>
      <Activity mode={group.getMode('panel-2')}>
        <Panel2Content />
      </Activity>

      <button onClick={() => group.show('panel-3')}>Panel 3</button>
      <Activity mode={group.getMode('panel-3')}>
        <Panel3Content />
      </Activity>
    </div>
  );
}
```

## Programmatic Control

Control activities programmatically:

```tsx
import { showActivity, hideActivity, toggleActivity } from 'philjs-core/activity';

// Show an activity
showActivity('sidebar');

// Hide an activity
hideActivity('sidebar');

// Toggle an activity
toggleActivity('sidebar');
```

## Activity Scheduler

Schedule pre-rendering during idle time:

```tsx
import { createActivityScheduler } from 'philjs-core/activity';

const scheduler = createActivityScheduler({
  maxConcurrent: 2,  // Render 2 activities at once
  idleTimeout: 100,  // Wait 100ms of idle time
});

// Schedule activities with priority
scheduler.schedule('tab-1', () => <Tab1 />, { priority: 10 });
scheduler.schedule('tab-2', () => <Tab2 />, { priority: 5 });
scheduler.schedule('tab-3', () => <Tab3 />, { priority: 1 });

// Start scheduling
scheduler.start();

// Pause/resume
scheduler.pause();
scheduler.resume();

// Clear queue
scheduler.clear();
```

## List Optimization

Optimize large lists with virtual scrolling hints:

```tsx
import { optimizeActivityList } from 'philjs-core/activity';

function VirtualList({ items }) {
  const visibleIndex = signal(0);

  // Get optimized priorities for each item
  const priorities = optimizeActivityList(items, visibleIndex(), {
    preloadAhead: 5,
    preloadBehind: 2,
    visiblePriority: 10,
    nearbyPriority: 5,
    farPriority: 1,
  });

  return (
    <div>
      {items.map((item, index) => (
        <Activity
          key={item.id}
          mode={priorities[index] > 0 ? 'visible' : 'disabled'}
          priority={priorities[index]}
        >
          <ListItem item={item} />
        </Activity>
      ))}
    </div>
  );
}
```

## Higher-Order Component

Wrap components with Activity:

```tsx
import { withActivity } from 'philjs-core/activity';

const TabContent = withActivity(
  ({ data }) => <div>{data}</div>,
  {
    priority: 5,
    keepMounted: true,
    transition: activityTransitions.fade,
  }
);

// Use it
<TabContent mode="visible" data={myData} />
```

## Use Cases

### Tab Panels

```tsx
function TabPanel() {
  const activeTab = signal('tab1');

  return (
    <>
      <Activity mode={activeTab() === 'tab1' ? 'visible' : 'hidden'} priority={10}>
        <Tab1 />
      </Activity>
      <Activity mode={activeTab() === 'tab2' ? 'visible' : 'hidden'} priority={5}>
        <Tab2 />
      </Activity>
      <Activity mode={activeTab() === 'tab3' ? 'visible' : 'hidden'} priority={1}>
        <Tab3 />
      </Activity>
    </>
  );
}
```

### Accordion

```tsx
function Accordion() {
  const openSection = signal<number | null>(null);

  return (
    <div>
      {sections.map((section, i) => (
        <div key={i}>
          <button onClick={() => openSection.set(openSection() === i ? null : i)}>
            {section.title}
          </button>
          <Activity
            mode={openSection() === i ? 'visible' : 'hidden'}
            transition={activityTransitions.slideDown}
          >
            <div>{section.content}</div>
          </Activity>
        </div>
      ))}
    </div>
  );
}
```

### Modal with Pre-rendering

```tsx
function Modal({ isOpen, children }) {
  return (
    <Activity
      mode={isOpen ? 'visible' : 'hidden'}
      keepMounted={true}
      priority={10}
      transition={activityTransitions.fade}
    >
      <div className="modal">
        {children}
      </div>
    </Activity>
  );
}
```

### Sidebar with Lazy Loading

```tsx
function Sidebar({ isOpen }) {
  return (
    <Activity
      mode={isOpen ? 'visible' : 'disabled'}
      priority={isOpen ? 10 : 1}
      hideDelay={300}  // Keep mounted for 300ms after closing
      transition={activityTransitions.slide}
    >
      <SidebarContent />
    </Activity>
  );
}
```

## Performance Benefits

### Instant Tab Switches

Without Activity:
- Click tab → Render new content → Display (100-500ms)

With Activity:
- Pre-render hidden tabs during idle time
- Click tab → Display (0-16ms, 1 frame)

### Reduced Jank

Activity component ensures smooth rendering by:
- Scheduling low-priority renders during idle time
- Limiting concurrent renders
- Using CSS for show/hide (no re-renders)

### Memory Management

```tsx
// Keep expensive components mounted
<Activity mode="hidden" keepMounted={true}>
  <ExpensiveChart data={largeDataset} />
</Activity>

// Unmount lightweight components
<Activity mode="hidden" keepMounted={false}>
  <SimpleList items={items} />
</Activity>
```

## Best Practices

### 1. Set Appropriate Priorities

```tsx
// High priority: Currently visible content
<Activity mode="visible" priority={10}>

// Medium priority: Likely to be shown soon
<Activity mode="hidden" priority={5}>

// Low priority: Unlikely to be shown soon
<Activity mode="hidden" priority={1}>
```

### 2. Use keepMounted Wisely

Keep mounted when:
- Content is expensive to render
- State must be preserved
- User switches frequently

Don't keep mounted when:
- Content is lightweight
- State can be recreated
- Memory is constrained

### 3. Add Transitions for Better UX

```tsx
<Activity
  mode={isVisible ? 'visible' : 'hidden'}
  transition={activityTransitions.fade}
  hideDelay={150}  // Smooth exit
>
  <Content />
</Activity>
```

### 4. Pre-render Likely Paths

```tsx
// Pre-render the next likely tab
<Activity mode="hidden" priority={7}>
  <NextLikelyTab />
</Activity>

// Low priority for unlikely tabs
<Activity mode="hidden" priority={2}>
  <UnlikelyTab />
</Activity>
```

## Comparison with Other Frameworks

| Feature | PhilJS Activity | React 19.2 Activity | Svelte | Vue |
|---------|----------------|---------------------|--------|-----|
| Priority-based Rendering | ✅ | ✅ | ❌ | ❌ |
| Idle-time Pre-rendering | ✅ | ✅ | ❌ | ❌ |
| State Preservation | ✅ | ✅ | Manual | Manual |
| Built-in Transitions | ✅ | ❌ | ✅ | ✅ |
| Scheduling API | ✅ | ❌ | ❌ | ❌ |
| Tab Helpers | ✅ | ❌ | ❌ | ❌ |

## Advanced: Custom Scheduler

Create a custom scheduler for complex scenarios:

```tsx
import { createActivityScheduler } from 'philjs-core/activity';

const scheduler = createActivityScheduler({
  maxConcurrent: 3,
  idleTimeout: 50,
  priorityFn: (activity) => {
    // Custom priority logic
    if (activity.isUserInitiated) return 10;
    if (activity.isVisible) return 8;
    if (activity.isPrefetch) return 3;
    return 1;
  },
  onSchedule: (id) => console.log('Scheduled:', id),
  onComplete: (id) => console.log('Completed:', id),
  onError: (id, error) => console.error('Error:', id, error),
});
```

## Debugging

Enable debug mode to see activity lifecycle:

```tsx
<Activity
  mode="visible"
  priority={5}
  onShow={() => console.log('Activity shown')}
  onHide={() => console.log('Activity hidden')}
  onMount={() => console.log('Activity mounted')}
  onUnmount={() => console.log('Activity unmounted')}
>
  <Content />
</Activity>
```

## Related

- [PPR](/learn/ppr) - Partial Pre-rendering
- [Performance](/performance/overview) - Optimization strategies
- [Suspense](/learn/suspense-async) - Async boundaries
- [Lazy Loading](/learn/lazy-loading) - Code splitting

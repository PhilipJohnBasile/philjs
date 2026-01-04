# @philjs/mobile

Mobile-first utilities and components for PhilJS applications.

## Installation

```bash
npm install @philjs/mobile
```

## Overview

`@philjs/mobile` provides mobile-specific features:

- **Touch Gestures**: Swipe, pinch, tap detection
- **Responsive Hooks**: Screen size and orientation
- **Mobile Components**: Bottom sheets, pull-to-refresh
- **Performance**: Mobile-optimized rendering
- **PWA Support**: App-like mobile experience
- **Native Features**: Camera, GPS, sensors

## Quick Start

```typescript
import {
  useSwipe,
  usePullToRefresh,
  BottomSheet
} from '@philjs/mobile';

function MobileApp() {
  const swipe = useSwipe({
    onSwipeLeft: () => navigateNext(),
    onSwipeRight: () => navigateBack(),
  });

  const refresh = usePullToRefresh({
    onRefresh: async () => {
      await fetchData();
    },
  });

  return (
    <div {...swipe.handlers} {...refresh.handlers}>
      <Content />
      <BottomSheet>
        <ActionMenu />
      </BottomSheet>
    </div>
  );
}
```

## Touch Gestures

```typescript
import { useGesture, usePinch, useLongPress } from '@philjs/mobile';

function Gallery() {
  const pinch = usePinch({
    onPinch: (scale) => setZoom(scale),
  });

  const longPress = useLongPress({
    onLongPress: () => showContextMenu(),
    delay: 500,
  });

  return (
    <img
      {...pinch.handlers}
      {...longPress.handlers}
      src={image}
    />
  );
}
```

## Responsive Hooks

```typescript
import { useBreakpoint, useOrientation, useSafeArea } from '@philjs/mobile';

function ResponsiveLayout() {
  const breakpoint = useBreakpoint(); // 'mobile' | 'tablet' | 'desktop'
  const orientation = useOrientation(); // 'portrait' | 'landscape'
  const safeArea = useSafeArea(); // { top, bottom, left, right }

  return (
    <div style={{ paddingTop: safeArea.top }}>
      {breakpoint === 'mobile' ? <MobileNav /> : <DesktopNav />}
    </div>
  );
}
```

## Mobile Components

```typescript
import { BottomSheet, PullToRefresh, SwipeActions } from '@philjs/mobile';

// Bottom sheet
<BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
  <SheetContent />
</BottomSheet>

// Pull to refresh
<PullToRefresh onRefresh={handleRefresh}>
  <ScrollableContent />
</PullToRefresh>

// Swipe actions on list items
<SwipeActions
  left={<DeleteAction />}
  right={<ArchiveAction />}
>
  <ListItem />
</SwipeActions>
```

## See Also

- [@philjs/gesture](../gesture/overview.md) - Gesture detection
- [@philjs/pwa](../pwa/overview.md) - PWA features
- [@philjs/native](../native/overview.md) - Native integrations

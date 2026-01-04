
# Decentralized Social (`@philjs/social`)

Build your own Facebook.

## ActivityPub
Native federation support. Connect your PhilJS app to Mastodon, Lemmy, and PixelFed.

```typescript
import { ActivityPub } from '@philjs/social';

ActivityPub.publish({
  type: 'Note',
  content: 'Hello Fediverse!'
});
```

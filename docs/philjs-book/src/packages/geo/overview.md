
# Geospatial Analysis (`@philjs/geo`)

Understand the world map.

## Spatial Ops
Buffer, Intersect, and Union operations on GeoJSON geometries.

```typescript
import { GeoSpatial } from '@philjs/geo';
const zone = GeoSpatial.buffer(point, 500 /* meters */);
```

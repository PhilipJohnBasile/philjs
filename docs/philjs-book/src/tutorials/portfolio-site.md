# Tutorial: Creating a Portfolio Site

Learn to build a high-performance portfolio with animations and optimized images.

## Features
- Hero section with `@philjs/three` (3D elements)
- Project gallery with Masonry layout
- Contact form with Zod validation

## 1. Hero Section
```tsx
import { Canvas } from '@philjs/three';
import { HeroText } from './components';

export function Hero() {
  return (
    <section class="h-screen relative">
      <Canvas>
        <FloatingLaptop />
      </Canvas>
      <HeroText />
    </section>
  );
}
```

## 2. Image Optimization
Use the `<Image>` component for automatic WebP conversion and lazy loading.

```tsx
<Image 
  src="/projects/dashboard.png" 
  width={800} 
  height={600} 
  alt="Dashboard Project"
/>
```

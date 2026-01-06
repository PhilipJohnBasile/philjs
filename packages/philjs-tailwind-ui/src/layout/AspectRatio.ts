/**
 * AspectRatio Component
 * Maintains a consistent aspect ratio for content
 */

import { jsx } from '@philjs/core';
import { cn } from '../utils.js';
import type { BaseProps, WithChildren } from '../types.js';

export interface AspectRatioProps extends BaseProps, WithChildren {
  /** Aspect ratio (width/height) */
  ratio?: number | 'square' | 'video' | 'portrait' | 'wide' | 'ultrawide';
  /** Maximum width */
  maxWidth?: string;
  /** Minimum width */
  minWidth?: string;
}

const ratioValues: Record<string, number> = {
  square: 1,
  video: 16 / 9,
  portrait: 3 / 4,
  wide: 21 / 9,
  ultrawide: 32 / 9,
};

const ratioClasses: Record<string, string> = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  wide: 'aspect-[21/9]',
  ultrawide: 'aspect-[32/9]',
};

export function AspectRatio(props: AspectRatioProps): JSX.Element {
  const {
    ratio = 'video',
    maxWidth,
    minWidth,
    class: className,
    children,
    id,
    testId,
    style = {},
    ...rest
  } = props;

  // Convert named ratio to aspect class or custom value
  const aspectClass = typeof ratio === 'string'
    ? ratioClasses[ratio]
    : `aspect-[${ratio}]`;

  const classes = cn(
    'relative w-full overflow-hidden',
    aspectClass,
    className
  );

  const computedStyle: Record<string, string | number> = { ...style };
  if (maxWidth) computedStyle.maxWidth = maxWidth;
  if (minWidth) computedStyle.minWidth = minWidth;

  return jsx('div', {
    class: classes,
    id,
    'data-testid': testId,
    style: Object.keys(computedStyle).length > 0 ? computedStyle : undefined,
    ...rest,
    children: jsx('div', {
      class: 'absolute inset-0 flex items-center justify-center',
      children,
    }),
  });
}

// Convenience components for common ratios
export function AspectSquare(props: Omit<AspectRatioProps, 'ratio'>): JSX.Element {
  return AspectRatio({ ...props, ratio: 'square' });
}

export function AspectVideo(props: Omit<AspectRatioProps, 'ratio'>): JSX.Element {
  return AspectRatio({ ...props, ratio: 'video' });
}

export function AspectPortrait(props: Omit<AspectRatioProps, 'ratio'>): JSX.Element {
  return AspectRatio({ ...props, ratio: 'portrait' });
}

// Image with aspect ratio
export interface AspectImageProps extends Omit<AspectRatioProps, 'children'> {
  /** Image source */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Object fit */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /** Object position */
  objectPosition?: string;
  /** Loading strategy */
  loading?: 'eager' | 'lazy';
}

const objectFitClasses = {
  contain: 'object-contain',
  cover: 'object-cover',
  fill: 'object-fill',
  none: 'object-none',
  'scale-down': 'object-scale-down',
};

export function AspectImage(props: AspectImageProps): JSX.Element {
  const {
    src,
    alt,
    objectFit = 'cover',
    objectPosition,
    loading = 'lazy',
    ratio = 'video',
    ...containerProps
  } = props;

  return AspectRatio({
    ...containerProps,
    ratio,
    children: jsx('img', {
      src,
      alt,
      loading,
      class: cn(
        'absolute inset-0 w-full h-full',
        objectFitClasses[objectFit]
      ),
      style: objectPosition ? { objectPosition } : undefined,
    }),
  });
}

// Video with aspect ratio
export interface AspectVideoPlayerProps extends Omit<AspectRatioProps, 'children' | 'ratio'> {
  /** Video source */
  src: string;
  /** Poster image */
  poster?: string;
  /** Auto play */
  autoplay?: boolean;
  /** Loop video */
  loop?: boolean;
  /** Muted */
  muted?: boolean;
  /** Show controls */
  controls?: boolean;
}

export function AspectVideoPlayer(props: AspectVideoPlayerProps): JSX.Element {
  const {
    src,
    poster,
    autoplay = false,
    loop = false,
    muted = false,
    controls = true,
    ...containerProps
  } = props;

  return AspectRatio({
    ...containerProps,
    ratio: 'video',
    children: jsx('video', {
      src,
      poster,
      autoplay,
      loop,
      muted,
      controls,
      class: 'absolute inset-0 w-full h-full object-cover',
      playsinline: true,
    }),
  });
}

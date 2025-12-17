# Agent 3: Universal Interface Architecture Report
## PhilJS Cross-Platform Rendering Strategy

**Date**: December 16, 2025
**Agent**: Universal Interface Architect
**Focus**: Multi-target rendering (DOM, WebGL/3D, Native Mobile, Terminal)

---

## Executive Summary

PhilJS currently implements a **web-only DOM renderer** with strong foundations in:
- Fine-grained reactive signals (Svelte-style)
- Qwik-style resumability for minimal JavaScript hydration
- Server-side rendering with streaming support
- Component-level islands architecture

**Gap Identified**: No abstraction layer for cross-platform rendering. All rendering code directly targets DOM elements via `document.createElement()`, HTML string generation, and DOM-specific hydration.

**Proposed Solution**: Implement a **Universal Renderer Architecture** inspired by React's reconciler pattern, Tamagui's primitive system, and R3F's declarative scene graphs, while maintaining PhilJS's unique signal-driven reactivity and compiler optimizations.

---

## Current Renderer Architecture Analysis

### 1. JSX Runtime (`packages/philjs-core/src/jsx-runtime.ts`)

**Current Implementation**:
```typescript
export type JSXElement = {
  type: string | Function;
  props: Record<string, any>;
  key?: string | number;
};

export function jsx(
  type: string | Function,
  props: Record<string, any>,
  key?: string | number
): JSXElement {
  const { children, ...rest } = props || {};
  return {
    type,
    props: {
      ...rest,
      children: children !== undefined ? normalizeChildren(children) : undefined,
    },
    key,
  };
}
```

**Strengths**:
- Platform-agnostic JSX element representation
- Clean separation of JSX creation from rendering
- Type system supports both intrinsic elements (strings) and components (functions)

**Limitations**:
- Global `JSX.IntrinsicElements` type allows ANY string element name
- No primitive abstraction layer
- Directly couples to HTML element names in TypeScript definitions

### 2. Server-Side Renderer (`render-to-string.ts`)

**Current Implementation**:
```typescript
function renderElement(tag: string, props: Record<string, any>): string {
  const { children, ...attrs } = props;
  const attrsString = renderAttrs(attrs);
  const openTag = attrsString ? `<${tag} ${attrsString}>` : `<${tag}>`;

  if (VOID_ELEMENTS.has(tag)) {
    return openTag;
  }

  const childrenString = renderToString(children);
  return `${openTag}${childrenString}</${tag}>`;
}
```

**Hardcoded DOM Assumptions**:
- `VOID_ELEMENTS` set (area, br, img, etc.)
- `BOOLEAN_ATTRS` for HTML-specific attributes
- `className` to `class` transformation
- HTML entity escaping (`&amp;`, `&lt;`, etc.)

### 3. Client-Side Hydration (`hydrate.ts`)

**Current Implementation**:
```typescript
function createDOMElement(vnode: VNode): Node | null {
  // ... type checking ...

  if (typeof type === "string") {
    const element = document.createElement(type);  // DOM-specific

    // Set attributes and event handlers
    for (const [key, value] of Object.entries(props)) {
      if (key.startsWith("on") && typeof value === "function") {
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, value);  // DOM events
      } else if (key === "className") {
        element.className = value;  // DOM property
      }
      // ... more DOM-specific code ...
    }

    return element;
  }
}
```

**DOM Coupling Points**:
- `document.createElement()`, `document.createTextNode()`
- `element.addEventListener()` for event handling
- Direct DOM property manipulation (`element.className`, `element.style`)
- `appendChild()`, `insertBefore()` for tree construction

### 4. Reactive System Integration

**Current Strength**: Signal-to-DOM reactivity is well-designed:
```typescript
if (typeof value === "function") {
  // Reactive attribute
  const update = () => {
    const attrValue = value();
    if (attrValue == null || attrValue === false) {
      element.removeAttribute(key);
    } else {
      element.setAttribute(key, String(attrValue));
    }
  };
  update();
  if (typeof value.subscribe === "function") {
    value.subscribe(update);
  }
}
```

**Key Insight**: The signal subscription model (`value.subscribe(update)`) is already abstracted from the rendering target. We can leverage this!

---

## Universal Primitives Specification

### Design Philosophy

Following **Tamagui's approach** but adapted for PhilJS's signal-first architecture:

1. **Minimal Core Set**: Start with 5 universal primitives
2. **Platform Specialization**: Each primitive maps to optimal native representation
3. **Style Prop Superset**: Support union of capabilities across platforms
4. **Compiler-First**: Leverage PhilJS compiler for platform-specific optimizations

### Primitive Definitions

```typescript
// packages/philjs-core/src/universal-primitives.ts

export type UniversalPrimitiveType =
  | 'View'      // Container with layout (div, View, <group>, Box)
  | 'Text'      // Text content (span, Text, <text>, Text)
  | 'Image'     // Images/textures (img, Image, <texture>, -)
  | 'Input'     // User input (input, TextInput, -, -)
  | 'Pressable' // Interactive element (button, TouchableOpacity, <mesh>, -)

export interface UniversalStyleProps {
  // Layout (Flexbox subset - works across all platforms)
  display?: 'flex' | 'none'
  flexDirection?: 'row' | 'column'
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between'
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch'
  gap?: number
  padding?: number | { top?: number; right?: number; bottom?: number; left?: number }
  margin?: number | { top?: number; right?: number; bottom?: number; left?: number }

  // Visual
  backgroundColor?: string
  opacity?: number
  borderRadius?: number

  // Transform (3D-aware)
  transform?: Transform3D
  position?: { x?: number; y?: number; z?: number }
  rotation?: { x?: number; y?: number; z?: number }
  scale?: number | { x?: number; y?: number; z?: number }

  // Platform-specific escape hatch
  web?: Partial<CSSProperties>
  native?: Record<string, any>
  webgl?: {
    material?: string
    geometry?: string
    // Three.js properties
  }
  terminal?: {
    border?: 'single' | 'double' | 'rounded'
    color?: TerminalColor
  }
}

export interface Transform3D {
  translate?: [number, number, number]
  rotate?: [number, number, number]
  scale?: [number, number, number]
  matrix?: number[] // 4x4 transformation matrix
}

export interface UniversalEventProps {
  // Universal events (mapped per platform)
  onPress?: () => void
  onHover?: (hovering: boolean) => void
  onFocus?: () => void
  onBlur?: () => void

  // Platform-specific
  onClick?: () => void        // DOM
  onPointerMove?: (e: any) => void  // WebGL/R3F
  onStdout?: (data: string) => void // Terminal
}

export interface ViewProps extends UniversalStyleProps, UniversalEventProps {
  children?: any
  ref?: any
}

export interface TextProps extends Partial<UniversalStyleProps>, UniversalEventProps {
  children?: string | number
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  color?: string
  ref?: any
}

export interface ImageProps extends Partial<UniversalStyleProps>, UniversalEventProps {
  src: string
  alt?: string
  width?: number
  height?: number
  ref?: any
}

export interface InputProps extends Partial<UniversalStyleProps>, UniversalEventProps {
  value: string | (() => string)
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'password' | 'email'
  ref?: any
}

export interface PressableProps extends ViewProps {
  onPress: () => void
  disabled?: boolean | (() => boolean)
}
```

### Example: Universal Component

```typescript
import { View, Text, Pressable } from 'philjs-core/universal'
import { signal } from 'philjs-core'

function Counter() {
  const count = signal(0)

  return (
    <View
      flexDirection="row"
      gap={16}
      padding={20}
      backgroundColor="#f0f0f0"
      borderRadius={8}
    >
      <Pressable onPress={() => count.set(c => c - 1)}>
        <Text fontSize={20}>-</Text>
      </Pressable>

      <Text fontSize={24} fontWeight="bold">
        {count}
      </Text>

      <Pressable onPress={() => count.set(c => c + 1)}>
        <Text fontSize={20}>+</Text>
      </Pressable>
    </View>
  )
}

// This component can now render to:
// - DOM (div, button, span)
// - React Native (View, TouchableOpacity, Text)
// - WebGL (Three.js mesh with text geometry)
// - Terminal (Ink Box with Text)
```

---

## Renderer Abstraction Layer Design

### Architecture Pattern: Pluggable Reconciler

Inspired by React's reconciler pattern but **optimized for PhilJS's signal-based reactivity**:

```typescript
// packages/philjs-core/src/renderer/types.ts

export interface RendererConfig<Instance, TextInstance, Container> {
  // Instance creation
  createInstance(
    type: UniversalPrimitiveType,
    props: UniversalStyleProps & UniversalEventProps,
    container: Container
  ): Instance

  createTextInstance(text: string, container: Container): TextInstance

  // Tree manipulation
  appendChild(parent: Instance, child: Instance | TextInstance): void
  insertBefore(parent: Instance, child: Instance | TextInstance, beforeChild: Instance | TextInstance): void
  removeChild(parent: Instance, child: Instance | TextInstance): void

  // Property updates
  updateInstanceProps(
    instance: Instance,
    oldProps: Record<string, any>,
    newProps: Record<string, any>
  ): void

  updateTextInstance(instance: TextInstance, newText: string): void

  // Event handling
  attachEventHandler(instance: Instance, event: string, handler: Function): void
  detachEventHandler(instance: Instance, event: string, handler: Function): void

  // Lifecycle
  commitMount(instance: Instance): void
  commitUnmount(instance: Instance): void

  // Platform identification
  platform: 'dom' | 'native' | 'webgl' | 'terminal'

  // Feature flags
  supportsMutation: boolean
  supportsHydration: boolean
  supportsPersistence: boolean
}

export interface RendererInstance {
  render(vnode: VNode, container: any): void
  hydrate?(vnode: VNode, container: any): void
  unmount(container: any): void
}
```

### Core Renderer Factory

```typescript
// packages/philjs-core/src/renderer/core-renderer.ts

import type { VNode, JSXElement } from '../jsx-runtime.js'
import type { Signal } from '../signals.js'
import { effect, untrack } from '../signals.js'
import type { RendererConfig, RendererInstance } from './types.js'

export function createRenderer<Instance, TextInstance, Container>(
  config: RendererConfig<Instance, TextInstance, Container>
): RendererInstance {

  function renderNode(
    vnode: VNode,
    container: Instance | Container
  ): Instance | TextInstance | null {
    // Handle primitives
    if (vnode == null || vnode === false || vnode === true) {
      return null
    }

    // Text nodes
    if (typeof vnode === 'string' || typeof vnode === 'number') {
      return config.createTextInstance(String(vnode), container as Container)
    }

    // Arrays
    if (Array.isArray(vnode)) {
      const fragment = createFragment()
      vnode.forEach(child => {
        const instance = renderNode(child, container)
        if (instance) {
          config.appendChild(fragment, instance)
        }
      })
      return fragment
    }

    // JSX Elements
    if (!isJSXElement(vnode)) return null

    const { type, props } = vnode

    // Function components
    if (typeof type === 'function') {
      const result = type(props)
      return renderNode(result, container)
    }

    // Platform primitives
    if (typeof type === 'string') {
      // Map HTML elements to universal primitives
      const primitiveType = mapToPrimitive(type)
      const instance = config.createInstance(primitiveType, props, container as Container)

      // Attach reactive properties
      attachReactiveProps(instance, props, config)

      // Attach event handlers
      attachEvents(instance, props, config)

      // Render children
      if (props.children) {
        const children = Array.isArray(props.children) ? props.children : [props.children]
        children.forEach((child: any) => {
          // Handle reactive children (signals)
          if (typeof child === 'function' && 'subscribe' in child) {
            attachReactiveChild(instance, child, config)
          } else {
            const childInstance = renderNode(child, instance as any)
            if (childInstance) {
              config.appendChild(instance, childInstance)
            }
          }
        })
      }

      config.commitMount(instance)
      return instance
    }

    return null
  }

  function attachReactiveProps<I>(
    instance: I,
    props: Record<string, any>,
    config: RendererConfig<I, any, any>
  ): void {
    for (const [key, value] of Object.entries(props)) {
      if (key === 'children' || key.startsWith('on')) continue

      // Check if value is a signal/memo (has subscribe method)
      if (typeof value === 'function' && 'subscribe' in value) {
        const signal = value as Signal<any>

        // Create reactive effect
        const dispose = effect(() => {
          const currentValue = signal()
          const newProps = { ...props, [key]: currentValue }
          config.updateInstanceProps(instance, props, newProps)
        })

        // Store cleanup for unmount
        storeDisposal(instance, dispose)
      }
    }
  }

  function attachReactiveChild<I, T>(
    parent: I,
    signalChild: Signal<any>,
    config: RendererConfig<I, T, any>
  ): void {
    let currentInstances: Array<I | T> = []

    const dispose = effect(() => {
      const newValue = signalChild()

      // Remove old instances
      currentInstances.forEach(instance => {
        config.removeChild(parent, instance)
      })

      // Render new value
      const newInstances = renderNode(newValue, parent as any)
      if (newInstances) {
        if (Array.isArray(newInstances)) {
          currentInstances = newInstances
          newInstances.forEach(inst => config.appendChild(parent, inst))
        } else {
          currentInstances = [newInstances]
          config.appendChild(parent, newInstances)
        }
      } else {
        currentInstances = []
      }
    })

    storeDisposal(parent, dispose)
  }

  function attachEvents<I>(
    instance: I,
    props: Record<string, any>,
    config: RendererConfig<I, any, any>
  ): void {
    for (const [key, value] of Object.entries(props)) {
      if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.slice(2).toLowerCase()
        config.attachEventHandler(instance, eventName, value)
      }
    }
  }

  // Public API
  return {
    render(vnode: VNode, container: any): void {
      const instance = renderNode(vnode, container)
      if (instance) {
        config.appendChild(container, instance)
      }
    },

    hydrate: config.supportsHydration ? (vnode: VNode, container: any) => {
      // Hydration logic (similar to current hydrate.ts but platform-agnostic)
      // ...
    } : undefined,

    unmount(container: any): void {
      // Cleanup all stored disposals
      cleanupContainer(container, config)
    }
  }
}

// Helper functions
const disposalMap = new WeakMap<any, Array<() => void>>()

function storeDisposal(instance: any, dispose: () => void): void {
  const disposals = disposalMap.get(instance) || []
  disposals.push(dispose)
  disposalMap.set(instance, disposals)
}

function cleanupContainer<I>(container: any, config: RendererConfig<I, any, any>): void {
  // Traverse tree and call all disposals
  // ...
}

function mapToPrimitive(htmlTag: string): UniversalPrimitiveType {
  const mapping: Record<string, UniversalPrimitiveType> = {
    'div': 'View',
    'section': 'View',
    'article': 'View',
    'header': 'View',
    'footer': 'View',
    'main': 'View',
    'span': 'Text',
    'p': 'Text',
    'h1': 'Text',
    'h2': 'Text',
    'h3': 'Text',
    'h4': 'Text',
    'h5': 'Text',
    'h6': 'Text',
    'label': 'Text',
    'img': 'Image',
    'input': 'Input',
    'textarea': 'Input',
    'button': 'Pressable',
    'a': 'Pressable',
  }

  return mapping[htmlTag] || 'View'
}
```

---

## Platform Adapter Interfaces

### 1. DOM Renderer Adapter

```typescript
// packages/philjs-core/src/renderer/dom-renderer.ts

import { createRenderer } from './core-renderer.js'
import type { RendererConfig } from './types.js'
import type { UniversalPrimitiveType, UniversalStyleProps, UniversalEventProps } from '../universal-primitives.js'

type DOMInstance = HTMLElement
type DOMTextInstance = Text
type DOMContainer = HTMLElement

const DOMRendererConfig: RendererConfig<DOMInstance, DOMTextInstance, DOMContainer> = {
  platform: 'dom',
  supportsMutation: true,
  supportsHydration: true,
  supportsPersistence: false,

  createInstance(type: UniversalPrimitiveType, props: UniversalStyleProps & UniversalEventProps): DOMInstance {
    const tagMapping: Record<UniversalPrimitiveType, string> = {
      'View': 'div',
      'Text': 'span',
      'Image': 'img',
      'Input': 'input',
      'Pressable': 'button',
    }

    const element = document.createElement(tagMapping[type])

    // Apply styles
    applyDOMStyles(element, props)

    return element
  },

  createTextInstance(text: string): DOMTextInstance {
    return document.createTextNode(text)
  },

  appendChild(parent: DOMInstance, child: DOMInstance | DOMTextInstance): void {
    parent.appendChild(child)
  },

  insertBefore(parent: DOMInstance, child: DOMInstance | DOMTextInstance, beforeChild: DOMInstance | DOMTextInstance): void {
    parent.insertBefore(child, beforeChild)
  },

  removeChild(parent: DOMInstance, child: DOMInstance | DOMTextInstance): void {
    parent.removeChild(child)
  },

  updateInstanceProps(instance: DOMInstance, oldProps: Record<string, any>, newProps: Record<string, any>): void {
    // Diff and update only changed props
    const changedKeys = Object.keys({ ...oldProps, ...newProps })

    for (const key of changedKeys) {
      if (oldProps[key] !== newProps[key]) {
        if (key in (UniversalStyleProps as any)) {
          applyDOMStyles(instance, { [key]: newProps[key] } as any)
        }
      }
    }
  },

  updateTextInstance(instance: DOMTextInstance, newText: string): void {
    instance.textContent = newText
  },

  attachEventHandler(instance: DOMInstance, event: string, handler: Function): void {
    // Map universal events to DOM events
    const eventMap: Record<string, string> = {
      'press': 'click',
      'hover': 'mouseenter',
    }

    const domEvent = eventMap[event] || event
    instance.addEventListener(domEvent, handler as EventListener)
  },

  detachEventHandler(instance: DOMInstance, event: string, handler: Function): void {
    const eventMap: Record<string, string> = {
      'press': 'click',
      'hover': 'mouseenter',
    }

    const domEvent = eventMap[event] || event
    instance.removeEventListener(domEvent, handler as EventListener)
  },

  commitMount(instance: DOMInstance): void {
    // Any post-creation setup
  },

  commitUnmount(instance: DOMInstance): void {
    // Cleanup
  },
}

function applyDOMStyles(element: HTMLElement, props: UniversalStyleProps): void {
  const style = element.style

  // Layout
  if (props.display) {
    style.display = props.display
  }
  if (props.flexDirection) {
    style.flexDirection = props.flexDirection
  }
  if (props.justifyContent) {
    style.justifyContent = props.justifyContent
  }
  if (props.alignItems) {
    style.alignItems = props.alignItems
  }
  if (props.gap !== undefined) {
    style.gap = `${props.gap}px`
  }

  // Spacing
  if (typeof props.padding === 'number') {
    style.padding = `${props.padding}px`
  } else if (props.padding) {
    const { top, right, bottom, left } = props.padding
    style.padding = `${top || 0}px ${right || 0}px ${bottom || 0}px ${left || 0}px`
  }

  if (typeof props.margin === 'number') {
    style.margin = `${props.margin}px`
  } else if (props.margin) {
    const { top, right, bottom, left } = props.margin
    style.margin = `${top || 0}px ${right || 0}px ${bottom || 0}px ${left || 0}px`
  }

  // Visual
  if (props.backgroundColor) {
    style.backgroundColor = props.backgroundColor
  }
  if (props.opacity !== undefined) {
    style.opacity = String(props.opacity)
  }
  if (props.borderRadius !== undefined) {
    style.borderRadius = `${props.borderRadius}px`
  }

  // Transform (3D)
  if (props.transform || props.position || props.rotation || props.scale) {
    const transforms: string[] = []

    if (props.position) {
      transforms.push(`translate3d(${props.position.x || 0}px, ${props.position.y || 0}px, ${props.position.z || 0}px)`)
    }

    if (props.rotation) {
      transforms.push(`rotateX(${props.rotation.x || 0}deg)`)
      transforms.push(`rotateY(${props.rotation.y || 0}deg)`)
      transforms.push(`rotateZ(${props.rotation.z || 0}deg)`)
    }

    if (props.scale) {
      if (typeof props.scale === 'number') {
        transforms.push(`scale3d(${props.scale}, ${props.scale}, ${props.scale})`)
      } else {
        transforms.push(`scale3d(${props.scale.x || 1}, ${props.scale.y || 1}, ${props.scale.z || 1})`)
      }
    }

    if (transforms.length > 0) {
      style.transform = transforms.join(' ')
    }
  }

  // Platform-specific escape hatch
  if (props.web) {
    Object.assign(style, props.web)
  }
}

export const DOMRenderer = createRenderer(DOMRendererConfig)
```

### 2. WebGL/Three.js Renderer Adapter

```typescript
// packages/philjs-webgl/src/webgl-renderer.ts

import * as THREE from 'three'
import { createRenderer } from 'philjs-core/renderer/core-renderer'
import type { RendererConfig } from 'philjs-core/renderer/types'
import type { UniversalPrimitiveType, UniversalStyleProps, UniversalEventProps } from 'philjs-core/universal-primitives'

type WebGLInstance = THREE.Object3D
type WebGLTextInstance = THREE.Sprite // Text rendered as sprite with canvas texture
type WebGLContainer = THREE.Scene

const WebGLRendererConfig: RendererConfig<WebGLInstance, WebGLTextInstance, WebGLContainer> = {
  platform: 'webgl',
  supportsMutation: true,
  supportsHydration: false,
  supportsPersistence: false,

  createInstance(type: UniversalPrimitiveType, props: UniversalStyleProps & UniversalEventProps, container: WebGLContainer): WebGLInstance {
    let object: THREE.Object3D

    switch (type) {
      case 'View': {
        // Group acts as container
        object = new THREE.Group()
        break
      }

      case 'Pressable':
      case 'Image': {
        // Create a mesh with plane geometry
        const geometry = new THREE.PlaneGeometry(
          props.width || 100,
          props.height || 100
        )

        // Material based on props
        const material = props.webgl?.material
          ? createMaterialFromString(props.webgl.material)
          : new THREE.MeshStandardMaterial({
              color: props.backgroundColor || 0xffffff,
              transparent: props.opacity !== undefined,
              opacity: props.opacity ?? 1,
            })

        object = new THREE.Mesh(geometry, material)

        // Load texture for Image
        if (type === 'Image' && (props as any).src) {
          const textureLoader = new THREE.TextureLoader()
          textureLoader.load((props as any).src, (texture) => {
            (material as THREE.MeshStandardMaterial).map = texture
            ;(material as THREE.MeshStandardMaterial).needsUpdate = true
          })
        }
        break
      }

      case 'Text': {
        // Create text sprite (simplified - production would use THREE.TextGeometry or troika-three-text)
        object = createTextSprite((props as any).children || '', props)
        break
      }

      default: {
        object = new THREE.Group()
      }
    }

    // Apply transforms
    applyWebGLTransforms(object, props)

    return object
  },

  createTextInstance(text: string, container: WebGLContainer): WebGLTextInstance {
    return createTextSprite(text, {})
  },

  appendChild(parent: WebGLInstance, child: WebGLInstance | WebGLTextInstance): void {
    parent.add(child)
  },

  insertBefore(parent: WebGLInstance, child: WebGLInstance | WebGLTextInstance, beforeChild: WebGLInstance | WebGLTextInstance): void {
    const index = parent.children.indexOf(beforeChild)
    parent.children.splice(index, 0, child)
    child.parent = parent
  },

  removeChild(parent: WebGLInstance, child: WebGLInstance | WebGLTextInstance): void {
    parent.remove(child)
  },

  updateInstanceProps(instance: WebGLInstance, oldProps: Record<string, any>, newProps: Record<string, any>): void {
    applyWebGLTransforms(instance, newProps)

    // Update material properties if it's a Mesh
    if (instance instanceof THREE.Mesh && instance.material instanceof THREE.MeshStandardMaterial) {
      if (newProps.backgroundColor) {
        instance.material.color.set(newProps.backgroundColor)
      }
      if (newProps.opacity !== undefined) {
        instance.material.opacity = newProps.opacity
        instance.material.transparent = newProps.opacity < 1
      }
    }
  },

  updateTextInstance(instance: WebGLTextInstance, newText: string): void {
    // Recreate sprite with new text
    const newSprite = createTextSprite(newText, {})
    instance.material = newSprite.material
    instance.scale.copy(newSprite.scale)
  },

  attachEventHandler(instance: WebGLInstance, event: string, handler: Function): void {
    // Store event handlers for raycasting
    if (!instance.userData.eventHandlers) {
      instance.userData.eventHandlers = {}
    }
    instance.userData.eventHandlers[event] = handler
  },

  detachEventHandler(instance: WebGLInstance, event: string, handler: Function): void {
    if (instance.userData.eventHandlers) {
      delete instance.userData.eventHandlers[event]
    }
  },

  commitMount(instance: WebGLInstance): void {
    // Enable raycasting for interactive objects
    if (instance.userData.eventHandlers?.press) {
      instance.userData.interactive = true
    }
  },

  commitUnmount(instance: WebGLInstance): void {
    // Dispose geometries and materials
    if (instance instanceof THREE.Mesh) {
      instance.geometry.dispose()
      if (Array.isArray(instance.material)) {
        instance.material.forEach(mat => mat.dispose())
      } else {
        instance.material.dispose()
      }
    }
  },
}

function applyWebGLTransforms(object: THREE.Object3D, props: UniversalStyleProps): void {
  // Position
  if (props.position) {
    object.position.set(
      props.position.x || 0,
      props.position.y || 0,
      props.position.z || 0
    )
  }

  // Rotation
  if (props.rotation) {
    object.rotation.set(
      THREE.MathUtils.degToRad(props.rotation.x || 0),
      THREE.MathUtils.degToRad(props.rotation.y || 0),
      THREE.MathUtils.degToRad(props.rotation.z || 0)
    )
  }

  // Scale
  if (props.scale) {
    if (typeof props.scale === 'number') {
      object.scale.setScalar(props.scale)
    } else {
      object.scale.set(
        props.scale.x || 1,
        props.scale.y || 1,
        props.scale.z || 1
      )
    }
  }

  // Transform matrix (if provided)
  if (props.transform?.matrix) {
    object.matrix.fromArray(props.transform.matrix)
    object.matrixAutoUpdate = false
  }
}

function createTextSprite(text: string, props: any): THREE.Sprite {
  // Create canvas for text
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!

  const fontSize = props.fontSize || 16
  context.font = `${props.fontWeight === 'bold' ? 'bold ' : ''}${fontSize}px Arial`

  const metrics = context.measureText(text)
  canvas.width = metrics.width
  canvas.height = fontSize * 1.5

  // Redraw with proper size
  context.font = `${props.fontWeight === 'bold' ? 'bold ' : ''}${fontSize}px Arial`
  context.fillStyle = props.color || '#ffffff'
  context.fillText(text, 0, fontSize)

  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({ map: texture })
  const sprite = new THREE.Sprite(material)

  sprite.scale.set(canvas.width / 10, canvas.height / 10, 1)

  return sprite
}

function createMaterialFromString(materialType: string): THREE.Material {
  switch (materialType) {
    case 'standard':
      return new THREE.MeshStandardMaterial()
    case 'basic':
      return new THREE.MeshBasicMaterial()
    case 'phong':
      return new THREE.MeshPhongMaterial()
    case 'physical':
      return new THREE.MeshPhysicalMaterial()
    default:
      return new THREE.MeshStandardMaterial()
  }
}

export const WebGLRenderer = createRenderer(WebGLRendererConfig)

// Export helper for creating 3D scenes
export function createWebGLScene(
  canvasElement: HTMLCanvasElement,
  options: {
    camera?: THREE.Camera
    lights?: THREE.Light[]
    backgroundColor?: number
  } = {}
): { scene: THREE.Scene; renderer: THREE.WebGLRenderer; render: Function } {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(options.backgroundColor ?? 0x000000)

  const renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true })
  renderer.setSize(canvasElement.width, canvasElement.height)

  const camera = options.camera || new THREE.PerspectiveCamera(
    75,
    canvasElement.width / canvasElement.height,
    0.1,
    1000
  )
  camera.position.z = 5

  if (options.lights) {
    options.lights.forEach(light => scene.add(light))
  } else {
    // Default lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight.position.set(5, 5, 5)
    scene.add(ambientLight, directionalLight)
  }

  return {
    scene,
    renderer,
    render: () => renderer.render(scene, camera)
  }
}
```

### 3. React Native Renderer Adapter (Tamagui-inspired)

```typescript
// packages/philjs-native/src/native-renderer.ts

import { createRenderer } from 'philjs-core/renderer/core-renderer'
import type { RendererConfig } from 'philjs-core/renderer/types'
import type { UniversalPrimitiveType, UniversalStyleProps, UniversalEventProps } from 'philjs-core/universal-primitives'

// React Native components (imported conditionally in native environment)
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet } from 'react-native'

type NativeInstance = {
  type: 'View' | 'Text' | 'Image' | 'TextInput' | 'TouchableOpacity'
  props: Record<string, any>
  children: Array<NativeInstance | NativeTextInstance>
}

type NativeTextInstance = {
  type: 'text'
  content: string
}

type NativeContainer = NativeInstance

const NativeRendererConfig: RendererConfig<NativeInstance, NativeTextInstance, NativeContainer> = {
  platform: 'native',
  supportsMutation: true,
  supportsHydration: false,
  supportsPersistence: true, // React Native uses persistent mode

  createInstance(type: UniversalPrimitiveType, props: UniversalStyleProps & UniversalEventProps): NativeInstance {
    const componentMapping: Record<UniversalPrimitiveType, string> = {
      'View': 'View',
      'Text': 'Text',
      'Image': 'Image',
      'Input': 'TextInput',
      'Pressable': 'TouchableOpacity',
    }

    const nativeProps = convertToNativeProps(props, type)

    return {
      type: componentMapping[type] as any,
      props: nativeProps,
      children: [],
    }
  },

  createTextInstance(text: string): NativeTextInstance {
    return {
      type: 'text',
      content: text,
    }
  },

  appendChild(parent: NativeInstance, child: NativeInstance | NativeTextInstance): void {
    parent.children.push(child)
  },

  insertBefore(parent: NativeInstance, child: NativeInstance | NativeTextInstance, beforeChild: NativeInstance | NativeTextInstance): void {
    const index = parent.children.indexOf(beforeChild)
    parent.children.splice(index, 0, child)
  },

  removeChild(parent: NativeInstance, child: NativeInstance | NativeTextInstance): void {
    const index = parent.children.indexOf(child)
    if (index !== -1) {
      parent.children.splice(index, 1)
    }
  },

  updateInstanceProps(instance: NativeInstance, oldProps: Record<string, any>, newProps: Record<string, any>): void {
    instance.props = convertToNativeProps(newProps, instance.type as any)
  },

  updateTextInstance(instance: NativeTextInstance, newText: string): void {
    instance.content = newText
  },

  attachEventHandler(instance: NativeInstance, event: string, handler: Function): void {
    const eventMapping: Record<string, string> = {
      'press': 'onPress',
      'hover': 'onPressIn', // Closest equivalent
      'focus': 'onFocus',
      'blur': 'onBlur',
    }

    const nativeEvent = eventMapping[event] || event
    instance.props[nativeEvent] = handler
  },

  detachEventHandler(instance: NativeInstance, event: string, handler: Function): void {
    const eventMapping: Record<string, string> = {
      'press': 'onPress',
      'hover': 'onPressIn',
      'focus': 'onFocus',
      'blur': 'onBlur',
    }

    const nativeEvent = eventMapping[event] || event
    delete instance.props[nativeEvent]
  },

  commitMount(instance: NativeInstance): void {
    // No-op for React Native
  },

  commitUnmount(instance: NativeInstance): void {
    // Cleanup if needed
  },
}

function convertToNativeProps(props: UniversalStyleProps & UniversalEventProps, type: UniversalPrimitiveType): Record<string, any> {
  const style: any = {}
  const nativeProps: any = { style }

  // Layout
  if (props.display === 'flex' || !props.display) {
    style.display = 'flex' // React Native default
  }
  if (props.flexDirection) {
    style.flexDirection = props.flexDirection
  }
  if (props.justifyContent) {
    style.justifyContent = props.justifyContent
  }
  if (props.alignItems) {
    style.alignItems = props.alignItems
  }
  if (props.gap !== undefined) {
    style.gap = props.gap
  }

  // Spacing
  if (typeof props.padding === 'number') {
    style.padding = props.padding
  } else if (props.padding) {
    style.paddingTop = props.padding.top
    style.paddingRight = props.padding.right
    style.paddingBottom = props.padding.bottom
    style.paddingLeft = props.padding.left
  }

  if (typeof props.margin === 'number') {
    style.margin = props.margin
  } else if (props.margin) {
    style.marginTop = props.margin.top
    style.marginRight = props.margin.right
    style.marginBottom = props.margin.bottom
    style.marginLeft = props.margin.left
  }

  // Visual
  if (props.backgroundColor) {
    style.backgroundColor = props.backgroundColor
  }
  if (props.opacity !== undefined) {
    style.opacity = props.opacity
  }
  if (props.borderRadius !== undefined) {
    style.borderRadius = props.borderRadius
  }

  // Transform (React Native supports these!)
  const transform: any[] = []

  if (props.position) {
    if (props.position.x) transform.push({ translateX: props.position.x })
    if (props.position.y) transform.push({ translateY: props.position.y })
    // Note: translateZ not supported in React Native
  }

  if (props.rotation) {
    if (props.rotation.x) transform.push({ rotateX: `${props.rotation.x}deg` })
    if (props.rotation.y) transform.push({ rotateY: `${props.rotation.y}deg` })
    if (props.rotation.z) transform.push({ rotateZ: `${props.rotation.z}deg` })
  }

  if (props.scale) {
    if (typeof props.scale === 'number') {
      transform.push({ scale: props.scale })
    } else {
      if (props.scale.x) transform.push({ scaleX: props.scale.x })
      if (props.scale.y) transform.push({ scaleY: props.scale.y })
    }
  }

  if (transform.length > 0) {
    style.transform = transform
  }

  // Platform-specific props
  if (props.native) {
    Object.assign(style, props.native)
  }

  // Type-specific props
  if (type === 'Image') {
    nativeProps.source = { uri: (props as any).src }
    if ((props as any).alt) {
      nativeProps.accessibilityLabel = (props as any).alt
    }
  }

  if (type === 'Input') {
    nativeProps.value = (props as any).value
    nativeProps.onChangeText = (props as any).onChange
    nativeProps.placeholder = (props as any).placeholder
  }

  return nativeProps
}

export const NativeRenderer = createRenderer(NativeRendererConfig)
```

### 4. Terminal/CLI Renderer Adapter (Ink-inspired)

```typescript
// packages/philjs-terminal/src/terminal-renderer.ts

import { createRenderer } from 'philjs-core/renderer/core-renderer'
import type { RendererConfig } from 'philjs-core/renderer/types'
import type { UniversalPrimitiveType, UniversalStyleProps, UniversalEventProps } from 'philjs-core/universal-primitives'

// Simplified terminal rendering (production would use blessed or ink)
type TerminalInstance = {
  type: 'box' | 'text' | 'input'
  props: Record<string, any>
  children: Array<TerminalInstance | TerminalTextInstance>
  content?: string
}

type TerminalTextInstance = {
  type: 'text-node'
  content: string
}

type TerminalContainer = {
  stdout: NodeJS.WriteStream
  instances: TerminalInstance[]
}

const TerminalRendererConfig: RendererConfig<TerminalInstance, TerminalTextInstance, TerminalContainer> = {
  platform: 'terminal',
  supportsMutation: true,
  supportsHydration: false,
  supportsPersistence: false,

  createInstance(type: UniversalPrimitiveType, props: UniversalStyleProps & UniversalEventProps): TerminalInstance {
    const terminalType = type === 'Text' ? 'text' : type === 'Input' ? 'input' : 'box'

    return {
      type: terminalType,
      props: convertToTerminalProps(props),
      children: [],
      content: (props as any).children,
    }
  },

  createTextInstance(text: string): TerminalTextInstance {
    return {
      type: 'text-node',
      content: text,
    }
  },

  appendChild(parent: TerminalInstance, child: TerminalInstance | TerminalTextInstance): void {
    parent.children.push(child)
  },

  insertBefore(parent: TerminalInstance, child: TerminalInstance | TerminalTextInstance, beforeChild: TerminalInstance | TerminalTextInstance): void {
    const index = parent.children.indexOf(beforeChild)
    parent.children.splice(index, 0, child)
  },

  removeChild(parent: TerminalInstance, child: TerminalInstance | TerminalTextInstance): void {
    const index = parent.children.indexOf(child)
    if (index !== -1) {
      parent.children.splice(index, 1)
    }
  },

  updateInstanceProps(instance: TerminalInstance, oldProps: Record<string, any>, newProps: Record<string, any>): void {
    instance.props = convertToTerminalProps(newProps)
  },

  updateTextInstance(instance: TerminalTextInstance, newText: string): void {
    instance.content = newText
  },

  attachEventHandler(instance: TerminalInstance, event: string, handler: Function): void {
    // Terminal events are limited (keyboard input mainly)
    instance.props[`on${event}`] = handler
  },

  detachEventHandler(instance: TerminalInstance, event: string, handler: Function): void {
    delete instance.props[`on${event}`]
  },

  commitMount(instance: TerminalInstance): void {
    // Trigger render
  },

  commitUnmount(instance: TerminalInstance): void {
    // Cleanup
  },
}

function convertToTerminalProps(props: UniversalStyleProps & UniversalEventProps): Record<string, any> {
  const terminalProps: any = {}

  // Layout - terminal uses simple box model
  if (props.flexDirection === 'row') {
    terminalProps.flexDirection = 'row'
  } else {
    terminalProps.flexDirection = 'column'
  }

  if (typeof props.padding === 'number') {
    terminalProps.padding = props.padding
  }

  if (typeof props.margin === 'number') {
    terminalProps.margin = props.margin
  }

  // Visual - terminal colors
  if (props.backgroundColor) {
    terminalProps.backgroundColor = convertColorToTerminal(props.backgroundColor)
  }

  if ((props as any).color) {
    terminalProps.color = convertColorToTerminal((props as any).color)
  }

  // Terminal-specific
  if (props.terminal) {
    Object.assign(terminalProps, props.terminal)
  }

  return terminalProps
}

function convertColorToTerminal(color: string): string {
  // Map hex/named colors to terminal ANSI colors
  const colorMap: Record<string, string> = {
    '#000000': 'black',
    '#ffffff': 'white',
    '#ff0000': 'red',
    '#00ff00': 'green',
    '#0000ff': 'blue',
    '#ffff00': 'yellow',
    '#00ffff': 'cyan',
    '#ff00ff': 'magenta',
  }

  return colorMap[color.toLowerCase()] || 'white'
}

export const TerminalRenderer = createRenderer(TerminalRendererConfig)

// Export CLI rendering function
export function renderToTerminal(vnode: any): void {
  const container: TerminalContainer = {
    stdout: process.stdout,
    instances: [],
  }

  TerminalRenderer.render(vnode, container)

  // Output to terminal (simplified - production would use blessed/ink)
  const output = serializeTerminalTree(container.instances)
  console.log(output)
}

function serializeTerminalTree(instances: Array<TerminalInstance | TerminalTextInstance>, indent = 0): string {
  let output = ''

  for (const instance of instances) {
    if (instance.type === 'text-node') {
      output += ' '.repeat(indent) + instance.content + '\n'
    } else {
      const boxChar = instance.props.border === 'rounded' ? '╭─╮│╰─╯' : '┌─┐││└─┘'
      output += ' '.repeat(indent) + `[${instance.type}]\n`

      if (instance.content) {
        output += ' '.repeat(indent + 2) + instance.content + '\n'
      }

      if (instance.children.length > 0) {
        output += serializeTerminalTree(instance.children, indent + 2)
      }
    }
  }

  return output
}
```

---

## 3D Scene Graph Integration

### Specialized 3D Primitives

For full 3D applications, extend universal primitives with 3D-specific components:

```typescript
// packages/philjs-webgl/src/3d-primitives.ts

import type { UniversalStyleProps } from 'philjs-core/universal-primitives'

export interface Mesh3DProps extends UniversalStyleProps {
  geometry: 'box' | 'sphere' | 'plane' | 'cylinder' | string
  material?: 'standard' | 'basic' | 'phong' | 'physical'
  color?: string
  wireframe?: boolean
  castShadow?: boolean
  receiveShadow?: boolean
  onClick?: (event: ThreeEvent) => void
  onPointerMove?: (event: ThreeEvent) => void
}

export interface Light3DProps {
  type: 'ambient' | 'directional' | 'point' | 'spot'
  color?: string
  intensity?: number
  position?: [number, number, number]
  target?: [number, number, number]
}

export interface Camera3DProps {
  type: 'perspective' | 'orthographic'
  fov?: number
  aspect?: number
  near?: number
  far?: number
  position?: [number, number, number]
  lookAt?: [number, number, number]
}

// Example: 3D Scene with PhilJS primitives
import { View } from 'philjs-core/universal'
import { Mesh, Light, Camera, Scene } from 'philjs-webgl/3d-primitives'
import { signal } from 'philjs-core'

function Rotating3DBox() {
  const rotation = signal(0)

  // Animate rotation
  requestAnimationFrame(function animate() {
    rotation.set(r => r + 0.01)
    requestAnimationFrame(animate)
  })

  return (
    <Scene>
      <Camera type="perspective" position={[0, 0, 5]} />
      <Light type="ambient" intensity={0.5} />
      <Light type="directional" position={[5, 5, 5]} intensity={0.5} />

      <Mesh
        geometry="box"
        material="standard"
        color="#667eea"
        rotation={{ y: rotation }}
        onClick={() => console.log('Box clicked!')}
        castShadow
      />
    </Scene>
  )
}
```

### Integration with React Three Fiber Ecosystem

For advanced 3D features, provide interop with R3F:

```typescript
// packages/philjs-webgl/src/r3f-bridge.ts

import { Canvas } from '@react-three/fiber'
import { WebGLRenderer } from './webgl-renderer'

export function PhilCanvas(props: {
  children: any
  camera?: any
  lights?: any[]
}) {
  // Bridge PhilJS components to R3F
  // Use R3F's reconciler but with PhilJS signals

  return (
    <Canvas>
      {/* Convert PhilJS vnodes to R3F components */}
      {convertPhilToR3F(props.children)}
    </Canvas>
  )
}

function convertPhilToR3F(vnode: any): any {
  // Transformation logic
  // Maps PhilJS primitives to R3F equivalents
}
```

---

## Component Syntax Examples

### Example 1: Counter (All Platforms)

```typescript
import { View, Text, Pressable } from 'philjs-core/universal'
import { signal } from 'philjs-core'

function Counter() {
  const count = signal(0)

  return (
    <View
      flexDirection="row"
      gap={16}
      padding={20}
      backgroundColor="#f0f0f0"
      borderRadius={8}
      // Platform-specific styling
      web={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
      terminal={{ border: 'rounded' }}
    >
      <Pressable onPress={() => count.set(c => c - 1)}>
        <Text fontSize={20}>-</Text>
      </Pressable>

      <Text fontSize={24} fontWeight="bold">
        {count}
      </Text>

      <Pressable onPress={() => count.set(c => c + 1)}>
        <Text fontSize={20}>+</Text>
      </Pressable>
    </View>
  )
}

// Render to different targets:

// DOM
import { DOMRenderer } from 'philjs-core/renderer/dom-renderer'
DOMRenderer.render(<Counter />, document.getElementById('app'))

// WebGL
import { WebGLRenderer } from 'philjs-webgl'
const { scene } = createWebGLScene(canvas)
WebGLRenderer.render(<Counter />, scene)

// React Native
import { NativeRenderer } from 'philjs-native'
// ... React Native bridge

// Terminal
import { renderToTerminal } from 'philjs-terminal'
renderToTerminal(<Counter />)
```

### Example 2: 3D Product Viewer with UI Overlay

```typescript
import { View, Text, Pressable, Image } from 'philjs-core/universal'
import { Scene, Mesh, Camera, Light } from 'philjs-webgl/3d-primitives'
import { signal, memo } from 'philjs-core'

function ProductViewer() {
  const rotation = signal({ x: 0, y: 0 })
  const selectedView = signal<'front' | 'side' | 'top'>('front')

  const cameraPosition = memo(() => {
    const views = {
      'front': [0, 0, 5],
      'side': [5, 0, 0],
      'top': [0, 5, 0],
    }
    return views[selectedView()]
  })

  return (
    <View
      style={{
        width: '100%',
        height: '100vh',
        position: 'relative',
      }}
    >
      {/* 3D Scene */}
      <Scene
        backgroundColor={0x222222}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Camera type="perspective" position={cameraPosition} />
        <Light type="ambient" intensity={0.5} />
        <Light type="directional" position={[5, 5, 5]} />

        <Mesh
          geometry="custom"
          src="/models/product.gltf"
          rotation={rotation}
          onPointerMove={(e) => {
            if (e.buttons === 1) {
              rotation.set({
                x: rotation().x + e.movementY * 0.01,
                y: rotation().y + e.movementX * 0.01,
              })
            }
          }}
        />
      </Scene>

      {/* UI Overlay (renders as DOM on web, stays 3D on pure WebGL) */}
      <View
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          flexDirection: 'row',
          gap: 10,
        }}
      >
        {(['front', 'side', 'top'] as const).map(view => (
          <Pressable
            key={view}
            onPress={() => selectedView.set(view)}
            backgroundColor={selectedView() === view ? '#667eea' : '#ffffff'}
            padding={12}
            borderRadius={8}
          >
            <Text
              color={selectedView() === view ? '#ffffff' : '#000000'}
              fontWeight="bold"
            >
              {view.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}
```

### Example 3: CLI Tool

```typescript
import { View, Text, Input } from 'philjs-core/universal'
import { signal } from 'philjs-core'
import { renderToTerminal } from 'philjs-terminal'

function TodoCLI() {
  const todos = signal<string[]>([])
  const input = signal('')

  return (
    <View padding={2}>
      <Text fontSize={18} fontWeight="bold" color="#00ff00">
        📝 Todo CLI
      </Text>

      <View margin={{ top: 2, bottom: 2 }}>
        {todos().length === 0 ? (
          <Text color="#666666">No todos yet. Add one below!</Text>
        ) : (
          todos().map((todo, i) => (
            <Text key={i}>
              {i + 1}. {todo}
            </Text>
          ))
        )}
      </View>

      <Input
        value={input}
        onChange={(val) => input.set(val)}
        placeholder="Enter new todo..."
        onSubmit={() => {
          if (input()) {
            todos.set([...todos(), input()])
            input.set('')
          }
        }}
      />

      <Text color="#888888" fontSize={12} margin={{ top: 1 }}>
        Press Enter to add • Ctrl+C to exit
      </Text>
    </View>
  )
}

renderToTerminal(<TodoCLI />)
```

---

## Trade-offs and Conflicts

### 1. WASM Compilation Compatibility

**Challenge**: PhilJS compiler is designed to optimize for web DOM. Universal rendering requires different optimizations per platform.

**Conflict Points**:
- **Auto-memoization**: May be beneficial for DOM but unnecessary for React Native (already optimized)
- **Dead code elimination**: Platform-specific code paths need conditional compilation
- **Batch optimization**: Different platforms have different update strategies

**Proposed Solution**:
```typescript
// philjs.config.ts
export default {
  compiler: {
    platform: 'auto', // or 'dom' | 'native' | 'webgl' | 'terminal'
    optimizations: {
      autoMemo: {
        dom: true,
        native: false, // React Native handles this
        webgl: true,
        terminal: false,
      },
      autoBatch: {
        dom: true,
        native: true,
        webgl: false, // WebGL updates on requestAnimationFrame
        terminal: true,
      },
    },
  },
  targets: ['dom', 'webgl'], // Multi-target builds
}
```

**Compiler Plugin for Platform Detection**:
```typescript
// packages/philjs-compiler/src/plugins/platform-optimizer.ts

export function platformOptimizerPlugin(targetPlatform: Platform): CompilerPlugin {
  return {
    name: 'platform-optimizer',

    transform(path, analysis) {
      // Remove platform-specific code for other platforms
      path.traverse({
        MemberExpression(innerPath) {
          const obj = innerPath.node.object
          const prop = innerPath.node.property

          if (
            t.isIdentifier(obj) &&
            obj.name === 'props' &&
            t.isIdentifier(prop) &&
            prop.name !== targetPlatform &&
            ['web', 'native', 'webgl', 'terminal'].includes(prop.name)
          ) {
            // Remove this prop access
            innerPath.remove()
          }
        }
      })
    }
  }
}
```

### 2. Signal Reactivity vs Platform Update Models

**Challenge**: Different platforms have different rendering update cycles:

| Platform | Update Model |
|----------|--------------|
| DOM | Synchronous mutation (or microtask batching) |
| React Native | Asynchronous batch updates via bridge |
| WebGL | requestAnimationFrame |
| Terminal | Frame-based or diff-based |

**PhilJS Signal Design**: Currently synchronous with optional batching.

**Solution**: Platform-specific signal schedulers:

```typescript
// packages/philjs-core/src/signals-scheduler.ts

export interface SignalScheduler {
  schedule(update: () => void): void
  flush(): void
}

export const DOMScheduler: SignalScheduler = {
  schedule(update) {
    // Use microtask
    queueMicrotask(update)
  },
  flush() {
    // DOM flushes automatically
  },
}

export const WebGLScheduler: SignalScheduler = {
  pending: new Set<() => void>(),

  schedule(update) {
    this.pending.add(update)
    if (this.pending.size === 1) {
      requestAnimationFrame(() => this.flush())
    }
  },

  flush() {
    this.pending.forEach(update => update())
    this.pending.clear()
  },
}

export const NativeScheduler: SignalScheduler = {
  schedule(update) {
    // Use React Native's batch scheduler
    InteractionManager.runAfterInteractions(update)
  },
  flush() {
    // Handled by React Native
  },
}

// Configure scheduler based on platform
export function setSignalScheduler(scheduler: SignalScheduler): void {
  globalSignalScheduler = scheduler
}
```

### 3. SSR and Hydration

**Challenge**: SSR only makes sense for DOM. Other platforms don't have a server/client split.

**Conflict**:
- PhilJS's `renderToString` is DOM-specific
- Resumability is web-focused (script tags, event delegation)

**Solution**: Make SSR/Resumability opt-in:

```typescript
// Platform-specific renderers
export const DOMRenderer = createRenderer({
  ...DOMRendererConfig,
  supportsHydration: true,
  supportsSSR: true,
})

export const WebGLRenderer = createRenderer({
  ...WebGLRendererConfig,
  supportsHydration: false,
  supportsSSR: false,
})

// SSR export only available for DOM
export { renderToString, renderToStream } from 'philjs-core/renderer/dom-ssr'
```

### 4. Bundle Size Impact

**Challenge**: Including all renderers would bloat the bundle.

**Impact Analysis**:
- Current PhilJS core: ~24KB (minified + gzip)
- Universal primitives: +3KB
- DOM renderer: +5KB
- WebGL renderer: +15KB (Three.js is ~130KB)
- Native renderer: +8KB
- Terminal renderer: +10KB

**Total if all included**: ~65KB (+ Three.js ~130KB if using WebGL)

**Solution**: Tree-shakeable exports and platform-specific entry points:

```typescript
// packages/philjs-core/package.json
{
  "exports": {
    ".": "./dist/index.js",
    "./dom": "./dist/renderer/dom.js",        // DOM-only: ~29KB
    "./webgl": "./dist/renderer/webgl.js",    // WebGL-only: ~42KB + Three.js
    "./native": "./dist/renderer/native.js",  // Native-only: ~32KB
    "./terminal": "./dist/renderer/terminal.js", // Terminal-only: ~34KB
    "./universal": "./dist/universal.js",     // All renderers: ~65KB
  }
}

// Usage (tree-shaken):
import { View, Text } from 'philjs-core/dom'           // Only DOM code
import { Scene, Mesh } from 'philjs-core/webgl'        // Only WebGL code
import { View, Text } from 'philjs-core/universal'     // All renderers
```

### 5. TypeScript IntrinsicElements Conflict

**Challenge**: Current global `JSX.IntrinsicElements` allows any HTML element. Universal primitives should restrict this.

**Solution**: Platform-specific JSX namespaces:

```typescript
// packages/philjs-core/src/jsx-universal.ts

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Universal primitives only
      View: ViewProps
      Text: TextProps
      Image: ImageProps
      Input: InputProps
      Pressable: PressableProps
    }
  }
}

// packages/philjs-core/src/jsx-dom.ts

declare global {
  namespace JSX {
    interface IntrinsicElements extends UniversalIntrinsicElements {
      // HTML elements
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
      span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>
      // ... all HTML elements
    }
  }
}

// packages/philjs-webgl/src/jsx-3d.ts

declare global {
  namespace JSX {
    interface IntrinsicElements extends UniversalIntrinsicElements {
      // 3D primitives
      Scene: SceneProps
      Mesh: Mesh3DProps
      Light: Light3DProps
      Camera: Camera3DProps
      // ... 3D elements
    }
  }
}
```

### 6. Event Handling Differences

**Challenge**: Event systems vary wildly:

| Platform | Event System |
|----------|--------------|
| DOM | addEventListener, bubbling/capturing |
| React Native | Gesture Responder System |
| WebGL | Raycasting + pointer events |
| Terminal | stdin keypress events |

**Solution**: Event normalization layer:

```typescript
// packages/philjs-core/src/events/event-normalizer.ts

export interface UniversalEvent {
  type: string
  target: any
  stopPropagation(): void
  preventDefault(): void
}

export interface PressEvent extends UniversalEvent {
  type: 'press'
  position?: { x: number; y: number }
}

export interface HoverEvent extends UniversalEvent {
  type: 'hover'
  hovering: boolean
}

// Platform-specific event adapters
export function adaptDOMEvent(domEvent: Event): UniversalEvent {
  return {
    type: domEvent.type,
    target: domEvent.target,
    stopPropagation: () => domEvent.stopPropagation(),
    preventDefault: () => domEvent.preventDefault(),
  }
}

export function adaptWebGLEvent(raycasterEvent: any): UniversalEvent {
  return {
    type: 'press',
    target: raycasterEvent.object,
    stopPropagation: () => {},
    preventDefault: () => {},
  }
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Q1 2026)
- [ ] Define universal primitive types and interfaces
- [ ] Implement core renderer abstraction
- [ ] Create DOM renderer adapter (migrate existing code)
- [ ] Update compiler to support platform-specific optimizations
- [ ] Add platform detection and tree-shaking

**Deliverable**: PhilJS 0.2.0 with DOM renderer using new architecture (backward compatible)

### Phase 2: WebGL/3D Support (Q2 2026)
- [ ] Implement WebGL renderer adapter
- [ ] Create 3D primitive components (Scene, Mesh, Light, Camera)
- [ ] Build Three.js integration layer
- [ ] Add raycasting event system
- [ ] Create 3D examples (product viewer, data viz)

**Deliverable**: `philjs-webgl` package with R3F-like API

### Phase 3: React Native Bridge (Q3 2026)
- [ ] Implement native renderer adapter
- [ ] Create React Native bridge
- [ ] Test on iOS and Android
- [ ] Add Expo support
- [ ] Build native component examples

**Deliverable**: `philjs-native` package with Expo template

### Phase 4: Terminal Renderer (Q4 2026)
- [ ] Implement terminal renderer adapter
- [ ] Integrate with blessed or ink
- [ ] Add CLI-specific components (progress bars, spinners)
- [ ] Create CLI framework utilities
- [ ] Build CLI app examples

**Deliverable**: `philjs-terminal` package for CLI tools

### Phase 5: Optimization & Polish (Q1 2027)
- [ ] Performance benchmarks across platforms
- [ ] Compiler optimizations for multi-target
- [ ] Documentation and guides
- [ ] Migration tools from React/Solid to PhilJS
- [ ] Production case studies

**Deliverable**: PhilJS 1.0 - Production-ready universal framework

---

## Conclusion

PhilJS has an **excellent foundation** for universal rendering:
1. ✅ Platform-agnostic JSX runtime
2. ✅ Signal-based reactivity (works everywhere)
3. ✅ Compiler architecture for optimizations
4. ✅ Clean separation of concerns

**Key Advantages Over Competitors**:
- **vs React Three Fiber**: Native signal reactivity (no virtual DOM overhead)
- **vs Tamagui**: Compiler-first optimizations, not just runtime
- **vs Ink**: Signals enable real-time updates without re-renders
- **vs Native**: True write-once, run-anywhere (not just web + native)

**Biggest Challenges**:
1. Maintaining performance parity with specialized frameworks (R3F, Tamagui)
2. Managing bundle size with tree-shaking
3. Different update schedules per platform
4. TypeScript complexity with multi-platform types

**Recommended Next Steps**:
1. Start with Phase 1 (DOM refactor) to validate architecture
2. Prototype WebGL renderer with simple 3D example
3. Benchmark signal updates across platforms
4. Build proof-of-concept: single component running on DOM + WebGL

This architecture positions PhilJS as the **first truly universal JavaScript UI framework** with compiler-level optimizations and fine-grained reactivity across all rendering targets.

---

## References

### Research Sources

1. **Tamagui Architecture**
   - [Tamagui GitHub](https://github.com/tamagui/tamagui)
   - [Tamagui Docs](https://tamagui.dev/)
   - [Tamagui Bento Native Support](https://react-news.com/tamagui-bento-goes-native-a-deep-dive-into-universal-ui-components-for-react-and-react-native)

2. **React Three Fiber**
   - [R3F Documentation](https://r3f.docs.pmnd.rs/getting-started/introduction)
   - [R3F GitHub](https://github.com/pmndrs/react-three-fiber)
   - [Building Interactive 3D with R3F](https://coffey.codes/articles/building-interactive-3d-experiences-with-react-three-fiber)

3. **Threlte (Svelte 3D)**
   - [Threlte Website](https://threlte.xyz/)
   - [Threlte GitHub](https://github.com/threlte/threlte)
   - [This Dot: Threlte Tutorial](https://www.thisdot.co/blog/harnessing-the-power-of-threlte-building-reactive-three-js-scenes-in-svelte)

4. **React Reconciler Pattern**
   - [Building Custom React Renderers](https://blog.openreplay.com/building-a-custom-react-renderer/)
   - [Custom React Renderers Guide](https://blog.nonstopio.com/custom-react-renderers-extending-react-beyond-the-dom-5065072a40d4)
   - [react-reconciler npm](https://www.npmjs.com/package/react-reconciler)

5. **Universal Rendering**
   - [mugl: Universal Graphics Library](https://www.npmjs.com/package/mugl)
   - [WebGL Abstraction Patterns](https://medium.com/lightricks-tech-blog/not-all-those-who-render-are-lost-8a68ac2944a8)

---

**End of Report**

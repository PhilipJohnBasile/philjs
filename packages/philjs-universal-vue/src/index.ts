/**
 * @philjs/universal-vue
 *
 * Vue adapter for Universal Component Protocol
 */

import {
  defineComponent as vueDefineComponent,
  h as vueH,
  ref,
  reactive,
  onMounted,
  onUnmounted,
  onBeforeMount,
  onBeforeUnmount,
  onBeforeUpdate,
  onUpdated,
  type VNode as VueVNode,
  type SetupContext,
  type Slots,
} from 'vue';
import type {
  UniversalComponentDef,
  VNode,
  RenderContext,
  SlotContent,
} from '@philjs/universal';
import { Fragment as UniversalFragment } from '@philjs/universal';

export interface VueAdapterOptions {
  name?: string;
  inheritAttrs?: boolean;
}

export function toVue<
  Props extends Record<string, unknown>,
  Events extends Record<string, unknown>
>(
  component: UniversalComponentDef<Props, Events>,
  options: VueAdapterOptions = {}
) {
  const { name = component.name, inheritAttrs = true } = options;

  const vueProps: Record<string, unknown> = {};
  for (const [propName, propDef] of Object.entries(component.props)) {
    vueProps[propName] = { default: propDef.default };
  }

  const emits: string[] = component.events ? Object.keys(component.events) : [];

  return vueDefineComponent({
    name,
    inheritAttrs,
    props: vueProps,
    emits,
    setup(props: Record<string, unknown>, ctx: SetupContext) {
      const hostRef = ref<HTMLElement | null>(null);
      const updateTrigger = ref(0);
      const reactiveProps = reactive<Record<string, unknown>>({});

      for (const propName of Object.keys(component.props)) {
        reactiveProps[propName] = props[propName];
      }

      const context: RenderContext<Props, Events> = {
        props: new Proxy({} as RenderContext<Props, Events>['props'], {
          get(_, key: string) {
            return () => reactiveProps[key];
          },
        }),
        emit: (event, payload) => {
          ctx.emit(String(event), payload);
        },
        slot: (slotName = ''): SlotContent => ({
          hasContent: !!ctx.slots[slotName || 'default'],
          render: () => null,
        }),
        host: () => hostRef.value,
        update: () => { updateTrigger.value++; },
      };

      onBeforeMount(() => { component.lifecycle?.beforeMount?.(); });
      onMounted(() => { component.lifecycle?.mounted?.(); });
      onBeforeUpdate(() => { component.lifecycle?.beforeUpdate?.(); });
      onUpdated(() => { component.lifecycle?.updated?.(); });
      onBeforeUnmount(() => { component.lifecycle?.beforeUnmount?.(); });
      onUnmounted(() => { component.lifecycle?.unmounted?.(); });

      return () => {
        for (const propName of Object.keys(component.props)) {
          reactiveProps[propName] = props[propName];
        }
        void updateTrigger.value;
        const vnode = component.render(context);
        return vueH(
          'div',
          { ref: hostRef, 'data-universal-component': component.name },
          vnodeToVue(vnode, ctx.slots)
        );
      };
    },
  });
}

function vnodeToVue(
  vnode: VNode | VNode[] | string | number | null | undefined,
  slots: Slots
): VueVNode | VueVNode[] | string | number | null {
  if (vnode === null || vnode === undefined) return null;
  if (typeof vnode === 'string' || typeof vnode === 'number') return vnode;
  if (Array.isArray(vnode)) return vnode.map((v) => vnodeToVue(v, slots) as VueVNode);
  if (vnode.type === UniversalFragment) {
    return vnode.children.map((c) => vnodeToVue(c, slots) as VueVNode);
  }
  if (vnode.type === 'slot') {
    const slot = slots[(vnode.props.name as string) || 'default'];
    return slot ? slot() : null;
  }
  if (typeof vnode.type === 'string') {
    return vueH(
      vnode.type,
      vnode.props,
      vnode.children.map((c) => vnodeToVue(c, slots) as VueVNode)
    );
  }
  return null;
}

export type { UniversalComponentDef, VNode, RenderContext } from '@philjs/universal';
export { defineComponent, h, Fragment, PropTypes } from '@philjs/universal';
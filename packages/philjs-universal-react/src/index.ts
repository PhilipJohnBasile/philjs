/**
 * @philjs/universal-react
 *
 * React adapter for Universal Component Protocol
 */

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  forwardRef,
  type ReactNode,
  type ForwardedRef,
} from 'react';
import type {
  UniversalComponentDef,
  VNode,
  RenderContext,
  SlotContent,
} from '@philjs/universal';
import { Fragment as UniversalFragment } from '@philjs/universal';

export interface ReactAdapterOptions {
  memo?: boolean;
  displayName?: string;
}

export function toReact<
  Props extends Record<string, unknown>,
  Events extends Record<string, unknown>
>(
  component: UniversalComponentDef<Props, Events>,
  options: ReactAdapterOptions = {}
): React.FC<Partial<Props> & { children?: ReactNode }> {
  const { memo = true, displayName = component.name } = options;

  const ReactComponent = forwardRef(function UniversalReactWrapper(
    reactProps: Partial<Props> & { children?: ReactNode },
    ref: ForwardedRef<HTMLElement>
  ) {
    const { children, ...props } = reactProps;
    const hostRef = useRef<HTMLElement>(null);
    const [, forceUpdate] = useState({});

    const context = useMemo<RenderContext<Props, Events>>(() => {
      const propsObj = {} as RenderContext<Props, Events>['props'];
      for (const propName of Object.keys(component.props)) {
        const def = component.props[propName];
        (propsObj as any)[propName] = () => props[propName] ?? def.default;
      }

      return {
        props: propsObj,
        emit: () => {},
        slot: (): SlotContent => ({
          hasContent: children != null,
          render: () => null,
        }),
        host: () => hostRef.current,
        update: () => forceUpdate({}),
      };
    }, [props, children]);

    useEffect(() => {
      component.lifecycle?.mounted?.();
      return () => { component.lifecycle?.unmounted?.(); };
    }, []);

    const vnode = component.render(context);

    return React.createElement(
      'div',
      { ref: hostRef, 'data-universal-component': component.name },
      vnodeToReact(vnode, children)
    );
  });

  ReactComponent.displayName = displayName;

  return memo ? React.memo(ReactComponent) as any : ReactComponent as any;
}

function vnodeToReact(
  vnode: VNode | VNode[] | string | number | null | undefined,
  children?: ReactNode
): ReactNode {
  if (vnode === null || vnode === undefined) return null;
  if (typeof vnode === 'string' || typeof vnode === 'number') return vnode;
  if (Array.isArray(vnode)) {
    return vnode.map((v, i) => {
      const result = vnodeToReact(v, children);
      if (React.isValidElement(result)) {
        return React.cloneElement(result, { key: i });
      }
      return result;
    });
  }
  if (vnode.type === UniversalFragment) {
    return React.createElement(
      React.Fragment,
      null,
      vnode.children.map((c, i) => {
        const result = vnodeToReact(c, children);
        if (React.isValidElement(result)) {
          return React.cloneElement(result, { key: i });
        }
        return result;
      })
    );
  }
  if (vnode.type === 'slot') return children;
  if (typeof vnode.type === 'string') {
    const reactProps: Record<string, unknown> = { ...vnode.props };
    if (vnode.key != null) reactProps.key = vnode.key;
    return React.createElement(
      vnode.type,
      reactProps,
      ...vnode.children.map((c) => vnodeToReact(c, children))
    );
  }
  return null;
}

export type { UniversalComponentDef, VNode, RenderContext } from '@philjs/universal';
export { defineComponent, h, Fragment, PropTypes } from '@philjs/universal';
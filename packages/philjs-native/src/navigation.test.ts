/**
 * Navigation Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createNativeRouter,
  createNativeStack,
  createNativeTabs,
  useNativeNavigation,
  useRoute,
  useIsFocused,
  navigationState,
  Link,
} from './navigation';

describe('Navigation', () => {
  const mockScreens = [
    { name: 'Home', component: () => ({ type: 'div', children: 'Home' }) },
    { name: 'Profile', component: () => ({ type: 'div', children: 'Profile' }) },
    { name: 'Settings', component: () => ({ type: 'div', children: 'Settings' }) },
  ];

  describe('createNativeRouter', () => {
    it('should create router with Navigator and Screen', () => {
      const router = createNativeRouter({
        screens: mockScreens,
      });

      expect(router).toHaveProperty('Navigator');
      expect(router).toHaveProperty('Screen');
      expect(router).toHaveProperty('navigation');
    });

    it('should initialize with first screen', () => {
      const router = createNativeRouter({
        screens: mockScreens,
      });

      const state = navigationState();
      expect(state?.routes[0].name).toBe('Home');
    });

    it('should respect initialRouteName option', () => {
      createNativeRouter({
        screens: mockScreens,
        options: {
          initialRouteName: 'Profile',
        },
      });

      const state = navigationState();
      expect(state?.routes[state.index].name).toBe('Profile');
    });

    it('should provide navigation object', () => {
      const router = createNativeRouter({
        screens: mockScreens,
      });

      expect(router.navigation).toHaveProperty('navigate');
      expect(router.navigation).toHaveProperty('push');
      expect(router.navigation).toHaveProperty('pop');
      expect(router.navigation).toHaveProperty('goBack');
      expect(router.navigation).toHaveProperty('reset');
    });
  });

  describe('Navigation Methods', () => {
    let router: ReturnType<typeof createNativeRouter>;

    beforeEach(() => {
      router = createNativeRouter({
        screens: mockScreens,
      });
    });

    it('should navigate to a screen', () => {
      router.navigation.navigate('Profile');

      const state = navigationState();
      expect(state?.routes[state.index].name).toBe('Profile');
    });

    it('should push a new screen', () => {
      const initialLength = navigationState()?.routes.length || 0;

      router.navigation.push('Profile');

      const state = navigationState();
      expect(state?.routes.length).toBe(initialLength + 1);
      expect(state?.routes[state.index].name).toBe('Profile');
    });

    it('should pop a screen', () => {
      router.navigation.push('Profile');
      router.navigation.push('Settings');

      const lengthBeforePop = navigationState()?.routes.length || 0;
      router.navigation.pop();

      const state = navigationState();
      expect(state?.routes.length).toBe(lengthBeforePop - 1);
    });

    it('should pop multiple screens', () => {
      router.navigation.push('Profile');
      router.navigation.push('Settings');

      router.navigation.pop(2);

      const state = navigationState();
      expect(state?.routes[state.index].name).toBe('Home');
    });

    it('should pop to top', () => {
      router.navigation.push('Profile');
      router.navigation.push('Settings');

      router.navigation.popToTop();

      const state = navigationState();
      expect(state?.routes.length).toBe(1);
      expect(state?.routes[0].name).toBe('Home');
    });

    it('should goBack', () => {
      router.navigation.push('Profile');

      router.navigation.goBack();

      const state = navigationState();
      expect(state?.routes[state.index].name).toBe('Home');
    });

    it('should replace current screen', () => {
      router.navigation.replace('Settings');

      const state = navigationState();
      expect(state?.routes[state.index].name).toBe('Settings');
      expect(state?.routes.length).toBe(1);
    });

    it('should reset navigation state', () => {
      router.navigation.push('Profile');
      router.navigation.push('Settings');

      router.navigation.reset({
        routes: [{ key: 'reset-1', name: 'Home', params: {} }],
        index: 0,
      });

      const state = navigationState();
      expect(state?.routes.length).toBe(1);
    });

    it('should pass params when navigating', () => {
      router.navigation.navigate('Profile', { userId: 123 });

      const state = navigationState();
      expect(state?.routes[state.index].params).toEqual({ userId: 123 });
    });

    it('should set params on current route', () => {
      router.navigation.setParams({ newParam: 'value' });

      const state = navigationState();
      expect(state?.routes[state.index].params?.newParam).toBe('value');
    });

    it('should report canGoBack correctly', () => {
      expect(router.navigation.canGoBack()).toBe(false);

      router.navigation.push('Profile');
      expect(router.navigation.canGoBack()).toBe(true);
    });

    it('should report isFocused', () => {
      expect(router.navigation.isFocused()).toBe(true);
    });

    it('should get current state', () => {
      const state = router.navigation.getState();

      expect(state).toHaveProperty('routes');
      expect(state).toHaveProperty('index');
    });

    it('should add and remove event listeners', () => {
      const callback = vi.fn();
      const unsubscribe = router.navigation.addListener('state', callback);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });

  describe('createNativeStack', () => {
    it('should create stack navigator', () => {
      const Stack = createNativeStack();

      expect(Stack).toHaveProperty('Navigator');
      expect(Stack).toHaveProperty('Screen');
    });

    it('should accept stack options', () => {
      const Stack = createNativeStack({
        initialRouteName: 'Profile',
        headerMode: 'screen',
      });

      expect(Stack).toBeDefined();
    });
  });

  describe('createNativeTabs', () => {
    it('should create tab navigator', () => {
      const Tabs = createNativeTabs();

      expect(Tabs).toHaveProperty('Navigator');
      expect(Tabs).toHaveProperty('Screen');
    });

    it('should accept tab options', () => {
      const Tabs = createNativeTabs({
        tabBarPosition: 'bottom',
        tabBarActiveTintColor: '#007AFF',
      });

      expect(Tabs).toBeDefined();
    });
  });

  describe('useNativeNavigation', () => {
    it('should return navigation object', () => {
      const navigation = useNativeNavigation();

      expect(navigation).toHaveProperty('navigate');
      expect(navigation).toHaveProperty('goBack');
      expect(navigation).toHaveProperty('push');
      expect(navigation).toHaveProperty('pop');
    });
  });

  describe('useRoute', () => {
    it('should return current route', () => {
      createNativeRouter({
        screens: mockScreens,
      });

      const route = useRoute();

      expect(route).toHaveProperty('name');
      expect(route).toHaveProperty('key');
      expect(route).toHaveProperty('params');
    });
  });

  describe('useIsFocused', () => {
    it('should return boolean', () => {
      createNativeRouter({
        screens: mockScreens,
      });

      const isFocused = useIsFocused();

      expect(typeof isFocused).toBe('boolean');
    });
  });

  describe('Link', () => {
    it('should render anchor on web', () => {
      const result = Link({ to: 'Profile', children: 'Go to Profile' });

      expect(result.type).toBe('a');
    });

    it('should prevent default and navigate on click', () => {
      const result = Link({ to: 'Profile', children: 'Go to Profile' });

      expect(result.props.onClick).toBeDefined();
    });

    it('should set href', () => {
      const result = Link({ to: 'Profile', children: 'Link' });

      expect(result.props.href).toBe('#Profile');
    });

    it('should pass params', () => {
      const result = Link({
        to: 'Profile',
        params: { id: 123 },
        children: 'Link',
      });

      expect(result).toBeDefined();
    });
  });
});

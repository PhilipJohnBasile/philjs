/**
 * PhilJS Capacitor App - Main Entry
 */

import { mount } from 'philjs-jsx';
import { App } from './App';
import { initializeNative } from './native';

// Initialize native plugins
initializeNative().then(() => {
  // Mount the app
  const root = document.getElementById('app');
  if (root) {
    mount(App, root);
  }
});

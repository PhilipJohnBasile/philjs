/**
 * PhilJS HTML Runtime
 *
 * Main entry point that combines all features.
 */

import { initDirectives } from './directives.js';
import { initHtmx, configure as configureHtmx, type HtmxConfig } from './htmx.js';
import { initAlpine, store, data, bind, Alpine } from './alpine.js';
import { initMinimal } from './minimal.js';

export interface PhilJSHTMLConfig {
  /** Enable Alpine.js directives */
  alpine: boolean;
  /** Enable HTMX compatibility */
  htmx: boolean;
  /** Use minimal runtime */
  minimal: boolean;
  /** HTMX configuration */
  htmxConfig?: Partial<HtmxConfig>;
  /** Auto-initialize on DOMContentLoaded */
  autoInit: boolean;
  /** Root element to process */
  root?: HTMLElement;
}

const defaultConfig: PhilJSHTMLConfig = {
  alpine: true,
  htmx: true,
  minimal: false,
  autoInit: true,
};

/**
 * Initialize PhilJS HTML
 */
export function init(config: Partial<PhilJSHTMLConfig> = {}): void {
  const cfg = { ...defaultConfig, ...config };
  const root = cfg.root || document.body;

  if (cfg.minimal) {
    initMinimal(root);
    return;
  }

  if (cfg.alpine) {
    initAlpine(root);
  } else {
    initDirectives(root);
  }

  if (cfg.htmx) {
    if (cfg.htmxConfig) {
      configureHtmx(cfg.htmxConfig);
    }
    initHtmx(root);
  }
}

/**
 * Auto-initialize when DOM is ready
 */
if (typeof window !== 'undefined') {
  const autoInit = () => {
    // Check for data attribute configuration
    const script = document.currentScript as HTMLScriptElement | null;
    const config: Partial<PhilJSHTMLConfig> = {};

    if (script) {
      if (script.hasAttribute('data-minimal')) {
        config.minimal = true;
      }
      if (script.hasAttribute('data-no-htmx')) {
        config.htmx = false;
      }
      if (script.hasAttribute('data-no-alpine')) {
        config.alpine = false;
      }
    }

    // Don't auto-init if explicitly disabled
    if (script?.hasAttribute('data-no-auto')) {
      return;
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => init(config));
    } else {
      init(config);
    }
  };

  autoInit();
}

/**
 * Main API object
 */
export const PhilJSHTML = {
  init,
  Alpine,
  store,
  data,
  bind,
  configureHtmx,
};

export default PhilJSHTML;

/**
 * PhilJS Detector Script
 * 
 * Injected into every page to detect PhilJS and set up communication.
 */

declare global {
  interface Window {
    __PHILJS_DEVTOOLS__?: {
      signals: Map<string, any>;
      components: Map<string, any>;
      subscribe: (callback: () => void) => () => void;
    };
  }
}

// Check for PhilJS
function detectPhilJS(): boolean {
  return typeof window.__PHILJS_DEVTOOLS__ !== 'undefined';
}

// Set up detection loop
let detected = false;
const checkInterval = setInterval(() => {
  if (detectPhilJS() && !detected) {
    detected = true;
    clearInterval(checkInterval);
    
    // Notify background script
    chrome.runtime.sendMessage({ type: 'PHILJS_DETECTED' });
    
    // Inject hook script
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('content/hook.js');
    document.documentElement.appendChild(script);
    
    // Set up message passing
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      if (event.data.type?.startsWith('PHILJS_')) {
        chrome.runtime.sendMessage(event.data);
      }
    });
    
    // Listen for messages from devtools
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'GET_PHILJS_DATA') {
        window.postMessage({ type: 'PHILJS_GET_DATA' }, '*');
      }
    });
  }
}, 100);

// Stop checking after 10 seconds
setTimeout(() => clearInterval(checkInterval), 10000);

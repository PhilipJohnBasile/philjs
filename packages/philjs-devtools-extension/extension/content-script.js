// PhilJS DevTools - Content Script
// Bridges the page context with the extension

// Inject the page script
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = function() {
  this.remove();
};
(document.head || document.documentElement).appendChild(script);

// Listen for messages from the page
window.addEventListener('message', (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;

  // Only accept messages from PhilJS
  if (event.data?.source !== 'philjs-devtools-client') return;

  // Forward to background script and panel
  chrome.runtime.sendMessage({
    type: 'FORWARD_TO_PANEL',
    payload: event.data
  });
});

// Listen for messages from DevTools panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FORWARD_TO_PAGE') {
    // Forward to page
    window.postMessage({
      source: 'philjs-devtools-panel',
      ...message.payload
    }, '*');
  }
});

// Check if PhilJS is present on the page
function detectPhilJS() {
  const hasPhilJS = !!(window.__PHILJS__ || window.__PHILJS_DEVTOOLS_HOOK__);

  if (hasPhilJS) {
    chrome.runtime.sendMessage({ type: 'PHILJS_DETECTED' });
  }

  return hasPhilJS;
}

// Check immediately and after DOM loads
detectPhilJS();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', detectPhilJS);
} else {
  setTimeout(detectPhilJS, 100);
}

console.log('PhilJS DevTools content script loaded');

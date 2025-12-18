// PhilJS DevTools - Background Script (Firefox)
// Firefox uses Manifest V2 with different APIs

// Keep track of tabs with PhilJS
const philjsTabs = new Set();

// Listen for messages from content scripts
browser.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'PHILJS_DETECTED') {
    const tabId = sender.tab?.id;
    if (tabId) {
      philjsTabs.add(tabId);
      // Show page action icon
      browser.pageAction.setIcon({
        tabId,
        path: {
          16: 'icons/icon16.png',
          48: 'icons/icon48.png',
          128: 'icons/icon128.png'
        }
      });
      browser.pageAction.show(tabId);
    }
  }

  // Forward messages between content script and devtools panel
  if (message.type === 'FORWARD_TO_PANEL') {
    browser.runtime.sendMessage(message);
  }

  if (message.type === 'FORWARD_TO_CONTENT') {
    const tabId = sender.tab?.id;
    if (tabId) {
      browser.tabs.sendMessage(tabId, message.payload);
    }
  }
});

// Clean up when tabs are closed
browser.tabs.onRemoved.addListener((tabId) => {
  philjsTabs.delete(tabId);
});

console.log('PhilJS DevTools background script loaded (Firefox)');

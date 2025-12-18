// PhilJS DevTools - Background Service Worker

// Keep track of tabs with PhilJS
const philjsTabs = new Set();

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PHILJS_DETECTED') {
    const tabId = sender.tab?.id;
    if (tabId) {
      philjsTabs.add(tabId);
      // Show page action icon
      chrome.action.setIcon({
        tabId,
        path: {
          16: 'icons/icon16.png',
          48: 'icons/icon48.png',
          128: 'icons/icon128.png'
        }
      });
    }
  }

  // Forward messages between content script and devtools panel
  if (message.type === 'FORWARD_TO_PANEL') {
    chrome.runtime.sendMessage(message);
  }

  if (message.type === 'FORWARD_TO_CONTENT') {
    const tabId = sender.tab?.id;
    if (tabId) {
      chrome.tabs.sendMessage(tabId, message.payload);
    }
  }
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  philjsTabs.delete(tabId);
});

console.log('PhilJS DevTools background script loaded');

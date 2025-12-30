declare const chrome: any;

// Create PhilJS DevTools panel
chrome.devtools.panels.create(
  'PhilJS',
  'icons/icon16.png',
  'panel.html',
  (panel: any) => {
    console.log('PhilJS DevTools panel created');
  }
);

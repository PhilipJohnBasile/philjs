// Create a panel in the Chrome DevTools
chrome.devtools.panels.create(
  'PhilJS',
  'icons/icon16.png',
  'panel.html',
  function(panel) {
    // Panel created
    console.log('PhilJS DevTools panel created');
  }
);

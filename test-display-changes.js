const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:3001/examples');
  await page.waitForTimeout(3000);

  console.log('Initial state (Counter):');
  const initialHTML = await page.evaluate(() => {
    const containers = document.querySelectorAll('[style*="display"]');
    return Array.from(containers).slice(0, 5).map(el => ({
      display: el.style.display,
      text: el.textContent.substring(0, 100)
    }));
  });
  console.log(JSON.stringify(initialHTML, null, 2));

  console.log('\nClicking Todo button...');
  const todoButton = await page.getByText('Todo List', { exact: true }).first();
  await todoButton.click();
  await page.waitForTimeout(1000);

  console.log('\nAfter clicking Todo:');
  const afterHTML = await page.evaluate(() => {
    const containers = document.querySelectorAll('[style*="display"]');
    return Array.from(containers).slice(0, 5).map(el => ({
      display: el.style.display,
      text: el.textContent.substring(0, 100)
    }));
  });
  console.log(JSON.stringify(afterHTML, null, 2));

  await browser.close();
})();

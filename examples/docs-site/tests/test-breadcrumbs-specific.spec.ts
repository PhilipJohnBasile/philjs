import { test, expect } from '@playwright/test';

test('test breadcrumb with nav selector', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER]:`, msg.text()));
  page.on('pageerror', err => console.error(`[PAGE ERROR]:`, err.message));

  console.log('\n=== TESTING BREADCRUMB WITH NAV SELECTOR ===');

  await page.goto('http://localhost:3000/docs/getting-started/tutorial-demo-app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log(`Initial URL: ${page.url()}`);

  // List all buttons with Getting Started
  console.log('\n--- All buttons with "Getting Started" ---');
  const allButtons = await page.locator('button').all();
  for (let i = 0; i < allButtons.length; i++) {
    const text = await allButtons[i].textContent();
    if (text?.includes('Getting Started')) {
      const parent = await allButtons[i].evaluate(el => el.parentElement?.tagName);
      console.log(`  [${i}] "${text?.trim()}" (parent: ${parent})`);
    }
  }

  // Try to find breadcrumb specifically by looking for nav button
  console.log('\n--- Looking for breadcrumb in nav element ---');
  const navButton = page.locator('nav button').filter({ hasText: 'Getting Started' });
  const navButtonCount = await navButton.count();
  console.log(`Found ${navButtonCount} buttons with "Getting Started" inside <nav>`);

  if (navButtonCount > 0) {
    const navButtonText = await navButton.textContent();
    console.log(`Nav button text: "${navButtonText}"`);

    console.log('\n--- Clicking nav breadcrumb button ---');
    await navButton.click();
    await page.waitForTimeout(2000);

    const newUrl = page.url();
    console.log(`URL after click: ${newUrl}`);

    if (newUrl !== 'http://localhost:3000/docs/getting-started/tutorial-demo-app') {
      console.log('✅ URL changed!');
    } else {
      console.log('❌ URL did not change');
    }

    const bodyContent = await page.locator('body').textContent();
    const h1Text = await page.locator('h1').first().textContent();
    console.log(`H1 text: "${h1Text}"`);

    if (h1Text?.includes('Introduction')) {
      console.log('✅ Navigated to Introduction page');
    } else if (h1Text?.includes('Tutorial: Build a Demo App')) {
      console.log('❌ Still on Tutorial: Build a Demo App page');
    } else {
      console.log(`Page title: ${h1Text}`);
    }
  } else {
    // Try alternative: buttons that come right after "Home" button
    console.log('\n--- Alternative: Looking for breadcrumb pattern ---');
    const homeButton = page.locator('button').filter({ hasText: 'Home' });

    // Get the next sibling buttons
    const nextButtons = await page.evaluate(() => {
      const homeBtn = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent?.includes('Home') && !btn.textContent?.includes('Go Home'));

      if (!homeBtn || !homeBtn.parentElement) return [];

      const parent = homeBtn.parentElement;
      const buttons = Array.from(parent.querySelectorAll('button'));
      return buttons.map((btn, idx) => ({
        index: idx,
        text: btn.textContent,
        isHome: btn === homeBtn
      }));
    });

    console.log('Buttons in breadcrumb container:', JSON.stringify(nextButtons, null, 2));
  }
});

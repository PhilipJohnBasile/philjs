import { test } from '@playwright/test';

test('test Read the Docs button', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER]:`, msg.text()));
  page.on('pageerror', err => console.error(`[ERROR]:`, err.message));

  console.log('\n=== LOADING HOMEPAGE ===');
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log('\n=== LOOKING FOR BUTTON ===');

  // Try different selectors
  const buttons = await page.locator('button:has-text("Read the Docs")').all();
  console.log(`Found ${buttons.length} button(s) with "Read the Docs" text`);

  const links = await page.locator('a:has-text("Read the Docs")').all();
  console.log(`Found ${links.length} link(s) with "Read the Docs" text`);

  const anyElement = await page.locator(':has-text("Read the Docs")').all();
  console.log(`Found ${anyElement.length} element(s) with "Read the Docs" text`);

  // Get all text on page
  const bodyText = await page.locator('body').textContent();
  const hasReadTheDocs = bodyText?.includes('Read the Docs');
  console.log(`Page contains "Read the Docs": ${hasReadTheDocs}`);

  // Try to find by looking for visible text
  const allTexts = await page.locator('*').evaluateAll(elements => {
    return elements
      .filter(el => el.textContent?.includes('Read the Docs'))
      .map(el => ({
        tag: el.tagName,
        text: el.textContent?.substring(0, 100),
        classes: el.className
      }));
  });

  console.log('\n=== ELEMENTS WITH "Read the Docs" ===');
  allTexts.forEach((item, i) => {
    console.log(`${i + 1}. <${item.tag}> class="${item.classes}" - "${item.text}"`);
  });

  console.log('\n=== TRYING TO CLICK ===');

  if (buttons.length > 0) {
    const button = buttons[0];
    console.log('Clicking button...');
    await button.click();
  } else if (links.length > 0) {
    const link = links[0];
    console.log('Clicking link...');
    await link.click();
  } else if (anyElement.length > 0) {
    const element = anyElement[0];
    console.log('Clicking element...');
    await element.click();
  }

  await page.waitForTimeout(2000);

  const newURL = page.url();
  console.log(`\nCurrent URL after click: ${newURL}`);
  console.log(`Did navigate to /docs? ${newURL.includes('/docs')}`);

  await page.screenshot({ path: 'after-click.png', fullPage: true });
});

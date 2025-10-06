import { test, expect } from '@playwright/test';

test.describe('PhilJS Documentation Site', () => {
  test('homepage loads and shows content', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Take a screenshot
    await page.screenshot({ path: 'tests/screenshots/homepage.png', fullPage: true });

    // Get the page content
    const bodyText = await page.locator('body').textContent();
    console.log('=== HOMEPAGE CONTENT ===');
    console.log(bodyText?.substring(0, 500));

    // Check for "Read the Docs" button
    const readDocsButton = page.getByText('Read the Docs', { exact: false });
    const buttonCount = await readDocsButton.count();
    console.log(`\n"Read the Docs" buttons found: ${buttonCount}`);

    if (buttonCount > 0) {
      console.log('✅ "Read the Docs" button exists');
    } else {
      console.log('❌ "Read the Docs" button NOT FOUND');
      // List all buttons on the page
      const allButtons = await page.locator('button').all();
      console.log(`Total buttons on page: ${allButtons.length}`);
      for (const btn of allButtons) {
        const text = await btn.textContent();
        console.log(`  Button: "${text}"`);
      }
    }
  });

  test('clicking Read the Docs navigates to /docs', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Try to find and click "Read the Docs" button
    const readDocsButton = page.getByText('Read the Docs', { exact: false }).first();

    try {
      await readDocsButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000); // Give time for SPA routing

      const currentUrl = page.url();
      console.log(`\nAfter clicking "Read the Docs":`);
      console.log(`  Current URL: ${currentUrl}`);

      await page.screenshot({ path: 'tests/screenshots/after-click.png', fullPage: true });

      // Check what's on the page
      const bodyText = await page.locator('body').textContent();
      console.log(`  Page content preview: ${bodyText?.substring(0, 300)}`);

      // Check if we're on /docs
      if (currentUrl.includes('/docs')) {
        console.log('✅ URL changed to /docs');

        // Check if sidebar exists
        const sidebar = page.locator('[class*="sidebar"], nav');
        const sidebarCount = await sidebar.count();
        console.log(`  Sidebars found: ${sidebarCount}`);

        // Check if markdown content is rendered
        const hasMarkdown = await page.locator('article, .prose, [class*="markdown"]').count();
        console.log(`  Markdown containers found: ${hasMarkdown}`);

        // Check for h1
        const h1 = await page.locator('h1').first().textContent();
        console.log(`  First h1: "${h1}"`);

      } else {
        console.log(`❌ URL did not change to /docs, still at: ${currentUrl}`);
      }

    } catch (e) {
      console.log(`❌ Error clicking button: ${e.message}`);
    }
  });

  test('check all links on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const links = await page.locator('a').all();
    console.log(`\n=== HOMEPAGE LINKS (${links.length} total) ===`);

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const href = await link.getAttribute('href');
      const text = await link.textContent();

      console.log(`${i + 1}. "${text?.trim()}" → ${href}`);

      // Check for bad patterns
      if (href === '#') {
        console.log(`   ⚠️  Empty anchor`);
      }
      if (href?.endsWith('.md')) {
        console.log(`   ❌ Points to .md file`);
      }
    }
  });

  test('navigate to docs and check sidebar links', async ({ page }) => {
    // Try direct navigation to /docs
    await page.goto('http://localhost:3000/docs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log(`\n=== DIRECT /DOCS NAVIGATION ===`);
    console.log(`URL: ${page.url()}`);

    await page.screenshot({ path: 'tests/screenshots/direct-docs.png', fullPage: true });

    // Check page content
    const bodyText = await page.locator('body').textContent();
    console.log(`Page content preview: ${bodyText?.substring(0, 500)}`);

    // Look for sidebar
    const sidebarLinks = await page.locator('a').all();
    console.log(`\n=== LINKS ON /DOCS PAGE (${sidebarLinks.length} total) ===`);

    for (let i = 0; i < Math.min(sidebarLinks.length, 20); i++) {
      const link = sidebarLinks[i];
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      console.log(`${i + 1}. "${text?.trim()}" → ${href}`);
    }

    // Check for markdown content
    const article = await page.locator('article, .prose, [class*="markdown"]').first();
    const articleText = await article.textContent().catch(() => 'Not found');
    console.log(`\nMarkdown content found: ${articleText !== 'Not found' ? 'YES' : 'NO'}`);
    if (articleText !== 'Not found') {
      console.log(`Content preview: ${articleText.substring(0, 200)}`);
    }
  });

  test('check console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('requestfailed', request => {
      networkErrors.push(`${request.url()} - ${request.failure()?.errorText}`);
    });

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Try to navigate to docs
    try {
      const button = page.getByText('Read the Docs', { exact: false }).first();
      await button.click();
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log(`Could not click button: ${e.message}`);
    }

    console.log(`\n=== CONSOLE ERRORS ===`);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(err => console.log(`❌ ${err}`));
    } else {
      console.log('✅ No console errors');
    }

    console.log(`\n=== NETWORK ERRORS ===`);
    if (networkErrors.length > 0) {
      networkErrors.forEach(err => console.log(`❌ ${err}`));
    } else {
      console.log('✅ No network errors');
    }
  });
});

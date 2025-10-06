import { test } from '@playwright/test';

test('check article content', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER]:`, msg.text()));

  await page.goto('http://localhost:3000/docs');
  await page.waitForTimeout(3000);

  // Check if article exists
  const article = page.locator('article');
  const articleCount = await article.count();
  console.log('\nArticle elements:', articleCount);

  if (articleCount > 0) {
    const articleHTML = await article.first().innerHTML();
    console.log('Article innerHTML length:', articleHTML.length);
    console.log('First 500 chars:', articleHTML.substring(0, 500));

    // Check if there's any h1
    const h1 = await article.locator('h1').first().textContent().catch(() => null);
    console.log('First H1 in article:', h1);
  }
});

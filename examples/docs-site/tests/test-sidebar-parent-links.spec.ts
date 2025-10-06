import { test, expect } from '@playwright/test';

test('test sidebar section header navigation', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER]:`, msg.text()));
  page.on('pageerror', err => console.error(`[PAGE ERROR]:`, err.message));

  console.log('\n=== TESTING SIDEBAR SECTION HEADER LINKS ===');

  // Navigate to a docs page
  await page.goto('http://localhost:3000/docs/getting-started/tutorial-demo-app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  console.log(`Initial URL: ${page.url()}`);
  const initialH1 = await page.locator('h1').first().textContent();
  console.log(`Initial H1: "${initialH1}"`);

  // Test 1: Click "Learn" section header
  console.log('\n--- Test 1: Clicking "Learn" section header ---');

  // Find the Learn button that's a sibling to the arrow (not the sidebar toggle)
  const learnButtons = await page.locator('button').filter({ hasText: 'Learn' }).all();
  console.log(`Found ${learnButtons.length} buttons with "Learn"`);

  // The one we want should be in the sidebar nav
  let clickedLearn = false;
  for (let i = 0; i < learnButtons.length; i++) {
    const btn = learnButtons[i];
    const text = await btn.textContent();

    // Check if this button is part of the sidebar (not the toggle button which has ▸)
    if (text === 'Learn' || (text?.includes('Learn') && !text.includes('▸'))) {
      console.log(`Clicking Learn button ${i} with text: "${text}"`);
      await btn.click();
      await page.waitForTimeout(1500);
      clickedLearn = true;
      break;
    }
  }

  if (clickedLearn) {
    const afterLearnUrl = page.url();
    const afterLearnH1 = await page.locator('h1').first().textContent();

    console.log(`After Learn click:`);
    console.log(`  URL: ${afterLearnUrl}`);
    console.log(`  H1: "${afterLearnH1}"`);

    if (afterLearnUrl.includes('/docs/learn')) {
      console.log('✅ Learn section navigation works!');
    } else {
      console.log('❌ Learn section navigation failed');
    }
  }

  // Test 2: Navigate to a different section - Routing
  console.log('\n--- Test 2: Clicking "Routing" section header ---');

  await page.goto('http://localhost:3000/docs/getting-started/tutorial-demo-app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const routingButtons = await page.locator('button').filter({ hasText: 'Routing' }).all();
  console.log(`Found ${routingButtons.length} buttons with "Routing"`);

  let clickedRouting = false;
  for (let i = 0; i < routingButtons.length; i++) {
    const btn = routingButtons[i];
    const text = await btn.textContent();

    if (text === 'Routing' || (text?.includes('Routing') && !text.includes('▸'))) {
      console.log(`Clicking Routing button ${i} with text: "${text}"`);
      await btn.click();
      await page.waitForTimeout(1500);
      clickedRouting = true;
      break;
    }
  }

  if (clickedRouting) {
    const afterRoutingUrl = page.url();
    const afterRoutingH1 = await page.locator('h1').first().textContent();

    console.log(`After Routing click:`);
    console.log(`  URL: ${afterRoutingUrl}`);
    console.log(`  H1: "${afterRoutingH1}"`);

    if (afterRoutingUrl.includes('/docs/routing')) {
      console.log('✅ Routing section navigation works!');
    } else {
      console.log('❌ Routing section navigation failed');
    }
  }

  // Test 3: Verify arrow still toggles
  console.log('\n--- Test 3: Testing arrow toggle ---');
  await page.goto('http://localhost:3000/docs/getting-started/introduction');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Count visible "Learn" items before
  const learnItemsBefore = await page.locator('button:has-text("Components")').count();
  console.log(`"Components" button visible before: ${learnItemsBefore > 0}`);

  // Find and click the arrow button next to "Learn"
  // This is tricky - we need to find the specific arrow button
  const learnSection = page.locator('button').filter({ hasText: 'Learn' }).first();
  await learnSection.hover();

  // Look for the arrow button (it contains ▸)
  const arrowButton = page.locator('button:has-text("▸")').filter({ hasText: /^▸$/ }).first();
  const arrowExists = await arrowButton.count();

  if (arrowExists > 0) {
    console.log('Found arrow button, clicking...');
    await arrowButton.click();
    await page.waitForTimeout(500);

    const learnItemsAfter = await page.locator('button:has-text("Components")').count();
    console.log(`"Components" button visible after: ${learnItemsAfter > 0}`);

    if (learnItemsBefore !== learnItemsAfter) {
      console.log('✅ Arrow toggle works - expanded/collapsed section');
    } else {
      console.log('❓ Arrow toggle behavior changed or already toggled');
    }
  }

  console.log('\n=== ALL SIDEBAR TESTS COMPLETE ===');
});

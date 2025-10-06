const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const page = await browser.newPage();

  console.log('=== Testing Sidebar Jumpiness ===\n');

  await page.goto('http://localhost:3000/docs/data-fetching');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log('1. Initial state...');
  const initial = await page.evaluate(() => ({
    sidebarScrollTop: document.querySelector('.sidebar')?.scrollTop || 0,
    windowScrollY: window.scrollY,
  }));
  console.log(`   Sidebar: ${initial.sidebarScrollTop}px, Window: ${initial.windowScrollY}px\n`);

  // Scroll the sidebar down first
  console.log('2. Scrolling sidebar down...');
  await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.scrollTop = 300;
    }
  });
  await page.waitForTimeout(500);

  const afterSidebarScroll = await page.evaluate(() => ({
    sidebarScrollTop: document.querySelector('.sidebar')?.scrollTop || 0,
  }));
  console.log(`   Sidebar scrolled to: ${afterSidebarScroll.sidebarScrollTop}px\n`);

  // Find buttons in the sidebar
  console.log('3. Finding navigation buttons...');
  const buttons = await page.$$eval('.sidebar button', (elements) =>
    elements.map(el => ({
      text: el.textContent?.trim().slice(0, 30),
      onClick: el.getAttribute('onclick') !== null,
    })).slice(0, 15)
  );

  console.log(`   Found ${buttons.length} buttons`);
  buttons.forEach((btn, i) => console.log(`   ${i + 1}. ${btn.text}`));
  console.log('');

  // Test clicking and monitoring scroll position changes
  console.log('4. Testing click-induced scrolling behavior...\n');

  // Click a few buttons and watch for sidebar scroll position changes
  for (let i = 0; i < Math.min(3, buttons.length); i++) {
    const button = buttons[i];
    if (!button.text || button.text.includes('PhilJS')) continue; // Skip logo

    console.log(`   Test ${i + 1}: Clicking "${button.text}"`);

    // Ensure sidebar is scrolled
    await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) sidebar.scrollTop = 200;
    });
    await page.waitForTimeout(100);

    const before = await page.evaluate(() => ({
      sidebarScrollTop: document.querySelector('.sidebar')?.scrollTop || 0,
      windowScrollY: window.scrollY,
      url: window.location.pathname,
    }));

    // Click the button
    const buttonSelector = `.sidebar button:nth-of-type(${i + 1})`;
    await page.click(buttonSelector).catch(() => {});

    // Monitor scroll position changes over time
    const positions = [];
    for (let t = 0; t < 10; t++) {
      await page.waitForTimeout(50);
      const pos = await page.evaluate(() => ({
        time: Date.now(),
        sidebarScrollTop: document.querySelector('.sidebar')?.scrollTop || 0,
        windowScrollY: window.scrollY,
      }));
      positions.push(pos);
    }

    const after = await page.evaluate(() => ({
      sidebarScrollTop: document.querySelector('.sidebar')?.scrollTop || 0,
      windowScrollY: window.scrollY,
      url: window.location.pathname,
    }));

    console.log(`      Before: sidebar=${before.sidebarScrollTop}px, window=${before.windowScrollY}px`);
    console.log(`      After:  sidebar=${after.sidebarScrollTop}px, window=${after.windowScrollY}px`);

    // Check for jump/restoration
    const scrollChanges = positions.filter((p, idx) =>
      idx === 0 || p.sidebarScrollTop !== positions[idx - 1].sidebarScrollTop
    );

    if (scrollChanges.length > 2) {
      console.log(`      ⚠️  JUMPINESS DETECTED: Sidebar scroll changed ${scrollChanges.length} times`);
      scrollChanges.forEach((sc, idx) => {
        console.log(`         t+${idx * 50}ms: ${sc.sidebarScrollTop}px`);
      });
    } else if (before.sidebarScrollTop !== after.sidebarScrollTop) {
      console.log(`      ⚠️  Sidebar scroll position changed (might indicate restoration or reset)`);
    } else {
      console.log(`      ✅ Sidebar scroll position stable`);
    }

    console.log(`      URL changed: ${before.url} → ${after.url}`);
    console.log('');
  }

  // Now test the restoration behavior explicitly
  console.log('5. Testing scroll position restoration...\n');

  // Scroll sidebar, navigate away, navigate back
  console.log('   a) Scrolling sidebar to 400px...');
  await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.scrollTop = 400;
  });
  await page.waitForTimeout(500);

  const scrollBefore = await page.evaluate(() => document.querySelector('.sidebar')?.scrollTop || 0);
  console.log(`      Sidebar at: ${scrollBefore}px`);

  console.log('   b) Clicking "Getting Started" section...');
  await page.click('.sidebar button:has-text("GETTING STARTED")').catch(() => {});
  await page.waitForTimeout(1000);

  const scrollAfter1 = await page.evaluate(() => document.querySelector('.sidebar')?.scrollTop || 0);
  console.log(`      Sidebar at: ${scrollAfter1}px`);

  if (scrollAfter1 === scrollBefore) {
    console.log(`      ✅ Sidebar scroll position preserved: ${scrollAfter1}px`);
  } else if (scrollAfter1 === 0) {
    console.log(`      ❌ Sidebar scroll reset to top (not preserved)`);
  } else {
    console.log(`      ⚠️  Sidebar scroll changed unexpectedly`);
  }

  console.log('\n6. Manual testing (30 seconds)...');
  console.log('   Please:');
  console.log('   - Scroll the sidebar');
  console.log('   - Click different sections/items');
  console.log('   - Watch for any jumping or unexpected scroll behavior\n');

  // Monitor for jump events
  await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      let lastScrollTop = sidebar.scrollTop;
      setInterval(() => {
        const currentScrollTop = sidebar.scrollTop;
        if (Math.abs(currentScrollTop - lastScrollTop) > 10) {
          console.log(`Sidebar jumped: ${lastScrollTop}px → ${currentScrollTop}px`);
        }
        lastScrollTop = currentScrollTop;
      }, 100);
    }
  });

  await page.waitForTimeout(30000);

  await browser.close();
})();

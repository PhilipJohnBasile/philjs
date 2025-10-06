const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();

  console.log('=== Testing Sidebar Scroll and Navigation ===\n');

  await page.goto('http://localhost:3000/docs/data-fetching');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log('1. Checking sidebar structure...');
  const sidebarInfo = await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar, aside');
    if (!sidebar) return { found: false };

    const styles = window.getComputedStyle(sidebar);
    return {
      found: true,
      position: styles.position,
      overflow: styles.overflow,
      overflowY: styles.overflowY,
      height: styles.height,
      top: styles.top,
      bottom: styles.bottom,
    };
  });

  console.log('Sidebar:', sidebarInfo);
  console.log('');

  // Test sidebar scrolling
  console.log('2. Testing sidebar internal scroll...');
  const sidebarScrollTest = await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar, aside');
    if (!sidebar) return { error: 'Sidebar not found' };

    const initialScrollTop = sidebar.scrollTop;
    sidebar.scrollTop = 100;
    const afterScrollTop = sidebar.scrollTop;
    sidebar.scrollTop = initialScrollTop;

    return {
      initialScrollTop,
      afterScrollTop,
      canScroll: afterScrollTop > initialScrollTop,
      scrollHeight: sidebar.scrollHeight,
      clientHeight: sidebar.clientHeight,
    };
  });

  console.log('Sidebar scroll test:', sidebarScrollTest);
  console.log('');

  // Find all navigation links in sidebar
  console.log('3. Finding navigation links in sidebar...');
  const links = await page.$$eval('.sidebar a, aside a', (elements) =>
    elements.map(el => ({
      text: el.textContent?.trim(),
      href: el.getAttribute('href'),
    })).slice(0, 10) // First 10 links
  );

  console.log(`Found ${links.length} links in sidebar:`);
  links.forEach((link, i) => console.log(`   ${i + 1}. ${link.text} -> ${link.href}`));
  console.log('');

  // Test clicking through links and watch for jumpiness
  console.log('4. Testing navigation through sidebar links...');
  console.log('   (Watch for any jumping or scroll issues)\n');

  for (let i = 0; i < Math.min(5, links.length); i++) {
    const link = links[i];
    console.log(`   Clicking: ${link.text}`);

    // Record scroll position before click
    const beforeClick = await page.evaluate(() => ({
      windowScrollY: window.scrollY,
      sidebarScrollTop: document.querySelector('.sidebar, aside')?.scrollTop || 0,
    }));

    // Click the link
    try {
      await page.click(`a[href="${link.href}"]`, { timeout: 5000 });
      await page.waitForTimeout(500);

      // Record scroll position after click
      const afterClick = await page.evaluate(() => ({
        windowScrollY: window.scrollY,
        sidebarScrollTop: document.querySelector('.sidebar, aside')?.scrollTop || 0,
        url: window.location.pathname,
      }));

      console.log(`      Before: window=${beforeClick.windowScrollY}px, sidebar=${beforeClick.sidebarScrollTop}px`);
      console.log(`      After:  window=${afterClick.windowScrollY}px, sidebar=${afterClick.sidebarScrollTop}px`);
      console.log(`      URL: ${afterClick.url}`);

      // Check for jump
      if (afterClick.windowScrollY !== 0) {
        console.log(`      ⚠️  Window did not reset to top (currently at ${afterClick.windowScrollY}px)`);
      }

      if (beforeClick.sidebarScrollTop !== afterClick.sidebarScrollTop) {
        console.log(`      ⚠️  Sidebar scroll changed from ${beforeClick.sidebarScrollTop}px to ${afterClick.sidebarScrollTop}px`);
      }

      console.log('');
    } catch (e) {
      console.log(`      ❌ Failed to click: ${e.message}\n`);
    }
  }

  // Scroll the sidebar manually
  console.log('5. Testing manual sidebar scroll...');
  console.log('   Scrolling to bottom of sidebar...\n');

  await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar, aside');
    if (sidebar) {
      sidebar.scrollTo({ top: sidebar.scrollHeight, behavior: 'smooth' });
    }
  });

  await page.waitForTimeout(1000);

  const finalSidebarPos = await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar, aside');
    return sidebar ? sidebar.scrollTop : 0;
  });

  console.log(`   Sidebar scrolled to: ${finalSidebarPos}px`);

  // Now click a link while sidebar is scrolled
  console.log('\n6. Testing click while sidebar is scrolled...');
  if (links.length > 0) {
    const testLink = links[links.length - 1];
    console.log(`   Clicking: ${testLink.text}`);

    const beforeScroll = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar, aside');
      return sidebar ? sidebar.scrollTop : 0;
    });

    await page.click(`a[href="${testLink.href}"]`, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);

    const afterScroll = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar, aside');
      return sidebar ? sidebar.scrollTop : 0;
    });

    console.log(`   Sidebar scroll before: ${beforeScroll}px`);
    console.log(`   Sidebar scroll after: ${afterScroll}px`);

    if (beforeScroll !== afterScroll) {
      console.log(`   ⚠️  ISSUE: Sidebar scroll position changed unexpectedly!`);
    } else {
      console.log(`   ✅ Sidebar scroll position maintained`);
    }
  }

  console.log('\n=== Manual Testing Time (30 seconds) ===');
  console.log('Please manually:');
  console.log('1. Scroll the sidebar up and down');
  console.log('2. Click various links and watch for jumping');
  console.log('3. Scroll the main content area');
  console.log('');

  await page.waitForTimeout(30000);

  await browser.close();
})();

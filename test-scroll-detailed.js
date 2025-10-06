const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/docs/data-fetching');
  await page.waitForLoadState('networkidle');

  console.log('=== Investigating Router Container ===\n');

  // Check the router container specifically
  const routerInfo = await page.evaluate(() => {
    const routerContainer = document.getElementById('router-container');
    if (!routerContainer) return { exists: false };

    const styles = window.getComputedStyle(routerContainer);
    const rect = routerContainer.getBoundingClientRect();

    return {
      exists: true,
      styles: {
        minHeight: styles.minHeight,
        height: styles.height,
        maxHeight: styles.maxHeight,
        overflow: styles.overflow,
        position: styles.position,
        display: styles.display,
      },
      rect: {
        height: rect.height,
        width: rect.width,
      },
      scrollHeight: routerContainer.scrollHeight,
      clientHeight: routerContainer.clientHeight,
    };
  });

  console.log('Router Container:', routerInfo);
  console.log('');

  // Check parent-child relationships
  const hierarchy = await page.evaluate(() => {
    const getElementInfo = (el) => {
      if (!el) return null;
      const styles = window.getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id,
        className: el.className,
        height: styles.height,
        minHeight: styles.minHeight,
        overflow: styles.overflow,
        position: styles.position,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      };
    };

    const router = document.getElementById('router-container');
    return {
      html: getElementInfo(document.documentElement),
      body: getElementInfo(document.body),
      router: getElementInfo(router),
      docsLayout: getElementInfo(router?.querySelector('.docs-layout')),
      docsMain: getElementInfo(router?.querySelector('.docs-main')),
    };
  });

  console.log('=== Element Hierarchy ===');
  console.log(JSON.stringify(hierarchy, null, 2));
  console.log('');

  // Test if we can scroll the router container
  const scrollTestRouter = await page.evaluate(() => {
    const router = document.getElementById('router-container');
    if (!router) return { error: 'Router not found' };

    const initialScrollTop = router.scrollTop;
    router.scrollTop = 100;
    const afterScrollTop = router.scrollTop;
    router.scrollTop = initialScrollTop;

    return {
      initialScrollTop,
      afterScrollTop,
      canScroll: afterScrollTop > initialScrollTop,
      scrollHeight: router.scrollHeight,
      clientHeight: router.clientHeight,
      maxScroll: router.scrollHeight - router.clientHeight,
    };
  });

  console.log('=== Router Container Scroll Test ===');
  console.log(scrollTestRouter);
  console.log('');

  // Check if viewport scrolling works
  const viewportScroll = await page.evaluate(() => {
    const initialScrollY = window.scrollY;
    const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;

    // Try to scroll
    window.scrollTo(0, 500);
    const afterScroll500 = window.scrollY;

    window.scrollTo(0, 0);
    return {
      initialScrollY,
      afterScroll500,
      scrollChanged: afterScroll500 !== initialScrollY,
      maxScrollY,
      documentScrollHeight: document.documentElement.scrollHeight,
      windowInnerHeight: window.innerHeight,
    };
  });

  console.log('=== Window/Viewport Scroll Test ===');
  console.log(viewportScroll);
  console.log('');

  console.log('\n=== Root Cause Analysis ===');

  if (routerInfo.exists) {
    const routerHeight = parseFloat(routerInfo.styles.height);
    const windowHeight = viewportScroll.windowInnerHeight;

    console.log(`Router container height: ${routerHeight}px`);
    console.log(`Window inner height: ${windowHeight}px`);
    console.log(`Document scroll height: ${viewportScroll.documentScrollHeight}px`);

    if (routerHeight >= viewportScroll.documentScrollHeight) {
      console.log('\n⚠️  ISSUE FOUND: Router container has min-height: 100vh');
      console.log('This makes the container as tall as the viewport, but content inside is taller.');
      console.log('The router container needs overflow-y: auto to enable scrolling,');
      console.log('OR the layout should be restructured to allow document-level scrolling.');
    }
  }

  await page.waitForTimeout(30000);
  await browser.close();
})();

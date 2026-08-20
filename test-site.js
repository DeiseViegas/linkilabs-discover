const { chromium } = require('/opt/data/projects/musikantiga/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const vp of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile', width: 390, height: 844 }
  ]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => errors.push(err.message));
    const response = await page.goto('http://127.0.0.1:8088/', { waitUntil: 'networkidle' });
    const data = await page.evaluate(() => ({
      title: document.title,
      h1: document.querySelector('h1')?.textContent.trim(),
      lang: document.documentElement.lang,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      brokenImages: [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src),
      links: [...document.querySelectorAll('a')].map(a => a.getAttribute('href')),
      hasDescription: Boolean(document.querySelector('meta[name="description"]')?.content),
      hasCanonical: Boolean(document.querySelector('link[rel="canonical"]')?.href),
      hasJsonLd: Boolean(document.querySelector('script[type="application/ld+json"]')),
    }));
    await page.screenshot({ path: `/opt/data/projects/linkilabs-discover/test-${vp.name}.png`, fullPage: true });
    results.push({ viewport: vp, status: response.status(), errors, ...data });
    await page.close();
  }
  const p = await browser.newPage();
  const privacy = await p.goto('http://127.0.0.1:8088/privacy.html', { waitUntil: 'networkidle' });
  const privacyH1 = await p.locator('h1').textContent();
  results.push({ page: 'privacy', status: privacy.status(), h1: privacyH1.trim() });
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})();

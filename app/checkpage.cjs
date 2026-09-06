const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + String(e).slice(0, 400)));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => errs.push('GOTO: ' + e.message));
  await page.waitForTimeout(2000);
  const info = await page.evaluate(() => ({
    rootChildren: document.querySelector('#root')?.children.length ?? -1,
    text: document.body.innerText.slice(0, 100),
  })).catch(e => 'EVAL: ' + e.message);
  console.log('INFO:', JSON.stringify(info));
  console.log('ERRORS:', errs.length ? errs.join('\n---\n') : 'NONE');
  await browser.close();
  process.exit(0);
})();

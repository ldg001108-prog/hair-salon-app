import { chromium } from 'playwright';

(async () => {
  console.log('Starting Playwright crawler...');
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // catch all errors and logs
  page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', error => console.log(`[Browser Page Error] ${error.message}`));
  page.on('requestfailed', request => console.log(`[Browser Network Error] ${request.url()} - ${request.failure()?.errorText}`));

  const urlsToTest = ['http://localhost:3000', 'http://localhost:3000/admin/login'];
  
  for (const url of urlsToTest) {
    console.log(`\n================================`);
    console.log(`Navigating to ${url}...`);
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      
      const locators = await page.locator('button, a, [role="button"]').all();
      console.log(`Found ${locators.length} clickable elements on ${url}.`);
      
      for (let i = 0; i < locators.length; i++) {
          try {
              const el = locators[i];
              const text = await el.textContent();
              const isVisible = await el.isVisible();
              if (isVisible) {
                  console.log(`- Clicking element [${text?.trim()?.substring(0, 30)}]...`);
                  // Click and wait a bit to see if error occurs
                  await el.click({ timeout: 2000, trial: true }); // Trial click to ensure it's clickable
                  console.log(`  -> Click simulation successful.`);
              }
          } catch(e) {
              console.log(`  -> Click failed: ${e.message.split('\n')[0]}`);
          }
      }
    } catch(err) {
      console.log(`Failed to process ${url}: ${err.message}`);
    }
  }
  
  await browser.close();
  console.log('\nFinished testing.');
})();
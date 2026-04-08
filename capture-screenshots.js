const { chromium } = require('playwright');
const path = require('path');

async function captureScreenshot(browser, url, filename) {
  const context = await browser.newContext({
    viewport: { width: 800, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  const screenshotPath = path.join(__dirname, 'screenshots', filename);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
  
  await context.close();
  return screenshotPath;
}

(async () => {
  const { mkdirSync } = require('fs');
  mkdirSync(path.join(__dirname, 'screenshots'), { recursive: true });
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    await captureScreenshot(browser, 'https://auto-qa-demo.vercel.app/', 'auto-qa-800.png');
    await captureScreenshot(browser, 'https://ai-icon-generator-sandy.vercel.app/', 'ai-icon-generator-800.png');
  } finally {
    await browser.close();
  }
  
  console.log('Done!');
})();

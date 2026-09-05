import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const page = await context.newPage();

  await page.goto('http://localhost:3000/login');
  await page.getByRole('button', { name: /Test Team/i }).click();
  await page.waitForURL('**/play');
  
  // Submit correct answer to Level 1 to get to Level 2
  await page.fill('input[name="answer"]', 'SHE WAITS THREE DAYS WEST');
  await page.click('button:has-text("Submit Answer")');
  await page.waitForTimeout(2000); // Wait for transition to Level 2

  const screenshotPath = '/Users/dayananda/.gemini/antigravity-ide/brain/8c2281a7-4c2b-4e98-97b4-ddba64f8fc83/trial2_check.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Screenshot saved to:', screenshotPath);
  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

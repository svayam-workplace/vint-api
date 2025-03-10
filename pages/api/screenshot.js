import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export default async function handler(req, res) {
  try {
    const browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--single-process',  // Reduces memory usage
        '--no-zygote',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ],
      executablePath: await chromium.executablePath(),
      headless: 'new',
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto('https://example.com');
    
    // Add network idle wait
    await page.waitForNetworkIdle({ idleTime: 500 });

    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 80
    });

    await browser.close();
    
    res.setHeader('Content-Type', 'image/png');
    res.send(screenshot);

  } catch (error) {
    console.error('Puppeteer Error:', error.message);
    res.status(500).json({ 
      error: 'Screenshot failed',
      details: error.message
    });
  }
}
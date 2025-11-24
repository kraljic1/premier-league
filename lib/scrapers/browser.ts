import puppeteer, { Browser, Page } from "puppeteer";

let browserInstance: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    });
  }
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

export async function scrapePage(
  url: string,
  waitSelector?: string,
  timeout: number = 30000
): Promise<Page> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  // Use 'domcontentloaded' instead of 'networkidle2' for faster loading
  // This waits for DOM to be ready, which is usually sufficient for scraping
  await page.goto(url, {
    waitUntil: waitSelector ? "domcontentloaded" : "load",
    timeout,
  });

  if (waitSelector) {
    // Wait for selector with shorter timeout, but don't fail if not found
    await page.waitForSelector(waitSelector, { timeout: 5000 }).catch(() => {
      // Continue even if selector not found
    });
  }

  // Reduced wait time - 1 second is usually enough for JavaScript to render
  await new Promise(resolve => setTimeout(resolve, 1000));

  return page;
}


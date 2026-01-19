import puppeteer, { Browser, Page } from "puppeteer";

let browserInstance: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    // Check if we're running on Netlify (production)
    const isNetlify = Boolean(
      process.env.NETLIFY ||
      process.env.NETLIFY_URL ||
      process.env.PUPPETEER_EXECUTABLE_PATH
    );

    const launchOptions: any = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--disable-blink-features=AutomationControlled", // Hide automation
        "--disable-features=IsolateOrigins,site-per-process",
      ],
    };

    // Use system Chromium only when explicitly configured
    const configuredPath = process.env.PUPPETEER_EXECUTABLE_PATH;

    if (isNetlify) {
      console.log(`[Browser] Netlify environment detected`);
      console.log(`[Browser] PUPPETEER_EXECUTABLE_PATH env var: ${configuredPath || "not set"}`);

      if (configuredPath) {
        launchOptions.executablePath = configuredPath;
        console.log(`[Browser] Using system Chromium: ${configuredPath}`);
      } else {
        console.log(`[Browser] Using bundled Chromium`);
      }

      // Additional args for Netlify environment
      launchOptions.args = launchOptions.args || [];
      launchOptions.args.push("--single-process");
      launchOptions.args.push("--no-zygote");
    } else {
      console.log(`[Browser] Local development - using downloaded Chromium`);
    }

    try {
      browserInstance = await puppeteer.launch(launchOptions);
      console.log(`[Browser] Browser launched successfully`);
    } catch (error) {
      const configuredInfo = configuredPath ? ` at ${configuredPath}` : '';
      console.error(`[Browser] Failed to launch browser${configuredInfo}:`, error);
      throw error;
    }
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

  // Set realistic user agent
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  // Hide webdriver property to avoid detection
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
    
    // Override plugins to look more realistic
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    
    // Override languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
  });

  // Set viewport to realistic size
  await page.setViewport({ width: 1920, height: 1080 });

  // Suppress console logs from the page (cookie dialogs, etc.)
  page.on('console', (msg) => {
    const text = msg.text();
    
    // Suppress expected errors (cookie dialogs, 404s, CORS, etc.)
    const isExpectedError = 
      text.includes('Failed to load resource') ||
      text.includes('404') ||
      text.includes('403') ||
      text.includes('CORS') ||
      text.includes('ERR_FAILED') ||
      text.includes('JSHandle@error');
    
    if (msg.type() === 'error' && !isExpectedError) {
      console.error(`[Page Error] ${text}`);
    }
  });

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


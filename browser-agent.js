import puppeteer from "puppeteer-core";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HEADLESS = process.env.BROWSER_HEADLESS === "1";
const CHROME_PATH = process.env.CHROME_PATH;

let browser = null;
let page = null;
let screenshotInterval = null;
let onFrame = null;
let onActivity = null;
let lastLaunchError = null;

export function setCallbacks({ frameCb, activityCb }) {
  onFrame = frameCb;
  onActivity = activityCb;
}

function act(text) {
  console.log(`[BROWSER] ${text}`);
  if (onActivity) onActivity(text);
}

// =====================================================
//  SMART CHROME FINDER
// =====================================================
function findChromePath() {
  if (CHROME_PATH && fs.existsSync(CHROME_PATH)) return CHROME_PATH;

  const platform = process.platform;
  const candidates = [];

  if (platform === "win32") {
    candidates.push(
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      (process.env.LOCALAPPDATA || "") + "\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    );
  } else if (platform === "darwin") {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    );
  } else {
    candidates.push(
      "/usr/bin/google-chrome",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/usr/bin/microsoft-edge",
    );
  }

  for (const c of candidates) {
    if (c && fs.existsSync(c)) {
      act(`🔍 Auto-found browser: ${path.basename(c)}`);
      return c;
    }
  }
  return null;
}

// =====================================================
//  LAUNCH with fallbacks
// =====================================================
export async function launchBrowser() {
  if (browser && browser.connected) return page;

  act("🚀 Launching browser...");
  lastLaunchError = null;

  const sysChrome = findChromePath();
  const attempts = [];

  if (sysChrome) {
    attempts.push({
      name: `System Chrome (${path.basename(sysChrome)})`,
      opts: {
        headless: HEADLESS ? "new" : false,
        defaultViewport: { width: 1280, height: 800 },
        executablePath: sysChrome,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled", "--start-maximized", "--disable-notifications"],
        userDataDir: path.join(__dirname, ".browser-profile"),
      },
    });
  }

  attempts.push({
    name: "Bundled Chromium",
    opts: {
      headless: HEADLESS ? "new" : false,
      defaultViewport: { width: 1280, height: 800 },
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled", "--start-maximized", "--disable-notifications"],
      userDataDir: path.join(__dirname, ".browser-profile"),
    },
  });

  for (const attempt of attempts) {
    try {
      act(`   → Trying: ${attempt.name}`);
      browser = await puppeteer.launch(attempt.opts);
      act(`✅ Browser launched via ${attempt.name}`);
      break;
    } catch (e) {
      lastLaunchError = e.message;
      act(`   ✗ ${attempt.name} failed: ${e.message.slice(0, 100)}`);
      browser = null;
    }
  }

  if (!browser) {
    throw new Error(
      `Koi bhi browser launch nahi ho paya. Last error: ${lastLaunchError}\n` +
      `Fix: "npx puppeteer browsers install chrome" chalao, ya .env mein CHROME_PATH set karo.`
    );
  }

  const pages = await browser.pages();
  page = pages[0] || (await browser.newPage());
  await page.setViewport({ width: 1280, height: 800 });

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en", "hi"] });
  });

  page.on("dialog", async (d) => { try { await d.dismiss(); } catch {} });

  act("✅ Browser ready");
  startScreenshotStream();
  return page;
}

// =====================================================
//  SMART HELPERS
// =====================================================
async function dismissAutoDialogs() {
  if (!page) return null;
  try {
    const dismissed = await page.evaluate(() => {
      const patterns = [
        /^accept(\s+all)?$/i, /^agree$/i, /^allow(\s+all)?$/i, /^got it$/i,
        /^ok(ay)?$/i, /^i agree$/i, /^no thanks$/i, /^not now$/i, /^later$/i,
        /^close$/i, /^dismiss$/i, /^continue$/i, /^i understand$/i, /^skip$/i,
        /^सहमत$/i, /^स्वीकार$/i, /^ठीक$/i, /^बाद में$/i, /^अनुमति दें$/i,
        /^सभी स्वीकार$/i, /^जारी रखें$/i, /^समझ गया$/i,
      ];
      const btns = Array.from(document.querySelectorAll(
        "button, [role='button'], a[role='button'], input[type='button'], input[type='submit']"
      ));
      for (const b of btns) {
        if (b.offsetParent === null) continue;
        const txt = (b.innerText || b.value || b.getAttribute("aria-label") || "").trim();
        if (!txt || txt.length > 45) continue;
        for (const p of patterns) {
          if (p.test(txt)) {
            try { b.click(); return txt; } catch {}
          }
        }
      }
      return null;
    });
    if (dismissed) act(`🤖 Auto-dismissed: "${dismissed}"`);
    return dismissed;
  } catch { return null; }
}

async function detectLoginWall() {
  if (!page) return null;
  try {
    const url = page.url();
    const text = await page.evaluate(() => (document.body.innerText || "").toLowerCase().slice(0, 3000));

    const isLoginUrl =
      /accounts\.google\.com\/(signin|ServiceLogin|v\d+\/signin|challenge)/.test(url) ||
      /login\.live\.com/.test(url) ||
      /facebook\.com\/(login|r\.php)/.test(url) ||
      /instagram\.com\/accounts\/login/.test(url) ||
      /(twitter|x)\.com\/i\/flow\/login/.test(url) ||
      /linkedin\.com\/(login|uas\/login)/.test(url) ||
      /amazon\.[a-z.]+\/ap\/signin/.test(url) ||
      /github\.com\/login/.test(url);

    const isLoginText =
      /\b(sign in|log in|login|signin)\b/i.test(text) &&
      /\b(password|passcode|email|phone|username|continue with|enter your)\b/i.test(text);

    if (isLoginUrl || isLoginText) {
      return { url, message: "Login page detected" };
    }
    return null;
  } catch { return null; }
}

// =====================================================
//  SCREENSHOT STREAM
// =====================================================
function startScreenshotStream() {
  if (screenshotInterval) return;
  screenshotInterval = setInterval(async () => {
    if (!page || page.isClosed()) return;
    try {
      const buf = await page.screenshot({ type: "jpeg", quality: 55, encoding: "base64" });
      if (onFrame) onFrame(buf);
    } catch {}
  }, 700);
}

export function stopScreenshotStream() {
  clearInterval(screenshotInterval);
  screenshotInterval = null;
}

// =====================================================
//  CORE ACTIONS
// =====================================================
export async function goTo(url) {
  try {
    await launchBrowser();
  } catch (e) {
    return { ok: false, error: "Browser launch failed: " + e.message, fallback: "Try open_app or search_web instead" };
  }

  if (!/^https?:\/\//i.test(url)) url = "https://" + url;

  act(`🌐 Opening: ${url}`);
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  } catch (e) {
    return { ok: false, error: `Navigation failed: ${e.message}` };
  }
  await new Promise((r) => setTimeout(r, 1200));
  await dismissAutoDialogs();
  await new Promise((r) => setTimeout(r, 400));
  await dismissAutoDialogs();

  const login = await detectLoginWall();
  if (login) {
    act(`🔐 Login required at ${login.url}`);
    return {
      ok: true,
      url: page.url(),
      title: await page.title(),
      login_required: true,
      message: "Login page आया है। User ko bolo: 'आप manually login कर लो, मैं wait कर रही हूँ। हो जाए तो बोलो।'",
    };
  }

  return { ok: true, url: page.url(), title: await page.title() };
}

export async function googleSearch(query) {
  try {
    await launchBrowser();
  } catch (e) {
    return { ok: false, error: "Browser launch failed: " + e.message };
  }

  act(`🔍 Google search: "${query}"`);

  try {
    await page.goto("https://www.google.com", { waitUntil: "domcontentloaded", timeout: 20000 });
  } catch {
    try {
      await page.goto("https://www.google.com/search?q=" + encodeURIComponent(query), {
        waitUntil: "domcontentloaded", timeout: 20000
      });
      await new Promise((r) => setTimeout(r, 1500));
      return await scrapeGoogleResults(query);
    } catch (e) {
      return { ok: false, error: "Google unreachable: " + e.message };
    }
  }

  await new Promise((r) => setTimeout(r, 800));
  await dismissAutoDialogs();

  try {
    await page.waitForSelector('textarea[name="q"], input[name="q"]', { timeout: 8000 });
  } catch {
    act("⚠️ Search box not found, using direct URL");
    await page.goto("https://www.google.com/search?q=" + encodeURIComponent(query), {
      waitUntil: "domcontentloaded",
    });
    await new Promise((r) => setTimeout(r, 1500));
    return await scrapeGoogleResults(query);
  }

  const input = (await page.$('textarea[name="q"]')) || (await page.$('input[name="q"]'));
  await input.click({ clickCount: 3 });
  await page.keyboard.type(query, { delay: 40 });
  await page.keyboard.press("Enter");

  await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1200));
  await dismissAutoDialogs();

  return await scrapeGoogleResults(query);
}

async function scrapeGoogleResults(query) {
  const results = await page.evaluate(() => {
    const out = [];
    const blocks = document.querySelectorAll("div.g, div[data-sokoban-container], div.MjjYud");
    for (const b of blocks) {
      const a = b.querySelector("a[href^='http']");
      const h3 = b.querySelector("h3");
      const snip = b.querySelector("div[data-sncf], .VwiC3b, .lEBKkf");
      if (a && h3) {
        out.push({
          title: h3.innerText.trim(),
          url: a.href,
          snippet: (snip?.innerText || "").slice(0, 200),
        });
      }
      if (out.length >= 5) break;
    }
    return out;
  });
  act(`✅ Got ${results.length} results`);
  return { ok: true, query, results, current_url: page.url() };
}

export async function youtubeSearch(query) {
  try {
    await launchBrowser();
  } catch (e) {
    return { ok: false, error: "Browser launch failed: " + e.message };
  }

  act(`▶️ YouTube search: "${query}"`);
  try {
    await page.goto("https://www.youtube.com/results?search_query=" + encodeURIComponent(query), {
      waitUntil: "domcontentloaded",
    });
  } catch (e) {
    return { ok: false, error: "YouTube unreachable: " + e.message };
  }
  await new Promise((r) => setTimeout(r, 1800));
  await dismissAutoDialogs();

  const results = await page.evaluate(() => {
    const out = [];
    const items = document.querySelectorAll("ytd-video-renderer, ytd-compact-video-renderer");
    for (const it of items) {
      const a = it.querySelector("a#video-title, a#thumbnail");
      const ch = it.querySelector("ytd-channel-name a, .ytd-channel-name");
      if (a) {
        out.push({
          title: (a.innerText || a.getAttribute("title") || "").trim(),
          url: "https://www.youtube.com" + (a.getAttribute("href") || ""),
          channel: ch?.innerText || "",
        });
      }
      if (out.length >= 6) break;
    }
    return out;
  });

  act(`✅ Got ${results.length} videos`);
  return { ok: true, query, results, current_url: page.url() };
}

export async function clickFirstResult() {
  if (!page) return { ok: false, error: "No page" };
  act("🖱️ Clicking first result...");
  try {
    const before = page.url();
    await page.evaluate(() => {
      const cand = document.querySelector("a h3")?.closest("a")
                || document.querySelector("div.g a[href^='http']")
                || document.querySelector("a[href^='http']");
      if (cand) cand.click();
    });
    await new Promise((r) => setTimeout(r, 1800));
    await dismissAutoDialogs();
    const after = page.url();
    return { ok: true, url: after, changed: before !== after, title: await page.title() };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function clickByText(text) {
  if (!page) return { ok: false, error: "No page" };
  act(`🖱️ Clicking: "${text}"`);

  const clicked = await page.evaluate((needle) => {
    const target = needle.toLowerCase().trim();
    const candidates = Array.from(document.querySelectorAll(
      "button, a, [role='button'], input[type='button'], input[type='submit'], div[role='button'], label, span"
    ));
    let best = null, bestScore = -1;
    for (const el of candidates) {
      if (el.offsetParent === null) continue;
      const txt = (el.innerText || el.value || el.getAttribute("aria-label") || "").toLowerCase().trim();
      if (!txt) continue;
      let score = 0;
      if (txt === target) score = 100;
      else if (txt.includes(target)) score = 50 + Math.max(0, 30 - txt.length);
      else if (target.includes(txt) && txt.length > 2) score = 20;
      if (score > bestScore) { bestScore = score; best = el; }
    }
    if (best && bestScore > 15) {
      best.scrollIntoView({ block: "center" });
      best.click();
      return best.innerText?.slice(0, 40) || best.value || "element";
    }
    return null;
  }, text);

  if (clicked) {
    await new Promise((r) => setTimeout(r, 1200));
    await dismissAutoDialogs();
    return { ok: true, clicked, url: page.url() };
  }
  return { ok: false, error: `No element found with text "${text}"` };
}

export async function waitForElement(selector, timeoutMs = 10000) {
  if (!page) return { ok: false, error: "No page" };
  act(`⏳ Waiting for: ${selector}`);
  try {
    await page.waitForSelector(selector, { timeout: timeoutMs });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Element "${selector}" not found in ${timeoutMs}ms` };
  }
}

export async function scrollPage(direction = "down", amount = 500) {
  if (!page) return { ok: false, error: "No page" };
  act(`📜 Scrolling ${direction}...`);
  await page.evaluate((dir, amt) => {
    window.scrollBy(0, dir === "up" ? -amt : amt);
  }, direction, amount);
  await new Promise((r) => setTimeout(r, 600));
  return { ok: true };
}

export async function readPageContent() {
  if (!page) return { ok: false, error: "No page" };
  act("📖 Reading page content...");
  try {
    const data = await page.evaluate(() => {
      const title = document.title;
      const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
        .map((h) => h.innerText.trim()).filter(Boolean).slice(0, 10);
      const paragraphs = Array.from(document.querySelectorAll("p"))
        .map((p) => p.innerText.trim()).filter((t) => t.length > 30).slice(0, 8);
      const text = (document.body.innerText || "").slice(0, 6000);
      return { title, url: location.href, headings, paragraphs, text };
    });
    return { ok: true, ...data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function typeInSearch(text) {
  if (!page) return { ok: false, error: "No page" };
  act(`⌨️ Typing: "${text}"`);
  try {
    const found = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll(
        'input[type="search"], input[type="text"], input[name="q"], input[name="search"], textarea[name="q"], input[type="email"]'
      ));
      for (const i of inputs) {
        if (i.offsetParent === null) continue;
        const r = i.getBoundingClientRect();
        if (r.width < 50) continue;
        i.focus();
        return true;
      }
      return false;
    });
    if (!found) return { ok: false, error: "No search input found" };
    await page.keyboard.type(text, { delay: 40 });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function pressEnter() {
  if (!page) return { ok: false, error: "No page" };
  act("⏎ Pressing Enter");
  await page.keyboard.press("Enter");
  await new Promise((r) => setTimeout(r, 1500));
  await dismissAutoDialogs();
  return { ok: true, url: page.url() };
}

export async function goBack() {
  if (!page) return { ok: false };
  act("⬅️ Back");
  try {
    await page.goBack({ waitUntil: "domcontentloaded", timeout: 10000 });
    await new Promise((r) => setTimeout(r, 800));
    return { ok: true, url: page.url() };
  } catch {
    return { ok: false, error: "Cannot go back" };
  }
}

export async function getState() {
  if (!page) return { launched: false, last_error: lastLaunchError };
  try {
    const login = await detectLoginWall();
    return {
      launched: true,
      url: page.url(),
      title: await page.title(),
      login_required: !!login,
    };
  } catch {
    return { launched: false };
  }
}

export async function closeBrowser() {
  stopScreenshotStream();
  if (browser) {
    try { await browser.close(); } catch {}
    browser = null;
    page = null;
    act("🔒 Browser closed");
  }
}

process.on("SIGINT", async () => {
  await closeBrowser();
  process.exit(0);
});
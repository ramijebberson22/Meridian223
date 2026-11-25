/**
 * End-to-end test in Chromium. The GamePix feed, thumbnails and game embeds are
 * mocked so it runs offline. Run: npm run test:e2e
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const shots = path.join(root, "tests/screenshots");
fs.mkdirSync(shots, { recursive: true });

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = path.join(dist, p === "/" ? "index.html" : p);
  if (!file.startsWith(dist) || !fs.existsSync(file)) return res.writeHead(404).end("nf");
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;

const NAMES = ["Turbo Rally", "Sky Hopper", "Block Siege", "Neon Drift", "Pixel Kicks", "Stack Tower", "Laser Duel", "Hoop Rush", "Cave Runner", "Tank Wars", "Puzzle Pop", "Moto Flip"];
const PALETTE = ["#c4552f", "#13808f", "#5b5bd6", "#a1417a", "#4d7c5b", "#b17812", "#2f6db5"];
let feedCalls = 0;
function feed(url) {
  feedCalls++;
  const u = new URL(url);
  const page = Number(u.searchParams.get("page"));
  const cat = u.searchParams.get("category") || "arcade";
  const size = Number(u.searchParams.get("pagination"));
  const items = page > 6 ? [] : Array.from({ length: cat === "arcade" ? size : 8 }, (_, i) => {
    const n = (page - 1) * size + i;
    const title = `${NAMES[n % NAMES.length]} ${Math.floor(n / NAMES.length) + 1}`;
    return { title, namespace: `${cat}-${title.toLowerCase().replace(/\s+/g, "-")}`, category: cat, quality_score: 1 - n / 1000, width: n % 5 === 0 ? 600 : 800, height: n % 5 === 0 ? 900 : 450 };
  });
  return JSON.stringify({ items });
}
function thumb(url) {
  const ns = new URL(url).pathname.split("/")[2] || "game";
  const c = PALETTE[ns.length % PALETTE.length];
  const label = ns.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()).slice(0, 22);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="197"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="#111"/></linearGradient></defs><rect width="320" height="197" fill="url(#g)"/><circle cx="260" cy="40" r="60" fill="#fff" opacity=".12"/><text x="20" y="170" font-family="sans-serif" font-size="22" font-weight="700" fill="#fff">${label}</text></svg>`;
}

const browser = await chromium.launch();
let failures = 0;
const errors = [];
async function step(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures++;
    console.log(`  ✗ ${name}\n      ${String(e.message).split("\n").slice(0, 3).join("\n      ")}`);
  }
}
const assert = (c, m) => {
  if (!c) throw new Error(m);
};

async function newPage(viewport = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await ctx.route(/feeds\.gamepix\.com/, (r) => r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: feed(r.request().url()) }));
  await ctx.route(/img\.gamepix\.com/, (r) => r.fulfill({ status: 200, contentType: "image/svg+xml", body: thumb(r.request().url()) }));
  await ctx.route(/play\.gamepix\.com/, (r) =>
    r.fulfill({ status: 200, contentType: "text/html", body: `<body style="margin:0;display:grid;place-items:center;height:100vh;background:#0b1020;color:#fff;font:600 22px sans-serif"><div id="game">Game running: ${new URL(r.request().url()).pathname.split("/")[1]}</div></body>` }),
  );
  await ctx.route(/poki\.com|itch\.io/, (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<h1>official site</h1>" }));
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  return { ctx, page };
}

console.log("Arcade e2e");
const { ctx, page } = await newPage();

await step("library loads with featured + live catalog", async () => {
  await page.goto(base);
  await page.getByRole("heading", { name: /Pick a game/ }).waitFor();
  await page.getByRole("heading", { name: "Popular" }).waitFor();
  await page.getByRole("heading", { name: "Staff picks" }).waitFor();
  await page.getByText("Moto X3M: Spooky Land", { exact: true }).waitFor();
  assert((await page.getByText("GunSpin", { exact: true }).count()) === 0, "GunSpin removed");
  assert((await page.locator('main a[target="_blank"]:not([href^="play.html"])').count()) === 0, "no off-site game links");
  await page.getByText("Turbo Rally 1", { exact: true }).waitFor();
  const imgs = await page.locator("main img").evaluateAll((els) => els.slice(0, 30).map((i) => i.complete && i.naturalWidth > 0));
  assert(imgs.filter(Boolean).length >= 10, `thumbnails loaded: ${imgs.filter(Boolean).length}`);
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(shots, "01-library-light.png") });
});

await step("infinite scroll loads more pages", async () => {
  const before = await page.locator('main a[href^="play.html"]').count();
  await page.mouse.wheel(0, 20000);
  await page.waitForTimeout(600);
  await page.mouse.wheel(0, 20000);
  await page.waitForFunction((n) => document.querySelectorAll('main a[href^="play.html"]').length > n + 40, before);
});

await step("game opens in a new tab on this site, in a game window", async () => {
  await page.evaluate(() => window.scrollTo(0, 0));
  const popup = ctx.waitForEvent("page");
  await page.getByRole("link", { name: /^Moto X3M: Spooky Land/ }).first().click();
  const p = await popup;
  await p.waitForLoadState();
  assert(new URL(p.url()).pathname.endsWith("/play.html"), p.url());
  await p.getByText("Moto X3M: Spooky Land", { exact: true }).first().waitFor();
  const src = await p.locator("iframe").getAttribute("src");
  assert(src === "https://play.gamepix.com/moto-x3m-spooky-land/embed?sid=1", src);
  await p.frameLocator("iframe").locator("#game").waitFor();
  await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(shots, "02-player.png") });
  await p.close();
});

await step("played game appears under Continue playing", async () => {
  await page.reload();
  await page.getByRole("heading", { name: "Continue playing" }).waitFor();
});

await step("search finds featured and catalog games", async () => {
  await page.getByLabel("Search games").fill("hoop");
  await page.getByRole("heading", { name: /Results for/ }).waitFor();
  await page.getByText("Hoop Rush 1", { exact: true }).waitFor();
  await page.getByText("HOOPS the Game", { exact: true }).waitFor();
  await page.getByLabel("Clear search").click();
});

await step("category chips load that category", async () => {
  await page.getByRole("button", { name: "Racing", exact: true }).click();
  await page.getByRole("heading", { name: "Racing games" }).waitFor();
  await page.getByText("Turbo Rally 1", { exact: true }).first().waitFor();
  const hrefs = await page.locator('main a[href^="play.html"]').evaluateAll((a) => a.slice(0, 20).map((x) => x.getAttribute("href")));
  assert(hrefs.some((h) => h.includes("gp%3Aracing-")) && hrefs.some((h) => h.includes("gp%3Acar-")), "merged racing sub-categories");
  await page.getByRole("button", { name: "All", exact: true }).click();
});

await step("favorites", async () => {
  await page.getByRole("button", { name: "Add Basketball Stars to favorites" }).first().click();
  await page.getByRole("button", { name: /Favorites · 1/ }).click();
  await page.getByRole("heading", { name: "Your favorites" }).waitFor();
  await page.getByText("Basketball Stars", { exact: true }).waitFor();
  await page.getByRole("button", { name: "All", exact: true }).click();
});

await step("player rejects unknown or unsafe games", async () => {
  const p = await ctx.newPage();
  await p.goto(base + "play.html?g=gp:" + encodeURIComponent("../../evil.com"));
  await p.getByRole("heading", { name: "We couldn't find that game" }).waitFor();
  assert((await p.locator("iframe").count()) === 0, "no iframe rendered");
  await p.goto(base + "play.html?g=x:retro-bowl&t=Retro%20Bowl");
  await p.getByRole("heading", { name: "We couldn't find that game" }).waitFor();
  await p.close();
});

await step("portrait games get a portrait window", async () => {
  const p = await ctx.newPage();
  await p.goto(base + "play.html?g=gp:sky-hopper-1&t=Sky%20Hopper%201&c=arcade&w=600&h=900");
  const box = await p.locator("iframe").boundingBox();
  assert(box && box.height > box.width, `w=${box?.width} h=${box?.height}`);
  await p.close();
});

await step("dark mode + accent persist across pages", async () => {
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.getByRole("button", { name: "Accent color" }).click();
  await page.getByRole("button", { name: "Lagoon accent" }).click();
  await page.keyboard.press("Escape");
  await page.reload();
  const m = await page.evaluate(() => [document.documentElement.dataset.mode, document.documentElement.dataset.accent]);
  assert(m[0] === "dark" && m[1] === "lagoon", m.join());
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(shots, "03-library-dark.png") });
  const p = await ctx.newPage();
  await p.goto(base + "play.html?g=gp:basketball-stars&t=Basketball%20Stars&c=sports");
  await p.frameLocator("iframe").locator("#game").waitFor();
  assert((await p.evaluate(() => document.documentElement.dataset.mode)) === "dark", "player dark");
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(shots, "04-player-dark.png") });
  await p.close();
});

await ctx.close();
const m = await newPage({ width: 390, height: 844 });
await step("mobile layout", async () => {
  await m.page.goto(base);
  await m.page.getByText("Basketball Stars", { exact: true }).first().waitFor();
  await m.page.waitForTimeout(800);
  await m.page.screenshot({ path: path.join(shots, "05-mobile.png") });
  await m.page.goto(base + "play.html?g=gp:basketball-stars&t=Basketball%20Stars&c=sports");
  await m.page.frameLocator("iframe").locator("#game").waitFor();
  await m.page.screenshot({ path: path.join(shots, "06-mobile-player.png") });
});
await m.ctx.close();

await step("no page errors", async () => assert(errors.length === 0, errors.join("\n")));
await browser.close();
server.close();
console.log(failures ? `\n${failures} failed` : `\nall passed (${feedCalls} feed requests)`);
process.exit(failures ? 1 : 0);

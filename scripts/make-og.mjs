// Renders design/og.html to public/og.png (1200x630) using headless Chrome.
// Serves the project over a throwaway local HTTP server so the page can load
// the self-hosted fonts and the project screenshots.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const OUT = join(ROOT, "public", "og.png");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".woff2": "font/woff2",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p)) ?? "chrome";
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const file = join(ROOT, decodeURIComponent(url.pathname));
    if (!file.startsWith(ROOT)) throw new Error("outside root");
    const info = await stat(file).catch(() => null);
    if (!info || !info.isFile()) {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
    res.end(await readFile(file));
  } catch {
    res.writeHead(400).end("bad request");
  }
});

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const { port } = server.address();
const url = `http://127.0.0.1:${port}/design/og.html`;

const args = [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--force-device-scale-factor=1",
  "--window-size=1200,630",
  "--virtual-time-budget=6000",
  `--screenshot=${OUT.replaceAll("\\", "/")}`,
  url,
];

const code = await new Promise((r) => {
  const child = spawn(chromePath(), args, { stdio: "ignore" });
  child.on("error", (e) => {
    console.error("could not launch Chrome:", e.message);
    r(1);
  });
  child.on("close", r);
});

server.close();
if (code !== 0) process.exit(code);

const { size } = await stat(OUT);
console.log(`wrote public/og.png (1200x630, ${(size / 1024).toFixed(1)} KB)`);

// Static sanity checks for the portfolio before deploying:
//   - every local src/href resolves to a file in public/
//   - every <img> has alt text and intrinsic width/height that matches the file
//   - exactly one <h1>, and headings never skip a level
import { readFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";

const PUBLIC = resolve("public");
const html = await readFile(join(PUBLIC, "index.html"), "utf8");

const problems = [];
const notes = [];

/* ── local link targets ─────────────────────────────────────── */
const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
const local = refs.filter(
  (r) => !/^(https?:|mailto:|tel:|#|data:)/.test(r) && r.trim() !== "",
);

for (const ref of new Set(local)) {
  const path = join(PUBLIC, ref.split(/[?#]/)[0]);
  try {
    await access(path);
    notes.push(`ok  asset  ${ref}`);
  } catch {
    problems.push(`missing asset: ${ref}`);
  }
}

/* ── images: alt text + real intrinsic size ─────────────────── */
function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
if (imgs.length === 0) problems.push("no <img> tags found");

for (const tag of imgs) {
  const src = /src="([^"]+)"/.exec(tag)?.[1];
  const alt = /alt="([^"]*)"/.exec(tag);
  const w = /width="(\d+)"/.exec(tag)?.[1];
  const h = /height="(\d+)"/.exec(tag)?.[1];

  if (!alt) problems.push(`img without alt attribute: ${src}`);
  if (!w || !h) problems.push(`img without width/height (layout shift risk): ${src}`);
  if (!src || src.startsWith("http")) continue;

  if (/\.jpe?g$/.test(src)) {
    const real = jpegSize(await readFile(join(PUBLIC, src)));
    if (!real) {
      problems.push(`could not read JPEG size: ${src}`);
    } else if (real.width !== Number(w) || real.height !== Number(h)) {
      problems.push(
        `declared ${w}x${h} but ${src} is ${real.width}x${real.height}`,
      );
    }
  }
}

/* ── headings ───────────────────────────────────────────────── */
const headingTags = [...html.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
const h1s = headingTags.filter((n) => n === 1).length;
if (h1s !== 1) problems.push(`expected exactly one <h1>, found ${h1s}`);

let prev = 0;
headingTags.forEach((level, i) => {
  if (prev && level > prev + 1) {
    problems.push(`heading jump h${prev} -> h${level} at heading #${i + 1}`);
  }
  prev = level;
});

/* ── report ─────────────────────────────────────────────────── */
if (process.argv.includes("--verbose")) notes.forEach((n) => console.log(n));
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  problems.forEach((p) => console.error("  - " + p));
  process.exit(1);
}
console.log(
  `checks passed: ${new Set(local).size} local assets, ${imgs.length} images, headings h1..h${Math.max(...headingTags)}`,
);

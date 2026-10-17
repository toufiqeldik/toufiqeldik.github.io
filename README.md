# Toufiq EL-Dik — portfolio

A single-page portfolio showing three live projects: **BurgerBox**, **The Cut Barbershop** and **FlowUle**.

- **Live (GitHub Pages):** https://toufiqeldik.github.io
- Repo: https://github.com/toufiqeldik/toufiqeldik.github.io (public — free Pages needs a public repo)
- Freebuff mirror, kept as a staging/preview copy:
  - preview: https://site-c60d89c3bd8b48d28f1d94406165f267.freebuff.page
  - production: https://site-15f678bb770748eb94d4ecc7c4faffbe.freebuff.page
  - Sites project id: `acbedf7f-8433-4efc-9cb9-71853dd7f861`

## How it is built

Hand-written HTML, CSS and JavaScript — no framework, no build step.

```
public/                 what actually gets deployed (14 files, ~710 KB)
  index.html            all the copy lives here
  styles.css            design tokens at the top, then layout
  main.js               scroll reveal, hero screenshot rotation, footer year
  fonts.css + fonts/    self-hosted Inter / Inter Tight (no Google Fonts request)
  work/                 real screenshots of the three live projects
  favicon.svg  og.png   icon + social sharing card
  robots.txt  sitemap.xml
worker.js               4 lines: hands every request to the static assets
wrangler.jsonc          local workerd config (mirrors the deploy settings)
manifest.json           deploy manifest used for the Sites upload
design/og.html          source for og.png (1200x630)
scripts/                maintenance scripts, see below
```

There are no third-party runtime dependencies. Fonts and images are served from the
same origin, so the page works with no external requests except the outbound links
to GitHub and the three projects.

## Running it locally

```bash
npm install
npm run dev          # http://127.0.0.1:8788 (Cloudflare workerd, not a Node server)
```

Other scripts:

```bash
npm run check        # links resolve, images have alt + correct width/height, heading order
npm run fonts        # re-download the self-hosted font subsets
npm run og           # re-render public/og.png from design/og.html
```

## Editing the content

- **Copy:** everything is in `public/index.html`. Sections are marked with comment banners.
- **Colours and type:** the `:root` block at the top of `public/styles.css`.
- **Project screenshots:** `public/work/*-desktop.jpg` (1440x900) and `*-mobile.jpg`
  (390x844). Replace them with new captures and keep those exact dimensions, or update the
  `width`/`height` attributes in `index.html` to match — `npm run check` fails if they drift.
- **Availability line:** the contact heading ("I'm open to internships, junior roles and
  freelance work") and the two About paragraphs are written in the first person and are
  the main things you may want to reword.

### If the site address ever changes

The published URL appears in these places, so update them together:

1. `public/index.html` — `<link rel="canonical">`, `og:url`, `og:image`
2. `public/robots.txt` — the `Sitemap:` line
3. `public/sitemap.xml` — the `<loc>` value
4. `public/index.html` — the contact buttons, the About facts list and the footer links,
   wherever your email, LinkedIn or GitHub details appear

## Deploying

### GitHub Pages (the live site)

```bash
git add . && git commit -m "…"   # commit the change
npm run deploy:pages              # runs the checks, then pushes public/ to gh-pages
```

[scripts/deploy-pages.mjs](scripts/deploy-pages.mjs) copies `public/` onto the `gh-pages`
branch with `git subtree push`, and Pages serves that branch at the domain root. It refuses
to publish a dirty working tree, and runs `npm run check` first so a broken link, missing alt
text or wrong image dimension stops the deploy.

Only the contents of `public/` ever reach `gh-pages` — the tooling, design sources and worker
stay on `main` and are never served.

Only `main` is the source of truth for the code; `gh-pages` is generated, so edit `public/`
and re-run the command rather than committing to `gh-pages` by hand.

Pages runs Jekyll on that branch. None of the files carry YAML front matter, so they are
copied through byte-for-byte — verified by comparing checksums of `public/` against what the
live site serves. If you ever add a file whose name starts with `_`, add an empty `.nojekyll`
file to the published output (not to `public/`, which is uploaded to Freebuff too).

**Optional: deploy on push instead.** The gh CLI token here has no `workflow` scope, so an
Actions workflow cannot be pushed from this machine. Run `gh auth refresh -s workflow` once
and the following becomes possible — plus the same `npm run check` gate, run by GitHub:

```yaml
name: Deploy portfolio to GitHub Pages
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: "${{ steps.deployment.outputs.page_url }}" }
    steps:
      - uses: actions/checkout@v4
      - run: node scripts/check-site.mjs
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: ./public }
      - id: deployment
        uses: actions/deploy-pages@v4
```

Save it as `.github/workflows/deploy-pages.yml` and switch the Pages source to
"GitHub Actions" in the repository settings; you can then drop `npm run deploy:pages`.

### Freebuff Sites (mirror)

`manifest.json` describes that upload:

```json
{ "entrypoint": "index.js", "modules": [{ "name": "index.js", "path": "./worker.js" }],
  "assetsDirectory": "./public", "spa": false }
```

`spa` is `false` on purpose: every page here is a real file, so an unknown URL should
return a 404 rather than quietly serving the homepage.

Check locally first (`npm run check`, then `npm run dev` in a browser) and redeploy to
preview before production. This mirror is optional — GitHub Pages is the canonical address.

## Verified

- All assets return 200 with the right `content-type`; unknown pages and images return 404.
- No console errors; all nine images load; self-hosted fonts load.
- Hero rotation advances through all three projects, including with
  `prefers-reduced-motion: reduce` (it swaps without the cross-fade).
- No horizontal overflow at 1440, 1280, 1000 or 390 px wide.

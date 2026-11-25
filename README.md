# Meridian Arcade

A free browser-games site in the Meridian style: a big library with real thumbnails, search, categories, favorites and "continue playing". Every game opens in its own tab on your site, inside a game window with restart and fullscreen.

It's a static site (no server), so it can be hosted free on Netlify, GitHub Pages or Cloudflare Pages.

## Live site (GitHub Pages)

The ready-to-serve site is in `docs/`. GitHub Pages serves it from **Settings → Pages → Deploy from a branch → `main` / `/docs`**. After editing, run `npm run build && rm -rf docs && cp -r dist docs && touch docs/.nojekyll`, then commit and push.

## Or put it online with Netlify (no GitHub needed)

1. Go to **https://app.netlify.com/drop** and sign up (free).
2. Drag the **`dist`** folder from this project onto the page.
3. Netlify gives you a link like `https://something.netlify.app`. Rename it under **Site configuration → Change site name**.

To update later, open the site in Netlify → **Deploys** → drag the new `dist` folder onto the drop area.

## Where the games come from

- **GamePix** publishes a feed of about 16,000 HTML5 games that other sites are allowed to embed ([docs](https://docs.gamepix.com/docs)). The library loads it live, best-rated first, so it stays current with correct thumbnails.
- **Popular** and **Staff picks** are hand-picked from that feed in `src/config.ts` (`POPULAR`, `PICKS`). Add any game by its slug, the part after `play.gamepix.com/` or `gamepix.com/play/`.

**Your own GamePix ID (recommended):** the site uses GamePix's demo ID `1`. Sign up at https://partners.gamepix.com, then set `GAMEPIX_SID` in `src/config.ts` and rebuild. That ties the games to your site and lets you earn from their ads.

## Editing

```
npm install
npm run build      # rebuilds dist/
npm run preview    # serves dist/ locally
```

- `src/config.ts`: featured games, official-only games, category chips, GamePix ID
- `src/styles.css`: colors and themes (light "Linen", dark "Harbor", six accents)
- `src/library.tsx`: the library page; `src/play.tsx`: the game page

## How it's built

React 19, TypeScript, Tailwind CSS v4 and Lucide icons, bundled with esbuild. Favorites, recent games and theme are saved in the browser. Game pages only embed games from GamePix's own player address, so a crafted link can't load some other site inside yours, and games can't redirect your page.

`npm run test:e2e` runs an offline browser test with the feed mocked.

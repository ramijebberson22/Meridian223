/**
 * Game catalog: GamePix's public partner feed (https://docs.gamepix.com),
 * which is meant for other sites to embed games. Loaded live, sorted by
 * GamePix's quality score, cached for the browser session.
 */
import { CATEGORIES, GAMEPIX_SID, OFFICIAL_ONLY, PICKS, POPULAR } from "../config";

export interface Game {
  key: string; // "gp:<namespace>" or "x:<id>"
  title: string;
  category: string;
  thumb: string | null;
  /** Only for official-site games. */
  url?: string;
  site?: string;
  colors?: [string, string];
  width?: number;
  height?: number;
}

const FEED = "https://feeds.gamepix.com/v2/json/";
export const PAGE_SIZE = 48;
const NS_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;

export const isValidNamespace = (ns: string) => NS_RE.test(ns);
export const gamepixThumb = (ns: string) => `https://img.gamepix.com/games/${ns}/cover/${ns}.png?w=320`;
export const gamepixEmbed = (ns: string) => `https://play.gamepix.com/${ns}/embed?sid=${encodeURIComponent(GAMEPIX_SID)}`;

interface FeedItem {
  title: string;
  namespace: string;
  category: string;
  banner_image?: string;
  width?: number;
  height?: number;
}

function fromFeed(i: FeedItem): Game | null {
  if (!i || typeof i.namespace !== "string" || !isValidNamespace(i.namespace)) return null;
  return {
    key: `gp:${i.namespace}`,
    title: String(i.title || i.namespace).trim().slice(0, 80),
    category: String(i.category || "games"),
    thumb: gamepixThumb(i.namespace),
    width: Number(i.width) || undefined,
    height: Number(i.height) || undefined,
  };
}

const fromConfig = (f: { id: string; title: string; category: string }): Game => ({
  key: `gp:${f.id}`,
  title: f.title,
  category: f.category,
  thumb: gamepixThumb(f.id),
});
export const popularGames: Game[] = POPULAR.map(fromConfig);
export const pickGames: Game[] = PICKS.map(fromConfig);
/** Every hand-picked game. */
export const featuredGames: Game[] = [...popularGames, ...pickGames];

export const officialGames: Game[] = OFFICIAL_ONLY.map((o) => ({
  key: `x:${o.id}`,
  title: o.title,
  category: o.category,
  thumb: null,
  url: o.url,
  site: o.site,
  colors: o.colors,
}));

const memo = new Map<string, Promise<Game[]>>();

async function fetchPage(page: number, category?: string): Promise<Game[]> {
  const params = new URLSearchParams({ order: "quality", page: String(page), pagination: String(PAGE_SIZE), sid: GAMEPIX_SID });
  if (category) params.set("category", category);
  const url = `${FEED}?${params}`;
  const cacheKey = `arcade:feed:${url}`;
  try {
    const hit = sessionStorage.getItem(cacheKey);
    if (hit) return JSON.parse(hit) as Game[];
  } catch {
    /* storage unavailable */
  }
  if (!memo.has(url)) {
    memo.set(
      url,
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(`Feed error ${r.status}`);
          return r.json();
        })
        .then((d: { items?: FeedItem[] }) => {
          const games = (d.items ?? []).map(fromFeed).filter((g): g is Game => !!g);
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(games));
          } catch {
            /* full */
          }
          return games;
        })
        .catch((e) => {
          memo.delete(url);
          throw e;
        }),
    );
  }
  return memo.get(url)!;
}

/** Page N of a category chip (or of everything). Combined categories are merged. */
export async function loadPage(page: number, categoryId: string | null): Promise<Game[]> {
  if (!categoryId) return fetchPage(page);
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return fetchPage(page);
  const lists = await Promise.all(cat.tags.map((t) => fetchPage(page, t).catch(() => [] as Game[])));
  // Interleave so each sub-category contributes from the top of its quality ranking.
  const out: Game[] = [];
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max; i++) for (const l of lists) if (l[i]) out.push(l[i]);
  return out;
}

export function dedupe(games: Game[]): Game[] {
  const seen = new Set<string>();
  return games.filter((g) => (seen.has(g.key) ? false : (seen.add(g.key), true)));
}

/** Link to this site's player page for a game. */
export function playHref(g: Game): string {
  const p = new URLSearchParams({ g: g.key, t: g.title, c: g.category });
  if (g.width && g.height) {
    p.set("w", String(g.width));
    p.set("h", String(g.height));
  }
  return `play.html?${p}`;
}

export function prettyCategory(c: string): string {
  return c
    .split("-")
    .map((w) => (w === "io" ? ".io" : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

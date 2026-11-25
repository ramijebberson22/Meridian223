import { useCallback, useEffect, useState } from "react";
import type { Game } from "./catalog";

const P = "arcade:v1:";

function read<T>(k: string, fallback: T): T {
  try {
    const v = localStorage.getItem(P + k);
    return v == null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}
function write(k: string, v: unknown) {
  try {
    localStorage.setItem(P + k, JSON.stringify(v));
    window.dispatchEvent(new CustomEvent("arcade-store", { detail: k }));
  } catch {
    /* ignore */
  }
}

/** localStorage-backed state that stays in sync across tabs (library <-> player). */
export function useStored<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => read(key, fallback));
  useEffect(() => {
    const sync = () => setValue(read(key, fallback));
    const onStorage = (e: StorageEvent) => e.key === P + key && sync();
    const onLocal = (e: Event) => (e as CustomEvent).detail === key && sync();
    window.addEventListener("storage", onStorage);
    window.addEventListener("arcade-store", onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("arcade-store", onLocal);
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = useCallback(
    (next: T | ((v: T) => T)) => {
      const v = typeof next === "function" ? (next as (v: T) => T)(read(key, fallback)) : next;
      write(key, v);
      setValue(v);
    },
    [key], // eslint-disable-line react-hooks/exhaustive-deps
  );
  return [value, set] as const;
}

export type Mode = "light" | "dark";
export type Accent = "clay" | "sage" | "iris" | "lagoon" | "plum" | "honey";
export interface Prefs {
  mode: Mode;
  accent: Accent;
}
export const DEFAULT_PREFS: Prefs = { mode: "light", accent: "clay" };

export function usePrefs() {
  const [prefs, setPrefs] = useStored<Prefs>("prefs", DEFAULT_PREFS);
  useEffect(() => {
    document.documentElement.dataset.mode = prefs.mode;
    document.documentElement.dataset.accent = prefs.accent;
  }, [prefs]);
  return [prefs, setPrefs] as const;
}

type Slim = Pick<Game, "key" | "title" | "category" | "thumb" | "url" | "site" | "colors" | "width" | "height">;
const slim = (g: Game): Slim => ({
  key: g.key,
  title: g.title,
  category: g.category,
  thumb: g.thumb,
  url: g.url,
  site: g.site,
  colors: g.colors,
  width: g.width,
  height: g.height,
});

export function useFavorites() {
  const [favs, setFavs] = useStored<Slim[]>("favorites", []);
  const isFav = useCallback((key: string) => favs.some((f) => f.key === key), [favs]);
  const toggle = useCallback(
    (g: Game) => setFavs((list) => (list.some((f) => f.key === g.key) ? list.filter((f) => f.key !== g.key) : [slim(g), ...list].slice(0, 200))),
    [setFavs],
  );
  return { favs: favs as Game[], isFav, toggle };
}

export function useRecent() {
  const [recent, setRecent] = useStored<Slim[]>("recent", []);
  const add = useCallback((g: Game) => setRecent((list) => [slim(g), ...list.filter((r) => r.key !== g.key)].slice(0, 24)), [setRecent]);
  const clear = useCallback(() => setRecent([]), [setRecent]);
  return { recent: recent as Game[], add, clear };
}

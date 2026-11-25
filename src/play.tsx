import { createRoot } from "react-dom/client";
import { useEffect, useMemo, useRef, useState } from "react";
import { LuArrowUpRight, LuGamepad2, LuHeart, LuLayoutGrid, LuLoaderCircle, LuMaximize2, LuRotateCw, LuTriangleAlert } from "react-icons/lu";
import { OFFICIAL_ONLY } from "./config";
import { featuredGames, gamepixEmbed, gamepixThumb, isValidNamespace, officialGames, playHref, prettyCategory, type Game } from "./lib/catalog";
import { useFavorites, usePrefs, useRecent } from "./lib/store";
import { Thumb } from "./components/GameCard";
import { cx, IconButton, ThemeControls, Wordmark } from "./components/ui";

interface Resolved {
  game: Game;
  embed: string | null;
}

/** Only games we can build a trusted embed URL for are playable: no arbitrary iframes. */
function resolve(params: URLSearchParams): Resolved | null {
  const key = params.get("g") || "";
  const [src, id] = key.split(":");
  const title = (params.get("t") || id || "Game").slice(0, 80);
  const category = (params.get("c") || "games").slice(0, 40);
  const w = Number(params.get("w")) || undefined;
  const h = Number(params.get("h")) || undefined;
  if (src === "gp" && id && isValidNamespace(id)) {
    return { game: { key, title, category, thumb: gamepixThumb(id), width: w, height: h }, embed: gamepixEmbed(id) };
  }
  if (src === "x") {
    const o = officialGames.find((g) => g.key === key);
    if (o) return { game: o, embed: null };
  }
  return null;
}

function useFit(width?: number, height?: number) {
  const ratio = width && height && width > 0 && height > 0 ? width / height : 16 / 9;
  return Math.min(Math.max(ratio, 0.45), 2.4);
}

function Player() {
  usePrefs();
  const params = useMemo(() => new URLSearchParams(location.search), []);
  const resolved = useMemo(() => resolve(params), [params]);
  const { isFav, toggle } = useFavorites();
  const { add } = useRecent();
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const frameWrap = useRef<HTMLDivElement>(null);
  const ratio = useFit(resolved?.game.width, resolved?.game.height);

  useEffect(() => {
    if (!resolved) {
      document.title = "Game not found · Meridian Arcade";
      return;
    }
    document.title = `${resolved.game.title} · Meridian Arcade`;
    add(resolved.game);
  }, [resolved]); // eslint-disable-line react-hooks/exhaustive-deps

  const more = useMemo(
    () => [...featuredGames, ...officialGames].filter((g) => g.key !== resolved?.game.key).sort((a, b) => Number(b.category === resolved?.game.category) - Number(a.category === resolved?.game.category)).slice(0, 12),
    [resolved],
  );

  const fullscreen = () => frameWrap.current?.requestFullscreen?.().catch(() => {});

  return (
    <div className="chrome flex h-dvh flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 sm:gap-4 sm:px-5">
        <Wordmark small />
        <div className="mx-1 h-6 w-px bg-line max-sm:hidden" />
        {resolved && (
          <div className="flex min-w-0 items-center gap-3 max-sm:hidden">
            <div className="size-9 shrink-0 overflow-hidden rounded-lg">
              <Thumb game={resolved.game} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[15px] font-bold leading-tight">{resolved.game.title}</div>
              <div className="truncate text-[12px] text-faint">{prettyCategory(resolved.game.category)}</div>
            </div>
          </div>
        )}
        <div className="ml-auto flex items-center">
          {resolved && (
            <IconButton label={isFav(resolved.game.key) ? "Remove from favorites" : "Add to favorites"} active={isFav(resolved.game.key)} onClick={() => toggle(resolved.game)}>
              <LuHeart className={cx(isFav(resolved.game.key) && "fill-current")} />
            </IconButton>
          )}
          <ThemeControls />
          <a href="./" className="ml-1 inline-flex h-10 items-center gap-2 rounded-xl bg-surface-2 px-3.5 text-[13.5px] font-semibold text-fg transition hover:bg-surface-3">
            <LuLayoutGrid /> <span className="max-sm:hidden">All games</span>
          </a>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-5 p-3 sm:p-5">
        <main className="flex min-w-0 flex-1 flex-col items-center justify-center">
          {!resolved ? (
            <div className="anim-rise max-w-md text-center">
              <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-accent-soft text-[28px] text-accent">
                <LuTriangleAlert />
              </div>
              <h1 className="text-xl font-bold">We couldn't find that game</h1>
              <p className="mt-2 text-muted">The link may be broken or the game may have been removed.</p>
              <a href="./" className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-5 font-semibold text-accent-fg">
                Browse all games
              </a>
            </div>
          ) : !resolved.embed ? (
            <OfficialOnly game={resolved.game} />
          ) : (
            <div
              className="anim-rise flex max-h-full w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-lift"
              style={{ maxWidth: `min(100%, calc((100dvh - 9.5rem) * ${ratio}))` }}
            >
              <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line px-3">
                <span className="flex gap-1.5" aria-hidden="true">
                  <span className="size-3 rounded-full bg-[#ff6159]" />
                  <span className="size-3 rounded-full bg-[#ffbd2e]" />
                  <span className="size-3 rounded-full bg-[#28c941]" />
                </span>
                <span className="ml-2 flex min-w-0 items-center gap-1.5 text-[13px] font-semibold text-muted">
                  <LuGamepad2 className="shrink-0 text-accent" />
                  <span className="truncate">{resolved.game.title}</span>
                </span>
                <div className="ml-auto flex items-center">
                  <IconButton label="Restart game" className="size-8 text-[15px]" onClick={() => (setLoading(true), setNonce((n) => n + 1))}>
                    <LuRotateCw />
                  </IconButton>
                  <IconButton label="Fullscreen" className="size-8 text-[15px]" onClick={fullscreen}>
                    <LuMaximize2 />
                  </IconButton>
                </div>
              </div>
              <div ref={frameWrap} className="relative w-full bg-black" style={{ aspectRatio: String(ratio) }}>
                <iframe
                  key={nonce}
                  src={resolved.embed}
                  title={resolved.game.title}
                  allow="autoplay; fullscreen; gamepad; clipboard-write; accelerometer; gyroscope"
                  allowFullScreen
                  // Games may use scripts, their own storage and ad pop-ups, but can never navigate this page away.
                  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-pointer-lock allow-orientation-lock allow-forms allow-presentation"
                  onLoad={() => setLoading(false)}
                  className="absolute inset-0 size-full border-0"
                />
                {loading && (
                  <div className="anim-fade absolute inset-0 grid place-items-center bg-surface-2">
                    <div className="flex flex-col items-center gap-3 text-muted">
                      <LuLoaderCircle className="spin text-3xl text-accent" />
                      <span className="text-[13px] font-semibold">Loading {resolved.game.title}…</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        <aside className="scroll-thin hidden w-[260px] shrink-0 overflow-y-auto xl:block" aria-label="More games">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">More games</h2>
          <ul className="space-y-2">
            {more.map((g) => (
              <li key={g.key}>
                <a
                  href={g.url ?? playHref(g)}
                  target={g.url ? "_blank" : undefined}
                  rel={g.url ? "noopener noreferrer" : undefined}
                  className="group flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-surface"
                >
                  <div className="aspect-[320/197] w-24 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                    <Thumb game={g} className="text-[10px]" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-semibold group-hover:text-accent">{g.title}</div>
                    <div className="truncate text-[12px] text-faint">{g.url ? `On ${g.site}` : prettyCategory(g.category)}</div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function OfficialOnly({ game }: { game: Game }) {
  const o = OFFICIAL_ONLY.find((x) => `x:${x.id}` === game.key)!;
  return (
    <div className="anim-rise w-full max-w-md overflow-hidden rounded-[28px] border border-line bg-surface text-center shadow-pop">
      <div className="aspect-[320/170]">
        <Thumb game={game} />
      </div>
      <div className="p-7">
        <h1 className="text-2xl font-bold tracking-tight">{game.title} plays on {o.site}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">Its makers don't allow it to be embedded on other sites, so it opens on the official page.</p>
        <a href={o.url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-[15px] font-semibold text-accent-fg">
          Play {game.title} on {o.site} <LuArrowUpRight />
        </a>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Player />);

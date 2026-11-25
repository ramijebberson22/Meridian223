import { createRoot } from "react-dom/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuArrowUp, LuClock, LuHeart, LuRotateCw, LuSearch, LuSparkles, LuX } from "react-icons/lu";
import { CATEGORIES } from "./config";
import { dedupe, featuredGames, loadPage, officialGames, type Game } from "./lib/catalog";
import { useFavorites, usePrefs, useRecent } from "./lib/store";
import { CardSkeleton, GameCard } from "./components/GameCard";
import { IconButton, Logo, Pill, ThemeControls, Wordmark } from "./components/ui";

type View = "all" | "favorites" | string; // string = category id
const MAX_SEARCH_PAGES = 15;

function useCatalog(view: View) {
  const categoryId = view === "all" || view === "favorites" ? null : view;
  const [games, setGames] = useState<Game[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);
  const busy = useRef(false);
  const viewRef = useRef(view);

  useEffect(() => {
    viewRef.current = view;
    setGames([]);
    setPage(0);
    setDone(false);
    setError(false);
    busy.current = false;
  }, [view]);

  const loadMore = useCallback(async () => {
    if (busy.current || done || view === "favorites") return;
    busy.current = true;
    setLoading(true);
    setError(false);
    const next = page + 1;
    const forView = view;
    try {
      const list = await loadPage(next, categoryId);
      if (viewRef.current !== forView) return;
      setGames((g) => dedupe([...g, ...list]));
      setPage(next);
      if (list.length === 0) setDone(true);
    } catch {
      if (viewRef.current === forView) setError(true);
    } finally {
      if (viewRef.current === forView) {
        busy.current = false;
        setLoading(false);
      }
    }
  }, [page, done, view, categoryId]);

  return { games, page, loading, error, done, loadMore };
}

function Section({ title, icon, children, action }: { title: string; icon?: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-accent">{icon}</span>
        <h2 className="text-[19px] font-bold tracking-tight">{title}</h2>
        <div className="ml-auto">{action}</div>
      </div>
      {children}
    </section>
  );
}

const GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5";

function Library() {
  usePrefs();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("all");
  const { favs, isFav, toggle } = useFavorites();
  const { recent, add, clear } = useRecent();
  const cat = useCatalog(view);
  const sentinel = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const q = query.trim().toLowerCase();

  useEffect(() => {
    document.body.classList.add("page-scroll");
  }, []);

  // Infinite scroll.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => entries[0].isIntersecting && cat.loadMore(), { rootMargin: "900px" });
    io.observe(el);
    return () => io.disconnect();
  }, [cat.loadMore]);

  // Load the first page straight away (and after switching category).
  useEffect(() => {
    if (cat.page === 0 && !cat.loading && !cat.error && view !== "favorites") cat.loadMore();
  }, [cat.page, cat.loading, cat.error, view, cat.loadMore]);

  // While searching, keep pulling pages until there are enough matches.
  const pool = useMemo(() => dedupe([...officialGames, ...featuredGames, ...cat.games]), [cat.games]);
  const matches = useMemo(() => (q ? pool.filter((g) => g.title.toLowerCase().includes(q) || g.category.includes(q)) : []), [pool, q]);
  useEffect(() => {
    if (q && matches.length < 24 && cat.page < MAX_SEARCH_PAGES && !cat.loading && !cat.done && !cat.error && view !== "favorites") cat.loadMore();
  }, [q, matches.length, cat.page, cat.loading, cat.done, cat.error, view, cat.loadMore]);

  // "/" focuses search, like most game sites.
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const card = (g: Game, i: number) => <GameCard key={g.key} game={g} index={i} fav={isFav(g.key)} onFav={toggle} onOpen={add} />;
  const categoryLabel = CATEGORIES.find((c) => c.id === view)?.label;

  let main;
  if (q) {
    const list = view === "favorites" ? favs.filter((g) => g.title.toLowerCase().includes(q)) : matches;
    main = (
      <Section title={`Results for “${query.trim()}”`} icon={<LuSearch />}>
        {list.length > 0 && <div className={GRID}>{list.map(card)}</div>}
        {cat.loading && list.length === 0 && (
          <div className={GRID}>
            {Array.from({ length: 10 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}
        {!cat.loading && list.length === 0 && <p className="py-12 text-center text-muted">No games match that yet. Try a different word.</p>}
        {cat.loading && list.length > 0 && <p className="mt-6 text-center text-[13px] text-faint">Searching more games…</p>}
      </Section>
    );
  } else if (view === "favorites") {
    main = (
      <Section title="Your favorites" icon={<LuHeart />}>
        {favs.length ? <div className={GRID}>{favs.map(card)}</div> : <p className="py-12 text-center text-muted">Tap the heart on any game to save it here.</p>}
      </Section>
    );
  } else {
    main = (
      <>
        {view === "all" && recent.length > 0 && (
          <Section
            title="Continue playing"
            icon={<LuClock />}
            action={
              <button type="button" onClick={clear} className="text-[13px] font-semibold text-faint hover:text-fg">
                Clear
              </button>
            }
          >
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:gap-4">
              {recent.slice(0, 12).map((g, i) => (
                <div key={g.key} className="w-[44vw] shrink-0 sm:w-[220px]">
                  {card(g, i)}
                </div>
              ))}
            </div>
          </Section>
        )}
        {view === "all" && (
          <Section title="Featured" icon={<LuSparkles />}>
            <div className={GRID}>{[...featuredGames.slice(0, 1), ...officialGames, ...featuredGames.slice(1)].map(card)}</div>
          </Section>
        )}
        <Section title={view === "all" ? "All games" : `${categoryLabel} games`}>
          <div className={GRID}>
            {cat.games.map(card)}
            {cat.loading &&
              Array.from({ length: cat.games.length ? 5 : 15 }).map((_, i) => <CardSkeleton key={`s${i}`} />)}
          </div>
          {cat.error && (
            <div className="mt-8 flex flex-col items-center gap-3 text-center">
              <p className="text-muted">Couldn't load more games. Check your connection and try again.</p>
              <button type="button" onClick={cat.loadMore} className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg">
                <LuRotateCw /> Try again
              </button>
            </div>
          )}
          {cat.done && <p className="mt-8 text-center text-[13px] text-faint">That's every game in this category.</p>}
        </Section>
      </>
    );
  }

  return (
    <div className="min-h-dvh">
      <header className="chrome sticky top-0 z-30 border-b border-line/70 backdrop-blur-xl" style={{ background: "color-mix(in oklab, var(--bg) 82%, transparent)" }}>
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
          <div className="max-sm:hidden">
            <Wordmark small />
          </div>
          <a href="./" aria-label="Meridian Arcade home" className="sm:hidden">
            <Logo className="size-7 text-accent" />
          </a>
          <div className="relative flex-1 sm:mx-auto sm:max-w-xl">
            <LuSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search games"
              aria-label="Search games"
              className="h-11 w-full rounded-full border border-line bg-surface/90 pl-11 pr-10 text-[15px] text-fg outline-none transition placeholder:text-faint focus:border-accent/60 focus:ring-4 focus:ring-accent-soft"
            />
            {query && (
              <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-faint hover:bg-surface-2 hover:text-fg">
                <LuX />
              </button>
            )}
          </div>
          <ThemeControls />
        </div>
      </header>

      <div className="relative">
        <div className="bg-glow pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-90" style={{ maskImage: "linear-gradient(to bottom, black, transparent)" }} />
        <main className="relative mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
          <div className="anim-rise">
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-muted">Free browser games</p>
            <h1 className="mt-2 font-display text-[clamp(2.2rem,6vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
              Pick a game, <span className="text-accent">play instantly.</span>
            </h1>
            <p className="mt-3 max-w-xl text-[15px] text-muted">Thousands of games that run right in your browser. Each one opens in its own tab.</p>
          </div>

          <nav aria-label="Categories" className="no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1">
            <Pill active={view === "all"} onClick={() => setView("all")}>
              All
            </Pill>
            <Pill active={view === "favorites"} onClick={() => setView("favorites")}>
              <LuHeart /> Favorites{favs.length ? ` · ${favs.length}` : ""}
            </Pill>
            {CATEGORIES.map((c) => (
              <Pill key={c.id} active={view === c.id} onClick={() => setView(c.id)}>
                {c.label}
              </Pill>
            ))}
          </nav>

          {main}
          <div ref={sentinel} aria-hidden="true" className="h-px" />
        </main>
        <footer className="border-t border-line py-8 text-center text-[12.5px] text-faint">
          Games are provided by their publishers through{" "}
          <a className="underline hover:text-fg" href="https://www.gamepix.com" target="_blank" rel="noopener noreferrer">
            GamePix
          </a>
          . Some favorites open on their official sites.
        </footer>
      </div>
      <BackToTop />
    </div>
  );
}

function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const fn = () => setShow(window.scrollY > 1200);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  if (!show) return null;
  return (
    <div className="anim-pop fixed bottom-5 right-5 z-30 rounded-2xl border border-line bg-surface shadow-pop">
      <IconButton label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        <LuArrowUp />
      </IconButton>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Library />);

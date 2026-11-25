import { useState } from "react";
import { LuArrowUpRight, LuHeart } from "react-icons/lu";
import { playHref, prettyCategory, type Game } from "../lib/catalog";
import { cx } from "./ui";

const FALLBACK: Array<[string, string]> = [
  ["#c4552f", "#f2a65a"],
  ["#13808f", "#7dd3c0"],
  ["#5b5bd6", "#a5b4fc"],
  ["#a1417a", "#f0a3c8"],
  ["#4d7c5b", "#b5d99c"],
  ["#b17812", "#f6d365"],
];

export function Thumb({ game, className }: { game: Game; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (game.thumb && !failed) {
    return (
      <img
        src={game.thumb}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={cx("size-full object-cover", className)}
      />
    );
  }
  const [a, b] = game.colors ?? FALLBACK[game.title.length % FALLBACK.length];
  return (
    <div className={cx("relative grid size-full place-items-center overflow-hidden", className)} style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
      <div className="absolute -right-6 -top-6 size-24 rounded-full bg-white/15" />
      <div className="absolute -bottom-8 -left-4 size-28 rounded-full bg-black/10" />
      <span className="relative px-3 text-center font-display text-[22px] font-semibold leading-tight text-white drop-shadow-sm">{game.title}</span>
    </div>
  );
}

export function GameCard({
  game,
  index = 0,
  fav,
  onFav,
  onOpen,
}: {
  game: Game;
  index?: number;
  fav: boolean;
  onFav: (g: Game) => void;
  onOpen: (g: Game) => void;
}) {
  const external = !!game.url;
  return (
    <div className="anim-rise group relative" style={{ animationDelay: `${Math.min(index, 24) * 22}ms` }}>
      <a
        href={external ? game.url : playHref(game)}
        target="_blank"
        rel={external ? "noopener noreferrer" : "noopener"}
        onClick={() => onOpen(game)}
        title={external ? `${game.title} — plays on ${game.site}` : game.title}
        className="block overflow-hidden rounded-[20px] border border-line/80 bg-surface shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-line-strong hover:shadow-lift active:translate-y-0 active:scale-[0.98]"
      >
        <div className="relative aspect-[320/197] overflow-hidden bg-surface-2">
          <Thumb game={game} className="transition-transform duration-300 group-hover:scale-[1.04]" />
          <div className="thumb-shine pointer-events-none absolute inset-0" />
          {external && (
            <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
              {game.site} <LuArrowUpRight />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 px-3.5 py-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-semibold text-fg">{game.title}</div>
            <div className="truncate text-[12px] text-faint">{prettyCategory(game.category)}</div>
          </div>
        </div>
      </a>
      <button
        type="button"
        aria-label={fav ? `Remove ${game.title} from favorites` : `Add ${game.title} to favorites`}
        aria-pressed={fav}
        onClick={() => onFav(game)}
        className={cx(
          "absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-full backdrop-blur transition-all",
          fav ? "bg-accent text-accent-fg" : "bg-black/45 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 max-sm:opacity-100",
        )}
      >
        <LuHeart className={cx("text-[15px]", fav && "fill-current")} />
      </button>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[20px] border border-line/60 bg-surface">
      <div className="skeleton aspect-[320/197]" />
      <div className="space-y-2 px-3.5 py-3">
        <div className="skeleton h-3.5 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
      </div>
    </div>
  );
}

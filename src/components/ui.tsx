import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { LuCheck, LuMoon, LuPalette, LuSun } from "react-icons/lu";
import { usePrefs, type Accent } from "../lib/store";

export function cx(...c: Array<string | false | null | undefined>): string {
  return c.filter(Boolean).join(" ");
}

export function IconButton({ label, className, children, active, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-[18px] text-muted transition-all duration-150",
        "hover:bg-surface-2 hover:text-fg active:scale-95 disabled:pointer-events-none disabled:opacity-35",
        active && "text-accent hover:text-accent",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <ellipse cx="16" cy="16" rx="4.6" ry="11" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M5 16h22" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  );
}

export function Wordmark({ small }: { small?: boolean }) {
  return (
    <a href="./" className="flex items-center gap-2 text-fg" aria-label="Meridian Arcade home">
      <Logo className={cx("text-accent", small ? "size-6" : "size-7")} />
      <span className={cx("font-display font-semibold tracking-[-0.02em]", small ? "text-[21px]" : "text-2xl")}>meridian</span>
      <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-accent">arcade</span>
    </a>
  );
}

const ACCENTS: Array<{ id: Accent; swatch: string; name: string }> = [
  { id: "clay", swatch: "#c4552f", name: "Clay" },
  { id: "sage", swatch: "#4d7c5b", name: "Sage" },
  { id: "iris", swatch: "#5b5bd6", name: "Iris" },
  { id: "lagoon", swatch: "#13808f", name: "Lagoon" },
  { id: "plum", swatch: "#a1417a", name: "Plum" },
  { id: "honey", swatch: "#b17812", name: "Honey" },
];

export function ThemeControls() {
  const [prefs, setPrefs] = usePrefs();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div className="flex items-center" ref={ref}>
      <IconButton label={prefs.mode === "dark" ? "Switch to light mode" : "Switch to dark mode"} onClick={() => setPrefs({ ...prefs, mode: prefs.mode === "dark" ? "light" : "dark" })}>
        {prefs.mode === "dark" ? <LuSun /> : <LuMoon />}
      </IconButton>
      <div className="relative">
        <IconButton label="Accent color" active={open} onClick={() => setOpen((o) => !o)}>
          <LuPalette />
        </IconButton>
        {open && (
          <div className="anim-pop absolute right-0 top-12 z-50 grid w-60 grid-cols-3 gap-2 rounded-2xl border border-line bg-surface p-3 shadow-pop">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                aria-label={`${a.name} accent`}
                aria-pressed={prefs.accent === a.id}
                onClick={() => setPrefs({ ...prefs, accent: a.id })}
                className="flex flex-col items-center gap-1 rounded-xl p-2 text-[11.5px] font-semibold text-muted hover:bg-surface-2"
              >
                <span className="grid size-8 place-items-center rounded-full text-white" style={{ background: a.swatch }}>
                  {prefs.accent === a.id && <LuCheck />}
                </span>
                {a.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Pill({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[13px] font-semibold transition-all",
        active ? "border-fg bg-fg text-bg" : "border-line bg-surface/80 text-muted backdrop-blur-md hover:border-line-strong hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

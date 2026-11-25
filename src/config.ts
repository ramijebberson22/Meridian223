/**
 * Site configuration. Everything you're likely to customise lives here.
 */

export const SITE_NAME = "Meridian Arcade";

/**
 * GamePix partner site ID. "1" is GamePix's public demo ID and works out of the
 * box. Register at https://partners.gamepix.com to get your own ID (and a share
 * of ad revenue), then put it here.
 */
export const GAMEPIX_SID = "1";

/** Games shown in the "Featured" row, by GamePix namespace (the slug in play.gamepix.com/<slug>/). */
export const FEATURED: Array<{ id: string; title: string; category: string }> = [
  { id: "gunspin", title: "GunSpin", category: "shooter" },
  { id: "moto-x3m-spooky-land", title: "Moto X3M: Spooky Land", category: "racing" },
  { id: "slope-racing-3d", title: "Slope Racing 3D", category: "ball" },
  { id: "basketball-stars", title: "Basketball Stars", category: "sports" },
  { id: "worms-zone", title: "Worms Zone", category: "snake" },
  { id: "funny-shooter-2", title: "Funny Shooter 2", category: "shooter" },
  { id: "drift-race-in-the-open-world", title: "Drift Race in the Open World", category: "racing" },
  { id: "golf-orbit", title: "Golf Orbit", category: "golf" },
  { id: "stickman-warriors-1", title: "Stickman Warriors", category: "fighting" },
  { id: "football-heads", title: "Football Heads", category: "sports" },
  { id: "car-crash-test", title: "Car Crash Test", category: "arcade" },
  { id: "hoops-the-game", title: "HOOPS the Game", category: "basketball" },
  { id: "ragdoll-mega-dunk", title: "Ragdoll Mega Dunk", category: "sports" },
  { id: "war-of-tanks-3d", title: "War of Tanks 3D", category: "tanks" },
  { id: "ninja-parkour-multiplayer", title: "Ninja Parkour Multiplayer", category: "parkour" },
  { id: "motocross-racing", title: "Motocross Racing", category: "racing" },
  { id: "geometry-gunner", title: "Geometry Gunner", category: "arcade" },
  { id: "penalty-shooters", title: "Penalty Shooters", category: "sports" },
  { id: "boxing-stars", title: "Boxing Stars", category: "sports" },
  { id: "endless-car-chase", title: "Endless Car Chase", category: "racing" },
  { id: "fractal-combat-x", title: "Fractal Combat X", category: "shooter" },
  { id: "warfare-1942-online-shooter", title: "Warfare 1942 - Online Shooter", category: "shooter" },
  { id: "superbike-hero", title: "Superbike Hero", category: "racing" },
  { id: "2048", title: "2048", category: "puzzle" },
];

/**
 * Popular games whose owners don't allow embedding on other sites.
 * Their tiles open the official site in a new tab instead.
 */
export const OFFICIAL_ONLY: Array<{ id: string; title: string; url: string; site: string; category: string; colors: [string, string] }> = [
  { id: "retro-bowl", title: "Retro Bowl", url: "https://poki.com/en/g/retro-bowl", site: "Poki", category: "sports", colors: ["#1d4ed8", "#f59e0b"] },
  { id: "polytrack", title: "PolyTrack", url: "https://kodub.itch.io/polytrack", site: "itch.io", category: "racing", colors: ["#0f766e", "#a3e635"] },
];

/** Category chips: label -> GamePix category namespaces it combines. */
export const CATEGORIES: Array<{ id: string; label: string; tags: string[] }> = [
  { id: "racing", label: "Racing", tags: ["racing", "car", "driving", "bike", "dirt-bike"] },
  { id: "action", label: "Action", tags: ["action", "fighting", "battle", "stickman"] },
  { id: "shooter", label: "Shooter", tags: ["shooter", "first-person-shooter", "sniper", "tanks"] },
  { id: "sports", label: "Sports", tags: ["sports", "soccer", "basketball", "golf"] },
  { id: "arcade", label: "Arcade", tags: ["arcade", "retro", "platformer", "skill"] },
  { id: "puzzle", label: "Puzzle", tags: ["puzzle", "brain", "2048", "block", "tetris"] },
  { id: "two-player", label: "2 Player", tags: ["two-player"] },
  { id: "io", label: ".io", tags: ["io", "snake"] },
  { id: "strategy", label: "Strategy", tags: ["strategy", "tower-defense"] },
  { id: "parkour", label: "Parkour", tags: ["parkour", "runner", "jumping"] },
  { id: "casual", label: "Casual", tags: ["casual", "hyper-casual", "clicker", "idle"] },
];

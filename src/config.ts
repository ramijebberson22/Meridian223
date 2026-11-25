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

/**
 * Well-known games shown in the "Popular" section, by GamePix namespace (the
 * slug in play.gamepix.com/<slug>/embed). Only use games that are in the live
 * GamePix feed: games GamePix has pulled (like GunSpin) load an "access denied" page.
 */
export const POPULAR: Array<{ id: string; title: string; category: string }> = [
  { id: "moto-x3m-spooky-land", title: "Moto X3M: Spooky Land", category: "racing" },
  { id: "basketball-stars", title: "Basketball Stars", category: "sports" },
  { id: "fireboy-and-watergirl-online", title: "Fireboy and Watergirl Online", category: "two-player" },
  { id: "slope-racing-3d", title: "Slope Racing 3D", category: "ball" },
  { id: "worms-zone", title: "Worms Zone", category: "snake" },
  { id: "football-heads", title: "Football Heads", category: "sports" },
  { id: "subway-princess-run-1", title: "Subway Princess Run", category: "runner" },
  { id: "ninja-parkour-multiplayer", title: "Ninja Parkour Multiplayer", category: "parkour" },
  { id: "master-chess-multiplayer", title: "Master Chess Multiplayer", category: "chess" },
  { id: "penalty-shooters", title: "Penalty Shooters", category: "sports" },
  { id: "2048", title: "2048", category: "puzzle" },
  { id: "snake", title: "Snake", category: "retro" },
];

/** More hand-picked games, shown under "Staff picks". */
export const PICKS: Array<{ id: string; title: string; category: string }> = [
  { id: "funny-shooter-2", title: "Funny Shooter 2", category: "shooter" },
  { id: "drift-race-in-the-open-world", title: "Drift Race in the Open World", category: "racing" },
  { id: "golf-orbit", title: "Golf Orbit", category: "golf" },
  { id: "stickman-warriors-1", title: "Stickman Warriors", category: "fighting" },
  { id: "car-crash-test", title: "Car Crash Test", category: "arcade" },
  { id: "hoops-the-game", title: "HOOPS the Game", category: "basketball" },
  { id: "ragdoll-mega-dunk", title: "Ragdoll Mega Dunk", category: "sports" },
  { id: "war-of-tanks-3d", title: "War of Tanks 3D", category: "tanks" },
  { id: "motocross-racing", title: "Motocross Racing", category: "racing" },
  { id: "geometry-gunner", title: "Geometry Gunner", category: "arcade" },
  { id: "boxing-stars", title: "Boxing Stars", category: "sports" },
  { id: "endless-car-chase", title: "Endless Car Chase", category: "racing" },
  { id: "fractal-combat-x", title: "Fractal Combat X", category: "shooter" },
  { id: "warfare-1942-online-shooter", title: "Warfare 1942 - Online Shooter", category: "shooter" },
  { id: "superbike-hero", title: "Superbike Hero", category: "racing" },
  { id: "retro-speed", title: "Retro Speed", category: "racing" },
  { id: "extreme-drift-racing", title: "Extreme Drift Racing", category: "racing" },
  { id: "brick-breaker-retro", title: "Brick Breaker Retro", category: "arcade" },
  { id: "train-drift", title: "Train Drift", category: "racing" },
  { id: "basket-champs", title: "Basket Champs", category: "sports" },
];

/**
 * Games that can't be embedded and would open another site. Left empty on
 * purpose: everything on this site plays embedded.
 */
export const OFFICIAL_ONLY: Array<{ id: string; title: string; url: string; site: string; category: string; colors: [string, string] }> = [];

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

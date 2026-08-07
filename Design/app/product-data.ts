export type Player = {
  rank: number;
  name: string;
  handle: string;
  initials: string;
  xp: number;
  movement: "up" | "down" | "same" | "new";
  places: number;
  streak: number;
  reward: string;
  tone: string;
  online?: boolean;
};

export const players: Player[] = [
  { rank: 1, name: "Ace Rowe", handle: "@aceonair", initials: "AR", xp: 96840, movement: "up", places: 1, streak: 28, reward: "$5,000", tone: "orange", online: true },
  { rank: 2, name: "Nova Vale", handle: "@novaspins", initials: "NV", xp: 84260, movement: "up", places: 2, streak: 21, reward: "$2,500", tone: "violet", online: true },
  { rank: 3, name: "Milo Knox", handle: "@knoxlive", initials: "MK", xp: 78950, movement: "same", places: 0, streak: 19, reward: "$1,500", tone: "cream", online: true },
  { rank: 4, name: "Zia Quinn", handle: "@ziaafterdark", initials: "ZQ", xp: 71480, movement: "up", places: 3, streak: 12, reward: "$1,000", tone: "coral", online: true },
  { rank: 5, name: "Dax Mercer", handle: "@daxplays", initials: "DM", xp: 68120, movement: "down", places: 1, streak: 8, reward: "$750", tone: "blue" },
  { rank: 6, name: "Luna Bloom", handle: "@lunabloom", initials: "LB", xp: 63750, movement: "new", places: 0, streak: 5, reward: "$600", tone: "pink", online: true },
  { rank: 7, name: "Kai North", handle: "@kainorth", initials: "KN", xp: 58930, movement: "up", places: 4, streak: 17, reward: "$450", tone: "green", online: true },
  { rank: 8, name: "Rhea Stone", handle: "@rheastone", initials: "RS", xp: 55480, movement: "same", places: 0, streak: 4, reward: "$300", tone: "violet" },
  { rank: 9, name: "Jett Rio", handle: "@jettrio", initials: "JR", xp: 52160, movement: "up", places: 2, streak: 9, reward: "$250", tone: "orange", online: true },
  { rank: 10, name: "Fable Fox", handle: "@fablefox", initials: "FF", xp: 49840, movement: "down", places: 3, streak: 6, reward: "$200", tone: "cream" },
  { rank: 11, name: "Pixel Ray", handle: "@pixelray", initials: "PR", xp: 46390, movement: "same", places: 0, streak: 3, reward: "$150", tone: "blue" },
  { rank: 12, name: "Nyx Wilder", handle: "@nyxwilder", initials: "NW", xp: 44120, movement: "new", places: 0, streak: 2, reward: "$100", tone: "pink", online: true },
  { rank: 13, name: "Echo Lane", handle: "@echolane", initials: "EL", xp: 42390, movement: "up", places: 1, streak: 11, reward: "$75", tone: "green" },
  { rank: 14, name: "PlayerOne", handle: "@playerone", initials: "P1", xp: 38210, movement: "up", places: 2, streak: 7, reward: "$50", tone: "coral", online: true },
  { rank: 15, name: "Rune Hart", handle: "@runehart", initials: "RH", xp: 37140, movement: "down", places: 1, streak: 5, reward: "—", tone: "violet" },
  { rank: 16, name: "Iris Zero", handle: "@iriszero", initials: "IZ", xp: 34860, movement: "same", places: 0, streak: 4, reward: "—", tone: "blue" },
  { rank: 17, name: "Dex Wilde", handle: "@dexwilde", initials: "DW", xp: 32920, movement: "up", places: 5, streak: 3, reward: "—", tone: "orange", online: true },
  { rank: 18, name: "Sora Flux", handle: "@soraflux", initials: "SF", xp: 30740, movement: "new", places: 0, streak: 1, reward: "—", tone: "pink" },
];

export type Reward = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  status: "available" | "featured" | "sold-out" | "redeemed";
  symbol: string;
  tone: string;
};

export const rewards: Reward[] = [
  { id: "cash-50", name: "$50 CASH TIP", category: "Cash", description: "A direct creator tip delivered after verification.", price: 8500, stock: 12, status: "featured", symbol: "$", tone: "violet" },
  { id: "vip-role", name: "VIP DISCORD ROLE", category: "Access", description: "Thirty days of VIP community access and private drops.", price: 4200, stock: 999, status: "available", symbol: "V", tone: "orange" },
  { id: "drop-kit", name: "RIVL DROP KIT", category: "Merch", description: "Limited Season 08 hoodie, cap and holographic player card.", price: 12000, stock: 7, status: "available", symbol: "R", tone: "navy" },
  { id: "boost", name: "MYSTERY BOOST", category: "Boosts", description: "Reveal a 1.2×, 1.5× or 2× watch XP multiplier.", price: 6800, stock: 24, status: "available", symbol: "×2", tone: "lavender" },
  { id: "gift-card", name: "$25 GIFT CARD", category: "Gift Cards", description: "Choose from the available digital gift-card partners.", price: 6000, stock: 0, status: "sold-out", symbol: "25", tone: "coral" },
  { id: "gold-ticket", name: "GOLDEN DROP TICKET", category: "Exclusive", description: "Entry into the next invite-only community giveaway.", price: 45000, stock: 3, status: "available", symbol: "01", tone: "gold" },
];

export type PredictionEvent = {
  id: string;
  sport: string;
  title: string;
  subtitle: string;
  status: "OPEN" | "LIVE" | "UPCOMING" | "SETTLED" | "CLOSED";
  deadline: string;
  entrants: number;
  pool: string;
  options: Array<{ name: string; meta: string; multiplier: string }>;
  tone: string;
};

export const events: PredictionEvent[] = [
  { id: "ufc-338", sport: "UFC", title: "SATO vs REYES", subtitle: "Main event · Five rounds", status: "OPEN", deadline: "02H 18M", entrants: 2481, pool: "842K PTS", tone: "orange", options: [{ name: "Kenji Sato", meta: "19–2 · Featherweight", multiplier: "1.72×" }, { name: "Mateo Reyes", meta: "17–3 · Featherweight", multiplier: "2.15×" }] },
  { id: "cs-major", sport: "CS2", title: "NOVA vs VERTEX", subtitle: "Aurora Major · Semi-final", status: "LIVE", deadline: "MAP 2 / 3", entrants: 3904, pool: "1.2M PTS", tone: "violet", options: [{ name: "NOVA", meta: "World rank #2", multiplier: "1.44×" }, { name: "VERTEX", meta: "World rank #6", multiplier: "2.62×" }] },
  { id: "boxing-night", sport: "BOXING", title: "CROSS vs VALE", subtitle: "Cruiserweight · Title fight", status: "UPCOMING", deadline: "1D 06H", entrants: 1108, pool: "462K PTS", tone: "cream", options: [{ name: "Aiden Cross", meta: "21–0 · Champion", multiplier: "1.55×" }, { name: "Roman Vale", meta: "24–2 · Challenger", multiplier: "2.38×" }] },
  { id: "stream-challenge", sport: "STREAM", title: "THE 100× HUNT", subtitle: "Community challenge", status: "OPEN", deadline: "05H 42M", entrants: 1772, pool: "BONUS DROP", tone: "pink", options: [{ name: "HITS 100×", meta: "Before stream end", multiplier: "1.92×" }, { name: "NO 100×", meta: "Challenge survives", multiplier: "1.82×" }] },
];

export const predictionHistory = [
  { event: "NOVA vs KINETIC", selection: "NOVA", amount: "2,000 PTS", result: "+3,160 PTS", date: "07 Aug", status: "WON" },
  { event: "RIVL Bonus Hunt", selection: "Over 74×", amount: "1,200 PTS", result: "Pending", date: "07 Aug", status: "PENDING" },
  { event: "VALORANT Masters", selection: "Solstice", amount: "850 PTS", result: "−850 PTS", date: "04 Aug", status: "LOST" },
  { event: "Fight Night 88", selection: "No contest", amount: "600 PTS", result: "+600 PTS", date: "01 Aug", status: "CANCELLED" },
];

export const redemptions = [
  { reward: "$50 Cash Tip", cost: "8,500 XP", date: "06 Aug 2026", status: "PROCESSING", reference: "RWD-4108" },
  { reward: "VIP Discord Role", cost: "4,200 XP", date: "19 Jul 2026", status: "COMPLETED", reference: "RWD-3872" },
  { reward: "Mystery Boost", cost: "6,800 XP", date: "02 Jul 2026", status: "COMPLETED", reference: "RWD-3521" },
  { reward: "$25 Gift Card", cost: "6,000 XP", date: "18 Jun 2026", status: "CANCELLED", reference: "RWD-3309" },
];

export const notifications = [
  { title: "You climbed to #14", body: "Two places up after tonight’s watch session.", time: "2m", kind: "rank", unread: true },
  { title: "High Roller unlocked", body: "An Epic achievement was added to your profile.", time: "18m", kind: "badge", unread: true },
  { title: "Prediction settled", body: "NOVA won. 3,160 points were added.", time: "1h", kind: "event", unread: true },
  { title: "Redemption processing", body: "Your $50 Cash Tip is being verified.", time: "3h", kind: "reward", unread: false },
  { title: "Leaderboard ending soon", body: "The weekly board closes in 4 days.", time: "1d", kind: "clock", unread: false },
];

export const profileAchievements = [
  { name: "NIGHT SHIFT", rarity: "RARE", progress: 100, earned: "02 Aug 2026", symbol: "NS", unlocked: true },
  { name: "HIGH ROLLER", rarity: "EPIC", progress: 100, earned: "07 Aug 2026", symbol: "HR", unlocked: true },
  { name: "HOT STREAK", rarity: "LEGENDARY", progress: 72, earned: "17 / 24 DAYS", symbol: "17", unlocked: false },
  { name: "FRONT ROW", rarity: "RARE", progress: 48, earned: "48 / 100 HOURS", symbol: "01", unlocked: false },
  { name: "PREDICTOR", rarity: "COMMON", progress: 88, earned: "22 / 25 WINS", symbol: "PX", unlocked: false },
  { name: "THE CLIMB", rarity: "EPIC", progress: 61, earned: "39 / 64 PLACES", symbol: "UP", unlocked: false },
];

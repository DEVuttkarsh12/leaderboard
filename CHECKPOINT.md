# 🏁 RankBoard Project Checkpoint

**Timestamp**: 2026-08-22 22:54:00 (IST)  
**Location**: `/home/uttkarsh/Documents/leaderboard/leaderboard-app`  
**Git Branch**: `main`

---

## 📌 1. Verified & Completed Systems

### A. Core Database & Data Models (`prisma/schema.prisma`)
* **`User`**: Account identity, Email/Discord/Kick auth tokens, spendable `points`, lifetime `xp`, roles (`PLAYER`, `ADMIN`), timeouts, and bans.
* **`PointTransaction`**: Immutable audit ledger tracking all balance deltas (`userId`, `amount`, `reason`, `meta`, `createdAt`).
* **`CasinoAccount`**: Linked casino platform usernames (`shuffle`, `thrill`, `packdraw`).
* **`StoreItem` & `StorePurchase`**: Reward catalog items with real-time stock control and order statuses (`PENDING`, `COMPLETED`, `REJECTED`).
* **`BetMarket` & `UserBet`**: Prediction markets with custom decimal odds, slip placement, and settlement tracking (`OPEN`, `WON`, `LOST`, `REFUNDED`).
* **`ChallengeMission` & `ChallengeProgress`**: DB-backed mission definitions, per-user charged progress, claim state, and cadence metadata.
* **Migrations Synced**:
  * `20260820172806_add_store_tables`
  * `20260822060832_add_point_transactions`
  * `20260823110000_add_challenge_missions`

---

### B. Server Architecture & API Endpoints
* **Points Engine** (`src/lib/server/points/service.ts`):
  * `earnPoints(userId, amount, reason, meta)`
  * `spendPoints(userId, amount, reason, meta)`
  * `syncPoints(userId, newPoints, reason, meta)`
  * `adminSetPoints(userId, newPoints, adminId)`
  * `getUserTransactions(userId, take)`
* **Points Endpoints**:
  * `GET /api/points` — returns balance & ledger history
  * `POST /api/points/sync` — manual trigger for casino wager sync
* **Live Leaderboard Sync** (`src/lib/server/points/leaderboard-sync.ts`):
  * Matches casino handles against upstream Shuffle affiliate API.
  * Hooked into `GET /api/leaderboard` to auto-sync points in the background.
* **Custom Bets Engine** (`src/lib/server/bets/service.ts`):
  * `GET /api/bets/markets` — live prediction markets
  * `POST /api/bets/place` — places user bet, deducts points immediately
  * `GET /api/bets/my-bets` — fetches open and settled user slips
  * `POST /api/admin/bets/markets` — admin market creation
  * `POST /api/admin/bets/settle` — calculates odds and distributes payouts automatically
  * `POST /api/admin/bets/cancel` — refunds wagers on cancelled events
* **Reward Store Engine** (`src/lib/server/store/service.ts`):
  * `GET /api/store/items` — store catalog with auto-seed fallback
  * `POST /api/store/redeem` — atomic checkout deducting points and decrementing stock
  * `GET /api/store/purchases` — player purchase history
* **Challenges & Missions Engine** (`src/lib/server/challenges/service.ts`):
  * `GET /api/challenges` — lists active seeded missions with signed-in user progress
  * `POST /api/challenges/progress` — increments authenticated mission progress server-side
  * `POST /api/challenges/claim` — atomically marks a mission claimed and credits points + XP through the audit ledger
* **Admin Management**:
  * `GET /api/admin/users` & `PATCH /api/admin/users/[id]` — user search and state controls
  * `POST /api/admin/users/[id]/points` — manual point adjustment
  * CLI scripts: `npm run admin:list`, `npm run admin:promote`, `npm run admin:demote`

---

### C. Frontend Workspaces & UI (`feature-workspace.tsx` & `rankboard-app.tsx`)
* **Leaderboard Page (`/leaderboard`)**: Live standings from Shuffle API with snapshot caching.
* **Profile Page (`/profile`)**: Live point counters, casino username linking form, and full point transaction history.
* **Custom Bets Page (`/custom-bets`)**: Odds cards, wager input, slip generator, and "My Active Bets" tracker.
* **Reward Store (`/store`)**: Interactive reward cards with real-time redemption flow and purchase orders log.
* **Challenges (`/challenges`)**: Mission cards now load DB progress and claim rewards through server APIs instead of `localStorage`.
* **Admin Dashboard (`/admin`)**: User manager, bet settlement card with highlighted `SETTLE: YES` / `SETTLE: NO` buttons, and store item creator.

### D. Casino Verification & Anti-Theft Security Layer (`src/lib/server/casino/verification.ts`)
* **Anti-Spoofing & Impersonation Prevention**:
  * Added unique constraint on `CasinoAccount(provider, username)` in DB to prevent multiple users claiming the same casino handle.
  * `syncLeaderboardPoints()` strictly filters `where: { isVerified: true }` so unverified handles never receive wager points.
* **Multi-Method Verification Engine**:
  * **Kick OAuth Auto-Match**: Instant verification if the user is authenticated with Kick and handle matches identically.
  * **Verified Email Match**: Instant verification if the casino account email matches the player's authenticated email.
  * **Shuffle Leaderboard Affiliate Cross-Check**: Confirms player exists on upstream affiliate snapshot before linking.
  * **Challenge Security Code**: Generates secure `RANK-XXXX` verification codes for manual / bio verification.
* **Dedicated Endpoints**:
  * `POST /api/casino/link` — validate existence, check anti-theft, link & auto-verify
  * `POST /api/casino/verify` — submit challenge code or trigger auto-verify re-check
  * `POST /api/casino/unlink` — disconnect casino account
  * `GET /api/casino/validate` — real-time player check
* **Interactive Frontend UI**:
  * `/profile` includes real-time `CasinoCard` components for Shuffle, Thrill, and Packdraw with 1-click Kick auto-link, email linking, and code verification forms.

---

## 🧪 2. Test Verification Log
* **Account**: `@devuttkarsh12` (Role: `ADMIN`, Kick login).
* **Casino Sync**: Linked & verified on Shuffle -> successfully credited **89,773 PTS**.
* **Store Purchase**: Redeemed `Cash Tip` (-12,000 PTS) -> balance updated to **77,773 PTS**, order marked `PENDING`.
* **Custom Bet**: Wagered 1,000 PTS on `MAX WIN TODAY?` (2.40x) -> balance updated to **76,773 PTS**, slip created with status `OPEN`.
* **Admin Settlement**: Settled `YES` as winner -> automatically paid **+2,400 PTS**, balance updated to **79,173 PTS**, slip updated to `WON`.
* **Security & Impersonation Tests**: Verified duplicate claims are blocked by DB constraint, Kick auto-match verifies instantly, challenge codes verify correctly, and unverified users receive 0 sync points.

---

## 🗺️ 3. Roadmap: What is Left to Build

1. **Watch-Points Engine (`/watch-points`)**:
   - Integrate Kick stream heartbeat / Kick bot listener to award points for live watch-time.
2. **Wager Raffles (`/wager-raffles`)**:
   - Move raffle tickets to PostgreSQL and build the random winner wheel draw tool.
3. **Bonus Hunts Tracker (`/bonus-hunts`)**:
   - Build bonus hunt round session database models and live payout multiplier stats.
4. **Support Tickets (`/support`)**:
   - Database ticket submissions and admin support inbox.
5. **Production Deployment**:
   - Deploy to Vercel/Railway with Supabase pooling & production OAuth callback domains.

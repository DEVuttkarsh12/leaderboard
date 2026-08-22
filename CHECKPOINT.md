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
* **Migrations Synced**:
  * `20260820172806_add_store_tables`
  * `20260822060832_add_point_transactions`

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
* **Admin Dashboard (`/admin`)**: User manager, bet settlement card with highlighted `SETTLE: YES` / `SETTLE: NO` buttons, and store item creator.

---

## 🧪 2. Test Verification Log
* **Account**: `@devuttkarsh12` (Role: `ADMIN`, Kick login).
* **Casino Sync**: Linked to `degenminc` on Shuffle -> successfully credited **89,773 PTS**.
* **Store Purchase**: Redeemed `Cash Tip` (-12,000 PTS) -> balance updated to **77,773 PTS**, order marked `PENDING`.
* **Custom Bet**: Wagered 1,000 PTS on `MAX WIN TODAY?` (2.40x) -> balance updated to **76,773 PTS**, slip created with status `OPEN`.
* **Admin Settlement**: Settled `YES` as winner -> automatically paid **+2,400 PTS**, balance updated to **79,173 PTS**, slip updated to `WON`.

---

## 🗺️ 3. Roadmap: What is Left to Build

1. **Production Casino Account Verification**:
   - Add Kick / Discord bot verification command (`!link <code/username>`) so players verify ownership before linking casino handles.
2. **Challenges & Missions Backend (`/challenges`)**:
   - Move from `localStorage` to Prisma DB for Daily/Weekly mission goals, charged progress, and XP claiming.
3. **Watch-Points Engine (`/watch-points`)**:
   - Integrate Kick stream heartbeat / Kick bot listener to award points for live watch-time.
4. **Wager Raffles (`/wager-raffles`)**:
   - Move raffle tickets to PostgreSQL and build the random winner wheel draw tool.
5. **Bonus Hunts Tracker (`/bonus-hunts`)**:
   - Build bonus hunt round session database models and live payout multiplier stats.
6. **Support Tickets (`/support`)**:
   - Database ticket submissions and admin support inbox.
7. **Production Deployment**:
   - Deploy to Vercel/Railway with Supabase pooling & production OAuth callback domains.

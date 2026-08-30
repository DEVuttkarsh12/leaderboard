# RankBoard Deployment Checklist

## Current Status

- The app runs locally and the homepage/API smoke checks return `200 OK`.
- Core product systems are implemented: leaderboard, auth, casino linking, points, store, bets, challenges, watch points, wager raffles, bonus hunts, tournaments, support tickets, and admin controls.
- Main remaining work is production configuration, redeploy, and live OAuth/webhook QA.

## What You Need To Provide

- A final production domain, for example a Vercel domain or custom domain.
- Supabase production database values:
  - `DATABASE_URL`: pooled transaction connection URL, usually Supabase pooler port `6543`.
  - `DIRECT_URL`: direct database URL, usually port `5432`.
- Leaderboard/Shuffle values:
  - `LEADERBOARD_API_KEY`
  - `SHUFFLE_AFFILIATE_URL`
  - Season start/end Unix timestamps if the live leaderboard should use a custom window.
- Discord developer app values:
  - `DISCORD_CLIENT_ID`
  - `DISCORD_CLIENT_SECRET`
  - Production redirect URL: `https://<production-domain>/api/auth/discord/callback`
- Kick developer app values:
  - `KICK_CLIENT_ID`
  - `KICK_CLIENT_SECRET`
  - Production redirect URL: `https://<production-domain>/api/auth/kick/callback`
  - Production webhook URL: `https://<production-domain>/api/webhooks/kick`
  - Watch channel slug for `KICK_WATCH_CHANNEL_SLUG`
- A real admin account to use for final QA.

## Production Env Checklist

```env
DATABASE_URL=<supabase-pooled-transaction-url>
DIRECT_URL=<supabase-direct-url>

LEADERBOARD_PROVIDER=shuffle
LEADERBOARD_API_KEY=<leaderboard-or-shuffle-api-key>
SHUFFLE_AFFILIATE_URL=<shuffle-affiliate-leaderboard-url>
SHUFFLE_ENABLE_UPSTREAM=true
SHUFFLE_MIN_POLL_INTERVAL_MS=35000
SHUFFLE_SNAPSHOT_STALE_MS=45000
SHUFFLE_LEADERBOARD_WINDOW_SOURCE=env
SHUFFLE_LEADERBOARD_START_TIME=<season-start-unix-seconds>
SHUFFLE_LEADERBOARD_END_TIME=<season-end-unix-seconds>

DISCORD_CLIENT_ID=<discord-client-id>
DISCORD_CLIENT_SECRET=<discord-client-secret>
DISCORD_REDIRECT_URI=https://<production-domain>/api/auth/discord/callback

KICK_CLIENT_ID=<kick-client-id>
KICK_CLIENT_SECRET=<kick-client-secret>
KICK_REDIRECT_URI=https://<production-domain>/api/auth/kick/callback
KICK_WEBHOOK_URL=https://<production-domain>/api/webhooks/kick
KICK_WATCH_CHANNEL_SLUG=<kick-channel-slug>
KICK_WATCH_VERIFICATION_MODE=chat
KICK_WATCH_ACTIVITY_WINDOW_SECONDS=900
KICK_WATCH_REQUIRE_LIVE=true

# Optional. Leave blank unless Kick signature verification needs a fixed key.
KICK_WEBHOOK_PUBLIC_KEY=

# Local-only. Do not enable in production.
RANKBOARD_DEV_AUTH=false
RANKBOARD_DEV_AUTH_FORCE=false
RANKBOARD_DEV_AUTH_ADMIN=false
```

## Provider Setup

- Kick app scopes must include `user:read`, `channel:read`, and `events:subscribe`.
- Kick app URLs must match the production redirect and webhook URLs exactly.
- Discord redirect URL must match `DISCORD_REDIRECT_URI` exactly.
- After changing Kick scopes or URLs, reconnect Kick in the app so the account receives the new scopes.

## Deploy Steps

1. Add the production env vars to Vercel.
2. Apply Prisma migrations to the production database if they are not already applied.
3. Redeploy the latest code.
4. Sign in with Kick and Discord on the deployed site.
5. Promote or confirm the admin account.
6. Open `/admin` and click `Subscribe events`.
7. Go live on Kick, send a chat message from a linked Kick user, and verify watch-points chat proof.

## Final QA

- Kick login.
- Discord login.
- Casino link and verification.
- Admin point adjustment.
- Store redemption and admin fulfillment.
- Custom bet creation, wager, settlement, and cancellation.
- Challenge progress and claim.
- Tournament enter and withdraw.
- Raffle ticket conversion, entry, and admin draw.
- Support ticket creation and admin status update.
- Watch points after live Kick chat/webhook activity.

## Optional Hardening

- Add mutation rate limits.
- Add admin audit logs for manual point changes, store fulfillment, raffle draws, and support changes.
- Add webhook retry and monitoring visibility.
- Replace remaining raw `<img>` elements with `next/image` if lint policy is tightened later.

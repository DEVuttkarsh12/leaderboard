# Kick Watch Bot Setup

ARTZ Rewards already credits watch points automatically. The production verifier
uses Kick OAuth, signed webhooks, live-stream status, recent chat activity, and a
10-second website heartbeat. Players never claim or start watch points manually.

## 1. Create the Kick app

1. Sign in as the ARTZ broadcaster at `https://dev.kick.com`.
2. Create an app and copy its client ID and client secret.
3. Add `https://YOUR_DOMAIN/api/auth/kick/callback` as the redirect URL.
4. Add `https://YOUR_DOMAIN/api/webhooks/kick` as the webhook URL.
5. Enable `user:read`, `channel:read`, and `events:subscribe`.

The current integration does not send chat messages, so `chat:write` is not
required. Add it only if the bot later needs to post in chat.

## 2. Configure production

Set these environment variables in Vercel, using the exact public ARTZ Kick
channel slug without `@`:

```env
KICK_CLIENT_ID=...
KICK_CLIENT_SECRET=...
KICK_REDIRECT_URI=https://YOUR_DOMAIN/api/auth/kick/callback
KICK_OAUTH_SCOPE=user:read channel:read events:subscribe
KICK_WEBHOOK_URL=https://YOUR_DOMAIN/api/webhooks/kick
KICK_WEBHOOK_SKIP_SIGNATURE=false
KICK_WATCH_CHANNEL_SLUG=...
KICK_WATCH_VERIFICATION_MODE=chat
KICK_WATCH_ACTIVITY_WINDOW_SECONDS=900
KICK_WATCH_REQUIRE_LIVE=true
```

Redeploy after saving the variables. Never enable
`KICK_WEBHOOK_SKIP_SIGNATURE` in production.

## 3. Authorize and subscribe

1. Log into ARTZ Rewards with the broadcaster's Kick account.
2. Open `/admin`.
3. In **Kick Events**, click **Subscribe events** once.
4. Confirm the panel reports that Kick chat and live events are subscribed.

This subscribes `chat.message.sent` and `livestream.status.updated`. Kick sends
both to `/api/webhooks/kick`, and the app verifies every webhook signature using
Kick's public key.

## 4. Test the earning flow

1. Start the ARTZ Kick stream, or use the admin-only **Go live** control for a
   temporary manual test gate.
2. Sign into ARTZ Rewards with a second Kick account.
3. Open `/watch-points`; no Start or Claim action should appear.
4. Send one message from that second account in ARTZ's Kick chat.
5. Keep `/watch-points` open. The balance should increase by 25 points every 10
   verified seconds, with the configured daily bonus applied once.
6. End the Kick stream and confirm earning stops. The webhook normally closes
   the gate automatically; the admin-only **End live** control is the fallback.

## Current Kick limitation

Kick's public API exposes total viewer counts, chat messages, and stream status,
but it does not expose an authenticated list of silent viewers or per-user
watch-time. Because of that, a bot cannot honestly prove that a silent account
is watching. This implementation uses recent signed chat activity plus the
signed-in website heartbeat. Supporting silent viewers will require a future
official Kick presence/watch-time API or a separately approved integration.

# Untangle — CLAUDE.md

AI-powered goal planner at **untangle.lol**. Users describe a goal; the app uses Claude to break it down into actionable steps. Privacy-first: all user data stays in localStorage; the server never sees API keys or goals.

## Stack

- **Framework:** Next.js 14 (App Router), React 18
- **AI:** Anthropic Claude (Sonnet 4-6 for chat, Haiku for suggestions) via `/api/chat`
- **Auth:** Google OAuth + magic-link email (Cloudflare Worker at `worker/index.js`)
- **Payments:** Stripe + Mollie (€0.25/credit)
- **Storage:** localStorage (client) + `/data/shares.json` (server, 30-day TTL)
- **Infra:** Docker + Traefik (blue-green deploy via `deploy.sh`)
- **Analytics:** Umami (privacy-preserving)

## Key Files

| Path | What it is |
|------|-----------|
| `app/components/App.jsx` | **Main UI** — 44KB monolith; all core logic lives here |
| `app/api/chat/route.js` | Proxies requests to Claude; rate-limits free tier (10/hr) |
| `app/api/share/route.js` | Create/read shareable plan URLs |
| `app/api/auth/` | Google OAuth + session management |
| `app/api/credits/` | Free-tier tracking + paid credit redemption |
| `app/api/stripe/` | Stripe checkout + webhooks |
| `app/api/mollie/` | Mollie payment webhooks |
| `app/api/suggestions/route.js` | AI suggestions endpoint |
| `app/api/feedback/route.js` | User feedback collection |
| `app/lib/langs/` | 15 translation files (en, nl, de, fr, es, pt, ar, bn, hi, id, ja, ru, sw, tr, zh) |
| `app/lib/langs/index.js` | Central language import |
| `app/lib/shares.js` | Share persistence logic (read/write `/data/shares.json`) |
| `app/lib/config.js` | App-wide config constants |
| `app/lib/utils.js` | Shared utilities |
| `app/layout.jsx` | Root layout — metadata, Schema.org, analytics, fonts |
| `app/sitemap.js` | Dynamic XML sitemap (indexes public shared plans) |
| `lib/session.js` | HMAC-SHA256 signed session cookies |
| `worker/index.js` | Cloudflare Worker — magic-link email auth |
| `next.config.js` | Cache headers, redirects (`/s/:id` → `/id/:id`), rewrites |
| `docker-compose.yml` | Traefik labels, volume mounts (`/data`) |
| `deploy.sh` | Zero-downtime blue-green deployment |
| `.env` | **Secrets** — API keys, payment credentials, email config |

## Routes

| URL | Purpose |
|-----|---------|
| `/` | Home — main planner UI |
| `/new` | Create new goal |
| `/id/[id]` | View shared plan |
| `/dashboard` | Authenticated user dashboard |
| `/payment` | Buy credits |
| `/donate/[lang]` | Language-specific donation page |
| `/feedback` | Feedback form |

## Business Logic

- **BYOK model**: users bring their own Anthropic or OpenRouter key (stored in localStorage, sent directly to API — never touches the server)
- **Free tier**: ~3 demo credits per user (rate-limited by IP/session)
- **Paid credits**: €0.25/credit via Stripe or Mollie; credits stored server-side tied to account
- **Altruism bonus**: earn free credits by making plans public/shareable
- **WOOP method**: alternate goal-setting flow built into App.jsx
- **Shared plans**: stored 30 days, publicly indexed by search engines

## Dev & Deployment

```bash
npm install
npm run dev          # http://localhost:3000

# Production (Docker)
docker compose up -d
./deploy.sh          # Blue-green zero-downtime deploy
```

## i18n

Add/edit translations in `app/lib/langs/<locale>.js`. Register the new file in `app/lib/langs/index.js`. Currently: en, nl, de, fr, es, pt, ar, bn, hi, id, ja, ru, sw, tr, zh.

## Notes

- `App.jsx` is a large monolith — search within it by feature keyword (e.g. `WOOP`, `share`, `payment`, `credits`, `language`)
- Shared plans live at `/data/shares.json` (Docker volume — not in git)
- Session cookies use a custom HMAC scheme in `lib/session.js`, not NextAuth
- README.md references Vite (legacy); the app now runs on Next.js

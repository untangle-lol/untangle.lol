# untangle.lol

A React app that uses Claude to help you break down goals into actionable steps.

## Stack

- **Frontend:** React 18 + Vite
- **Serving:** [`serve`](https://github.com/vercel/serve) (static, inside Docker)
- **Reverse proxy:** Traefik v3 (external `proxy` network, TLS via Let's Encrypt)

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Deployment

The server runs the site as a Docker container wired into the existing Traefik `proxy` network.

### First deploy

```bash
docker compose up -d --build
```

### Update after a push

```bash
git pull
docker compose up -d --build
```

Traefik automatically handles TLS for `untangle.lol` and redirects `www.untangle.lol` → `untangle.lol`.

## Environment

No server-side secrets required. The app calls the Anthropic API directly from the browser using an API key or Claude OAuth token stored in `localStorage`.

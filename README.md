# Spleckt

Marketing site and client portal for **Spleckt** — hyperrealistic 3D Gaussian Splat capture and hosting for real estate, construction, businesses, and scenes.

## Stack

- **Next.js** (App Router) + React — web + future mobile-friendly API surface
- **Better Auth** — email/password client portal
- **Drizzle ORM + libSQL** — local SQLite in dev; Turso-compatible in production
- **Cloudflare R2** — scalable splat/video storage (local `.data/uploads` fallback)
- **PlayCanvas SuperSplat Viewer** — self-hosted from `@playcanvas/supersplat-viewer`
- **PlayCanvas SuperSplat Editor** — self-hosted build in `public/editor`

## Features (MVP)

1. Light, professional marketing landing page with process media + featured splats
2. Client portal to upload/view splats
3. Public hashed share links (`/s/[hash]`)
4. Admin marketing media upload UI
5. Self-hosted SuperSplat viewer + editor

## Setup

```bash
npm install
cp .env.example .env.local
# set BETTER_AUTH_SECRET to a long random string

npm run db:push
npm run db:seed
npm run setup:editor   # first time only (clones + builds PlayCanvas SuperSplat)
npm run dev
```

Default admin (change after first login):

- Email: `admin@spleckt.com`
- Password: `changeme123`

## Cloudflare R2

Set these in `.env.local` / Vercel / Cloudflare:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL` (public bucket or custom domain)

Without R2, uploads are stored under `.data/uploads` and served from `/api/files/...`.

## Production notes

- Keep the Next.js app on **Vercel** (or Cloudflare via OpenNext) and put large assets on **R2**.
- Point `DATABASE_URL` at Turso/libSQL for serverless.
- Set `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` to `https://spleckt.com`.
- Rebuild the editor periodically with `npm run setup:editor`.

## Key routes

| Route | Purpose |
| --- | --- |
| `/` | Marketing landing |
| `/login`, `/signup` | Portal auth |
| `/portal` | Client splat library |
| `/portal/upload` | Upload splat |
| `/portal/media` | Admin marketing media |
| `/portal/splats/[id]` | Viewer + share links |
| `/portal/editor/[id]` | Self-hosted SuperSplat editor |
| `/s/[hash]` | Public share viewer |
| `/viewer` | Generic viewer with query params |

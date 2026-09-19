# Spleckt

Marketing site and client portal for **Spleckt** — hyperrealistic 3D Gaussian Splat capture and hosting for real estate, construction, businesses, and scenes.

## Stack

- **Next.js** (App Router) + React — web + future mobile-friendly API surface
- **Better Auth** — email/password client portal
- **Drizzle ORM + libSQL** — local SQLite in dev; Turso-compatible in production
- **Cloudflare R2** — scalable splat/video storage (local `.data/uploads` fallback)
- **PlayCanvas Engine** — interactive portfolio carousel on `portfolio.spleckt.com`
- **PlayCanvas SuperSplat Viewer** — self-hosted from `@playcanvas/supersplat-viewer`
- **PlayCanvas SuperSplat Editor** — self-hosted build in `public/editor`

## Features (MVP)

1. Light, professional marketing landing page with process media + featured splats
2. Client portal with roles: **viewer** (default), **editor**, **admin**
3. Public hashed share links (`/s/[hash]`)
4. Admin marketing media upload UI + user role management
5. Self-hosted SuperSplat viewer + editor
6. **Handoff** training surface on `handoff.spleckt.com` (modules, tests, certifications) — not linked from the main marketing site
7. **MenoKnow** kids game center on `menoknow.spleckt.com` (letters, numbers, simple activities) — not linked from the main marketing site
8. **Cubemap** equirect→cubemap tool on `cubemap.spleckt.com` (browser projection; optional self-hosted YouTube import) — not linked from the main marketing site
9. **Drones** scroll-driven Three.js services experience on `drones.spleckt.com` — not linked from the main marketing site
10. **Portfolio** PlayCanvas project-card carousel on `portfolio.spleckt.com` — not linked from the main marketing site

### Roles

| Role | Access |
| --- | --- |
| `viewer` | View assigned splats only (default for new signups) |
| `editor` | Upload, edit, share, and use the SuperSplat editor |
| `admin` | Everything editors can do, plus marketing media + change user roles |

## Handoff (`handoff.spleckt.com`)

Separate training product hosted in the same Next.js app. Named for the **relay baton handoff** in track and field: a clean pass of knowledge to the next teammate. Host-based routing sends `handoff.spleckt.com` (and `handoff.localhost:3000` in local dev) to the Handoff UI. The main Spleckt site does not link to it; `/handoff` paths return 404 on www/apex.

- Shared Better Auth users/credentials (cross-subdomain cookies on `.spleckt.com`)
- Direct login/signup on Handoff → training center
- Modules for tools / software / techniques, certification tests, and issued certificate codes

```bash
npm run db:seed:handoff
npm run db:seed:portalcam   # XGRIDS PortalCam interactive construction module
```

Point DNS for `handoff.spleckt.com` at the same Vercel deployment as www. Optionally set `NEXT_PUBLIC_HANDOFF_URL`.

## MenoKnow (`menoknow.spleckt.com`)

Kids educational game center for ages ~3–4. Host-based routing sends `menoknow.spleckt.com` (and `menoknow.localhost:3000` in local dev) to the MenoKnow UI. The main Spleckt site does not link to it; `/menoknow` paths return 404 on www/apex.

Theme play zones (Monster Trucks, Construction, Cow Farm) are scaffolded on the main page; letter/number/activity games come next.

Point DNS for `menoknow.spleckt.com` at the same Vercel deployment as www. Optionally set `NEXT_PUBLIC_MENOKNOW_URL`.

## Cubemap (`cubemap.spleckt.com`)

Browser tool that converts equirectangular 360° MP4 — or a YouTube 360 file saved locally from a link — into cubemap face images. Host-based routing sends `cubemap.spleckt.com` (and `cubemap.localhost:3000` in local dev) to the Cubemap UI. The main Spleckt site does not link to it; `/cubemap` paths return 404 on www/apex.

- Choose input video (or a ZIP of equirectangular photos/frames) and output folder via the File System Access API (Chromium); other browsers fall back to downloads
- Paste a YouTube 360 URL and use **Save to folder & process**: the host resolves the stream with `youtubei.js` (npm only — no yt-dlp/ffmpeg), the browser saves the file into a folder you pick via the File System Access API, then loads it for cubemap export. 360/EAC sources use the YouTube EAC input projection in WebGL. Optional host convert remains available only when `yt-dlp` is installed self-hosted.
- Set frames/sec (video), an optional start/end time or start/end frame export window, input projection (equirect or YouTube EAC 3×2 for local downloads), face size, FOV, faces per frame, top/bottom inclusion, yaw, layout (separate / strip / cross), and image format
- Optional photogrammetry masks (people / cars / sky) export as black=exclude, white=keep PNGs beside each face
- Cubemap projection uses HTML video + WebGL in the browser. Local files stay on-device; YouTube save-to-folder only uses the host as a byte proxy for CDN media.

Point DNS for `cubemap.spleckt.com` at the same Vercel deployment as www for the browser UI. YouTube **Save to folder & process** works without host binaries; optional host convert still needs self-hosted `yt-dlp`/`ffmpeg`. Optionally set `NEXT_PUBLIC_CUBEMAP_URL`.

## Drones (`drones.spleckt.com`)

Scroll-driven Three.js marketing experience for Spleckt aerial services. Host-based routing sends `drones.spleckt.com` (and `drones.localhost:3000` in local dev) to the Drones UI. The main Spleckt site does not link to it; `/drones` paths return 404 on www/apex.

- Procedural downtown → construction → survey → neighborhood scenes scrubbed by scroll
- Stylized Inspire-class drone with pointer lean
- Per-scene theme rotation for overlays and lighting

Point DNS for `drones.spleckt.com` at the same Vercel deployment as www. Optionally set `NEXT_PUBLIC_DRONES_URL`.

## Portfolio (`portfolio.spleckt.com`)

Brian Owens' interactive PlayCanvas carousel of project cards. Host-based routing sends `portfolio.spleckt.com` (and `portfolio.localhost:3000` in local dev) to the Portfolio UI. The main Spleckt site does not link to it; `/portfolio` paths return 404 on www/apex. Seed data starts from the resume; photos and videos can be added later in the editor.

- Drag, wheel, or arrow keys to rotate the deck; click a card to focus it
- About / Skills / Contact overlays read from an editable profile
- Editors and admins open `/login` on the portfolio host (there is no public sign-in button) to add, reorder copy, upload stills, and publish or hide cards

```bash
npm run db:seed:portfolio
```

Point DNS for `portfolio.spleckt.com` at the same Vercel deployment as www. Optionally set `NEXT_PUBLIC_PORTFOLIO_URL`.

## Setup

```bash
npm install
cp .env.example .env.local
# set BETTER_AUTH_SECRET to a long random string

npm run db:push
npm run db:seed
npm run db:seed:handoff
npm run db:seed:portfolio
npm run setup:editor   # first time only (clones + builds PlayCanvas SuperSplat)
npm run dev
```

Local Handoff: open `http://handoff.localhost:3000` (same process as `npm run dev`).
Local MenoKnow: open `http://menoknow.localhost:3000`.
Local Cubemap: open `http://cubemap.localhost:3000`.
Local Drones: open `http://drones.localhost:3000`.
Local Portfolio: open `http://portfolio.localhost:3000`.

Default admin (change after first login):

- Email: `admin@spleckt.com`
- Password: `changeme123`

## Environment variables

| Variable | What it is |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Your public site URL — use `https://www.spleckt.com` (apex redirects to www) |
| `NEXT_PUBLIC_HANDOFF_URL` | Optional Handoff URL — defaults to `https://handoff.spleckt.com` |
| `NEXT_PUBLIC_MENOKNOW_URL` | Optional MenoKnow URL — defaults to `https://menoknow.spleckt.com` |
| `NEXT_PUBLIC_CUBEMAP_URL` | Optional Cubemap URL — defaults to `https://cubemap.spleckt.com` |
| `NEXT_PUBLIC_DRONES_URL` | Optional Drones URL — defaults to `https://drones.spleckt.com` |
| `NEXT_PUBLIC_PORTFOLIO_URL` | Optional Portfolio URL — defaults to `https://portfolio.spleckt.com` |
| `BETTER_AUTH_URL` | Same URL as above for auth callbacks |
| `BETTER_AUTH_SECRET` | Random secret you generate: `openssl rand -base64 32` |
| `TURSO_DATABASE_URL` | From Turso dashboard → your database → Connect |
| `TURSO_AUTH_TOKEN` | From Turso dashboard → your database → Tokens |
| `R2_*` | From Cloudflare R2 bucket + API token |

## Cloudflare R2

Set these in `.env.local` / Vercel:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL` (public bucket or custom domain)

The app attempts to set R2 CORS automatically on upload. Portfolio card images (under ~4 MB) also upload through a same-origin proxy so they still land in R2 when the bucket CORS policy is stale. If large browser uploads fail with **Failed to fetch**, open Cloudflare → R2 → your bucket → **Settings → CORS policy** and allow:

- Origins: `https://www.spleckt.com`, `https://spleckt.com`, `https://portfolio.spleckt.com`
- Methods: `GET`, `PUT`, `HEAD`
- Headers: `*`

Without R2, uploads are stored under `.data/uploads` and served from `/api/files/...` (local only).

## Production notes

- Keep the Next.js app on **Vercel** and put large assets on **R2**.
- Use Turso via `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`.
- Set `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` to `https://spleckt.com`.
- After first deploy: `npm run db:push && npm run db:seed` with prod env loaded.
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

### Handoff host (`handoff.spleckt.com`)

| Route | Purpose |
| --- | --- |
| `/` | Handoff landing |
| `/login`, `/signup` | Training auth (shared credentials) |
| `/center` | Training modules |
| `/center/modules/[slug]` | Module content |
| `/center/modules/[slug]/test` | Certification test |
| `/center/certifications` | Earned certificates |

### MenoKnow host (`menoknow.spleckt.com`)

| Route | Purpose |
| --- | --- |
| `/` | Kids game center landing |
| `/play` | Play zone hub |
| `/play/trucks` | Monster Trucks zone hub |
| `/play/trucks/letters` | Letter Rally (listen, case, picture) |
| `/play/build` | Construction zone (game modules next) |
| `/play/farm` | Cow Farm zone hub |
| `/play/farm/count` | Count the cows (numbers 0–100) |

### Cubemap host (`cubemap.spleckt.com`)

| Route | Purpose |
| --- | --- |
| `/` | On-device equirect MP4 → cubemap extractor |

### Drones host (`drones.spleckt.com`)

| Route | Purpose |
| --- | --- |
| `/` | Scroll-driven aerial services Three.js experience |

### Portfolio host (`portfolio.spleckt.com`)

| Route | Purpose |
| --- | --- |
| `/` | PlayCanvas carousel of editable project cards |
| `/login` | Editor/admin sign-in for card and profile edits |

# Spleckt

This repository is a **development hub** for web-based prototyping and ideating.

One Next.js app hosts the public Spleckt product and a set of independent sites on their own hosts. Shared auth, storage, and deploy mean a new idea can get a real URL without a new codebase. Experiments stay first-class products — they are not linked from the marketing site, and their paths 404 on `www`.

**Spleckt** itself is hyperrealistic 3D Gaussian splat capture and hosting for real estate, construction, businesses, and scenes. The other hosts in this repo are where interaction ideas, tools, training flows, and 3D web techniques get tried in the open.

Live: [www.spleckt.com](https://www.spleckt.com)

## Sites

Every site below is the same process. Locally, swap `.spleckt.com` for `.localhost:3000` (for example `http://handoff.localhost:3000`).

| Host | What it is |
| --- | --- |
| [www.spleckt.com](https://www.spleckt.com) | Marketing site and client portal for 3D splat capture, hosting, and sharing |
| [handoff.spleckt.com](https://handoff.spleckt.com) | Training: modules, tests, and certifications — a clean pass of knowledge to the next teammate |
| [menoknow.spleckt.com](https://menoknow.spleckt.com) | Kids game center (letters, numbers, simple play) |
| [cubemap.spleckt.com](https://cubemap.spleckt.com) | Browser tool: equirectangular 360 video or photos → cubemap faces |
| [drones.spleckt.com](https://drones.spleckt.com) | Scroll-driven Three.js experience for aerial capture services |
| [portfolio.spleckt.com](https://portfolio.spleckt.com) | Interactive PlayCanvas carousel of project cards |
| [games.spleckt.com](https://games.spleckt.com) | Multiplayer game studio — an isometric PlayCanvas board game lounge |

### Spleckt

Capture a space, host the splat, share a link. The marketing site shows the process and featured scenes. The client portal is where captures live.

- **Viewer** — assigned splats only (default for new accounts)
- **Editor** — upload, edit, share, and open the self-hosted SuperSplat editor
- **Admin** — everything editors can do, plus marketing media and user roles

Public share links (`/s/[hash]`) let anyone explore a capture without an account.

### Handoff

Named for a relay baton pass. Sign in on the Handoff host (same accounts as Spleckt) to work through tool and technique modules, take tests, and earn certificate codes.

### MenoKnow

Play zones for early learners: Monster Trucks (letter rally), Cow Farm (count 0–100), and a Construction zone in progress.

### Cubemap

Runs in the browser. Point it at a 360° MP4, a ZIP of equirectangular frames, or a YouTube 360 link; it projects cube faces on-device. Optional photogrammetry masks (people, cars, sky) export beside the faces. Local files stay local.

### Drones

A scroll-scrubbed downtown → construction → survey → neighborhood flythrough with a stylized drone. A prototype of how aerial services can be *shown*, not just described.

### Portfolio

A rotatable deck of project cards with about / skills / contact overlays. Editors and admins sign in on the portfolio host to add stills, rewrite copy, reorder, and publish or hide cards.

### Games

A groovy 70s board game lounge rendered in isometric PlayCanvas. Sign in at the front desk with a player handle, pick a table to see its game, and start or join a match. Starting a game mints a 5-character code to share with friends. Drag the lounge (or the board during a match) to nudge the camera. Table 1 hosts checkers: the organizer picks red or black, the first two players play and later joiners watch, the camera looks straight down at the board (rotated so your color is nearest), jumps are optional, and the scoreboard tracks captures through a trophy for the winner. Table 2 hosts Scum (Bicycle Cards' Presidents): 3–6 players, lead any single or equal set, beat with a higher set of the same length, passing is always allowed, first out of cards is President and last with cards is the Scum. Table 3 hosts Battleship: two players secretly place the classic five-ship fleet on a 10×10 grid, then take turns firing one shot until one fleet is sunk.

## Stack

- **Next.js** (App Router) + React
- **Better Auth** — email/password, shared across Spleckt hosts
- **Drizzle ORM + libSQL** — SQLite in development; Turso-compatible in production
- **Cloudflare R2** — splat and media storage (local `.data/uploads` fallback)
- **PlayCanvas** — SuperSplat viewer/editor and the portfolio carousel
- **Three.js** — drones experience and other 3D sketches

## Run locally

```bash
npm install
cp .env.example .env.local   # set BETTER_AUTH_SECRET
mkdir -p .data
npm run db:push
npm run db:seed
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). Product hosts are `http://<name>.localhost:3000`. Seed scripts for Handoff and Portfolio are optional and idempotent (`npm run db:seed:handoff`, `npm run db:seed:portfolio`).

See `.env.example` for URLs, auth, Turso, and R2. Without R2, uploads stay on disk under `.data/uploads`. The SuperSplat viewer is installed automatically; the editor build (`npm run setup:editor`) is only needed for `/portal/editor`.

This is a lab as much as a product. New hosts and sketches are expected.

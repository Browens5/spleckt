<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Spleckt is a single Next.js 16 (App Router, Turbopack) app: a marketing site plus a Better Auth client portal, backed by Drizzle ORM + libSQL (local SQLite). Standard commands live in `package.json` and `README.md`; notes below are the non-obvious gotchas.

- Env: the app reads `.env.local`. If it is missing, create it from `.env.example` and set `BETTER_AUTH_SECRET` to a long random string. Without R2 credentials, uploads fall back to `.data/uploads` (this is fine for dev).
- Database init (not part of the update script): the SQLite file lives under `.data/` (gitignored). The `.data/` directory must exist before `npm run db:push` or libSQL fails with `ConnectionFailed(... 14)`. Initialize with: `mkdir -p .data && npm run db:push && npm run db:seed`. Both steps are idempotent. Seeding creates the admin login `admin@spleckt.com` / `changeme123` (overridable via `ADMIN_*` in `.env.local`).
- Run dev: `npm run dev` (port 3000). `/portal` 307-redirects to `/login` until authenticated — that is expected, not an error.
- `npm run setup:editor` is heavy and optional: it git-clones and builds the PlayCanvas SuperSplat editor from GitHub into `public/editor`, and is only needed for the `/portal/editor/[id]` route. The viewer assets (`public/viewer`) are copied automatically by the `postinstall`/`prebuild` `setup-viewer` script, so skip `setup:editor` unless you are specifically working on the editor.
- Checks: `npm run lint` (ESLint) and `npx tsc --noEmit` (typecheck) both pass clean on the base setup; `npm run build` also succeeds.

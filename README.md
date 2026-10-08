# Grassruts

A Nigerian civic reporting platform built with Next.js, React, and Supabase. Residents document local issues, support reports from their community, follow authority updates, and verify claimed resolutions.

## Local preview

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Keep the terminal running. Local source edits refresh the preview automatically; they do not publish the site.

Use `.env.example` as a reference for `.env.local`. Do not overwrite an existing `.env.local` or commit its contents. Restart the server after changing environment variables.

| Variable                        | Purpose                                                                  |
| ------------------------------- | ------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                                                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous/publishable project key                                 |
| `NEXT_PUBLIC_APP_URL`           | App origin for authentication callbacks; `http://localhost:3000` locally |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-only database operations and shared rate limiting                 |
| `ANTHROPIC_API_KEY`             | Server-only moderation for new issues                                    |
| `ADMIN_EMAIL`                   | Verified account allowed to use admin moderation                         |

The public URL and key are enough to preview public pages and sign in during development. New issue submission requires both server-only keys and the database migration below. Missing configuration returns an error and preserves the form draft.

Use a separate development Supabase project for test accounts and submissions. A local server connected to the production Supabase project still reads and writes production data.

## Required database migration

`supabase/migrations/011_security_boundaries.sql` is required for the updated report APIs, public evidence/vote views, authority audit entries, and production rate limiter. Pushing the repository or redeploying Vercel does not apply this SQL automatically. Check the target database before running it; do not rerun a successfully applied migration.

For an existing database with migrations 001–010, review and apply 011 to a development database first. Apply the migration and matching application release together when deploying later: older clients that write issues directly will be denied after this migration.

For a fresh database, apply the SQL files in this order:

1. 001 through 004.
2. `005_government_portal.sql`, then `005_gov_api.sql`.
3. 006 through 010, then 011.

The repository has two historical files numbered 005. Do not use a migration runner that assumes unique numeric versions without first reconciling that history. The isolated database test applies the explicit order above. Fixes to the guarded constraints in 006/007 support fresh installations; do not rerun already-applied historical migrations on production.

Create a public Storage bucket named `evidence` before applying 011. The migration sets a 5 MB object limit, permits JPEG/PNG/WebP, and confines uploads to the authenticated account's folder. Public photos should never contain private documents or identifiable bystanders. `scripts/seed-locations.mjs` contains the location seed workflow; review its target before running it.

Configure Supabase authentication to allow the local app URL and its confirmation/reset routes when using a development project.

The seed script reads credentials from the environment and only writes when called with `--apply`. Without that flag it prints the selected project host and exits. Load your development environment explicitly, for example `node --env-file=.env.local scripts/seed-locations.mjs`, and verify the target before adding `--apply`.

## Interface changes

- Shared forest-green and cream styling, readable type, focus indicators, and mobile navigation.
- Public explore/detail pages, working title search, category/state/status filters, and pagination.
- Dashboard totals scoped to a resident's area or a diaspora user's watchlist.
- A five-step reporting form with optional compressed photos and an encrypted draft.
- Clear separation between a reported issue, high community support, an authority response, and community verification. Statistics come from the database.
- Matching public, authentication, account, and government layouts.

## Security boundaries

**Previously exposed credential:** a hard-coded Supabase service-role key was found in the tracked location seed script and removed from the working tree. Treat that old key as exposed. Replace it everywhere it is used and revoke/disable the old key in Supabase. Creating a replacement alone does not invalidate the exposed key, and deleting it from source does not remove it from existing Git history.

- Profiles and individual reporting/voting records are restricted to their owners. Public views expose evidence and aggregate vote counts.
- Trusted issue writes use server-only, transactional database functions. Browser clients cannot bypass moderation by inserting an issue directly.
- Government reads and updates enforce the account or API key's jurisdiction; status changes retain an audit entry.
- Idempotency keys belong to a submitting account. Report totals are derived from actual report rows.
- Rate limits are shared through Postgres in production and fail closed if unavailable. Local development permits an in-memory fallback. Client-IP attribution currently supports Vercel's trusted header; other hosts share a conservative fallback bucket and need an appropriate trusted-proxy integration before deployment.
- The service worker never caches authenticated HTML, React navigation payloads, API responses, or evidence. Existing private caches are removed on activation.
- Drafts/outbox entries use a random per-account key held in the current browser tab. Signing out clears device data. Closing the tab removes its key, so unsent drafts cannot be recovered in a new session. Keep the tab open until a queued report is submitted.

These controls require both the database migration and the matching application deployment. An application rollback alone does not undo the database permission changes.

## Validation

```sh
npm run lint
npm test
npm run build
npm audit --omit=dev
```

Tests run against an isolated PGlite database, with no production credentials or writes. They cover private profiles, immutable trusted fields, reporter-only voting, atomic/idempotent submission, rate limiting, upload ownership, jurisdiction boundaries, per-account draft encryption, and private-page cache exclusion. PostGIS is omitted from this test database; actual Supabase auth/storage integration still needs a development-project test.

The production dependency audit reports zero known vulnerabilities at the time of this change. Five high-severity advisories remain in the development-only ESLint/glob dependency chain. The audit's suggested forced downgrade of Next's ESLint package was not applied; follow upstream fixes before accepting untrusted repositories into that tooling.

Public routes and protected-page redirects were checked over HTTP. Visual desktop/mobile and signed-in end-to-end checks remain to be performed in a connected browser with a configured development database.

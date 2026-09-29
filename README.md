# Haven property API

TypeScript + Express REST API backed by SQLite.

## Run locally

1. Install Node.js 20+ and pnpm.
2. Copy `.env.example` to `.env` and adjust values if needed.
3. Run `pnpm install`, `pnpm seed`, then `pnpm dev`.
4. API base URL: `http://localhost:4000/api/v1`; health endpoint: `/health`.

The seed command creates 12 demo homes across Yangon, Mandalay, and Bago. Demo member: `demo@example.test` / `demo-password-change-me`. Demo administrator: `admin@example.test` / `admin-password-change-me`. Change both passwords before sharing any environment. Demo photos are from Unsplash (`images.unsplash.com`, IDs listed in `src/seed.ts`); see the [Unsplash License](https://unsplash.com/license). Replace the sample URLs with reviewed production assets before launch. SQLite defaults to `./data/property.sqlite`.

## Routes

- `GET /listings` public search; supports city, purpose, propertyType, minPrice, maxPrice, bedrooms, page, limit, and sort (`price_asc` / `price_desc`).
- `GET /listings/:id` public published listing detail.
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`.
- `GET /listings/mine`, `POST /listings`, `PATCH /listings/:id`, `DELETE /listings/:id` require the signed-in owner.
- New member listings enter admin review and stay out of public search until approved. Admins use `GET /admin/listings`, `PATCH /admin/listings/:id` with `{"decision":"approve"}` or `{"decision":"reject"}`, and `DELETE /admin/listings/:id`.

Sessions use opaque random IDs in HTTP-only SameSite=Lax cookies; only hashes are stored in SQLite. Configure HTTPS termination and `NODE_ENV=production` in production. Email verification, password recovery delivery, and production photo uploads need provider decisions before launch. New submissions remain private until an administrator approves them.

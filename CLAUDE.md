# TCG All-in-One

## Project Overview
Multi-license digital platform for TCG collectors and players.
Supported games: Pokémon TCG, Yu-Gi-Oh!, Magic: The Gathering, One Piece Card Game.

Core pillars: Collection | Valuation | Gameplay | Community

## Tech Stack
- **Framework**: Next.js 14+ (App Router, Server Components, Server Actions)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4 + shadcn/ui component library
- **State**: Zustand (client), React Server Components (server)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth.js v5 (credentials + OAuth)
- **API Layer**: tRPC or Server Actions (prefer Server Actions for mutations)
- **File Storage**: S3-compatible (card scans, avatars)
- **Real-time**: Server-Sent Events or WebSocket for price alerts
- **Testing**: Vitest + Playwright (E2E)
- **Deployment**: Vercel

## Architecture Rules
- Feature-based folder structure under /src/features/
- Each feature is self-contained: components/, hooks/, actions/, types/, utils/
- Shared code lives in /src/shared/ (ui, lib, types, constants)
- Database models in /prisma/schema.prisma (single source of truth)
- All API data goes through typed service layers, never raw queries in components
- Server Components by default, 'use client' only when needed (interactivity, hooks)
- Every new feature gets: types first → schema → service → UI → tests

## Coding Standards
- Strict TypeScript: no `any`, no `as` assertions unless justified with comment
- Named exports only (no default exports except pages/layouts)
- Barrel exports via index.ts per feature
- Error handling: Result pattern for services, error boundaries for UI
- Naming: PascalCase components, camelCase functions, SCREAMING_SNAKE constants
- Max file length: 300 lines. If longer, split.
- Comments: explain WHY, not WHAT. Code should be self-documenting.
- Commits: conventional commits (feat:, fix:, chore:, refactor:, docs:, test:)

## Supported TCG Licenses (Data Models)
Each game has different card structures. Use a polymorphic card model:
- Base `Card` table with shared fields (id, name, imageUrl, set, rarity, marketPrice)
- Game-specific extension tables (PokemonCardDetails, YugiohCardDetails, etc.)
- `GameType` enum: POKEMON | YUGIOH | MTG | ONEPIECE

## Feature Roadmap (Build Order)
### Phase 1 — Foundation
1. Auth (signup, login, profile)
2. Collection CRUD (manual entry, per-game)
3. Card database browser with search/filter
4. Basic dashboard with collection stats

### Phase 2 — Intelligence
5. Market data integration (price API)
6. Portfolio valuation + historical charts
7. Set completion tracking
8. Wishlist + price alerts

### Phase 3 — Social
9. Public profiles + collection sharing
10. Follow system
11. Milestones & achievement badges
12. Leaderboards

### Phase 4 — Gameplay
13. Deck builder (per game, legality checks)
14. Deck sharing + community decks
15. Synergy/curve analysis

### Phase 5 — Marketplace
16. Card listing system
17. Smart matching
18. Transaction + rating system

## Key API Integrations
- **Pokémon**: pokemontcg.io API
- **Yu-Gi-Oh!**: YGOProDeck API
- **Magic**: Scryfall API
- **One Piece**: OPTCG API or custom scraping
- **Pricing**: TCGPlayer API, CardMarket API

## Current Status
- [x] Project scaffolded
- [x] Auth working (signup, login, logout, OAuth, profile)
- [x] Collection CRUD (create, delete, add/remove cards)
- [x] Card browser (search, filter by game/rarity, pagination, detail page)
- [x] Dashboard with collection stats + portfolio value
- [x] Card import from APIs (Pokemon, Yu-Gi-Oh!, MTG)
- [x] Portfolio valuation (real prices from collections)
- [x] Set completion tracking (progress bars per set)
- [x] Wishlist with target price alerts
- [x] Social: public profiles, follow system, achievements (14 badges), user search
- [x] Deck builder with per-game formats, legality checks, sideboard support
- [x] Deck sharing + community decks (browse, copy)
- [x] Deck analysis (cost curve, type breakdown, color/attribute, rarity, value)
- [x] Marketplace: card listings (sell/trade), offer system, transactions, ratings
- [x] Smart matching: wishlist-to-listing matching with target price comparison
- [x] One Piece card import (OPTCG API)
- [x] Full database: 90,527 cards across all 4 games
- [x] Leaderboards (portfolio value, cards, followers, achievements, trades)
- [x] Portfolio history charts (recharts, daily snapshots)
- [x] Full-text search (GIN trigram index on 90k+ cards)
- [x] Price alerts (cron-based, notification bell in dashboard)
- [x] Stripe payments (checkout, webhooks, billing portal, subscription tiers)
- [x] Test coverage (159 unit tests across 15 test files)
- [x] Production hardening: next/image optimization, security headers, error boundaries
- [x] CI/CD pipeline (GitHub Actions: lint, typecheck, test, build)
- [x] Rate limiting on abuse-prone actions (listings, offers, follows, imports)
- [x] Portfolio leaderboard optimized with raw SQL (single query vs N+1)
- [x] Sentry error tracking + web vitals monitoring
- [x] Playwright E2E test setup (auth, cards, market + 6 new E2E specs)
- [x] Polish: DB indexes, Zod validation, dark/light mode, OG images, CSV export/import, PWA manifest
- [x] Analytics dashboard (game/rarity breakdown charts, top cards, summary stats)
- [x] Card price history tracking (PriceHistory model, chart on card detail)
- [x] Saved searches (save/load search filters on card browser)
- [x] Collection comparison (side-by-side diff of two collections)
- [x] Bulk CSV import (parse CSV, match cards, upsert into collection)
- All 5 phases complete + production hardening + polish & analytics

## Session Log
<!-- Claude Code: update this section at end of each session -->
### Session: 2026-03-04 (4)
- **Worked on**: 4 new features — card price history, saved searches, collection comparison, bulk CSV import
- **Created**: PriceHistory + SavedSearch DB models + migration. Price history service + chart (recharts AreaChart on card detail page). Price sync integration (records snapshots after price updates). Saved searches service + actions + UI (save/load/delete search filters). Collection comparison service + page (shared/unique cards diff with stats). CSV import parser + API route + ImportCSVButton component. 11 new unit tests (csv-import).
- **Decisions made**: PriceHistory records Decimal price per card per day. SavedSearch stores filters as JSON string (max 20 per user). Collection comparison allows comparing own collections or own vs public. CSV import matches card names case-insensitively by game type, upserts into collection. Recharts `labelFormatter` uses inferred types (ReactNode) not explicit string.
- **Blockers**: None — 159 tests pass, build succeeds
- **Next up**: Deploy, more tests for new features

### Session: 2026-03-04 (3)
- **Worked on**: Polish & UX (6 features) + Analytics dashboard + E2E tests
- **Created**: DB indexes (4 new). Zod validation schemas for all server actions (market, decks, social). Dark/light mode (next-themes). OpenGraph images (card + user). CSV export (service + API route + button). PWA manifest + icons. Analytics feature (services, charts, page). 6 new E2E test specs. 44 new unit tests (validation schemas + csv-export + analytics).
- **Decisions made**: Zod 4 uses `error:` not `errorMap:` for enum params. Recharts Tooltip formatter expects `number | undefined`. Manual migration SQL for schema drift. next-themes with `attribute="class"` + `defaultTheme="dark"`. OG images use `runtime = "nodejs"` for Prisma access.
- **Blockers**: None — 148 tests pass, build succeeds

### Session: 2026-03-04 (2)
- **Worked on**: Production hardening — image optimization, security, CI/CD, tests, rate limiting, observability
- **Created**: next.config.ts (image domains, security headers, Sentry). Error boundaries (dashboard, auth, 404, global-error). CI/CD workflow (.github/workflows/ci.yml). 75 new unit tests (marketplace listings/offers/ratings, deck validation/analysis, social follows/achievements). Playwright config + 3 E2E test files. Rate limiter (src/shared/lib/rate-limit.ts). Sentry configs (client/server/edge). Cache utility (src/shared/lib/cache.ts).
- **Decisions made**: Replaced all 9 `<img>` with `next/image` (fill + sizes). Portfolio leaderboard uses raw SQL for O(1) query. In-memory rate limiter (10/min listings/offers, 20/min follows, 5/min imports). Sentry v10 with `captureRequestError`. Next.js 16 dropped `revalidateTag` single-arg — using `revalidatePath` instead. `unstable_cache` incompatible with Vitest (mock needed for test env).
- **Blockers**: None — 104 tests pass, build succeeds
- **Next up**: Deploy, monitor Sentry, expand E2E coverage

### Session: 2026-03-04
- **Worked on**: One Piece import, full database seed (90,527 cards), leaderboards, portfolio charts, full-text search, price alerts, Stripe payments, tests
- **Created**: One Piece import service + UI. Seed scripts (seed-all-cards.ts, seed-prod-raw.ts). Leaderboard service + page (5 categories). Portfolio snapshot model + chart (recharts). Notification model + bell component + cron API route. Stripe billing (checkout, webhooks, portal, subscription tiers). 29 unit tests.
- **Decisions made**: OPTCG API for One Piece (free, no auth). Pokemon fallback to GitHub raw data (API unreliable). Raw SQL bulk INSERT for production seeding (Prisma too slow remotely). GIN trigram index for card search. Vercel cron every 6h for price alerts. Stripe webhook for subscription state sync.
- **Blockers**: None — build passes, all tests green
- **Next up**: Deploy latest changes, add more tests, polish UI

### Session: 2026-03-03 (7)
- **Worked on**: Phase 5 — Marketplace (listings, offers, transactions, ratings, smart matching)
- **Created**: Listing, Offer, Transaction, UserRating DB models + migration. Listing CRUD (create, browse, cancel with auto-decline of pending offers). Offer system (make, accept, decline, withdraw) with transactional acceptance (creates transaction, marks listing sold, declines other offers). Transaction history with star ratings (1-5 + comment). Smart matching (surfaces active listings for wishlist cards with target price comparison). Market pages: browse with game filter, sell page, listing detail with offer form, offers inbox (sent/received), transaction history.
- **Decisions made**: ListingStatus enum (ACTIVE/SOLD/CANCELLED), OfferStatus enum (PENDING/ACCEPTED/DECLINED/COUNTERED/WITHDRAWN). Seller ratings aggregated via Prisma aggregate. Offer acceptance uses $transaction for atomicity. Wishlist matches surfaced on main market page.
- **Blockers**: None — build passes
- **Next up**: All phases complete. Remaining: tests, polish, deployment.

### Session: 2026-03-03 (6)
- **Worked on**: Phase 4 — Gameplay (deck builder, sharing, analysis)
- **Created**: Deck + DeckCard DB models. Deck CRUD service with game-type validation. 11 game formats (Pokemon/YGO/MTG/OP). Legality validation (deck size, copy limits, sideboard). Deck analysis (cost curve, type/color breakdown, rarity, estimated value). Community decks page with copy-deck. Deck editor with card search + sideboard toggle.
- **Decisions made**: Deck format IDs use `game-format` pattern (e.g. `mtg-commander`). DeckCard unique constraint includes `isSideboard` flag. Analysis adapts per-game (CMC for MTG, level for YGO, retreat cost for Pokemon, cost for OP).
- **Blockers**: None — build passes
- **Next up**: Phase 5 — Marketplace (card listing, smart matching, transactions)

### Session: 2026-03-03 (5)
- **Worked on**: Phase 3 — Social (public profiles, follows, achievements)
- **Created**: Follow, Achievement, UserAchievement DB models + migration. Public profile page (/user/[id]) with stats, collections, achievements. Follow/unfollow with achievement auto-award. User search. Profile/collection visibility toggles. Bio editing. 14 achievement definitions across 3 categories. Updated profile page with bio, visibility, achievements.
- **Decisions made**: Achievements auto-seeded via upsert on first check. isPublic flag on both User and Collection. Profile visibility required to be followed.
- **Blockers**: None — build passes

### Session: 2026-03-03 (4)
- **Worked on**: Phase 2 — Card import, portfolio valuation, set completion, wishlist
- **Created**: Card import services for Pokemon (pokemontcg.io), Yu-Gi-Oh! (YGOProDeck), MTG (Scryfall) with set browsing. Wishlist feature (schema, migration, service, actions, components, page). Import UI at /cards/import. Portfolio valuation on dashboard. Set completion progress bars on collection detail.
- **Decisions made**: Card IDs prefixed by game (pokemon-xxx, yugioh-xxx, mtg-xxx) to avoid collisions. Import uses upsert for idempotency. Scryfall rate-limited at 120ms between pages. Wishlist uses unique constraint [userId, cardId].
- **Blockers**: None — build passes
- **Next up**: Phase 3 — Social (public profiles, follow system, milestones, leaderboards)

### Session: 2026-03-03 (3)
- **Worked on**: Phase 1 completion — Collection CRUD, Card Browser, Dashboard Stats
- **Decisions made**: Server actions wrap service calls (never import services from client components directly)
- **Blockers**: None

### Session: 2026-03-03 (2)
- **Worked on**: Phase 1 — Auth implementation (signup, login, logout, OAuth, profile, middleware)
- **Decisions made**: JWT sessions (required for Credentials provider), `token.sub` for user ID in JWT (avoids module augmentation issues), Zod 4 `.check()` with `ctx.value`/`ctx.issues.push()` API
- **Blockers**: None — build passes successfully

### Session: 2026-03-03
- **Worked on**: Initial project scaffold — Next.js, Tailwind CSS 4, shadcn/ui, Prisma, NextAuth, Zustand, folder structure, slash commands, agents, rules
- **Decisions made**: Feature-based architecture, polymorphic card model, Server Actions over tRPC for mutations
- **Blockers**: None
- **Next up**: Phase 1 — Auth (signup, login, profile)

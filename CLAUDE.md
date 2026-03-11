# TCG All-in-One — Claude Code Instructions

> Read this file at the start of every session. It is the single source of truth for architecture decisions, priorities, and conventions.

---

## 🎯 Project Overview

**TCG All-in-One** is a multi-license digital hub for Trading Card Game collectors and players.

**Supported games:** Pokémon TCG · Yu-Gi-Oh! · Magic: The Gathering · One Piece Card Game

**Four core pillars:**
1. Collection Management
2. Market Valuation
3. Deck Building
4. Social / Community

**Marketplace** is a later phase (peer-to-peer, after core is stable).

**Business model:** Freemium
- `Rookie` — free, max 2,000 cards, basic features
- `Master` — $9.99/mo, unlimited cards, real-time data, alerts, exclusive badges

---

## 🏗️ Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ (App Router, TypeScript strict) |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v5 |
| State | Zustand |
| External APIs | pokemontcg.io · YGOProDeck · Scryfall · TCGPlayer · CardMarket |

---

## 📐 Core Architecture Rules

### 1. Card Hierarchy (NEVER skip levels)
```
License → Set → Cards
```
Every card belongs to a set. Every set belongs to a license. This is the root of all data relationships.

### 2. Set Types (ALWAYS differentiate — never mix in UI)
```ts
enum SetType {
  BOOSTER_SET     // main display, default view
  STARTER_DECK    // secondary, clearly labeled
  SPECIAL_PRODUCT // tins, bundles, etc.
  PROMO           // promotional releases
}
```
Booster sets are shown by default. Other types are accessible but separated in the UI.

### 3. Sets Display Order
Always display sets in **reverse chronological order** (`release_date DESC`) unless the user explicitly sorts differently.

### 4. Multi-game Architecture (CRITICAL)
**Never hardcode logic for a single TCG.**  
All game-specific behavior must go through a config map:

```ts
// lib/games/config.ts
export const GAME_CONFIG: Record<License, GameConfig> = {
  POKEMON: {
    filters: ['type', 'rarity', 'hp', 'stage'],
    deckRules: {
      minCards: 60,
      maxCopies: 4,
      exceptions: [
        { match: 'supertype:Energy subtype:Basic', maxCopies: Infinity },
        { match: 'subtypes:ACE SPEC', maxCopies: 1 },
      ],
    },
    // Playset = 4 (standard deck max)
    // ACE SPEC cards are NOT counted toward playset — they're always singular
    playsetSize: 4,
    cardRatio: '2.5 / 3.5',
  },
  YUGIOH: {
    filters: ['type', 'attribute', 'level', 'atk', 'def'],
    deckRules: {
      minCards: 40,
      maxCards: 60,
      maxCopies: 3,
      // Forbidden & Limited List overrides maxCopies per card:
      // FORBIDDEN → 0 copies allowed in deck
      // LIMITED   → max 1 copy
      // SEMI-LIMITED → max 2 copies
      // Check YGOProDeck API field: banlist_info.ban_tcg | ban_ocg
      limitedListEnabled: true,
    },
    // Playset = 3 (standard max before F&L restrictions)
    // The F&L list is a DECK BUILDER rule, not a collection rule.
    // A user can own 3 copies of a Limited card — they just can't put 3 in a deck.
    playsetSize: 3,
    cardRatio: '2.25 / 3.25',
  },
  MAGIC: {
    filters: ['color', 'cmc', 'type', 'rarity', 'format'],
    deckRules: {
      minCards: 60,
      maxCopies: 4,
      exceptions: [
        { match: 'type:Basic Land', maxCopies: Infinity },
      ],
    },
    // Playset = 4 (standard deck max)
    // Basic Lands are unlimited in decks but irrelevant for playset indicator
    playsetSize: 4,
    cardRatio: '2.5 / 3.5',
  },
  ONE_PIECE: {
    filters: ['color', 'cost', 'type', 'power', 'counter'],
    deckRules: {
      minCards: 50,
      maxCopies: 4,
      // Leader card: exactly 1, separate from main deck
      // DON!! cards: exactly 10, not counted in the 50
    },
    playsetSize: 4,
    cardRatio: '2.25 / 3.5',
  },
}
```

### Playset Rules Summary

| Game | Playset Size | Notes |
|---|---|---|
| Pokémon | 4 | ACE SPEC cards are always singular — skip playset indicator for them |
| Yu-Gi-Oh! | 3 | F&L list affects **deck building only**, not collection ownership |
| Magic: The Gathering | 4 | Basic Lands are unlimited — skip playset indicator for them |
| One Piece | 4 | Leader cards are singular — skip playset indicator for them |

> **Key principle:** Playset indicators reflect **collection completeness** (do you own enough to build a deck?), not deck legality. F&L restrictions, ACE SPEC rules, and Basic Land limits are enforced in the **Deck Builder**, not in the Collection view.

---

## 🃏 Card Rendering Standards

**This is the #1 UI priority. Card display quality = product quality.**

### Image Resolution by API
```
Scryfall (Magic)  → always use ?version=normal or large. NEVER small or png for grid view.
pokemontcg.io     → use images.large for detail, images.small for grid
YGOProDeck        → card_images[0].image_url for full, image_url_small for grid
One Piece API     → verify source URL returns full-res image before using
```

### Card Component Requirements
- Correct aspect ratio per game (use `GAME_CONFIG[license].cardRatio`)
- Rounded corners: `rounded-lg` minimum
- Skeleton loader while image loads (never show broken image)
- Holographic shimmer effect for rare/holo/secret rare cards
- Hover: subtle scale + glow effect matching card color identity

### Card Condition (required for collection + marketplace)
```ts
enum CardCondition {
  MINT = 'M',
  NEAR_MINT = 'NM',
  EXCELLENT = 'EX',
  GOOD = 'GD',
  LIGHT_PLAYED = 'LP',
  PLAYED = 'PL',
  POOR = 'PR',
}
```

---

## 🗂️ Collection System

### Card Language Support

**Language is a property of the collection instance, NOT of the abstract card.**  
One card (e.g. "Charizard ex SV01-054") can exist in multiple languages in the same collection.

```ts
enum CardLanguage {
  EN = 'EN',   // English       — Phase 1, mandatory
  FR = 'FR',   // French        — Phase 1, mandatory
  JP = 'JP',   // Japanese      — Phase 1, mandatory
  DE = 'DE',   // German        — Phase 2
  ES = 'ES',   // Spanish       — Phase 2
  IT = 'IT',   // Italian       — Phase 2
  PT = 'PT',   // Portuguese    — Phase 2
  KO = 'KO',   // Korean        — Phase 2
  ZH_HANS = 'ZH_HANS', // Chinese Simplified  — Phase 2
  ZH_HANT = 'ZH_HANT', // Chinese Traditional — Phase 2 (Magic only)
}
```

**Language availability per game:**

| Language | Pokémon | Magic | Yu-Gi-Oh! | One Piece |
|---|---|---|---|---|
| EN | ✅ | ✅ | ✅ | ✅ |
| FR | ✅ | ✅ | ✅ | ✅ |
| JP | ✅ | ✅ | ✅ | ✅ |
| DE | ✅ | ✅ | ✅ | ✅ |
| ES | ✅ | ✅ | ✅ | ❌ |
| IT | ✅ | ✅ | ✅ | ❌ |
| PT | ✅ | ✅ | ❌ | ❌ |
| KO | ✅ | ✅ | ✅ | ❌ |
| ZH_HANS | ✅ | ✅ | ❌ | ❌ |
| ZH_HANT | ❌ | ✅ | ❌ | ❌ |

**API language coverage (important for image sourcing):**
- **Scryfall (Magic)** → `lang` field on every card, excellent coverage ✅
- **pokemontcg.io** → EN only ⚠️ — JP/FR/etc. images must be sourced via CardMarket or manually
- **YGOProDeck** → EN primary, JP partial ⚠️
- **One Piece** → EN and JP are separate regional endpoints ✅

> **Phase 1 target:** EN + FR + JP. These cover 90%+ of the European collector market.  
> Store `language` as a free string field in DB from day 1 — never lock to an enum in migrations, validate at application layer only.

### Card Instance Model
A user's collection stores **instances**, not abstract cards:
```ts
type CollectionEntry = {
  cardId: string
  userId: string
  quantity: number
  condition: CardCondition
  language: CardLanguage   // see CardLanguage enum above — EN | FR | JP mandatory in Phase 1
  foil: boolean
  forSale: boolean
  forTrade: boolean
  acquiredPrice?: number
  acquiredAt?: Date
}
```

### Collection Indicators (show on every card in grid)
```
● Purple  → owned, 1 copy
◉ Blue    → owned, playset complete (per GAME_CONFIG[license].playsetSize)
◈ Gradient → owned, both (1+ copies AND playset)
○ Empty   → not in collection
```

### Filters Required (in collection view)
- Language (mandatory)
- Condition
- For sale / For trade toggles
- Set type (booster / starter / promo)
- Game-specific filters (from GAME_CONFIG)

---

## 🏪 Marketplace

### Offer State Machine
```
PENDING → COUNTERED → ACCEPTED
                    → DECLINED
                    → EXPIRED (after 48h)
```
Never bypass states. Every transition must be logged with timestamp and actor.

### Listing Model
```ts
type Listing = {
  cardInstanceId: string
  sellerId: string
  price: number
  currency: 'EUR' | 'USD'
  condition: CardCondition
  language: CardLanguage
  shippingZones: ShippingZone[]  // seller defines per-zone price
  photos: string[]               // min 1, max 6
  status: ListingStatus
}
```

### Shipping Model (confirmed)

Sellers define their own shipping fees per zone at listing creation. Standard CardMarket-style model — familiar to TCG sellers.

```ts
type ShippingZone = {
  zone: 'DOMESTIC' | 'EU' | 'WORLDWIDE'
  price: number
  currency: 'EUR' | 'USD'
  estimatedDays: { min: number, max: number }
}
```

Listings can also set `freeShippingAbove?: number` (e.g. free shipping if order > €50).

**Commission rules (confirmed):**
- Platform commission applies to **item price only** — never on shipping fees
- Dynamic shipping (weight × distance via carrier API) is deferred to Phase 5+ only
- This is a hard rule — never change without an explicit business decision + DB migration plan

### Payment (implementation order)
1. Stripe (CB, Apple Pay, Google Pay) — Phase 1
2. Platform credit/wallet — Phase 2
3. Crypto — only if explicitly validated by users, MiCA compliance required

---

## 📊 Analytics & Market Data

### Phase 1 — External APIs
Pull prices from CardMarket and TCGPlayer. Display as:
```
CardMarket: €X  |  TCGPlayer: $Y  |  Platform: €Z (when available)
```
Show competitor prices small, as context — not as a competitive argument.

### Phase 2 — Native Pricing
Build price history from actual platform transactions. Supersedes external APIs over time.

### Required Analytics Views
- Top 10 most valuable cards in collection
- **Favorites view** (user-pinned cards, regardless of value)
- **Gainers / Losers** — cards that gained or lost most value over last 7/30 days
- Portfolio total value over time

---

## 🃏 Deck Builder

### Rules per game (from GAME_CONFIG)
Validate deck composition client-side AND server-side.

### Required Features
- Import from text list (standard format per game, e.g. `4x Pikachu EX SV01`)
- Trending decks (pull from community APIs or curate manually)
- Quick completion: show cards missing from collection, link to marketplace listings
- Export to text / share link

---

## 🔗 Cross-feature Navigation (Quick Links)

Every card detail view must expose:
```
[+ Add to Collection]  [+ Add to Deck]  [View Marketplace Listings]  [★ Favorite]
```
Never make the user navigate to another section manually to do these actions.

---

## 👥 Social System

### Notifications (no private text messages — announcements only)
- New card in someone's collection (if public)
- New marketplace listing (filtered by followed users or wishlist)
- Card search request ("Looking for X card")
- Badge earned

### Leaderboard Filters
```
Scope: Global → Country → Region → City
Network: All users | Followers only | Mutual follows
Game: All games | Per license
```

---

## 🏗️ Build Phases

| Phase | Scope |
|---|---|
| 1 | Auth + Card Browser + Collection (with language, condition, set types) |
| 2 | Market data + Price history + Analytics |
| 3 | Social + Badges + Leaderboard |
| 4 | Deck Builder |
| 5 | Marketplace + Native pricing + Payments |

---

## 📁 Folder Structure

```
/app
  /(auth)/
  /(dashboard)/
    /collection/
    /market/
    /decks/
    /social/
    /analytics/
    /marketplace/
/components
  /cards/          ← card rendering, ALWAYS game-agnostic
  /collection/
  /marketplace/
  /deck/
  /social/
  /ui/             ← shadcn + custom primitives
/lib
  /games/
    config.ts      ← GAME_CONFIG lives here
    filters.ts     ← filter schemas per game
    deck-rules.ts  ← validation per game
  /api/
    /pokemon/
    /yugioh/
    /magic/
    /onepiece/
  /prisma/
/hooks
/store             ← Zustand stores
/types
```

---

## ⚠️ Hard Rules

1. **Never hardcode for one TCG.** Use `GAME_CONFIG` and the license enum everywhere.
2. **Never mix set types** in the same UI level. Booster sets ≠ Starter Decks.
3. **Always use correct image resolution** per API. No `small` images in card detail views.
4. **Card language is mandatory** in every collection entry and marketplace listing.
5. **Offer state machine must be respected** — no direct jumps between states.
6. **Skeleton loaders are mandatory** on all card image loads.
7. **Commission applies to item price only**, never on shipping.
8. **Deck rules are validated both client and server side.**

---

## 🎨 Design System

- **Theme:** Dark only
- **Aesthetic:** Manga / TCG holographic
- **Palette:** Purple `#7C3AED` · Blue `#2563EB` · Cyan `#06B6D4` · Dark `#0F0F1A`
- **Holographic effect:** CSS `background: conic-gradient(...)` + `mix-blend-mode: overlay` on rare cards
- **Font:** Inter for UI, display font for headings (e.g. Bebas Neue or similar)

---

---

## 📝 Session Log

<!-- Claude Code: update this section at end of each session -->

### Session: 2026-03-10
- **Worked on**: Collection performance + UX/Design overhaul (8 phases)
- **Created**: Collection API routes (`/api/collection`, `/api/collection/[id]`). CollectionDetailClient with in-memory cache + skeleton. Market stats service (price movers, overview). PriceTicker + MarketOverview components. ActivityFeed service (computed from existing models) + component. Privacy/Terms pages. Skeleton UI component.
- **Modified**: Collection detail page → zero-SSR (client fetches via API). getSetCompletion accepts gameType param (eliminates correlated subquery). getCollectionCards removes redundant ownership check. getUserCollections now includes portfolio value per collection. CollectionList: search/filter + sort (name/value/cards/game/date). NavLinks: Lucide icons + 5 group sections + holo active accent. Sidebar: gradient logo, user avatar with initials fallback. ListingCard: larger thumbnails, seller avatar+rating, game-colored border, quick action button. Card detail: price analytics (7D/30D/90D change%, range), market depth (sorted listings). Landing: real card counts (90k+), mobile hamburger menu, footer dead links fixed. Dashboard: dash-card hover effect, activity feed, primary-colored portfolio value.
- **Decisions made**: Zero-SSR pattern with `Cache-Control: private, s-maxage=30, stale-while-revalidate=300`. Activity feed computed from CollectionCard/Listing/UserAchievement/Follow tables (no new DB model). Price movers use PriceHistory 7-day window. Nav grouped: Core/Trade/Play/Social/Me. ImportCSVButton + CollectionCardList accept optional callback props for client refetch.
- **Blockers**: None — 166 tests pass, build succeeds
- **Next up**: Deploy, add tests for new services (market-stats, activity-feed)

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

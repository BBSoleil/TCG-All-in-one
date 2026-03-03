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
- [ ] Auth working
- [ ] Collection CRUD
- [ ] Card browser

## Session Log
<!-- Claude Code: update this section at end of each session -->
### Last Session: 2026-03-03
- **Worked on**: Initial project scaffold — Next.js, Tailwind CSS 4, shadcn/ui, Prisma, NextAuth, Zustand, folder structure, slash commands, agents, rules
- **Decisions made**: Feature-based architecture, polymorphic card model, Server Actions over tRPC for mutations
- **Blockers**: None
- **Next up**: Phase 1 — Auth (signup, login, profile)

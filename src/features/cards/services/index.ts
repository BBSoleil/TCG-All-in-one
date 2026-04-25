import { prisma } from "@/shared/lib/prisma";
import { cached } from "@/shared/lib/cache";
import type { GameType as PrismaGameType, Rarity as PrismaRarity, Prisma } from "@/generated/prisma/client";
import type { Result, GameType } from "@/shared/types";
import type { CardListItem, CardSearchParams, SetInfo } from "@/features/cards/types";
export interface CardSearchResult {
  cards: CardListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CardDetail {
  id: string;
  name: string;
  gameType: string;
  setName: string | null;
  setCode: string | null;
  rarity: string | null;
  imageUrl: string | null;
  marketPrice: unknown;
  createdAt: Date;
  updatedAt: Date;
  pokemonDetails: {
    hp: number | null;
    types: string[];
    evolvesFrom: string | null;
    stage: string | null;
    weakness: string | null;
    resistance: string | null;
    retreatCost: number | null;
  } | null;
  yugiohDetails: {
    cardType: string | null;
    attribute: string | null;
    level: number | null;
    attack: number | null;
    defense: number | null;
    race: string | null;
    archetype: string | null;
  } | null;
  mtgDetails: {
    manaCost: string | null;
    cmc: number | null;
    colors: string[];
    typeLine: string | null;
    oracleText: string | null;
    power: string | null;
    toughness: string | null;
    loyalty: string | null;
  } | null;
  onepieceDetails: {
    color: string | null;
    cost: number | null;
    power: number | null;
    counter: number | null;
    attribute: string | null;
    cardType: string | null;
  } | null;
}

const VALID_GAME_TYPES = new Set<string>(["POKEMON", "YUGIOH", "MTG", "ONEPIECE"]);

async function getSetsForGameUncached(
  gameType?: GameType,
): Promise<SetInfo[]> {
  // Allowlist-validate gameType before use. The function is called via /api/cards/sets
  // where gameType is a typecast URL param — TypeScript types erase at runtime, so
  // unvalidated input would interpolate into raw SQL. Reject anything outside the enum.
  if (gameType && !VALID_GAME_TYPES.has(gameType)) {
    return [];
  }

  // Group by setName + gameType only (not setCode, which includes card numbers for YGO).
  // Sort by MIN(setCode) per-game so One Piece goes OP-01 → OP-11 → EB-01 → PRB-01 → ST-01
  // (alphanumeric). Null/missing codes fall to the end so sets still show up.
  const baseQuery = `SELECT "setName", MIN("setCode") as "setCode", "gameType", COUNT(id)::int as "cardCount"
     FROM cards WHERE "setName" IS NOT NULL`;
  const groupOrder = `GROUP BY "setName", "gameType"
     ORDER BY "gameType" ASC, MIN("setCode") ASC NULLS LAST, "setName" ASC`;

  const rows = gameType
    ? await prisma.$queryRawUnsafe<
        { setName: string; setCode: string | null; gameType: string; cardCount: number }[]
      >(`${baseQuery} AND "gameType" = $1 ${groupOrder}`, gameType)
    : await prisma.$queryRawUnsafe<
        { setName: string; setCode: string | null; gameType: string; cardCount: number }[]
      >(`${baseQuery} ${groupOrder}`);

  return rows.map((r) => ({
    setName: r.setName,
    setCode: r.setCode,
    cardCount: r.cardCount,
    gameType: r.gameType as GameType,
  }));
}

const getSetsForGameCached = cached(
  (gameTypeStr: string) => getSetsForGameUncached(gameTypeStr === "__all__" ? undefined : gameTypeStr as GameType),
  ["card-sets"],
  { revalidate: 3600 },
);

export async function getSetsForGame(
  gameType?: GameType,
): Promise<Result<SetInfo[]>> {
  try {
    const sets = await getSetsForGameCached(gameType ?? "__all__");
    return { success: true, data: sets };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch sets") };
  }
}


function buildSortOrder(sortBy?: string): Prisma.CardOrderByWithRelationInput {
  switch (sortBy) {
    case "price_desc":
      return { marketPrice: { sort: "desc", nulls: "last" } };
    case "price_asc":
      return { marketPrice: { sort: "asc", nulls: "last" } };
    case "newest":
      return { createdAt: "desc" };
    default:
      return { name: "asc" };
  }
}

async function searchCardsUncached(
  paramsJson: string,
): Promise<CardSearchResult> {
  const params: CardSearchParams = JSON.parse(paramsJson);
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where: Prisma.CardWhereInput = {};

  if (params.query) {
    where.name = { contains: params.query, mode: "insensitive" };
  }
  if (params.gameType) {
    where.gameType = params.gameType as PrismaGameType;
  }
  if (params.rarity) {
    where.rarity = params.rarity as PrismaRarity;
  }
  if (params.setName) {
    where.setName = params.setName;
  }

  // Game-specific relation filters
  const gf = params.gameFilters;
  if (gf) {
    if (gf.pokemonType || gf.pokemonStage || gf.pokemonHpMin || gf.pokemonHpMax) {
      const pokemonWhere: Prisma.PokemonCardDetailsWhereInput = {};
      if (gf.pokemonType) pokemonWhere.types = { has: gf.pokemonType };
      if (gf.pokemonStage) pokemonWhere.stage = gf.pokemonStage;
      if (gf.pokemonHpMin || gf.pokemonHpMax) {
        pokemonWhere.hp = {};
        if (gf.pokemonHpMin) pokemonWhere.hp.gte = gf.pokemonHpMin;
        if (gf.pokemonHpMax) pokemonWhere.hp.lte = gf.pokemonHpMax;
      }
      where.pokemonDetails = pokemonWhere;
    }
    if (gf.yugiohCardType || gf.yugiohAttribute || gf.yugiohLevel || gf.yugiohRace) {
      const yugiohWhere: Prisma.YugiohCardDetailsWhereInput = {};
      if (gf.yugiohCardType) yugiohWhere.cardType = gf.yugiohCardType;
      if (gf.yugiohAttribute) yugiohWhere.attribute = gf.yugiohAttribute;
      if (gf.yugiohLevel) yugiohWhere.level = gf.yugiohLevel;
      if (gf.yugiohRace) yugiohWhere.race = gf.yugiohRace;
      where.yugiohDetails = yugiohWhere;
    }
    if (gf.mtgColors || gf.mtgCmcMin || gf.mtgCmcMax || gf.mtgTypeLine) {
      const mtgWhere: Prisma.MtgCardDetailsWhereInput = {};
      if (gf.mtgColors && gf.mtgColors.length > 0) {
        mtgWhere.colors = { hasSome: gf.mtgColors };
      }
      if (gf.mtgCmcMin || gf.mtgCmcMax) {
        mtgWhere.cmc = {};
        if (gf.mtgCmcMin) mtgWhere.cmc.gte = gf.mtgCmcMin;
        if (gf.mtgCmcMax) mtgWhere.cmc.lte = gf.mtgCmcMax;
      }
      if (gf.mtgTypeLine) mtgWhere.typeLine = { contains: gf.mtgTypeLine, mode: "insensitive" };
      where.mtgDetails = mtgWhere;
    }
    if (gf.onepieceColor || gf.onepieceCardType || gf.onepieceCostMin || gf.onepieceCostMax) {
      const opWhere: Prisma.OnePieceCardDetailsWhereInput = {};
      if (gf.onepieceColor) opWhere.color = gf.onepieceColor;
      if (gf.onepieceCardType) opWhere.cardType = gf.onepieceCardType;
      if (gf.onepieceCostMin || gf.onepieceCostMax) {
        opWhere.cost = {};
        if (gf.onepieceCostMin) opWhere.cost.gte = gf.onepieceCostMin;
        if (gf.onepieceCostMax) opWhere.cost.lte = gf.onepieceCostMax;
      }
      where.onepieceDetails = opWhere;
    }
  }

  const orderBy = buildSortOrder(params.sortBy);

  const [cards, total] = await Promise.all([
    prisma.card.findMany({
      where,
      select: {
        id: true,
        name: true,
        gameType: true,
        setName: true,
        rarity: true,
        imageUrl: true,
        marketPrice: true,
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.card.count({ where }),
  ]);

  const mappedCards: CardListItem[] = cards.map((c) => ({
    id: c.id,
    name: c.name,
    gameType: c.gameType as CardListItem["gameType"],
    setName: c.setName,
    rarity: c.rarity,
    imageUrl: c.imageUrl,
    marketPrice: c.marketPrice ? Number(c.marketPrice) : null,
  }));

  return {
    cards: mappedCards,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

const searchCardsCached = cached(
  searchCardsUncached,
  ["card-search"],
  { revalidate: 60 },
);

export async function searchCards(
  params: CardSearchParams,
): Promise<Result<CardSearchResult>> {
  try {
    const data = await searchCardsCached(JSON.stringify(params));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to search cards") };
  }
}

export async function getCardById(id: string): Promise<Result<CardDetail>> {
  try {
    const card = await prisma.card.findUnique({
      where: { id },
      include: {
        pokemonDetails: true,
        yugiohDetails: true,
        mtgDetails: true,
        onepieceDetails: true,
      },
    });

    if (!card) {
      return { success: false, error: new Error("Card not found") };
    }

    return { success: true, data: card };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch card") };
  }
}

export async function searchCardsForSelect(
  gameType: string,
): Promise<{ id: string; name: string }[]> {
  const cards = await prisma.card.findMany({
    where: { gameType: gameType as PrismaGameType },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 200,
  });
  return cards;
}


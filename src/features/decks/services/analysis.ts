import { prisma } from "@/shared/lib/prisma";
import type { Result } from "@/shared/types";
import type { DeckAnalysis } from "../types";

export async function analyzeDeck(deckId: string): Promise<Result<DeckAnalysis>> {
  try {
    const deckCards = await prisma.deckCard.findMany({
      where: { deckId },
      include: {
        card: {
          include: {
            pokemonDetails: true,
            yugiohDetails: true,
            mtgDetails: true,
            onepieceDetails: true,
          },
        },
      },
    });

    if (deckCards.length === 0) {
      return {
        success: true,
        data: {
          totalCards: 0,
          sideboardCards: 0,
          costCurve: [],
          typeBreakdown: [],
          attributeBreakdown: [],
          rarityBreakdown: [],
          estimatedValue: 0,
        },
      };
    }

    const mainCards = deckCards.filter((dc) => !dc.isSideboard);
    const sideboardCards = deckCards.filter((dc) => dc.isSideboard);
    const totalCards = mainCards.reduce((s, dc) => s + dc.quantity, 0);
    const sideboardTotal = sideboardCards.reduce((s, dc) => s + dc.quantity, 0);

    // Cost curve — uses CMC for MTG, cost for One Piece, level for YGO, retreat cost for Pokemon
    const costMap = new Map<number, number>();
    for (const dc of mainCards) {
      let cost = 0;
      const card = dc.card;
      if (card.mtgDetails) {
        cost = Math.round(card.mtgDetails.cmc ?? 0);
      } else if (card.onepieceDetails) {
        cost = card.onepieceDetails.cost ?? 0;
      } else if (card.yugiohDetails) {
        cost = card.yugiohDetails.level ?? 0;
      } else if (card.pokemonDetails) {
        cost = card.pokemonDetails.retreatCost ?? 0;
      }
      costMap.set(cost, (costMap.get(cost) ?? 0) + dc.quantity);
    }
    const costCurve = Array.from(costMap.entries())
      .map(([cost, count]) => ({ cost, count }))
      .sort((a, b) => a.cost - b.cost);

    // Type breakdown
    const typeMap = new Map<string, number>();
    for (const dc of mainCards) {
      const card = dc.card;
      let type = "Unknown";
      if (card.mtgDetails?.typeLine) {
        // Extract base type (e.g. "Creature" from "Creature — Elf Warrior")
        type = card.mtgDetails.typeLine.split("—")[0]?.trim() ?? "Unknown";
      } else if (card.yugiohDetails?.cardType) {
        type = card.yugiohDetails.cardType;
      } else if (card.pokemonDetails?.stage) {
        type = card.pokemonDetails.stage;
      } else if (card.onepieceDetails?.cardType) {
        type = card.onepieceDetails.cardType;
      }
      typeMap.set(type, (typeMap.get(type) ?? 0) + dc.quantity);
    }
    const typeBreakdown = Array.from(typeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Attribute breakdown (colors for MTG, types for Pokemon, attributes for YGO, colors for OP)
    const attrMap = new Map<string, number>();
    for (const dc of mainCards) {
      const card = dc.card;
      const attrs: string[] = [];
      if (card.mtgDetails?.colors && card.mtgDetails.colors.length > 0) {
        attrs.push(...card.mtgDetails.colors);
      } else if (card.pokemonDetails?.types && card.pokemonDetails.types.length > 0) {
        attrs.push(...card.pokemonDetails.types);
      } else if (card.yugiohDetails?.attribute) {
        attrs.push(card.yugiohDetails.attribute);
      } else if (card.onepieceDetails?.color) {
        attrs.push(card.onepieceDetails.color);
      }
      if (attrs.length === 0) attrs.push("Colorless");
      for (const a of attrs) {
        attrMap.set(a, (attrMap.get(a) ?? 0) + dc.quantity);
      }
    }
    const attributeBreakdown = Array.from(attrMap.entries())
      .map(([attribute, count]) => ({ attribute, count }))
      .sort((a, b) => b.count - a.count);

    // Rarity breakdown
    const rarityMap = new Map<string, number>();
    for (const dc of mainCards) {
      const rarity = dc.card.rarity ?? "Unknown";
      rarityMap.set(rarity, (rarityMap.get(rarity) ?? 0) + dc.quantity);
    }
    const rarityBreakdown = Array.from(rarityMap.entries())
      .map(([rarity, count]) => ({ rarity, count }))
      .sort((a, b) => b.count - a.count);

    // Estimated value
    const estimatedValue = deckCards.reduce((sum, dc) => {
      const price = dc.card.marketPrice ? Number(dc.card.marketPrice) : 0;
      return sum + price * dc.quantity;
    }, 0);

    return {
      success: true,
      data: {
        totalCards,
        sideboardCards: sideboardTotal,
        costCurve,
        typeBreakdown,
        attributeBreakdown,
        rarityBreakdown,
        estimatedValue,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to analyze deck") };
  }
}

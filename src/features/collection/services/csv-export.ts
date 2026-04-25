import type { CollectionCardWithDetails } from "./index";

const HEADERS = [
  "Name",
  "Game",
  "Set",
  "Rarity",
  "Quantity",
  "Condition",
  "Market Price",
  "Total Value",
  "Notes",
];

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function generateCSV(cards: CollectionCardWithDetails[]): string {
  const rows: string[] = [];

  rows.push(HEADERS.map(escapeCSV).join(","));

  for (const cc of cards) {
    const price = cc.card.marketPrice ? Number(cc.card.marketPrice) : 0;
    const totalValue = price * cc.quantity;

    const row = [
      cc.card.name,
      cc.card.gameType,
      cc.card.setName ?? "",
      cc.card.rarity ?? "",
      String(cc.quantity),
      cc.condition ?? "",
      price > 0 ? price.toFixed(2) : "",
      totalValue > 0 ? totalValue.toFixed(2) : "",
      cc.notes ?? "",
    ];

    rows.push(row.map(escapeCSV).join(","));
  }

  return rows.join("\n");
}

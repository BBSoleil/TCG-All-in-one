/**
 * Ultra-fast production seed using raw pg bulk INSERT ... ON CONFLICT.
 * ~100x faster than Prisma upserts for remote databases.
 * Run: DATABASE_URL="..." npx tsx scripts/seed-prod-raw.ts
 */

import "dotenv/config";
import pg from "pg";

function resolveConnectionString(): string {
  const raw = process.env["DATABASE_URL"];
  if (!raw) { console.error("DATABASE_URL required"); process.exit(1); }
  if (raw.startsWith("prisma+postgres://")) {
    const url = new URL(raw);
    const apiKey = url.searchParams.get("api_key");
    if (apiKey) {
      return (JSON.parse(Buffer.from(apiKey, "base64").toString()) as { databaseUrl: string }).databaseUrl;
    }
  }
  return raw;
}

const pool = new pg.Pool({
  connectionString: resolveConnectionString(),
  max: 3,
  statement_timeout: 30000, // 30s per statement
  idle_timeout: 10000,
});
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

type Rarity = "COMMON" | "UNCOMMON" | "RARE" | "SUPER_RARE" | "ULTRA_RARE" | "SECRET_RARE" | "SPECIAL";

interface Card {
  id: string; externalId: string; name: string; gameType: string;
  setName: string | null; setCode: string | null; rarity: Rarity;
  imageUrl: string | null; marketPrice: number | null;
}

interface PokemonDetail { cardId: string; hp: number | null; types: string[]; evolvesFrom: string | null; stage: string | null; weakness: string | null; resistance: string | null; retreatCost: number | null; }
interface YugiohDetail { cardId: string; cardType: string | null; attribute: string | null; level: number | null; attack: number | null; defense: number | null; race: string | null; archetype: string | null; }
interface MtgDetail { cardId: string; manaCost: string | null; cmc: number | null; colors: string[]; typeLine: string | null; oracleText: string | null; power: string | null; toughness: string | null; loyalty: string | null; }
interface OnepieceDetail { cardId: string; color: string | null; cost: number | null; power: number | null; counter: number | null; attribute: string | null; cardType: string | null; }

// Bulk insert cards — INSERT ON CONFLICT UPDATE
async function bulkUpsertCards(cards: Card[]): Promise<number> {
  if (cards.length === 0) return 0;
  const CHUNK = 50;
  let total = 0;

  for (let i = 0; i < cards.length; i += CHUNK) {
    const chunk = cards.slice(i, i + CHUNK);
    const values: unknown[] = [];
    const placeholders = chunk.map((c, idx) => {
      const base = idx * 9;
      values.push(c.id, c.externalId, c.name, c.gameType, c.setName, c.setCode, c.rarity, c.imageUrl, c.marketPrice);
      return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9},NOW(),NOW())`;
    }).join(",");

    const sql = `INSERT INTO cards (id,"externalId",name,"gameType","setName","setCode",rarity,"imageUrl","marketPrice","createdAt","updatedAt")
      VALUES ${placeholders}
      ON CONFLICT (id) DO UPDATE SET
        name=EXCLUDED.name, "imageUrl"=EXCLUDED."imageUrl",
        "marketPrice"=EXCLUDED."marketPrice", rarity=EXCLUDED.rarity,
        "updatedAt"=NOW()`;

    try {
      const res = await pool.query(sql, values);
      total += res.rowCount ?? chunk.length;
    } catch (err) {
      // Fallback: try smaller chunks on error
      for (const c of chunk) {
        try {
          await pool.query(
            `INSERT INTO cards (id,"externalId",name,"gameType","setName","setCode",rarity,"imageUrl","marketPrice","createdAt","updatedAt")
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
             ON CONFLICT (id) DO UPDATE SET name=$3,"imageUrl"=$8,"marketPrice"=$9,rarity=$7,"updatedAt"=NOW()`,
            [c.id, c.externalId, c.name, c.gameType, c.setName, c.setCode, c.rarity, c.imageUrl, c.marketPrice],
          );
          total++;
        } catch { /* skip */ }
      }
    }
  }
  return total;
}

async function bulkInsertPokemonDetails(details: PokemonDetail[]): Promise<void> {
  if (details.length === 0) return;
  const CHUNK = 50;
  for (let i = 0; i < details.length; i += CHUNK) {
    const chunk = details.slice(i, i + CHUNK);
    const values: unknown[] = [];
    const placeholders = chunk.map((d, idx) => {
      const b = idx * 8;
      values.push(d.cardId, d.hp, d.types, d.evolvesFrom, d.stage, d.weakness, d.resistance, d.retreatCost);
      return `(gen_random_uuid(),$${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8})`;
    }).join(",");
    try {
      await pool.query(
        `INSERT INTO pokemon_card_details (id,"cardId",hp,types,"evolvesFrom",stage,weakness,resistance,"retreatCost")
         VALUES ${placeholders} ON CONFLICT ("cardId") DO NOTHING`, values);
    } catch { /* skip */ }
  }
}

async function bulkInsertYugiohDetails(details: YugiohDetail[]): Promise<void> {
  if (details.length === 0) return;
  const CHUNK = 50;
  for (let i = 0; i < details.length; i += CHUNK) {
    const chunk = details.slice(i, i + CHUNK);
    const values: unknown[] = [];
    const placeholders = chunk.map((d, idx) => {
      const b = idx * 8;
      values.push(d.cardId, d.cardType, d.attribute, d.level, d.attack, d.defense, d.race, d.archetype);
      return `(gen_random_uuid(),$${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8})`;
    }).join(",");
    try {
      await pool.query(
        `INSERT INTO yugioh_card_details (id,"cardId","cardType",attribute,level,attack,defense,race,archetype)
         VALUES ${placeholders} ON CONFLICT ("cardId") DO NOTHING`, values);
    } catch { /* skip */ }
  }
}

async function bulkInsertMtgDetails(details: MtgDetail[]): Promise<void> {
  if (details.length === 0) return;
  const CHUNK = 50;
  for (let i = 0; i < details.length; i += CHUNK) {
    const chunk = details.slice(i, i + CHUNK);
    const values: unknown[] = [];
    const placeholders = chunk.map((d, idx) => {
      const b = idx * 9;
      values.push(d.cardId, d.manaCost, d.cmc, d.colors, d.typeLine, d.oracleText, d.power, d.toughness, d.loyalty);
      return `(gen_random_uuid(),$${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8},$${b+9})`;
    }).join(",");
    try {
      await pool.query(
        `INSERT INTO mtg_card_details (id,"cardId","manaCost",cmc,colors,"typeLine","oracleText",power,toughness,loyalty)
         VALUES ${placeholders} ON CONFLICT ("cardId") DO NOTHING`, values);
    } catch { /* skip */ }
  }
}

async function bulkInsertOnepieceDetails(details: OnepieceDetail[]): Promise<void> {
  if (details.length === 0) return;
  const CHUNK = 50;
  for (let i = 0; i < details.length; i += CHUNK) {
    const chunk = details.slice(i, i + CHUNK);
    const values: unknown[] = [];
    const placeholders = chunk.map((d, idx) => {
      const b = idx * 7;
      values.push(d.cardId, d.color, d.cost, d.power, d.counter, d.attribute, d.cardType);
      return `(gen_random_uuid(),$${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7})`;
    }).join(",");
    try {
      await pool.query(
        `INSERT INTO onepiece_card_details (id,"cardId",color,cost,power,counter,attribute,"cardType")
         VALUES ${placeholders} ON CONFLICT ("cardId") DO NOTHING`, values);
    } catch { /* skip */ }
  }
}

// ═══════════════════════════════════════════════════
// POKEMON
// ═══════════════════════════════════════════════════

const PKM: Record<string, Rarity> = {
  Common: "COMMON", Uncommon: "UNCOMMON", Rare: "RARE", "Rare Holo": "RARE",
  "Rare Holo EX": "SUPER_RARE", "Rare Holo GX": "SUPER_RARE", "Rare Holo V": "SUPER_RARE",
  "Rare VMAX": "ULTRA_RARE", "Rare Ultra": "ULTRA_RARE", "Ultra Rare": "ULTRA_RARE",
  "Rare Secret": "SECRET_RARE", "Rare Rainbow": "SECRET_RARE", "Hyper Rare": "SECRET_RARE",
  "Rare Shiny": "SPECIAL", "Amazing Rare": "SPECIAL", "Illustration Rare": "SPECIAL",
  "Special Art Rare": "SPECIAL", "Double Rare": "RARE", LEGEND: "SPECIAL", Promo: "SPECIAL",
};
const GH = "https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master";

async function importAllPokemon(): Promise<number> {
  console.log("\n══ POKEMON TCG ══");
  const setsRes = await fetch(`${GH}/sets/en.json`);
  if (!setsRes.ok) { console.error("  Sets failed"); return 0; }
  const sets = (await setsRes.json()) as { id: string; name: string }[];
  console.log(`  ${sets.length} sets`);
  let total = 0;

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    process.stdout.write(`  [${i+1}/${sets.length}] ${set.name} (${set.id})...`);
    try {
      const res = await fetch(`${GH}/cards/en/${set.id}.json`);
      if (!res.ok) { console.log(" SKIP"); continue; }
      const raw = (await res.json()) as Record<string, unknown>[];
      const cards: Card[] = [];
      const details: PokemonDetail[] = [];
      for (const c of raw) {
        const id = `pokemon-${c.id as string}`;
        const images = c.images as { small: string; large: string } | undefined;
        const cm = c.cardmarket as { prices?: { averageSellPrice?: number } } | undefined;
        const subtypes = c.subtypes as string[] | undefined;
        const weaknesses = c.weaknesses as { type: string; value: string }[] | undefined;
        const resistances = c.resistances as { type: string; value: string }[] | undefined;
        cards.push({ id, externalId: c.id as string, name: c.name as string, gameType: "POKEMON",
          setName: set.name, setCode: set.id, rarity: PKM[(c.rarity as string) ?? ""] ?? "RARE",
          imageUrl: images?.large ?? images?.small ?? null, marketPrice: cm?.prices?.averageSellPrice ?? null });
        details.push({ cardId: id, hp: (c.hp as string) ? parseInt(c.hp as string, 10) || null : null,
          types: (c.types as string[]) ?? [], evolvesFrom: (c.evolvesFrom as string) ?? null,
          stage: subtypes?.includes("Basic") ? "Basic" : subtypes?.includes("Stage 1") ? "Stage 1" : subtypes?.includes("Stage 2") ? "Stage 2" : subtypes?.[0] ?? null,
          weakness: weaknesses?.[0] ? `${weaknesses[0].type} ${weaknesses[0].value}` : null,
          resistance: resistances?.[0] ? `${resistances[0].type} ${resistances[0].value}` : null,
          retreatCost: (c.retreatCost as string[])?.length ?? null });
      }
      const count = await bulkUpsertCards(cards);
      await bulkInsertPokemonDetails(details);
      console.log(` ${count}`);
      total += count;
    } catch (e) { console.log(` ERR: ${e instanceof Error ? e.message : e}`); }
    await delay(30);
  }
  console.log(`  TOTAL: ${total}`);
  return total;
}

// ═══════════════════════════════════════════════════
// YU-GI-OH!
// ═══════════════════════════════════════════════════

const YGO: Record<string, Rarity> = {
  Common: "COMMON", Rare: "RARE", "Super Rare": "SUPER_RARE", "Ultra Rare": "ULTRA_RARE",
  "Secret Rare": "SECRET_RARE", "Ultimate Rare": "SECRET_RARE",
  "Ghost Rare": "SPECIAL", "Starlight Rare": "SPECIAL", "Short Print": "UNCOMMON",
};

async function importAllYugioh(): Promise<number> {
  console.log("\n══ YU-GI-OH! ══");
  let total = 0, offset = 0, hasMore = true;
  while (hasMore) {
    process.stdout.write(`  offset=${offset}...`);
    try {
      const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?num=100&offset=${offset}`);
      if (!res.ok) { console.log(` SKIP`); break; }
      const json = (await res.json()) as { data: Record<string, unknown>[]; meta?: { rows_remaining: number } };
      const cards: Card[] = [];
      const details: YugiohDetail[] = [];
      for (const c of json.data) {
        const id = `yugioh-${c.id as number}`;
        const cs = (c.card_sets as { set_name: string; set_code: string; set_rarity: string }[] | undefined)?.[0];
        const img = (c.card_images as { image_url: string; image_url_small: string }[] | undefined)?.[0];
        const pr = (c.card_prices as { tcgplayer_price: string }[] | undefined)?.[0]?.tcgplayer_price;
        cards.push({ id, externalId: String(c.id), name: c.name as string, gameType: "YUGIOH",
          setName: cs?.set_name ?? null, setCode: cs?.set_code ?? null,
          rarity: YGO[cs?.set_rarity ?? ""] ?? "RARE",
          imageUrl: img?.image_url ?? img?.image_url_small ?? null, marketPrice: pr ? parseFloat(pr) || null : null });
        details.push({ cardId: id, cardType: (c.type as string) ?? null, attribute: (c.attribute as string) ?? null,
          level: (c.level as number) ?? null, attack: (c.atk as number) ?? null,
          defense: (c.def as number) ?? null, race: (c.race as string) ?? null,
          archetype: (c.archetype as string) ?? null });
      }
      const count = await bulkUpsertCards(cards);
      await bulkInsertYugiohDetails(details);
      console.log(` ${count}`);
      total += count;
      hasMore = (json.meta?.rows_remaining ?? 0) > 0;
      offset += 100;
    } catch (e) { console.log(` ERR: ${e instanceof Error ? e.message : e}`); break; }
    await delay(200);
  }
  console.log(`  TOTAL: ${total}`);
  return total;
}

// ═══════════════════════════════════════════════════
// MTG
// ═══════════════════════════════════════════════════

const MTG: Record<string, Rarity> = {
  common: "COMMON", uncommon: "UNCOMMON", rare: "RARE", mythic: "ULTRA_RARE", special: "SPECIAL", bonus: "SPECIAL",
};
const MTG_TYPES = new Set(["expansion", "core", "masters", "draft_innovation"]);

async function importAllMtg(): Promise<number> {
  console.log("\n══ MTG ══");
  const setsRes = await fetch("https://api.scryfall.com/sets");
  if (!setsRes.ok) { console.error("  Sets failed"); return 0; }
  const setsJson = (await setsRes.json()) as { data: { code: string; name: string; set_type: string; released_at: string }[] };
  const sets = setsJson.data.filter(s => MTG_TYPES.has(s.set_type)).sort((a, b) => b.released_at.localeCompare(a.released_at));
  console.log(`  ${sets.length} sets`);
  let total = 0;

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    process.stdout.write(`  [${i+1}/${sets.length}] ${set.name} (${set.code})...`);
    try {
      let setCount = 0;
      let url: string | null = `https://api.scryfall.com/cards/search?q=set:${set.code}&order=set`;
      while (url) {
        await delay(120);
        const res = await fetch(url);
        if (!res.ok) { if (res.status === 404) break; break; }
        const json = (await res.json()) as { data: Record<string, unknown>[]; has_more: boolean; next_page?: string };
        const cards: Card[] = [];
        const details: MtgDetail[] = [];
        for (const c of json.data) {
          const id = `mtg-${c.id as string}`;
          const iu = c.image_uris as { normal: string; small: string } | undefined;
          const cf = c.card_faces as { image_uris?: { normal: string; small: string } }[] | undefined;
          const pr = (c.prices as { usd: string | null })?.usd;
          cards.push({ id, externalId: c.id as string, name: c.name as string, gameType: "MTG",
            setName: c.set_name as string, setCode: c.set as string,
            rarity: MTG[(c.rarity as string)] ?? "RARE",
            imageUrl: iu?.normal ?? cf?.[0]?.image_uris?.normal ?? null,
            marketPrice: pr ? parseFloat(pr) || null : null });
          details.push({ cardId: id, manaCost: (c.mana_cost as string) ?? null, cmc: (c.cmc as number) ?? null,
            colors: (c.colors as string[]) ?? [], typeLine: (c.type_line as string) ?? null,
            oracleText: (c.oracle_text as string) ?? null, power: (c.power as string) ?? null,
            toughness: (c.toughness as string) ?? null, loyalty: (c.loyalty as string) ?? null });
        }
        const count = await bulkUpsertCards(cards);
        await bulkInsertMtgDetails(details);
        setCount += count;
        url = json.has_more && json.next_page ? json.next_page : null;
      }
      console.log(` ${setCount}`);
      total += setCount;
    } catch (e) { console.log(` ERR: ${e instanceof Error ? e.message : e}`); }
    await delay(300);
  }
  console.log(`  TOTAL: ${total}`);
  return total;
}

// ═══════════════════════════════════════════════════
// ONE PIECE
// ═══════════════════════════════════════════════════

const OP: Record<string, Rarity> = {
  C: "COMMON", UC: "UNCOMMON", R: "RARE", SR: "SUPER_RARE", SEC: "SECRET_RARE",
  L: "SPECIAL", SP: "SPECIAL", P: "SPECIAL", TR: "SPECIAL",
};
interface OPRaw { card_name: string; card_set_id: string; set_id: string; set_name: string; rarity: string; card_color: string; card_type: string; card_cost: string | null; card_power: string | null; counter_amount: number | null; attribute: string | null; card_image: string; market_price: number | null; }

function parseOP(raw: OPRaw[]): { cards: Card[]; details: OnepieceDetail[] } {
  const cards: Card[] = [];
  const details: OnepieceDetail[] = [];
  for (const c of raw) {
    const id = `onepiece-${c.card_set_id}`;
    cards.push({ id, externalId: c.card_set_id, name: c.card_name, gameType: "ONEPIECE",
      setName: c.set_name, setCode: c.set_id, rarity: OP[c.rarity] ?? "RARE",
      imageUrl: c.card_image, marketPrice: c.market_price });
    details.push({ cardId: id, color: c.card_color ?? null,
      cost: c.card_cost ? parseInt(c.card_cost, 10) || null : null,
      power: c.card_power ? parseInt(c.card_power, 10) || null : null,
      counter: c.counter_amount ?? null, attribute: c.attribute ?? null, cardType: c.card_type ?? null });
  }
  return { cards, details };
}

async function importAllOnePiece(): Promise<number> {
  console.log("\n══ ONE PIECE ══");
  const setsRes = await fetch("https://optcgapi.com/api/allSets/");
  if (!setsRes.ok) { console.error("  Sets failed"); return 0; }
  const sets = (await setsRes.json()) as { set_id: string; set_name: string }[];
  console.log(`  ${sets.length} sets`);
  let total = 0;

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    process.stdout.write(`  [${i+1}/${sets.length}] ${set.set_name} (${set.set_id})...`);
    try {
      const res = await fetch(`https://optcgapi.com/api/sets/${encodeURIComponent(set.set_id)}/`);
      if (!res.ok) { console.log(" SKIP"); continue; }
      const { cards, details } = parseOP((await res.json()) as OPRaw[]);
      const count = await bulkUpsertCards(cards);
      await bulkInsertOnepieceDetails(details);
      console.log(` ${count}`);
      total += count;
    } catch (e) { console.log(` ERR: ${e instanceof Error ? e.message : e}`); }
    await delay(150);
  }

  process.stdout.write("  Starters...");
  try {
    const res = await fetch("https://optcgapi.com/api/allSTCards/");
    if (res.ok) {
      const { cards, details } = parseOP((await res.json()) as OPRaw[]);
      const count = await bulkUpsertCards(cards);
      await bulkInsertOnepieceDetails(details);
      console.log(` ${count}`);
      total += count;
    }
  } catch { /* skip */ }

  console.log(`  TOTAL: ${total}`);
  return total;
}

// ═══════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  TCG — Raw SQL Bulk Seed (fast)             ║");
  console.log("╚══════════════════════════════════════════════╝");
  const start = Date.now();

  let p = 0, y = 0, m = 0, o = 0;
  try { p = await importAllPokemon(); } catch (e) { console.error(`\n  POKEMON FAILED: ${e}`); }
  try { y = await importAllYugioh(); } catch (e) { console.error(`\n  YUGIOH FAILED: ${e}`); }
  try { m = await importAllMtg(); } catch (e) { console.error(`\n  MTG FAILED: ${e}`); }
  try { o = await importAllOnePiece(); } catch (e) { console.error(`\n  ONEPIECE FAILED: ${e}`); }

  // Generate static JSON files for CDN-served set browsing
  console.log("\n══ GENERATING STATIC SETS ══");
  const fs = await import("fs");
  const path = await import("path");
  const outDir = path.join(process.cwd(), "public", "data");
  fs.mkdirSync(outDir, { recursive: true });
  for (const game of ["POKEMON", "YUGIOH", "MTG", "ONEPIECE"]) {
    const { rows } = await pool.query(
      `SELECT "setName", MIN("setCode") as "setCode", "gameType", COUNT(id)::int as "cardCount"
       FROM cards WHERE "setName" IS NOT NULL AND "gameType" = $1
       GROUP BY "setName", "gameType" ORDER BY "setName" ASC`, [game]);
    fs.writeFileSync(path.join(outDir, `sets-${game}.json`), JSON.stringify(rows));
    console.log(`  ${game}: ${rows.length} sets`);
  }

  const s = Math.round((Date.now() - start) / 1000);
  console.log(`\n══ DONE ══  Pokemon:${p} YGO:${y} MTG:${m} OP:${o} = ${p+y+m+o} cards in ${s}s`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });

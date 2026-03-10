/**
 * Pre-generates static JSON files for card sets data.
 * These are served directly by CDN — zero DB queries for browsing.
 * Run after seed or card import: npx tsx scripts/generate-static-sets.ts
 */
import "dotenv/config";
import pg from "pg";
import fs from "fs";
import path from "path";

const pool = new pg.Pool({
  connectionString: process.env["DATABASE_URL"],
  max: 2,
});

const GAMES = ["POKEMON", "YUGIOH", "MTG", "ONEPIECE"] as const;
const OUT_DIR = path.join(process.cwd(), "public", "data");

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const game of GAMES) {
    const { rows } = await pool.query(
      `SELECT "setName", MIN("setCode") as "setCode", "gameType", COUNT(id)::int as "cardCount"
       FROM cards WHERE "setName" IS NOT NULL AND "gameType" = $1
       GROUP BY "setName", "gameType"
       ORDER BY "setName" ASC`,
      [game],
    );
    const filePath = path.join(OUT_DIR, `sets-${game}.json`);
    fs.writeFileSync(filePath, JSON.stringify(rows));
    console.log(`  ${game}: ${rows.length} sets → ${filePath}`);
  }

  await pool.end();
  console.log("\nDone! Static sets files generated.");
}

main().catch((e) => { console.error(e); process.exit(1); });

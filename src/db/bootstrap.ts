import { pool } from "./index";
import { INIT_STATEMENTS } from "./schema-init";

/**
 * Runtime schema bootstrap: on a brand-new database (e.g. Vercel Postgres)
 * the app creates its own tables on first request — no terminal needed.
 * Also applies incremental column migrations to existing databases.
 */
let running: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!running) running = run().catch((e) => {
    running = null;
    console.error("[marea] schema bootstrap:", e);
  });
  return running;
}

const EXTRA_COLUMNS: { table: string; column: string; ddl: string }[] = [
  { table: "users", column: "stripe_session", ddl: 'ALTER TABLE "users" ADD COLUMN "stripe_session" text' },
];

async function run() {
  const chk = await pool.query("SELECT to_regclass('public.users') AS t");
  if (!chk.rows[0]?.t) {
    for (const stmt of INIT_STATEMENTS) {
      await pool.query(stmt);
    }
  }
  // incremental columns (existing DBs)
  for (const { table, column, ddl } of EXTRA_COLUMNS) {
    const r = await pool.query(
      "SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2",
      [table, column]
    );
    if (r.rowCount === 0) await pool.query(ddl);
  }
}

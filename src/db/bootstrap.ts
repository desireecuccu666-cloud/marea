import { pool } from "./index";
import { INIT_STATEMENTS } from "./schema-init";

/**
 * Runtime schema bootstrap: on a brand-new database (e.g. Vercel Postgres)
 * the app creates its own tables on first request — no terminal needed.
 * If the schema already exists (sandbox/legacy DB), it is a no-op.
 */
let running: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!running) running = run().catch((e) => {
    running = null;
    console.error("[marea] schema bootstrap:", e);
  });
  return running;
}

async function run() {
  const chk = await pool.query("SELECT to_regclass('public.users') AS t");
  if (chk.rows[0]?.t) return; // schema già presente
  for (const stmt of INIT_STATEMENTS) {
    await pool.query(stmt);
  }
}

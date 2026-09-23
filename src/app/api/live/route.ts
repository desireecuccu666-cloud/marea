import { eq, and, or } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { jerr, needUser } from "@/lib/server";
import { subscribe, dmTarget } from "@/lib/liveBus";
import { ensureLiveEngine } from "@/lib/liveEngine";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = await needUser();
  if (!u) return jerr("nope", 401);
  ensureLiveEngine();

  const target = new URL(req.url).searchParams.get("target") ?? "";
  if (target.startsWith("dm:")) {
    const dmId = target.slice(3);
    const [dm] = await db.select().from(s.dms).where(eq(s.dms.id, dmId)).limit(1);
    if (!dm || (dm.a !== u.id && dm.b !== u.id)) return jerr("forbidden", 403);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const push = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: hb ${Date.now()}\n\n`));
        } catch {
          closed = true;
        }
      }, 20000);
      const unsub = subscribe(target, (event, data) => push(event, data));
      push("hello", { ok: true, at: Date.now() });
      const cleanup = () => {
        closed = true;
        clearInterval(heartbeat);
        unsub();
        try {
          controller.close();
        } catch {}
      };
      req.signal.addEventListener("abort", cleanup);
      // safety cap: close after 30 min
      setTimeout(cleanup, 30 * 60000).unref?.();
    },
    cancel() {},
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

import "node:process";
/** In-process pub/sub for SSE real-time rooms & DMs. */

type Emit = (event: string, data: unknown) => void;
const subs = new Map<string, Set<Emit>>();

export function subscribe(target: string, fn: Emit): () => void {
  let set = subs.get(target);
  if (!set) {
    set = new Set();
    subs.set(target, set);
  }
  set.add(fn);
  return () => {
    set?.delete(fn);
  };
}

export function emit(target: string, event: string, data: unknown) {
  const set = subs.get(target);
  if (!set) return;
  for (const fn of set) {
    try {
      fn(event, data);
    } catch {
      set.delete(fn);
    }
  }
}

export const roomTarget = (slug: string) => `room:${slug}`;
export const dmTarget = (id: string) => `dm:${id}`;

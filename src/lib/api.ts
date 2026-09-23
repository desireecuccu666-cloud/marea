/** Browser-side fetch wrapper (safe to import from client components). */
export async function api(path: string, body?: unknown): Promise<any> {
  const res = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "error") as Error & { code?: number };
    err.code = res.status;
    throw err;
  }
  return data;
}

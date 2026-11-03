import "server-only";

/** Forward a form submission to a configured webhook, or log it during development. */
export async function forward(envVar: string, type: string, payload: Record<string, unknown>) {
  const url = process.env[envVar];
  if (!url) {
    console.info(`[${type}] received (set ${envVar} to forward submissions)`);
    return { forwarded: false };
  }
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, ...payload, receivedAt: new Date().toISOString() }) });
  if (!res.ok) throw new Error(`${type} webhook failed (${res.status})`);
  return { forwarded: true };
}

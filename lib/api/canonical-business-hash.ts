function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

export function canonicalBusinessHashInput(scope: string, body: unknown = {}, params: Record<string, unknown> = {}): string {
  const source: Record<string, unknown> = body && typeof body === "object" && !Array.isArray(body)
    ? { ...(body as Record<string, unknown>) }
    : { value: body };
  delete source.idempotencyKey;
  delete source["idempotency-key"];
  return stableStringify({ scope, params: params || {}, body: source });
}

export async function canonicalBusinessHash(scope: string, body: unknown = {}, params: Record<string, unknown> = {}): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalBusinessHashInput(scope, body, params));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256(text: string): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error("WebCrypto is unavailable.");
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return toHex(digest);
}

export interface BlindLock {
  hash: string;
  createdAt: string;
}

export async function lockPrediction(payload: unknown, createdAt = new Date().toISOString()): Promise<BlindLock> {
  const canonical = JSON.stringify({ createdAt, payload });
  return { hash: await sha256(canonical), createdAt };
}

export async function verifyPredictionLock(payload: unknown, lock: BlindLock): Promise<boolean> {
  const canonical = JSON.stringify({ createdAt: lock.createdAt, payload });
  return (await sha256(canonical)) === lock.hash;
}

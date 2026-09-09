export interface EncryptedBackup {
  version: 1;
  algorithm: "AES-GCM";
  kdf: "PBKDF2-SHA256";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary,(character) => character.charCodeAt(0));
}

async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name:"PBKDF2", salt, iterations, hash:"SHA-256" },
    material,
    { name:"AES-GCM", length:256 },
    false,
    ["encrypt","decrypt"]
  );
}

export async function encryptBackup(payload: unknown, password: string): Promise<EncryptedBackup> {
  if (!password) throw new Error("Backup password is required.");
  const iterations = 250000;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password,salt,iterations);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const encrypted = await crypto.subtle.encrypt({ name:"AES-GCM", iv },key,plaintext);
  return {
    version:1,
    algorithm:"AES-GCM",
    kdf:"PBKDF2-SHA256",
    iterations,
    salt:bytesToBase64(salt),
    iv:bytesToBase64(iv),
    ciphertext:bytesToBase64(new Uint8Array(encrypted))
  };
}

export async function decryptBackup<T = unknown>(backup: EncryptedBackup, password: string): Promise<T> {
  const salt = base64ToBytes(backup.salt);
  const iv = base64ToBytes(backup.iv);
  const key = await deriveKey(password,salt,backup.iterations);
  const decrypted = await crypto.subtle.decrypt(
    { name:"AES-GCM", iv },
    key,
    base64ToBytes(backup.ciphertext)
  );
  return JSON.parse(new TextDecoder().decode(decrypted)) as T;
}

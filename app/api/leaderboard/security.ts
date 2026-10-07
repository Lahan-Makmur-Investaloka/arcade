export const HEROES = new Set(["timmy", "eldric", "kirana", "adelia", "dylan"]);

export const cleanName = (value: unknown) =>
  String(value ?? "").trim().replace(/\s+/g, " ").slice(0, 18);

export const normalizeName = (value: string) => value.toLocaleLowerCase("id-ID");

export const validName = (name: string) =>
  name.length >= 2 && /^[\p{L}\p{N} ._'-]+$/u.test(name);

export async function playerKeyHash(value: unknown) {
  const playerKey = String(value ?? "");
  if (!/^[a-f0-9]{64}$/i.test(playerKey)) return null;
  const bytes = new TextEncoder().encode(playerKey.toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}


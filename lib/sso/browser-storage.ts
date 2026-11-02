export const authEventKey = 'tekad-arcade-auth-event';
export const authUserKey = 'tekad-arcade-auth-user';

export function clearArcadeStorage(): void {
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    try {
      const storage = window[name];
      for (let i = storage.length - 1; i >= 0; i--) {
        const key = storage.key(i);
        if (key?.startsWith('tekad-') && key !== authEventKey && key !== authUserKey) storage.removeItem(key);
      }
    } catch { /* Authentication still works when browser storage is unavailable. */ }
  }
}

export function announceAccountChange(guid: string | null): void {
  try {
    if (guid) window.localStorage.setItem(authUserKey, guid);
    else window.localStorage.removeItem(authUserKey);
    window.localStorage.setItem(authEventKey, crypto.randomUUID());
  } catch { /* Other tabs will also check on focus and every 60 seconds. */ }
}

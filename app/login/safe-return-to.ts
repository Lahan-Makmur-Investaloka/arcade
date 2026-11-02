const reservedPaths = new Set([
  "/signin-with-chatgpt",
  "/signout-with-chatgpt",
  "/callback",
  "/login",
]);

export function safeReturnTo(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value)) return "/";

  try {
    const url = new URL(value, "https://tekad.local");
    let decoded = decodeURIComponent(url.pathname);
    for (let i = 0; i < 4; i++) {
      if (decoded.includes('\\') || decoded.startsWith('//') || /[\u0000-\u001f\u007f]/.test(decoded)) return '/';
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      if (i === 3) return '/';
      decoded = next;
    }
    const path = new URL(decoded.replace(/\/{2,}/g, '/'), 'https://tekad.local').pathname.replace(/\/+$/, '').replace(/\.rsc$/, '');
    if (url.origin !== "https://tekad.local" || reservedPaths.has(path) || path === '/api/auth' || path.startsWith('/api/auth/')) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

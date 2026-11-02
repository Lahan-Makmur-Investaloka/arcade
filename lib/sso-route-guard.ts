const protectedRoots = [
  "/big-two",
  "/eldrics-workshop",
  "/sejuta-poin",
  "/switch-run",
  "/tekad-jrpg",
  "/chronicles",
  "/tekad-racing",
  "/jigsaw",
  "/tangga-wawasan",
];

export function normalizedPath(pathname: string): string | null {
  try {
    let path = pathname;
    for (let i = 0; i < 4; i++) {
      const decoded = decodeURIComponent(path);
      if (decoded === path) {
        const collapsed = path.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
        return new URL(collapsed, 'https://tekad.local').pathname.replace(/\.rsc(?=\/?$)/, '');
      }
      path = decoded;
    }
    return null;
  } catch { return null; }
}

export function isProtectedArcadePath(pathname: string): boolean {
  const path = normalizedPath(pathname);
  if (!path) return true;
  return protectedRoots.some((root) => path === root || path === `${root}.rsc` || path.startsWith(`${root}/`));
}

export function loginRedirect(request: Request): Response | null {
  const current = new URL(request.url);
  if (!isProtectedArcadePath(current.pathname)) return null;

  const login = new URL("/login", current);
  login.searchParams.set("returnTo", `${current.pathname}${current.search}`);
  return new Response(null, { status: 302, headers: { Location: login.href, 'Cache-Control': 'no-store' } });
}

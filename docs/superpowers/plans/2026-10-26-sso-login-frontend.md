# SSO Login Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let visitors browse TEKAD Arcade while every game launch and direct game URL leads to an SSO-ready static login screen that preserves its intended destination.

**Architecture:** Keep the home page client-side and build login URLs from each selected game's existing `href`. Centralize the protected route matcher in a framework-neutral helper that the Cloudflare Worker checks before its application and Chronicles static-asset handlers; add an App Router `/login` page that validates and displays the local return path but makes no network request.

**Tech Stack:** Next.js App Router, React 19, TypeScript, CSS, Node test runner, esbuild/linkedom home-page test harness.

**Spec:** `docs/superpowers/specs/2026-10-26-sso-login-frontend-design.md`

## Global Constraints

- No OAuth provider, API request, token, cookie, account record, or logout flow.
- Preserve the existing anonymous game, leaderboard, and multiplayer behavior.
- The Worker treats every visitor as unauthenticated until OAuth session validation is implemented, so every protected game URL redirects to login.
- Do not use `app/chatgpt-auth.ts`; it remains ignored locally.

## Review Focus

- Every featured and catalogue launch URL includes its exact game path as an encoded `returnTo` value.
- The header login action returns to `/`, not a guessed game URL.
- An external, protocol-relative, malformed, or ChatGPT-reserved return URL cannot become a login destination.
- A valid nested route with query string and fragment remains usable as the post-login destination.
- The direct `/chronicles/` static-asset route is guarded before it is served.
- The placeholder login action does not make a network request or represent the visitor as authenticated.

---

### Task 1: Guarded launch URLs in the arcade home

**Files:**
- Modify: `app/arcade-home.tsx`
- Modify: `app/arcade-home.css`
- Modify: `tests/arcade-home.test.mjs`

**Interfaces:**
- Produces: `loginPath(returnTo: string): string` for the header and game links in `ArcadeHome`.
- Consumes: `ArcadeGame.href` paths from `app/arcade-catalog.ts`.

- [ ] **Step 1: Update the home-page test to expect `/login?returnTo=...` for the featured game and every catalogue game, and `/login?returnTo=%2F` for the header control.**

- [ ] **Step 2: Run the focused home-page test to verify it fails.**

Run: `ARCADE_DOM_PATH=<linkedom path> node --test tests/arcade-home.test.mjs`

Expected: FAIL because the home still links directly to game paths and has no header login control.

- [ ] **Step 3: Implement `loginPath(returnTo: string): string` in `app/arcade-home.tsx` and use it for the header, featured-game, and catalogue links.**

Use `encodeURIComponent` on the existing game path. Keep browser access to the arcade and its game selection unchanged.

- [ ] **Step 4: Add the compact header login-control styles in `app/arcade-home.css`, matching the existing glass-button treatment and small-screen header layout.**

- [ ] **Step 5: Run the focused home-page test to verify it passes.**

Run: `ARCADE_DOM_PATH=<linkedom path> node --test tests/arcade-home.test.mjs`

Expected: PASS or explicit skip when the repository has no linkedom path configured.

### Task 2: Static SSO-ready login page

**Files:**
- Create: `app/login/page.tsx`
- Create: `app/login/login.css`
- Create: `tests/login-page.test.mjs`

**Interfaces:**
- Produces: `LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> })`.
- Produces: `safeReturnTo(value: string | undefined): string` returning a same-origin, non-reserved application path or `/`.
- Consumes: `returnTo` from the login page query string.

- [ ] **Step 1: Write source-level tests for `safeReturnTo` through the login page covering `/switch-run`, a query-and-fragment route, `https://external.example`, `//external.example`, malformed values, and the reserved ChatGPT authentication paths.**

- [ ] **Step 2: Run the login-page test to verify it fails because the page does not exist.**

Run: `node --test tests/login-page.test.mjs`

Expected: FAIL with a missing module or missing page source assertion.

- [ ] **Step 3: Implement the async server `LoginPage` and `safeReturnTo` in `app/login/page.tsx`.**

Render the TEKAD Arcade identity, a short statement that login is required to play, the post-login destination name/path, a button that reports SSO setup is still in progress, and a link back to the arcade. The button must not fetch or set session state.

- [ ] **Step 4: Implement responsive visual styling in `app/login/login.css`.**

Use the dark, atmospheric arcade palette and the existing branding image; honor focus visibility and reduced-motion preferences.

- [ ] **Step 5: Run the login-page test to verify it passes.**

Run: `node --test tests/login-page.test.mjs`

Expected: PASS.

### Task 3: Worker direct-route guard

**Files:**
- Create: `lib/sso-route-guard.ts`
- Modify: `worker/index.ts`
- Create: `tests/sso-route-guard.test.mts`

**Interfaces:**
- Produces: `isProtectedArcadePath(pathname: string): boolean`.
- Produces: `loginRedirect(request: Request): Response | null`.
- Consumes: a request URL and the exact game paths in `app/arcade-catalog.ts`.
- Consumed by: `worker.fetch()` before the Chronicles and Vinext handlers.

- [ ] **Step 1: Write failing tests for exact game paths, a nested Big 2 path, `/chronicles/`, a route with a query string, the arcade home, `/login`, and a public asset.**

The tests assert a `302` response with `/login?returnTo=...` for protected paths, preserve the query string in `returnTo`, and expect `null` for public paths.

- [ ] **Step 2: Run the focused Worker-guard test to verify it fails.**

Run: `node --experimental-strip-types --test tests/sso-route-guard.test.mts`

Expected: FAIL because the route guard module does not exist.

- [ ] **Step 3: Implement `isProtectedArcadePath` and `loginRedirect` in `lib/sso-route-guard.ts`.**

Match every current game route and nested game route, construct a same-origin login URL from the incoming request URL, and use a temporary unauthenticated result. Do not check `localStorage`, cookies, or an API.

- [ ] **Step 4: Call `loginRedirect(request)` at the beginning of `worker.fetch()` in `worker/index.ts`.**

Return a non-null redirect before the `/chronicles/` asset exception or `handler.fetch`.

- [ ] **Step 5: Run the focused Worker-guard test to verify it passes.**

Run: `node --experimental-strip-types --test tests/sso-route-guard.test.mts`

Expected: PASS.

### Task 4: Validate the frontend artifact

**Files:**
- Modify: `docs/superpowers/specs/2026-10-26-sso-login-frontend-design.md` only if implementation requires a documented deviation.

**Interfaces:**
- Consumes: guarded home links, `/login` page, and Worker redirect from Tasks 1–3.
- Produces: a buildable frontend with no authentication side effects.

- [ ] **Step 1: Run focused SSO frontend tests.**

Run: `node --test tests/login-page.test.mjs`, `node --experimental-strip-types --test tests/sso-route-guard.test.mts`, and, when `ARCADE_DOM_PATH` is configured, `ARCADE_DOM_PATH=<linkedom path> node --test tests/arcade-home.test.mjs`

Expected: PASS (or the documented environment skip for the linkedom test).

- [ ] **Step 2: Run the production build.**

Run: `npm run build`

Expected: build and artifact validation complete successfully.

- [ ] **Step 3: Inspect the rendered `/login?returnTo=%2Fswitch-run` response and confirm it contains login copy, the Switch Run return path, and no OAuth/network behavior.**

- [ ] **Step 4: Commit.**

```bash
git add app/arcade-home.tsx app/arcade-home.css app/login lib/sso-route-guard.ts worker/index.ts tests/arcade-home.test.mjs tests/login-page.test.mjs tests/sso-route-guard.test.mts docs/superpowers
git commit -m "feat: add SSO-ready login frontend"
```

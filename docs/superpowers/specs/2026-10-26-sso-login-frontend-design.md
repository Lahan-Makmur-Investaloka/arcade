# SSO login frontend

## Intent

Prepare TEKAD Arcade for SSO without consuming an OAuth API yet. Visitors can
browse the arcade, while starting a game or opening a game URL directly requires
a login step.

## Goals

- Add a **Masuk** control to the arcade header.
- Add a static `/login` page matching the arcade visual language.
- Direct a visitor who selects **Main** from the featured game or catalogue to
  `/login?returnTo=<game path>`.
- Redirect every protected arcade URL at the Worker before the game application
  or static Chronicles assets can be served.
- Preserve the intended game path so the future OAuth callback can return the
  visitor there.

## Non-goals

- No OAuth provider, API request, token, cookie, account data, or logout.
- No authentication provider or persisted session exists yet. The Worker blocks
  every protected route until its future session check replaces the temporary
  unauthenticated result.
- No change to the existing anonymous game, leaderboard, or multiplayer data.

## Approaches considered

1. Guard each **Main** action and use a separate login page. This keeps the
   existing browse experience and gives the eventual OAuth redirect a stable
   return destination. **Selected.**
2. Make `/login` a global entry gate. This conflicts with the requested
   ability to browse the arcade before logging in.
3. Open login in a dialog. It is harder to complete and resume an OAuth
   redirect consistently.

## Frontend behavior

The header's **Masuk** control links to `/login?returnTo=/`. Every **Main** link
in the home screen and catalogue instead targets `/login`, with its game's
path as `returnTo`. The Worker maintains one shared allowlist of protected game
paths and redirects a request to any of them to `/login`, preserving the path
and query string in `returnTo`. It performs this check before the special
Chronicles static-asset handler.

The static login page explains that a TEKAD account is needed to play and
presents one button that reports SSO is being prepared. Until an OAuth endpoint
exists, that button does not impersonate a completed sign-in; consequently no
visitor can reach a protected game route.

When an SSO provider is chosen, the placeholder will be replaced with a redirect
to the application's SSO-start endpoint. The endpoint must validate `returnTo`,
create the session, and return the user to that same path. The Worker redirect
will then consult that server-side session instead of treating all requests as
anonymous.

## Files expected to change

- `app/arcade-home.tsx` — header control and guarded game links.
- `app/arcade-home.css` — header login control styling.
- `app/login/page.tsx` and `app/login/login.css` — static SSO-ready login UI.
- `worker/index.ts` and a shared protected-route helper — direct-route guard.

`app/chatgpt-auth.ts` remains ignored locally and is not used by this design.

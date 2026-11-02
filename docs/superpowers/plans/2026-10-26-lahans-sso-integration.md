# Lahans SSO integration

Implement the contract in [the PRD](../../../prd-sso-integration.md) in the existing Cloudflare Worker. The user requested continued implementation with that contract.

## Decisions

- Use a same-origin server intermediary: `SSO_API_BASE_URL`, `SSO_APP_NAME`, and `SSO_APP_KEY` are server configuration. Never expose the app key or upstream tokens through frontend environment variables.
- Store sessions in the existing D1 binding using a random opaque HttpOnly, SameSite=Lax cookie. Store only the profile fields needed for authentication. Use a D1 lease and revision check to serialize rotating tokens across Worker instances and prevent logout from resurrecting a session.
- Create a session only after both login and a fresh matching profile succeed. Parse UTC timestamps with or without an explicit timezone; reject invalid or expired values. Refresh never falls back to a new anonymous application token for a logged-in user: backend has not confirmed that it preserves identity.
- Guard game routes and game APIs at the Worker. Keep browsing public. The existing game ownership keys remain the domain API's responsibility; this change does not migrate game records into Lahans accounts.
- Check sessions on focus, visibility, and every 60 seconds; keep authentication data out of browser storage. Clear only Arcade storage on account change/logout and reload other tabs to prevent stale account UI.

## Tasks

1. Write and run failing authentication integration tests with a controlled upstream and a real SQLite D1 adapter. Include token bootstrap/header contract, profile gating, expiry/rotation, concurrent refresh, 401 limits, logout failure/races, CSRF, secret redaction, and private routes.
2. Implement a small upstream client and D1 session router, plus the SQL migration/schema. Update the Worker guard and safe return-path validation.
3. Add environment templates and development loading. Replace the placeholder with an accessible login form and a global session provider with logout/account controls.
4. Run focused auth and frontend tests, type/lint checks, and the configured build/test commands where the local environment supports them. Document setup, migrations, confirmed behavior, and staging acceptance work that requires backend credentials.

## Review focus

No token/app key in browser responses or bundles; no success until profile matches; cross-origin mutations rejected; 403 not refreshed; token retries bounded; distributed refresh and deletion races; no return-path loop; no game/API bypass via encoded paths or RSC; unrelated storage/cookies preserved.

## Validation ledger

- Baseline: 6/9 existing auth tests passed. Existing failures: malformed/duplicate `returnTo`, encoded/RSC protected route recognition.
- Local Node is installed but executable access requires sandbox escalation. Git's macOS developer tools are unavailable in the sandbox. Work stays in the user-selected checkout; no commit or deployment requested.
- Implemented the upstream client, D1 sessions/leases, Worker guards, env templates, accessible login form, session lifecycle and logout. User requested hiding the displayed return destination; `returnTo` remains functional.
- Review fixes: normalize slash/RSC variations before auth; revoke D1 sessions without late cookie deletion; revision checks on lease acquisition and every token write; lease-scoped invalidation. Real Worker tests caught unsupported `redirect: error` and incorrect native fetch receiver; use manual redirects and an unbound fetch reference.
- Deliberate BFF adaptation: logout leaves an unusable opaque cookie pointer rather than risking deletion of a newer login cookie; backend tokens are revoked/removed server-side. Initial cookie expiry remains the browser session cap. Existing game records are not migrated to Lahans ownership.
- Focused auth/Worker/UI tests and TypeScript passed. Direct Vinext build and artifact validation passed. Browser QA verified login → intended Jigsaw page → account name → logout. Client bundle scan found no server configuration in 27 JS files. The temporary dummy SSO backend/server were stopped.
- Repository-wide lint reports 59 errors / 88 warnings in existing game/tests. The original rendered preview metadata test fails because the layout has no `codex-preview=development` meta. `npm test` wrapper stops without GNU timeout on this Mac. These unrelated checks were reported rather than changed.
- Staging remains pending: real base URL/app credentials and the backend decisions listed in PRD section 12. No deployment or production API call performed.

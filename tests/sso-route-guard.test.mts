import assert from "node:assert/strict";
import test from "node:test";
import { isProtectedArcadePath, loginRedirect } from "../lib/sso-route-guard.ts";

test("identifies every game route and nested game route as protected", () => {
  for (const path of ["/big-two", "/big-two/portrait", "/eldrics-workshop", "/sejuta-poin", "/switch-run", "/tekad-jrpg", "/chronicles/", "/tekad-racing", "/jigsaw"]) {
    assert.equal(isProtectedArcadePath(path), true, path);
  }
});

test("identifies encoded and RSC game requests as protected", () => {
  assert.equal(isProtectedArcadePath("/%73witch-run"), true);
  assert.equal(isProtectedArcadePath("/big-two.rsc"), true);
});

test("leaves the arcade, login page, and public assets available", () => {
  for (const path of ["/", "/login", "/branding/icon-192.png"]) {
    assert.equal(isProtectedArcadePath(path), false, path);
  }
});

test("redirects a direct game request to login and preserves its destination", () => {
  const response = loginRedirect(new Request("https://arcade.example/big-two/portrait?character=timmy"));
  assert.equal(response?.status, 302);
  const location = new URL(response?.headers.get("location") ?? "", "https://arcade.example");
  assert.equal(location.pathname, "/login");
  assert.equal(location.searchParams.get("returnTo"), "/big-two/portrait?character=timmy");
});

test("does not redirect a public request", () => {
  assert.equal(loginRedirect(new Request("https://arcade.example/")), null);
});

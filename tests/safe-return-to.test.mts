import assert from "node:assert/strict";
import test from "node:test";
import { safeReturnTo } from "../app/login/safe-return-to.ts";

test("safeReturnTo keeps a local game destination", () => {
  assert.equal(safeReturnTo("/switch-run"), "/switch-run");
});

test("safeReturnTo keeps local query strings and fragments", () => {
  assert.equal(safeReturnTo("/big-two/portrait?character=timmy#table"), "/big-two/portrait?character=timmy#table");
});

test("safeReturnTo rejects external, malformed, and reserved authentication paths", () => {
  for (const value of ["https://external.example", "//external.example", "not-a-path", "/%GG", "/signin-with-chatgpt", "/signin-with-chatgpt/", "/%73ignin-with-chatgpt", "/signout-with-chatgpt", "/callback", "/login", "/login.rsc", "/login//", "/api//auth/logout", "/api/auth/login.rsc"]) {
    assert.equal(safeReturnTo(value), "/", value);
  }
});

test("safeReturnTo rejects duplicate return destinations", () => {
  assert.equal(safeReturnTo(["/switch-run", "/big-two"]), "/");
});

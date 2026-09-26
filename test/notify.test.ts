import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app.js";

let server: Server;
let base: string;

before(() => {
  server = createApp().listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => server.close());

const notify = (body: unknown) =>
  fetch(`${base}/api/notify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

test("sends the default magic-link message", async () => {
  const res = await notify({ name: "Ada", email: "ada@example.com" });
  assert.equal(res.status, 202);
  const json = await res.json();
  assert.equal(json.to, "ada@example.com");
  assert.match(json.body, /^Hi Ada, sign in with this link: https:\/\/app\.northwind\.example\/login\?token=<redacted>$/);
});

test("supports a tenant template with a custom variable name", async () => {
  const res = await notify({ name: "Bo", email: "bo@example.com", bodyTemplate: "Hello <%= t.name %>", templateVariable: "t" });
  assert.equal((await res.json()).body, "Hello Bo");
});

test("rejects a request without name and email", async () => {
  assert.equal((await notify({})).status, 400);
});

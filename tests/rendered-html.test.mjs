import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function renderRoot() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("redirects the root route to the wedding invitation", async () => {
  const response = await renderRoot();
  assert.equal(response.status, 307);
  assert.equal(
    new URL(response.headers.get("location"), "http://localhost").pathname,
    "/invitation/index.html",
  );
});

test("ships the approved wedding photo and cool-neutral theme", async () => {
  const [sourceConfig, sourceStyles, sourceApp, builtConfig, builtStyles, builtApp, hero] =
    await Promise.all([
      readFile(new URL("../public/invitation/config.js", import.meta.url), "utf8"),
      readFile(new URL("../public/invitation/styles.css", import.meta.url), "utf8"),
      readFile(new URL("../public/invitation/app.js", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/invitation/config.js", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/invitation/styles.css", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/invitation/app.js", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/invitation/assets/wedding-hero.jpg", import.meta.url)),
    ]);

  assert.equal(builtConfig, sourceConfig);
  assert.equal(builtStyles, sourceStyles);
  assert.equal(builtApp, sourceApp);

  assert.match(sourceConfig, /heroImage:\s*"\.\/assets\/wedding-hero\.jpg"/);
  assert.match(sourceStyles, /--canvas:\s*#dfe7eb/);
  assert.match(sourceStyles, /--paper:\s*#f7f8f6/);
  assert.match(sourceStyles, /--sage:\s*#7d887b/);
  assert.match(sourceStyles, /aspect-ratio:\s*2\s*\/\s*3/);
  assert.match(sourceStyles, /object-fit:\s*contain/);
  assert.match(sourceApp, /我们的婚礼 · 2026 秋/);
  assert.doesNotMatch(sourceApp, /FRAME 06|FILM \/ 2026/);
  assert.match(sourceApp, /replyAnonymous/);
  assert.match(sourceApp, /lookupSeat/);

  assert.equal(hero[0], 0xff);
  assert.equal(hero[1], 0xd8);
  assert.ok(hero.byteLength > 100_000);
  assert.ok(hero.byteLength < 1_000_000);
});

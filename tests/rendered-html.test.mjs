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
  const [
    sourceConfig,
    sourceStyles,
    sourceApp,
    builtConfig,
    builtStyles,
    builtApp,
    hero,
  ] = await Promise.all([
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
  assert.match(sourceStyles, /--canvas:\s*#d7e3ee/);
  assert.match(sourceStyles, /--paper:\s*#f6f4ef/);
  assert.match(sourceStyles, /--paper-deep:\s*#e7e2d9/);
  assert.match(sourceStyles, /--sage:\s*#8fa3b8/);
  assert.match(sourceStyles, /--sage-dark:\s*#56697d/);
  assert.match(sourceStyles, /\.page--tinted\s*\{[\s\S]*background:\s*#f3f3f0/);
  assert.match(sourceStyles, /aspect-ratio:\s*2\s*\/\s*3/);
  assert.match(sourceStyles, /object-fit:\s*contain/);
  assert.match(sourceStyles, /\.cover__title\s*\{[\s\S]*position:\s*absolute/);
  assert.doesNotMatch(sourceStyles, /assets\/lace-|\.lace-accent/);
  assert.doesNotMatch(sourceApp, /lace-accent/);
  assert.match(sourceApp, /couple\.invitationLine/);
  assert.doesNotMatch(sourceApp, /mote&sally|cover__closing/);
  assert.match(sourceConfig, /invitationLine:\s*"诚邀您见证我们的婚礼"/);
  assert.match(sourceConfig, /groomPhone:\s*"13164039297"/);
  assert.match(sourceConfig, /bridePhone:\s*"16639311246"/);
  assert.match(sourceApp, /id="contactDialog"/);
  assert.match(sourceApp, /href="tel:\$\{escapeHtml\(contact\.phone\)\}"/);
  assert.doesNotMatch(sourceApp, /FRAME 06|FILM \/ 2026/);
  assert.match(sourceApp, /replyAnonymous/);
  assert.match(sourceApp, /lookupSeat/);

  assert.equal(hero[0], 0xff);
  assert.equal(hero[1], 0xd8);
  assert.ok(hero.byteLength > 100_000);
  assert.ok(hero.byteLength < 1_000_000);
});

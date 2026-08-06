import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("redirects the root route to the wedding invitation", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /redirect\("\/invitation\/index\.html"\)/);
});

test("ships the ordered, manually paged two-page wedding album", async () => {
  const [sourceData, sourceApp, sourceStyles, sourceConfig, builtData, builtApp, builtStyles, cover, firstPage, lastPage] =
    await Promise.all([
      readFile(new URL("../public/invitation/photo-data.js", import.meta.url), "utf8"),
      readFile(new URL("../public/invitation/app.js", import.meta.url), "utf8"),
      readFile(new URL("../public/invitation/styles.css", import.meta.url), "utf8"),
      readFile(new URL("../public/invitation/config.js", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/invitation/photo-data.js", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/invitation/app.js", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/invitation/styles.css", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/invitation/assets/photo-album/cover.jpg", import.meta.url)),
      readFile(new URL("../dist/client/invitation/assets/photo-album/01.jpg", import.meta.url)),
      readFile(new URL("../dist/client/invitation/assets/photo-album/12.jpg", import.meta.url)),
    ]);

  assert.equal(builtData, sourceData);
  assert.equal(builtApp, sourceApp);
  assert.equal(builtStyles, sourceStyles);
  assert.match(sourceData, /cover\.jpg/);
  assert.match(sourceData, /01\.jpg[\s\S]*02\.jpg[\s\S]*12\.jpg/);
  assert.match(sourceApp, /WEDDING_PHOTO_ALBUM/);
  assert.match(sourceApp, /pointerdown/);
  assert.match(sourceApp, /turnSpread/);
  assert.match(sourceApp, /photoAlbumLeftPage/);
  assert.match(sourceApp, /photoAlbumRightPage/);
  assert.match(sourceApp, /currentSpread = nextSpread;\s*showSpread\(currentSpread\);/);
  assert.doesNotMatch(sourceApp, /photo-album__controls|photoAlbumProgress|id="photoAlbumPrevious"/);
  assert.match(sourceStyles, /aspect-ratio:\s*2560\s*\/\s*1808/);
  assert.match(sourceStyles, /width:\s*112%/);
  assert.match(sourceStyles, /@keyframes album-spread-turn-next/);
  for (const image of [cover, firstPage, lastPage]) {
    assert.equal(image[0], 0xff);
    assert.equal(image[1], 0xd8);
    assert.ok(image.byteLength > 50_000);
    assert.ok(image.byteLength < 1_500_000);
  }
});

test("ships the approved wedding photo and cool-neutral theme", async () => {
  const [
    sourceConfig,
    sourceTravel,
    sourceStyles,
    sourceApp,
    builtConfig,
    builtTravel,
    builtStyles,
    builtApp,
    hero,
    guoliangpi,
    zhuangmo,
    yangroutang,
    music,
    wishRoute,
    replyRoute,
    seatRoute,
    schema,
    migration,
    indexesMigration,
    seatsMigration,
  ] = await Promise.all([
      readFile(new URL("../public/invitation/config.js", import.meta.url), "utf8"),
      readFile(new URL("../public/invitation/travel-data.js", import.meta.url), "utf8"),
      readFile(new URL("../public/invitation/styles.css", import.meta.url), "utf8"),
      readFile(new URL("../public/invitation/app.js", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/invitation/config.js", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/invitation/travel-data.js", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/invitation/styles.css", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/invitation/app.js", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/invitation/assets/wedding-hero.jpg", import.meta.url)),
      readFile(new URL("../dist/client/invitation/assets/travel/guoliangpi.jpg", import.meta.url)),
      readFile(new URL("../dist/client/invitation/assets/travel/zhuangmo.jpg", import.meta.url)),
      readFile(new URL("../dist/client/invitation/assets/travel/yangroutang.jpg", import.meta.url)),
      readFile(new URL("../dist/client/invitation/assets/audio/a-thousand-years-lullaby.mp3", import.meta.url)),
      readFile(new URL("../app/api/wishes/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/wishes/[id]/replies/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/seats/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
      readFile(new URL("../drizzle/0000_panoramic_vector.sql", import.meta.url), "utf8"),
      readFile(new URL("../drizzle/0001_oval_titania.sql", import.meta.url), "utf8"),
      readFile(new URL("../drizzle/0002_certain_the_captain.sql", import.meta.url), "utf8"),
    ]);

  assert.equal(builtConfig, sourceConfig);
  assert.equal(builtTravel, sourceTravel);
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
  assert.match(sourceStyles, /\.cover__image-caption\s*\{[\s\S]*"Songti SC"/);
  assert.doesNotMatch(sourceStyles, /\.cover__image-caption\s*\{[\s\S]*STXingkai/);
  assert.match(sourceStyles, /assets\/lace\/lace-repeat\.webp/);
  assert.match(sourceStyles, /background-image:\s*url\("\.\/assets\/lace\/lace-repeat\.webp"\)/);
  assert.match(sourceStyles, /background-repeat:\s*repeat-y/);
  assert.match(sourceStyles, /\.cover::before,\s*\.schedule-block::before/);
  assert.match(sourceStyles, /\.cover\s*\{[\s\S]*padding:\s*18px 18px 18px/);
  assert.match(sourceStyles, /background-size:\s*74% auto/);
  assert.match(sourceStyles, /background-repeat:\s*repeat;/);
  assert.match(sourceStyles, /opacity:\s*0\.06/);
  assert.match(sourceStyles, /\.view:not\(#invitation\)\s*\{[\s\S]*padding-bottom:\s*0/);
  assert.doesNotMatch(sourceStyles, /assets\/lace\/lace-(?:travel|photo|wishes|seats)\.webp/);
  assert.match(sourceApp, /page--travel/);
  assert.match(sourceApp, /page--photos/);
  assert.match(sourceApp, /page--wishes/);
  assert.match(sourceApp, /page--seats/);
  assert.match(sourceApp, /couple\.invitationLine/);
  assert.match(sourceApp, /couple\.lunarDate/);
  assert.doesNotMatch(sourceApp, /mote&sally|cover__closing/);
  assert.match(sourceConfig, /invitationLine:\s*"诚邀您见证我们的婚礼"/);
  assert.match(sourceConfig, /lunarDate:\s*"农历八月廿六"/);
  assert.match(sourceConfig, /groomPhone:\s*"13164039297"/);
  assert.match(sourceConfig, /bridePhone:\s*"16639311246"/);
  assert.match(sourceConfig, /audioUrl:\s*"\.\/assets\/audio\/a-thousand-years-lullaby\.mp3"/);
  assert.match(sourceConfig, /volume:\s*0\.72/);
  assert.match(sourceApp, /id="musicButton"/);
  assert.match(sourceApp, /attemptAutoplayMusic/);
  assert.match(sourceApp, /bindFirstInteractionMusicResume/);
  assert.match(sourceApp, /id="contactDialog"/);
  assert.match(sourceApp, /href="tel:\$\{escapeHtml\(contact\.phone\)\}"/);
  assert.doesNotMatch(sourceApp, /FRAME 06|FILM \/ 2026/);
  assert.match(sourceApp, /replyAnonymous/);
  assert.match(sourceApp, /lookupSeat/);
  assert.match(sourceConfig, /apiEndpoint:\s*"\/api\/seats"/);
  assert.match(sourceConfig, /胡阳/);
  assert.match(sourceConfig, /728416/);
  assert.match(sourceConfig, /韩旭/);
  assert.match(sourceConfig, /593827/);
  assert.match(sourceConfig, /apiEndpoint:\s*"\/api\/wishes"/);
  assert.match(sourceConfig, /pageSize:\s*10/);
  assert.match(sourceConfig, /replyPreviewSize:\s*2/);
  assert.match(sourceApp, /loadRemoteWishes/);
  assert.match(sourceApp, /if \(wishApiEndpoint\) return \[\]/);
  assert.match(sourceApp, /当前预览未连接数据库/);
  assert.match(sourceApp, /renderWishPagination/);
  assert.match(sourceApp, /visibleWishPages/);
  assert.match(sourceApp, /收起回复/);
  assert.match(sourceApp, /data-wish-page/);
  assert.match(sourceApp, /reply-expand/);
  assert.match(sourceApp, /loadFullReplies/);
  assert.match(sourceStyles, /wish-pagination__ellipsis/);
  assert.match(sourceStyles, /border-bottom: 1px solid transparent/);
  assert.match(sourceApp, /postJson\(`\$\{wishApiEndpoint\}\/\$\{encodeURIComponent\(wishId\)\}\/replies`/);
  assert.match(wishRoute, /export async function GET/);
  assert.match(wishRoute, /export async function POST/);
  assert.match(wishRoute, /pageSize/);
  assert.match(wishRoute, /replyLimit/);
  assert.match(replyRoute, /export async function GET/);
  assert.match(replyRoute, /export async function POST/);
  assert.match(replyRoute, /listReplies/);
  assert.match(seatRoute, /demoGuests/);
  assert.match(seatRoute, /胡阳/);
  assert.match(seatRoute, /韩旭/);
  assert.match(seatRoute, /WHERE normalized_name = \? AND invitation_code = \?/);
  assert.match(schema, /sqliteTable\(\s*"blessings"/);
  assert.match(schema, /sqliteTable\(\s*"blessing_replies"/);
  assert.match(schema, /sqliteTable\(\s*"seating_guests"/);
  assert.match(migration, /CREATE TABLE `blessings`/);
  assert.match(migration, /CREATE TABLE `blessing_replies`/);
  assert.match(indexesMigration, /CREATE INDEX `blessings_created_at_idx`/);
  assert.match(indexesMigration, /CREATE INDEX `blessing_replies_blessing_id_idx`/);
  assert.match(seatsMigration, /CREATE TABLE `seating_guests`/);
  assert.match(seatsMigration, /CREATE INDEX `seating_guests_normalized_name_idx`/);
  assert.match(sourceApp, /WEDDING_TRAVEL_DATA/);
  assert.match(sourceApp, /replace\(\/\\n\/g, "<br \/>"\)/);
  assert.match(sourceApp, /我们挑了几处想分享给您的濮阳味道/);
  assert.match(sourceApp, /濮阳。\\n我们挑了几处/);
  assert.match(sourceApp, /有些日子值得被收藏/);
  assert.match(sourceApp, /被收藏，\\n有些瞬间/);
  assert.match(sourceApp, /如果有一句话想对我们说/);
  assert.match(sourceApp, /这里吧。\\n谢谢您/);
  assert.doesNotMatch(sourceApp, /婚礼前夕，我们将发送专属邀请码/);
  assert.match(sourceConfig, /婚礼前夕，我们将发送专属邀请码/);
  assert.doesNotMatch(sourceConfig, /邀请码会随电子请柬/);
  assert.doesNotMatch(sourceApp, /演示查询/);
  assert.doesNotMatch(sourceApp, /欢迎赴宴，请在这里查看您的座位/);
  assert.match(sourceApp, /data-travel-filter/);
  assert.match(sourceStyles, /\.travel-card\[hidden\]/);
  assert.match(sourceTravel, /categories:\s*\["地方小吃", "濮阳风味", "暖胃正餐"\]/);
  assert.match(sourceTravel, /濮阳裹凉皮/);
  assert.match(sourceTravel, /壮馍/);
  assert.match(sourceTravel, /羊肉汤/);
  assert.match(sourceTravel, /m\.dianping\.com\/shopinfo\/G9oocPoIuMTNrB5m/);
  assert.match(sourceTravel, /\.\/assets\/travel\/guoliangpi\.jpg/);

  assert.equal(hero[0], 0xff);
  assert.equal(hero[1], 0xd8);
  assert.ok(hero.byteLength > 100_000);
  assert.ok(hero.byteLength < 1_000_000);
  for (const image of [guoliangpi, zhuangmo, yangroutang]) {
    assert.equal(image[0], 0xff);
    assert.equal(image[1], 0xd8);
    assert.ok(image.byteLength > 40_000);
    assert.ok(image.byteLength < 400_000);
  }
  assert.equal(String.fromCharCode(...music.subarray(0, 3)), "ID3");
  assert.ok(music.byteLength > 1_000_000);
  assert.ok(music.byteLength < 8_000_000);
});

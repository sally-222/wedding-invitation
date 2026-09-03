import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
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
    sourceHtml,
    sourceRootHtml,
    sourceRoutes,
    wranglerConfig,
    builtConfig,
    builtTravel,
    builtStyles,
    builtApp,
    builtHtml,
    builtRootHtml,
    builtRoutes,
    cloudflareWorker,
    cloudflareEntry,
    shareCard,
    rootShareCard,
    wechatVerifyFile,
    wechatOfficialVerifyFile,
    hero,
    travelFirst,
    travelMiddle,
    travelLast,
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
      readFile(new URL("../public/invitation/index.html", import.meta.url), "utf8"),
      readFile(new URL("../public/index.html", import.meta.url), "utf8"),
      readFile(new URL("../public/_routes.json", import.meta.url), "utf8"),
      readFile(new URL("../wrangler.toml", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/invitation/config.js", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/invitation/travel-data.js", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/invitation/styles.css", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/invitation/app.js", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/invitation/index.html", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/index.html", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/_routes.json", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/_worker.js", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/index.js", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/invitation/assets/share-card.jpg", import.meta.url)),
      readFile(new URL("../dist/client/assets/share-card.jpg", import.meta.url)),
      readFile(new URL("../dist/client/invitation/MP_verify_wNCDOk3cg9vK4RoU.txt", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/invitation/0f834a0421bc842f293b8a97398d1f4e.txt", import.meta.url), "utf8"),
      readFile(new URL("../dist/client/invitation/assets/wedding-hero.jpg", import.meta.url)),
      readFile(new URL("../dist/client/invitation/assets/travel/travel-001.jpg", import.meta.url)),
      readFile(new URL("../dist/client/invitation/assets/travel/travel-015.jpg", import.meta.url)),
      readFile(new URL("../dist/client/invitation/assets/travel/travel-031.jpg", import.meta.url)),
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
  assert.equal(builtHtml, sourceHtml);
  assert.equal(builtRootHtml, sourceRootHtml);
  assert.equal(builtRoutes, sourceRoutes);
  assert.match(sourceRoutes, /"include":\s*\[\s*"\/api\/\*"\s*\]/);
  assert.match(sourceRoutes, /"exclude":\s*\[\s*\]/);
  assert.match(wranglerConfig, /\[\[d1_databases\]\]/);
  assert.match(wranglerConfig, /binding\s*=\s*"DB"/);
  assert.match(wranglerConfig, /database_name\s*=\s*"wedding-invitation-db"/);
  assert.match(wranglerConfig, /database_id\s*=\s*"9576ce12-b44c-4d15-a116-d731ea1c29c6"/);
  assert.match(cloudflareWorker, /cloudflare:workers/);
  assert.match(cloudflareWorker, /api\/wishes/);
  assert.equal(cloudflareEntry, cloudflareWorker);
  assert.equal(wechatVerifyFile.trim(), "wNCDOk3cg9vK4RoU");
  assert.equal(wechatOfficialVerifyFile.trim(), "817967ebb97b2bc3b95ffef2c9d8d9d8f1f6b8c6");

  assert.match(sourceHtml, /<title>2026\.10\.6婚礼邀请函<\/title>/);
  assert.match(sourceHtml, /app\.js\?v=20260903-seat-photo-2/);
  assert.match(sourceHtml, /content="李辰海&沙雷雨馨"/);
  assert.match(sourceHtml, /property="og:url" content="https:\/\/wedding-invitation\.pages\.dev\/invitation\/index\.html"/);
  assert.match(sourceHtml, /property="og:image" content="https:\/\/mmbiz\.qpic\.cn\/mmbiz_jpg\/p1q58J1IVH5h1jyvzma5wcRcoDXhJskxtyqrCicWce4RpgrwQJjEyMibcBveofSZXYXFiaz0QI7OgcGtmXRjptz1de0lbkvsuI0KJ5xyRibcoDk\/640\?wx_fmt=jpeg&amp;from=appmsg"/);
  assert.match(sourceRootHtml, /property="og:image" content="https:\/\/mmbiz\.qpic\.cn\/mmbiz_jpg\/p1q58J1IVH5h1jyvzma5wcRcoDXhJskxtyqrCicWce4RpgrwQJjEyMibcBveofSZXYXFiaz0QI7OgcGtmXRjptz1de0lbkvsuI0KJ5xyRibcoDk\/640\?wx_fmt=jpeg&amp;from=appmsg"/);
  assert.match(sourceRootHtml, /李辰海&沙雷雨馨/);
  assert.doesNotMatch(sourceHtml, /jweixin-1\.6\.0\.js/);
  assert.match(sourceConfig, /heroImage:\s*"\.\/assets\/wedding-hero\.jpg"/);
  assert.match(sourceConfig, /dateISO:\s*"2026-10-06T11:18:00\+08:00"/);
  assert.match(sourceConfig, /venue:\s*"中原油田宾馆（二所）"/);
  assert.match(sourceConfig, /time:\s*"10:00"[\s\S]*title:\s*"迎宾"[\s\S]*与亲友相见、聊天、拍照/);
  assert.match(sourceConfig, /time:\s*"11:18"[\s\S]*title:\s*"仪式开始（草坪仪式）"/);
  assert.match(sourceConfig, /time:\s*"12:18"[\s\S]*title:\s*"婚礼午宴"/);
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
  assert.match(sourceStyles, /#invitation\s*\{[\s\S]*padding-bottom:\s*0/);
  assert.match(sourceStyles, /\.cover\s*\{[\s\S]*padding:\s*18px 18px 18px/);
  assert.match(sourceStyles, /\.cover::after\s*\{[\s\S]*bottom:\s*0/);
  assert.match(sourceStyles, /\.cover::after\s*\{[\s\S]*height:\s*86px/);
  assert.match(sourceStyles, /\.home-details::before\s*\{[\s\S]*display:\s*none/);
  assert.match(sourceStyles, /\.contact-dialog__close:focus-visible\s*\{[\s\S]*outline:\s*none/);
  assert.doesNotMatch(sourceStyles, /\.album-spread__page:focus-visible,\s*\.lightbox__close:focus-visible/);
  assert.match(sourceStyles, /\.schedule-block\s*\{[\s\S]*padding:\s*56px 22px calc\(var\(--bottom-nav\) \+ 56px\)/);
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
  assert.match(sourceApp, /邀您秋日相见/);
  assert.doesNotMatch(sourceApp, /mote&sally|cover__closing/);
  assert.match(sourceConfig, /invitationLine:\s*"诚邀您见证我们的婚礼"/);
  assert.match(sourceConfig, /lunarDate:\s*"农历八月廿六"/);
  assert.match(sourceConfig, /groomPhone:\s*"13164039297"/);
  assert.match(sourceConfig, /bridePhone:\s*"16639311246"/);
  assert.match(sourceConfig, /audioUrl:\s*"\.\/assets\/audio\/a-thousand-years-lullaby\.mp3"/);
  assert.match(sourceConfig, /assetVersion:\s*"20260903-seat-photo-2"/);
  assert.match(sourceConfig, /volume:\s*0\.72/);
  assert.match(sourceApp, /id="musicButton"/);
  assert.match(sourceApp, /attemptAutoplayMusic/);
  assert.match(sourceApp, /bindAutoplayMusicSignals/);
  assert.match(sourceApp, /WeixinJSBridgeReady/);
  assert.match(sourceApp, /audio\.autoplay\s*=\s*true/);
  assert.match(sourceApp, /bindFirstInteractionMusicResume/);
  assert.match(sourceApp, /button__icon--map/);
  assert.match(sourceApp, /button__icon--phone/);
  assert.match(sourceStyles, /background:\s*#c9d2cc/);
  assert.match(sourceStyles, /\.button__icon--phone\s*\{[\s\S]*font-size:\s*13px/);
  assert.match(sourceStyles, /\.contact-dialog__call\s*\{[\s\S]*font-size:\s*13px/);
  assert.match(sourceApp, /id="contactDialog"/);
  assert.match(sourceApp, /href="tel:\$\{escapeHtml\(contact\.phone\)\}"/);
  assert.doesNotMatch(sourceApp, /FRAME 06|FILM \/ 2026/);
  assert.match(sourceApp, /replyAnonymous/);
  assert.match(sourceApp, /lookupSeat/);
  assert.match(sourceConfig, /apiEndpoint:\s*"\/api\/wishes"/);
  assert.match(sourceConfig, /apiEndpoint:\s*"\/api\/seats"/);
  assert.match(sourceConfig, /座位信息将在婚礼前夕更新/);
  assert.match(sourceConfig, /届时请输入您的姓名查询/);
  assert.match(sourceConfig, /胡阳/);
  assert.match(sourceConfig, /韩旭/);
  assert.doesNotMatch(sourceConfig, /invitationCodeLength|728416|593827|专属邀请码/);
  assert.doesNotMatch(sourceApp, /Invitation code|invite-code-field|formData\.get\("invitationCode"\)|请输入完整/);
  assert.match(sourceApp, /postRemoteJson\(config\.seatLookup\.apiEndpoint \|\| "seats", \{ name \}\)/);
  assert.match(sourceApp, /seat-result__entry/);
  assert.match(sourceConfig, /title:\s*"2026\.10\.6婚礼邀请函"/);
  assert.match(sourceConfig, /desc:\s*"李辰海&沙雷雨馨"/);
  assert.match(sourceConfig, /link:\s*"https:\/\/wedding-invitation\.pages\.dev\/invitation\/index\.html"/);
  assert.match(sourceConfig, /imgUrl:\s*"https:\/\/mmbiz\.qpic\.cn\/mmbiz_jpg\/p1q58J1IVH5h1jyvzma5wcRcoDXhJskxtyqrCicWce4RpgrwQJjEyMibcBveofSZXYXFiaz0QI7OgcGtmXRjptz1de0lbkvsuI0KJ5xyRibcoDk\/640\?wx_fmt=jpeg&from=appmsg"/);
  assert.doesNotMatch(sourceConfig, /signPath:\s*"wechat-sign"/);
  assert.doesNotMatch(sourceHtml, /cloudbase\.full\.js/);
  assert.doesNotMatch(sourceConfig, /cloudbaseApi/);
  assert.doesNotMatch(sourceApp, /callFunction|cloudbase/);
  assert.match(sourceApp, /initBasicShareTitle/);
  assert.doesNotMatch(sourceApp, /updateAppMessageShareData/);
  assert.doesNotMatch(sourceApp, /updateTimelineShareData/);
  assert.match(sourceConfig, /pageSize:\s*10/);
  assert.match(sourceConfig, /replyPreviewSize:\s*2/);
  assert.match(sourceApp, /loadRemoteWishes/);
  assert.match(sourceApp, /isLocalPreview/);
  assert.match(sourceApp, /Boolean\(wishApiEndpoint\) && !isLocalPreview/);
  assert.match(sourceApp, /当前预览未连接数据库/);
  assert.match(sourceApp, /renderWishPagination/);
  assert.match(sourceApp, /visibleWishPages/);
  assert.match(sourceApp, /收起回复/);
  assert.match(sourceApp, /亲友回应/);
  assert.match(sourceConfig, /十月见，我们一定准时到/);
  assert.match(sourceConfig, /已经开始期待那天了/);
  assert.match(sourceStyles, /\.reply-list\s*\{[\s\S]*background:\s*rgba\(215, 227, 238, 0\.24\)/);
  assert.match(sourceStyles, /\.reply-list\s*\{[\s\S]*border-left:\s*2px solid rgba\(86, 105, 125, 0\.34\)/);
  assert.match(sourceApp, /data-wish-page/);
  assert.match(sourceApp, /reply-expand/);
  assert.match(sourceApp, /loadFullReplies/);
  assert.match(sourceStyles, /wish-pagination__ellipsis/);
  assert.match(sourceStyles, /border-bottom: 1px solid transparent/);
  assert.match(sourceApp, /postRemoteJson\(`\$\{wishApiEndpoint \|\| "wishes"\}\/\$\{encodeURIComponent\(wishId\)\}\/replies`/);
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
  assert.match(seatRoute, /WHERE normalized_name = \?/);
  assert.doesNotMatch(seatRoute, /payload\.invitationCode|请输入完整的 6 位邀请码|AND invitation_code/);
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
  assert.doesNotMatch(sourceApp, /guest\.name \|\| name/);
  assert.doesNotMatch(sourceApp, /婚礼前夕，我们将发送专属邀请码/);
  assert.doesNotMatch(sourceConfig, /婚礼前夕，我们将发送专属邀请码/);
  assert.doesNotMatch(sourceConfig, /邀请码会随电子请柬/);
  assert.doesNotMatch(sourceApp, /演示查询/);
  assert.doesNotMatch(sourceApp, /欢迎赴宴，请在这里查看您的座位/);
  assert.match(sourceApp, /data-travel-filter/);
  assert.match(sourceApp, /versionAssetUrl\(spot\.image\)/);
  assert.match(sourceStyles, /\.travel-card\[hidden\]/);
  assert.doesNotMatch(sourceApp, /链接待补充/);
  assert.match(sourceApp, /const linkLabel = url/);
  assert.match(sourceStyles, /\.travel-card__image img\s*\{[^}]*object-fit:\s*contain;[^}]*\}/);
  assert.doesNotMatch(sourceStyles, /\.travel-card__image img\s*\{[^}]*filter:/);
  assert.match(sourceTravel, /categories:\s*\["暖胃正餐", "濮阳风味", "特色小吃", "新华街风味"\]/);
  assert.match(sourceTravel, /三强鸽子/);
  assert.match(sourceTravel, /方中山胡辣汤/);
  assert.match(sourceTravel, /体育场小吃夜市/);
  assert.match(sourceTravel, /www\.dianping\.com\/shop\/l2UIRE49ap3TeTDa/);
  assert.match(sourceTravel, /\.\/assets\/travel\/travel-001\.jpg/);
  assert.match(sourceTravel, /马家羊肉汤[\s\S]*\.\/assets\/travel\/travel-018\.jpg/);
  assert.match(sourceTravel, /新华街砂锅面[\s\S]*dianpingUrl:\s*""/);
  await assert.rejects(access(new URL("../.wrangler/deploy/config.json", import.meta.url)), { code: "ENOENT" });

  assert.equal(hero[0], 0xff);
  assert.equal(hero[1], 0xd8);
  assert.ok(hero.byteLength > 100_000);
  assert.ok(hero.byteLength < 1_000_000);
  assert.equal(shareCard[0], 0xff);
  assert.equal(shareCard[1], 0xd8);
  assert.ok(shareCard.byteLength > 20_000);
  assert.ok(shareCard.byteLength < 500_000);
  assert.equal(rootShareCard[0], 0xff);
  assert.equal(rootShareCard[1], 0xd8);
  assert.equal(rootShareCard.byteLength, shareCard.byteLength);
  for (const image of [travelFirst, travelMiddle, travelLast]) {
    assert.equal(image[0], 0xff);
    assert.equal(image[1], 0xd8);
    assert.ok(image.byteLength > 40_000);
    assert.ok(image.byteLength < 400_000);
  }
  assert.equal(String.fromCharCode(...music.subarray(0, 3)), "ID3");
  assert.ok(music.byteLength > 1_000_000);
  assert.ok(music.byteLength < 8_000_000);
});

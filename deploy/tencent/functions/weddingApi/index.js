const cloudbase = require("@cloudbase/node-sdk");
const crypto = require("crypto");

const ENV_ID = process.env.TCB_ENV_ID || "wedding-invitation-d8cw19676945d";
const COLLECTIONS = {
  blessings: "blessings",
  replies: "blessing_replies",
  seats: "seating_guests",
};

const app = cloudbase.init({ env: ENV_ID });
const db = app.database();
const _ = db.command;

let collectionsReady;

const demoGuests = [
  {
    _id: "demo-hu-yang",
    id: "demo-hu-yang",
    name: "胡阳",
    normalizedName: normalizeGuestName("胡阳"),
    invitationCode: "728416",
    table: "A01",
    seatNote: "朋友席",
    createdAt: new Date(),
  },
  {
    _id: "demo-han-xu",
    id: "demo-han-xu",
    name: "韩旭",
    normalizedName: normalizeGuestName("韩旭"),
    invitationCode: "593827",
    table: "A02",
    seatNote: "朋友席",
    createdAt: new Date(),
  },
];

exports.main = async function main(event = {}, context = {}) {
  const request = parseRequest(event, context);

  if (request.method === "OPTIONS") {
    return response(null, 204);
  }

  try {
    await ensureCollections();

    if (request.method === "GET" && isWishesPath(request.path)) {
      return response(await listWishes(request.query));
    }

    if (request.method === "POST" && isWishesPath(request.path)) {
      return response(await createWish(request.body), 201);
    }

    const replyMatch = request.path.match(/\/wishes\/([^/]+)\/replies\/?$/);
    if (replyMatch && request.method === "GET") {
      return response(await listReplies(decodeURIComponent(replyMatch[1]), request.query));
    }

    if (replyMatch && request.method === "POST") {
      return response(await createReply(decodeURIComponent(replyMatch[1]), request.body), 201);
    }

    if (request.method === "POST" && isSeatsPath(request.path)) {
      return response(await lookupSeat(request.body));
    }

    return response({ error: "接口不存在。" }, 404);
  } catch (error) {
    return response({ error: readableError(error) }, error.statusCode || 500);
  }
};

function parseRequest(event, context) {
  const http = context.httpContext || event.requestContext?.http || {};
  const method = String(http.httpMethod || http.method || event.httpMethod || event.method || "GET").toUpperCase();
  const rawUrl = http.url || event.url || event.path || "/";
  const url = new URL(rawUrl, "https://wedding.local");

  return {
    method,
    path: normalizePath(url.pathname),
    query: Object.fromEntries(url.searchParams.entries()),
    body: parseBody(event),
  };
}

function normalizePath(pathname) {
  return `/${String(pathname || "").replace(/^\/+/, "")}`;
}

function parseBody(event) {
  const candidates = [event.body, event.rawBody, event.data];
  for (const value of candidates) {
    if (!value) continue;
    if (typeof value === "object") return value;
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    }
  }

  if (event && typeof event === "object" && !event.httpMethod && !event.requestContext && !event.path) {
    return event;
  }

  return {};
}

function isWishesPath(pathname) {
  return pathname === "/api/wishes" || pathname.endsWith("/api/wishes") || pathname === "/wishes";
}

function isSeatsPath(pathname) {
  return pathname === "/api/seats" || pathname.endsWith("/api/seats") || pathname === "/seats";
}

function response(data, statusCode = 200) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: data === null ? "" : JSON.stringify(data),
  };
}

async function ensureCollections() {
  if (!collectionsReady) {
    collectionsReady = Promise.all(Object.values(COLLECTIONS).map(createCollectionIfMissing)).then(seedDemoGuests);
  }
  return collectionsReady;
}

async function createCollectionIfMissing(name) {
  try {
    await db.createCollection(name);
  } catch (error) {
    const message = readableError(error);
    if (!/exist|already|exists|已存在|存在/.test(message)) {
      throw error;
    }
  }
}

async function seedDemoGuests() {
  const seats = db.collection(COLLECTIONS.seats);
  const count = await seats.count();
  if (Number(count.total || 0) > 0) return;

  for (const guest of demoGuests) {
    await seats.add(guest);
  }
}

async function listWishes(query) {
  const pageSize = clampInteger(query.pageSize, 10, 1, 30);
  const requestedPage = clampInteger(query.page, 1, 1, 9999);
  const replyLimit = clampInteger(query.replyLimit, 2, 0, 6);
  const blessings = db.collection(COLLECTIONS.blessings);
  const totalResult = await blessings.count();
  const total = Number(totalResult.total || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;
  const wishResult = await blessings.orderBy("createdAt", "desc").skip(offset).limit(pageSize).get();
  const wishes = [];

  for (const wish of wishResult.data || []) {
    const replyQuery = db.collection(COLLECTIONS.replies).where({ blessingId: wish._id });
    const replyCount = await replyQuery.count();
    const replyResult = replyLimit
      ? await replyQuery.orderBy("createdAt", "desc").limit(replyLimit).get()
      : { data: [] };

    wishes.push({
      id: wish._id || wish.id,
      name: wish.displayName,
      text: wish.content,
      createdAt: toIso(wish.createdAt),
      replyCount: Number(replyCount.total || 0),
      replies: (replyResult.data || []).reverse().map(publicReply),
    });
  }

  return { wishes, page, pageSize, total, totalPages };
}

async function createWish(payload) {
  const anonymous = Boolean(payload.anonymous);
  const name = cleanText(payload.name, 18);
  const text = cleanText(payload.text, 160);

  if (!text) {
    throw publicError("请先写下祝福内容。", 400);
  }
  if (!anonymous && !name) {
    throw publicError("请填写姓名，或选择匿名留言。", 400);
  }

  const id = randomId();
  const displayName = publicName(name, anonymous);
  const createdAt = new Date();

  await db.collection(COLLECTIONS.blessings).add({
    _id: id,
    id,
    authorName: anonymous ? "" : name,
    displayName,
    isAnonymous: anonymous,
    content: text,
    createdAt,
  });

  return {
    wish: {
      id,
      name: displayName,
      text,
      createdAt: createdAt.toISOString(),
      replyCount: 0,
      replies: [],
    },
  };
}

async function listReplies(blessingId, query) {
  await assertWishExists(blessingId);

  const pageSize = clampInteger(query.pageSize, 100, 1, 100);
  const requestedPage = clampInteger(query.page, 1, 1, 9999);
  const replies = db.collection(COLLECTIONS.replies).where({ blessingId });
  const totalResult = await replies.count();
  const total = Number(totalResult.total || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;
  const replyResult = await replies.orderBy("createdAt", "asc").skip(offset).limit(pageSize).get();

  return {
    replies: (replyResult.data || []).map(publicReply),
    page,
    pageSize,
    total,
    totalPages,
  };
}

async function createReply(blessingId, payload) {
  await assertWishExists(blessingId);

  const anonymous = Boolean(payload.anonymous);
  const name = cleanText(payload.name, 18);
  const text = cleanText(payload.text, 80);

  if (!text) {
    throw publicError("请先填写回复内容。", 400);
  }
  if (!anonymous && !name) {
    throw publicError("请填写姓名，或选择匿名回复。", 400);
  }

  const id = randomId();
  const displayName = publicName(name, anonymous);
  const createdAt = new Date();

  await db.collection(COLLECTIONS.replies).add({
    _id: id,
    id,
    blessingId,
    authorName: anonymous ? "" : name,
    displayName,
    isAnonymous: anonymous,
    content: text,
    createdAt,
  });

  return {
    reply: {
      id,
      name: displayName,
      text,
      createdAt: createdAt.toISOString(),
    },
  };
}

async function assertWishExists(id) {
  const result = await db.collection(COLLECTIONS.blessings).doc(id).get();
  const data = Array.isArray(result.data) ? result.data : result.data ? [result.data] : [];
  if (!data.length) {
    throw publicError("这条祝福不存在或已被移除。", 404);
  }
}

async function lookupSeat(payload) {
  const name = cleanText(payload.name, 18);
  const normalizedName = normalizeGuestName(name);
  const invitationCode = normalizeInvitationCode(payload.invitationCode);

  if (!normalizedName) {
    throw publicError("请填写请柬上的宾客姓名。", 400);
  }
  if (!/^[A-Z0-9]{6}$/.test(invitationCode)) {
    throw publicError("请输入完整的 6 位邀请码。", 400);
  }

  const result = await db
    .collection(COLLECTIONS.seats)
    .where({ normalizedName, invitationCode })
    .limit(1)
    .get();
  const guest = result.data?.[0];

  if (!guest) {
    return { found: false };
  }

  return {
    found: true,
    guest: {
      id: guest._id || guest.id,
      name: guest.name,
      table: guest.table,
      seatNote: guest.seatNote || "",
    },
  };
}

function publicReply(reply) {
  return {
    id: reply._id || reply.id,
    name: reply.displayName,
    text: reply.content,
    createdAt: toIso(reply.createdAt),
  };
}

function cleanText(value, maxLength) {
  return String(value ?? "").normalize("NFKC").trim().slice(0, maxLength);
}

function normalizeGuestName(value) {
  return cleanText(value, 40).replace(/\s+/g, "").toLocaleLowerCase("zh-CN");
}

function normalizeInvitationCode(value) {
  return cleanText(value, 12).replace(/[\s-]+/g, "").toUpperCase();
}

function publicName(name, anonymous) {
  return anonymous ? "匿名亲友" : name;
}

function clampInteger(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function randomId() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");
}

function toIso(value) {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function publicError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function readableError(error) {
  return error && error.message ? error.message : "服务暂时不可用。";
}

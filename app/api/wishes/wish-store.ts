import { env } from "cloudflare:workers";

export type PublicReply = {
  id: string;
  name: string;
  text: string;
  createdAt: string;
};

export type PublicWish = {
  id: string;
  name: string;
  text: string;
  createdAt: string;
  replyCount: number;
  replies: PublicReply[];
};

export type WishPage = {
  wishes: PublicWish[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ReplyPage = {
  replies: PublicReply[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type WishRow = {
  id: string;
  display_name: string;
  content: string;
  created_at: string;
};

type ReplyRow = {
  id: string;
  blessing_id: string;
  display_name: string;
  content: string;
  created_at: string;
};

type CountRow = {
  total: number;
};

type ReplyCountRow = {
  blessing_id: string;
  total: number;
};

export function getD1() {
  if (!env.DB) {
    throw new Error("祝福数据库暂未连接，请先配置 D1 数据库。");
  }

  return env.DB;
}

export async function ensureWishSchema(db: D1Database) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS blessings (
      id TEXT PRIMARY KEY,
      author_name TEXT NOT NULL DEFAULT '',
      display_name TEXT NOT NULL,
      is_anonymous INTEGER NOT NULL DEFAULT 0,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS blessing_replies (
      id TEXT PRIMARY KEY,
      blessing_id TEXT NOT NULL,
      author_name TEXT NOT NULL DEFAULT '',
      display_name TEXT NOT NULL,
      is_anonymous INTEGER NOT NULL DEFAULT 0,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (blessing_id) REFERENCES blessings(id) ON DELETE CASCADE
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS blessings_created_at_idx ON blessings (created_at DESC)"),
    db.prepare("CREATE INDEX IF NOT EXISTS blessing_replies_blessing_id_idx ON blessing_replies (blessing_id)"),
  ]);
}

export function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").normalize("NFKC").trim().slice(0, maxLength);
}

export function publicName(name: string, anonymous: boolean) {
  return anonymous ? "匿名亲友" : name;
}

function clampInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

export async function listWishes(
  db: D1Database,
  options: { page?: number; pageSize?: number; replyLimit?: number } = {},
): Promise<WishPage> {
  await ensureWishSchema(db);

  const pageSize = clampInteger(options.pageSize, 10, 1, 30);
  const requestedPage = clampInteger(options.page, 1, 1, 9999);
  const replyLimit = clampInteger(options.replyLimit, 2, 0, 6);
  const totalRow = await db.prepare("SELECT COUNT(*) AS total FROM blessings").first<CountRow>();
  const total = Number(totalRow?.total || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;

  const { results: wishRows = [] } = await db
    .prepare(
      `SELECT id, display_name, content, created_at
       FROM blessings
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
    )
    .bind(pageSize, offset)
    .all<WishRow>();

  if (!wishRows.length) {
    return { wishes: [], page, pageSize, total, totalPages };
  }

  const ids = wishRows.map((wish) => wish.id);
  const placeholders = ids.map(() => "?").join(", ");
  const { results: replyCountRows = [] } = await db
    .prepare(
      `SELECT blessing_id, COUNT(*) AS total
       FROM blessing_replies
       WHERE blessing_id IN (${placeholders})
       GROUP BY blessing_id`,
    )
    .bind(...ids)
    .all<ReplyCountRow>();

  const replyCounts = new Map(replyCountRows.map((reply) => [reply.blessing_id, Number(reply.total || 0)]));
  const replyRows = replyLimit
    ? (
        await db
          .prepare(
            `SELECT id, blessing_id, display_name, content, created_at
             FROM (
               SELECT id, blessing_id, display_name, content, created_at,
                 ROW_NUMBER() OVER (PARTITION BY blessing_id ORDER BY created_at DESC) AS reply_rank
               FROM blessing_replies
               WHERE blessing_id IN (${placeholders})
             )
             WHERE reply_rank <= ?
             ORDER BY blessing_id ASC, created_at ASC`,
          )
          .bind(...ids, replyLimit)
          .all<ReplyRow>()
      ).results || []
    : [];

  const repliesByWish = new Map<string, PublicReply[]>();
  for (const reply of replyRows) {
    const list = repliesByWish.get(reply.blessing_id) || [];
    list.push({
      id: reply.id,
      name: reply.display_name,
      text: reply.content,
      createdAt: reply.created_at,
    });
    repliesByWish.set(reply.blessing_id, list);
  }

  return {
    wishes: wishRows.map((wish) => ({
      id: wish.id,
      name: wish.display_name,
      text: wish.content,
      createdAt: wish.created_at,
      replyCount: replyCounts.get(wish.id) || 0,
      replies: repliesByWish.get(wish.id) || [],
    })),
    page,
    pageSize,
    total,
    totalPages,
  };
}

export async function getWish(db: D1Database, id: string) {
  await ensureWishSchema(db);
  return db
    .prepare("SELECT id FROM blessings WHERE id = ? LIMIT 1")
    .bind(id)
    .first<{ id: string }>();
}

export async function listReplies(
  db: D1Database,
  blessingId: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<ReplyPage> {
  await ensureWishSchema(db);
  const pageSize = clampInteger(options.pageSize, 100, 1, 100);
  const requestedPage = clampInteger(options.page, 1, 1, 9999);
  const totalRow = await db
    .prepare("SELECT COUNT(*) AS total FROM blessing_replies WHERE blessing_id = ?")
    .bind(blessingId)
    .first<CountRow>();
  const total = Number(totalRow?.total || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;
  const { results: replyRows = [] } = await db
    .prepare(
      `SELECT id, blessing_id, display_name, content, created_at
       FROM blessing_replies
       WHERE blessing_id = ?
       ORDER BY created_at ASC
       LIMIT ? OFFSET ?`,
    )
    .bind(blessingId, pageSize, offset)
    .all<ReplyRow>();

  return {
    replies: replyRows.map((reply) => ({
      id: reply.id,
      name: reply.display_name,
      text: reply.content,
      createdAt: reply.created_at,
    })),
    page,
    pageSize,
    total,
    totalPages,
  };
}

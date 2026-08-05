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
  replies: PublicReply[];
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

export async function listWishes(db: D1Database): Promise<PublicWish[]> {
  await ensureWishSchema(db);

  const { results: wishRows = [] } = await db
    .prepare(
      `SELECT id, display_name, content, created_at
       FROM blessings
       ORDER BY created_at DESC
       LIMIT 120`,
    )
    .all<WishRow>();

  if (!wishRows.length) return [];

  const ids = wishRows.map((wish) => wish.id);
  const placeholders = ids.map(() => "?").join(", ");
  const { results: replyRows = [] } = await db
    .prepare(
      `SELECT id, blessing_id, display_name, content, created_at
       FROM blessing_replies
       WHERE blessing_id IN (${placeholders})
       ORDER BY created_at ASC`,
    )
    .bind(...ids)
    .all<ReplyRow>();

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

  return wishRows.map((wish) => ({
    id: wish.id,
    name: wish.display_name,
    text: wish.content,
    createdAt: wish.created_at,
    replies: repliesByWish.get(wish.id) || [],
  }));
}

export async function getWish(db: D1Database, id: string) {
  await ensureWishSchema(db);
  return db
    .prepare("SELECT id FROM blessings WHERE id = ? LIMIT 1")
    .bind(id)
    .first<{ id: string }>();
}

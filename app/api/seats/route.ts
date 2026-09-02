import { env } from "cloudflare:workers";

type SeatRow = {
  id: string;
  name: string;
  table_name: string;
  seat_note: string;
};

const demoGuests = [
  {
    id: "demo-hu-yang",
    name: "胡阳",
    tableName: "A01",
    seatNote: "亲友席",
  },
  {
    id: "demo-han-xu",
    name: "韩旭",
    tableName: "A02",
    seatNote: "亲友席",
  },
];

function getD1() {
  if (!env.DB) {
    throw new Error("座位数据库暂未连接，请先配置 D1 数据库。");
  }

  return env.DB;
}

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").normalize("NFKC").trim().slice(0, maxLength);
}

function normalizeGuestName(value: unknown) {
  return cleanText(value, 40).replace(/\s+/g, "").toLocaleLowerCase("zh-CN");
}

async function ensureSeatSchema(db: D1Database) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS seating_guests (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      invitation_code TEXT NOT NULL DEFAULT '',
      table_name TEXT NOT NULL,
      seat_note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS seating_guests_normalized_name_idx ON seating_guests (normalized_name)"),
    db.prepare("CREATE INDEX IF NOT EXISTS seating_guests_invitation_code_idx ON seating_guests (invitation_code)"),
  ]);
}

async function seedDemoGuests(db: D1Database) {
  const count = await db
    .prepare("SELECT COUNT(*) AS count FROM seating_guests")
    .first<{ count: number }>();

  if ((count?.count || 0) > 0) return;

  await db.batch(
    demoGuests.map((guest) =>
      db
        .prepare(
          `INSERT OR IGNORE INTO seating_guests
           (id, name, normalized_name, invitation_code, table_name, seat_note)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          guest.id,
          guest.name,
          normalizeGuestName(guest.name),
          "",
          guest.tableName,
          guest.seatNote,
        ),
    ),
  );
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      name?: string;
    };
    const name = cleanText(payload.name, 18);
    const normalizedName = normalizeGuestName(name);

    if (!normalizedName) {
      return Response.json({ error: "请填写请柬上的宾客姓名。" }, { status: 400 });
    }

    const db = getD1();
    await ensureSeatSchema(db);
    await seedDemoGuests(db);

    const { results: guests = [] } = await db
      .prepare(
        `SELECT id, name, table_name, seat_note
         FROM seating_guests
         WHERE normalized_name = ?
         ORDER BY table_name, name
         LIMIT 10`,
      )
      .bind(normalizedName)
      .all<SeatRow>();

    if (!guests.length) {
      return Response.json({ found: false });
    }

    return Response.json({
      found: true,
      guests: guests.map((guest) => ({
        id: guest.id,
        name: guest.name,
        table: guest.table_name,
        seatNote: guest.seat_note,
      })),
      guest: {
        id: guests[0].id,
        name: guests[0].name,
        table: guests[0].table_name,
        seatNote: guests[0].seat_note,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "座位查询暂时不可用。";
    return Response.json({ error: message }, { status: 500 });
  }
}

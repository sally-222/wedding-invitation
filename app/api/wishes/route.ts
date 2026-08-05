import { cleanText, ensureWishSchema, getD1, listWishes, publicName } from "./wish-store";

export async function GET() {
  try {
    const wishes = await listWishes(getD1());
    return Response.json({ wishes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "祝福暂时无法读取。";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      name?: string;
      text?: string;
      anonymous?: boolean;
    };
    const anonymous = Boolean(payload.anonymous);
    const name = cleanText(payload.name, 18);
    const text = cleanText(payload.text, 160);

    if (!text) {
      return Response.json({ error: "请先写下祝福内容。" }, { status: 400 });
    }
    if (!anonymous && !name) {
      return Response.json({ error: "请填写姓名，或选择匿名留言。" }, { status: 400 });
    }

    const db = getD1();
    await ensureWishSchema(db);
    const id = crypto.randomUUID();
    const displayName = publicName(name, anonymous);

    await db
      .prepare(
        `INSERT INTO blessings (id, author_name, display_name, is_anonymous, content)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(id, anonymous ? "" : name, displayName, anonymous ? 1 : 0, text)
      .run();

    return Response.json(
      {
        wish: {
          id,
          name: displayName,
          text,
          createdAt: new Date().toISOString(),
          replies: [],
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "祝福暂时无法发布。";
    return Response.json({ error: message }, { status: 500 });
  }
}

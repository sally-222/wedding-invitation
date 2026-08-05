import { cleanText, ensureWishSchema, getD1, getWish, publicName } from "../../wish-store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: blessingId } = await context.params;
    const payload = (await request.json()) as {
      name?: string;
      text?: string;
      anonymous?: boolean;
    };
    const anonymous = Boolean(payload.anonymous);
    const name = cleanText(payload.name, 18);
    const text = cleanText(payload.text, 80);

    if (!text) {
      return Response.json({ error: "请先填写回复内容。" }, { status: 400 });
    }
    if (!anonymous && !name) {
      return Response.json({ error: "请填写姓名，或选择匿名回复。" }, { status: 400 });
    }

    const db = getD1();
    await ensureWishSchema(db);
    const wish = await getWish(db, blessingId);
    if (!wish) {
      return Response.json({ error: "这条祝福不存在或已被移除。" }, { status: 404 });
    }

    const id = crypto.randomUUID();
    const displayName = publicName(name, anonymous);
    await db
      .prepare(
        `INSERT INTO blessing_replies (id, blessing_id, author_name, display_name, is_anonymous, content)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, blessingId, anonymous ? "" : name, displayName, anonymous ? 1 : 0, text)
      .run();

    return Response.json(
      {
        reply: {
          id,
          name: displayName,
          text,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "回复暂时无法发布。";
    return Response.json({ error: message }, { status: 500 });
  }
}

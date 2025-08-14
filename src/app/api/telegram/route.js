import { NextResponse } from "next/server";

const BOT = process.env.TELEGRAM_BOT_TOKEN;
const CHAT = process.env.TELEGRAM_CHAT_ID;

/**
 * Безопасно парсим тело запроса. Если пусто или не JSON – вернём null.
 */
async function safeParseJSON(request) {
  try {
    const text = await request.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    /* ───── 1. Читаем и валидируем тело ───── */
    const body = await safeParseJSON(req);
    const incident = body?.incident;
    if (!incident || !incident.start_date) {
      return NextResponse.json(
        { ok: false, error: "Empty or invalid body" },
        { status: 400 }
      );
    }

    /* ───── 2. Собираем текст сообщения ───── */
    const a = incident.AddressInfo ?? {};
    const d = incident.DisruptionStats ?? {};

    const text = [
      "🆕 *ТН*",
      `*${incident.start_date}* ${incident.start_time?.slice(0, 5) || ""}`,
      a.city_name || "—",
      (a.Street ?? []).map((s) => s.street_name).join(", ") || "—",
      "",
      incident.description?.[0]?.children?.[0]?.text ?? "",
      "",
      `*Нас. пунктов*: ${d.affected_settlements ?? 0}`,
      `*Жителей*:      ${d.affected_residents ?? 0}`,
      `*МКД*:          ${d.affected_mkd ?? 0}`,
      `*Больниц*:      ${d.affected_hospitals ?? 0}`,
      `*Котельных*:    ${d.boiler_shutdown ?? 0}`,
    ]
      .filter(Boolean)
      .join("\n");

    /* ───── 3. Отправляем в Telegram ───── */
    const tgRes = await fetch(
      `https://api.telegram.org/bot${BOT}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT,
          text,
          parse_mode: "Markdown",
        }),
      }
    );

    if (!tgRes.ok) {
      const errText = await tgRes.text();
      throw new Error(`Telegram API error: ${tgRes.status} – ${errText}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram error:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

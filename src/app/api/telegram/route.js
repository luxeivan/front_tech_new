import { NextResponse } from "next/server";

const BOT = process.env.TELEGRAM_BOT_TOKEN;
const CHAT = process.env.TELEGRAM_CHAT_ID;

export async function POST(req) {
  try {
    const { incident } = await req.json();

    const a = incident.AddressInfo ?? {};
    const d = incident.DisruptionStats ?? {};

    const text = [
      `🆕 *ТН*`,
      `*${incident.start_date}* ${incident.start_time?.slice(0, 5)}`,
      a.city_name || "—",
      (a.Street ?? []).map((s) => s.street_name).join(", ") || "—",
      "",
      incident.description?.[0]?.children?.[0]?.text ?? "",
      "",
      `*Нас. пунктов*: ${d.affected_settlements ?? 0}`,
      `*Жителей*: ${d.affected_residents ?? 0}`,
      `*МКД*: ${d.affected_mkd ?? 0}`,
      `*Больниц*: ${d.affected_hospitals ?? 0}`,
      `*Котельных*: ${d.boiler_shutdown ?? 0}`,
    ]
      .filter(Boolean)
      .join("\n");

    await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT,
        text,
        parse_mode: "Markdown",
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

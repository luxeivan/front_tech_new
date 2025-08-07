import { NextResponse } from "next/server";
import { clients } from '@/app/api/event/route';

// API-роут для приема уведомлений от вебхуков Strapi
export async function POST(request) {
  try {
    // Читаем тело запроса как JSON для получения данных о новом ТН
    const payload = await request.json();
    // Логируем успешное получение вебхука
    console.log("📬 Вебхук: получен POST-запрос от Strapi");
    console.log("📦 Полезная нагрузка:", JSON.stringify(payload, null, 2));

    // фильтрация: обрабатываем только записи контента ТН
    // if (payload.model !== "api::tn.tn") {
    //   console.log("⚠️ Вебхук: это не ТН, пропускаем");
    //   return NextResponse.json({ skipped: true }, { status: 200 });
    // }
    console.log("🔍 Вебхук: модель записи =", payload.model);
    console.log("✔️ ТН событие:", payload.event);

    // 🔔 Рассылаем новое событие всем SSE-клиентам
    for (const [clientId, writer] of clients) {
      writer.write(`event: message\n`);
      writer.write(`data: ${JSON.stringify(payload)}\n\n`);
    }

    return NextResponse.json(
      { message: "Вебхук успешно принят" },
      { status: 200 }
    );
  } catch (error) {
    // Логируем возникшую ошибку
    console.error("❗️ Вебхук: ошибка при обработке POST-запроса:", error);
    return NextResponse.json(
      { error: "Ошибка обработки вебхука" },
      { status: 500 }
    );
  }
}

// Проверка работоспособности эндпоинта вебхука (health check)
export async function GET() {
  console.log("🔍 Вебхук: получен GET-запрос на проверку статуса");
  return NextResponse.json(
    { message: "Эндпоинт вебхука доступен" },
    { status: 200 }
  );
}

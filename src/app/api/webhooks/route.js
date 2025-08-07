import { NextResponse } from "next/server";

// API-роут для приема уведомлений от вебхуков Strapi
export async function POST(request) {
  try {
    // Читаем тело запроса как JSON для получения данных о новом ТН
    const payload = await request.json();
    // Логируем успешное получение вебхука
    console.log("📬 Вебхук: получен POST-запрос от Strapi");
    console.log("📦 Полезная нагрузка:", JSON.stringify(payload, null, 2));
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

import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const payload = await request.json();
    // Проверяем, что пришёл непустой объект
    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload) ||
      Object.keys(payload).length === 0
    ) {
      return NextResponse.json(
        { status: "error", message: "Пустой или некорректный JSON" },
        { status: 400 }
      );
    }
    //Потом  тут где-то можно вызвать логику сохранения в Strapi
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Ошибка в энд-пойнте /api/modus:", err);
    return NextResponse.json(
      {
        status: "error",
        message: "Неверный JSON или внутренняя ошибка сервера",
      },
      { status: 400 }
    );
  }
}

export function GET() {
  return NextResponse.json(
    { status: "error", message: "Используйте POST с телом JSON" },
    { status: 405 }
  );
}

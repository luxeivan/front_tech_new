import { NextResponse } from "next/server";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL; 

export async function POST(req) {
  try {

    /* ---------- 1. Проверяем заголовок Authorization ---------- */
    const auth = req.headers.get("authorization") || "";
    if (!auth.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json(
        {
          status: "error",
          message: "Требуется заголовок Authorization: Bearer <token>",
        },
        { status: 401 }
      );
    }
    const token = auth.split(" ")[1];

    /* ---------- 2. Валидируем токен у Strapi ---------- */
    const check = await fetch(`${STRAPI}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!check.ok) {
      return NextResponse.json(
        { status: "error", message: "Недействительный или просроченный токен" },
        { status: 401 }
      );
    }

    // Если нужно ограничить ролью (например, только role.type === 'modus'):
    // const user = await check.json();
    // if (user.role?.type !== 'modus') {
    //   return NextResponse.json(
    //     { status: 'error', message: 'Недостаточно прав' },
    //     { status: 403 }
    //   );
    // }

    /* ---------- 3. Читаем тело запроса ---------- */
    let data;
    try {
      data = await req.json();
    } catch {
      return NextResponse.json(
        { status: "error", message: "Тело запроса не является JSON" },
        { status: 400 }
      );
    }

    if (
      !data || // null / undefined
      Array.isArray(data) || // массив
      Object.keys(data).length === 0 // пустой объект
    ) {
      return NextResponse.json(
        { status: "error", message: "Пустой JSON-объект" },
        { status: 400 }
      );
    }

    /* ---------- 4. Здесь будет логика записи в Strapi ---------- */

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Modus API error:", err);
    return NextResponse.json(
      { status: "error", message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/* ----------------------------------------------------------------
   Метод GET — чтобы «случайный» грамотный злоумышленник не пытался:
---------------------------------------------------------------- */
export function GET() {
  return NextResponse.json(
    { status: "error", message: "Используйте POST для отправки данных" },
    { status: 405 }
  );
}

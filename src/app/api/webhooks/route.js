import { NextResponse } from 'next/server';
// Обрабатываем входящие запросы на вебхук
export async function POST(request) {
  try {
    // Читаем тело запроса как JSON
    const payload = await request.json();
    // Логируем получение нового события
    console.log('Вебхук: получен POST-запрос');
    console.log('Полезная нагрузка:', JSON.stringify(payload, null, 2));
    return NextResponse.json(
      { message: 'Вебхук успешно принят' },
      { status: 200 }
    );
  } catch (error) {
    // Логируем ошибку при обработке
    console.error('Ошибка при обработке POST-запроса вебхука:', error);
    return NextResponse.json(
      { error: 'Ошибка обработки вебхука' },
      { status: 500 }
    );
  }
}

// Обрабатываем GET-запрос для проверки статуса эндпоинта
export async function GET() {
  // Логируем проверочный запрос
  console.log('Вебхук: получен GET-запрос на проверку статуса');
  return NextResponse.json(
    { message: 'Эндпоинт вебхука доступен' },
    { status: 200 }
  );
}
export const runtime = "nodejs";

export const clients = new Map();

function safeRemove(id, writer) {
  try {
    writer.close();
  } catch {}
  clients.delete(id);
}

// единая отправка всем клиентам с защитой от ошибок
export function broadcast(payload) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const [id, writer] of clients) {
    try {
      writer.write("event: message\n");
      writer.write(data);
    } catch (e) {
      console.error("SSE writer error, drop client", id, e?.message);
      safeRemove(id, writer);
    }
  }
}

// SSE endpoint
export async function GET(request) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const clientId = Date.now() + Math.random();
  clients.set(clientId, writer);
  console.log(
    `📡 SSE: клиент подключен (${clientId}), всего клиентов: ${clients.size}`
  );

  request.signal.addEventListener("abort", () => {
    console.log(`📴 SSE: клиент отключен (${clientId})`);
    safeRemove(clientId, writer);
  });

  writer.write("event: message\n");
  writer.write(`data: ${JSON.stringify({ message: "Подключено к SSE" })}\n\n`);

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const payload = await request.json();
    console.log("📬 SSE POST: получен payload:", payload);
    broadcast(payload);
    return NextResponse.json({ message: "Событие разослано клиентам" });
  } catch (err) {
    console.error("❗️ SSE POST error:", err);
    return NextResponse.json(
      { error: "Ошибка рассылки события" },
      { status: 500 }
    );
  }
}

// export const runtime = 'nodejs';

// export const clients = new Map();

// // SSE endpoint: подписываем клиентов на события
// export async function GET(request) {
//   const { readable, writable } = new TransformStream();
//   const writer = writable.getWriter();
//   const clientId = Date.now() + Math.random();
//   clients.set(clientId, writer);
//   console.log(`📡 SSE: клиент подключен (${clientId}), всего клиентов: ${clients.size}`);

//   // Удаляем клиента при отключении
//   request.signal.addEventListener('abort', () => {
//     console.log(`📴 SSE: клиент отключен (${clientId})`);
//     writer.close();
//     clients.delete(clientId);
//   });

//   // Отправляем приветственное сообщение
//   writer.write(`event: message\n`);
//   writer.write(`data: ${JSON.stringify({ message: 'Подключено к SSE' })}\n\n`);

//   return new Response(readable, {
//     headers: {
//       'Content-Type': 'text/event-stream',
//       'Cache-Control': 'no-cache, no-transform',
//       Connection: 'keep-alive',
//     },
//   });
// }

// // Broadcast endpoint: рассылаем полученный payload всем подписанным клиентам
// import { NextResponse } from 'next/server';

// export async function POST(request) {
//   try {
//     const payload = await request.json();
//     console.log('📬 SSE POST: получен payload:', payload);
//     for (const [id, writer] of clients) {
//       writer.write(`event: message\n`);
//       writer.write(`data: ${JSON.stringify(payload)}\n\n`);
//     }
//     return NextResponse.json({ message: 'Событие разослано клиентам' });
//   } catch (err) {
//     console.error('❗️ SSE POST error:', err);
//     return NextResponse.json({ error: 'Ошибка рассылки события' }, { status: 500 });
//   }
// }

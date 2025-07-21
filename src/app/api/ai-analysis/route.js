import { NextResponse } from "next/server";
console.log("🔥 PROD OPENROUTER_API_KEY =", process.env.OPENROUTER_API_KEY);
import axios from "axios";

const COMMON_SYS =
  "Вы — дружелюбный AI-аналитик технологических нарушений в Московской области. " +
  "Анализируй статистику. Не добавляй лишних маркеров.";

const MODELS = [
  "openai/gpt-4o-mini",          // основной бесплатный модельный вариант
  "anthropic/claude-3-haiku-20240307", // fallback #1
  "mistralai/mistral-7b-instruct",     // fallback #2
];

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    let answer = null;
    for (const model of MODELS) {
      try {
        const { data } = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model,
            messages: [
              { role: "system", content: COMMON_SYS },
              { role: "user", content: prompt },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
            },
            timeout: 20000,
          }
        );
        answer = data.choices?.[0]?.message?.content?.trim();
        if (answer) break;
      } catch (e) {
        console.warn("openrouter failure for model", model, e.message);
      }
    }

    if (!answer) {
      return NextResponse.json(
        { text: "Не удалось получить ответ от AI." },
        { status: 500 }
      );
    }

    // return NextResponse.json({ text: answer });

    const response = NextResponse.json({ text: answer });
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch (e) {
    console.error("AI-analysis route error", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// src/app/api/modus/route.js
import { NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

function logBlock(title, obj = "") {
  const stamp = new Date().toISOString();
  console.log(`\n==== ${title} @ ${stamp} ===`);
  if (obj !== "") console.dir(obj, { depth: null, colors: true });
  console.log("================================\n");
}

// корректный роут для коллекции «Социальные объекты» (plural API ID)
const SO_ENDPOINT = "/api/soczialnye-obekties";
const SO_COMP_KEY = "SocialObjects"; // relation‑component key inside TN
const SO_REL_FIELD = "SocialObjects"; // relation field inside component (this is also the name of the component itself in TH)

/** Унифицированный запрос к Strapi (возвращает id созданной/обновлённой записи) */
async function strapiReq(method, endpoint, payload, auth = "") {
  logBlock(`STRAPI ➜ ${method} ${endpoint}`, payload);

  const res = await fetch(`${STRAPI_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const raw = await res.text();

  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { error: { message: raw.trim() } };
  }

  if (!res.ok) {
    logBlock(`STRAPI ✖ ${method} ${endpoint} — ERROR ${res.status}`, data);
    const msg = data?.error?.message || `Strapi ${method} ${endpoint} error`;
    throw new Error(msg);
  }

  logBlock(`STRAPI ✔ ${method} ${endpoint} — OK`, data);
  return data.data?.id;
}
// ---------------------------------------------------------------------------

export async function POST(req) {
  try {
    const auth = req.headers.get("authorization") || "";
    const { MetaData = {}, Data } = await req.json();

    // допустим отсутствие MetaData — по умолчанию берём пустой объект
    if (!Array.isArray(Data) || Data.length === 0)
      return NextResponse.json(
        { error: "Неверный формат: ждём { Data: [...] }" },
        { status: 400 }
      );

    // Изменения здесь: mapValue теперь не добавляет 'label',
    // чтобы Strapi использовал свои дефолтные лейблы.
    const mapValue = (rec) =>
      Object.fromEntries(
        Object.entries(rec).map(([k, v]) => {
          // MetaData[k] больше не используется для label
          return [
            k,
            {
              value:
                typeof v === "string" &&
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}[+Z-]/.test(v)
                  ? new Date(v).toISOString()
                  : v,
              // label удален, Strapi будет использовать свой дефолтный
              // edit и filter, если они есть в MetaData, могут быть добавлены,
              // но для label это не нужно.
            },
          ];
        })
      );

    const results = [];

    for (const row of Data) {
      // отделяем соц‑объекты от остальных полей
      const { SocialObjects: rawSO = [], ...rest } = row;

      // обычные поля ТН
      const tnData = mapValue(rest);

      // сначала создаём сами соц‑объекты
      const soComponents = [];
      for (const so of rawSO) {
        const soPayload = { data: mapValue(so) };
        const soId = await strapiReq("POST", SO_ENDPOINT, soPayload, auth);

        // Исправление здесь: компонент с отношением должен указывать на ID созданного элемента
        // Если 'SocialObjects' это имя компонента и он содержит отношение 'SocialObjects',
        // то структура должна быть { component_name: { relation_field_name: soId } }
        // Или, если это просто отношение к коллекции "Социальные объекты" напрямую в компоненте SocialObjects,
        // то { field_name: soId }
        // Исходя из вашего скриншота "Снимок экрана 2025-07-18 в 10.40.08.png",
        // SocialObjects - это repeatable компонент, который внутри содержит поле SocialObjects (relation with Социальные объекты).
        // Поэтому структура должна быть { SocialObjects: soId }
        soComponents.push({ SocialObjects: soId });
      }

      if (soComponents.length) {
        // Здесь мы назначаем массив компонентов в поле SO_COMP_KEY
        // Убедитесь, что SO_COMP_KEY ('SocialObjects') правильно соответствует API ID компонента в Strapi
        tnData[SO_COMP_KEY] = soComponents;
      }

      // создаём/сохраняем ТН
      const tnId = await strapiReq("POST", "/api/tns", { data: tnData }, auth);
      results.push({ id: tnId });
      logBlock("TN created", { tnId, soCount: soComponents.length });
    }

    return NextResponse.json({ status: "ok", results });
  } catch (e) {
    logBlock("MODUS route unhandled error", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

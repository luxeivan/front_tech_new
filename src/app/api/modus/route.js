import { NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

function logBlock(title, obj = "") {
  const stamp = new Date().toISOString();
  console.log(`\n==== ${title} @ ${stamp} ===`);
  if (obj !== "") console.dir(obj, { depth: null, colors: true });
  console.log("================================\n");
}

const SO_ENDPOINT = "/api/soczialnye-obekties";
const SO_COMP_KEY = "SocialObjects"; 
const SO_REL_FIELD = "SocialObjects";

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
export async function POST(req) {
  try {
    const auth = req.headers.get("authorization") || "";
    const { MetaData = {}, Data } = await req.json();
    if (!Array.isArray(Data) || Data.length === 0)
      return NextResponse.json(
        { error: "Неверный формат: ждём { Data: [...] }" },
        { status: 400 }
      );
    const mapValue = (rec) =>
      Object.fromEntries(
        Object.entries(rec).map(([k, v]) => {
          return [
            k,
            {
              value:
                typeof v === "string" &&
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}[+Z-]/.test(v)
                  ? new Date(v).toISOString()
                  : v,
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
        soComponents.push({ SocialObjects: soId });
      }

      if (soComponents.length) {
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

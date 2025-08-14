import { NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

// ─── helpers ──────────────────────────────────────────────────────────
function logBlock(title, obj = "") {
  const stamp = new Date().toISOString();
  console.log(`\n==== ${title} @ ${stamp} ===`);
  if (obj !== "") console.dir(obj, { depth: null, colors: true });
  console.log("================================\n");
}

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
  return data.data; // возвращаем всю data (а не только id)
}

// ─── константы ────────────────────────────────────────────────────────
const SO_ENDPOINT = "/api/soczialnye-obekties";
const SO_COMP_KEY = "SocialObjects";

// все числовые поля, которые нужно агрегировать в «Дашборд»
const NUM_FIELDS = [
  "TP_ALL",
  "LINESN_ALL",
  "DISTRICT",
  "POPULATION_COUNT",
  "MKD_ALL",
  "PRIVATE_HOUSE_ALL",
  "SNT_ALL",
  "BOILER_ALL",
  "CTP_ALL",
  "WELLS_ALL",
  "KNS_ALL",
  "HOSPITALS_ALL",
  "CLINICS_ALL",
  "SCHOOLS_ALL",
  "KINDERGARTENS_ALL",
  "BRIGADECOUNT",
  "EMPLOYEECOUNT",
  "SPECIALTECHNIQUECOUNT",
  "PES_COUNT",
];

// ─── основные функции ────────────────────────────────────────────────
function mapValue(rec) {
  return Object.fromEntries(
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
}

// аккумулируем суммы для Dashboard
function accumulateDelta(delta, row) {
  NUM_FIELDS.forEach((f) => {
    const val = Number(row[f]) || 0;
    if (!delta[f]) delta[f] = 0;
    delta[f] += val;
  });
  return delta;
}

// ─── API handler ──────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const auth = req.headers.get("authorization") || "";
    const { MetaData = {}, Data } = await req.json();
    if (!Array.isArray(Data) || Data.length === 0)
      return NextResponse.json(
        { error: "Неверный формат: ждём { Data: [...] }" },
        { status: 400 }
      );

    const results = [];
    let dashboardDelta = {};

    // 1. Создаём ТН + Соц‑объекты, параллельно собираем дельту
    for (const row of Data) {
      const { SocialObjects: rawSO = [], ...rest } = row;

      // обычные поля ТН
      const tnData = mapValue(rest);

      // создаём соц‑объекты
      const soComponents = [];
      for (const soRow of rawSO) {
        const mappedSo = mapValue(soRow);
        const soPayload = { data: mappedSo };
        const soRes = await strapiReq("POST", SO_ENDPOINT, soPayload, auth);
        soComponents.push({ [SO_COMP_KEY]: soRes.id });
      }
      if (soComponents.length) {
        tnData[SO_COMP_KEY] = soComponents;
      }

      // создаём ТН
      const tnPayload = { data: tnData };
      const tnRes = await strapiReq("POST", "/api/tns", tnPayload, auth);
      results.push({ id: tnRes.id });

      // накапливаем дельту
      dashboardDelta = accumulateDelta(dashboardDelta, rest);
    }

    // 2. Читаем (или создаём) запись Dashboard
    const dashList = await strapiReq(
      "GET",
      "/api/dashboards?pagination[limit]=1",
      undefined,
      auth
    );
    let dashId = dashList.length ? dashList[0].id : null;
    let dashData = dashList.length ? dashList[0] : {};
    if (!dashData) dashData = {};

    // берём текущий список из Dash (если был)
    const existingList = Array.isArray(dashData.districtList)
      ? dashData.districtList
      : [];

    const districtSet = new Set(existingList);

    // добавляем районы из только что пришедших строк
    Data.forEach((row) => {
      const d = row.DISTRICT;
      if (typeof d === "string" && d.trim()) districtSet.add(d.trim());
    });

    const districtCount = districtSet.size;

    if (!dashId) {
      /* ---------- создаём запись Дашборда сразу с агрегатами ---------- */
      const initData = Object.fromEntries(
        NUM_FIELDS.map((k) => [
          k,
          String(Number(dashboardDelta[k]) || 0),
        ])
      );
      // DISTRICT и districtList
      initData["DISTRICT"] = String(districtCount);
      initData["districtList"] = Array.from(districtSet);

      const newDash = await strapiReq(
        "POST",
        "/api/dashboards",
        { data: initData },
        auth
      );
      dashId = newDash.id;
      dashData = newDash;
      // так как запись уже содержит агрегаты – дальнейшее PATCH не требуется
      return NextResponse.json({
        status: "ok",
        tnResults: results,
        dashId,
        note: "Dashboard created with initial aggregates",
      });
    }

    /* ---------- обновляем существующий Dashboard ---------- */
    const patched = {};

    NUM_FIELDS.forEach((f) => {
      const cur = Number(dashData[f]) || 0;          // старое (строка) → число
      const add = Number(dashboardDelta[f]) || 0;    // дельта
      patched[f] = String(cur + add);                // записываем строкой
    });

    // DISTRICT и districtList переопределяем
    patched["DISTRICT"] = String(districtCount);
    patched["districtList"] = Array.from(districtSet);

    await strapiReq(
      "PUT",
      `/api/dashboards/${dashId}`,
      { data: patched },
      auth
    );

    return NextResponse.json({ status: "ok", tnResults: results, dashId });
  } catch (e) {
    logBlock("MODUS‑TEST route unhandled error", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

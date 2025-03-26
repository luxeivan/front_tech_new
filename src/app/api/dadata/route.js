import { NextResponse } from "next/server";
import axios from "axios";

const DADATA_TOKEN = process.env.DADATA_TOKEN;
const DADATA_BASE_URL = "https://suggestions.dadata.ru/suggestions/api/4_1/rs";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const mode = searchParams.get("mode") || "address"; // "address" или "street"
    const city_fias_id = searchParams.get("city_fias_id") || null;

    if (!query) {
      return NextResponse.json(
        { status: "error", message: "Отсутствует параметр 'query'" },
        { status: 400 }
      );
    }

    let body = {};
    if (mode === "street") {
      // Для поиска улиц: ограничиваем по границам "street"
      body = {
        query,
        from_bound: { value: "street" },
        to_bound: { value: "street" },
      };
      if (city_fias_id) {
        body.locations = [{ city_fias_id }];
      } else {
        // Если город не выбран, всё равно ограничим область до Московской области
        body.locations = [{ kladr_id: "50" }];
      }
    } else {
      // По умолчанию ищем населённые пункты
      body = {
        query,
        from_bound: { value: "city" },
        to_bound: { value: "settlement" },
        locations: [{ kladr_id: "50" }],
      };
    }

    const response = await axios.post(
      `${DADATA_BASE_URL}/suggest/address`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Token ${DADATA_TOKEN}`,
        },
      }
    );

    return NextResponse.json({
      status: "ok",
      data: response.data.suggestions,
    });
  } catch (error) {
    console.error("Ошибка запроса к DaData:", error);
    return NextResponse.json(
      { status: "error", message: "Ошибка запроса к DaData" },
      { status: 500 }
    );
  }
}

// import { NextResponse } from "next/server";
// import axios from "axios";

// // Токен из .env.local
// const DADATA_TOKEN = process.env.DADATA_TOKEN;

// // Базовый URL DaData
// const DADATA_BASE_URL = "https://suggestions.dadata.ru/suggestions/api/4_1/rs";

// export async function GET(req) {
//   try {
//     // Парсим query-параметры из URL (например ?query=Озер)
//     const { searchParams } = new URL(req.url);
//     const query = searchParams.get("query") || "";

//     // Если не указали query, выбрасываем 400
//     if (!query) {
//       return NextResponse.json(
//         { status: "error", message: "Отсутствует параметр 'query'" },
//         { status: 400 }
//       );
//     }

//     // Если нужно ограничивать результат только МО (kladr_id: "50"):
//     // и задаём границы from_bound / to_bound (например, от "city" до "settlement")
//     const body = {
//       query,
//       from_bound: { value: "city" },
//       to_bound: { value: "settlement" },
//       locations: [{ kladr_id: "50" }], // Ограничение по Московской области
//     };

//     // Делаем запрос на DaData
//     const response = await axios.post(
//       `${DADATA_BASE_URL}/suggest/address`,
//       body,
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "application/json",
//           Authorization: `Token ${DADATA_TOKEN}`,
//         },
//       }
//     );

//     // Возвращаем массив подсказок
//     return NextResponse.json({
//       status: "ok",
//       data: response.data.suggestions,
//     });
//   } catch (error) {
//     console.error("Ошибка запроса к DaData:", error);
//     return NextResponse.json(
//       { status: "error", message: "Ошибка запроса к DaData" },
//       { status: 500 }
//     );
//   }
// }

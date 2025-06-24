// src/app/api/dadata/route.js
import { NextResponse } from "next/server";
import axios from "axios";

const DADATA_TOKEN = process.env.DADATA_TOKEN;
const BASE_URL = "https://suggestions.dadata.ru/suggestions/api/4_1/rs";

export async function GET(req) {
  try {
    if (!DADATA_TOKEN) {
      console.error("⛔  DADATA_TOKEN is not set in .env");
      return NextResponse.json(
        {
          status: "error",
          message: "DaData token is not configured on server",
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const mode = searchParams.get("mode") || "address"; // "address" | "street"
    const city_fias_id = searchParams.get("city_fias_id");

    if (!query.trim()) {
      return NextResponse.json(
        { status: "error", message: "Missing 'query' parameter" },
        { status: 400 }
      );
    }

    let body = {};
    if (mode === "street") {
      body = { query, count: 10 };
      if (city_fias_id) {
        body.locations = [{ city_fias_id }];
      } else {
        body.locations = [{ kladr_id: "50" }]; // Московская область fallback
      }
    } else {
      // mode === "address" → ищем населённые пункты МО
      body = {
        query,
        count: 10,
        locations: [{ kladr_id: "50" }],
        from_bound: { value: "city" },
        to_bound: { value: "settlement" },
      };
    }

    const { data } = await axios.post(`${BASE_URL}/suggest/address`, body, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Token ${DADATA_TOKEN}`,
      },
    });

    return NextResponse.json({ status: "ok", data: data.suggestions || [] });
  } catch (error) {
    if (error.response) {
      console.error(
        "DaData →",
        error.response.status,
        JSON.stringify(error.response.data)
      );
    } else {
      console.error("DaData fetch error:", error.message);
    }

    // Фолбэк: возвращаем пустой список, чтобы UI не падал
    return NextResponse.json({ status: "ok", data: [] });
  }
}

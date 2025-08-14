import { NextResponse } from "next/server";
import axios from "axios";

const DADATA_TOKEN = process.env.DADATA_TOKEN;
const BASE_URL = "https://suggestions.dadata.ru/suggestions/api/4_1/rs";

export async function GET(req) {
  try {
    if (!DADATA_TOKEN) {
      return NextResponse.json(
        { status: "error", message: "DADATA_TOKEN не задан на сервере" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const mode = searchParams.get("mode") || "";

    if (!query.trim() || mode !== "findById") {
      return NextResponse.json(
        { status: "error", message: "Некорректные или отсутствующие параметры" },
        { status: 400 }
      );
    }

    const resp = await axios.post(
      `${BASE_URL}/findById/address`,
      { query },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Token ${DADATA_TOKEN}`,
        },
      }
    );

    return NextResponse.json(resp.data.suggestions || []);
  } catch (error) {
    console.error("Ошибка обращения к DaData API");
    return NextResponse.json([]);
  }
}

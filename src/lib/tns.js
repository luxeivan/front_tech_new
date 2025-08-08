// сервер/клиент-утилиты для работы с ТН
export async function fetchTns({ token, statusValue = null, full = false }) {
  const pageSize = 100;
  let page = 1;
  const out = [];
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const populate = full
    ? "populate=*"
    : "populate[0]=VIOLATION_GUID_STR&populate[1]=STATUS_NAME";

  while (true) {
    const qs = [
      `pagination[page]=${page}`,
      `pagination[pageSize]=${pageSize}`,
      populate,
    ];
    if (statusValue) {
      qs.push(
        "filters[STATUS_NAME][value][$eqi]=" + encodeURIComponent(statusValue)
      );
    }

    const url = `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns?${qs.join("&")}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    out.push(...(json.data ?? []).map((d) => d.attributes ?? d));

    if (page >= (json.meta?.pagination?.pageCount ?? 1)) break;
    page += 1;
  }
  return out;
}

export const getGuid = (item) =>
  (
    item?.VIOLATION_GUID_STR?.value ??
    (typeof item?.VIOLATION_GUID_STR === "string"
      ? item.VIOLATION_GUID_STR
      : null)
  )
    ?.trim()
    ?.toUpperCase() || null;

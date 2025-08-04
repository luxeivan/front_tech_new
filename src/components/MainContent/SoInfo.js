

import React from "react";
import { Descriptions, Divider } from "antd";
import { useSession } from "next-auth/react";


const SoInfo = ({ tnId, docId }) => {
  const [docIds, setDocIds] = React.useState(null);
  const [details, setDetails] = React.useState({});
  const { data: session } = useSession();
  const token = session?.user?.jwt;

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns/${docId}?populate[SocialObjects][populate]=*`,
          { headers: { Authorization: token ? `Bearer ${token}` : undefined } }
        );
        const json = await res.json();
        const list = Array.isArray(json?.data?.SocialObjects)
          ? json.data.SocialObjects.flatMap((c) =>
              Array.isArray(c.SocialObjects)
                ? c.SocialObjects.map((o) => o.documentId).filter(Boolean)
                : []
            )
          : [];

        if (!cancelled) {
          setDocIds(list);
          console.log(
            `Соц объекты для ТН ${tnId}:`,
            list.length ? `${list.length} → ${list.join(", ")}` : "нет"
          );
        }
      } catch (e) {
        console.error("Ошибка загрузки соц‑объектов (список)", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tnId, docId, token]);

  React.useEffect(() => {
    if (!docIds) return;

    docIds.forEach(async (id) => {
      if (details[id] !== undefined) return;

      setDetails((prev) => ({ ...prev, [id]: null }));

      try {
        const url =
          `${process.env.NEXT_PUBLIC_STRAPI_URL}` +
          `/api/soczialnye-obekties?filters[documentId][$eq]=${id}&populate=*`;
        const res = await fetch(url, {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
        });
        const json = await res.json();
        const so = json?.data?.[0] ?? undefined;

        setDetails((prev) => ({ ...prev, [id]: so }));
      } catch (e) {
        console.error("Ошибка загрузки соц‑объекта", id, e);
        setDetails((prev) => ({ ...prev, [id]: undefined }));
      }
    });
  }, [docIds, details, token]);

  if (!docIds || docIds.length === 0) return null;

  return (
    <>
      <Divider orientation="left" style={{ marginTop: 12 }}>
        Соц&nbsp;объекты ({docIds.length})
      </Divider>

      {docIds.map((id) => {
        const so = details[id];

        if (so === null) {
          return (
            <div key={id} style={{ marginBottom: 8 }}>
              {id} &nbsp;— загрузка…
            </div>
          );
        }

        if (so === undefined) {
          return (
            <div key={id} style={{ marginBottom: 8, color: "#c41d7f" }}>
              {id} &nbsp;— не найден
            </div>
          );
        }

        const fields = Object.entries(so).filter(
          ([, v]) => v && typeof v === "object" && "label" in v && v.value
        );

        return (
          <Descriptions
            key={id}
            size="small"
            bordered
            column={2}
            title={so.Name?.value || id}
            style={{ marginBottom: 12 }}
            items={fields.map(([k, v]) => ({
              key: k,
              label: v.label,
              children: String(v.value),
            }))}
          />
        );
      })}
    </>
  );
};

export default SoInfo;
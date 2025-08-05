import { useMemo } from "react";
import dayjs from "dayjs";
import { iconMap } from "../constants";
import utc from "dayjs/plugin/utc";
import local from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(local);
/**
 * Возвращает columns и dataSource для таблицы,
 * а также renderDesc (генератор items для <Descriptions />).
 */
export default function useTableData({ rows, page, pageSize, openEdit }) {
  /* ---------- dataSource ---------- */
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  const FIVE_MIN_MS = 5 * 60 * 1000;

  /* ---------- dataSource + метка «new» ---------- */
  const now = Date.now();
  const dataSource = paginated.map((item) => {
    const ts =
      item.F81_060_EVENTDATETIME?.value ??
      item.CREATE_DATETIME?.value ??
      item.createdAt;

    return {
      key: item.id,
      raw: item,
      isNew: ts && now - dayjs(ts).valueOf() < FIVE_MIN_MS,
      number: item.F81_010_NUMBER?.value ?? "—",
      objectN: item.F81_041_ENERGOOBJECTNAME?.value ?? "—",
      address: item.ADDRESS_LIST?.value ?? "—",
      dispCenter: item.DISPCENTER_NAME_?.value ?? "—",
      status: item.STATUS_NAME?.value ?? "—",
      eventDate: ts ? dayjs(ts).local().format("DD.MM.YYYY HH:mm") : "—",
    };
  });

  /* ---------- columns ---------- */
  const columns = [
    { title: "№ ТН", dataIndex: "number", key: "number" },
    { title: "Объект", dataIndex: "objectN", key: "objectN" },
    { title: "Адреса", dataIndex: "address", key: "address" },
    { title: "Дисп. центр", dataIndex: "dispCenter", key: "dispCenter" },
    { title: "Статус", dataIndex: "status", key: "status" },
    { title: "Дата/время", dataIndex: "eventDate", key: "eventDate" },
  ];

  /* ---------- helper для Descriptions ---------- */
  const renderDesc = (fields) =>
    fields.map(([key, v], idx) => {
      const zebra = idx % 2 ? "#fafafa" : undefined;
      const editable = v.edit === "Да";
      return {
        key,
        label: (
          <>
            {iconMap[key]}
            {v.label}
          </>
        ),
        children: (
          <>
            {String(
              typeof v.value === "object" ? JSON.stringify(v.value) : v.value
            )}
            {editable && openEdit && openEdit(v)}
          </>
        ),
        labelStyle: { background: editable ? "#f6ffed" : zebra },
        contentStyle: { background: editable ? "#f6ffed" : zebra },
      };
    });

  return { dataSource, columns, renderDesc };
}

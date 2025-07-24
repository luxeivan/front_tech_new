"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Modal, Descriptions, Input, message, Button } from "antd";
import { EditOutlined } from "@ant-design/icons";

// Маппинг муниципалитетов
const DISTRICT_MAP = {
  "Балашиха г.о.": "4",
  "Богородский г.о.": "81",
  "Бронницы г.о.": "5",
  "Власиха (ЗАТО) г.о.": "84",
  "Волоколамск г.о.": "6",
  "Воскресенск г.о.": "7",
  "Восход (ЗАТО) г.о.": "85",
  "Дзержинский г.о.": "16",
  "Дмитровский г.о.": "17",
  "Долгопрудный г.о.": "18",
  "Домодедово г.о.": "19",
  "Дубна г.о.": "20",
  "Егорьевск г.о.": "21",
  "Жуковский г.о.": "23",
  "Зарайск г.о.": "24",
  "Звездный городок г.о.": "91",
  "Истра г.о.": "27",
  "Кашира г.о.": "28",
  "Клин г.о.": "31",
  "Коломна г.о.": "32",
  "Королев г.о.": "34",
  "Котельники г.о.": "83",
  "Красногорск г.о.": "36",
  "Краснознаменск г.о.": "37",
  "Ленинский г.о.": "38",
  "Лобня г.о.": "39",
  "Лосино-Петровский г.о.": "88",
  "Лотошино г.о.": "40",
  "Луховицы г.о.": "41",
  "Лыткарино г.о.": "42",
  "Люберцы г.о.": "43",
  "Можайский г.о.": "44",
  "Молодежный (ЗАТО) г.о.": "90",
  "Мытищи г.о.": "46",
  "Наро-Фоминский г.о.": "48",
  "Одинцовский г.о.": "50",
  "Орехово-Зуевский г.о.": "52",
  "Павлово-Посадский г.о.": "54",
  "Подольск г.о.": "56",
  "Протвино г.о.": "57",
  "Пушкинский г.о.": "58",
  "Пущино г.о.": "59",
  "Раменский г.о.": "60",
  "Реутов г.о.": "62",
  "Рузский г.о.": "63",
  "Сергиево-Посадский г.о.": "64",
  "Серебряные Пруды г.о.": "65",
  "Серпухов г.о.": "66",
  "Солнечногорск г.о.": "68",
  "Ступино г.о.": "70",
  "Талдомский г.о.": "71",
  "Фрязино г.о.": "72",
  "Химки г.о.": "73",
  "Черноголовка г.о.": "92",
  "Чехов г.о.": "74",
  "Шатура г.о.": "76",
  "Шаховская г.о.": "77",
  "Щелково г.о.": "78",
  "Электрогорск г.о.": "89",
  "Электросталь г.о.": "79"
};

// Маппинг и константы МинЭнерго
const VIOLATION_TYPE_MAP = {
  "Аварийная заявка": "А",
  "Неплановая заявка": "В",
  "Плановая заявка": "П",
};

const STATUS_NAME_MAP = {
  Открыта: "1",
  Запитана: "4",
  Удалена: "6",
};

const CUSTOM_LABELS = {
  need_brigade_count: "Потребность: Бригады",
  need_person_count: "Потребность: Человек",
  need_equipment_count: "Потребность: Техника",
  need_reserve_power_source_count: "Потребность: Резервные источники",
};
const NEW_FIELDS = Object.keys(CUSTOM_LABELS);

const ME_FIELDS = [
  "VIOLATION_TYPE",
  "STATUS_NAME",
  "F81_060_EVENTDATETIME",
  "F81_070_RESTOR_SUPPLAYDATETIME",
  "POPULATION_COUNT",
  "CREATE_USER",
  "fio_response_phone",
  "description",
  "DISTRICT",
  "district_id",
  "LINE110_ALL",
  "LINE35_ALL",
  "LINESN_ALL",
  "PS110_ALL",
  "PS35_ALL",
  "RPSN_ALL",
  "TP_ALL",
  "BRIGADECOUNT",
  "EMPLOYEECOUNT",
  "SPECIALTECHNIQUECOUNT",
  "PES_COUNT",
  "need_brigade_count",
  "need_person_count",
  "need_equipment_count",
  "need_reserve_power_source_count",
  "VIOLATION_GUID_STR",
];

// Добавленный маппинг TYPE_MAP
const TYPE_MAP = {
  "Аварийная заявка": "emergency",
  "Неплановая заявка": "unplanned",
  "Плановая заявка": "planned",
};

// Функция форматирования даты и времени
// function formatDateTime(dateTimeStr) {
//   if (!dateTimeStr || dateTimeStr === "—") return null;
//   const date = new Date(dateTimeStr);
//   if (isNaN(date.getTime())) return null;
//   const pad = (num) => String(num).padStart(2, "0");
//   return (
//     date.getFullYear() +
//     "-" +
//     pad(date.getMonth() + 1) +
//     "-" +
//     pad(date.getDate()) +
//     " " +
//     pad(date.getHours()) +
//     ":" +
//     pad(date.getMinutes()) +
//     ":" +
//     pad(date.getSeconds())
//   );
// }

export default function MinEnergoSender({ tn, updateField, open, onClose }) {
  const { data: session } = useSession();
  const token = session?.user?.jwt;
  const [draft, setDraft] = useState(
    Object.fromEntries(ME_FIELDS.map((k) => [k, tn[k]?.value ?? "—"]))
  );
  const [editing, setEditing] = useState(null);

  // При открытии обновлять черновик по tn
  React.useEffect(() => {
    if (open) {
      setDraft(
        Object.fromEntries(ME_FIELDS.map((k) => [k, tn[k]?.value ?? "—"]))
      );
    }
  }, [open, tn]);

  // Формируем JSON и выводим в консоль
  const handleSend = () => {
    const toDate = (v, withTime = false) => {
      if (!v || v === "—") return null;
      const d = new Date(v);
      if (isNaN(d)) return null;
      const pad = n => String(n).padStart(2, "0");
      return withTime
        ? `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
        : `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    };

    const payload = {
      time_create: toDate(draft.F81_060_EVENTDATETIME, true),
      incident_id: draft.VIOLATION_GUID_STR || tn.VIOLATION_GUID_STR || null,
      type: TYPE_MAP[draft.VIOLATION_TYPE] || draft.VIOLATION_TYPE || null,
      status:
        STATUS_NAME_MAP[
          (draft.STATUS_NAME || "")
            .trim()
            .replace(/^./, c => c.toUpperCase())
        ] || null,
      plan_date_close: toDate(draft.F81_070_RESTOR_SUPPLAYDATETIME),
      count_people: draft.POPULATION_COUNT !== "—" ? draft.POPULATION_COUNT : null,
      fio_response_work: draft.CREATE_USER !== "—" ? draft.CREATE_USER : null,
      fio_response_phone: draft.fio_response_phone !== "—" ? draft.fio_response_phone : null,
      description: draft.description !== "—" ? draft.description : null,
      district_id: DISTRICT_MAP[draft.DISTRICT] || null,
      resources: [5]
    };

    console.log(
      "Сформированный JSON для МинЭнерго:",
      JSON.stringify(payload, null, 2)
    );
    message.success("Данные отправлены (заглушка)");
    onClose();
  };

  return (
    <Modal
      title="Отправка данных в МинЭнерго"
      open={open}
      onCancel={onClose}
      onOk={handleSend}
      okText="Отправить данные"
      cancelText="Отмена"
      width={900}
    >
      <Descriptions column={2} bordered size="small">
        {ME_FIELDS.map((k) => (
          <Descriptions.Item
            key={k}
            label={tn[k]?.label ?? CUSTOM_LABELS[k] ?? k}
            span={1}
            contentStyle={{
              background:
                tn[k]?.edit === "Да" || NEW_FIELDS.includes(k)
                  ? "#f6ffed"
                  : undefined,
            }}
          >
            {k === "DISTRICT"
              ? `${draft[k] ?? "—"}${DISTRICT_MAP[draft[k]] ? ` (${DISTRICT_MAP[draft[k]]})` : ""}`
              : draft[k] ?? "—"}{" "}
            {(tn[k]?.edit === "Да" || NEW_FIELDS.includes(k)) && (
              <EditOutlined
                style={{ marginLeft: 8, cursor: "pointer" }}
                onClick={() => setEditing({ field: k, value: draft[k] })}
              />
            )}
          </Descriptions.Item>
        ))}
      </Descriptions>
      <Modal
        open={!!editing}
        title={editing ? tn[editing.field]?.label ?? editing.field : ""}
        onOk={async () => {
          if (!editing) return;
          const newVal = editing.value?.trim();
          setDraft((prev) => ({ ...prev, [editing.field]: newVal }));
          // Можно отправлять в Strapi, если нужно:
          try {
            const headers = {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            };
            const docId = tn.documentId;
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns/${docId}`,
              {
                method: "PUT",
                headers,
                body: JSON.stringify({
                  data: { [editing.field]: { value: newVal } },
                }),
              }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            message.success("Поле обновлено");
            updateField?.(tn.id, editing.field, newVal);
          } catch (e) {
            console.error(e);
            message.error("Не удалось сохранить на сервере");
          } finally {
            setEditing(null);
          }
        }}
        onCancel={() => setEditing(null)}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnClose
        mask={false}
      >
        <Input
          value={editing?.value}
          onChange={(e) =>
            setEditing((prev) => ({ ...prev, value: e.target.value }))
          }
          autoFocus
        />
      </Modal>
    </Modal>
  );
}

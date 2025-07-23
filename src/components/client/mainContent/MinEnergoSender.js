"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Modal, Descriptions, Input, message, Button } from "antd";
import { EditOutlined } from "@ant-design/icons";

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
  "DISTRICT",
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
];

// Добавленный маппинг TYPE_MAP
const TYPE_MAP = {
  "Аварийная заявка": "emergency",
  "Неплановая заявка": "unplanned",
  "Плановая заявка": "planned",
};

// Функция форматирования даты и времени
function formatDateTime(dateTimeStr) {
  if (!dateTimeStr || dateTimeStr === "—") return null;
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) return null;
  const pad = (num) => String(num).padStart(2, "0");
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    " " +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds())
  );
}

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
    // time_create
    const time_create = formatDateTime(draft.F81_060_EVENTDATETIME) || null;
    // incident_id
    const incident_id =
      draft.VIOLATION_GUID_STR?.value ??
      tn?.VIOLATION_GUID_STR?.value ??
      draft.VIOLATION_GUID_STR ??
      tn?.VIOLATION_GUID_STR ??
      null;
    // type
    let type = null;
    if ("VIOLATION_TYPE" in draft) {
      if (draft.VIOLATION_TYPE && draft.VIOLATION_TYPE !== "—") {
        type = TYPE_MAP[draft.VIOLATION_TYPE] ?? draft.VIOLATION_TYPE;
      }
    }
    // status (маппинг через STATUS_NAME_MAP)
    let status = null;
    let statusValue = draft.STATUS_NAME ?? tn?.STATUS_NAME ?? null;
    if (typeof statusValue === "object" && statusValue?.value) {
      statusValue = statusValue.value;
    }
    if (statusValue && statusValue !== "—") {
      // Приведение к правильному регистру: первая буква заглавная, остальные строчные
      const normalizedStatus =
        statusValue.charAt(0).toUpperCase() + statusValue.slice(1).toLowerCase();
      status = STATUS_NAME_MAP[normalizedStatus] ?? null;
    }
    // plan_date_close
    let plan_date_close = null;
    const planDate = draft.F81_070_RESTOR_SUPPLAYDATETIME ?? tn?.F81_070_RESTOR_SUPPLAYDATETIME;
    if (planDate && planDate !== "—") {
      const d = new Date(planDate);
      if (!isNaN(d.getTime())) {
        const pad = (num) => String(num).padStart(2, "0");
        plan_date_close = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
      }
    }
    const payload = {
      time_create,
      incident_id,
      type,
      status,
      plan_date_close,
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
            {draft[k] ?? "—"}{" "}
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

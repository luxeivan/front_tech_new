"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Modal, Descriptions, Input, message, Button } from "antd";
import { EditOutlined } from "@ant-design/icons";

const MOSENERGOSBYT_FIELDS = [
  "ADDRESS_LIST",             // Name
  "F81_060_EVENTDATETIME",    // date_off
  "F81_070_RESTOR_SUPPLAYDATETIME", // date_on_plan
  "F81_290_RECOVERYDATETIME", // date_on_fact
  "F81_090",                  // duration_hours & duration_minutes
  "description",              // massage
  "VIOLATION_TYPE",           // status
  "BRIGADE_ACTION",           // team_action
  "CREATE_DATETIME",          // datetime_team_action
  "BRIGADECOUNT",             // num_teams
  "EMPLOYEECOUNT",            // num_employee
  "SPECIALTECHNIQUECOUNT",    // num_special_machine_unit
  "PES_COUNT",                // num_pes
  "STATUS_NAME",              // condition
  "HOUSE_LIST", 
  "FIAS_LIST",
];

export default function MosEnergoSbytSender({
  tn,
  updateField,
  open,
  onClose,
}) {
  const { data: session } = useSession();
  const token = session?.user?.jwt;
  const [draft, setDraft] = useState(
    Object.fromEntries(MOSENERGOSBYT_FIELDS.map((k) => [k, tn[k]?.value ?? "—"]))
  );
  const [editing, setEditing] = useState(null);

  // При открытии обновлять черновик по tn
  React.useEffect(() => {
    if (open) {
      setDraft(
        Object.fromEntries(MOSENERGOSBYT_FIELDS.map((k) => [k, tn[k]?.value ?? "—"]))
      );
    }
  }, [open, tn]);

  // Функция для форматирования даты
  const toDate = (v, withTime = false) => {
    if (!v || v === "—") return null;
    const d = new Date(v);
    if (isNaN(d)) return null;
    const pad = (n) => String(n).padStart(2, "0");
    return withTime
      ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
          d.getHours()
        )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
      : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  // Формируем JSON для отправки
  const getPayload = () => ({
    Name: draft.ADDRESS_LIST ?? null,
    date_off: toDate(draft.F81_060_EVENTDATETIME, true),
    date_on_plan: toDate(draft.F81_070_RESTOR_SUPPLAYDATETIME, true),
    date_on_fact: toDate(draft.F81_290_RECOVERYDATETIME, true),
    duration_hours: draft.F81_090 ?? null,
    duration_minutes: draft.F81_090 ?? null,
    massage: draft.description ?? null,
    status: draft.VIOLATION_TYPE ?? null,
    team_action: draft.BRIGADE_ACTION ?? null,
    datetime_team_action: toDate(draft.CREATE_DATETIME, true),
    num_teams: draft.BRIGADECOUNT ?? null,
    num_employee: draft.EMPLOYEECOUNT ?? null,
    num_special_machine_unit: draft.SPECIALTECHNIQUECOUNT ?? null,
    num_pes: draft.PES_COUNT ?? null,
    condition: draft.STATUS_NAME ?? null,
    Number: draft.HOUSE_LIST ?? null,
    Guid2: draft.FIAS_LIST ?? null,
  });

  // Тестировать (вывод в консоль)
  const handleTest = () => {
    const payload = getPayload();
    // eslint-disable-next-line no-console
    console.log("JSON для МосЭнергоСбыт:\n" + JSON.stringify(payload, null, 2));
    message.success("JSON сгенерирован, смотри консоль");
  };

  // Отправить в МосЭнергоСбыт
  const handleSend = async () => {
    const payload = getPayload();
    try {
      const response = await fetch("/api/proxy-mvitu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      let text = await response.text();
      let resBody;
      try {
        resBody = JSON.parse(text);
      } catch {
        resBody = text;
      }
      if (response.ok) {
        onClose();
        setTimeout(() => {
          message.success(
            `Успешно отправлено: ${
              typeof resBody === "string" ? resBody : JSON.stringify(resBody)
            }`
          );
        }, 400);
      } else {
        onClose();
        setTimeout(() => {
          message.error(
            `Ошибка при отправке: ${
              typeof resBody === "string" ? resBody : JSON.stringify(resBody)
            }`
          );
        }, 400);
      }
    } catch (error) {
      onClose();
      setTimeout(() => {
        message.error(`Ошибка при отправке: ${error.message}`);
      }, 400);
    }
  };

  return (
    <Modal
      title="Отправка данных в МосЭнергоСбыт"
      open={open}
      onCancel={onClose}
      // Убираем onOk, чтобы handleSend не вызывался дублирующе
      width={900}
      footer={[
        <Button key="test" onClick={handleTest}>
          Тестировать (вывод в консоль)
        </Button>,
        <Button key="submit" type="primary" onClick={handleSend}>
          Отправить в МосЭнергоСбыт
        </Button>,
        <Button key="cancel" onClick={onClose}>
          Отмена
        </Button>,
      ]}
    >
      <Descriptions column={2} bordered size="small">
        {MOSENERGOSBYT_FIELDS.map((k) => (
          <Descriptions.Item
            key={k}
            label={tn[k]?.label ?? k}
            span={1}
            contentStyle={{
              background:
                tn[k]?.edit === "Да"
                  ? "#f6ffed"
                  : undefined,
            }}
          >
            {draft[k] ?? "—"}{" "}
            {tn[k]?.edit === "Да" && (
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

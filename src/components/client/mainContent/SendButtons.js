"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Button, Modal, Space, Descriptions, Input, message } from "antd";
import { EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const CUSTOM_LABELS = {
  need_brigade_count: 'Потребность: Бригады',
  need_person_count:  'Потребность: Человек',
  need_equipment_count: 'Потребность: Техника',
  need_reserve_power_source_count: 'Потребность: Резервные источники',
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

// === ПОЛЯ ДЛЯ ДРУГИХ МОДАЛОК ===
const MOSENERGOSBYT_FIELDS = [];       // Поля для отправки в МосЭнергоСбыт
const SITE_MINENERGO_FIELDS = [];      // Поля для отправки на сайт МинЭнерго РФ
const SITE_MOSOBLENERGO_FIELDS = [];   // Поля для отправки на сайт МосОблЭнерго

export default function SendButtons({ tn, updateField }) {
  const { data: session } = useSession();
  const token = session?.user?.jwt;

  /** режим «открыта ли большая форма» */
  const [openME, setOpenME] = useState(false);
  /** локальный editable-слой, чтобы не портить исходный ТН до сохранения */
  const [draft, setDraft] = useState({});
  // inline‑edit modal state inside the ME dialog
  const [editing, setEditing] = useState(null); // { field, value }

  // Открывает форму для выбранного направления отправки данных
  // Сейчас реализовано только для МинЭнерго; будущие модалки будут открываться аналогичным образом
  const showME = () => {
    // формируем черновик‑значения (только value, без метаданных)
    setDraft(
      Object.fromEntries(ME_FIELDS.map((k) => [k, tn[k]?.value ?? "—"]))
    );

    console.log("NEW FIELD DEBUG:", {
      need_brigade: tn.need_brigade_count,
      need_person: tn.need_person_count,
      need_equipment: tn.need_equipment_count,
      need_reserve: tn.need_reserve_power_source_count,
    });
    
    setOpenME(true);
  };

  const saveME = () => {
    const payload = { ...draft };
    console.log("Сформированный JSON для МинЭнерго:", JSON.stringify(payload, null, 2));
    message.success("Данные отправлены (заглушка)");
    setOpenME(false);
  };

  const stub = (dest) =>
    Modal.info({
      title: `Отправка в ${dest}`,
      content: "Скоро здесь будет доступна отправка данных.",
      okText: "Понятно",
    });

  return (
    <>
      {/* КНОПКИ */}
      <Space wrap>
        <Button type="primary" onClick={showME}>
          Отправить&nbsp;в&nbsp;МинЭнерго
        </Button>

        <Button
          style={{ background: "#722ED1", color: "#fff" }}
          onClick={() => stub("МосЭнергоСбыт")}
        >
          Отправить&nbsp;в&nbsp;МосЭнергоСбыт
        </Button>

        <Button type="dashed" onClick={() => stub("сайт МинЭнерго РФ")}>
          Отправить&nbsp;на&nbsp;сайт&nbsp;МинЭнерго&nbsp;РФ
        </Button>

        <Button
          style={{ background: "#FA8C16", color: "#fff" }}
          onClick={() => stub("сайт МосОблЭнерго")}
        >
          Отправить&nbsp;на&nbsp;сайт&nbsp;МосОблЭнерго
        </Button>
      </Space>

      {/* МОДАЛКА МинЭнерго */}
      <Modal
        title="Отправка данных в МинЭнерго"
        open={openME}
        onCancel={() => setOpenME(false)}
        onOk={saveME}
        okText="Отправить данные"
        cancelText="Отмена"
        width={900}
      >
        <Descriptions column={2} bordered size="small">
          {ME_FIELDS.map((k) => (
            <Descriptions.Item
              key={k}
              label={
                tn[k]?.label
                  ?? CUSTOM_LABELS[k]
                  ?? k
              }
              span={1}
              contentStyle={{
                background: (
                  (tn[k]?.edit === 'Да')
                  || NEW_FIELDS.includes(k)
                ) ? '#f6ffed' : undefined
              }}
            >
              {draft[k] ?? '—'}{' '}
              {(
                tn[k]?.edit === 'Да'
                || NEW_FIELDS.includes(k)
              ) && (
                <EditOutlined
                  style={{ marginLeft: 8, cursor: 'pointer' }}
                  onClick={() => setEditing({ field: k, value: draft[k] })}
                />
              )}
            </Descriptions.Item>
          ))}
        </Descriptions>
        {/* inline editor for one field */}
        <Modal
          open={!!editing}
          title={editing ? tn[editing.field]?.label ?? editing.field : ""}
          onOk={async () => {
            if (!editing) return;
            const newVal = editing.value?.trim();

            // 1. локально
            setDraft((prev) => ({ ...prev, [editing.field]: newVal }));

            // 2. Strapi
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
              // 3. обновим глобальный стор / карточку
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
    </>
  );
}

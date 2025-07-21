"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Button, Modal, Space, Descriptions, Input, message } from "antd";
import { EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

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
];

export default function SendButtons({ tn, updateField }) {
  const { data: session } = useSession();
  const token = session?.user?.jwt;

  /** режим «открыта ли большая форма» */
  const [openME, setOpenME] = useState(false);
  /** локальный editable-слой, чтобы не портить исходный ТН до сохранения */
  const [draft, setDraft] = useState({});
  // inline‑edit modal state inside the ME dialog
  const [editing, setEditing] = useState(null); // { field, value }

  // открываем форму МинЭнерго, кладём снапшот полей
  const showME = () => {
    // формируем черновик‑значения (только value, без метаданных)
    setDraft(
      Object.fromEntries(
        ME_FIELDS.map((k) => [k, tn[k]?.value ?? "—"])
      )
    );
    setOpenME(true);
  };

  const saveME = () => {
    // ← тут вызов API / Saga / fetch — что угодно
    console.log("► send to МинЭнерго:", draft);
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
              label={tn[k]?.label ?? k}
              span={1}
              contentStyle={{ background: tn[k]?.edit === "Да" && "#f6ffed" }}
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
        {/* inline editor for one field */}
        <Modal
          open={!!editing}
          title={editing ? (tn[editing.field]?.label ?? editing.field) : ""}
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

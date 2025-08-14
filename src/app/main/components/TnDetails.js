"use client";

import React from "react";
import { Card, Descriptions } from "antd";
import dayjs from "dayjs";
import { EditOutlined } from "@ant-design/icons";
import SendButtons from "@/components/client/mainContent/SendButtons";
import { HIDDEN_FIELDS } from "@/lib/constants";

// Разворот строки с подробностями и иконкой редактирования там, где edit === "Да"
export default function TnDetails({ record, isSuper, onEditClick }) {
  const entries = Object.entries(record.full).filter(
    ([k]) => !HIDDEN_FIELDS.has(k)
  );

  return (
    <>
      {!isSuper && (
        <div style={{ marginBottom: 16, textAlign: "center" }}>
          <SendButtons tn={record.full} updateField={() => {}} />
        </div>
      )}
      <Card
        size="small"
        style={{ margin: 0, padding: 16, background: "#fafafa" }}
        styles={{ body: { padding: 0 } }}
      >
        <Descriptions
          size="small"
          column={2}
          bordered={false}
          styles={{
            label: { fontWeight: 600, color: "#fa8c16" },
            content: { paddingLeft: 8 },
          }}
          items={entries.map(([k, v]) => {
            const label =
              v && typeof v === "object" && "label" in v ? v.label : k;
            let rawVal =
              v == null
                ? null
                : typeof v === "object" && "value" in v
                ? v.value
                : v;
            const isEditable = v && typeof v === "object" && v.edit === "Да";

            let display = "Нет данных";
            if (rawVal != null && rawVal !== "") {
              display = String(rawVal);
              if (
                typeof rawVal === "string" &&
                /\d{4}-\d{2}-\d{2}T/.test(rawVal)
              ) {
                display = dayjs(rawVal).format("DD.MM.YYYY HH:mm:ss");
              }
            }

            return {
              key: k,
              label,
              children: (
                <span>
                  {display}
                  {isEditable && !isSuper && (
                    <EditOutlined
                      style={{
                        color: "#52c41a",
                        marginLeft: 8,
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        onEditClick({
                          recordKey: record.key,
                          documentId: record.full.documentId,
                          fieldKey: k,
                          label,
                          value: display,
                        })
                      }
                    />
                  )}
                </span>
              ),
            };
          })}
        />
      </Card>
    </>
  );
}

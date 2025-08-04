import React from "react";
import { Tabs } from "antd";
import SendButtons from "./SendButtons";

const SendPart = ({ record, updateField, tabsItems }) => (
  <>
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
        padding: 16,
        marginBottom: 20,
        border: "1px solid #f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 16,
      }}
    >
      <div style={{ fontWeight: 500, marginRight: 16 }}>Отправка данных:</div>

      <SendButtons
        tn={record.raw}
        onFieldChange={(patch) =>
          Object.entries(patch).forEach(([k, v]) =>
            updateField(record.raw.id, k, v)
          )
        }
      />
    </div>

    <Tabs
      size="small"
      items={tabsItems}
      destroyInactiveTabPane
      style={{ marginTop: 12 }}
    />
  </>
);

export default SendPart;
import React from "react";
import { Select } from "antd";

export default function FilterBar({
  tns,
  filterableFields,
  filters,
  setFilterValue,
  labelReset,
  onAfterChange,
}) {
  return (
    <div
      style={{ marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 8 }}
    >
      {filterableFields.map((key) => {
        const values = Array.from(
          new Set(tns.map((t) => t[key]?.value).filter(Boolean))
        );
        const label = tns.find((t) => t[key])?.[key]?.label ?? key;
        return (
          <Select
            key={key}
            value={filters[key] ?? "Все"}
            style={{ width: 220 }}
            onChange={(val) => {
              setFilterValue(key, val);
              onAfterChange?.();
            }}
            options={[
              { value: "Все", label: `${label}: Все` },
              ...values.map((v) => ({ value: v, label: v })),
            ]}
          />
        );
      })}
      {labelReset /* например «Сбросить» ‒ можно передать любой JSX */}
    </div>
  );
}

"use client";

import React from "react";
import { Row, Col, Select } from "antd";
const { Option } = Select;

// Панель селектов-фильтров
export default function FiltersBar({ filters, setFilters, filterOptions }) {
  return (
    <Row gutter={[12, 12]} wrap>
      {[
        { key: "OWN_SCNAME", label: "Филиал" },
        { key: "SCNAME", label: "Произв. отделение" },
        { key: "VIOLATION_TYPE", label: "Вид ТН" },
        { key: "OBJECTTYPE81", label: "Вид объекта" },
      ].map(({ key, label }) => (
        <Col xs={24} sm={12} md={6} key={key}>
          <div style={{ marginBottom: 4, fontWeight: "500" }}>{label}</div>
          <Select
            style={{ width: "100%" }}
            placeholder={label}
            value={filters[key]}
            onChange={(v) => setFilters((f) => ({ ...f, [key]: v }))}
          >
            <Option value="Все">Все</Option>
            {filterOptions[key]?.map((opt) => (
              <Option key={opt} value={opt}>
                {opt}
              </Option>
            ))}
          </Select>
        </Col>
      ))}

      {[
        { key: "F81_060_EVENTDATETIME", label: "Дата возникновения" },
        { key: "CREATE_DATETIME", label: "Дата фиксирования" },
        { key: "F81_070_RESTOR_SUPPLAYDATETIME", label: "Дата восстановления (план)" },
        { key: "F81_290_RECOVERYDATETIME", label: "Дата восстановления (факт)" },
      ].map(({ key, label }) => (
        <Col xs={24} sm={12} md={6} key={key}>
          <div style={{ marginBottom: 4, fontWeight: "500" }}>{label}</div>
          <Select
            style={{ width: "100%" }}
            placeholder={label}
            value={filters[key]}
            onChange={(v) => setFilters((f) => ({ ...f, [key]: v }))}
          >
            <Option value="Все">Все</Option>
            {filterOptions[key]?.map((opt) => (
              <Option key={opt} value={opt}>
                {opt}
              </Option>
            ))}
          </Select>
        </Col>
      ))}
    </Row>
  );
}
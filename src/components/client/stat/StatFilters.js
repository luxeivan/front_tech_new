"use client";

import React from "react";
import { Select, Checkbox, Space } from "antd";
import InputDate from "./InputDate";

const { Option } = Select;

export default function StatFilters({
  dateRange,
  onDateRangeChange,
  uniqueCities,
  selectedCity,
  onCityChange,
  selectedStatus,
  onStatusChange,
  metricOptions,
  selectedMetrics,
  onMetricsChange,
}) {
  return (
    <>
      <Space wrap>
        <InputDate value={dateRange} onChange={onDateRangeChange} />
        <Select
          style={{ width: 200 }}
          value={selectedCity}
          onChange={onCityChange}
        >
          {uniqueCities.map((city) => (
            <Option key={city} value={city}>
              {city}
            </Option>
          ))}
        </Select>
        <Select
          style={{ width: 200 }}
          value={selectedStatus}
          onChange={onStatusChange}
        >
          <Option value="Все">Все</Option>
          <Option value="в работе">В работе</Option>
          <Option value="выполнена">Выполненные</Option>
        </Select>
      </Space>
      <Checkbox.Group
        options={metricOptions}
        value={selectedMetrics}
        onChange={onMetricsChange}
        style={{ marginTop: 16 }}
      />
    </>
  );
}

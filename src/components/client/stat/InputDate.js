"use client";

import React from "react";
import { DatePicker } from "antd";

const { RangePicker } = DatePicker;

export default function InputDate({ value, onChange }) {
  return (
    <RangePicker
      format="DD.MM.YYYY"
      value={value}
      onChange={onChange}
      allowClear
    />
  );
}

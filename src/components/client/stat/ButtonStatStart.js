"use client";

import React from "react";
import { Button } from "antd";

export default function ButtonStatStart({ onCalculate }) {
  return (
    <Button type="primary" onClick={onCalculate}>
      Посчитать
    </Button>
  );
}

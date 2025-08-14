"use client";

import React, { useState } from "react";
import { Table } from "antd";
import {
  NumberOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  DashboardOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import TnDetails from "./TnDetails";

// Таблица открытых ТН (только список). Детали — отдельным компонентом.
export default function TnTable({ dataSource, newGuids, isSuper, setEditing }) {
  const [expandedKeys, setExpandedKeys] = useState([]);

  const rawColumns = [
    {
      title: (
        <>
          <NumberOutlined style={{ marginRight: 4, color: "#fa8c16" }} />
          <span>№ ТН</span>
        </>
      ),
      dataIndex: "number",
      key: "number",
      width: 120,
    },
    {
      title: (
        <>
          <HomeOutlined style={{ marginRight: 4, color: "#fa8c16" }} />
          <span>Объект</span>
        </>
      ),
      dataIndex: "object",
      key: "object",
      responsive: ["md"],
    },
    {
      title: (
        <>
          <EnvironmentOutlined style={{ marginRight: 4, color: "#fa8c16" }} />
          <span>Адрес</span>
        </>
      ),
      dataIndex: "address",
      key: "address",
      responsive: ["lg"],
    },
    {
      title: (
        <>
          <DashboardOutlined style={{ marginRight: 4, color: "#fa8c16" }} />
          <span>Дисп. центр</span>
        </>
      ),
      dataIndex: "center",
      key: "center",
      width: 160,
      responsive: ["md"],
    },
    {
      title: (
        <>
          <CalendarOutlined style={{ marginRight: 4, color: "#fa8c16" }} />
          <span>Дата/время возникновения</span>
        </>
      ),
      dataIndex: "event",
      key: "event",
      width: 180,
    },
  ];

  const columns = rawColumns.map((col) => ({
    ...col,
    align: "center",
    title: (
      <div
        style={{
          textAlign: "center",
          fontWeight: 600,
          fontSize: 14,
          color: "#fa8c16",
        }}
      >
        {col.title}
      </div>
    ),
  }));

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      bordered
      scroll={{ x: true }}
      pagination={{ pageSize: 10, showSizeChanger: false }}
      size="middle"
      tableLayout="fixed"
      rowClassName={(record, index) =>
        newGuids.includes(record.key)
          ? "tn-new"
          : index % 2 === 0
          ? "row-light"
          : ""
      }
      expandable={{
        expandedRowRender: (record) => (
          <TnDetails
            record={record}
            isSuper={isSuper}
            onEditClick={setEditing}
          />
        ),
        rowExpandable: () => true,
        expandedRowKeys: expandedKeys,
        onExpand: (expanded, record) =>
          setExpandedKeys(expanded ? [record.key] : []),
      }}
    />
  );
}

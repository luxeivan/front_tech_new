"use client";
import React, { useEffect, useState } from "react";
import {
  Table,
  Spin,
  Alert,
  Typography,
  Button,
  Pagination,
  ConfigProvider,
  Space,
} from "antd";
import ru_RU from "antd/locale/ru_RU";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { ReloadOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";

import { useTnsDataStore } from "@/stores/tnsDataStore";

dayjs.locale("ru");

const { Title } = Typography;

export default function MainContent() {
  /* auth */
  const { data: session } = useSession();
  const token = session?.user?.jwt;

  /* store */
  const { tns, loading, error, fetchTns } = useTnsDataStore();

  /* fetch on mount / token change */
  useEffect(() => {
    if (token) fetchTns(token);
  }, [token, fetchTns]);

  /* auto‑refresh every 2 min */
  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => fetchTns(token), 120_000);
    return () => clearInterval(id);
  }, [token, fetchTns]);

  /* pagination */
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const sliceStart = (page - 1) * pageSize;
  const currentRows = tns.slice(sliceStart, sliceStart + pageSize);

  /* map to table rows */
  const dataSource = currentRows.map((item) => ({
    key: item.id,
    number: item.F81_010_NUMBER?.value ?? "—",
    dispatcher: item.CREATE_USER?.value ?? "—",
    status: item.STATUS_NAME?.value ?? "—",
    eventDate: item.F81_060_EVENTDATETIME?.value
      ? dayjs(item.F81_060_EVENTDATETIME.value).format("DD.MM.YYYY HH:mm")
      : "—",
  }));

  const columns = [
    { title: "№ ТН", dataIndex: "number", key: "number" },
    { title: "Диспетчер", dataIndex: "dispatcher", key: "dispatcher" },
    { title: "Статус", dataIndex: "status", key: "status" },
    { title: "Дата/время", dataIndex: "eventDate", key: "eventDate" },
  ];

  return (
    <ConfigProvider locale={ru_RU}>
      <div style={{ padding: 20 }}>
        <Space
          style={{
            marginBottom: 16,
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            Технологические нарушения
          </Title>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => token && fetchTns(token)}
          >
            Обновить
          </Button>
        </Space>

        {error && (
          <Alert type="error" message={error} style={{ marginBottom: 16 }} />
        )}

        {loading ? (
          <div style={{ textAlign: "center", marginTop: 50 }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              dataSource={dataSource}
              pagination={false}
              bordered
              size="middle"
            />
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <Pagination
                current={page}
                total={tns.length}
                pageSize={pageSize}
                onChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </ConfigProvider>
  );
}

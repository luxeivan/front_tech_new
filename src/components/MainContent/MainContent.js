"use client";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo } from "react";
import {
  Table,
  Spin,
  Alert,
  Typography,
  Button,
  Pagination,
  ConfigProvider,
  Space,
  Descriptions,
  Tabs,
  message,
} from "antd";
import ru_RU from "antd/locale/ru_RU";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { ReloadOutlined, EditOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";

import AiButton from "../client/mainContent/AiButton";
import SendPart from "../client/mainContent/sendPart";
import SaveModal from "../client/global/SaveModal";
import FilterBar from "./FilterBar";

import { useTnsDataStore, useTnFilters } from "@/stores/tnsDataStore";
import { useMainContentStore } from "@/stores/mainContentStore";
import { useGlobalStore } from "@/stores/globalStore";

import useAutoRefresh from "./hooks/useAutoRefresh";
import useTableData from "./hooks/useTableData";
import { groupFields } from "./GroupFields";
import SoInfo from "./SoInfo";

const { Title } = Typography;
dayjs.locale("ru");

export default function MainContent() {
  /* URL-параметры */
  const q = useSearchParams();
  const filterField = q.get("filter");
  const minValue = q.get("min");

  /* Auth */
  const { data: session } = useSession();
  const token = session?.user?.jwt;
  const role = session?.user?.view_role;

  /* UI-store */
  const expandedKeys = useMainContentStore((s) => s.expandedKeys);
  const setExpandedKeys = useMainContentStore((s) => s.setExpandedKeys);
  const page = useMainContentStore((s) => s.page);
  const setPage = useMainContentStore((s) => s.setPage);
  const pageSize = useMainContentStore((s) => s.pageSize);
  const setPageSize = useMainContentStore((s) => s.setPageSize);

  const editing = useMainContentStore((s) => s.editing);
  const editValue = useMainContentStore((s) => s.editValue);
  const openEdit = useMainContentStore((s) => s.openEdit);
  const setEditValue = useMainContentStore((s) => s.setEditValue);
  const closeEdit = useMainContentStore((s) => s.closeEdit);

  /* Data-store */
  const { tns, loading, error, fetchTnsFast, fetchDetails, updateField } =
    useTnsDataStore();
  const tnsSafe = Array.isArray(tns) ? tns : [];
  console.log("item that приходит в таблицу →", tnsSafe?.[0]);

  /* первый fetch */
  useEffect(() => {
    if (token) fetchTnsFast(token);
  }, [token, fetchTnsFast]);

  /* авто-обновление */
  useAutoRefresh({ token, expandedKeys });

  /* фильтрация по URL */
  let tnsByField = tnsSafe;
  if (filterField) {
    const min = minValue !== null ? Number(minValue) : 1;
    tnsByField = tnsSafe.filter((t) =>
      filterField === "DISTRICT"
        ? t[filterField]?.value?.trim()
        : Number(t[filterField]?.value) >= min
    );
  }

  /* фильтры-селекты */
  const { filterableFields, filters, setFilterValue, filteredTns } =
    useTnFilters(tnsByField);

  /* сортировка */
  const sortedTns = useMemo(() => {
    const getTime = (t) =>
      dayjs(
        t.F81_060_EVENTDATETIME?.value ||
          t.CREATE_DATETIME?.value ||
          t.createdAt
      ).valueOf() || 0;
    return [...filteredTns].sort((a, b) => getTime(b) - getTime(a));
  }, [filteredTns]);

  /* таблица */
  const { dataSource, columns, renderDesc } = useTableData({
    rows: sortedTns,
    page,
    pageSize,
    openEdit: ({ key, v, record }) => (
      <EditOutlined
        style={{ marginLeft: 8, cursor: "pointer", color: "#389e0d" }}
        onClick={() =>
          openEdit({
            tnId: record.raw.id,
            docId: record.raw.documentId,
            fieldKey: key,
            label: v.label,
            value: v.value,
          })
        }
      />
    ),
  });

  /* раскрытая строка */
  const expandedRowRender = (record) => {
    if (!record.raw._full && token) fetchDetails(record.raw.id, token);

    const { main, dateStatus, outageConsumer, resources, others } = groupFields(
      record.raw
    );

    const tabs = [
      {
        key: "main",
        label: "Основное",
        children: (
          <Descriptions
            bordered
            size="small"
            column={2}
            items={renderDesc(main)}
            style={{ marginBottom: 12 }}
          />
        ),
      },
      {
        key: "dateStatus",
        label: "Даты и статусы",
        children: (
          <Descriptions
            bordered
            size="small"
            column={2}
            items={renderDesc(dateStatus)}
            style={{ marginBottom: 12 }}
          />
        ),
      },
      {
        key: "outageConsumer",
        label: "Отключения и потребители",
        children: (
          <Descriptions
            bordered
            size="small"
            column={2}
            items={renderDesc(outageConsumer)}
            style={{ marginBottom: 12 }}
          />
        ),
      },
      {
        key: "resources",
        label: "Потребности и ресурсы",
        children: (
          <Descriptions
            bordered
            size="small"
            column={2}
            items={renderDesc(resources)}
            style={{ marginBottom: 12 }}
          />
        ),
      },
      {
        key: "so",
        label: "Социальные объекты",
        children: <SoInfo tnId={record.raw.id} docId={record.raw.documentId} />,
      },
      {
        key: "others",
        label: "Прочее",
        children: (
          <Descriptions
            bordered
            size="small"
            column={2}
            items={renderDesc(others)}
            style={{ marginBottom: 12 }}
          />
        ),
      },
    ];

    return role === "supergeneral" ? (
      <Tabs
        size="small"
        items={tabs}
        destroyInactiveTabPane
        style={{ marginTop: 12 }}
      />
    ) : (
      <SendPart record={record} updateField={updateField} tabsItems={tabs} />
    );
  };

  /* helpers */
  const router = useRouter();
  const clearFilters = () => {
    filterableFields.forEach((k) => setFilterValue(k, "Все"));
    setPage(1);
    router.replace("/dashboard");
  };

  /* -------- RENDER -------- */
  return (
    <ConfigProvider locale={ru_RU}>
      <div style={{ padding: 20 }}>
        {/* HEADER */}
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            Технологические нарушения
          </Title>
          <Space>
            <Button color="green" variant="solid" onClick={clearFilters}>
              Дашборд
            </Button>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => token && fetchTnsFast(token)}
            >
              Обновить
            </Button>
            <Button danger onClick={clearFilters}>
              Сбросить фильтры
            </Button>
            <AiButton />
          </Space>
        </div>

        {/* FILTER BAR */}
        <FilterBar
          tns={tnsSafe}
          filterableFields={filterableFields}
          filters={filters}
          setFilterValue={setFilterValue}
          onAfterChange={() => {
            if (filterField || minValue) router.replace("/dashboard");
            setPage(1);
          }}
        />

        {/* TABLE / STATE */}
        {loading && (
          <div style={{ textAlign: "center", marginTop: 50 }}>
            <Spin size="large" />
            <p style={{ marginTop: 16, fontSize: 16 }}>
              Загружаю&nbsp;новые&nbsp;данные, пожалуйста&nbsp;подождите…
            </p>
          </div>
        )}

        {!loading && !error && tnsSafe.length > 0 && (
          <>
            <Table
              columns={columns}
              dataSource={dataSource}
              rowKey="key"
              bordered
              size="middle"
              pagination={false}
              expandable={{
                expandedRowRender,
                expandedRowKeys: expandedKeys,
                onExpandedRowsChange: setExpandedKeys,
              }}
            />
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <Pagination
                current={page}
                total={sortedTns.length}
                pageSize={pageSize}
                showSizeChanger
                pageSizeOptions={[10, 25, 50, 100]}
                onChange={(p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                }}
              />
            </div>
          </>
        )}

        {error && !loading && (
          <Alert
            type="error"
            message={error}
            style={{ margin: "50px auto", maxWidth: 600 }}
            showIcon
          />
        )}
      </div>

      {/* EDIT MODAL */}
      <SaveModal
        editing={editing}
        editValue={editValue}
        setEditValue={setEditValue}
        onSave={async () => {
          const { tnId, fieldKey } = editing;
          try {
            await updateField(tnId, fieldKey, editValue.trim());
            closeEdit();
            useGlobalStore.getState().setModalOpen(false);
          } catch {
            message.error("Не удалось сохранить");
          }
        }}
        onCancel={() => {
          closeEdit();
          useGlobalStore.getState().setModalOpen(false);
        }}
      />
    </ConfigProvider>
  );
}

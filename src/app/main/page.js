// eslint-disable-next-line
"use client";
import React from "react";
import "@/app/globals.css";
import { useEffect, useMemo, useState } from "react";
import {
  Table,
  Typography,
  Spin,
  Descriptions,
  Card,
  Modal,
  Input,
  message,
  Button,
  Select,
  Row,
  Col,
  Space,
} from "antd";
import {
  EditOutlined,
  NumberOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  DashboardOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/ru";
dayjs.locale("ru");
import SendButtons from "@/components/client/mainContent/SendButtons";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useDashboardTestStore } from "@/stores/dashboardTestStore";

const { Title } = Typography;
const { Option } = Select;

const val = (obj) =>
  typeof obj === "object" && obj !== null && "value" in obj ? obj.value : obj;
const formatDate = (d) => (d ? dayjs(d).format("DD.MM.YYYY HH:mm:ss") : "—");

export default function MainPage() {
  const { data: session, status } = useSession();
  const userName = session?.user?.name || "";
  const userRole = session?.user?.view_role;
  const isSuper = userRole === "supergeneral";
  const router = useRouter();
  const token = session?.user?.jwt ?? null;

  const { uniqueOpen, isLoading, error, loadUnique } = useDashboardTestStore();
  const newGuids = useDashboardTestStore((state) => state.newGuids);
  const handleEvent = useDashboardTestStore((state) => state.handleEvent);

  // звук: состояние и экшены из стора
  const soundEnabled = useDashboardTestStore((s) => s.soundEnabled);
  const audioUnlocked = useDashboardTestStore((s) => s.audioUnlocked);
  const enableSound = useDashboardTestStore((s) => s.enableSound);
  const disableSound = useDashboardTestStore((s) => s.disableSound);
  const soundOn = soundEnabled && audioUnlocked;

  const [expandedKeys, setExpandedKeys] = useState([]);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({
    OWN_SCNAME: "Все",
    SCNAME: "Все",
    VIOLATION_TYPE: "Все",
    OBJECTTYPE81: "Все",
    F81_060_EVENTDATETIME: "Все",
    CREATE_DATETIME: "Все",
    F81_070_RESTOR_SUPPLAYDATETIME: "Все",
    F81_290_RECOVERYDATETIME: "Все",
  });

  const handleSaveEdit = async () => {
    if (!editing) return;
    const { documentId, fieldKey, value } = editing;
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns/${documentId}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ data: { [fieldKey]: { value } } }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      message.success("Поле обновлено");
      await loadUnique(token);
      setEditing(null);
    } catch (e) {
      console.error("Update failed", e);
      message.error("Не удалось сохранить изменения");
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      const es = new EventSource("/api/event");
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          handleEvent(data);
        } catch (err) {
          console.error("Ошибка разбора SSE-сообщения:", err);
        }
      };
      es.onerror = (err) => {
        console.error("SSE error:", err);
        es.close();
      };
      return () => es.close();
    }
  }, [status, handleEvent]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && uniqueOpen.length === 0) {
      loadUnique(token);
    }
  }, [status, token, uniqueOpen.length, loadUnique]);

  const sorted = useMemo(
    () =>
      [...uniqueOpen].sort(
        (a, b) =>
          new Date(val(b.F81_060_EVENTDATETIME) || b.createdAt) -
          new Date(val(a.F81_060_EVENTDATETIME) || a.createdAt)
      ),
    [uniqueOpen]
  );

  const dataSource = useMemo(
    () =>
      sorted.map((r) => ({
        key: r.guid,
        number: val(r.F81_010_NUMBER),
        object: val(r.F81_042_DISPNAME),
        address: val(r.ADDRESS_LIST),
        center: val(r.DISPCENTER_NAME_),
        event: formatDate(val(r.F81_060_EVENTDATETIME)),
        full: r,
        documentId: r.documentId,
      })),
    [sorted]
  );

  const filterOptions = useMemo(() => {
    const o = {};
    ["OWN_SCNAME", "SCNAME", "VIOLATION_TYPE", "OBJECTTYPE81"].forEach(
      (key) => {
        o[key] = Array.from(
          new Set(uniqueOpen.map((r) => val(r[key])).filter(Boolean))
        );
      }
    );
    [
      "F81_060_EVENTDATETIME",
      "CREATE_DATETIME",
      "F81_070_RESTOR_SUPPLAYDATETIME",
      "F81_290_RECOVERYDATETIME",
    ].forEach((key) => {
      o[key] = Array.from(
        new Set(
          uniqueOpen
            .map((r) => val(r[key]))
            .filter(Boolean)
            .map((d) => dayjs(d).format("DD.MM.YYYY"))
        )
      );
    });
    return o;
  }, [uniqueOpen]);

  const filteredData = useMemo(
    () =>
      dataSource.filter((item) => {
        const r = item.full;

        if (
          filters.OWN_SCNAME !== "Все" &&
          val(r.OWN_SCNAME) !== filters.OWN_SCNAME
        )
          return false;
        if (filters.SCNAME !== "Все" && val(r.SCNAME) !== filters.SCNAME)
          return false;
        if (
          filters.VIOLATION_TYPE !== "Все" &&
          val(r.VIOLATION_TYPE) !== filters.VIOLATION_TYPE
        )
          return false;
        if (
          filters.OBJECTTYPE81 !== "Все" &&
          val(r.OBJECTTYPE81) !== filters.OBJECTTYPE81
        )
          return false;

        const dt = (key) =>
          val(r[key]) ? dayjs(val(r[key])).format("DD.MM.YYYY") : null;
        if (
          filters.F81_060_EVENTDATETIME !== "Все" &&
          dt("F81_060_EVENTDATETIME") !== filters.F81_060_EVENTDATETIME
        )
          return false;
        if (
          filters.CREATE_DATETIME !== "Все" &&
          dt("CREATE_DATETIME") !== filters.CREATE_DATETIME
        )
          return false;
        if (
          filters.F81_070_RESTOR_SUPPLAYDATETIME !== "Все" &&
          dt("F81_070_RESTOR_SUPPLAYDATETIME") !==
            filters.F81_070_RESTOR_SUPPLAYDATETIME
        )
          return false;
        if (
          filters.F81_290_RECOVERYDATETIME !== "Все" &&
          dt("F81_290_RECOVERYDATETIME") !== filters.F81_290_RECOVERYDATETIME
        )
          return false;
        return true;
      }),
    [dataSource, filters]
  );

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

  if (status === "loading") {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div style={{ padding: 24, width: "100%", margin: "0" }}>
        <Title level={3} style={{ textAlign: "center", marginBottom: 16 }}>
          {`Всего открытых ТН: ${uniqueOpen.length}`}
        </Title>

        <Row justify="center" style={{ marginBottom: 16 }}>
          <Space wrap size="middle">
            <Button onClick={() => router.push("/dashboardtest")}>
              Дашборд
            </Button>
            <Button
              onClick={() =>
                setFilters({
                  OWN_SCNAME: "Все",
                  SCNAME: "Все",
                  VIOLATION_TYPE: "Все",
                  OBJECTTYPE81: "Все",
                  F81_060_EVENTDATETIME: "Все",
                  CREATE_DATETIME: "Все",
                  F81_070_RESTOR_SUPPLAYDATETIME: "Все",
                  F81_290_RECOVERYDATETIME: "Все",
                })
              }
            >
              Сбросить фильтры
            </Button>
            <Button
              onClick={() => message.info("Скоро здесь появится AI аналитика")}
            >
              AI-Аналитика
            </Button>

            {/* Переключатель звука */}
            <Button
              type={soundOn ? "primary" : "default"}
              onClick={() => (soundOn ? disableSound() : enableSound())}
            >
              {soundOn ? "🔔 Звук: Вкл" : "🔕 Звук: Выкл"}
            </Button>
          </Space>
        </Row>

        <Card size="small" style={{ width: "100%", margin: 0, padding: 16 }}>
          <Row gutter={[12, 12]} wrap>
            {/* Select filters */}
            {[
              { key: "OWN_SCNAME", label: "Филиал" },
              { key: "SCNAME", label: "Произв. отделение" },
              { key: "VIOLATION_TYPE", label: "Вид ТН" },
              { key: "OBJECTTYPE81", label: "Вид объекта" },
            ].map(({ key, label }) => (
              <Col xs={24} sm={12} md={6} key={key}>
                <div style={{ marginBottom: 4, fontWeight: "500" }}>
                  {label}
                </div>
                <Select
                  style={{ width: "100%" }}
                  placeholder={label}
                  value={filters[key]}
                  onChange={(v) => setFilters((f) => ({ ...f, [key]: v }))}
                >
                  <Option value="Все">Все</Option>
                  {filterOptions[key].map((opt) => (
                    <Option key={opt} value={opt}>
                      {opt}
                    </Option>
                  ))}
                </Select>
              </Col>
            ))}

            {/* Date filters */}
            {[
              { key: "F81_060_EVENTDATETIME", label: "Дата возникновения" },
              { key: "CREATE_DATETIME", label: "Дата фиксирования" },
              {
                key: "F81_070_RESTOR_SUPPLAYDATETIME",
                label: "Дата восстановления (план)",
              },
              {
                key: "F81_290_RECOVERYDATETIME",
                label: "Дата восстановления (факт)",
              },
            ].map(({ key, label }) => (
              <Col xs={24} sm={12} md={6} key={key}>
                <div style={{ marginBottom: 4, fontWeight: "500" }}>
                  {label}
                </div>
                <Select
                  style={{ width: "100%" }}
                  placeholder={label}
                  value={filters[key]}
                  onChange={(v) => setFilters((f) => ({ ...f, [key]: v }))}
                >
                  <Option value="Все">Все</Option>
                  {filterOptions[key].map((opt) => (
                    <Option key={opt} value={opt}>
                      {opt}
                    </Option>
                  ))}
                </Select>
              </Col>
            ))}
          </Row>
        </Card>

        {isLoading && !error && (
          <div style={{ textAlign: "center", padding: 100 }}>
            <Spin size="large" />
          </div>
        )}

        {error && (
          <Title level={4} type="danger" style={{ textAlign: "center" }}>
            {error}
          </Title>
        )}

        {!isLoading && !error && (
          <Card
            style={{
              width: "100%",
              margin: 0,
              border: "none",
              boxShadow: "none",
            }}
          >
            <Table
              columns={columns}
              dataSource={filteredData}
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
                expandedRowRender: (record) => {
                  const hideFields = new Set([
                    "documentId",
                    "updatedAt",
                    "createdAt",
                    "publishedAt",
                    "id",
                    "SBYT_NOTIFICATION",
                    "SBYT_NOTIFICATION_STR",
                    "guid",
                    "OBJECTNAMEKEY",
                    "SWITCHNAMEKEY",
                    "VIOLATION_GUID_STR",
                  ]);
                  const entries = Object.entries(record.full).filter(
                    ([k]) => !hideFields.has(k)
                  );
                  return (
                    <>
                      {!isSuper && (
                        <div style={{ marginBottom: 16, textAlign: "center" }}>
                          <SendButtons
                            tn={record.full}
                            updateField={handleSaveEdit}
                          />
                        </div>
                      )}
                      <Card
                        size="small"
                        style={{
                          margin: 0,
                          padding: 16,
                          background: "#fafafa",
                        }}
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
                              v && typeof v === "object" && "label" in v
                                ? v.label
                                : k;
                            let rawVal =
                              v == null
                                ? null
                                : typeof v === "object" && "value" in v
                                ? v.value
                                : v;
                            const isEditable =
                              v && typeof v === "object" && v.edit === "Да";
                            let display = "Нет данных";
                            if (rawVal != null && rawVal !== "") {
                              display = String(rawVal);
                              if (
                                typeof rawVal === "string" &&
                                /\d{4}-\d{2}-\d{2}T/.test(rawVal)
                              ) {
                                display = dayjs(rawVal).format(
                                  "DD.MM.YYYY HH:mm:ss"
                                );
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
                                        setEditing({
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
                },
                rowExpandable: () => true,
                expandedRowKeys: expandedKeys,
                onExpand: (expanded, record) => {
                  setExpandedKeys(expanded ? [record.key] : []);
                },
              }}
            />
          </Card>
        )}

        {editing && (
          <Modal
            title={editing.label}
            open
            onCancel={() => setEditing(null)}
            onOk={handleSaveEdit}
            okText="Сохранить"
            cancelText="Отмена"
          >
            <Input
              value={editing.value}
              onChange={(e) =>
                setEditing((prev) => ({ ...prev, value: e.target.value }))
              }
              autoFocus
            />
          </Modal>
        )}
      </div>
    );
  }
}

// // eslint-disable-next-line
// "use client";
// import React from "react";
// import "@/app/globals.css";
// import { useEffect, useMemo, useState, useRef } from "react";
// import {
//   Table,
//   Typography,
//   Spin,
//   Descriptions,
//   Card,
//   Modal,
//   Input,
//   message,
//   Button,
//   Select,
//   Row,
//   Col,
//   Space,
// } from "antd";
// import {
//   EditOutlined,
//   NumberOutlined,
//   HomeOutlined,
//   EnvironmentOutlined,
//   DashboardOutlined,
//   CalendarOutlined,
// } from "@ant-design/icons";
// import dayjs from "dayjs";
// import "dayjs/locale/ru";
// dayjs.locale("ru");
// import SendButtons from "@/components/client/mainContent/SendButtons";
// import { useSession } from "next-auth/react";
// import { useRouter } from "next/navigation";
// import { useDashboardTestStore } from "@/stores/dashboardTestStore";

// const { Title } = Typography;
// const { Option } = Select;

// const val = (obj) =>
//   typeof obj === "object" && obj !== null && "value" in obj ? obj.value : obj;
// const formatDate = (d) => (d ? dayjs(d).format("DD.MM.YYYY HH:mm:ss") : "—");

// export default function MainPage() {
//   const { data: session, status } = useSession();
//   const userName = session?.user?.name || "";
//   const userRole = session?.user?.view_role;
//   const isSuper = userRole === "supergeneral";
//   const router = useRouter();
//   const token = session?.user?.jwt ?? null;
//   const { uniqueOpen, isLoading, error, loadUnique } = useDashboardTestStore();
//   const newGuids = useDashboardTestStore(state => state.newGuids);
//   const handleEvent = useDashboardTestStore(state => state.handleEvent);
//   const [expandedKeys, setExpandedKeys] = useState([]);
//   const [editing, setEditing] = useState(null);
//   const [filters, setFilters] = useState({
//     OWN_SCNAME: "Все",
//     SCNAME: "Все",
//     VIOLATION_TYPE: "Все",
//     OBJECTTYPE81: "Все",
//     F81_060_EVENTDATETIME: "Все",
//     CREATE_DATETIME: "Все",
//     F81_070_RESTOR_SUPPLAYDATETIME: "Все",
//     F81_290_RECOVERYDATETIME: "Все",
//   });

//   const handleSaveEdit = async () => {
//     if (!editing) return;
//     const { documentId, fieldKey, value } = editing;
//     const headers = {
//       "Content-Type": "application/json",
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     };
//     try {
//       const res = await fetch(
//         `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/tns/${documentId}`,
//         {
//           method: "PUT",
//           headers,
//           body: JSON.stringify({ data: { [fieldKey]: { value } } }),
//         }
//       );
//       if (!res.ok) throw new Error(`HTTP ${res.status}`);
//       message.success("Поле обновлено");
//       await loadUnique(token);
//       setEditing(null);
//     } catch (e) {
//       console.error("Update failed", e);
//       message.error("Не удалось сохранить изменения");
//     }
//   };

//   useEffect(() => {
//     if (status === "authenticated") {
//       const es = new EventSource("/api/event");
//       es.onmessage = (e) => {
//         try {
//           const data = JSON.parse(e.data);
//           handleEvent(data);
//         } catch (err) {
//           console.error("Ошибка разбора SSE-сообщения:", err);
//         }
//       };
//       es.onerror = (err) => {
//         console.error("SSE error:", err);
//         es.close();
//       };
//       return () => es.close();
//     }
//   }, [status, handleEvent]);

//   useEffect(() => {
//     if (status === "unauthenticated") {
//       router.push("/login");
//     }
//   }, [status, router]);

//   useEffect(() => {
//     if (status === "authenticated" && uniqueOpen.length === 0) {
//       loadUnique(token);
//     }
//   }, [status, token, uniqueOpen.length, loadUnique]);

//   const sorted = useMemo(
//     () =>
//       [...uniqueOpen].sort(
//         (a, b) =>
//           new Date(val(b.F81_060_EVENTDATETIME) || b.createdAt) -
//           new Date(val(a.F81_060_EVENTDATETIME) || a.createdAt)
//       ),
//     [uniqueOpen]
//   );

//   const dataSource = useMemo(
//     () =>
//       sorted.map((r) => ({
//         key: r.guid,
//         number: val(r.F81_010_NUMBER),
//         object: val(r.F81_042_DISPNAME),
//         address: val(r.ADDRESS_LIST),
//         center: val(r.DISPCENTER_NAME_),
//         event: formatDate(val(r.F81_060_EVENTDATETIME)),
//         full: r,
//         documentId: r.documentId,
//       })),
//     [sorted]
//   );

//   const filterOptions = useMemo(() => {
//     const o = {};
//     ["OWN_SCNAME", "SCNAME", "VIOLATION_TYPE", "OBJECTTYPE81"].forEach(
//       (key) => {
//         o[key] = Array.from(
//           new Set(uniqueOpen.map((r) => val(r[key])).filter(Boolean))
//         );
//       }
//     );
//     // date options: format date part
//     [
//       "F81_060_EVENTDATETIME",
//       "CREATE_DATETIME",
//       "F81_070_RESTOR_SUPPLAYDATETIME",
//       "F81_290_RECOVERYDATETIME",
//     ].forEach((key) => {
//       o[key] = Array.from(
//         new Set(
//           uniqueOpen
//             .map((r) => val(r[key]))
//             .filter(Boolean)
//             .map((d) => dayjs(d).format("DD.MM.YYYY"))
//         )
//       );
//     });
//     return o;
//   }, [uniqueOpen]);

//   const filteredData = useMemo(
//     () =>
//       dataSource.filter((item) => {
//         const r = item.full;

//         if (
//           filters.OWN_SCNAME !== "Все" &&
//           val(r.OWN_SCNAME) !== filters.OWN_SCNAME
//         )
//           return false;
//         if (filters.SCNAME !== "Все" && val(r.SCNAME) !== filters.SCNAME)
//           return false;
//         if (
//           filters.VIOLATION_TYPE !== "Все" &&
//           val(r.VIOLATION_TYPE) !== filters.VIOLATION_TYPE
//         )
//           return false;
//         if (
//           filters.OBJECTTYPE81 !== "Все" &&
//           val(r.OBJECTTYPE81) !== filters.OBJECTTYPE81
//         )
//           return false;
//         // date filters (compare date part)
//         const dt = (key) =>
//           val(r[key]) ? dayjs(val(r[key])).format("DD.MM.YYYY") : null;
//         if (
//           filters.F81_060_EVENTDATETIME !== "Все" &&
//           dt("F81_060_EVENTDATETIME") !== filters.F81_060_EVENTDATETIME
//         )
//           return false;
//         if (
//           filters.CREATE_DATETIME !== "Все" &&
//           dt("CREATE_DATETIME") !== filters.CREATE_DATETIME
//         )
//           return false;
//         if (
//           filters.F81_070_RESTOR_SUPPLAYDATETIME !== "Все" &&
//           dt("F81_070_RESTOR_SUPPLAYDATETIME") !==
//             filters.F81_070_RESTOR_SUPPLAYDATETIME
//         )
//           return false;
//         if (
//           filters.F81_290_RECOVERYDATETIME !== "Все" &&
//           dt("F81_290_RECOVERYDATETIME") !== filters.F81_290_RECOVERYDATETIME
//         )
//           return false;
//         return true;
//       }),
//     [dataSource, filters]
//   );

//   const rawColumns = [
//     {
//       title: (
//         <>
//           <NumberOutlined style={{ marginRight: 4, color: "#fa8c16" }} />
//           <span>№ ТН</span>
//         </>
//       ),
//       dataIndex: "number",
//       key: "number",
//       width: 120,
//     },
//     {
//       title: (
//         <>
//           <HomeOutlined style={{ marginRight: 4, color: "#fa8c16" }} />
//           <span>Объект</span>
//         </>
//       ),
//       dataIndex: "object",
//       key: "object",
//       responsive: ["md"],
//     },
//     {
//       title: (
//         <>
//           <EnvironmentOutlined style={{ marginRight: 4, color: "#fa8c16" }} />
//           <span>Адрес</span>
//         </>
//       ),
//       dataIndex: "address",
//       key: "address",
//       responsive: ["lg"],
//     },
//     {
//       title: (
//         <>
//           <DashboardOutlined style={{ marginRight: 4, color: "#fa8c16" }} />
//           <span>Дисп. центр</span>
//         </>
//       ),
//       dataIndex: "center",
//       key: "center",
//       width: 160,
//       responsive: ["md"],
//     },
//     {
//       title: (
//         <>
//           <CalendarOutlined style={{ marginRight: 4, color: "#fa8c16" }} />
//           <span>Дата/время возникновения</span>
//         </>
//       ),
//       dataIndex: "event",
//       key: "event",
//       width: 180,
//     },
//   ];

//   const columns = rawColumns.map((col) => ({
//     ...col,
//     align: "center",
//     title: (
//       <div
//         style={{
//           textAlign: "center",
//           fontWeight: 600,
//           fontSize: 14,
//           color: "#fa8c16",
//         }}
//       >
//         {col.title}
//       </div>
//     ),
//   }));

//   if (status === "loading") {
//     return (
//       <div style={{ textAlign: "center", padding: 100 }}>
//         <Spin size="large" />
//       </div>
//     );
//   }

//   if (status === "authenticated") {
//     return (
//       <div style={{ padding: 24, width: "100%", margin: "0" }}>
//         <Title level={3} style={{ textAlign: "center", marginBottom: 16 }}>
//           {`Всего открытых ТН: ${uniqueOpen.length}`}
//         </Title>

//         <Row justify="center" style={{ marginBottom: 16 }}>
//           <Space wrap size="middle">
//             <Button onClick={() => router.push("/dashboardtest")}>
//               Дашборд
//             </Button>
//             <Button
//               onClick={() =>
//                 setFilters({
//                   OWN_SCNAME: "Все",
//                   SCNAME: "Все",
//                   VIOLATION_TYPE: "Все",
//                   OBJECTTYPE81: "Все",
//                   F81_060_EVENTDATETIME: "Все",
//                   CREATE_DATETIME: "Все",
//                   F81_070_RESTOR_SUPPLAYDATETIME: "Все",
//                   F81_290_RECOVERYDATETIME: "Все",
//                 })
//               }
//             >
//               Сбросить фильтры
//             </Button>
//             <Button
//               onClick={() => message.info("Скоро здесь появится AI аналитика")}
//             >
//               AI‑Аналитика
//             </Button>
//           </Space>
//         </Row>

//         <Card size="small" style={{ width: "100%", margin: 0, padding: 16 }}>
//           <Row gutter={[12, 12]} wrap>
//             {/* Select filters */}
//             {[
//               { key: "OWN_SCNAME", label: "Филиал" },
//               { key: "SCNAME", label: "Произв. отделение" },
//               { key: "VIOLATION_TYPE", label: "Вид ТН" },
//               { key: "OBJECTTYPE81", label: "Вид объекта" },
//             ].map(({ key, label }) => (
//               <Col xs={24} sm={12} md={6} key={key}>
//                 <div style={{ marginBottom: 4, fontWeight: "500" }}>
//                   {label}
//                 </div>
//                 <Select
//                   style={{ width: "100%" }}
//                   placeholder={label}
//                   value={filters[key]}
//                   onChange={(v) => setFilters((f) => ({ ...f, [key]: v }))}
//                 >
//                   <Option value="Все">Все</Option>
//                   {filterOptions[key].map((opt) => (
//                     <Option key={opt} value={opt}>
//                       {opt}
//                     </Option>
//                   ))}
//                 </Select>
//               </Col>
//             ))}

//             {/* Date filters */}
//             {[
//               { key: "F81_060_EVENTDATETIME", label: "Дата возникновения" },
//               { key: "CREATE_DATETIME", label: "Дата фиксирования" },
//               {
//                 key: "F81_070_RESTOR_SUPPLAYDATETIME",
//                 label: "Дата восстановления (план)",
//               },
//               {
//                 key: "F81_290_RECOVERYDATETIME",
//                 label: "Дата восстановления (факт)",
//               },
//             ].map(({ key, label }) => (
//               <Col xs={24} sm={12} md={6} key={key}>
//                 <div style={{ marginBottom: 4, fontWeight: "500" }}>
//                   {label}
//                 </div>
//                 <Select
//                   style={{ width: "100%" }}
//                   placeholder={label}
//                   value={filters[key]}
//                   onChange={(v) => setFilters((f) => ({ ...f, [key]: v }))}
//                 >
//                   <Option value="Все">Все</Option>
//                   {filterOptions[key].map((opt) => (
//                     <Option key={opt} value={opt}>
//                       {opt}
//                     </Option>
//                   ))}
//                 </Select>
//               </Col>
//             ))}
//           </Row>
//         </Card>

//         {isLoading && !error && (
//           <div style={{ textAlign: "center", padding: 100 }}>
//             <Spin size="large" />
//           </div>
//         )}

//         {error && (
//           <Title level={4} type="danger" style={{ textAlign: "center" }}>
//             {error}
//           </Title>
//         )}

//         {!isLoading && !error && (
//           <Card
//             style={{
//               width: "100%",
//               margin: 0,
//               border: "none",
//               boxShadow: "none",
//             }}
//           >
//             <Table
//               columns={columns}
//               dataSource={filteredData}
//               bordered
//               scroll={{ x: true }}
//               pagination={{ pageSize: 10, showSizeChanger: false }}
//               size="middle"
//               tableLayout="fixed"
//               rowClassName={(record, index) =>
//                 newGuids.includes(record.key)
//                   ? "tn-new"
//                   : index % 2 === 0
//                   ? "row-light"
//                   : ""
//               }
//               expandable={{
//                 expandedRowRender: (record) => {
//                   const hideFields = new Set([
//                     "documentId",
//                     "updatedAt",
//                     "createdAt",
//                     "publishedAt",
//                     "id",
//                     "SBYT_NOTIFICATION",
//                     "SBYT_NOTIFICATION_STR",
//                     "guid",
//                     "OBJECTNAMEKEY",
//                     "SWITCHNAMEKEY",
//                     "VIOLATION_GUID_STR",
//                   ]);
//                   const entries = Object.entries(record.full).filter(
//                     ([k]) => !hideFields.has(k)
//                   );
//                   return (
//                     <>
//                       {!isSuper && (
//                         <div style={{ marginBottom: 16, textAlign: "center" }}>
//                           <SendButtons tn={record.full} updateField={handleSaveEdit} />
//                         </div>
//                       )}
//                       <Card
//                         size="small"
//                         style={{ margin: 0, padding: 16, background: "#fafafa" }}
//                         styles={{ body: { padding: 0 } }}
//                       >
//                         <Descriptions
//                           size="small"
//                           column={2}
//                           bordered={false}
//                           styles={{
//                             label: { fontWeight: 600, color: "#fa8c16" },
//                             content: { paddingLeft: 8 }
//                           }}
//                           items={entries.map(([k, v]) => {
//                             const label =
//                               v && typeof v === "object" && "label" in v
//                                 ? v.label
//                                 : k;
//                             let rawVal =
//                               v == null
//                                 ? null
//                                 : typeof v === "object" && "value" in v
//                                 ? v.value
//                                 : v;
//                             const isEditable =
//                               v && typeof v === "object" && v.edit === "Да";
//                             let display = "Нет данных";
//                             if (rawVal != null && rawVal !== "") {
//                               display = String(rawVal);
//                               if (
//                                 typeof rawVal === "string" &&
//                                 /\d{4}-\d{2}-\d{2}T/.test(rawVal)
//                               ) {
//                                 display = dayjs(rawVal).format(
//                                   "DD.MM.YYYY HH:mm:ss"
//                                 );
//                               }
//                             }
//                             return {
//                               key: k,
//                               label,
//                               children: (
//                                 <span>
//                                   {display}
//                                   {isEditable && !isSuper && (
//                                     <EditOutlined
//                                       style={{
//                                         color: "#52c41a",
//                                         marginLeft: 8,
//                                         cursor: "pointer",
//                                       }}
//                                       onClick={() =>
//                                         setEditing({
//                                           recordKey: record.key,
//                                           documentId: record.full.documentId,
//                                           fieldKey: k,
//                                           label,
//                                           value: display,
//                                         })
//                                       }
//                                     />
//                                   )}
//                                 </span>
//                               ),
//                             };
//                           })}
//                         />
//                       </Card>
//                     </>
//                   );
//                 },
//                 rowExpandable: () => true,
//                 expandedRowKeys: expandedKeys,
//                 onExpand: (expanded, record) => {
//                   setExpandedKeys(expanded ? [record.key] : []);
//                 },
//               }}
//             />
//           </Card>
//         )}

//         {editing && (
//           <Modal
//             title={editing.label}
//             open
//             onCancel={() => setEditing(null)}
//             onOk={handleSaveEdit}
//             okText="Сохранить"
//             cancelText="Отмена"
//           >
//             <Input
//               value={editing.value}
//               onChange={(e) =>
//                 setEditing((prev) => ({ ...prev, value: e.target.value }))
//               }
//               autoFocus
//             />
//           </Modal>
//         )}
//       </div>
//     );
//   }
// }

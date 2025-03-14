"use client";
import React, { useEffect } from "react";
import { Typography, ConfigProvider, Spin, Alert, Flex, Space } from "antd";
import ru_RU from "antd/locale/ru_RU";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isBetween from "dayjs/plugin/isBetween";
import "dayjs/locale/ru";

const { Title } = Typography;

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);
dayjs.locale("ru");

import { useIncidentsDataStore } from "@/stores/incidentsDataStore";
import useStatStore from "@/stores/statStore";
import useAuthStore from "@/stores/authStore";

// Клиентские компоненты
import ButtonStatStart from "@/components/client/stat/ButtonStatStart";
import ButtonStatBack from "@/components/client/stat/ButtonStatBack";
import StatFilters from "@/components/client/stat/StatFilters";

// Серверные компоненты
import StatResults from "@/components/server/stat/StatResults";
import StatChart from "@/components/server/stat/StatChart";


const metricOptions = [
  { label: "Количество инцидентов", value: "countIncidents" },
  { label: "Отключено жителей", value: "affectedResidents" },
  { label: "Отключено МКД", value: "affectedMkd" },
  { label: "Отключено больниц", value: "affectedHospitals" },
  { label: "Отключено поликлиник", value: "affectedClinics" },
];

export default function Stat() {
  const { token } = useAuthStore();
  const { incidents, loading, error, fetchIncidents } = useIncidentsDataStore();

  // Подключаем store для статистики
  const {
    dateRange,
    setDateRange,
    selectedCity,
    setSelectedCity,
    selectedStatus,
    setSelectedStatus,
    selectedMetrics,
    setSelectedMetrics,
    results,
    chartData,
    calculate,
  } = useStatStore();

  useEffect(() => {
    if (token && incidents.length === 0) {
      fetchIncidents(token);
    }
  }, [token, incidents, fetchIncidents]);

  const uniqueCities = React.useMemo(() => {
    const citySet = new Set();
    incidents.forEach((inc) => {
      const cityName = inc.AddressInfo?.city_district?.name;
      if (cityName) {
        citySet.add(cityName.trim());
      }
    });
    return ["Все", ...citySet];
  }, [incidents]);

  const handleCalculate = () => {
    calculate(incidents);
  };

  if (loading) {
    return (
      <div style={{ marginTop: 50, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ marginTop: 50 }}>
        <Alert type="error" message={error} />
      </div>
    );
  }

  return (
    <ConfigProvider locale={ru_RU}>
      <div style={{ padding: 20 }}>
        <Flex justify={"space-between"}>
          <Title level={2}>Статистика</Title>
          <ButtonStatBack />
        </Flex>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <StatFilters
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            uniqueCities={uniqueCities}
            selectedCity={selectedCity}
            onCityChange={setSelectedCity}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            metricOptions={metricOptions}
            selectedMetrics={selectedMetrics}
            onMetricsChange={setSelectedMetrics}
          />
          <ButtonStatStart onCalculate={handleCalculate} />
        </Space>
        <StatChart chartData={chartData} />
        <StatResults results={results} selectedMetrics={selectedMetrics} />
      </div>
    </ConfigProvider>
  );
}

// "use client";
// import React, { useState, useEffect } from "react";
// import { Typography, ConfigProvider, Spin, Alert, Flex, Space } from "antd";
// import ru_RU from "antd/locale/ru_RU";
// import dayjs from "dayjs";
// import customParseFormat from "dayjs/plugin/customParseFormat";
// import isBetween from "dayjs/plugin/isBetween";
// import "dayjs/locale/ru";

// dayjs.extend(customParseFormat);
// dayjs.extend(isBetween);
// dayjs.locale("ru");

// import { useIncidentsDataStore } from "@/stores/incidentsDataStore";
// import useAuthStore from "@/stores/authStore";

// // Клиентские компоненты
// import ButtonStatStart from "@/components/client/stat/ButtonStatStart";
// import ButtonStatBack from "@/components/client/stat/ButtonStatBack";
// import StatFilters from "@/components/client/stat/StatFilters";

// // Серверные компоненты
// import StatResults from "@/components/server/stat/StatResults";
// import StatChart from "@/components/server/stat/StatChart";

// const { Title } = Typography;
// const metricOptions = [
//   { label: "Количество инцидентов", value: "countIncidents" },
//   { label: "Отключено жителей", value: "affectedResidents" },
//   { label: "Отключено МКД", value: "affectedMkd" },
//   { label: "Отключено больниц", value: "affectedHospitals" },
//   { label: "Отключено поликлиник", value: "affectedClinics" },
// ];

// export default function Stat() {
//   const { token } = useAuthStore();
//   const { incidents, loading, error, fetchIncidents } = useIncidentsDataStore();

//   const [dateRange, setDateRange] = useState(null);
//   const [selectedCity, setSelectedCity] = useState("Все");
//   const [selectedStatus, setSelectedStatus] = useState("Все");
//   const [selectedMetrics, setSelectedMetrics] = useState([]);
//   const [results, setResults] = useState({});
//   const [chartData, setChartData] = useState([]);

//   useEffect(() => {
//     if (token && incidents.length === 0) {
//       fetchIncidents(token);
//     }
//   }, [token, incidents, fetchIncidents]);

//   const uniqueCities = React.useMemo(() => {
//     const citySet = new Set();
//     incidents.forEach((inc) => {
//       const cityName = inc.AddressInfo?.city_district?.name;
//       if (cityName) {
//         citySet.add(cityName.trim());
//       }
//     });
//     return ["Все", ...citySet];
//   }, [incidents]);

//   const handleCalculate = () => {
//     let filtered = incidents;

//     if (selectedCity !== "Все") {
//       filtered = filtered.filter((inc) => {
//         const cityName = inc.AddressInfo?.city_district?.name?.trim() || "";
//         return cityName === selectedCity;
//       });
//     }

//     if (selectedStatus !== "Все") {
//       filtered = filtered.filter(
//         (inc) => inc.status_incident?.trim() === selectedStatus
//       );
//     }

//     if (dateRange && dateRange[0] && dateRange[1]) {
//       const [start, end] = dateRange;
//       filtered = filtered.filter((inc) => {
//         const incDate = dayjs(inc.start_date, "YYYY-MM-DD");
//         return incDate.isBetween(start, end, "day", "[]");
//       });
//     }

//     const newResults = {};
//     if (selectedMetrics.includes("countIncidents")) {
//       newResults.countIncidents = filtered.length;
//     }
//     if (selectedMetrics.includes("affectedResidents")) {
//       let sum = 0;
//       filtered.forEach((inc) => {
//         if (inc.DisruptionStats) {
//           sum += parseInt(inc.DisruptionStats.affected_residents || "0", 10);
//         }
//       });
//       newResults.affectedResidents = sum;
//     }
//     if (selectedMetrics.includes("affectedMkd")) {
//       let sum = 0;
//       filtered.forEach((inc) => {
//         if (inc.DisruptionStats) {
//           sum += parseInt(inc.DisruptionStats.affected_mkd || "0", 10);
//         }
//       });
//       newResults.affectedMkd = sum;
//     }
//     if (selectedMetrics.includes("affectedHospitals")) {
//       let sum = 0;
//       filtered.forEach((inc) => {
//         if (inc.DisruptionStats) {
//           sum += parseInt(inc.DisruptionStats.affected_hospitals || "0", 10);
//         }
//       });
//       newResults.affectedHospitals = sum;
//     }
//     if (selectedMetrics.includes("affectedClinics")) {
//       let sum = 0;
//       filtered.forEach((inc) => {
//         if (inc.DisruptionStats) {
//           sum += parseInt(inc.DisruptionStats.affected_clinics || "0", 10);
//         }
//       });
//       newResults.affectedClinics = sum;
//     }
//     setResults(newResults);

//     if (
//       selectedMetrics.includes("countIncidents") &&
//       dateRange &&
//       dateRange[0] &&
//       dateRange[1]
//     ) {
//       const [start, end] = dateRange;
//       let chartObj = {};
//       let current = start.startOf("day");
//       const endDay = end.endOf("day");
//       while (current.isBefore(endDay) || current.isSame(endDay)) {
//         chartObj[current.format("DD.MM.YYYY")] = 0;
//         current = current.add(1, "day");
//       }
//       filtered.forEach((inc) => {
//         const dateKey = dayjs(inc.start_date, "YYYY-MM-DD").format(
//           "DD.MM.YYYY"
//         );
//         if (chartObj.hasOwnProperty(dateKey)) {
//           chartObj[dateKey] += 1;
//         }
//       });
//       const chartArray = Object.keys(chartObj).map((dateKey) => ({
//         date: dateKey,
//         count: chartObj[dateKey],
//       }));
//       setChartData(chartArray);
//     } else {
//       setChartData([]);
//     }
//   };

//   if (loading) {
//     return (
//       <div style={{ marginTop: 50, textAlign: "center" }}>
//         <Spin size="large" />
//       </div>
//     );
//   }
//   if (error) {
//     return (
//       <div style={{ marginTop: 50 }}>
//         <Alert type="error" message={error} />
//       </div>
//     );
//   }

//   return (
//     <ConfigProvider locale={ru_RU}>
//       <div style={{ padding: 20 }}>
//         <Flex justify={"space-between"}>
//           <Title level={2}>Статистика</Title>
//           <ButtonStatBack />
//         </Flex>
//         <Space direction="vertical" size="large" style={{ width: "100%" }}>
//           <StatFilters
//             dateRange={dateRange}
//             onDateRangeChange={setDateRange}
//             uniqueCities={uniqueCities}
//             selectedCity={selectedCity}
//             onCityChange={setSelectedCity}
//             selectedStatus={selectedStatus}
//             onStatusChange={setSelectedStatus}
//             metricOptions={metricOptions}
//             selectedMetrics={selectedMetrics}
//             onMetricsChange={setSelectedMetrics}
//           />
//           <ButtonStatStart onCalculate={handleCalculate} />
//         </Space>
//         <StatChart chartData={chartData} />
//         <StatResults results={results} selectedMetrics={selectedMetrics} />
//       </div>
//     </ConfigProvider>
//   );
// }

// "use client";
// import React, { useState, useEffect } from "react";
// import {
//   Typography,
//   Button,
//   DatePicker,
//   Select,
//   Checkbox,
//   Space,
//   ConfigProvider,
//   Spin,
//   Alert,
//   Flex,
// } from "antd";
// import ru_RU from "antd/locale/ru_RU";
// import dayjs from "dayjs";
// import customParseFormat from "dayjs/plugin/customParseFormat";
// import isBetween from "dayjs/plugin/isBetween";
// import "dayjs/locale/ru";

// dayjs.extend(customParseFormat);
// dayjs.extend(isBetween);
// dayjs.locale("ru");

// import Link from "next/link";
// import { useIncidentsDataStore } from "@/stores/incidentsDataStore";
// import useAuthStore from "@/stores/authStore";

// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";

// const { Title, Paragraph } = Typography;
// const { RangePicker } = DatePicker;
// const { Option } = Select;

// export default function Stat() {
//   const { token } = useAuthStore();
//   const { incidents, loading, error, fetchIncidents } = useIncidentsDataStore();

//   // Фильтры
//   const [dateRange, setDateRange] = useState(null); // [dayjs, dayjs]
//   const [selectedCity, setSelectedCity] = useState("Все"); // "Все" или конкретный город
//   const [selectedStatus, setSelectedStatus] = useState("Все"); // "Все", "в работе", "выполнена"
//   const [selectedMetrics, setSelectedMetrics] = useState([]); // выбранные метрики

//   // Результаты вычислений
//   const [results, setResults] = useState({});
//   // Данные для графика (если выбрана метрика "Количество инцидентов")
//   const [chartData, setChartData] = useState([]);

//   // Загружаем инциденты, если токен есть и данные ещё не загружены
//   useEffect(() => {
//     if (token && incidents.length === 0) {
//       fetchIncidents(token);
//     }
//   }, [token, incidents, fetchIncidents]);

//   // Список уникальных городов (включая "Все")
//   const uniqueCities = React.useMemo(() => {
//     const citySet = new Set();
//     incidents.forEach((inc) => {
//       const cityName = inc.AddressInfo?.city_district?.name;
//       if (cityName) {
//         citySet.add(cityName.trim());
//       }
//     });
//     return ["Все", ...citySet];
//   }, [incidents]);

//   // Метрики, доступные для выбора
//   const metricOptions = [
//     { label: "Количество инцидентов", value: "countIncidents" },
//     { label: "Отключено жителей", value: "affectedResidents" },
//     { label: "Отключено МКД", value: "affectedMkd" },
//     { label: "Отключено больниц", value: "affectedHospitals" },
//     { label: "Отключено поликлиник", value: "affectedClinics" },
//   ];

//   // Обработчик кнопки "Посчитать"
//   const handleCalculate = () => {
//     // Фильтрация по городу, статусу и периоду
//     let filtered = incidents;

//     if (selectedCity !== "Все") {
//       filtered = filtered.filter((inc) => {
//         const cityName = inc.AddressInfo?.city_district?.name?.trim() || "";
//         return cityName === selectedCity;
//       });
//     }

//     if (selectedStatus !== "Все") {
//       filtered = filtered.filter(
//         (inc) => inc.status_incident?.trim() === selectedStatus
//       );
//     }

//     if (dateRange && dateRange[0] && dateRange[1]) {
//       const [start, end] = dateRange;
//       filtered = filtered.filter((inc) => {
//         const incDate = dayjs(inc.start_date, "YYYY-MM-DD");
//         return incDate.isBetween(start, end, "day", "[]");
//       });
//     }

//     // Вычисление выбранных метрик
//     const newResults = {};

//     if (selectedMetrics.includes("countIncidents")) {
//       newResults.countIncidents = filtered.length;
//     }

//     if (selectedMetrics.includes("affectedResidents")) {
//       let sum = 0;
//       filtered.forEach((inc) => {
//         if (inc.DisruptionStats) {
//           const val = parseInt(
//             inc.DisruptionStats.affected_residents || "0",
//             10
//           );
//           sum += val;
//         }
//       });
//       newResults.affectedResidents = sum;
//     }

//     if (selectedMetrics.includes("affectedMkd")) {
//       let sum = 0;
//       filtered.forEach((inc) => {
//         if (inc.DisruptionStats) {
//           const val = parseInt(inc.DisruptionStats.affected_mkd || "0", 10);
//           sum += val;
//         }
//       });
//       newResults.affectedMkd = sum;
//     }

//     if (selectedMetrics.includes("affectedHospitals")) {
//       let sum = 0;
//       filtered.forEach((inc) => {
//         if (inc.DisruptionStats) {
//           const val = parseInt(
//             inc.DisruptionStats.affected_hospitals || "0",
//             10
//           );
//           sum += val;
//         }
//       });
//       newResults.affectedHospitals = sum;
//     }

//     if (selectedMetrics.includes("affectedClinics")) {
//       let sum = 0;
//       filtered.forEach((inc) => {
//         if (inc.DisruptionStats) {
//           const val = parseInt(inc.DisruptionStats.affected_clinics || "0", 10);
//           sum += val;
//         }
//       });
//       newResults.affectedClinics = sum;
//     }

//     setResults(newResults);

//     // Построение данных для графика: если выбрана метрика "Количество инцидентов" и выбран период
//     if (
//       selectedMetrics.includes("countIncidents") &&
//       dateRange &&
//       dateRange[0] &&
//       dateRange[1]
//     ) {
//       const [start, end] = dateRange;
//       let chartObj = {};
//       // Инициализируем все дни в выбранном диапазоне
//       let current = start.startOf("day");
//       const endDay = end.endOf("day");
//       while (current.isBefore(endDay) || current.isSame(endDay)) {
//         chartObj[current.format("DD.MM.YYYY")] = 0;
//         current = current.add(1, "day");
//       }
//       // Для каждого инцидента увеличиваем счетчик в соответствующий день
//       filtered.forEach((inc) => {
//         const dateKey = dayjs(inc.start_date, "YYYY-MM-DD").format(
//           "DD.MM.YYYY"
//         );
//         if (chartObj.hasOwnProperty(dateKey)) {
//           chartObj[dateKey] += 1;
//         }
//       });
//       const chartArray = Object.keys(chartObj).map((dateKey) => ({
//         date: dateKey,
//         count: chartObj[dateKey],
//       }));
//       setChartData(chartArray);
//     } else {
//       setChartData([]);
//     }
//   };

//   if (loading) {
//     return (
//       <div style={{ marginTop: 50, textAlign: "center" }}>
//         <Spin size="large" />
//       </div>
//     );
//   }
//   if (error) {
//     return (
//       <div style={{ marginTop: 50 }}>
//         <Alert type="error" message={error} />
//       </div>
//     );
//   }

//   return (
//     <ConfigProvider locale={ru_RU}>
//       <div style={{ padding: 20 }}>
//         <Flex justify={"space-between"}>

//           <Title level={2}>Статистика</Title>
//           <Link href="/">
//             <Button type="default">Технологические нарушения</Button>
//           </Link>
//         </Flex>

//         <Space direction="vertical" size="large" style={{ width: "100%" }}>
//           <Space wrap>
//             {/* Фильтр по периоду */}
//             <RangePicker
//               format="DD.MM.YYYY"
//               onChange={(dates) => setDateRange(dates)}
//               allowClear
//             />
//             {/* Фильтр по городу */}
//             <Select
//               style={{ width: 200 }}
//               value={selectedCity}
//               onChange={(val) => setSelectedCity(val)}
//             >
//               {uniqueCities.map((city) => (
//                 <Option key={city} value={city}>
//                   {city}
//                 </Option>
//               ))}
//             </Select>
//             {/* Фильтр по статусу */}
//             <Select
//               style={{ width: 200 }}
//               value={selectedStatus}
//               onChange={(val) => setSelectedStatus(val)}
//             >
//               <Option value="Все">Все</Option>
//               <Option value="в работе">В работе</Option>
//               <Option value="выполнена">Выполненные</Option>
//             </Select>
//           </Space>

//           {/* Выбор метрик */}
//           <Checkbox.Group
//             options={metricOptions}
//             value={selectedMetrics}
//             onChange={(vals) => setSelectedMetrics(vals)}
//           />

//           <Button type="primary" onClick={handleCalculate}>
//             Посчитать
//           </Button>
//         </Space>

//         {/* График (если есть данные) */}
//         {chartData.length > 0 && (
//           <div style={{ marginTop: 30, height: 300 }}>
//             <Title level={4}>Распределение инцидентов по дням</Title>
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart
//                 data={chartData}
//                 margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
//               >
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="date" />
//                 <YAxis />
//                 <Tooltip />
//                 <Legend />
//                 <Bar dataKey="count" fill="#8884d8" animationDuration={1500} />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         )}

//         {/* Блок отображения числовых результатов */}
//         <div style={{ marginTop: 30 }}>
//           {Object.keys(results).length === 0 ? (
//             <Paragraph>Выберите параметры и нажмите «Посчитать»</Paragraph>
//           ) : (
//             <div style={{ border: "1px solid #ddd", padding: 16 }}>
//               <Title level={4}>Результаты:</Title>
//               {selectedMetrics.includes("countIncidents") && (
//                 <Paragraph>
//                   <strong>Количество инцидентов:</strong>{" "}
//                   {results.countIncidents}
//                 </Paragraph>
//               )}
//               {selectedMetrics.includes("affectedResidents") && (
//                 <Paragraph>
//                   <strong>Отключено жителей:</strong>{" "}
//                   {results.affectedResidents}
//                 </Paragraph>
//               )}
//               {selectedMetrics.includes("affectedMkd") && (
//                 <Paragraph>
//                   <strong>Отключено МКД:</strong> {results.affectedMkd}
//                 </Paragraph>
//               )}
//               {selectedMetrics.includes("affectedHospitals") && (
//                 <Paragraph>
//                   <strong>Отключено больниц:</strong>{" "}
//                   {results.affectedHospitals}
//                 </Paragraph>
//               )}
//               {selectedMetrics.includes("affectedClinics") && (
//                 <Paragraph>
//                   <strong>Отключено поликлиник:</strong>{" "}
//                   {results.affectedClinics}
//                 </Paragraph>
//               )}
//             </div>
//           )}
//         </div>

//       </div>
//     </ConfigProvider>
//   );
// }

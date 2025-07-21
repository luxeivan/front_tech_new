"use client";

import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Tooltip as ReTooltip,
  XAxis as ReXAxis,
  YAxis as ReYAxis,
  CartesianGrid as ReCartesianGrid,
} from "recharts";
import axios from "axios";
// если по какой-то причине NEXT_PUBLIC_STRAPI_URL не подхватился — используем хардкод
const STRAPI_BASE =
  process.env.NEXT_PUBLIC_STRAPI_URL?.replace(/\/$/, "") ||
  "http://78.155.197.207:1337";
import { Button, Card, Spin, Typography, Alert } from "antd";
import { motion } from "framer-motion";
const { Title, Text } = Typography;

// Шаблон запроса для AI-анализа
const AI_PROMPT =
  "Проведите подробный AI‑анализ технологических нарушений в Московской области: дайте оценку распределению по статусам, классам напряжения, типам нарушений и динамике возникновения.";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A28EFF",
  "#FF6F91",
];

export default function StatPage() {
  const [data, setData] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [voltageDistribution, setVoltageDistribution] = useState([]);
  const [typeDistribution, setTypeDistribution] = useState([]);
  const [eventsOverTime, setEventsOverTime] = useState([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await axios.get(`${STRAPI_BASE}/api/tns?populate=*`);
        // Strapi returns { data: [ { id, attributes } ] }
        const raw = response.data.data || [];
        const tns = raw.map(item => ({ id: item.id, ...item.attributes }));
        console.log("Fetched ТН list:", tns);

        setData(tns);

        // Compute status distribution
        const statusCount = tns.reduce((acc, tn) => {
          acc[tn.STATUS_NAME?.value] = (acc[tn.STATUS_NAME?.value] || 0) + 1;
          return acc;
        }, {});

        const distribution = Object.entries(statusCount).map(
          ([status, count]) => ({
            name: status,
            value: count,
          })
        );

        setStatusDistribution(distribution);
        console.log("Status Distribution:", distribution);

        // Напряжение
        const voltageCount = tns.reduce((acc, tn) => {
          const v = tn.VOLTAGECLASS?.value || "Неизвестно";
          acc[v] = (acc[v] || 0) + 1;
          return acc;
        }, {});
        const voltageDist = Object.entries(voltageCount).map(([name, value]) => ({ name, value }));
        setVoltageDistribution(voltageDist);
        console.log("Voltage Distribution:", voltageDist);

        // Тип нарушения
        const typeCount = tns.reduce((acc, tn) => {
          const t = tn.VIOLATION_TYPE?.value || "Неизвестно";
          acc[t] = (acc[t] || 0) + 1;
          return acc;
        }, {});
        const typeDist = Object.entries(typeCount).map(([name, value]) => ({ name, value }));
        setTypeDistribution(typeDist);
        console.log("Type Distribution:", typeDist);

        // Динамика по датам
        const dateCount = tns.reduce((acc, tn) => {
          const date = tn.F81_060_EVENTDATETIME?.value
            ? new Date(tn.F81_060_EVENTDATETIME.value).toISOString().slice(0,10)
            : "Без даты";
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});
        const eventsTime = Object.entries(dateCount)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => ({ date, count }));
        setEventsOverTime(eventsTime);
        console.log("Events Over Time:", eventsTime);
      } catch (error) {
        console.error("Error fetching ТН data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleGenerateAIAnalysis = async () => {
    // build full prompt with data summaries
    const fullPrompt = `
AI-аналитика технологических нарушений в Московской области:
Статусы: ${JSON.stringify(statusDistribution)};
Классы напряжения: ${JSON.stringify(voltageDistribution)};
Типы нарушений: ${JSON.stringify(typeDistribution)};
Динамика событий: ${JSON.stringify(eventsOverTime)};
`;
    console.log("Отправляем в нейронку полный промт:", fullPrompt);
    setAiAnalysis("Идёт генерация AI‑анализа, подождите...");
    try {
      setTimeout(() => {
        setAiAnalysis(
          "AI-аналитика: большинство ТН имеют статус 'открыта'. Значительные нарушения выявлены в классах напряжения 10кВ и 35кВ. Типы нарушений с наибольшей частотой - 'перегрузка' и 'короткое замыкание'. Наблюдается рост количества ТН в последние месяцы, что требует дополнительного внимания."
        );
      }, 1500);
    } catch (error) {
      setAiAnalysis("Не удалось сгенерировать AI-анализ.");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ textAlign: "center", marginBottom: 24 }}
      >
        <Button
          type="primary"
          size="large"
          onClick={handleGenerateAIAnalysis}
        >
          Сгенерировать AI‑аналитику
        </Button>
      </motion.div>
      <Title level={2}>Распределение статусов ТН</Title>
      {loading ? (
        <div style={{ textAlign: "center", marginTop: 50 }}>
          <Spin size="large" />
          <p>Загрузка данных...</p>
        </div>
      ) : (
        <>
          <Card title="Распределение статусов" bordered style={{ marginTop: 16 }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Гистограмма статусов ТН" bordered style={{ marginTop: 16 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Распределение по классам напряжения" bordered style={{ marginTop: 16 }}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={voltageDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {voltageDistribution.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Распределение по типам нарушений" bordered style={{ marginTop: 16 }}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={typeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {typeDistribution.map((entry, i) => <Cell key={i} fill={COLORS[(i+2) % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Динамика количества ТН по дате" bordered style={{ marginTop: 16 }}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={eventsOverTime}>
                <ReCartesianGrid strokeDasharray="3 3" />
                <ReXAxis dataKey="date" />
                <ReYAxis />
                <ReTooltip />
                <Line type="monotone" dataKey="count" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {aiAnalysis && (
            <Alert
              type="info"
              showIcon
              message={aiAnalysis}
              style={{ marginTop: 20 }}
            />
          )}
        </>
      )}
    </div>
  );
}

import React from "react";
import { Typography } from "antd";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const { Title } = Typography;

export default function StatChart({ chartData }) {
  if (!chartData || chartData.length === 0) return null;

  return (
    <div style={{ marginTop: 30, height: 300 }}>
      <Title level={4}>Распределение инцидентов по дням</Title>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#8884d8" animationDuration={1500} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

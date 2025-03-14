import React from "react";
import { Typography } from "antd";

const { Title, Paragraph } = Typography;

export default function StatResults({ results, selectedMetrics }) {
  return (
    <div style={{ marginTop: 30 }}>
      {Object.keys(results).length === 0 ? (
        <Paragraph>Выберите параметры и нажмите «Посчитать»</Paragraph>
      ) : (
        <div style={{ border: "1px solid #ddd", padding: 16 }}>
          <Title level={4}>Результаты:</Title>
          {selectedMetrics.includes("countIncidents") && (
            <Paragraph>
              <strong>Количество инцидентов:</strong> {results.countIncidents}
            </Paragraph>
          )}
          {selectedMetrics.includes("affectedResidents") && (
            <Paragraph>
              <strong>Отключено жителей:</strong> {results.affectedResidents}
            </Paragraph>
          )}
          {selectedMetrics.includes("affectedMkd") && (
            <Paragraph>
              <strong>Отключено МКД:</strong> {results.affectedMkd}
            </Paragraph>
          )}
          {selectedMetrics.includes("affectedHospitals") && (
            <Paragraph>
              <strong>Отключено больниц:</strong> {results.affectedHospitals}
            </Paragraph>
          )}
          {selectedMetrics.includes("affectedClinics") && (
            <Paragraph>
              <strong>Отключено поликлиник:</strong> {results.affectedClinics}
            </Paragraph>
          )}
        </div>
      )}
    </div>
  );
}

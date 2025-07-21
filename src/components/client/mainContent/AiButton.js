"use client";

import React, { useState } from "react";
import { Button, Modal, Spin, Alert, Space } from "antd";
import { BulbOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useTnsDataStore } from "@/stores/tnsDataStore";

export default function AiButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const { tns } = useTnsDataStore();

  // Список доступных типов анализа
  const prompts = [
    {
      key: 'summary',
      label: 'Краткий отчёт',
      prompt:
        'Проведи резюме AI-аналитики технологических нарушений: ' +
        '• Общее число ТН за период. • Топ-3 филиала по количеству и по средней длительности восстановления. • Пиковые часы.',
    },
    {
      key: 'structured',
      label: 'Структурированный JSON',
      prompt:
        'Структурируй данные о ТН в формате JSON: ' +
        '{ total, byBranch: [...], byHour: [...], percentilesRepairTime: {...} }',
    },
    {
      key: 'recommendations',
      label: 'Рекомендации',
      prompt:
        'На основе распределений по статусам, классам напряжения и времени восстановления ' +
        'предложи 5 мер по снижению простоев, ранжируя по приоритету.',
    },
    {
      key: 'anomalies',
      label: 'Аномалии',
      prompt:
        'Найди аномальные ТН: время восстановления >2σ от среднего. ' +
        'Выведи список с { id, branch, type, repairTime }.',
    },
  ];

  const handlePrompt = async (basePrompt) => {
    setLoading(true);
    const raw = tns || [];

    // Собираем распределения (статусы, напряжение, типы, даты)
    const statusCount = raw.reduce((acc, tn) => {
      const key = tn.STATUS_NAME?.value || 'Неизвестно';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const statusDist = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

    const voltageCount = raw.reduce((acc, tn) => {
      const v = tn.VOLTAGECLASS?.value || 'Неизвестно';
      acc[v] = (acc[v] || 0) + 1;
      return acc;
    }, {});
    const voltageDist = Object.entries(voltageCount).map(([name, value]) => ({ name, value }));

    const typeCount = raw.reduce((acc, tn) => {
      const t = tn.VIOLATION_TYPE?.value || 'Неизвестно';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});
    const typeDist = Object.entries(typeCount).map(([name, value]) => ({ name, value }));

    const dateCount = raw.reduce((acc, tn) => {
      const date = tn.F81_060_EVENTDATETIME?.value
        ? new Date(tn.F81_060_EVENTDATETIME.value).toISOString().slice(0, 10)
        : 'Без даты';
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    const eventsTime = Object.entries(dateCount)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // Вставляем данные в базовый промт
    const fullPrompt = `${basePrompt}
Данные:
Статусы: ${JSON.stringify(statusDist)};
Классы напряжения: ${JSON.stringify(voltageDist)};
Типы: ${JSON.stringify(typeDist)};
Динамика: ${JSON.stringify(eventsTime)};`;
    console.log('Full AI prompt:', fullPrompt);

    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt }),
      });
      const data = await res.json();
      setAiAnalysis(data.text || 'Пустой ответ от AI.');
    } catch (e) {
      console.error('AI error:', e);
      setAiAnalysis('Ошибка при генерации AI-анализа.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ display: 'inline-block' }}
      >
        <Button type="primary" icon={<BulbOutlined />} onClick={() => setIsModalOpen(true)}>
          AI-Аналитика
        </Button>
      </motion.div>

      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" tip={<span style={{ fontSize: 18, fontWeight: 'bold' }}>Генерация AI-анализа...</span>} />
          </div>
        ) : aiAnalysis ? (
          <>
            <Alert type="info" message={aiAnalysis} />
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button onClick={() => setAiAnalysis('')}>
                Назад
              </Button>
            </div>
          </>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            {prompts.map(({ key, label, prompt }) => (
              <Button key={key} block onClick={() => handlePrompt(prompt)}>
                {label}
              </Button>
            ))}
          </Space>
        )}
      </Modal>
    </>
  );
}
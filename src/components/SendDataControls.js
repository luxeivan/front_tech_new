"use client";
import React, { useState } from "react";
import { Typography, Button, Space, message } from "antd";

const { Title, Text } = Typography;

/**
 * Блок «Отправка данных» для карточки инцидента
 *
 * @param {object}   props
 * @param {object}   props.incident       – объект инцидента
 * @param {Function} props.onSendTelegram – кол-бэк, который делает
 *                                         POST /api/telegram и
 *                                         PUT /api/incidents/:documentId
 *                                         (см. MainContent.js)
 */
export default function SendDataControls({ incident, onSendTelegram }) {
  const [sending, setSending] = useState(false);
  const [localSent, setLocalSent] = useState(!!incident.sent_to_telegram);

  const handleTelegram = async () => {
    if (localSent || sending) return; // уже отправили
    setSending(true);
    try {
      await onSendTelegram(incident); // ← один-единственный вызов
      setLocalSent(true); // локально блокируем кнопку
      message.success("Инцидент отправлен в Telegram");
    } catch (err) {
      console.error(err);
      message.error("Не удалось отправить в Telegram");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <Title level={5}>Отправка данных</Title>

      <Space direction="vertical" size={8}>
        <Button
          type="primary"
          disabled={localSent}
          loading={sending}
          onClick={handleTelegram}
          block
        >
          {localSent ? "Отправлено в Telegram" : "Отправить в Telegram"}
        </Button>

        <Button disabled block>
          Отправлено в АРМ ЕДДС
        </Button>
        <Button disabled block>
          Отправлено на сайт Мособлэнерго
        </Button>
        <Button disabled block>
          Отправлено на сайт Минэнерго
        </Button>
      </Space>
    </div>
  );
}

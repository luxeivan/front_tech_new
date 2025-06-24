"use client";
import React, { useState } from "react";
import { Button, Space, message } from "antd";

/**
 * Блок «Отправка данных» для карточки инцидента.
 *
 * @param {object}   props
 * @param {object}   props.incident        – объект-инцидент
 * @param {Function} props.onSendTelegram  – callback(incident) → Promise
 */
export default function SendDataControls({ incident, onSendTelegram }) {
  const [sending, setSending] = useState(false);

  const sendTelegram = async () => {
    setSending(true);
    try {
      await onSendTelegram(incident);
      message.success("Инцидент отправлен в Telegram");
    } catch {
      message.error("Не удалось отправить в Telegram");
    } finally {
      setSending(false);
    }
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Button
        block
        type="primary"
        ghost={!!incident.sent_to_telegram}
        disabled={!!incident.sent_to_telegram || sending}
        loading={sending}
        onClick={sendTelegram}
      >
        {incident.sent_to_telegram
          ? "Отправлено в Telegram"
          : "Отправить в Telegram"}
      </Button>

      <Button block disabled>
        Отправлено в АРМ ЕДДС
      </Button>
      <Button block disabled>
        Отправлено на сайт Мособлэнерго
      </Button>
      <Button block disabled>
        Отправлено на сайт Минэнерго
      </Button>
    </Space>
  );
}

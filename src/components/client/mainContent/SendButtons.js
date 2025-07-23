"use client";

import React, { useState } from "react";
import { Button, Space, Modal } from "antd";
import MinEnergoSender from "./MinEnergoSender";

// === ПОЛЯ ДЛЯ ДРУГИХ МОДАЛОК (заглушки) ===
const MOSENERGOSBYT_FIELDS = [];
const SITE_MINENERGO_FIELDS = [];
const SITE_MOSOBLENERGO_FIELDS = [];

export default function SendButtons({ tn, updateField }) {
  // Состояние открытия модалок для каждого направления
  const [openME, setOpenME] = useState(false);

  const stub = (dest) =>
    Modal.info({
      title: `Отправка в ${dest}`,
      content: "Скоро здесь будет доступна отправка данных.",
      okText: "Понятно",
    });

  return (
    <>
      <Space wrap>
        <Button type="primary" onClick={() => setOpenME(true)}>
          Отправить&nbsp;в&nbsp;МинЭнерго
        </Button>
        <Button
          style={{ background: "#722ED1", color: "#fff" }}
          onClick={() => stub("МосЭнергоСбыт")}
        >
          Отправить&nbsp;в&nbsp;МосЭнергоСбыт
        </Button>
        <Button type="dashed" onClick={() => stub("сайт МинЭнерго РФ")}>
          Отправить&nbsp;на&nbsp;сайт&nbsp;МинЭнерго&nbsp;РФ
        </Button>
        <Button
          style={{ background: "#FA8C16", color: "#fff" }}
          onClick={() => stub("сайт МосОблЭнерго")}
        >
          Отправить&nbsp;на&nbsp;сайт&nbsp;МосОблЭнерго
        </Button>
      </Space>
      {/* Модалка МинЭнерго */}
      <MinEnergoSender
        tn={tn}
        updateField={updateField}
        open={openME}
        onClose={() => setOpenME(false)}
      />
      {/* Заглушки под другие формы можешь вставлять тут потом */}
    </>
  );
}

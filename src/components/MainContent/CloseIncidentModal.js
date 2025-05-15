"use client";
import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  TimePicker,
  message,
  Button,
} from "antd";
import ru_RU from "antd/locale/ru_RU";

// import useAuthStore from "../../stores/authStore";
import { useSession } from "next-auth/react";

import { getRandomCloseIncidentFields } from "../../utils/magicFill";
import dayjs from "dayjs";

export default function CloseIncidentModal({
  visible,
  onCancel,
  incidentId,
  onSuccess,
}) {
  const [form] = Form.useForm();
  // const { token } = useAuthStore();

  const { data: session } = useSession();
  const token = session?.user?.jwt;

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        end_date: dayjs(),
        end_time: dayjs(),
        // Убрали DisruptionStats
      });
    }
  }, [visible, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      const end_date = values.end_date.format("YYYY-MM-DD");
      const end_time = values.end_time.format("HH:mm") + ":00.000";

      const closure_description = [
        {
          type: "paragraph",
          children: [{ type: "text", text: values.closure_description || "" }],
        },
      ];

      const payload = {
        data: {
          end_date,
          end_time,
          closure_description,
          status_incident: "выполнена",
        },
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/incidents/${incidentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`Ошибка при обновлении: ${response.status}`);
      }

      const result = await response.json();
      console.log("Ответ Strapi при закрытии ТН:", result);
      message.success("ТН переведена в статус 'Выполнена'!");
      onCancel();
      form.resetFields();
      onSuccess();
    } catch (err) {
      console.error("Ошибка закрытия ТН:", err);
      message.error("Не удалось перевести ТН в статус 'Выполнена'.");
    }
  };

  // "Заполнить" — без статистики, только дата/время/описание
  // const handleMagic = () => {
  //   const randomValues = getRandomCloseIncidentFields();
  //   // Удаляем любые поля DisruptionStats, если они есть
  //   delete randomValues.disruptionStats;
  //   form.setFieldsValue(randomValues);
  //   message.info("Заполнить сработало! Поля заполнены случайными значениями.");
  // };

  return (
    <Modal
      title="Закрыть ТН"
      open={visible}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      okText="Отправить"
      cancelText="Отмена"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="end_date"
          label="Дата окончания"
          rules={[{ required: true, message: "Укажите дату окончания" }]}
        >
          <DatePicker
            locale={ru_RU.DatePicker}
            format="DD.MM.YYYY"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          name="end_time"
          label="Время окончания"
          rules={[{ required: true, message: "Укажите время окончания" }]}
        >
          <TimePicker format="HH:mm" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="closure_description"
          label="Описание закрытия"
          rules={[{ required: true, message: "Укажите описание закрытия" }]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Что было сделано для устранения?"
          />
        </Form.Item>
      </Form>

      {/* <div style={{ textAlign: "right", marginTop: 10 }}>
        <Button onClick={handleMagic}>Заполнить</Button>
      </div> */}
    </Modal>
  );
}

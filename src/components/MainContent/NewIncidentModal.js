"use client";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  TimePicker,
  Select,
  message,
  Button,
  InputNumber,
  Typography,
  Descriptions,
  ConfigProvider,
} from "antd";

import ru_RU from "antd/locale/ru_RU";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/ru";
dayjs.locale("ru");
dayjs.extend(customParseFormat);

import useAuthStore from "@/stores/authStore";
import useNewIncidentStore from "@/stores/newIncidentStore";

const { Option } = Select;
const { Title } = Typography;

export default function NewIncidentModal({ visible, onCancel, form }) {
  // Если form передается извне, используем его; если нет – создаём новый
  const [localForm] = Form.useForm();
  const usedForm = form || localForm;

  const { token } = useAuthStore();
  const [cityDistricts, setCityDistricts] = useState([]);

  // Получаем функции из нового store
  const { fillFormWithMagic, sendMultipleIncidents } = useNewIncidentStore();

  // При открытии модалки грузим список городов и устанавливаем дефолтные поля
  useEffect(() => {
    const fetchCityDistricts = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/city-districts`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) {
          throw new Error(`Ошибка при загрузке городов: ${res.status}`);
        }
        const data = await res.json();
        setCityDistricts(data.data || []);
      } catch (err) {
        console.error("Ошибка загрузки city-districts:", err);
      }
    };

    if (visible) {
      fetchCityDistricts();
      usedForm.setFieldsValue({
        start_date: dayjs(),
        start_time: dayjs(),
        estimated_restoration_date: dayjs().add(1, "day"),
        estimated_restoration_time: dayjs().add(2, "hour"),
        disruptionStats: {
          affected_settlements: 0,
          affected_residents: 0,
          affected_mkd: 0,
          affected_hospitals: 0,
          affected_clinics: 0,
          affected_schools: 0,
          affected_kindergartens: 0,
          boiler_shutdown: 0,
        },
      });
    }
  }, [visible, usedForm, token]);

  const handleOk = async () => {
    try {
      const values = await usedForm.validateFields();

      // Форматирование дат/времени
      const start_date = values.start_date.format("YYYY-MM-DD");
      const start_time = values.start_time.format("HH:mm") + ":00.000";
      const est_date = values.estimated_restoration_date.format("YYYY-MM-DD");
      const est_time =
        values.estimated_restoration_time.format("HH:mm") + ":00.000";
      const estimated_restoration_time = dayjs(
        `${est_date}T${est_time}`
      ).toISOString();

      const ds = values.disruptionStats || {};
      const disruptionStats = {
        affected_settlements: ds.affected_settlements || 0,
        affected_residents: ds.affected_residents || 0,
        affected_mkd: ds.affected_mkd || 0,
        affected_hospitals: ds.affected_hospitals || 0,
        affected_clinics: ds.affected_clinics || 0,
        affected_schools: ds.affected_schools || 0,
        affected_kindergartens: ds.affected_kindergartens || 0,
        boiler_shutdown: ds.boiler_shutdown || 0,
      };

      const cityDistrictId = values.addressInfo?.city_district || null;
      const description = [
        {
          type: "paragraph",
          children: [{ type: "text", text: values.description }],
        },
      ];

      const payload = {
        data: {
          start_date,
          start_time,
          status_incident: "в работе",
          estimated_restoration_time,
          description,
          AddressInfo: {
            city_district: cityDistrictId,
            settlement_type: values.addressInfo?.settlement_type,
            streets: values.addressInfo?.streets,
            building_type: values.addressInfo?.building_type,
          },
          DisruptionStats: disruptionStats,
          sent_to_telegram: false,
          sent_to_arm_edds: false,
          sent_to_moenergo: false,
          sent_to_minenergo: false,
        },
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/incidents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`Ошибка при отправке данных: ${response.status}`);
      }

      const result = await response.json();
      console.log("Ответ Strapi:", result);
      message.success("ТН успешно создана!");
      onCancel();
      usedForm.resetFields();
    } catch (error) {
      console.error("Ошибка при создании ТН:", error);
      message.error("Ошибка при создании ТН!");
    }
  };

  // Отправка 1 инцидента через store
  const handleMagic = () => {
    fillFormWithMagic(usedForm, cityDistricts);
    message.info("Случайные данные заполнены!");
  };

  // Отправка 10 инцидентов через store
  const handleMagic10 = async () => {
    try {
      await sendMultipleIncidents(token, cityDistricts);
      message.success("10 ТН успешно созданы!");
      onCancel();
      usedForm.resetFields();
    } catch (error) {
      console.error("Ошибка при создании 10 ТН:", error);
      message.error("Ошибка при создании 10 ТН!");
    }
  };

  return (
    <ConfigProvider locale={ru_RU}>
      <Modal
        title="Создать новое ТН"
        open={visible}
        onOk={handleOk}
        onCancel={onCancel}
        okText="Отправить"
        cancelText="Отмена"
      >
        <Form form={usedForm} layout="vertical">
          <Form.Item
            name="start_date"
            label="Дата начала ТН"
            rules={[{ required: true, message: "Укажите дату начала ТН" }]}
          >
            <DatePicker
              locale={ru_RU.DatePicker || ru_RU}
              format="DD.MM.YYYY"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="start_time"
            label="Время начала ТН"
            rules={[{ required: true, message: "Укажите время начала ТН" }]}
          >
            <TimePicker
              locale={ru_RU.DatePicker || ru_RU}
              format="HH:mm"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="estimated_restoration_date"
            label="Прогноз восстановления (дата)"
            rules={[{ required: true, message: "Укажите дату восстановления" }]}
          >
            <DatePicker
              locale={ru_RU.DatePicker || ru_RU}
              format="DD.MM.YYYY"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="estimated_restoration_time"
            label="Прогноз восстановления (время)"
            rules={[
              { required: true, message: "Укажите время восстановления" },
            ]}
          >
            <TimePicker
              locale={ru_RU.DatePicker || ru_RU}
              format="HH:mm"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Описание ТН"
            rules={[{ required: true, message: "Укажите описание ТН" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Title level={5} style={{ marginTop: 20 }}>
            Адресная информация
          </Title>

          <Form.Item
            name={["addressInfo", "city_district"]}
            label="Населенный пункт"
            rules={[{ required: true, message: "Выберите город" }]}
          >
            <Select placeholder="Выберите населенный пункт">
              {cityDistricts.map((city) => (
                <Option key={city.id} value={city.documentId}>
                  {city.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name={["addressInfo", "settlement_type"]}
            label="Тип поселения"
            initialValue="городской"
            rules={[{ required: true, message: "Выберите тип поселения" }]}
          >
            <Select>
              <Option value="городской">городской</Option>
              <Option value="сельский">сельский</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name={["addressInfo", "streets"]}
            label="Отключенные улицы"
            rules={[{ required: true, message: "Укажите улицы" }]}
          >
            <Input placeholder="Введите улицы, разделённые запятыми" />
          </Form.Item>

          <Form.Item
            name={["addressInfo", "building_type"]}
            label="Тип застройки"
            initialValue="жилой сектор"
            rules={[{ required: true, message: "Выберите тип застройки" }]}
          >
            <Select>
              <Option value="жилой сектор">жилой сектор</Option>
              <Option value="частный сектор">частный сектор</Option>
              <Option value="СНТ">СНТ</Option>
              <Option value="промзона">промзона</Option>
              <Option value="СЗО">СЗО</Option>
            </Select>
          </Form.Item>

          <Descriptions
            bordered
            column={2}
            size="small"
            title="Статистика отключения"
          >
            <Descriptions.Item label="Отключено населенных пунктов">
              <Form.Item
                name={["disruptionStats", "affected_settlements"]}
                initialValue={0}
                style={{ marginBottom: 0 }}
              >
                <InputNumber min={0} max={999999} />
              </Form.Item>
            </Descriptions.Item>

            <Descriptions.Item label="Отключено жителей">
              <Form.Item
                name={["disruptionStats", "affected_residents"]}
                initialValue={0}
                style={{ marginBottom: 0 }}
              >
                <InputNumber min={0} max={999999} />
              </Form.Item>
            </Descriptions.Item>

            <Descriptions.Item label="Отключено МКД">
              <Form.Item
                name={["disruptionStats", "affected_mkd"]}
                initialValue={0}
                style={{ marginBottom: 0 }}
              >
                <InputNumber min={0} max={999999} />
              </Form.Item>
            </Descriptions.Item>

            <Descriptions.Item label="Отключено больниц">
              <Form.Item
                name={["disruptionStats", "affected_hospitals"]}
                initialValue={0}
                style={{ marginBottom: 0 }}
              >
                <InputNumber min={0} max={999999} />
              </Form.Item>
            </Descriptions.Item>

            <Descriptions.Item label="Отключено поликлиник">
              <Form.Item
                name={["disruptionStats", "affected_clinics"]}
                initialValue={0}
                style={{ marginBottom: 0 }}
              >
                <InputNumber min={0} max={999999} />
              </Form.Item>
            </Descriptions.Item>

            <Descriptions.Item label="Отключено школ">
              <Form.Item
                name={["disruptionStats", "affected_schools"]}
                initialValue={0}
                style={{ marginBottom: 0 }}
              >
                <InputNumber min={0} max={999999} />
              </Form.Item>
            </Descriptions.Item>

            <Descriptions.Item label="Отключено детсадов">
              <Form.Item
                name={["disruptionStats", "affected_kindergartens"]}
                initialValue={0}
                style={{ marginBottom: 0 }}
              >
                <InputNumber min={0} max={999999} />
              </Form.Item>
            </Descriptions.Item>

            <Descriptions.Item label="Отключено бойлерных/котельн">
              <Form.Item
                name={["disruptionStats", "boiler_shutdown"]}
                initialValue={0}
                style={{ marginBottom: 0 }}
              >
                <InputNumber min={0} max={999999} />
              </Form.Item>
            </Descriptions.Item>
          </Descriptions>
        </Form>

        <div style={{ textAlign: "right", marginTop: 10 }}>
          <Button onClick={handleMagic}>Заполнить</Button>
          <Button onClick={handleMagic10} style={{ marginLeft: 8 }}>
            Заполнить 10
          </Button>
        </div>
      </Modal>
    </ConfigProvider>
  );
}

// "use client";
// import React, { useEffect, useState } from "react";
// import {
//   Modal,
//   Form,
//   Input,
//   DatePicker,
//   TimePicker,
//   Select,
//   message,
//   Button,
//   InputNumber,
//   Typography,
//   Descriptions,
//   ConfigProvider,
// } from "antd";

// // Русская локаль для antd
// import ru_RU from "antd/locale/ru_RU";

// // Подключаем Day.js + плагины
// import dayjs from "dayjs";
// import customParseFormat from "dayjs/plugin/customParseFormat";
// import "dayjs/locale/ru";
// dayjs.locale("ru");
// dayjs.extend(customParseFormat);

// import useAuthStore from "@/stores/authStore";
// import { getRandomNewIncidentFields } from "@/utils/magicFill";

// const { Option } = Select;
// const { Title } = Typography;

// export default function NewIncidentModal({ visible, onCancel }) {
//   const [form] = Form.useForm();
//   const { token } = useAuthStore();

//   // Список городов (CityDistrict)
//   const [cityDistricts, setCityDistricts] = useState([]);

//   // При открытии модалки грузим список городов и ставим дефолтные поля
//   useEffect(() => {
//     const fetchCityDistricts = async () => {
//       try {
//         const res = await fetch(
//           `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/city-districts`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         if (!res.ok) {
//           throw new Error(`Ошибка при загрузке городов: ${res.status}`);
//         }
//         const data = await res.json();

//         setCityDistricts(data.data || []);
//       } catch (err) {
//         console.error("Ошибка загрузки city-districts:", err);
//       }
//     };

//     if (visible) {
//       fetchCityDistricts();

//       // Устанавливаем поля по умолчанию (Day.js)
//       form.setFieldsValue({
//         start_date: dayjs(), // Текущий день
//         start_time: dayjs(), // Текущее время
//         estimated_restoration_date: dayjs().add(1, "day"),
//         estimated_restoration_time: dayjs().add(2, "hour"),
//         disruptionStats: {
//           affected_settlements: 0,
//           affected_residents: 0,
//           affected_mkd: 0,
//           affected_hospitals: 0,
//           affected_clinics: 0,
//           affected_schools: 0,
//           affected_kindergartens: 0,
//           boiler_shutdown: 0,
//         },
//       });
//     }
//   }, [visible, form, token]);

//   const handleOk = async () => {
//     try {
//       const values = await form.validateFields();

//       // Дата/время начала
//       // Форматируем под нужный бэкенд: "YYYY-MM-DD" и "HH:mm:00.000"
//       const start_date = values.start_date.format("YYYY-MM-DD");
//       const start_time = values.start_time.format("HH:mm") + ":00.000";

//       // Прогноз восстановления
//       const est_date = values.estimated_restoration_date.format("YYYY-MM-DD");
//       const est_time =
//         values.estimated_restoration_time.format("HH:mm") + ":00.000";
//       const estimated_restoration_time = dayjs(
//         `${est_date}T${est_time}`
//       ).toISOString();

//       // DisruptionStats
//       const ds = values.disruptionStats || {};
//       const disruptionStats = {
//         affected_settlements: ds.affected_settlements || 0,
//         affected_residents: ds.affected_residents || 0,
//         affected_mkd: ds.affected_mkd || 0,
//         affected_hospitals: ds.affected_hospitals || 0,
//         affected_clinics: ds.affected_clinics || 0,
//         affected_schools: ds.affected_schools || 0,
//         affected_kindergartens: ds.affected_kindergartens || 0,
//         boiler_shutdown: ds.boiler_shutdown || 0,
//       };

//       const cityDistrictId = values.addressInfo?.city_district || null;

//       // Превращаем обычную строку в RichText-массив
//       const description = [
//         {
//           type: "paragraph",
//           children: [{ type: "text", text: values.description }],
//         },
//       ];

//       const payload = {
//         data: {
//           start_date,
//           start_time,
//           status_incident: "в работе",
//           estimated_restoration_time,
//           description,
//           AddressInfo: {
//             city_district: cityDistrictId,
//             settlement_type: values.addressInfo?.settlement_type,
//             streets: values.addressInfo?.streets,
//             building_type: values.addressInfo?.building_type,
//           },
//           DisruptionStats: disruptionStats,
//           sent_to_telegram: false,
//           sent_to_arm_edds: false,
//           sent_to_moenergo: false,
//           sent_to_minenergo: false,
//         },
//       };

//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/incidents`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!response.ok) {
//         throw new Error(`Ошибка при отправке данных: ${response.status}`);
//       }

//       const result = await response.json();
//       console.log("Ответ Strapi:", result);
//       message.success("ТН успешно создана!");
//       onCancel();
//       form.resetFields();
//     } catch (error) {
//       console.error("Ошибка при создании ТН:", error);
//       message.error("Ошибка при создании ТН!");
//     }
//   };

//   const handleMagic = () => {
//     // Сначала получаем рандомные значения (дата, время, статистика и т.п.) - функция magicFill должна вернуть их в нужном виде
//     const randomValues = getRandomNewIncidentFields();

//     // Если нет disruptionStats в рандоме, добавим дефолты
//     if (!randomValues.disruptionStats) {
//       randomValues.disruptionStats = {
//         affected_settlements: 0,
//         affected_residents: 0,
//         affected_mkd: 0,
//         affected_hospitals: 0,
//         affected_clinics: 0,
//         affected_schools: 0,
//         affected_kindergartens: 0,
//         boiler_shutdown: 0,
//       };
//     }

//     // Если в randomValues есть start_date (как строка), переводим в Day.js
//     if (randomValues.start_date) {
//       randomValues.start_date = dayjs(randomValues.start_date, "YYYY-MM-DD");
//     } else {
//       randomValues.start_date = dayjs();
//     }
//     if (randomValues.start_time) {
//       randomValues.start_time = dayjs(randomValues.start_time, "HH:mm:ss.SSS");
//     } else {
//       randomValues.start_time = dayjs();
//     }

//     if (randomValues.estimated_restoration_date) {
//       randomValues.estimated_restoration_date = dayjs(
//         randomValues.estimated_restoration_date,
//         "YYYY-MM-DD"
//       );
//     } else {
//       randomValues.estimated_restoration_date = dayjs().add(1, "day");
//     }
//     if (randomValues.estimated_restoration_time) {
//       randomValues.estimated_restoration_time = dayjs(
//         randomValues.estimated_restoration_time,
//         "HH:mm:ss.SSS"
//       );
//     } else {
//       randomValues.estimated_restoration_time = dayjs().add(2, "hour");
//     }

//     // Если у нас есть список городов, подставим случайный
//     if (cityDistricts.length > 0) {
//       const randomIndex = Math.floor(Math.random() * cityDistricts.length);
//       const randomCity = cityDistricts[randomIndex];
//       // Подставляем реальный documentId города
//       if (!randomValues.addressInfo) {
//         randomValues.addressInfo = {};
//       }
//       randomValues.addressInfo.city_district = randomCity.documentId;
//     }

//     form.setFieldsValue(randomValues);
//     message.info("Случайные данные заполнены!");
//   };

//   return (
//     <ConfigProvider locale={ru_RU}>
//       <Modal
//         title="Создать новое ТН"
//         open={visible}
//         onOk={handleOk}
//         onCancel={onCancel}
//         okText="Отправить"
//         cancelText="Отмена"
//       >
//         <Form form={form} layout="vertical">
//           {/* Дата и время начала */}
//           <Form.Item
//             name="start_date"
//             label="Дата начала ТН"
//             rules={[{ required: true, message: "Укажите дату начала ТН" }]}
//           >
//             <DatePicker
//               locale={ru_RU.DatePicker || ru_RU}
//               format="DD.MM.YYYY"
//               style={{ width: "100%" }}
//             />
//           </Form.Item>

//           <Form.Item
//             name="start_time"
//             label="Время начала ТН"
//             rules={[{ required: true, message: "Укажите время начала ТН" }]}
//           >
//             <TimePicker
//               locale={ru_RU.DatePicker || ru_RU}
//               format="HH:mm"
//               style={{ width: "100%" }}
//             />
//           </Form.Item>

//           {/* Прогноз восстановления */}
//           <Form.Item
//             name="estimated_restoration_date"
//             label="Прогноз восстановления (дата)"
//             rules={[{ required: true, message: "Укажите дату восстановления" }]}
//           >
//             <DatePicker
//               locale={ru_RU.DatePicker || ru_RU}
//               format="DD.MM.YYYY"
//               style={{ width: "100%" }}
//             />
//           </Form.Item>

//           <Form.Item
//             name="estimated_restoration_time"
//             label="Прогноз восстановления (время)"
//             rules={[
//               { required: true, message: "Укажите время восстановления" },
//             ]}
//           >
//             <TimePicker
//               locale={ru_RU.DatePicker || ru_RU}
//               format="HH:mm"
//               style={{ width: "100%" }}
//             />
//           </Form.Item>

//           {/* Описание ТН */}
//           <Form.Item
//             name="description"
//             label="Описание ТН"
//             rules={[{ required: true, message: "Укажите описание ТН" }]}
//           >
//             <Input.TextArea rows={3} />
//           </Form.Item>

//           <Title level={5} style={{ marginTop: 20 }}>
//             Адресная информация
//           </Title>

//           <Form.Item
//             name={["addressInfo", "city_district"]}
//             label="Населенный пункт"
//             rules={[{ required: true, message: "Выберите город" }]}
//           >
//             <Select placeholder="Выберите населенный пункт">
//               {cityDistricts.map((city) => (
//                 <Option key={city.id} value={city.documentId}>
//                   {city.name}
//                 </Option>
//               ))}
//             </Select>
//           </Form.Item>

//           <Form.Item
//             name={["addressInfo", "settlement_type"]}
//             label="Тип поселения"
//             initialValue="городской"
//             rules={[{ required: true, message: "Выберите тип поселения" }]}
//           >
//             <Select>
//               <Option value="городской">городской</Option>
//               <Option value="сельский">сельский</Option>
//             </Select>
//           </Form.Item>

//           <Form.Item
//             name={["addressInfo", "streets"]}
//             label="Отключенные улицы"
//             rules={[{ required: true, message: "Укажите улицы" }]}
//           >
//             <Input placeholder="Введите улицы, разделённые запятыми" />
//           </Form.Item>

//           <Form.Item
//             name={["addressInfo", "building_type"]}
//             label="Тип застройки"
//             initialValue="жилой сектор"
//             rules={[{ required: true, message: "Выберите тип застройки" }]}
//           >
//             <Select>
//               <Option value="жилой сектор">жилой сектор</Option>
//               <Option value="частный сектор">частный сектор</Option>
//               <Option value="СНТ">СНТ</Option>
//               <Option value="промзона">промзона</Option>
//               <Option value="СЗО">СЗО</Option>
//             </Select>
//           </Form.Item>

//           <Descriptions
//             bordered
//             column={2}
//             size="small"
//             title="Статистика отключения"
//           >
//             <Descriptions.Item label="Отключено населенных пунктов">
//               <Form.Item
//                 name={["disruptionStats", "affected_settlements"]}
//                 initialValue={0}
//                 style={{ marginBottom: 0 }}
//               >
//                 <InputNumber
//                   min={0}
//                   max={999999}
//                   onKeyDown={(e) => {
//                     // Запрещаем ввод букв
//                     if (
//                       !/^\d$/.test(e.key) &&
//                       ![
//                         "Backspace",
//                         "Delete",
//                         "ArrowLeft",
//                         "ArrowRight",
//                         "Tab",
//                       ].includes(e.key)
//                     ) {
//                       e.preventDefault();
//                     }
//                   }}
//                 />
//               </Form.Item>
//             </Descriptions.Item>

//             <Descriptions.Item label="Отключено жителей">
//               <Form.Item
//                 name={["disruptionStats", "affected_residents"]}
//                 initialValue={0}
//                 style={{ marginBottom: 0 }}
//               >
//                 <InputNumber
//                   min={0}
//                   max={999999}
//                   onKeyDown={(e) => {
//                     if (
//                       !/^\d$/.test(e.key) &&
//                       ![
//                         "Backspace",
//                         "Delete",
//                         "ArrowLeft",
//                         "ArrowRight",
//                         "Tab",
//                       ].includes(e.key)
//                     ) {
//                       e.preventDefault();
//                     }
//                   }}
//                 />
//               </Form.Item>
//             </Descriptions.Item>

//             <Descriptions.Item label="Отключено МКД">
//               <Form.Item
//                 name={["disruptionStats", "affected_mkd"]}
//                 initialValue={0}
//                 style={{ marginBottom: 0 }}
//               >
//                 <InputNumber
//                   min={0}
//                   max={999999}
//                   onKeyDown={(e) => {
//                     if (
//                       !/^\d$/.test(e.key) &&
//                       ![
//                         "Backspace",
//                         "Delete",
//                         "ArrowLeft",
//                         "ArrowRight",
//                         "Tab",
//                       ].includes(e.key)
//                     ) {
//                       e.preventDefault();
//                     }
//                   }}
//                 />
//               </Form.Item>
//             </Descriptions.Item>

//             <Descriptions.Item label="Отключено больниц">
//               <Form.Item
//                 name={["disruptionStats", "affected_hospitals"]}
//                 initialValue={0}
//                 style={{ marginBottom: 0 }}
//               >
//                 <InputNumber
//                   min={0}
//                   max={999999}
//                   onKeyDown={(e) => {
//                     if (
//                       !/^\d$/.test(e.key) &&
//                       ![
//                         "Backspace",
//                         "Delete",
//                         "ArrowLeft",
//                         "ArrowRight",
//                         "Tab",
//                       ].includes(e.key)
//                     ) {
//                       e.preventDefault();
//                     }
//                   }}
//                 />
//               </Form.Item>
//             </Descriptions.Item>

//             <Descriptions.Item label="Отключено поликлиник">
//               <Form.Item
//                 name={["disruptionStats", "affected_clinics"]}
//                 initialValue={0}
//                 style={{ marginBottom: 0 }}
//               >
//                 <InputNumber
//                   min={0}
//                   max={999999}
//                   onKeyDown={(e) => {
//                     if (
//                       !/^\d$/.test(e.key) &&
//                       ![
//                         "Backspace",
//                         "Delete",
//                         "ArrowLeft",
//                         "ArrowRight",
//                         "Tab",
//                       ].includes(e.key)
//                     ) {
//                       e.preventDefault();
//                     }
//                   }}
//                 />
//               </Form.Item>
//             </Descriptions.Item>

//             <Descriptions.Item label="Отключено школ">
//               <Form.Item
//                 name={["disruptionStats", "affected_schools"]}
//                 initialValue={0}
//                 style={{ marginBottom: 0 }}
//               >
//                 <InputNumber
//                   min={0}
//                   max={999999}
//                   onKeyDown={(e) => {
//                     if (
//                       !/^\d$/.test(e.key) &&
//                       ![
//                         "Backspace",
//                         "Delete",
//                         "ArrowLeft",
//                         "ArrowRight",
//                         "Tab",
//                       ].includes(e.key)
//                     ) {
//                       e.preventDefault();
//                     }
//                   }}
//                 />
//               </Form.Item>
//             </Descriptions.Item>

//             <Descriptions.Item label="Отключено детсадов">
//               <Form.Item
//                 name={["disruptionStats", "affected_kindergartens"]}
//                 initialValue={0}
//                 style={{ marginBottom: 0 }}
//               >
//                 <InputNumber
//                   min={0}
//                   max={999999}
//                   onKeyDown={(e) => {
//                     if (
//                       !/^\d$/.test(e.key) &&
//                       ![
//                         "Backspace",
//                         "Delete",
//                         "ArrowLeft",
//                         "ArrowRight",
//                         "Tab",
//                       ].includes(e.key)
//                     ) {
//                       e.preventDefault();
//                     }
//                   }}
//                 />
//               </Form.Item>
//             </Descriptions.Item>

//             <Descriptions.Item label="Отключено бойлерных/котельн">
//               <Form.Item
//                 name={["disruptionStats", "boiler_shutdown"]}
//                 initialValue={0}
//                 style={{ marginBottom: 0 }}
//               >
//                 <InputNumber
//                   min={0}
//                   max={999999}
//                   onKeyDown={(e) => {
//                     if (
//                       !/^\d$/.test(e.key) &&
//                       ![
//                         "Backspace",
//                         "Delete",
//                         "ArrowLeft",
//                         "ArrowRight",
//                         "Tab",
//                       ].includes(e.key)
//                     ) {
//                       e.preventDefault();
//                     }
//                   }}
//                 />
//               </Form.Item>
//             </Descriptions.Item>
//           </Descriptions>
//         </Form>

//         <div style={{ textAlign: "right", marginTop: 10 }}>
//           <Button onClick={handleMagic}>Заполнить</Button>
//         </div>
//       </Modal>
//     </ConfigProvider>
//   );
// }

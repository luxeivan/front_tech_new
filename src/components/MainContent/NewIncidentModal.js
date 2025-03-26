"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  TimePicker,
  message,
  Button,
  InputNumber,
  Typography,
  Descriptions,
  ConfigProvider,
  Select,
  AutoComplete,
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

/**
 * Функция для получения подсказок с нашего прокси /api/dadata.
 * Принимает: query, mode (address|street) и, для улиц, city_fias_id.
 */
async function fetchDadataSuggestions(
  query,
  mode = "address",
  city_fias_id = null
) {
  if (!query) return [];
  let url = `/api/dadata?query=${encodeURIComponent(query)}&mode=${mode}`;
  if (mode === "street" && city_fias_id) {
    url += `&city_fias_id=${encodeURIComponent(city_fias_id)}`;
  }
  const res = await fetch(url);
  const json = await res.json();
  if (json.status === "ok") {
    return json.data;
  } else {
    console.error("Ошибка при запросе /api/dadata:", json);
    return [];
  }
}

export default function NewIncidentModal({ visible, onCancel, form }) {
  const [localForm] = Form.useForm();
  const usedForm = form || localForm;

  const { token } = useAuthStore();
  const { fillFormWithMagic, sendMultipleIncidents } = useNewIncidentStore();

  // Состояния для автокомплита населённого пункта
  const [citySearch, setCitySearch] = useState("");
  const [cityOptions, setCityOptions] = useState([]);

  // Состояния для автокомплита улицы
  const [streetSearch, setStreetSearch] = useState("");
  const [streetOptions, setStreetOptions] = useState([]);

  // При открытии модалки сбрасываем поля формы и стейты автокомплита
  useEffect(() => {
    if (visible) {
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
        addressInfo: {
          settlement_type: "городской",
          building_type: "жилой сектор",
          city_name: "",
          city_fias_id: "",
          street_name: "",
        },
      });
      setCitySearch("");
      setCityOptions([]);
      setStreetSearch("");
      setStreetOptions([]);
    }
  }, [visible, usedForm]);

  // Обработка ввода для поля "Населенный пункт"
  const handleCitySearch = useCallback(async (value) => {
    setCitySearch(value);
    if (value.length < 2) {
      setCityOptions([]);
      return;
    }
    try {
      const suggestions = await fetchDadataSuggestions(value, "address");
      const options = suggestions.map((item) => ({
        value: item.value,
        label: item.value,
        fias: item.data.city_fias_id || item.data.fias_id,
        city: item.data.city,
      }));
      setCityOptions(options);
    } catch (error) {
      console.error("Ошибка в handleCitySearch:", error);
      setCityOptions([]);
    }
  }, []);

  // При выборе населённого пункта сохраняем данные в форму и сбрасываем улицу
  const handleCitySelect = (selectedValue, option) => {
    usedForm.setFieldValue(["addressInfo", "city_name"], selectedValue);
    usedForm.setFieldValue(["addressInfo", "city_fias_id"], option.fias || "");
    setCitySearch(selectedValue);
    usedForm.setFieldValue(["addressInfo", "street_name"], "");
    setStreetSearch("");
    setStreetOptions([]);
  };

  // Обработка ввода для поля "Улица"
  const handleStreetSearch = useCallback(
    async (value) => {
      setStreetSearch(value);
      if (value.length < 2) {
        setStreetOptions([]);
        return;
      }
      // Получаем выбранный город (фиаc id) из формы
      const cityFias = usedForm.getFieldValue(["addressInfo", "city_fias_id"]);
      try {
        const suggestions = await fetchDadataSuggestions(
          value,
          "street",
          cityFias
        );
        const options = suggestions.map((item) => ({
          value: item.value,
          label: item.value,
        }));
        setStreetOptions(options);
      } catch (error) {
        console.error("Ошибка в handleStreetSearch:", error);
        setStreetOptions([]);
      }
    },
    [usedForm]
  );

  // При выборе улицы сохраняем выбранное значение в форму
  const handleStreetSelect = (selectedValue) => {
    usedForm.setFieldValue(["addressInfo", "street_name"], selectedValue);
    setStreetSearch(selectedValue);
  };

  // Отправка формы
  const handleOk = async () => {
    try {
      const values = await usedForm.validateFields();

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

      const addressInfo = {
        city_fias_id: values.addressInfo?.city_fias_id || "",
        city_name: values.addressInfo?.city_name || "",
        settlement_type: values.addressInfo?.settlement_type,
        building_type: values.addressInfo?.building_type,
        street_name: values.addressInfo?.street_name || "",
      };

      const description = [
        {
          type: "paragraph",
          children: [{ type: "text", text: values.description || "" }],
        },
      ];

      const payload = {
        data: {
          start_date,
          start_time,
          status_incident: "в работе",
          estimated_restoration_time,
          description,
          AddressInfo: addressInfo,
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

  const handleMagic = () => {
    fillFormWithMagic(usedForm);
    message.info("Случайные данные заполнены!");
  };

  const handleMagic10 = async () => {
    try {
      await sendMultipleIncidents(token);
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
            label="Населенный пункт"
            name={["addressInfo", "city_name"]}
            rules={[{ required: true, message: "Укажите населенный пункт" }]}
          >
            <AutoComplete
              value={citySearch}
              onSearch={handleCitySearch}
              onSelect={handleCitySelect}
              options={cityOptions}
              placeholder="Начните вводить город Московской области"
              allowClear
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item name={["addressInfo", "city_fias_id"]} hidden>
            <Input />
          </Form.Item>
          <Form.Item
            label="Улица (при необходимости)"
            name={["addressInfo", "street_name"]}
          >
            <AutoComplete
              value={streetSearch}
              onSearch={handleStreetSearch}
              onSelect={handleStreetSelect}
              options={streetOptions}
              placeholder="Начните вводить улицу"
              allowClear
              style={{ width: "100%" }}
            />
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
// import React, { useEffect, useState, useCallback } from "react";
// import {
//   Modal,
//   Form,
//   Input,
//   DatePicker,
//   TimePicker,
//   message,
//   Button,
//   InputNumber,
//   Typography,
//   Descriptions,
//   ConfigProvider,
//   Select,
//   AutoComplete,
// } from "antd";
// import ru_RU from "antd/locale/ru_RU";
// import dayjs from "dayjs";
// import customParseFormat from "dayjs/plugin/customParseFormat";
// import "dayjs/locale/ru";
// dayjs.locale("ru");
// dayjs.extend(customParseFormat);

// import useAuthStore from "@/stores/authStore";
// import useNewIncidentStore from "@/stores/newIncidentStore";

// const { Option } = Select;
// const { Title } = Typography;

// /**
//  * Функция для получения подсказок с нашего прокси /api/dadata
//  * @param {string} query - поисковый запрос
//  * @returns {Promise<Array>} массив подсказок DaData
//  */
// async function fetchDadataSuggestions(query) {
//   if (!query) return [];
//   const res = await fetch(`/api/dadata?query=${encodeURIComponent(query)}`);
//   const json = await res.json();
//   if (json.status === "ok") {
//     return json.data; // массив { value, data: {...} }
//   } else {
//     console.error("Ошибка при запросе /api/dadata:", json);
//     return [];
//   }
// }

// export default function NewIncidentModal({ visible, onCancel, form }) {
//   // ======== antd Form ========
//   const [localForm] = Form.useForm();
//   const usedForm = form || localForm;

//   // ======== zustand store ========
//   const { token } = useAuthStore();
//   const { fillFormWithMagic, sendMultipleIncidents } = useNewIncidentStore();

//   // ======== Локальные стейты для автокомплита ========
//   const [citySearch, setCitySearch] = useState(""); // то, что пользователь ввёл
//   const [cityOptions, setCityOptions] = useState([]); // подсказки (options для AutoComplete)

//   // При открытии модалки сбрасываем поля
//   useEffect(() => {
//     if (visible) {
//       usedForm.setFieldsValue({
//         start_date: dayjs(),
//         start_time: dayjs(),
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
//         addressInfo: {
//           settlement_type: "городской",
//           building_type: "жилой сектор",
//           city_name: "", // начальное значение
//           city_fias_id: "",
//           street_name: "",
//         },
//       });
//       // Сбрасываем локальный input
//       setCitySearch("");
//       setCityOptions([]);
//     }
//   }, [visible, usedForm]);

//   /**
//    * Обработка ввода в поле "Населенный пункт"
//    * @param {string} value - введённый текст
//    */
//   const handleCitySearch = useCallback(async (value) => {
//     setCitySearch(value);
//     if (value.length < 2) {
//       // Если мало символов, не шлём запрос
//       setCityOptions([]);
//       return;
//     }
//     try {
//       const suggestions = await fetchDadataSuggestions(value);
//       // Превращаем suggestions в формат [{value: '...', label: '...'}, ...]
//       const options = suggestions.map((item) => ({
//         // Для AutoComplete значение = item.value
//         value: item.value,
//         label: item.value,
//         // Сохраним объект data, чтобы потом достать fias
//         fias: item.data.city_fias_id || item.data.fias_id,
//         city: item.data.city, // может быть undefined, тогда item.value
//       }));
//       setCityOptions(options);
//     } catch (error) {
//       console.error("Ошибка в handleCitySearch:", error);
//       setCityOptions([]);
//     }
//   }, []);

//   /**
//    * Обработка выбора пункта из выпадающего списка
//    * @param {string} selectedValue - то, что выбрали
//    * @param {object} option - объект с value, label, fias, city
//    */
//   const handleCitySelect = (selectedValue, option) => {
//     // Обновим форму: city_name и city_fias_id
//     usedForm.setFieldValue(["addressInfo", "city_name"], selectedValue);
//     usedForm.setFieldValue(["addressInfo", "city_fias_id"], option.fias || "");
//     // Сохраним выбранное значение в state
//     setCitySearch(selectedValue);
//   };

//   // ======== Нажатие на "ОК" (Отправить) ========
//   const handleOk = async () => {
//     try {
//       const values = await usedForm.validateFields();

//       // Форматирование дат/времени
//       const start_date = values.start_date.format("YYYY-MM-DD");
//       const start_time = values.start_time.format("HH:mm") + ":00.000";
//       const est_date = values.estimated_restoration_date.format("YYYY-MM-DD");
//       const est_time =
//         values.estimated_restoration_time.format("HH:mm") + ":00.000";
//       const estimated_restoration_time = dayjs(
//         `${est_date}T${est_time}`
//       ).toISOString();

//       // Статистика отключения
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

//       // Адресная информация
//       const addressInfo = {
//         city_fias_id: values.addressInfo?.city_fias_id || "",
//         city_name: values.addressInfo?.city_name || "",
//         settlement_type: values.addressInfo?.settlement_type,
//         building_type: values.addressInfo?.building_type,
//         street_name: values.addressInfo?.street_name || "",
//       };

//       // Описание (rich text для Strapi)
//       const description = [
//         {
//           type: "paragraph",
//           children: [{ type: "text", text: values.description || "" }],
//         },
//       ];

//       const payload = {
//         data: {
//           start_date,
//           start_time,
//           status_incident: "в работе",
//           estimated_restoration_time,
//           description,
//           AddressInfo: addressInfo,
//           DisruptionStats: disruptionStats,
//           sent_to_telegram: false,
//           sent_to_arm_edds: false,
//           sent_to_moenergo: false,
//           sent_to_minenergo: false,
//         },
//       };

//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/incidents`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify(payload),
//         }
//       );

//       if (!response.ok) {
//         throw new Error(`Ошибка при отправке данных: ${response.status}`);
//       }

//       const result = await response.json();
//       console.log("Ответ Strapi:", result);
//       message.success("ТН успешно создана!");
//       onCancel();
//       usedForm.resetFields();
//     } catch (error) {
//       console.error("Ошибка при создании ТН:", error);
//       message.error("Ошибка при создании ТН!");
//     }
//   };

//   // ======== «Заполнить» (магия) ========
//   const handleMagic = () => {
//     fillFormWithMagic(usedForm);
//     message.info("Случайные данные заполнены!");
//   };

//   // ======== «Заполнить 10» ========
//   const handleMagic10 = async () => {
//     try {
//       await sendMultipleIncidents(token);
//       message.success("10 ТН успешно созданы!");
//       onCancel();
//       usedForm.resetFields();
//     } catch (error) {
//       console.error("Ошибка при создании 10 ТН:", error);
//       message.error("Ошибка при создании 10 ТН!");
//     }
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
//         <Form form={usedForm} layout="vertical">
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

//           {/* Поле "Населенный пункт" с автокомплитом */}
//           <Form.Item
//             label="Населенный пункт"
//             name={["addressInfo", "city_name"]}
//             rules={[{ required: true, message: "Укажите населенный пункт" }]}
//           >
//             <AutoComplete
//               value={citySearch}
//               onSearch={handleCitySearch}
//               onSelect={handleCitySelect}
//               options={cityOptions}
//               placeholder="Начните вводить город Московской области"
//               allowClear
//               style={{ width: "100%" }}
//             />
//           </Form.Item>

//           {/* Скрытое поле для city_fias_id */}
//           <Form.Item name={["addressInfo", "city_fias_id"]} hidden>
//             <Input />
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
//             name={["addressInfo", "street_name"]}
//             label="Улица (при необходимости)"
//           >
//             <Input placeholder="Введите улицу или несколько улиц" />
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
//                 <InputNumber min={0} max={999999} />
//               </Form.Item>
//             </Descriptions.Item>

//             <Descriptions.Item label="Отключено жителей">
//               <Form.Item
//                 name={["disruptionStats", "affected_residents"]}
//                 initialValue={0}
//                 style={{ marginBottom: 0 }}
//               >
//                 <InputNumber min={0} max={999999} />
//               </Form.Item>
//             </Descriptions.Item>

//             <Descriptions.Item label="Отключено МКД">
//               <Form.Item
//                 name={["disruptionStats", "affected_mkd"]}
//                 initialValue={0}
//                 style={{ marginBottom: 0 }}
//               >
//                 <InputNumber min={0} max={999999} />
//               </Form.Item>
//             </Descriptions.Item>

//             <Descriptions.Item label="Отключено больниц">
//               <Form.Item
//                 name={["disruptionStats", "affected_hospitals"]}
//                 initialValue={0}
//                 style={{ marginBottom: 0 }}
//               >
//                 <InputNumber min={0} max={999999} />
//               </Form.Item>
//             </Descriptions.Item>

//             <Descriptions.Item label="Отключено поликлиник">
//               <Form.Item
//                 name={["disruptionStats", "affected_clinics"]}
//                 initialValue={0}
//                 style={{ marginBottom: 0 }}
//               >
//                 <InputNumber min={0} max={999999} />
//               </Form.Item>
//             </Descriptions.Item>

//             <Descriptions.Item label="Отключено школ">
//               <Form.Item
//                 name={["disruptionStats", "affected_schools"]}
//                 initialValue={0}
//                 style={{ marginBottom: 0 }}
//               >
//                 <InputNumber min={0} max={999999} />
//               </Form.Item>
//             </Descriptions.Item>

//             <Descriptions.Item label="Отключено детсадов">
//               <Form.Item
//                 name={["disruptionStats", "affected_kindergartens"]}
//                 initialValue={0}
//                 style={{ marginBottom: 0 }}
//               >
//                 <InputNumber min={0} max={999999} />
//               </Form.Item>
//             </Descriptions.Item>

//             <Descriptions.Item label="Отключено бойлерных/котельн">
//               <Form.Item
//                 name={["disruptionStats", "boiler_shutdown"]}
//                 initialValue={0}
//                 style={{ marginBottom: 0 }}
//               >
//                 <InputNumber min={0} max={999999} />
//               </Form.Item>
//             </Descriptions.Item>
//           </Descriptions>
//         </Form>

//         <div style={{ textAlign: "right", marginTop: 10 }}>
//           <Button onClick={handleMagic}>Заполнить</Button>
//           <Button onClick={handleMagic10} style={{ marginLeft: 8 }}>
//             Заполнить 10
//           </Button>
//         </div>
//       </Modal>
//     </ConfigProvider>
//   );
// }

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

// import useAuthStore from "@/stores/authStore";

import { useSession } from "next-auth/react";

function makeShortCityLabel(item) {
  const { city, settlement, area } = item.data;
  return city || settlement || area || item.value;
}
function makeShortStreetLabel(item) {
  const { street, settlement } = item.data;
  if (settlement && street) return `${settlement}, ${street}`;
  return street || item.value;
}
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
  }
  console.error("Ошибка при запросе /api/dadata:", json);
  return [];
}

const { Option } = Select;
const { Title } = Typography;

export default function NewIncidentModal({ visible, onCancel, form }) {
  const [localForm] = Form.useForm();
  const { data: session } = useSession();
  const token = session?.user?.jwt;
  // const token = useAuthStore((s) => s.token);
  const usedForm = form || localForm;
  const [citySearch, setCitySearch] = useState("");
  const [cityOptions, setCityOptions] = useState([]);
  const [streetsOptionsMap, setStreetsOptionsMap] = useState({});

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
          Street: [],
        },
      });
      setCitySearch("");
      setCityOptions([]);
      setStreetsOptionsMap({});
    }
  }, [visible, usedForm]);

  const handleCitySearch = useCallback(async (value) => {
    setCitySearch(value);
    if (value.length < 2) {
      setCityOptions([]);
      return;
    }
    try {
      const suggestions = await fetchDadataSuggestions(value, "address");

      const seen = new Set();
      const options = suggestions.reduce((acc, item, idx) => {
        const fias = item.data.city_fias_id || item.data.fias_id || item.value;
        if (seen.has(fias)) return acc;
        seen.add(fias);

        acc.push({
          label: makeShortCityLabel(item),
          value: fias,
          key: fias,
        });
        return acc;
      }, []);

      setCityOptions(options);
    } catch (error) {
      console.error("Ошибка handleCitySearch:", error);
      setCityOptions([]);
    }
  }, []);

  const handleCitySelect = (value, option) => {
    // value = fias, option.label = короткое название
    usedForm.setFieldValue(["addressInfo", "city_name"], option.label);
    usedForm.setFieldValue(["addressInfo", "city_fias_id"], value);
    setCitySearch(option.label);
    // Сбрасываем список улиц
    usedForm.setFieldValue(["addressInfo", "Street"], []);
    setStreetsOptionsMap({});
  };

  const handleStreetSearch = async (val, fieldIndex) => {
    const cityFias = usedForm.getFieldValue(["addressInfo", "city_fias_id"]);
    if (!val || val.length < 2) {
      setStreetsOptionsMap((prev) => ({ ...prev, [fieldIndex]: [] }));
      return;
    }
    try {
      const suggestions = await fetchDadataSuggestions(val, "street", cityFias);
      const opts = suggestions.map((item) => {
        const fias = item.data.street_fias_id || item.data.fias_id;
        const shortLabel = makeShortStreetLabel(item);
        return {
          label: shortLabel,
          value: fias || shortLabel,
        };
      });
      setStreetsOptionsMap((prev) => ({ ...prev, [fieldIndex]: opts }));
    } catch (error) {
      console.error("Ошибка handleStreetSearch:", error);
      setStreetsOptionsMap((prev) => ({ ...prev, [fieldIndex]: [] }));
    }
  };

  const handleStreetSelect = (value, option, fieldIndex) => {
    usedForm.setFieldValue(
      ["addressInfo", "Street", fieldIndex, "street_name"],
      option.label
    );
    usedForm.setFieldValue(
      ["addressInfo", "Street", fieldIndex, "street_fias_id"],
      value
    );
  };

  const handleOk = async () => {
    try {
      if (!token) {
        message.error("Сначала войдите в систему");
        return;
      }

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
        Street: values.addressInfo?.Street || [],
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

      console.log("payload:", payload);

      console.log("JWT", token);
      console.log("URL", process.env.NEXT_PUBLIC_STRAPI_URL);

      console.log("Headers", {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });

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
      console.log("Status", response.status);
      if (!response.ok) {
        console.log("Response text", await response.text());
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
            <DatePicker format="DD.MM.YYYY" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="start_time"
            label="Время начала ТН"
            rules={[{ required: true, message: "Укажите время начала ТН" }]}
          >
            <TimePicker format="HH:mm" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="estimated_restoration_date"
            label="Прогноз восстановления (дата)"
            rules={[{ required: true, message: "Укажите дату восстановления" }]}
          >
            <DatePicker format="DD.MM.YYYY" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="estimated_restoration_time"
            label="Прогноз восстановления (время)"
            rules={[
              { required: true, message: "Укажите время восстановления" },
            ]}
          >
            <TimePicker format="HH:mm" style={{ width: "100%" }} />
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

          {/* Населенный пункт */}
          <Form.Item
            label="Населенный пункт"
            name={["addressInfo", "city_name"]}
            rules={[{ required: true, message: "Укажите населенный пункт" }]}
          >
            <AutoComplete
              optionLabelProp="label"
              placeholder="Начните вводить город Московской области"
              value={citySearch}
              onSearch={handleCitySearch}
              onSelect={handleCitySelect}
              options={cityOptions}
              allowClear
              style={{ width: "100%" }}
            />
          </Form.Item>

          {/* Скрытое поле для city_fias_id */}
          <Form.Item name={["addressInfo", "city_fias_id"]} hidden>
            <Input />
          </Form.Item>

          {/* Список улиц (динамический) */}
          <Form.List name={["addressInfo", "Street"]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Form.Item
                    key={key}
                    label="Улица"
                    required
                    style={{ marginBottom: 0 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "baseline",
                      }}
                    >
                      <Form.Item
                        {...restField}
                        name={[name, "street_name"]}
                        style={{ marginBottom: 0, flex: 1 }}
                        noStyle
                      >
                        <AutoComplete
                          optionLabelProp="label"
                          placeholder="Введите улицу"
                          onSearch={(val) => handleStreetSearch(val, index)}
                          onSelect={(val, opt) =>
                            handleStreetSelect(val, opt, index)
                          }
                          options={streetsOptionsMap[index] || []}
                          allowClear
                        />
                      </Form.Item>

                      <Form.Item name={[name, "street_fias_id"]} hidden>
                        <Input />
                      </Form.Item>

                      <Button danger onClick={() => remove(name)}>
                        Удалить
                      </Button>
                    </div>
                  </Form.Item>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  style={{ marginTop: 8 }}
                >
                  + Добавить улицу
                </Button>
              </>
            )}
          </Form.List>

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

// function makeShortCityLabel(item) {
//   const { city, settlement, area } = item.data;
//   return city || settlement || area || item.value;
// }
// function makeShortStreetLabel(item) {
//   const { street, settlement } = item.data;
//   if (settlement && street) return `${settlement}, ${street}`;
//   return street || item.value;
// }

// // Запрос к нашему прокси /api/dadata
// async function fetchDadataSuggestions(
//   query,
//   mode = "address",
//   city_fias_id = null
// ) {
//   if (!query) return [];
//   let url = `/api/dadata?query=${encodeURIComponent(query)}&mode=${mode}`;
//   if (mode === "street" && city_fias_id) {
//     url += `&city_fias_id=${encodeURIComponent(city_fias_id)}`;
//   }
//   const res = await fetch(url);
//   const json = await res.json();
//   if (json.status === "ok") {
//     return json.data;
//   }
//   console.error("Ошибка при запросе /api/dadata:", json);
//   return [];
// }

// const { Option } = Select;
// const { Title } = Typography;

// export default function NewIncidentModal({ visible, onCancel, form }) {
//   const [localForm] = Form.useForm();
//   const usedForm = form || localForm;

//   const { token } = useAuthStore();
//   const { fillFormWithMagic, sendMultipleIncidents } = useNewIncidentStore();

//   // Автокомплит город
//   const [citySearch, setCitySearch] = useState("");
//   const [cityOptions, setCityOptions] = useState([]);

//   // Список улиц (Form.List)
//   const [streetsOptionsMap, setStreetsOptionsMap] = useState({});

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
//           city_name: "",
//           city_fias_id: "",
//           Street: [],
//         },
//       });
//       setCitySearch("");
//       setCityOptions([]);
//       setStreetsOptionsMap({});
//     }
//   }, [visible, usedForm]);

//   // ====== Город ======
//   const handleCitySearch = useCallback(async (value) => {
//     setCitySearch(value);
//     if (value.length < 2) {
//       setCityOptions([]);
//       return;
//     }
//     try {
//       const suggestions = await fetchDadataSuggestions(value, "address");
//       // Уникальный fias => value, короткий => label
//       const options = suggestions.map((item) => {
//         const fias = item.data.city_fias_id || item.data.fias_id;
//         const shortLabel = makeShortCityLabel(item);
//         return {
//           label: shortLabel, // Показываем это в списке
//           value: fias || shortLabel, // Гарантированно уникально
//           shortLabel,
//         };
//       });
//       setCityOptions(options);
//     } catch (error) {
//       console.error("Ошибка handleCitySearch:", error);
//       setCityOptions([]);
//     }
//   }, []);

//   const handleCitySelect = (value, option) => {
//     // value = fias, option.label = короткое название
//     usedForm.setFieldValue(["addressInfo", "city_name"], option.label);
//     usedForm.setFieldValue(["addressInfo", "city_fias_id"], value);
//     setCitySearch(option.label);
//     // Сбрасываем список улиц
//     usedForm.setFieldValue(["addressInfo", "Street"], []);
//     setStreetsOptionsMap({});
//   };

//   // ====== Улицы ======
//   const handleStreetSearch = async (val, fieldIndex) => {
//     const cityFias = usedForm.getFieldValue(["addressInfo", "city_fias_id"]);
//     if (!val || val.length < 2) {
//       setStreetsOptionsMap((prev) => ({ ...prev, [fieldIndex]: [] }));
//       return;
//     }
//     try {
//       const suggestions = await fetchDadataSuggestions(val, "street", cityFias);
//       const opts = suggestions.map((item) => {
//         const fias = item.data.street_fias_id || item.data.fias_id;
//         const shortLabel = makeShortStreetLabel(item);
//         return {
//           label: shortLabel,
//           value: fias || shortLabel, // Уникально
//         };
//       });
//       setStreetsOptionsMap((prev) => ({ ...prev, [fieldIndex]: opts }));
//     } catch (error) {
//       console.error("Ошибка handleStreetSearch:", error);
//       setStreetsOptionsMap((prev) => ({ ...prev, [fieldIndex]: [] }));
//     }
//   };

//   const handleStreetSelect = (value, option, fieldIndex) => {
//     usedForm.setFieldValue(
//       ["addressInfo", "Street", fieldIndex, "street_name"],
//       option.label
//     );
//     usedForm.setFieldValue(
//       ["addressInfo", "Street", fieldIndex, "street_fias_id"],
//       value
//     );
//   };

//   // ====== Сабмит ======
//   const handleOk = async () => {
//     try {
//       const values = await usedForm.validateFields();

//       const start_date = values.start_date.format("YYYY-MM-DD");
//       const start_time = values.start_time.format("HH:mm") + ":00.000";
//       const est_date = values.estimated_restoration_date.format("YYYY-MM-DD");
//       const est_time =
//         values.estimated_restoration_time.format("HH:mm") + ":00.000";
//       const estimated_restoration_time = dayjs(
//         `${est_date}T${est_time}`
//       ).toISOString();

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

//       const addressInfo = {
//         city_fias_id: values.addressInfo?.city_fias_id || "",
//         city_name: values.addressInfo?.city_name || "",
//         settlement_type: values.addressInfo?.settlement_type,
//         building_type: values.addressInfo?.building_type,
//         Street: values.addressInfo?.Street || [],
//       };

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

//       console.log("payload:", payload);

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

//   const handleMagic = () => {
//     fillFormWithMagic(usedForm);
//     message.info("Случайные данные заполнены!");
//   };

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
//             <DatePicker format="DD.MM.YYYY" style={{ width: "100%" }} />
//           </Form.Item>

//           <Form.Item
//             name="start_time"
//             label="Время начала ТН"
//             rules={[{ required: true, message: "Укажите время начала ТН" }]}
//           >
//             <TimePicker format="HH:mm" style={{ width: "100%" }} />
//           </Form.Item>

//           <Form.Item
//             name="estimated_restoration_date"
//             label="Прогноз восстановления (дата)"
//             rules={[{ required: true, message: "Укажите дату восстановления" }]}
//           >
//             <DatePicker format="DD.MM.YYYY" style={{ width: "100%" }} />
//           </Form.Item>

//           <Form.Item
//             name="estimated_restoration_time"
//             label="Прогноз восстановления (время)"
//             rules={[
//               { required: true, message: "Укажите время восстановления" },
//             ]}
//           >
//             <TimePicker format="HH:mm" style={{ width: "100%" }} />
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

//           {/* Населенный пункт */}
//           <Form.Item
//             label="Населенный пункт"
//             name={["addressInfo", "city_name"]}
//             rules={[{ required: true, message: "Укажите населенный пункт" }]}
//           >
//             <AutoComplete
//               optionLabelProp="label" // важно!
//               placeholder="Начните вводить город Московской области"
//               value={citySearch}
//               onSearch={handleCitySearch}
//               onSelect={handleCitySelect}
//               options={cityOptions}
//               allowClear
//               style={{ width: "100%" }}
//             />
//           </Form.Item>

//           {/* Скрытое поле для city_fias_id */}
//           <Form.Item name={["addressInfo", "city_fias_id"]} hidden>
//             <Input />
//           </Form.Item>

//           {/* Список улиц (динамический) */}
//           <Form.List name={["addressInfo", "Street"]}>
//             {(fields, { add, remove }) => (
//               <>
//                 {fields.map(({ key, name, ...restField }, index) => (
//                   <Form.Item
//                     key={key}
//                     label="Улица"
//                     required
//                     style={{ marginBottom: 0 }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         gap: 10,
//                         alignItems: "baseline",
//                       }}
//                     >
//                       <Form.Item
//                         {...restField}
//                         name={[name, "street_name"]}
//                         style={{ marginBottom: 0, flex: 1 }}
//                         noStyle
//                       >
//                         <AutoComplete
//                           optionLabelProp="label"
//                           placeholder="Введите улицу"
//                           onSearch={(val) => handleStreetSearch(val, index)}
//                           onSelect={(val, opt) =>
//                             handleStreetSelect(val, opt, index)
//                           }
//                           options={streetsOptionsMap[index] || []}
//                           allowClear
//                         />
//                       </Form.Item>

//                       <Form.Item name={[name, "street_fias_id"]} hidden>
//                         <Input />
//                       </Form.Item>

//                       <Button danger onClick={() => remove(name)}>
//                         Удалить
//                       </Button>
//                     </div>
//                   </Form.Item>
//                 ))}
//                 <Button
//                   type="dashed"
//                   onClick={() => add()}
//                   block
//                   style={{ marginTop: 8 }}
//                 >
//                   + Добавить улицу
//                 </Button>
//               </>
//             )}
//           </Form.List>

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

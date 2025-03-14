"use client";

import { create } from "zustand";
import dayjs from "dayjs";
import { getRandomNewIncidentFields } from "@/utils/magicFill";

const useNewIncidentStore = create((set, get) => ({
  // Функция для заполнения формы случайными данными
  fillFormWithMagic: (form, cityDistricts) => {
    let randomValues = getRandomNewIncidentFields();

    // Если нет данных о статистике – задаём дефолтные значения
    if (!randomValues.disruptionStats) {
      randomValues.disruptionStats = {
        affected_settlements: 0,
        affected_residents: 0,
        affected_mkd: 0,
        affected_hospitals: 0,
        affected_clinics: 0,
        affected_schools: 0,
        affected_kindergartens: 0,
        boiler_shutdown: 0,
      };
    }
    // Приводим даты к объектам dayjs
    randomValues.start_date = randomValues.start_date
      ? dayjs(randomValues.start_date, "YYYY-MM-DD")
      : dayjs();
    randomValues.start_time = randomValues.start_time
      ? dayjs(randomValues.start_time, "HH:mm:ss.SSS")
      : dayjs();
    randomValues.estimated_restoration_date =
      randomValues.estimated_restoration_date
        ? dayjs(randomValues.estimated_restoration_date, "YYYY-MM-DD")
        : dayjs().add(1, "day");
    randomValues.estimated_restoration_time =
      randomValues.estimated_restoration_time
        ? dayjs(randomValues.estimated_restoration_time, "HH:mm:ss.SSS")
        : dayjs().add(2, "hour");

    // Если список городов есть, выбираем случайный валидный ID
    if (cityDistricts && cityDistricts.length > 0) {
      const randomIndex = Math.floor(Math.random() * cityDistricts.length);
      const randomCity = cityDistricts[randomIndex];
      randomValues.addressInfo = randomValues.addressInfo || {};
      randomValues.addressInfo.city_district = randomCity.documentId;
    }

    form.setFieldsValue(randomValues);
  },

  // Функция для массовой отправки 10 инцидентов
  sendMultipleIncidents: async (token, cityDistricts) => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      let values = getRandomNewIncidentFields();
      // Обновляем дату начала на сегодняшний день
      values.start_date = dayjs().startOf("day");
      values.start_time = dayjs();

      // Если список городов есть, выбираем случайный валидный ID
      if (cityDistricts && cityDistricts.length > 0) {
        const randomIndex = Math.floor(Math.random() * cityDistricts.length);
        const randomCity = cityDistricts[randomIndex];
        values.addressInfo = values.addressInfo || {};
        values.addressInfo.city_district = randomCity.documentId;
      }

      // Форматируем даты и время
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

      console.log(`Payload для инцидента ${i + 1}:`, payload);

      promises.push(
        fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/incidents`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }).then(async (res) => {
          if (!res.ok) {
            const errorText = await res.text();
            console.error(`Ошибка для инцидента ${i + 1}:`, errorText);
          }
          return res;
        })
      );
    }
    const responses = await Promise.all(promises);
    const errors = responses.filter((res) => !res.ok);
    if (errors.length > 0) {
      throw new Error(
        `Ошибка при отправке данных для ${errors.length} инцидентов`
      );
    }
  },
}));

export default useNewIncidentStore;

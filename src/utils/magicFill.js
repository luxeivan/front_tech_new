import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Список улиц (100 штук)
const streetNames = Array.from({ length: 100 }, (_, i) => `Улица ${i + 1}`);

// Перемешивание массива (Fisher-Yates)
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomBetween(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

//Функция, выбирающая случайное количество улиц (1..10) из массива,
function getRandomStreets() {
  const count = randomBetween(1, 10);
  const shuffled = shuffleArray(streetNames);
  return shuffled.slice(0, count).join(", ");
}

// Причины аварии
const randomCauses = [
  "Ворона села на провода.",
  "Сильный ветер сорвал провода.",
  "Обрыв линии из-за грозы.",
  "Поваленное дерево оборвало провода.",
  "Оборудование перегрелось и отключилось.",
  "Птица на трансформаторе вызвала короткое замыкание.",
  "Неисправный кабель привёл к аварийному отключению.",
  "Временный сбой оборудования на подстанции.",
  "Перегрузка сети вызвала отключение.",
  "Сбой системы автоматического восстановления питания.",
];

// Причины устранения (для закрытия ТН, если понадобится)
const randomFixes = [
  "Заменили повреждённый кабель, система запущена.",
  "Бригада всё починила, все довольны!",
  "Произведён аварийный ремонт, инцидент закрыт.",
  "Провода заизолированы, подача электроэнергии восстановлена.",
  "Сбой устранён путём замены трансформатора.",
  "Произвели срочный ремонт после дождя.",
  "Кабель просушен, подстанция перезапущена.",
  "Замена проводов и перезапуск сети успешно завершены.",
  "Дополнили оборудование защитой от птиц и перезапустили систему.",
  "Линия восстановлена, проверка проведена – всё ок!",
];

// Типы поселений
const settlementTypes = ["городской", "сельский"];
// Типы застройки
const buildingTypes = [
  "жилой сектор",
  "частный сектор",
  "СНТ",
  "промзона",
  "СЗО",
];

/**
 * Пример фиктивных ID городов.
 * В вашем коде вы берёте реальные ID (documentId) из запроса city-districts.
 * Но для случайных значений используем такой массив.
 */
const mockCityIds = [
  "ps44eajtjgumlhl96rfd7gyd",
  "hdxljaw89ytwq4q9o5mf8d30",
  "jjo9xy8rnmu5geg8d0su1nis",
];

//Генерирует случайные поля для формы "Новый ТН"
export function getRandomNewIncidentFields() {
  // Случайно выбираем, на сколько дней назад была дата начала (0..1)
  const daysAgo = randomBetween(0, 1);
  // Формируем start_date как день X дней назад
  const startDateDayjs = dayjs().subtract(daysAgo, "day").startOf("day");

  // Случайное время (часы, минуты)
  const startHour = randomBetween(0, 23);
  const startMin = randomBetween(0, 59);

  const fullStartDayjs = startDateDayjs
    .hour(startHour)
    .minute(startMin)
    .second(0);

  // Прогноз восстановления: +1..3 дня от startDate
  const extraDays = randomBetween(1, 3);
  const restDateDayjs = fullStartDayjs.add(extraDays, "day");

  const restHour = randomBetween(0, 23);
  const restMin = randomBetween(0, 59);
  const fullRestDayjs = restDateDayjs.hour(restHour).minute(restMin).second(0);

  // Случайное описание
  const desc = randomCauses[randomBetween(0, randomCauses.length - 1)];

  // Случайный ID города
  const randomCityId = mockCityIds[randomBetween(0, mockCityIds.length - 1)];

  // Случайная статистика
  const randomStats = {
    affected_settlements: randomBetween(0, 1000),
    affected_residents: randomBetween(0, 1000),
    affected_mkd: randomBetween(0, 1000),
    affected_hospitals: randomBetween(0, 1000),
    affected_clinics: randomBetween(0, 1000),
    affected_schools: randomBetween(0, 1000),
    affected_kindergartens: randomBetween(0, 1000),
    boiler_shutdown: randomBetween(0, 1000),
  };

  return {
    start_date: fullStartDayjs.clone().startOf("day"),
    start_time: fullStartDayjs.clone(),
    estimated_restoration_date: fullRestDayjs.clone().startOf("day"),
    estimated_restoration_time: fullRestDayjs.clone(),
    status_incident: "в работе",
    description: desc,
    addressInfo: {
      city_district: randomCityId,
      settlement_type:
        settlementTypes[randomBetween(0, settlementTypes.length - 1)],
      streets: getRandomStreets(),
      building_type: buildingTypes[randomBetween(0, buildingTypes.length - 1)],
    },
    disruptionStats: randomStats,
  };
}

// Генерирует случайные поля для формы "Закрыть ТН" (dayjs).
export function getRandomCloseIncidentFields() {
  // Дата окончания: от сегодня до 2 дней назад
  const daysAgo = randomBetween(0, 2);
  const endDateDayjs = dayjs().subtract(daysAgo, "day").startOf("day");

  const endHour = randomBetween(0, 23);
  const endMin = randomBetween(0, 59);

  const fullEndDayjs = endDateDayjs.hour(endHour).minute(endMin).second(0);

  // Случайное описание закрытия
  const desc = randomFixes[randomBetween(0, randomFixes.length - 1)];

  return {
    end_date: fullEndDayjs.clone().startOf("day"),
    end_time: fullEndDayjs.clone(),
    closure_description: desc,
  };
}

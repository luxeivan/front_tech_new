import dayjs from "dayjs";

// Достаём .value из объекта поля, либо возвращаем примитив
export const val = (obj) =>
  typeof obj === "object" && obj !== null && "value" in obj ? obj.value : obj;

export const isIsoDate = (s) =>
  typeof s === "string" && /\d{4}-\d{2}-\d{2}T/.test(s);

export const formatDate = (d) =>
  d ? dayjs(d).format("DD.MM.YYYY HH:mm:ss") : "—";

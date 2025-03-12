import { create } from "zustand";

export const useIncidentsUtilsStore = create(() => ({

  extractText: (richText) => {
    if (!richText || !Array.isArray(richText)) return "Нет данных";
    return richText
      .map((block) => block?.children?.map((child) => child.text).join(" "))
      .join("\n");
  },
  formatTime: (timeStr) => {
    if (!timeStr) return "";
    const parts = timeStr.split(":");
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : timeStr;
  },
  formatDate: (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : dateStr;
  },
  formatDateTime: (dateTimeStr) => {
    if (!dateTimeStr) return "";
    const dateObj = new Date(dateTimeStr);
    const dd = String(dateObj.getUTCDate()).padStart(2, "0");
    const mm = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
    const yyyy = dateObj.getUTCFullYear();
    const hh = String(dateObj.getUTCHours()).padStart(2, "0");
    const min = String(dateObj.getUTCMinutes()).padStart(2, "0");
    return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
  },
  getPanelHeader: (incident) => {
    // Используем локальные функции форматирования:
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const parts = dateStr.split("-");
      return parts.length === 3
        ? `${parts[2]}.${parts[1]}.${parts[0]}`
        : dateStr;
    };
    const formatTime = (timeStr) => {
      if (!timeStr) return "";
      const parts = timeStr.split(":");
      return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : timeStr;
    };

    if (incident.status_incident?.trim() === "выполнена") {
      return `ТН №${incident.id} ${formatDate(
        incident.start_date
      )} ${formatTime(incident.start_time)} - ${formatDate(
        incident.end_date
      )} ${formatTime(incident.end_time)}`;
    }
    return `ТН №${incident.id} ${formatDate(incident.start_date)} ${formatTime(
      incident.start_time
    )}`;
  },
  
}));

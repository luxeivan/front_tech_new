// Скрываемые поля в развороте строки
export const HIDDEN_FIELDS = new Set([
  "documentId",
  "updatedAt",
  "createdAt",
  "publishedAt",
  "id",
  "SBYT_NOTIFICATION",
  "SBYT_NOTIFICATION_STR",
  "guid",
  "OBJECTNAMEKEY",
  "SWITCHNAMEKEY",
  "VIOLATION_GUID_STR",
]);

// Человекочитаемые статусы
export const STATUS_OPEN = "открыта";
export const STATUS_POWERED = "запитана";
export const STATUS_CLOSED = "закрыта";

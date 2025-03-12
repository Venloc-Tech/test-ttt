const options: Intl.DateTimeFormatOptions = {
  timeZone: "Europe/Moscow",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

export const dateFormatter = new Intl.DateTimeFormat("ru-RU", options)
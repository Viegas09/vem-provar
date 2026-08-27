export const WEEKDAYS = [
  { key: 0, label: "Domingo", short: "Dom" },
  { key: 1, label: "Segunda", short: "Seg" },
  { key: 2, label: "Terça", short: "Ter" },
  { key: 3, label: "Quarta", short: "Qua" },
  { key: 4, label: "Quinta", short: "Qui" },
  { key: 5, label: "Sexta", short: "Sex" },
  { key: 6, label: "Sábado", short: "Sáb" },
];

export function defaultBusinessHours() {
  return WEEKDAYS.map((d) => ({ day: d.key, closed: false, open: "11:00", close: "22:00" }));
}

function minutesOf(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// aberto agora = não pausado manualmente E (sem horário configurado, ou dentro do horário de hoje)
export function isRestaurantOpenNow(restaurant) {
  if (restaurant.is_open === false) return false;
  const hours = restaurant.business_hours;
  if (!hours || !Array.isArray(hours) || hours.length === 0) return true;
  const now = new Date();
  const today = hours.find((d) => d.day === now.getDay());
  if (!today || today.closed) return false;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= minutesOf(today.open) && nowMinutes <= minutesOf(today.close);
}

const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const TZ = 'Europe/Vienna';

/** Uhrzeit HH:MM in Europe/Vienna */
export function timeOf(iso: string) {
  return new Intl.DateTimeFormat('de-AT', { hour: '2-digit', minute: '2-digit', timeZone: TZ }).format(new Date(iso));
}

export function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function dayParts(day: string) {
  const d = new Date(`${day}T12:00:00Z`);
  return { weekday: WD[d.getUTCDay()], dayNum: d.getUTCDate(), month: d.getUTCMonth() + 1 };
}

export function shortDate(iso: string) {
  const day = iso.slice(0, 10);
  const p = dayParts(day);
  return `${p.weekday} ${String(p.dayNum).padStart(2, '0')}.${String(p.month).padStart(2, '0')}`;
}

export function relDay(day: string, today: string) {
  if (day === today) return 'Heute';
  if (day === addDays(today, 1)) return 'Morgen';
  if (day === addDays(today, -1)) return 'Gestern';
  return shortDate(day);
}

export function countdown(iso: string, nowMs: number) {
  let s = Math.max(0, Math.floor((Date.parse(iso) - nowMs) / 1000));
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s -= m * 60;
  return [h, m, s].map((x) => String(x).padStart(2, '0')).join(':');
}

export const fmtNum = (n: number) => n.toLocaleString('de-DE');

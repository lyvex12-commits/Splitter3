const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar date as a stable YYYY-MM-DD storage key (no timezone surprises). */
export const toKey = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromKey = (k: string): Date => {
  // Defensive: a malformed/undefined key (e.g. leftover data from an older
  // schema) should never crash the app — fall back to today rather than
  // calling .split on undefined.
  if (typeof k !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(k)) {
    console.warn(`fromKey: invalid date key "${k}", falling back to today`);
    return startOfDay(new Date());
  }
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const addDays = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

export const dayNamesShort = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
export const monthShort = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];
export const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const startOfMonth = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), 1);
export const addMonths = (d: Date, n: number): Date => new Date(d.getFullYear(), d.getMonth() + n, 1);
export const daysInMonth = (d: Date): number => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

/** "Sep 27" — compact, title-case day label for lists (not the relative "2 days ago" style). */
export function formatShortDate(d: Date): string {
  const m = monthShort[d.getMonth()];
  return `${m.charAt(0)}${m.slice(1).toLowerCase()} ${d.getDate()}`;
}

/** Monday of the calendar week containing d (Mon → Sun weeks, per spec). */
export function getMonday(d: Date): Date {
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  return startOfDay(addDays(d, diff));
}

export function formatLongDate(d: Date): string {
  const today = startOfDay(new Date());
  const dd = startOfDay(d);
  const diffDays = Math.round((dd.getTime() - today.getTime()) / 86400000);
  const weekday = dd.toLocaleDateString(undefined, { weekday: "long" });
  const md = `${monthShort[dd.getMonth()]} ${dd.getDate()}`;
  if (diffDays === 0) return `Today · ${md}`;
  if (diffDays === -1) return `Yesterday · ${md}`;
  if (diffDays === 1) return `Tomorrow · ${md}`;
  return `${weekday}, ${md}`;
}

export function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const startStr = `${monthShort[monday.getMonth()]} ${monday.getDate()}`;
  const endStr = sameMonth
    ? `${sunday.getDate()}`
    : `${monthShort[sunday.getMonth()]} ${sunday.getDate()}`;
  return `${startStr} – ${endStr}`;
}

export function daysAgoLabel(dateKey: string | null): string {
  if (!dateKey) return "Never logged";
  const diff = Math.round((startOfDay(new Date()).getTime() - fromKey(dateKey).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
}

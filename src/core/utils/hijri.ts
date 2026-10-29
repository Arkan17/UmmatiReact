// Tabular (Kuwaiti) Hijri conversion. It can differ from local moon-sighting by ±1 day,
// so users can apply an adjustment in settings via `offsetDays`.

export const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani", 'Jumada al-Ula', 'Jumada al-Akhirah',
  'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah',
];

export interface HijriDate { day: number; month: number; year: number; monthName: string }

export function toHijri(date = new Date(), offsetDays = 0): HijriDate {
  const d = new Date(date);
  d.setDate(d.getDate() + offsetDays);

  // Gregorian → Julian Day Number
  let y = d.getFullYear();
  let m = d.getMonth() + 1;
  const day = d.getDate();
  if (m < 3) { y -= 1; m += 12; }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;

  // Julian Day → Islamic (civil epoch)
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719)
    + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
    - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l3) / 709);
  const hDay = l3 - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;

  return { day: hDay, month, year, monthName: HIJRI_MONTHS[month - 1] };
}

export const formatHijri = (h: HijriDate) => `${h.day} ${h.monthName} ${h.year} AH`;

export const isRamadan = (h: HijriDate) => h.month === 9;
/** White days (Ayyam al-Bid) — recommended fasting on the 13th–15th */
export const isWhiteDay = (h: HijriDate) => h.day >= 13 && h.day <= 15;

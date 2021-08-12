// TODO: This starts the week on Mondays (by adding one to the `setDate` call),
// but our calendar and availability select both start the week on Sundays.
export function sameWeek(a: Date, b: Date): boolean {
  const awk = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bwk = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  awk.setDate(awk.getDate() - awk.getDay() + 1);
  bwk.setDate(bwk.getDate() - bwk.getDay() + 1);
  return awk.valueOf() === bwk.valueOf();
}

export function toFixed(num: number, fixed: number): string {
  const regex = new RegExp(`^-?\\d+(?:.\\d{0,${fixed}})?`);
  const match = regex.exec(num.toString());
  return match ? match[0] : num.toFixed(fixed);
}

export function formatRate(num: number, fixed: number = 2): string {
  return num > 0
    ? `+${toFixed(num * 100, fixed)}%`
    : `${toFixed(num * 100, fixed)}%`;
}

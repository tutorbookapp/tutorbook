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

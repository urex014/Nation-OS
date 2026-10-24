export const number = (value, digits = 1) =>
  value == null
    ? "Not reported"
    : Number(value).toLocaleString("en-NG", { maximumFractionDigits: digits });
export function naira(value) {
  if (value == null) return "Not reported";
  const absolute = Math.abs(value);
  if (absolute >= 1e12) return `₦${number(value / 1e12, 2)}tn`;
  if (absolute >= 1e9) return `₦${number(value / 1e9, 2)}bn`;
  if (absolute >= 1e6) return `₦${number(value / 1e6, 2)}m`;
  return `₦${number(value, 2)}`;
}
export function indicatorValue(record) {
  if (!record || record.value == null) return "Not reported";
  if (record.unit === "people") return `${number(record.value / 1e6, 1)}m`;
  if (record.unit === "current US$") return `US$${number(record.value / 1e9, 1)}bn`;
  return `${number(record.value, 2)}${record.unit.includes("%") ? "%" : ""}`;
}

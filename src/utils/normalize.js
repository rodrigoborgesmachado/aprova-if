export const normalizeEmail = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();
export const validEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
export const formatDate = (value) =>
  value && !Number.isNaN(new Date(value).getTime())
    ? new Date(value).toLocaleDateString("pt-BR")
    : "Não informada";
export const safeUrl = (value) => {
  try {
    const u = new URL(value);
    return ["https:", "http:"].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
};
export function attachmentUrls(value) {
  const items = Array.isArray(value) ? value : value ? [value] : [];
  return items
    .map((a) => safeUrl(typeof a === "string" ? a : a?.link || a?.anexo))
    .filter(Boolean);
}

// Story of Us — helper utils (slug, phone, email, order code)

export function slugify(input: string): string {
  const map: Record<string, string> = {
    ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i", ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
  };
  return input
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidSlug(s: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) && s.length >= 2 && s.length <= 60;
}

export function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

export function isValidTrPhone(v: string): boolean {
  const digits = v.replace(/\s+/g, "");
  return /^(?:\+?90)?5\d{9}$|^0?5\d{9}$/.test(digits);
}

export function generateOrderCode(existingCount = 0, date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const seq = String(existingCount + 1).padStart(3, "0");
  return `STORY-${y}${m}${d}-${seq}`;
}

export function formatTL(v: number): string {
  return `${v.toLocaleString("tr-TR")} TL`;
}

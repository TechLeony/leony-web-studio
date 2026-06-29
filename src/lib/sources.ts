// Lead source → user-friendly label + badge tone.

export type LeadSource =
  | "main_contact_form"
  | "custom_category_form"
  | "package_cta"
  | "floating_assistant"
  | string
  | null;

export function sourceLabel(source: LeadSource): string {
  switch (source) {
    case "main_contact_form":
      return "İletişim Formu";
    case "custom_category_form":
      return "Kategorim Listede Yok";
    case "package_cta":
      return "Paket Talebi";
    case "floating_assistant":
      return "Bot / WhatsApp Asistanı";
    default:
      return source ? source : "Bilinmiyor";
  }
}

export function sourceBadgeClass(source: LeadSource): string {
  switch (source) {
    case "main_contact_form":
      return "bg-sky-100 text-sky-900 border-sky-200";
    case "custom_category_form":
      return "bg-orange-100 text-orange-900 border-orange-200";
    case "package_cta":
      return "bg-purple-100 text-purple-900 border-purple-200";
    case "floating_assistant":
      return "bg-emerald-100 text-emerald-900 border-emerald-200";
    default:
      return "bg-muted text-foreground border-border";
  }
}

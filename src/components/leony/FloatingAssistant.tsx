import { useEffect, useState } from "react";
import { LOGO_MARK } from "./Logo";
import { X } from "lucide-react";
import { WhatsAppButton } from "./WhatsAppButton";
import { useT } from "@/lib/i18n/context";

const STORAGE_KEY = "leony.assistant.closed";

export function FloatingAssistant() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // On first paint, open by default unless user previously dismissed.
  useEffect(() => {
    setMounted(true);
    try {
      const closed = localStorage.getItem(STORAGE_KEY) === "1";
      setOpen(!closed);
    } catch {
      setOpen(true);
    }
  }, []);

  function close() {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function toggle() {
    if (open) close();
    else {
      setOpen(true);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  }

  if (!mounted) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[88vw] max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-navy to-purple text-navy-foreground">
            <img src={LOGO_MARK} alt="Leony" className="h-10 w-10 rounded-full object-cover ring-2 ring-white/40" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{t.assistant.name}</div>
              <div className="text-[11px] text-white/75">{t.assistant.status}</div>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label={t.assistant.closeAria}
              className="grid place-items-center h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4">
            <p className="text-sm text-foreground">{t.assistant.greeting}</p>
            <div className="mt-4">
              <WhatsAppButton className="w-full" message={t.waMessages.assistant}>
                {t.assistant.waCta}
              </WhatsAppButton>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-label={t.assistant.openAria}
        className="relative h-16 w-16 rounded-full overflow-hidden shadow-xl ring-2 ring-white/70 hover:ring-orange/60 hover:scale-105 transition-all cursor-pointer"
      >
        <img src={LOGO_MARK} alt="Leony" className="h-full w-full object-cover scale-125" />
      </button>
    </div>
  );
}

import { useState } from "react";
import { LOGO_MARK } from "./Logo";
import { X } from "lucide-react";
import { WhatsAppButton } from "./WhatsAppButton";

export function FloatingAssistant() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[88vw] max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-navy to-purple text-navy-foreground">
            <div
              className="h-10 w-10 rounded-full bg-cover bg-center ring-2 ring-white/40"
              style={{ backgroundImage: `url(${LOGO_MARK})`, backgroundSize: "115%" }}
              aria-hidden
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">Leony Team</div>
              <div className="text-[11px] text-white/75">Genellikle birkaç dakikada yanıt verir</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Kapat"
              className="grid place-items-center h-8 w-8 rounded-full bg-white/15 hover:bg-white/25"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4">
            <p className="text-sm text-foreground">
              Merhaba <span aria-hidden>👋</span> Leony web sitesi hizmetleri hakkında bilgi almak istiyorum.
            </p>
            <div className="mt-4">
              <WhatsAppButton
                className="w-full"
                message="Merhaba, Leony web sitesi hizmetleri hakkında bilgi almak istiyorum."
              >
                WhatsApp’tan Bilgi Al
              </WhatsAppButton>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Leony asistanını aç"
        className="relative h-16 w-16 rounded-full overflow-hidden shadow-xl ring-2 ring-white/70 hover:scale-105 transition-transform"
        style={{
          backgroundImage: `url(${LOGO_MARK})`,
          backgroundSize: "118%",
          backgroundPosition: "center 42%",
        }}
      >
        <span className="absolute inset-0 rounded-full ring-1 ring-black/5" />
      </button>
    </div>
  );
}

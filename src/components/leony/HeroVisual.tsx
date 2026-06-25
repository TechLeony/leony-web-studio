import {
  Calendar,
  LayoutDashboard,
  MessageSquare,
  Send,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useT } from "@/lib/i18n/context";

export function HeroVisual() {
  const t = useT();
  const hv = t.heroVisual;
  return (
    <div className="relative w-full aspect-[3/4] sm:aspect-[4/3] md:aspect-[5/4]">
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 rounded-[40px] opacity-60"
        style={{
          background:
            "radial-gradient(60% 60% at 70% 30%, color-mix(in oklab, var(--color-orange) 22%, transparent), transparent 70%), radial-gradient(60% 60% at 20% 80%, color-mix(in oklab, var(--color-purple) 28%, transparent), transparent 70%)",
        }}
      />

      <div className="absolute inset-x-0 top-0 mx-auto w-[92%] rounded-2xl bg-card border border-border shadow-2xl shadow-navy/10 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/60">
          <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.78_0.16_25)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.85_0.15_85)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.78_0.16_150)]" />
          <div className="ml-3 flex-1 h-6 rounded-md bg-card border border-border text-[10px] text-muted-foreground flex items-center px-3 truncate">
            {hv.urlText}
          </div>
        </div>
        <div className="p-4 sm:p-5 md:p-6 grid grid-cols-5 gap-3 sm:gap-4">
          <div className="col-span-2 space-y-2 sm:space-y-3">
            <div className="h-3 w-2/3 rounded-full bg-foreground/85" />
            <div className="h-2.5 w-full rounded-full bg-muted-foreground/30" />
            <div className="h-2.5 w-5/6 rounded-full bg-muted-foreground/30" />
            <div className="mt-2 sm:mt-3 flex gap-2">
              <span className="h-7 w-20 rounded-full bg-navy" />
              <span className="h-7 w-20 rounded-full bg-whatsapp" />
            </div>
            <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2">
              {hv.quickLinks.map((q) => (
                <div key={q} className="rounded-lg border border-border bg-background px-2 py-2 text-[10px] font-medium text-muted-foreground truncate">
                  {q}
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-3 rounded-xl bg-gradient-to-br from-navy via-purple to-pink p-3 sm:p-4 text-navy-foreground relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange/40 blur-2xl" />
            <div className="text-[10px] uppercase tracking-wider opacity-80">{hv.webBlockEyebrow}</div>
            <div className="mt-1 text-base sm:text-lg font-semibold leading-snug">{hv.webBlockTitle}</div>
            <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-2">
              {hv.metrics.map((m) => (
                <div key={m.l} className="rounded-lg bg-white/10 backdrop-blur p-2 text-center">
                  <div className="text-xs sm:text-sm font-bold">{m.v}</div>
                  <div className="text-[9px] opacity-80">{m.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -left-2 sm:-left-2 bottom-[42%] sm:bottom-2 w-[92%] sm:w-[58%] rounded-2xl bg-card border border-border shadow-xl shadow-navy/10 p-3 sm:p-4 animate-float-slow">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-navy text-navy-foreground grid place-items-center shrink-0">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-foreground truncate">{hv.adminTitle}</div>
            <div className="text-[10px] text-muted-foreground truncate">{hv.adminSub}</div>
          </div>
          <span className="text-[10px] font-semibold text-teal shrink-0">+12</span>
        </div>
        <div className="mt-3 grid grid-cols-7 items-end gap-1.5 h-12 sm:h-16">
          {[35, 55, 40, 70, 50, 85, 65].map((h, i) => (
            <div key={i} className="rounded-sm bg-gradient-to-t from-purple to-pink" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>

      <div className="absolute right-0 sm:right-0 bottom-2 sm:bottom-10 w-[92%] sm:w-[48%] rounded-2xl bg-card border border-border shadow-xl shadow-navy/10 p-3 sm:p-4 animate-float-slow [animation-delay:1.5s]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-teal/15 text-teal grid place-items-center shrink-0">
            <Calendar className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-foreground truncate">{hv.apptTitle}</div>
            <div className="text-[10px] text-muted-foreground truncate">{hv.apptSub}</div>
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          {[
            { t: "10:30", n: "A. Yılmaz" },
            { t: "12:00", n: "M. Demir" },
            { t: "15:15", n: "E. Kaya" },
          ].map((r) => (
            <div key={r.t} className="flex items-center justify-between rounded-md bg-muted/70 px-2 py-1.5 text-[10px]">
              <span className="font-semibold text-foreground">{r.t}</span>
              <span className="text-muted-foreground truncate mx-1">{r.n}</span>
              <span className="text-teal font-medium">✓</span>
            </div>
          ))}
        </div>
      </div>

      <Chip className="absolute -top-3 left-4 text-[10px] sm:text-[11px] px-2 sm:px-2.5" icon={<Send className="h-3 w-3" />} label={hv.chips.contactForm} />
      <Chip className="absolute top-8 sm:top-10 right-1 sm:-right-1 text-[10px] sm:text-[11px] px-2 sm:px-2.5" icon={<MessageSquare className="h-3 w-3" />} label={hv.chips.whatsappFlow} />
      <Chip className="absolute bottom-[72%] sm:bottom-32 -left-3 hidden sm:flex" icon={<Smartphone className="h-3 w-3" />} label={hv.chips.mobile} />
      <Chip className="absolute bottom-[20%] sm:bottom-0 right-4 sm:right-12 text-[10px] sm:text-[11px] px-2 sm:px-2.5" icon={<Sparkles className="h-3 w-3" />} label={hv.chips.demos} />
    </div>
  );
}

function Chip({ className = "", icon, label }: { className?: string; icon: React.ReactNode; label: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-card/95 backdrop-blur px-2.5 py-1 font-medium text-foreground shadow-md ${className}`}>
      <span className="text-purple">{icon}</span>
      {label}
    </div>
  );
}

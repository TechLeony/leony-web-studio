import {
  Calendar,
  LayoutDashboard,
  MessageSquare,
  Send,
  Smartphone,
  Sparkles,
} from "lucide-react";

// Premium hero visual: stacked browser/dashboard mockups, no images.
export function HeroVisual() {
  return (
    <div className="relative w-full aspect-[4/3] md:aspect-[5/4]">
      {/* Glow */}
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 rounded-[40px] opacity-60"
        style={{
          background:
            "radial-gradient(60% 60% at 70% 30%, color-mix(in oklab, var(--color-orange) 22%, transparent), transparent 70%), radial-gradient(60% 60% at 20% 80%, color-mix(in oklab, var(--color-purple) 28%, transparent), transparent 70%)",
        }}
      />

      {/* Big browser */}
      <div className="absolute inset-x-0 top-0 mx-auto w-[92%] rounded-2xl bg-card border border-border shadow-2xl shadow-navy/10 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/60">
          <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.78_0.16_25)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.85_0.15_85)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.78_0.16_150)]" />
          <div className="ml-3 flex-1 h-6 rounded-md bg-card border border-border text-[10px] text-muted-foreground flex items-center px-3">
            leony.app/demo
          </div>
        </div>
        <div className="p-5 md:p-6 grid grid-cols-5 gap-4">
          <div className="col-span-2 space-y-3">
            <div className="h-3 w-2/3 rounded-full bg-foreground/85" />
            <div className="h-2.5 w-full rounded-full bg-muted-foreground/30" />
            <div className="h-2.5 w-5/6 rounded-full bg-muted-foreground/30" />
            <div className="mt-3 flex gap-2">
              <span className="h-7 w-20 rounded-full bg-navy" />
              <span className="h-7 w-20 rounded-full bg-whatsapp" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {["Randevu", "Galeri", "Menü", "İletişim"].map((t) => (
                <div
                  key={t}
                  className="rounded-lg border border-border bg-background px-2 py-2 text-[10px] font-medium text-muted-foreground"
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-3 rounded-xl bg-gradient-to-br from-navy via-purple to-pink p-4 text-navy-foreground relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange/40 blur-2xl" />
            <div className="text-[10px] uppercase tracking-wider opacity-80">Web Çözümü</div>
            <div className="mt-1 text-lg font-semibold leading-snug">
              Modern, hızlı ve dönüşüm odaklı.
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { v: "+38%", l: "Talep" },
                { v: "1.2s", l: "Yük" },
                { v: "A+", l: "Mobil" },
              ].map((m) => (
                <div key={m.l} className="rounded-lg bg-white/10 backdrop-blur p-2 text-center">
                  <div className="text-sm font-bold">{m.v}</div>
                  <div className="text-[9px] opacity-80">{m.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating dashboard card */}
      <div className="absolute -left-2 bottom-2 w-[58%] rounded-2xl bg-card border border-border shadow-xl shadow-navy/10 p-4 animate-float-slow">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-navy text-navy-foreground grid place-items-center">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-foreground">Admin Dashboard</div>
            <div className="text-[10px] text-muted-foreground">Talepler · Bugün</div>
          </div>
          <span className="text-[10px] font-semibold text-teal">+12</span>
        </div>
        <div className="mt-3 grid grid-cols-7 items-end gap-1.5 h-16">
          {[35, 55, 40, 70, 50, 85, 65].map((h, i) => (
            <div
              key={i}
              className="rounded-sm bg-gradient-to-t from-purple to-pink"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* Floating appointment card */}
      <div className="absolute right-0 bottom-10 w-[48%] rounded-2xl bg-card border border-border shadow-xl shadow-navy/10 p-4 animate-float-slow [animation-delay:1.5s]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-teal/15 text-teal grid place-items-center">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-foreground">Randevu Yönetimi</div>
            <div className="text-[10px] text-muted-foreground">Bugün · 4 yeni</div>
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          {[
            { t: "10:30", n: "A. Yılmaz" },
            { t: "12:00", n: "M. Demir" },
            { t: "15:15", n: "E. Kaya" },
          ].map((r) => (
            <div
              key={r.t}
              className="flex items-center justify-between rounded-md bg-muted/70 px-2 py-1.5 text-[10px]"
            >
              <span className="font-semibold text-foreground">{r.t}</span>
              <span className="text-muted-foreground">{r.n}</span>
              <span className="text-teal font-medium">Onaylı</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chips */}
      <Chip className="absolute -top-3 left-4" icon={<Send className="h-3 w-3" />} label="İletişim Formu" />
      <Chip className="absolute top-10 -right-1" icon={<MessageSquare className="h-3 w-3" />} label="WhatsApp Akışı" />
      <Chip className="absolute bottom-32 -left-3 hidden sm:flex" icon={<Smartphone className="h-3 w-3" />} label="Mobil Uyumlu" />
      <Chip className="absolute bottom-0 right-12" icon={<Sparkles className="h-3 w-3" />} label="Demo Projeler" />
    </div>
  );
}

function Chip({
  className = "",
  icon,
  label,
}: {
  className?: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-card/95 backdrop-blur px-2.5 py-1 text-[11px] font-medium text-foreground shadow-md ${className}`}
    >
      <span className="text-purple">{icon}</span>
      {label}
    </div>
  );
}

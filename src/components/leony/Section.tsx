import { cn } from "@/lib/utils";

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl space-y-4",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      {eyebrow && (
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground",
            align === "center" && "mx-auto",
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-orange via-pink to-purple" />
          {eyebrow}
        </div>
      )}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {subtitle && (
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}

export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("py-20 md:py-28", className)}>
      <div className="mx-auto max-w-7xl px-4 md:px-8">{children}</div>
    </section>
  );
}

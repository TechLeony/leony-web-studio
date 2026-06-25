import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { waLink } from "@/lib/site";

type Variant = "whatsapp" | "primary" | "outline" | "ghost";

export function WhatsAppButton({
  message,
  children,
  className,
  variant = "whatsapp",
  withIcon = true,
}: {
  message: string;
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
  withIcon?: boolean;
}) {
  const styles: Record<Variant, string> = {
    whatsapp:
      "bg-whatsapp text-whatsapp-foreground hover:brightness-95 shadow-sm",
    primary:
      "bg-navy text-navy-foreground hover:bg-navy/90 shadow-sm",
    outline:
      "border border-border bg-card hover:bg-muted text-foreground",
    ghost: "text-foreground hover:bg-muted",
  };
  return (
    <a
      href={waLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-all",
        styles[variant],
        className,
      )}
    >
      {withIcon && <MessageCircle className="h-4 w-4" />}
      {children}
    </a>
  );
}

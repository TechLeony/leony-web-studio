import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { COUNTRIES, type Country } from "@/lib/countries";

type Props = {
  value: Country;
  onChange: (c: Country) => void;
  searchPlaceholder?: string;
  ariaLabel?: string;
};

export function CountryCodeSelect({ value, onChange, searchPlaceholder = "Search country", ariaLabel = "Country" }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        c.code.toLowerCase().includes(needle) ||
        c.dial.replace("+", "").includes(needle.replace("+", "")),
    );
  }, [q]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-11 items-center gap-1.5 rounded-l-xl border border-r-0 border-border bg-background px-2.5 text-sm font-medium text-foreground hover:bg-muted cursor-pointer"
      >
        <span className="text-base leading-none">{value.flag}</span>
        <span className="tabular-nums">{value.dial}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-50 top-full left-0 mt-1.5 w-72 max-w-[85vw] rounded-xl border border-border bg-popover shadow-lg overflow-hidden"
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-xs text-muted-foreground">No matches</li>
            ) : (
              filtered.map((c) => {
                const active = c.code === value.code;
                return (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(c);
                        setOpen(false);
                        setQ("");
                      }}
                      className={
                        "w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-muted cursor-pointer " +
                        (active ? "bg-muted/70" : "")
                      }
                    >
                      <span className="text-base leading-none">{c.flag}</span>
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{c.dial}</span>
                      {active && <Check className="h-3.5 w-3.5 text-foreground" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

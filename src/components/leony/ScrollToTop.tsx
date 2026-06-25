import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Yukarı çık"
      className="fixed bottom-5 left-5 z-50 grid h-11 w-11 place-items-center rounded-full bg-navy text-navy-foreground shadow-xl ring-2 ring-white/40 hover:bg-orange hover:ring-orange/50 hover:scale-105 transition-all"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

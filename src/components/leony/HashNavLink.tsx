import { useNavigate, useRouterState } from "@tanstack/react-router";
import type { MouseEvent, ReactNode } from "react";

type Props = {
  href: string; // e.g. "#paketler", "/", "/about"
  className?: string;
  onNavigate?: () => void;
  children: ReactNode;
};

function scrollToId(id: string) {
  // Wait a tick so the target element exists after route/hash change.
  requestAnimationFrame(() => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

/**
 * Smart navigation link for entries that point at homepage hash anchors.
 * - If `href` is "#section":
 *     - on "/", smooth-scrolls to that section
 *     - elsewhere, navigates to "/" with the hash and then scrolls
 * - If `href` is "/", navigates home
 * - Any other href falls back to a normal anchor
 */
export function HashNavLink({ href, className, onNavigate, children }: Props) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isHash = href.startsWith("#");
  const targetHref = isHash && pathname !== "/" ? `/${href}` : href;

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    // Allow modifier/middle clicks to behave normally.
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    if (!isHash) {
      // Plain route link: let TanStack handle via navigate for SPA behavior.
      if (href === "/" || href.startsWith("/")) {
        e.preventDefault();
        navigate({ to: href });
        onNavigate?.();
      }
      return;
    }
    e.preventDefault();
    const id = href.slice(1);
    if (pathname === "/") {
      // Update the URL hash without a full reload, then scroll.
      if (typeof history !== "undefined") {
        history.replaceState(null, "", `#${id}`);
      }
      scrollToId(id);
    } else {
      navigate({ to: "/", hash: id });
    }
    onNavigate?.();
  }

  return (
    <a href={targetHref} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { type FormEvent, useEffect, useState } from "react";
import { Heart, LockKeyhole } from "lucide-react";

import { StoryOfUsFinalSiteRenderer } from "@/components/storyofus/FinalSiteRenderer";
import {
  getStoryOfUsFinalSiteAccess,
  verifyStoryOfUsFinalSitePasscode,
  type StoryOfUsFinalSiteData,
} from "@/lib/storyofus/finalSite.server";
import { waitForStoryOfUsFinalSiteReveal } from "@/lib/storyofus/finalSiteUnlockTransition";

export const Route = createFileRoute("/storyofus/site/$siteSlug")({
  head: () => ({
    meta: [{ title: "StoryOfUs | Leony" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: StoryOfUsFinalSiteRoute,
});

type AccessState =
  | {
      status: "loading";
    }
  | {
      status: "not_found";
    }
  | {
      status: "locked";
      coupleDisplayName: string;
      passcodeHint: string;
    }
  | {
      status: "unlocked";
      site: StoryOfUsFinalSiteData;
    }
  | {
      status: "revealing";
      site: StoryOfUsFinalSiteData;
    };

function StoryOfUsFinalSiteRoute() {
  const { siteSlug } = Route.useParams();
  const loadAccess = useServerFn(getStoryOfUsFinalSiteAccess);
  const verifyPasscode = useServerFn(verifyStoryOfUsFinalSitePasscode);
  const [accessState, setAccessState] = useState<AccessState>({ status: "loading" });
  const [passcode, setPasscode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const result = await loadAccess({ data: { siteSlug } });

      if (!mounted) {
        return;
      }

      if (result.status === "found") {
        setAccessState({
          status: "locked",
          coupleDisplayName: result.coupleDisplayName,
          passcodeHint: result.passcodeHint,
        });
      } else {
        setAccessState({
          status: "not_found",
        });
      }
    }

    load().catch(() => {
      if (mounted) {
        setAccessState({
          status: "not_found",
        });
      }
    });

    return () => {
      mounted = false;
    };
  }, [loadAccess, siteSlug]);

  async function handleUnlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!/^\d{4}$/.test(passcode.trim())) {
      setErrorMessage("Şifre yanlış, tekrar dene aşkım 💌");
      return;
    }

    setIsUnlocking(true);

    try {
      const result = await verifyPasscode({
        data: {
          siteSlug,
          passcode,
        },
      });

      if (result.status === "unlocked") {
        setAccessState({
          status: "revealing",
          site: result.site,
        });
        await waitForStoryOfUsFinalSiteReveal(result.site);
        setAccessState({
          status: "unlocked",
          site: result.site,
        });
      } else if (result.status === "invalid_passcode") {
        setErrorMessage(result.message);
      } else {
        setAccessState({
          status: "not_found",
        });
      }
    } finally {
      setIsUnlocking(false);
    }
  }

  if (accessState.status === "loading") {
    return <FinalSiteShell message="StoryOfUs sayfanız hazırlanıyor..." />;
  }

  if (accessState.status === "not_found") {
    return (
      <FinalSiteShell message="Bu StoryOfUs sayfası bulunamadı.">
        <Link
          to="/storyofus"
          className="mt-5 inline-flex rounded-full bg-rose-500 px-5 py-3 text-sm font-semibold text-white"
        >
          StoryOfUs sayfasına dön
        </Link>
      </FinalSiteShell>
    );
  }

  if (accessState.status === "unlocked") {
    return <StoryOfUsFinalSiteRenderer site={accessState.site} />;
  }

  if (accessState.status === "revealing") {
    return <FinalSiteRevealTransition />;
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,#fff7f3_0%,#ffe8ef_52%,#fffaf7_100%)] px-4 py-10 text-rose-950">
      <section className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white/85 p-6 text-center shadow-2xl shadow-rose-100/70 backdrop-blur sm:p-8">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-rose-500 shadow-lg shadow-rose-100">
          <LockKeyhole className="h-7 w-7" />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">
          StoryOfUs
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-rose-950">
          {accessState.coupleDisplayName}
        </h1>
        <p className="mt-4 text-sm leading-7 text-rose-950/65">
          Sayfayı açmak için küçük sırrı tahmin et bakalım.
        </p>

        <form onSubmit={handleUnlock} className="mt-7 grid gap-4">
          <input
            value={passcode}
            inputMode="numeric"
            maxLength={4}
            pattern="[0-9]*"
            onChange={(event) => {
              setPasscode(event.target.value.replace(/\D/g, "").slice(0, 4));
              setErrorMessage(null);
            }}
            className="mx-auto h-14 w-40 rounded-2xl border border-rose-100 bg-white text-center text-2xl font-bold tracking-[0.45em] text-rose-950 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
            aria-label="StoryOfUs şifresi"
          />
          {accessState.passcodeHint && (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              İpucu: {accessState.passcodeHint}
            </p>
          )}
          {errorMessage && <p className="text-sm font-semibold text-rose-600">{errorMessage}</p>}
          <button
            type="submit"
            disabled={isUnlocking}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition disabled:opacity-60"
          >
            <Heart className="h-4 w-4 fill-white" />
            {isUnlocking ? "Açılıyor..." : "Sürprizi aç"}
          </button>
        </form>
      </section>
    </main>
  );
}

function FinalSiteRevealTransition() {
  return (
    <main className="grid min-h-screen place-items-center overflow-hidden bg-[linear-gradient(180deg,#fff7f3_0%,#ffe8ef_52%,#fffaf7_100%)] px-4 text-center text-rose-950">
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-[30px] h-36 w-36 sm:h-40 sm:w-40 motion-reduce:mb-5">
          <svg viewBox="0 0 120 120" className="relative z-10 h-full w-full overflow-visible">
            <defs>
              <linearGradient id="souFinalHeartFill" x1="20" x2="100" y1="20" y2="104">
                <stop stopColor="#fb7185" />
                <stop offset="0.55" stopColor="#ec4899" />
                <stop offset="1" stopColor="#fda4af" />
              </linearGradient>
              <linearGradient id="souFinalHeartShine" x1="30" x2="92" y1="88" y2="30">
                <stop stopColor="rgba(255,255,255,0)" />
                <stop offset="0.5" stopColor="rgba(255,255,255,0.95)" />
                <stop offset="1" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>
            <path
              className="sou-final-heart-fill"
              d="M60 101C33 78 18 62 18 42c0-14 10-24 23-24 8 0 15 4 19 11 4-7 11-11 19-11 13 0 23 10 23 24 0 20-15 36-42 59Z"
              fill="url(#souFinalHeartFill)"
            />
            <path
              className="sou-final-heart-outline"
              d="M60 101C33 78 18 62 18 42c0-14 10-24 23-24 8 0 15 4 19 11 4-7 11-11 19-11 13 0 23 10 23 24 0 20-15 36-42 59Z"
              fill="none"
              stroke="#e11d48"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="4.5"
            />
            <path
              className="sou-final-heart-shine"
              d="M36 82C48 67 63 52 84 34"
              fill="none"
              stroke="url(#souFinalHeartShine)"
              strokeLinecap="round"
              strokeWidth="8"
            />
          </svg>
          <span className="pointer-events-none absolute inset-5 rounded-full bg-white/35 blur-xl animate-[sou-final-heart-glow_2300ms_ease-out_forwards] motion-reduce:animate-none" />
        </div>
        <div className="max-w-[calc(100vw-2rem)] rounded-full border border-white/70 bg-white/65 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-rose-600 shadow-lg shadow-rose-200/40 backdrop-blur sm:px-5 sm:tracking-[0.25em]">
          Romantik hikayeniz açılıyor
        </div>
      </div>

      <style>{`
        @keyframes sou-final-heart-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes sou-final-heart-fill {
          0% { opacity: 0; transform: scale(0.88); }
          45% { opacity: 0.42; }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes sou-final-heart-shine {
          0%, 66% { opacity: 0; stroke-dashoffset: 96; }
          76% { opacity: 0.95; }
          100% { opacity: 0; stroke-dashoffset: -96; }
        }
        @keyframes sou-final-heart-glow {
          0% { opacity: 0; transform: scale(0.7); }
          52% { opacity: 0.75; transform: scale(1.22); }
          100% { opacity: 0.16; transform: scale(1); }
        }
        .sou-final-heart-outline {
          stroke-dasharray: 310;
          stroke-dashoffset: 310;
          animation: sou-final-heart-draw 1600ms ease-in-out forwards;
          filter: drop-shadow(0 0 10px rgba(225, 29, 72, 0.2));
        }
        .sou-final-heart-fill {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          animation: sou-final-heart-fill 1600ms ease-in-out forwards;
        }
        .sou-final-heart-shine {
          opacity: 0;
          stroke-dasharray: 42 96;
          stroke-dashoffset: 96;
          animation: sou-final-heart-shine 2300ms ease-out forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .sou-final-heart-outline,
          .sou-final-heart-fill,
          .sou-final-heart-shine {
            animation-duration: 1ms;
            animation-delay: 0ms;
          }
        }
      `}</style>
    </main>
  );
}

function FinalSiteShell({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,#fff7f3_0%,#ffe8ef_52%,#fffaf7_100%)] px-4 text-center text-rose-950">
      <div>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-rose-500 shadow-lg shadow-rose-100">
          <Heart className="h-7 w-7 fill-rose-400" />
        </div>
        <p className="mt-5 text-lg font-bold">{message}</p>
        {children}
      </div>
    </main>
  );
}

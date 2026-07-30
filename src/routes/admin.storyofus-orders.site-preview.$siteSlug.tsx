import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { StoryOfUsFinalSiteRenderer } from "@/components/storyofus/FinalSiteRenderer";
import {
  getStoryOfUsAdminFinalSitePreviewBySlug,
  type StoryOfUsFinalSiteData,
} from "@/lib/storyofus/finalSite.server";

export const Route = createFileRoute("/admin/storyofus-orders/site-preview/$siteSlug")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "StoryOfUs Admin Preview | Leony" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: StoryOfUsAdminSitePreviewRoute,
});

type PreviewState =
  | {
      status: "loading";
    }
  | {
      status: "not_found";
    }
  | {
      status: "found";
      site: StoryOfUsFinalSiteData;
    };

function StoryOfUsAdminSitePreviewRoute() {
  const { siteSlug } = Route.useParams();
  const loadPreview = useServerFn(getStoryOfUsAdminFinalSitePreviewBySlug);
  const [previewState, setPreviewState] = useState<PreviewState>({ status: "loading" });

  useEffect(() => {
    let mounted = true;

    async function load() {
      const result = await loadPreview({ data: { siteSlug } });

      if (!mounted) {
        return;
      }

      if (result.status === "found") {
        setPreviewState({
          status: "found",
          site: result.site,
        });
      } else {
        setPreviewState({
          status: "not_found",
        });
      }
    }

    load().catch(() => {
      if (mounted) {
        setPreviewState({
          status: "not_found",
        });
      }
    });

    return () => {
      mounted = false;
    };
  }, [loadPreview, siteSlug]);

  if (previewState.status !== "found") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-950">
            {previewState.status === "loading"
              ? "Admin preview loading..."
              : "This preview is not available."}
          </p>
          <Link
            to="/admin/storyofus-orders/orders"
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to orders
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          Admin-only preview
        </div>
        <Link
          to="/admin/storyofus-orders/orders"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Orders
        </Link>
      </div>
      <StoryOfUsFinalSiteRenderer site={previewState.site} />
    </main>
  );
}

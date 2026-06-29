import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { LOGO_FAVICON } from "@/components/leony/Logo";

function GlobalPending() {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background/85 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <img
            src={faviconAsset.url}
            alt="Leony"
            className="h-16 w-16 rounded-full object-cover animate-pulse"
          />
          <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-orange animate-spin" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Leony yükleniyor...</p>
      </div>
    </div>
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: GlobalPending,
    defaultPendingMs: 150,
  });

  return router;
};

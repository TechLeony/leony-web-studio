import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { storyOfUsDemoCtaConfig } from "./demoCtaConfig.ts";

export const STORYOFUS_DEMO_LOADING_DURATION_MS = 2000;

type StoryOfUsDemoTransitionTimer = ReturnType<typeof window.setTimeout>;

type StoryOfUsDemoTransitionControllerOptions = {
  durationMs?: number;
  setTimer?: (callback: () => void, durationMs: number) => StoryOfUsDemoTransitionTimer;
  clearTimer?: (timer: StoryOfUsDemoTransitionTimer) => void;
  onLoadingChange: (isLoading: boolean) => void;
  onNavigate: () => Promise<void> | void;
};

export function createStoryOfUsDemoTransitionController({
  durationMs = STORYOFUS_DEMO_LOADING_DURATION_MS,
  setTimer = (callback, timeoutMs) => window.setTimeout(callback, timeoutMs),
  clearTimer = (timer) => window.clearTimeout(timer),
  onLoadingChange,
  onNavigate,
}: StoryOfUsDemoTransitionControllerOptions) {
  let isActive = false;
  let isMounted = true;
  let timer: StoryOfUsDemoTransitionTimer | null = null;

  function clearPendingTimer() {
    if (!timer) {
      return;
    }

    clearTimer(timer);
    timer = null;
  }

  return {
    mount() {
      isMounted = true;
    },
    isActive() {
      return isActive;
    },
    start() {
      if (isActive || !isMounted) {
        return false;
      }

      isActive = true;
      onLoadingChange(true);
      timer = setTimer(() => {
        timer = null;

        if (!isMounted) {
          return;
        }

        void Promise.resolve(onNavigate()).finally(() => {
          if (!isMounted) {
            return;
          }

          isActive = false;
          onLoadingChange(false);
        });
      }, durationMs);

      return true;
    },
    cancel() {
      isMounted = false;
      clearPendingTimer();
      isActive = false;
    },
  };
}

export function useStoryOfUsDemoNavigation() {
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const navigate = useNavigate();
  const controllerRef = useRef<ReturnType<typeof createStoryOfUsDemoTransitionController> | null>(
    null,
  );

  if (!controllerRef.current) {
    controllerRef.current = createStoryOfUsDemoTransitionController({
      onLoadingChange: setIsDemoLoading,
      onNavigate: () => navigate({ to: storyOfUsDemoCtaConfig.demoPath }),
    });
  }

  useEffect(() => {
    const controller = controllerRef.current;
    controller?.mount();

    return () => {
      controller?.cancel();
    };
  }, []);

  const navigateToDemo = useCallback(() => {
    controllerRef.current?.start();
  }, []);

  return {
    isDemoLoading,
    navigateToDemo,
  };
}

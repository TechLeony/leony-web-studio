import type { StoryOfUsFinalSiteData } from "./finalSite.server";

const DEFAULT_HEART_REVEAL_DURATION_MS = 2300;
const REDUCED_MOTION_REVEAL_DURATION_MS = 250;
const DEFAULT_PRELOAD_TIMEOUT_MS = 3500;
const REDUCED_MOTION_PRELOAD_TIMEOUT_MS = 1200;

export function getStoryOfUsFinalSiteCriticalPreloadUrls(site: StoryOfUsFinalSiteData) {
  return uniqueNonEmptyStrings([
    site.heroPhotos.left?.previewUrl,
    site.heroPhotos.right?.previewUrl,
  ]);
}

export function getStoryOfUsUnlockTransitionTiming(prefersReducedMotion: boolean) {
  return {
    minimumDurationMs: prefersReducedMotion
      ? REDUCED_MOTION_REVEAL_DURATION_MS
      : DEFAULT_HEART_REVEAL_DURATION_MS,
    preloadTimeoutMs: prefersReducedMotion
      ? REDUCED_MOTION_PRELOAD_TIMEOUT_MS
      : DEFAULT_PRELOAD_TIMEOUT_MS,
  };
}

export async function waitForStoryOfUsFinalSiteReveal(site: StoryOfUsFinalSiteData) {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const timing = getStoryOfUsUnlockTransitionTiming(prefersReducedMotion);

  await Promise.all([
    wait(timing.minimumDurationMs),
    preloadCriticalImagesWithTimeout(
      getStoryOfUsFinalSiteCriticalPreloadUrls(site),
      timing.preloadTimeoutMs,
    ),
  ]);
}

function uniqueNonEmptyStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.map((value) => value?.trim() ?? "").filter((value) => value.length > 0)),
  );
}

function preloadCriticalImagesWithTimeout(urls: string[], timeoutMs: number) {
  if (urls.length === 0 || typeof Image === "undefined") {
    return Promise.resolve();
  }

  return Promise.race([Promise.all(urls.map(preloadImage)).then(() => undefined), wait(timeoutMs)]);
}

function preloadImage(url: string) {
  return new Promise<void>((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = url;
  });
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

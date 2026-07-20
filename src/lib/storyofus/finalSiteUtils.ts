const DEFAULT_STORYOFUS_PUBLIC_ORIGIN = "https://leony.tech";
const MAX_SLUG_LENGTH = 96;
const SLUG_SUFFIX_LENGTH = 6;

export function createStoryOfUsFinalSiteSlugBase(coupleDisplayName: string, partnerName: string) {
  const source = coupleDisplayName || partnerName;
  const normalized = normalizeTurkishText(source)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");

  return normalized || "storyofus";
}

export function createStoryOfUsFinalSiteSlug(prefix: string, suffix = createSlugSuffix()) {
  const normalizedPrefix = createStoryOfUsFinalSiteSlugBase(prefix, "");
  const maxPrefixLength = MAX_SLUG_LENGTH - suffix.length - 1;
  const safePrefix = normalizedPrefix.slice(0, maxPrefixLength).replace(/-+$/g, "") || "storyofus";

  return `${safePrefix}-${suffix}`;
}

export function createStoryOfUsFinalSiteUrl(finalSiteSlug: string) {
  return new URL(`/storyofus/site/${finalSiteSlug}`, DEFAULT_STORYOFUS_PUBLIC_ORIGIN).toString();
}

export function normalizeStoryOfUsFinalSiteSlug(value: string) {
  const normalized = value.trim().toLowerCase();

  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized) && normalized.length <= MAX_SLUG_LENGTH
    ? normalized
    : null;
}

export function isValidStoryOfUsFinalSiteUrl(value: string) {
  try {
    const url = new URL(value);

    if (
      url.origin !== DEFAULT_STORYOFUS_PUBLIC_ORIGIN ||
      url.search ||
      url.hash ||
      /%2f/i.test(url.pathname)
    ) {
      return false;
    }

    const pathParts = url.pathname.split("/");
    const slug = pathParts[3];

    return (
      pathParts.length === 4 &&
      pathParts[0] === "" &&
      pathParts[1] === "storyofus" &&
      pathParts[2] === "site" &&
      typeof slug === "string" &&
      normalizeStoryOfUsFinalSiteSlug(slug) === slug
    );
  } catch {
    return false;
  }
}

export type StoryOfUsTimelineMediaCandidate = {
  section: string;
  sectionItemId: string | null;
  previewUrl: string;
};

export type StoryOfUsTimelineItemCandidate = {
  id: string;
};

export type StoryOfUsTimelineSnapshotItemCandidate = {
  id: string;
};

export function formatStoryOfUsExperienceDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatStoryOfUsExperienceSinceLabel(value: string) {
  const dateText = formatStoryOfUsExperienceDate(value);

  return dateText ? `${dateText}'ten beri` : "";
}

export function findStoryOfUsTimelinePhotoForItem<TMedia extends StoryOfUsTimelineMediaCandidate>({
  timelineItem,
  itemIndex,
  timelineMedia,
  snapshotTimeline,
}: {
  timelineItem: StoryOfUsTimelineItemCandidate;
  itemIndex: number;
  timelineMedia: TMedia[];
  snapshotTimeline: StoryOfUsTimelineSnapshotItemCandidate[];
}) {
  const allowedSectionItemIds = new Set<string>([timelineItem.id]);
  const snapshotTimelineItem = snapshotTimeline[itemIndex];

  if (snapshotTimelineItem?.id) {
    allowedSectionItemIds.add(snapshotTimelineItem.id);
  }

  return (
    timelineMedia.find(
      (media) =>
        media.section === "timeline" &&
        Boolean(media.previewUrl) &&
        Boolean(media.sectionItemId) &&
        allowedSectionItemIds.has(media.sectionItemId as string),
    ) ?? null
  );
}

export function getStoryOfUsFinalSiteMaxSlugLength() {
  return MAX_SLUG_LENGTH;
}

function createSlugSuffix() {
  const bytes = new Uint8Array(8);
  globalThis.crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) => byte.toString(36))
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, SLUG_SUFFIX_LENGTH)
    .padEnd(SLUG_SUFFIX_LENGTH, "x");
}

function normalizeTurkishText(value: string) {
  const replacements: Record<string, string> = {
    ç: "c",
    Ç: "c",
    ğ: "g",
    Ğ: "g",
    ı: "i",
    I: "i",
    İ: "i",
    ö: "o",
    Ö: "o",
    ş: "s",
    Ş: "s",
    ü: "u",
    Ü: "u",
  };

  return value
    .replace(/[çÇğĞıIİöÖşŞüÜ]/g, (character) => replacements[character] ?? character)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

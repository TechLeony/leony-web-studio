import type {
  StoryOfUsFinalSiteData,
  StoryOfUsFinalSiteMedia,
} from "@/lib/storyofus/finalSite.server";
import { demoStoryData, type StoryOfUsExperienceData } from "./storyOfUsExperienceData.ts";

const neutralSpotifyFallback = {
  songTitle: "Şarkımız",
  artist: "Bize özel",
  note: "Bu şarkı bana hep seni hatırlatıyor 💖",
};

export function createStoryOfUsExperienceDataFromFinalSite(
  site: StoryOfUsFinalSiteData,
): StoryOfUsExperienceData {
  const coupleNames = splitCoupleDisplayName(site.coupleDisplayName);
  const relationshipStartDate = site.relationshipStartDate || new Date().toISOString();
  const relationshipDateText = site.relationshipStartDate
    ? formatExperienceDate(site.relationshipStartDate)
    : "";
  const loveLetter = site.letters.find((letter) => letter.type === "love_letter");
  const openWhenLetters = site.letters.filter((letter) => letter.type === "open_when");

  return {
    ...demoStoryData,
    accessPin: "",
    accessPinHint: site.passcodeHint,
    relationship: {
      ...demoStoryData.relationship,
      partnerName: site.partnerName,
      recipientName: site.recipientNickname,
      coupleNames,
      relationshipStartDate,
      relationshipStartLabel: relationshipDateText,
      heroMessage: demoStoryData.relationship.heroMessage,
      heroLeftPhoto: mediaToExperienceHeroPhoto(
        site.heroPhotos.left,
        demoStoryData.relationship.heroLeftPhoto,
      ),
      heroRightPhoto: mediaToExperienceHeroPhoto(
        site.heroPhotos.right,
        demoStoryData.relationship.heroRightPhoto,
      ),
    },
    stats: {
      ...demoStoryData.stats,
      statsSinceText: relationshipDateText || demoStoryData.stats.statsSinceText,
    },
    memories: {
      ...demoStoryData.memories,
      items: createMemoryPromptItems(site.memoryPrompts, site.gallery),
    },
    timeline: {
      ...demoStoryData.timeline,
      items: [...site.timeline].sort(sortBySortOrder).map((item, index) => {
        const fallback = demoStoryData.timeline.items[index % demoStoryData.timeline.items.length];

        return {
          ...fallback,
          ...mediaToExperiencePhoto(item.photo, fallback),
          date: item.eventDate ? formatExperienceDate(item.eventDate) : "",
          title: item.title,
          description: item.description,
        };
      }),
    },
    spotify: site.music
      ? {
          ...demoStoryData.spotify,
          songTitle: site.music.songTitle || neutralSpotifyFallback.songTitle,
          artist: site.music.artistName || neutralSpotifyFallback.artist,
          spotifyUrl: site.music.spotifyUrl,
        }
      : {
          ...demoStoryData.spotify,
          songTitle: "",
          artist: "",
          spotifyUrl: "",
        },
    photoPuzzle: {
      ...demoStoryData.photoPuzzle,
      imageUrl: site.puzzlePhoto?.previewUrl ?? "",
    },
    openWhenLetters: {
      ...demoStoryData.openWhenLetters,
      items: openWhenLetters.map((letter, index) => ({
        title: letter.title,
        message: letter.body,
        iconOrMotif: index % 2 === 0 ? "heart" : "sparkle",
      })),
    },
    voiceNote: {
      ...demoStoryData.voiceNote,
      audioUrl: site.voiceNote?.previewUrl ?? "",
      src: "",
    },
    reasons: {
      ...demoStoryData.reasons,
      items: [],
    },
    couponQuiz: {
      ...demoStoryData.couponQuiz,
      questions: [],
    },
    coupleWrapped: {
      ...demoStoryData.coupleWrapped,
      stats: [],
    },
    letter: {
      ...demoStoryData.letter,
      letterTitle: loveLetter?.title || demoStoryData.letter.letterTitle,
      letterBody: loveLetter?.body || "",
      letterSidePhoto: mediaToExperiencePhoto(
        site.loveLetterPhoto,
        demoStoryData.letter.letterSidePhoto,
      ),
    },
    finalSurprise: {
      ...demoStoryData.finalSurprise,
      finalSecretNote: "",
    },
  };
}

function createMemoryPromptItems(
  memoryPromptMedia: StoryOfUsFinalSiteMedia[],
  galleryMedia: StoryOfUsFinalSiteMedia[],
) {
  const mediaByPromptId = new Map(
    memoryPromptMedia.map((item) => [item.sectionItemId || item.semanticKey || item.id, item]),
  );
  const legacyPromptMedia = memoryPromptMedia.filter(
    (item) => !item.sectionItemId && !item.semanticKey,
  );
  const setupPromptIds = ["sweetest", "funniest", "most-attractive", "baby-face", "best-smile"];

  const promptItems = demoStoryData.memories.items
    .map((fallback, index) => {
      const matchingMedia = mediaByPromptId.get(setupPromptIds[index]) ?? legacyPromptMedia[index];

      if (!matchingMedia?.previewUrl) {
        return null;
      }

      return {
        ...fallback,
        ...mediaToExperiencePhoto(matchingMedia, fallback),
        caption: matchingMedia.caption || fallback.caption,
      };
    })
    .filter((item): item is (typeof demoStoryData.memories.items)[number] => Boolean(item));

  const galleryItems = [...galleryMedia]
    .sort(sortBySortOrder)
    .filter((item) => Boolean(item.previewUrl))
    .map((item, index) => {
      const fallback = demoStoryData.memories.items[index % demoStoryData.memories.items.length];

      return {
        ...fallback,
        ...mediaToExperiencePhoto(item, fallback),
        title: item.caption || fallback.title,
        caption: item.caption || fallback.caption,
      };
    });

  return [...promptItems, ...galleryItems];
}

function mediaToExperienceHeroPhoto(
  media: StoryOfUsFinalSiteMedia | null,
  fallback: (typeof demoStoryData.relationship)["heroLeftPhoto"],
) {
  return {
    ...fallback,
    src: media?.previewUrl || fallback.src,
    alt: media?.caption || media?.originalFilename || fallback.alt,
    caption: media?.caption || fallback.caption,
  };
}

function mediaToExperiencePhoto<
  T extends { photoSrc: string; photoAlt: string; placeholder: string; caption?: string },
>(media: StoryOfUsFinalSiteMedia | null, fallback: T) {
  return {
    ...fallback,
    photoSrc: media?.previewUrl || fallback.photoSrc,
    photoAlt: media?.caption || media?.originalFilename || fallback.photoAlt,
    caption: media?.caption || fallback.caption || "",
  };
}

function formatExperienceDate(value: string) {
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

function splitCoupleDisplayName(coupleDisplayName: string) {
  const [firstName, ...rest] = coupleDisplayName.split("&").map((part) => part.trim());
  const secondName = rest.join(" & ");

  return {
    first: firstName || coupleDisplayName,
    second: secondName || "",
    separator: secondName ? "&" : "",
  };
}

function sortBySortOrder(
  left: Pick<StoryOfUsFinalSiteMedia, "sortOrder">,
  right: Pick<StoryOfUsFinalSiteMedia, "sortOrder">,
) {
  return left.sortOrder - right.sortOrder;
}

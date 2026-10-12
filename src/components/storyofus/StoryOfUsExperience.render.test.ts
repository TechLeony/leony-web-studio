import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { storyOfUsDemoCtaConfig } from "../../lib/storyofus/demoCtaConfig.ts";
import * as adapter from "./storyOfUsExperienceAdapter.ts";
import * as experienceData from "./storyOfUsExperienceData.ts";
import type { StoryOfUsExperienceData } from "./storyOfUsExperienceData.ts";
import type { StoryOfUsFinalSiteData } from "../../lib/storyofus/finalSite.server.ts";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("./StoryOfUsExperience.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX,
  },
}).outputText;

function render(story: StoryOfUsExperienceData, entered = true) {
  const exports: Record<string, unknown> = {};
  let stateIndex = 0;
  vm.runInNewContext(compiled, {
    exports,
    require: (name: string) => {
      if (name === "react")
        return {
          ...React,
          // Simulate the existing startEntered effect without a DOM or network.
          useState: (initial: unknown) =>
            React.useState(stateIndex++ === 0 && entered ? true : initial),
        };
      if (name === "@/lib/storyofus/demoCtaConfig") return { storyOfUsDemoCtaConfig };
      if (name === "./storyOfUsExperienceData") return experienceData;
      if (name === "./storyOfUsExperienceAdapter") return adapter;
      if (["react/jsx-runtime", "react-dom", "lucide-react"].includes(name)) return require(name);
      throw new Error(`Unexpected renderer dependency: ${name}`);
    },
    URL,
    Date,
  });
  const Component = exports.StoryOfUsExperience as React.ComponentType<{
    story: StoryOfUsExperienceData;
    startEntered: boolean;
  }>;
  return renderToStaticMarkup(React.createElement(Component, { story, startEntered: entered }));
}

function customerStory(music: StoryOfUsFinalSiteData["music"]) {
  return adapter.createStoryOfUsExperienceDataFromFinalSite({
    coupleDisplayName: "Fixture & Partner",
    partnerName: "Partner",
    recipientNickname: "Fixture",
    relationshipStartDate: "2024-01-01",
    specialDateLabel: "",
    relationshipStory: "",
    passcodeHint: "",
    finalSiteUrl: "https://example.test/storyofus/site/fixture",
    orderReference: "FIXTURE",
    heroPhotos: { left: null, right: null },
    memoryPrompts: [],
    gallery: [],
    puzzlePhoto: null,
    loveLetterPhoto: null,
    voiceNote: null,
    timeline: [],
    letters: [],
    editableDefaultContent: {},
    music,
  });
}

test("real customer experience renders missing music without a Spotify embed or demo song", () => {
  const html = render(customerStory(null));
  assert.ok(html.length > 1000);
  assert.doesNotMatch(html, /open\.spotify\.com\/embed/);
  assert.doesNotMatch(html, new RegExp(experienceData.demoStoryData.spotify.songTitle));
});

test("missing artist uses the existing neutral label and preserves the supplied track", () => {
  const story = customerStory({ songTitle: "Customer track", artistName: "", spotifyUrl: "" });
  const html = render({ ...story, spotify: { ...story.spotify, artist: "" } });
  assert.ok(html.includes("Customer track"));
  assert.ok(html.includes(adapter.neutralSpotifyFallback.artist));
});

test("complete music metadata renders unchanged with the existing Spotify embed", () => {
  const story = customerStory({
    songTitle: "Customer track",
    artistName: "Customer artist",
    spotifyUrl: "https://open.spotify.com/track/FixtureTrack123",
  });
  const html = render({ ...story, spotify: { ...story.spotify, note: "Customer note" } });
  for (const value of [
    "Customer track",
    "Customer artist",
    "Customer note",
    "https://open.spotify.com/embed/track/FixtureTrack123",
  ])
    assert.ok(html.includes(value));
});

test("empty music note uses the existing neutral note without throwing", () => {
  const story = customerStory({
    songTitle: "Customer track",
    artistName: "Customer artist",
    spotifyUrl: "",
  });
  const html = render({ ...story, spotify: { ...story.spotify, note: "" } });
  assert.ok(html.includes(adapter.neutralSpotifyFallback.note));
});

test("missing music also renders the unchanged locked public experience", () => {
  const html = render(customerStory(null), false);
  assert.ok(html.includes(experienceData.demoStoryData.intro.introButtonText));
  assert.doesNotMatch(html, /open\.spotify\.com\/embed/);
});

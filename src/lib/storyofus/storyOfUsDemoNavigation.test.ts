import assert from "node:assert/strict";
import test from "node:test";

import {
  STORYOFUS_DEMO_LOADING_DURATION_MS,
  createStoryOfUsDemoTransitionController,
} from "./storyOfUsDemoNavigation.ts";

test("StoryOfUs demo navigation uses the shared Leony transition duration", () => {
  assert.equal(STORYOFUS_DEMO_LOADING_DURATION_MS, 2000);
});

test("StoryOfUs demo navigation transition schedules once and ignores duplicate activation", async () => {
  const scheduled: Array<{ callback: () => void; durationMs: number }> = [];
  const loadingStates: boolean[] = [];
  let navigateCalls = 0;
  const controller = createStoryOfUsDemoTransitionController({
    setTimer: (callback, durationMs) => {
      scheduled.push({ callback, durationMs });
      return scheduled.length;
    },
    clearTimer: () => {},
    onLoadingChange: (isLoading) => loadingStates.push(isLoading),
    onNavigate: () => {
      navigateCalls += 1;
    },
  });

  assert.equal(controller.start(), true);
  assert.equal(controller.start(), false);
  assert.equal(controller.isActive(), true);
  assert.equal(scheduled.length, 1);
  assert.equal(scheduled[0].durationMs, STORYOFUS_DEMO_LOADING_DURATION_MS);
  assert.deepEqual(loadingStates, [true]);

  scheduled[0].callback();

  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(navigateCalls, 1);
  assert.equal(controller.isActive(), false);
  assert.deepEqual(loadingStates, [true, false]);

  assert.equal(controller.start(), true);
  assert.equal(scheduled.length, 2);
});

test("StoryOfUs demo navigation cancellation clears the timer and prevents navigation", async () => {
  const scheduled: Array<{ callback: () => void; durationMs: number }> = [];
  const clearedTimers: number[] = [];
  const loadingStates: boolean[] = [];
  let navigateCalls = 0;
  const controller = createStoryOfUsDemoTransitionController({
    setTimer: (callback, durationMs) => {
      scheduled.push({ callback, durationMs });
      return scheduled.length;
    },
    clearTimer: (timer) => {
      clearedTimers.push(timer);
    },
    onLoadingChange: (isLoading) => loadingStates.push(isLoading),
    onNavigate: () => {
      navigateCalls += 1;
    },
  });

  assert.equal(controller.start(), true);
  controller.cancel();

  assert.deepEqual(clearedTimers, [1]);
  assert.equal(controller.isActive(), false);

  scheduled[0].callback();

  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(navigateCalls, 0);
  assert.deepEqual(loadingStates, [true]);
  assert.equal(controller.start(), false);

  controller.mount();

  assert.equal(controller.start(), true);
  assert.equal(scheduled.length, 2);
  assert.equal(scheduled[1].durationMs, STORYOFUS_DEMO_LOADING_DURATION_MS);
});

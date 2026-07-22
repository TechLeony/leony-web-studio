import assert from "node:assert/strict";
import test from "node:test";

import {
  createStoryOfUsSingleUseAsyncGuard,
  getStoryOfUsFocusTrapTargetIndex,
  getStoryOfUsFinalSubmitUiState,
  isStoryOfUsEditSubmitDialogConfirmDisabled,
  shouldCloseStoryOfUsEditSubmitDialogOnEscape,
} from "./setupSubmitUiState.ts";

test("StoryOfUs edit submit guard accepts only one active attempt", () => {
  const guard = createStoryOfUsSingleUseAsyncGuard();
  let submitCalls = 0;

  if (guard.tryStart()) {
    submitCalls += 1;
  }

  if (guard.tryStart()) {
    submitCalls += 1;
  }

  assert.equal(submitCalls, 1);
  assert.equal(guard.isLocked(), true);

  guard.release();

  assert.equal(guard.tryStart(), true);
});

test("StoryOfUs edit confirmation button is disabled while submitting", () => {
  assert.equal(
    isStoryOfUsEditSubmitDialogConfirmDisabled({
      isSubmitting: true,
      isGuardLocked: false,
    }),
    true,
  );
  assert.equal(
    isStoryOfUsEditSubmitDialogConfirmDisabled({
      isSubmitting: false,
      isGuardLocked: true,
    }),
    true,
  );
  assert.equal(
    isStoryOfUsEditSubmitDialogConfirmDisabled({
      isSubmitting: false,
      isGuardLocked: false,
    }),
    false,
  );
});

test("StoryOfUs final submit is disabled during active media upload", () => {
  const state = getStoryOfUsFinalSubmitUiState({
    isSubmitting: false,
    isConfirmingEditSubmit: false,
    mediaBlocker: "Dosya yüklemeleri devam ediyor.",
    validationBlocker: null,
    isSubmittedEdit: false,
    isSubmittedEditOpen: false,
  });

  assert.equal(state.disabled, true);
  assert.equal(state.reason, "Dosya yüklemeleri devam ediyor.");
});

test("StoryOfUs final submit is disabled when local-only media remains", () => {
  const state = getStoryOfUsFinalSubmitUiState({
    isSubmitting: false,
    isConfirmingEditSubmit: false,
    mediaBlocker: "Bazı dosyalarınız henüz yüklenmemiş görünüyor.",
    validationBlocker: null,
    isSubmittedEdit: false,
    isSubmittedEditOpen: false,
  });

  assert.equal(state.disabled, true);
  assert.equal(state.reason, "Bazı dosyalarınız henüz yüklenmemiş görünüyor.");
});

test("StoryOfUs final submit is disabled when validation is invalid", () => {
  const state = getStoryOfUsFinalSubmitUiState({
    isSubmitting: false,
    isConfirmingEditSubmit: false,
    mediaBlocker: null,
    validationBlocker: "Temel iletişim bilgilerini tamamlamanız gerekiyor.",
    isSubmittedEdit: false,
    isSubmittedEditOpen: false,
  });

  assert.equal(state.disabled, true);
  assert.equal(state.reason, "Temel iletişim bilgilerini tamamlamanız gerekiyor.");
});

test("StoryOfUs final submit is disabled when server truth says editing is closed", () => {
  const state = getStoryOfUsFinalSubmitUiState({
    isSubmitting: false,
    isConfirmingEditSubmit: false,
    mediaBlocker: null,
    validationBlocker: null,
    isSubmittedEdit: true,
    isSubmittedEditOpen: false,
  });

  assert.equal(state.disabled, true);
  assert.equal(state.reason, "Düzenleme süreniz veya hakkınız sona ermiş görünüyor.");
});

test("StoryOfUs final submit remains enabled when no blocker exists", () => {
  const state = getStoryOfUsFinalSubmitUiState({
    isSubmitting: false,
    isConfirmingEditSubmit: false,
    mediaBlocker: null,
    validationBlocker: null,
    isSubmittedEdit: false,
    isSubmittedEditOpen: false,
  });

  assert.equal(state.disabled, false);
  assert.equal(state.reason, null);
});

test("StoryOfUs edit confirmation Escape closes only when idle", () => {
  assert.equal(shouldCloseStoryOfUsEditSubmitDialogOnEscape(false), true);
  assert.equal(shouldCloseStoryOfUsEditSubmitDialogOnEscape(true), false);
});

test("StoryOfUs edit confirmation focus trap wraps keyboard focus", () => {
  assert.equal(
    getStoryOfUsFocusTrapTargetIndex({
      currentIndex: 1,
      focusableCount: 2,
      isShiftKey: false,
    }),
    0,
  );
  assert.equal(
    getStoryOfUsFocusTrapTargetIndex({
      currentIndex: 0,
      focusableCount: 2,
      isShiftKey: true,
    }),
    1,
  );
  assert.equal(
    getStoryOfUsFocusTrapTargetIndex({
      currentIndex: 0,
      focusableCount: 2,
      isShiftKey: false,
    }),
    -1,
  );
  assert.equal(
    getStoryOfUsFocusTrapTargetIndex({
      currentIndex: -1,
      focusableCount: 2,
      isShiftKey: false,
    }),
    0,
  );
});

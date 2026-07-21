export type StoryOfUsFinalSubmitUiStateInput = {
  isSubmitting: boolean;
  isConfirmingEditSubmit: boolean;
  mediaBlocker: string | null;
  validationBlocker: string | null;
  isSubmittedEdit: boolean;
  isSubmittedEditOpen: boolean;
};

export function getStoryOfUsFinalSubmitUiState(input: StoryOfUsFinalSubmitUiStateInput) {
  if (input.isSubmitting || input.isConfirmingEditSubmit) {
    return {
      disabled: true,
      reason: "Gönderim tamamlanıyor, lütfen bekleyin.",
    };
  }

  if (input.isSubmittedEdit && !input.isSubmittedEditOpen) {
    return {
      disabled: true,
      reason: "Düzenleme süreniz veya hakkınız sona ermiş görünüyor.",
    };
  }

  if (input.mediaBlocker) {
    return {
      disabled: true,
      reason: input.mediaBlocker,
    };
  }

  if (input.validationBlocker) {
    return {
      disabled: true,
      reason: input.validationBlocker,
    };
  }

  return {
    disabled: false,
    reason: null,
  };
}

export function createStoryOfUsSingleUseAsyncGuard() {
  let isLocked = false;

  return {
    isLocked() {
      return isLocked;
    },
    tryStart() {
      if (isLocked) {
        return false;
      }

      isLocked = true;
      return true;
    },
    release() {
      isLocked = false;
    },
  };
}

export function isStoryOfUsEditSubmitDialogConfirmDisabled({
  isSubmitting,
  isGuardLocked,
}: {
  isSubmitting: boolean;
  isGuardLocked: boolean;
}) {
  return isSubmitting || isGuardLocked;
}

export function shouldCloseStoryOfUsEditSubmitDialogOnEscape(isSubmitting: boolean) {
  return !isSubmitting;
}

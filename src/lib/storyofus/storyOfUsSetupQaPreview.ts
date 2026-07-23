import {
  getStoryOfUsEditSubmissionConfirmationCopy,
  getStoryOfUsEditUsageLabel,
  getStoryOfUsEditingClosedCopy,
  getStoryOfUsEditingStateDescription,
  getStoryOfUsSetupReviewSubmitCopy,
  getStoryOfUsSetupSuccessCopy,
  type StoryOfUsSetupEditStatusInput,
  type StoryOfUsSetupSubmissionKind,
} from "./setupSuccessCopy.ts";

export const STORYOFUS_SETUP_QA_PATH = "/storyofus/internal/setup-qa";

export type StoryOfUsSetupQaStateId =
  | "submitted_reentry_open_0"
  | "submitted_reentry_open_1"
  | "edit_limit_reached"
  | "deadline_expired_0"
  | "deadline_expired_1"
  | "admin_locked"
  | "first_submit_success"
  | "first_edit_success"
  | "second_edit_success"
  | "first_edit_confirmation"
  | "final_edit_confirmation"
  | "initial_submit_review"
  | "submitted_edit_review";

export type StoryOfUsSetupQaState =
  | {
      id: StoryOfUsSetupQaStateId;
      name: string;
      purpose: string;
      kind: "reentry" | "closed";
      editStatus: StoryOfUsSetupEditStatusInput;
      title: string;
      body: string;
      usageLabel: string;
      description: string;
    }
  | {
      id: StoryOfUsSetupQaStateId;
      name: string;
      purpose: string;
      kind: "success";
      submissionKind: StoryOfUsSetupSubmissionKind;
      editStatus: StoryOfUsSetupEditStatusInput;
      title: string;
      body: string;
      usageLabel: string;
    }
  | {
      id: StoryOfUsSetupQaStateId;
      name: string;
      purpose: string;
      kind: "dialog";
      editStatus: StoryOfUsSetupEditStatusInput;
      title: string;
      body: string;
      confirmLabel: string;
      usageLabel: string;
    }
  | {
      id: StoryOfUsSetupQaStateId;
      name: string;
      purpose: string;
      kind: "review";
      isSubmittedEdit: boolean;
      body: string;
    };

type StoryOfUsQaEnvironment = {
  VERCEL_ENV?: string;
  NODE_ENV?: string;
};

const MOCK_EDITABLE_UNTIL = "2026-07-23T08:25:00.000Z";
const MOCK_REFUND_UNTIL = "2026-07-23T08:25:00.000Z";
const MOCK_EXPIRED_UNTIL = "2026-07-23T04:25:00.000Z";

export function isStoryOfUsSetupQaAllowed(env: StoryOfUsQaEnvironment | null = getRuntimeEnv()) {
  if (!env) {
    return false;
  }

  const vercelEnv = env.VERCEL_ENV?.trim().toLowerCase();

  if (vercelEnv === "production") {
    return false;
  }

  if (vercelEnv === "preview" || vercelEnv === "development") {
    return true;
  }

  return env.NODE_ENV !== "production";
}

export function getStoryOfUsSetupQaStates(): StoryOfUsSetupQaState[] {
  return [
    createReentryState({
      id: "submitted_reentry_open_0",
      name: "Submitted re-entry, editing open, 0/2",
      purpose: "Submitted customer returning before using any edit rights.",
      editStatus: createOpenEditStatus(0),
    }),
    createReentryState({
      id: "submitted_reentry_open_1",
      name: "Submitted re-entry, editing open, 1/2",
      purpose: "Submitted customer returning after one successful edit.",
      editStatus: createOpenEditStatus(1),
    }),
    createClosedState({
      id: "edit_limit_reached",
      name: "Edit limit reached, 2/2",
      purpose: "Customer used both successful edits and editing is closed.",
      editStatus: {
        status: "in_review",
        editsUsed: 2,
        editLimit: 2,
        editableUntil: MOCK_EDITABLE_UNTIL,
        refundRequestUntil: MOCK_REFUND_UNTIL,
        editingClosedAt: "2026-07-23T06:25:00.000Z",
        editingClosedReason: "edit_limit_reached",
      },
    }),
    createClosedState({
      id: "deadline_expired_0",
      name: "Deadline expired with 0/2 used",
      purpose: "The three-hour editing window expired without any successful edits.",
      editStatus: createExpiredEditStatus(0),
    }),
    createClosedState({
      id: "deadline_expired_1",
      name: "Deadline expired with 1/2 used",
      purpose: "The three-hour editing window expired after one successful edit.",
      editStatus: createExpiredEditStatus(1),
    }),
    createClosedState({
      id: "admin_locked",
      name: "Admin-locked neutral support state",
      purpose: "Support-safe locked copy without internal status wording.",
      editStatus: {
        status: "submitted",
        editsUsed: 0,
        editLimit: 2,
        editableUntil: MOCK_EDITABLE_UNTIL,
        refundRequestUntil: MOCK_REFUND_UNTIL,
        editingClosedAt: "2026-07-23T06:25:00.000Z",
        editingClosedReason: "admin_locked",
      },
    }),
    createSuccessState({
      id: "first_submit_success",
      name: "First-submit success",
      purpose: "The first successful setup submit response.",
      submissionKind: "first_submit",
      editStatus: createOpenEditStatus(0),
    }),
    createSuccessState({
      id: "first_edit_success",
      name: "First-edit success",
      purpose: "The first successful submitted-order edit response.",
      submissionKind: "edit_submit",
      editStatus: createOpenEditStatus(1),
    }),
    createSuccessState({
      id: "second_edit_success",
      name: "Second-edit success",
      purpose: "The final successful submitted-order edit response.",
      submissionKind: "edit_limit_reached",
      editStatus: {
        status: "in_review",
        editsUsed: 2,
        editLimit: 2,
        editableUntil: MOCK_EDITABLE_UNTIL,
        refundRequestUntil: MOCK_REFUND_UNTIL,
        editingClosedAt: "2026-07-23T06:25:00.000Z",
        editingClosedReason: "edit_limit_reached",
      },
    }),
    createDialogState({
      id: "first_edit_confirmation",
      name: "First-edit confirmation dialog",
      purpose: "Dialog wording before consuming the first edit right.",
      editStatus: createOpenEditStatus(0),
    }),
    createDialogState({
      id: "final_edit_confirmation",
      name: "Final-edit confirmation dialog",
      purpose: "Dialog wording before consuming the final edit right.",
      editStatus: createOpenEditStatus(1),
    }),
    {
      id: "initial_submit_review",
      name: "Initial-submit review copy",
      purpose: "Review copy before the first submit.",
      kind: "review",
      isSubmittedEdit: false,
      body: getStoryOfUsSetupReviewSubmitCopy(false),
    },
    {
      id: "submitted_edit_review",
      name: "Submitted-edit review copy",
      purpose: "Review copy before saving an edit.",
      kind: "review",
      isSubmittedEdit: true,
      body: getStoryOfUsSetupReviewSubmitCopy(true),
    },
  ];
}

function createOpenEditStatus(editsUsed: number): StoryOfUsSetupEditStatusInput {
  return {
    status: "submitted",
    editsUsed,
    editLimit: 2,
    editableUntil: MOCK_EDITABLE_UNTIL,
    refundRequestUntil: MOCK_REFUND_UNTIL,
    editingClosedAt: null,
    editingClosedReason: null,
  };
}

function createExpiredEditStatus(editsUsed: number): StoryOfUsSetupEditStatusInput {
  return {
    status: "in_review",
    editsUsed,
    editLimit: 2,
    editableUntil: MOCK_EXPIRED_UNTIL,
    refundRequestUntil: MOCK_REFUND_UNTIL,
    editingClosedAt: "2026-07-23T08:25:00.000Z",
    editingClosedReason: "deadline_expired",
  };
}

function createReentryState({
  id,
  name,
  purpose,
  editStatus,
}: {
  id: StoryOfUsSetupQaStateId;
  name: string;
  purpose: string;
  editStatus: StoryOfUsSetupEditStatusInput;
}): StoryOfUsSetupQaState {
  return {
    id,
    name,
    purpose,
    kind: "reentry",
    editStatus,
    title: "Bilgilerinizi aldık 💌",
    body: "Kurulum formunuz başarıyla gönderildi. Bilgilerinizi ilk gönderiminizden sonraki 3 saat içinde en fazla 2 kez düzenleyebilirsiniz.",
    usageLabel: getStoryOfUsEditUsageLabel(editStatus.editsUsed, editStatus.editLimit),
    description: getStoryOfUsEditingStateDescription(editStatus),
  };
}

function createClosedState({
  id,
  name,
  purpose,
  editStatus,
}: {
  id: StoryOfUsSetupQaStateId;
  name: string;
  purpose: string;
  editStatus: StoryOfUsSetupEditStatusInput;
}): StoryOfUsSetupQaState {
  const copy = getStoryOfUsEditingClosedCopy(editStatus);

  return {
    id,
    name,
    purpose,
    kind: "closed",
    editStatus,
    title: copy.title,
    body: copy.body,
    usageLabel: getStoryOfUsEditUsageLabel(editStatus.editsUsed, editStatus.editLimit),
    description: getStoryOfUsEditingStateDescription(editStatus),
  };
}

function createSuccessState({
  id,
  name,
  purpose,
  submissionKind,
  editStatus,
}: {
  id: StoryOfUsSetupQaStateId;
  name: string;
  purpose: string;
  submissionKind: StoryOfUsSetupSubmissionKind;
  editStatus: StoryOfUsSetupEditStatusInput;
}): StoryOfUsSetupQaState {
  const copy = getStoryOfUsSetupSuccessCopy(submissionKind, editStatus);

  return {
    id,
    name,
    purpose,
    kind: "success",
    submissionKind,
    editStatus,
    title: copy.title,
    body: copy.body,
    usageLabel: getStoryOfUsEditUsageLabel(editStatus.editsUsed, editStatus.editLimit),
  };
}

function createDialogState({
  id,
  name,
  purpose,
  editStatus,
}: {
  id: StoryOfUsSetupQaStateId;
  name: string;
  purpose: string;
  editStatus: StoryOfUsSetupEditStatusInput;
}): StoryOfUsSetupQaState {
  const copy = getStoryOfUsEditSubmissionConfirmationCopy(editStatus);

  return {
    id,
    name,
    purpose,
    kind: "dialog",
    editStatus,
    title: copy.title,
    body: copy.body,
    confirmLabel: copy.confirmLabel,
    usageLabel: getStoryOfUsEditUsageLabel(editStatus.editsUsed, editStatus.editLimit),
  };
}

function getRuntimeEnv(): StoryOfUsQaEnvironment | null {
  if (typeof process === "undefined") {
    return null;
  }

  return {
    VERCEL_ENV: process.env.VERCEL_ENV,
    NODE_ENV: process.env.NODE_ENV,
  };
}

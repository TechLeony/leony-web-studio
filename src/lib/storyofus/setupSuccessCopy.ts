export type StoryOfUsSetupSubmissionKind = "first_submit" | "edit_submit" | "edit_limit_reached";

export type StoryOfUsSetupEditStatusInput = {
  editsUsed?: number | null;
  editLimit?: number | null;
  editableUntil?: string | null;
  refundRequestUntil?: string | null;
  editingClosedAt?: string | null;
  editingClosedReason?: string | null;
  status?: string | null;
};

export function getStoryOfUsSetupSuccessCopy(
  submissionKind: StoryOfUsSetupSubmissionKind,
  editStatus: StoryOfUsSetupEditStatusInput = {},
) {
  const editsUsed = normalizeEditCount(editStatus.editsUsed);
  const editLimit = normalizeEditLimit(editStatus.editLimit);

  if (submissionKind === "edit_limit_reached" || editsUsed >= editLimit) {
    return {
      title: "Son düzenlemeniz kaydedildi 💌",
      body: "StoryOfUs’unuzu hazırlamaya başladık. Hazır olduğunda size e-posta göndereceğiz.",
    };
  }

  if (submissionKind === "edit_submit") {
    return {
      title: "Düzenlemeleriniz kaydedildi",
      body: `Bir düzenleme hakkınız kaldı. Şu an kullandığınız düzenleme hakkı: ${getStoryOfUsEditUsageLabel(editsUsed, editLimit)}`,
    };
  }

  return {
    title: "Bilgilerinizi aldık 💌",
    body: "Önümüzdeki 3 saat içinde en fazla 2 kez düzenleme yapabilirsiniz.",
  };
}

export function getStoryOfUsEditUsageLabel(editsUsed?: number | null, editLimit?: number | null) {
  return `${normalizeEditCount(editsUsed)}/${normalizeEditLimit(editLimit)}`;
}

export function getStoryOfUsRemainingEditCount(
  editsUsed?: number | null,
  editLimit?: number | null,
) {
  return Math.max(normalizeEditLimit(editLimit) - normalizeEditCount(editsUsed), 0);
}

export function getStoryOfUsEditSubmissionConfirmationCopy(
  editStatus: StoryOfUsSetupEditStatusInput,
) {
  const editsUsed = normalizeEditCount(editStatus.editsUsed);
  const editLimit = normalizeEditLimit(editStatus.editLimit);
  const nextEditsUsed = Math.min(editsUsed + 1, editLimit);

  if (nextEditsUsed >= editLimit) {
    return {
      title: "Son düzenlemenizi göndermek istiyor musunuz?",
      body: `Bu işlemden sonra düzenleme hakkınız ${nextEditsUsed}/${editLimit} olacak ve StoryOfUs’unuzu hazırlamaya başlayacağız. Bu işlem düzenleme süresini kapatır.`,
      confirmLabel: "Son düzenlemeyi gönder",
    };
  }

  return {
    title: "Düzenlemeleri göndermek istiyor musunuz?",
    body: `Bu işlemden sonra düzenleme hakkınız ${nextEditsUsed}/${editLimit} olacak.`,
    confirmLabel: "Düzenlemeleri kaydet",
  };
}

export function getStoryOfUsSetupReviewSubmitCopy(isSubmittedEdit: boolean) {
  if (isSubmittedEdit) {
    return "Fotoğraf ve ses dosyalarınız seçtiğiniz anda güvenli şekilde yüklenir. Otomatik kaydetme ve dosya yükleme düzenleme hakkınızı kullanmaz; yalnızca bu adımı başarıyla gönderdiğinizde bir düzenleme hakkınız kullanılır.";
  }

  return "Fotoğraf ve ses dosyalarınız seçtiğiniz anda güvenli şekilde yüklenir. Otomatik kaydetme ve dosya yükleme, ilk gönderimden sonra başlayacak düzenleme haklarınızı kullanmaz.";
}

export function getStoryOfUsEditSubmitNotice(editStatus: StoryOfUsSetupEditStatusInput) {
  const editsUsed = normalizeEditCount(editStatus.editsUsed);
  const editLimit = normalizeEditLimit(editStatus.editLimit);
  const nextEditsUsed = Math.min(editsUsed + 1, editLimit);

  if (nextEditsUsed >= editLimit) {
    return "Bu son düzenleme hakkınız. Gönderdiğinizde StoryOfUs’unuzu hazırlamaya başlayacağız.";
  }

  return `Bu düzenlemeyi gönderirseniz ${nextEditsUsed}/${editLimit} hakkınızı kullanmış olacaksınız.`;
}

export function getStoryOfUsEditingClosedCopy(editStatus: StoryOfUsSetupEditStatusInput) {
  const editsUsed = normalizeEditCount(editStatus.editsUsed);
  const editLimit = normalizeEditLimit(editStatus.editLimit);
  const reason = editStatus.editingClosedReason;
  const isLimitReached = reason === "edit_limit_reached" || editsUsed >= editLimit;
  const isAdminLocked = reason === "admin_locked";

  if (isAdminLocked) {
    return {
      title: "Düzenleme şu anda kullanılamıyor",
      body: "Bu sipariş için düzenleme şu anda kullanılamıyor. Yardım için contact@leony.tech adresinden bize ulaşabilirsiniz.",
    };
  }

  if (isLimitReached) {
    return {
      title: "Düzenleme hakkınız tamamlandı",
      body: "StoryOfUs’unuzu hazırlamaya başladık. Hazır olduğunda size e-posta göndereceğiz.",
    };
  }

  return {
    title: "Düzenleme süreniz sona erdi",
    body: "3 saatlik düzenleme süresi tamamlandığı için artık değişiklik yapamazsınız.",
  };
}

export function isStoryOfUsEditingOpen(
  editStatus: StoryOfUsSetupEditStatusInput,
  now = Date.now(),
) {
  const editableUntilTime = editStatus.editableUntil
    ? new Date(editStatus.editableUntil).getTime()
    : Number.NaN;

  return (
    editStatus.status === "submitted" &&
    Number.isFinite(editableUntilTime) &&
    editableUntilTime > now &&
    normalizeEditCount(editStatus.editsUsed) < normalizeEditLimit(editStatus.editLimit) &&
    !editStatus.editingClosedAt
  );
}

export function getStoryOfUsEditingStateLabel(
  editStatus: StoryOfUsSetupEditStatusInput,
  now = Date.now(),
) {
  if (editStatus.status === "draft") {
    return "Düzenleme süresi henüz başlamadı";
  }

  if (isStoryOfUsEditingOpen(editStatus, now)) {
    return "Düzenleme süresi açık";
  }

  if (
    editStatus.editingClosedReason === "edit_limit_reached" ||
    normalizeEditCount(editStatus.editsUsed) >= normalizeEditLimit(editStatus.editLimit)
  ) {
    return "Düzenleme hakkı tamamlandı";
  }

  if (editStatus.editingClosedReason === "admin_locked") {
    return "Düzenleme şu anda kullanılamıyor";
  }

  return "Düzenleme süresi kapalı";
}

export function getStoryOfUsEditingStateDescription(
  editStatus: StoryOfUsSetupEditStatusInput,
  now = Date.now(),
) {
  if (editStatus.status === "draft") {
    return "Bilgilerinizi ilk kez gönderdikten sonra 3 saatlik düzenleme süreniz başlayacak.";
  }

  if (isStoryOfUsEditingOpen(editStatus, now)) {
    return "Açmak, yenilemek, fotoğraf yüklemek veya otomatik taslak kaydı düzenleme hakkı kullanmaz. Yalnızca başarılı gönderimler sayılır.";
  }

  return getStoryOfUsEditingClosedCopy(editStatus).body;
}

export function shouldShowStoryOfUsEditDeadline(editStatus: StoryOfUsSetupEditStatusInput) {
  return editStatus.status !== "draft" && Boolean(editStatus.editableUntil);
}

function normalizeEditCount(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

function normalizeEditLimit(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.max(1, Math.trunc(value))
    : 2;
}

import test from "node:test";
import assert from "node:assert/strict";

import {
  getStoryOfUsEditSubmitNotice,
  getStoryOfUsEditSubmissionConfirmationCopy,
  getStoryOfUsEditUsageLabel,
  getStoryOfUsEditingClosedCopy,
  getStoryOfUsEditingStateDescription,
  getStoryOfUsEditingStateLabel,
  getStoryOfUsRemainingEditCount,
  getStoryOfUsSetupReviewSubmitCopy,
  getStoryOfUsSetupSuccessCopy,
  isStoryOfUsEditingOpen,
  shouldShowStoryOfUsEditDeadline,
} from "./setupSuccessCopy.ts";

const FUTURE = "2026-07-20T08:25:00.000Z";
const PAST = "2026-07-20T04:25:00.000Z";
const NOW = new Date("2026-07-20T05:25:00.000Z").getTime();

test("first-submit success displays 0/2 editing rights", () => {
  assert.deepEqual(getStoryOfUsSetupSuccessCopy("first_submit", { editsUsed: 0, editLimit: 2 }), {
    title: "Bilgilerinizi aldık 💌",
    body: "Önümüzdeki 3 saat içinde en fazla 2 kez düzenleme yapabilirsiniz.",
  });
  assert.equal(getStoryOfUsEditUsageLabel(0, 2), "0/2");
});

test("first-edit success displays 1/2 and one remaining edit", () => {
  assert.deepEqual(getStoryOfUsSetupSuccessCopy("edit_submit", { editsUsed: 1, editLimit: 2 }), {
    title: "Düzenlemeleriniz kaydedildi",
    body: "Bir düzenleme hakkınız kaldı. Şu an kullandığınız düzenleme hakkı: 1/2",
  });
  assert.equal(getStoryOfUsRemainingEditCount(1, 2), 1);
});

test("second-edit success displays 2/2 and preparation copy", () => {
  assert.deepEqual(
    getStoryOfUsSetupSuccessCopy("edit_limit_reached", { editsUsed: 2, editLimit: 2 }),
    {
      title: "Son düzenlemeniz kaydedildi 💌",
      body: "StoryOfUs’unuzu hazırlamaya başladık. Hazır olduğunda size e-posta göndereceğiz.",
    },
  );
  assert.equal(getStoryOfUsEditUsageLabel(2, 2), "2/2");
});

test("deadline expiry keeps actual edit count instead of forcing 2/2", () => {
  const editStatus = {
    status: "submitted",
    editsUsed: 1,
    editLimit: 2,
    editableUntil: PAST,
    editingClosedReason: "deadline_expired",
  };

  assert.equal(isStoryOfUsEditingOpen(editStatus, NOW), false);
  assert.equal(getStoryOfUsEditUsageLabel(editStatus.editsUsed, editStatus.editLimit), "1/2");
  assert.deepEqual(getStoryOfUsEditingClosedCopy(editStatus), {
    title: "Düzenleme süreniz sona erdi",
    body: "3 saatlik düzenleme süresi tamamlandığı için artık değişiklik yapamazsınız.",
  });
});

test("edit_limit_reached displays preparation message", () => {
  assert.deepEqual(
    getStoryOfUsEditingClosedCopy({
      status: "in_review",
      editsUsed: 2,
      editLimit: 2,
      editingClosedReason: "edit_limit_reached",
    }),
    {
      title: "Düzenleme hakkınız tamamlandı",
      body: "StoryOfUs’unuzu hazırlamaya başladık. Hazır olduğunda size e-posta göndereceğiz.",
    },
  );
});

test("admin_locked displays neutral support copy", () => {
  assert.deepEqual(
    getStoryOfUsEditingClosedCopy({
      status: "submitted",
      editsUsed: 0,
      editLimit: 2,
      editingClosedReason: "admin_locked",
    }),
    {
      title: "Düzenleme şu anda kullanılamıyor",
      body: "Bu sipariş için düzenleme şu anda kullanılamıyor. Yardım için contact@leony.tech adresinden bize ulaşabilirsiniz.",
    },
  );
});

test("edit confirmation describes 0/2 transition to 1/2", () => {
  assert.deepEqual(getStoryOfUsEditSubmissionConfirmationCopy({ editsUsed: 0, editLimit: 2 }), {
    title: "Düzenlemeleri göndermek istiyor musunuz?",
    body: "Bu işlemden sonra düzenleme hakkınız 1/2 olacak.",
    confirmLabel: "Düzenlemeleri kaydet",
  });
});

test("final edit confirmation describes preparation start", () => {
  assert.deepEqual(getStoryOfUsEditSubmissionConfirmationCopy({ editsUsed: 1, editLimit: 2 }), {
    title: "Son düzenlemenizi göndermek istiyor musunuz?",
    body: "Bu işlemden sonra düzenleme hakkınız 2/2 olacak ve StoryOfUs’unuzu hazırlamaya başlayacağız. Bu işlem düzenleme süresini kapatır.",
    confirmLabel: "Son düzenlemeyi gönder",
  });
});

test("opening wizard, autosave, and failed submit do not mutate displayed counter", () => {
  const editStatus = {
    status: "submitted",
    editsUsed: 0,
    editLimit: 2,
    editableUntil: FUTURE,
  };

  assert.equal(getStoryOfUsEditUsageLabel(editStatus.editsUsed, editStatus.editLimit), "0/2");
  assert.equal(
    getStoryOfUsEditSubmitNotice(editStatus),
    "Bu düzenlemeyi gönderirseniz 1/2 hakkınızı kullanmış olacaksınız.",
  );
  assert.equal(getStoryOfUsEditUsageLabel(editStatus.editsUsed, editStatus.editLimit), "0/2");
});

test("server closed state replaces editable state", () => {
  assert.equal(
    getStoryOfUsEditingStateLabel({
      status: "in_review",
      editsUsed: 2,
      editLimit: 2,
      editableUntil: FUTURE,
      editingClosedAt: "2026-07-20T05:25:00.000Z",
      editingClosedReason: "edit_limit_reached",
    }),
    "Düzenleme hakkı tamamlandı",
  );
});

test("draft tracking state says edit period has not started", () => {
  const editStatus = {
    status: "draft",
    editsUsed: 0,
    editLimit: 2,
    editableUntil: null,
  };

  assert.equal(getStoryOfUsEditingStateLabel(editStatus), "Düzenleme süresi henüz başlamadı");
  assert.equal(
    getStoryOfUsEditingStateDescription(editStatus),
    "Bilgilerinizi ilk kez gönderdikten sonra 3 saatlik düzenleme süreniz başlayacak.",
  );
});

test("draft tracking state does not expose a nonexistent edit deadline", () => {
  assert.equal(
    shouldShowStoryOfUsEditDeadline({
      status: "draft",
      editsUsed: 0,
      editLimit: 2,
      editableUntil: null,
    }),
    false,
  );
});

test("submitted tracking edit state remains unchanged", () => {
  const editStatus = {
    status: "submitted",
    editsUsed: 0,
    editLimit: 2,
    editableUntil: FUTURE,
  };

  assert.equal(getStoryOfUsEditingStateLabel(editStatus, NOW), "Düzenleme süresi açık");
  assert.equal(shouldShowStoryOfUsEditDeadline(editStatus), true);
});

test("initial setup review copy does not claim an edit right is consumed", () => {
  const copy = getStoryOfUsSetupReviewSubmitCopy(false);

  assert.match(copy, /seçtiğiniz anda güvenli şekilde yüklenir/);
  assert.match(copy, /ilk gönderimden sonra başlayacak düzenleme haklarınızı kullanmaz/);
  assert.doesNotMatch(copy, /başarıyla gönderdiğinizde bir düzenleme hakkınız kullanılır/);
});

test("submitted-edit review copy explains only successful final submission consumes an edit", () => {
  const copy = getStoryOfUsSetupReviewSubmitCopy(true);

  assert.match(copy, /Otomatik kaydetme ve dosya yükleme düzenleme hakkınızı kullanmaz/);
  assert.match(
    copy,
    /yalnızca bu adımı başarıyla gönderdiğinizde bir düzenleme hakkınız kullanılır/,
  );
});

import test from "node:test";
import assert from "node:assert/strict";

import { getStoryOfUsSetupSuccessCopy } from "./setupSuccessCopy.ts";

test("first-submit success copy is customer-friendly and distinct", () => {
  assert.deepEqual(getStoryOfUsSetupSuccessCopy("first_submit"), {
    title: "Bilgilerinizi aldık 💌",
    body: "StoryOfUs’unuzu hazırlamamız için gereken bilgiler bize ulaştı.",
  });
});

test("edit-submit success copy confirms saved changes", () => {
  assert.deepEqual(getStoryOfUsSetupSuccessCopy("edit_submit"), {
    title: "Düzenlemeniz alındı 💌",
    body: "Yaptığınız değişiklikler başarıyla kaydedildi. StoryOfUs’unuzu en güncel bilgilerinizle hazırlayacağız.",
  });
});

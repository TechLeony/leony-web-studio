export type StoryOfUsSetupSubmissionKind = "first_submit" | "edit_submit";

export function getStoryOfUsSetupSuccessCopy(submissionKind: StoryOfUsSetupSubmissionKind) {
  if (submissionKind === "edit_submit") {
    return {
      title: "Düzenlemeniz alındı 💌",
      body: "Yaptığınız değişiklikler başarıyla kaydedildi. StoryOfUs’unuzu en güncel bilgilerinizle hazırlayacağız.",
    };
  }

  return {
    title: "Bilgilerinizi aldık 💌",
    body: "StoryOfUs’unuzu hazırlamamız için gereken bilgiler bize ulaştı.",
  };
}

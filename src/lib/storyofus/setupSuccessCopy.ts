export type StoryOfUsSetupSubmissionKind = "first_submit" | "edit_submit" | "edit_limit_reached";

export function getStoryOfUsSetupSuccessCopy(submissionKind: StoryOfUsSetupSubmissionKind) {
  if (submissionKind === "edit_submit" || submissionKind === "edit_limit_reached") {
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

export type StoryOfUsSignatureNameInput = {
  customerName?: unknown;
  coupleDetailsCustomerName?: unknown;
  submissionSnapshot?: unknown;
  legacyCoupleDisplayName?: unknown;
  legacyPartnerName?: unknown;
  legacyRecipientNickname?: unknown;
};

export function resolveStoryOfUsSignatureName(input: StoryOfUsSignatureNameInput) {
  const snapshot = isRecord(input.submissionSnapshot) ? input.submissionSnapshot : null;
  const contactCouple = isRecord(snapshot?.contactCouple) ? snapshot.contactCouple : null;

  return firstNonEmptyText([
    input.customerName,
    input.coupleDetailsCustomerName,
    contactCouple?.customerName,
    snapshot?.customerName,
    getLegacyCoupleCustomerName({
      coupleDisplayName: input.legacyCoupleDisplayName,
      partnerName: input.legacyPartnerName,
      recipientNickname: input.legacyRecipientNickname,
    }),
  ]);
}

export function createStoryOfUsSignatureLine(prefix: string, signatureName: string) {
  const safePrefix = prefix.trim();
  const safeName = signatureName.trim();

  return safeName ? `${safePrefix},\n${safeName}` : safePrefix;
}

function firstNonEmptyText(values: unknown[]) {
  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }

    const trimmed = value.trim();

    if (trimmed) {
      return trimmed;
    }
  }

  return "";
}

function getLegacyCoupleCustomerName({
  coupleDisplayName,
  partnerName,
  recipientNickname,
}: {
  coupleDisplayName: unknown;
  partnerName: unknown;
  recipientNickname: unknown;
}) {
  if (typeof coupleDisplayName !== "string") {
    return "";
  }

  const names = coupleDisplayName
    .split("&")
    .map((part) => part.trim())
    .filter(Boolean);
  const recipientNames = new Set(
    [normalizeComparableName(partnerName), normalizeComparableName(recipientNickname)].filter(
      Boolean,
    ),
  );

  if (!recipientNames.size) {
    return "";
  }

  const customerCandidates = names.filter(
    (name) => !recipientNames.has(normalizeComparableName(name)),
  );

  return customerCandidates.length === 1 ? customerCandidates[0] : "";
}

function normalizeComparableName(value: unknown) {
  return typeof value === "string" ? value.trim().toLocaleLowerCase("tr") : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
